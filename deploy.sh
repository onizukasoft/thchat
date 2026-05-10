#!/bin/bash
# deploy.sh — รัน script นี้บน server ทุกครั้งที่ต้องการ deploy ใหม่
set -e

APP_DIR="/var/www/thchat"
echo "🚀 Deploy ThChat..."

# 1. Pull code ล่าสุด
cd $APP_DIR
git pull origin main

# 2. ติดตั้ง dependencies
npm install --production=false

# 3. Generate Prisma client
npx prisma generate

# 4. Migrate DB (ถ้ามี schema ใหม่)
npx prisma migrate deploy

# 5. Build
npm run build

# 6. Restart app ด้วย PM2
pm2 restart thchat || pm2 start "npm run start" --name thchat

echo "✅ Deploy สำเร็จ!"
pm2 status thchat
