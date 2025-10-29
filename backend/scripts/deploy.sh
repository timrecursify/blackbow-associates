#!/bin/bash
set -e

echo "🚀 Deploying BlackBow API..."

# Navigate to backend directory
cd "$(dirname "$0")/.."

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Run database migrations (when database is ready)
# echo "🗄️  Running database migrations..."
# npx prisma migrate deploy

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Restart PM2 service (zero downtime)
echo "♻️  Restarting service..."
pm2 reload blackbow-api || pm2 start ecosystem.config.js

# Check service status
sleep 2
pm2 status blackbow-api

# Test health endpoint
echo "🏥 Checking health..."
curl -f http://localhost:3450/health || {
  echo "❌ Health check failed!"
  exit 1
}

echo "✅ Deployment complete!"

# Send Telegram notification (if service is running)
curl -X POST "http://localhost:3400/notify" \
  -H "Content-Type: application/json" \
  -d '{"message":"✅ BlackBow API deployed successfully","level":"success","service":"blackbow-api"}' \
  2>/dev/null || true
