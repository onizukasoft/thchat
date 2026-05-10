#!/bin/bash
# deploy.sh — build local แล้วส่งไฟล์ขึ้น server
# วิธีใช้: bash deploy.sh root@IP_SERVER
set -e

SERVER=${1:?"ใส่ server เช่น: bash deploy.sh root@1.2.3.4"}
REMOTE_DIR="/var/www/admin-panel"

echo "📦 Building..."
npm run build

echo "🚀 Uploading to $SERVER..."
rsync -avz --progress \
  --exclude='.git' \
  --exclude='src/' \
  --exclude='node_modules/' \
  --exclude='.env' \
  --exclude='*.db' \
  --exclude='cache/' \
  .next/ "$SERVER:$REMOTE_DIR/.next/"

# Sync Turbopack's hash-versioned symlinks (needed for external module resolution)
rsync -avz --progress \
  .next/node_modules/ "$SERVER:$REMOTE_DIR/.next/node_modules/"

rsync -avz --progress \
  public/ "$SERVER:$REMOTE_DIR/public/"

rsync -avz \
  package.json \
  package-lock.json \
  tsconfig.json \
  prisma.config.ts \
  "$SERVER:$REMOTE_DIR/"

rsync -avz \
  prisma/schema.prisma \
  "$SERVER:$REMOTE_DIR/prisma/"

echo "🔄 Restarting server..."
ssh "$SERVER" "cd $REMOTE_DIR && npm install --omit=dev && npx prisma generate && (pm2 delete admin-panel 2>/dev/null || true) && pm2 start 'npm run start' --name admin-panel --cwd $REMOTE_DIR && pm2 save"

echo "✅ Deploy admin-panel สำเร็จ!"
ssh "$SERVER" "pm2 status admin-panel"
