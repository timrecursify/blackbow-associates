#!/bin/bash
set -e

echo "Deploying BlackBow API..."

# Navigate to backend directory
cd "$(dirname "$0")/.."
DEPLOY_DIR="$(pwd)"

# Backup for rollback
BACKUP_DIR="/tmp/blackbow-deploy-backup-$$"
mkdir -p "$BACKUP_DIR"
cp package-lock.json "$BACKUP_DIR/" 2>/dev/null || true
if [[ -d node_modules ]]; then
  cp -al node_modules "$BACKUP_DIR/node_modules" 2>/dev/null || true
fi
echo "Backup saved to $BACKUP_DIR"

rollback() {
  echo "Rolling back..."
  cd "$DEPLOY_DIR"
  if [[ -f "$BACKUP_DIR/package-lock.json" ]]; then
    cp "$BACKUP_DIR/package-lock.json" package-lock.json
  fi
  if [[ -d "$BACKUP_DIR/node_modules" ]]; then
    rm -rf node_modules
    mv "$BACKUP_DIR/node_modules" node_modules
  fi
  pm2 reload blackbow-api || true
  echo "Rollback complete"
  curl -s -X POST "http://localhost:3400/notify" \
    -H "Content-Type: application/json" \
    -d '{"source":"blackbow","message":"BlackBow API deploy ROLLED BACK","level":"error","service":"blackbow-api"}' \
    2>/dev/null || true
  exit 1
}

# Install dependencies
echo "Installing dependencies..."
npm install --production || { echo "npm install failed!"; rollback; }

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate || { echo "Prisma generate failed!"; rollback; }

# Reload PM2 service (zero downtime)
echo "Reloading service..."
pm2 reload blackbow-api || pm2 start ecosystem.config.cjs || { echo "PM2 start failed!"; rollback; }

# Health check with retries
echo "Checking health..."
sleep 2
for i in 1 2 3; do
  if curl -sf http://localhost:3450/health > /dev/null 2>&1; then
    echo "Health check passed"
    break
  fi
  if [[ $i -eq 3 ]]; then
    echo "Health check failed after 3 attempts!"
    rollback
  fi
  sleep 2
done

# Cleanup backup
rm -rf "$BACKUP_DIR"

echo "Deployment complete!"

# Send Telegram notification
curl -s -X POST "http://localhost:3400/notify" \
  -H "Content-Type: application/json" \
  -d '{"source":"blackbow","message":"BlackBow API deployed successfully","level":"info","service":"blackbow-api"}' \
  2>/dev/null || true
