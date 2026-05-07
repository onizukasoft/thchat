#!/bin/bash
# ============================================================
# ThChat — Deploy / Update Script
# รันทุกครั้งที่ต้องการ deploy โค้ดใหม่
# ใช้: bash scripts/deploy.sh
# ============================================================
set -e

APP_DIR="/home/thchat/app"
cd "$APP_DIR"

echo "🚀 Deploying ThChat..."

# ── Pull latest code ──────────────────────────────────────────
if [ -d ".git" ]; then
  git pull origin main
  echo "✅ Code updated from git"
fi

# ── Install dependencies ──────────────────────────────────────
npm ci --production=false
echo "✅ Dependencies installed"

# ── Swap Prisma schema: sqlite → postgresql ──────────────────
# (schema.prisma มี "sqlite" สำหรับ dev, เปลี่ยนเป็น postgresql ตอน deploy)
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
# เพิ่ม url ถ้ายังไม่มี
if ! grep -q 'url.*DATABASE_URL' prisma/schema.prisma; then
  sed -i '/provider = "postgresql"/a\  url      = env("DATABASE_URL")' prisma/schema.prisma
fi
echo "✅ Schema switched to PostgreSQL"

# ── Generate Prisma client ───────────────────────────────────
npx prisma generate
echo "✅ Prisma client generated"

# ── Run database migrations ──────────────────────────────────
npx prisma migrate deploy
echo "✅ Database migrated"

# ── Build Next.js ─────────────────────────────────────────────
NODE_ENV=production npm run build
echo "✅ Next.js built"

# ── Restart / Start PM2 ──────────────────────────────────────
if pm2 list | grep -q "thchat"; then
  pm2 reload ecosystem.config.js --update-env
  echo "✅ PM2 reloaded"
else
  pm2 start ecosystem.config.js --env production
  pm2 save
  echo "✅ PM2 started"
fi

echo ""
echo "════════════════════════════════════════════"
echo "✅ Deploy complete! ThChat is live."
echo "   pm2 logs thchat   — ดู logs"
echo "   pm2 status        — ดูสถานะ"
echo "════════════════════════════════════════════"
