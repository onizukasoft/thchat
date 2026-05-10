#!/bin/bash
# deploy-files.sh — build local แล้วส่งเฉพาะไฟล์ที่ต้องการขึ้น server
# วิธีใช้: bash deploy-files.sh root@IP_SERVER
set -e

SERVER=${1:?"ใส่ server เช่น: bash deploy-files.sh root@1.2.3.4"}
REMOTE_DIR="/var/www/thchat"

echo "📦 Building..."
npm run build

echo "🚀 Uploading to $SERVER..."
rsync -avz --progress \
  --exclude='.git' \
  --exclude='src/' \
  --exclude='node_modules/' \
  --exclude='.env' \
  --exclude='*.db' \
  --exclude='dev.db' \
  --exclude='cache/' \
  .next/ "$SERVER:$REMOTE_DIR/.next/"

# Sync Turbopack's hash-versioned symlinks (needed for external module resolution)
rsync -avz --progress \
  .next/node_modules/ "$SERVER:$REMOTE_DIR/.next/node_modules/"

rsync -avz --progress \
  public/ "$SERVER:$REMOTE_DIR/public/"

rsync -avz --progress \
  prisma/schema.prisma \
  "$SERVER:$REMOTE_DIR/prisma/"

rsync -avz --progress \
  prisma/migrations/ \
  "$SERVER:$REMOTE_DIR/prisma/migrations/"

rsync -avz \
  server.ts \
  package.json \
  package-lock.json \
  tsconfig.json \
  prisma.config.ts \
  "$SERVER:$REMOTE_DIR/"

rsync -avz --progress \
  src/lib/ "$SERVER:$REMOTE_DIR/src/lib/"

echo "🔄 Restarting server..."
ssh "$SERVER" "cd $REMOTE_DIR && npm install --omit=dev && npx prisma generate && npx prisma migrate deploy && (pm2 delete thchat 2>/dev/null || true) && pm2 start 'npm run start' --name thchat --cwd $REMOTE_DIR"

echo "✅ Deploy สำเร็จ!"
ssh "$SERVER" "pm2 status thchat"
