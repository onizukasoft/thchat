#!/bin/bash
# ============================================================
# ThChat — Server Setup Script
# รันครั้งเดียวบน Ubuntu 22.04 VPS ใหม่
# ใช้: sudo bash setup-server.sh
# ============================================================
set -e

APP_USER="thchat"
APP_DIR="/home/$APP_USER/app"
DOMAIN="thchat.com"   # ← เปลี่ยนเป็นโดเมนของคุณ

echo "🚀 Starting ThChat server setup..."

# ── 1. Update system ─────────────────────────────────────────
apt-get update && apt-get upgrade -y
apt-get install -y curl git ufw fail2ban

# ── 2. Firewall ───────────────────────────────────────────────
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
echo "✅ Firewall configured"

# ── 3. Node.js 20 ─────────────────────────────────────────────
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pm2
echo "✅ Node.js $(node -v) installed"

# ── 4. PostgreSQL 16 ──────────────────────────────────────────
apt-get install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql

# สร้าง database และ user
DB_PASS=$(openssl rand -base64 24 | tr -d '/+=')
sudo -u postgres psql <<SQL
CREATE USER thchat_user WITH PASSWORD '$DB_PASS';
CREATE DATABASE thchat_db OWNER thchat_user;
GRANT ALL PRIVILEGES ON DATABASE thchat_db TO thchat_user;
SQL

echo "✅ PostgreSQL configured"
echo "   DATABASE_URL=\"postgresql://thchat_user:$DB_PASS@localhost:5432/thchat_db\""
echo "   ⚠️  บันทึก DATABASE_URL นี้ไว้ก่อนปิด terminal!"

# ── 5. Nginx ──────────────────────────────────────────────────
apt-get install -y nginx
systemctl enable nginx
echo "✅ Nginx installed"

# ── 6. Certbot (SSL) ──────────────────────────────────────────
apt-get install -y certbot python3-certbot-nginx
echo "✅ Certbot installed"

# ── 7. App user ───────────────────────────────────────────────
if ! id "$APP_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$APP_USER"
fi
mkdir -p "$APP_DIR"
chown -R "$APP_USER:$APP_USER" "/home/$APP_USER"
echo "✅ App user '$APP_USER' created"

# ── 8. PM2 startup ───────────────────────────────────────────
pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER"
echo "✅ PM2 startup configured"

echo ""
echo "════════════════════════════════════════════"
echo "✅ Server setup complete!"
echo ""
echo "ขั้นตอนต่อไป:"
echo "  1. บันทึก DATABASE_URL ข้างบน"
echo "  2. อัพโหลดโค้ดไป $APP_DIR"
echo "  3. รัน: sudo bash scripts/deploy.sh"
echo "  4. รัน: sudo certbot --nginx -d $DOMAIN"
echo "════════════════════════════════════════════"
