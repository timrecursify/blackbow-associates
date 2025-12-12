# BlackBow Associates - Backend API

Wedding lead marketplace backend service for BlackBow Associates.

**Version:** 2.0.0
**Last Updated:** December 12, 2025
**Status:** 🟢 Production

**Recent Fixes:**
- **2025-12-12: MIGRATION COMPLETE - Supabase → Native PostgreSQL + Custom Auth** - Eliminated all 11 Supabase Docker containers, migrated to native PostgreSQL (port 5432), implemented custom JWT authentication with direct Google OAuth integration
- **2025-11-24: Database Backup Script Fixed** - Added PostgreSQL client installation check to backup script (`scripts/backup.sh`), prevents backup failures when `pg_dump` is missing

**Note:** For full changelog, see [docs/status.md](../../docs/status.md)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Service](#running-the-service)
- [Automated Services](#automated-services)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

BlackBow Associates is a wedding lead marketplace connecting photographers with high-quality wedding leads. The backend provides:

- **RESTful API** for lead marketplace operations
- **Custom JWT Authentication** - Email/password with secure JWT tokens
- **Google OAuth Integration** - Direct Google OAuth 2.0 using googleapis SDK
- **Stripe Payment Integration** for lead purchases and deposits
- **Pipedrive Integration** with automated sync scheduler
- **Lead Feedback System** with $2 rewards
- **Favorites System** for starred leads
- **Billing Address Collection** for payment processing

---

## 🛠️ Tech Stack

- **Runtime:** Node.js v22.18.0
- **Framework:** Express.js
- **Database:** PostgreSQL 15 (native, port 5432)
- **ORM:** Prisma
- **Authentication:** JWT (jsonwebtoken) + Google OAuth 2.0 (googleapis SDK)
- **Payments:** Stripe SDK
- **CRM Integration:** Pipedrive API
- **Scheduler:** node-cron
- **Logging:** Winston (JSON structured logs)
- **Process Manager:** PM2
- **Reverse Proxy:** Cloudflare Tunnel

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Tunnel                         │
│            api.blackbowassociates.com (HTTPS)                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express.js API                            │
│              localhost:3450 (PM2: blackbow-api)              │
├──────────────────────────────────────────────────────────────┤
│  Controllers  │  Services  │  Middleware  │  Routes          │
│  - Auth       │  - Lead    │  - Auth      │  - /api/auth    │
│  - Lead       │  - User    │  - Validate  │  - /api/leads   │
│  - User       │  - Payment │  - Error     │  - /api/users   │
│  - Payment    │  - Stripe  │  - Logging   │  - /api/payment │
│  - Pipedrive  │  - OAuth   │              │  - /api/pipedrive│
└───────┬──────────────┬──────────────┬──────────────┬─────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  PostgreSQL  │ │   Google     │ │   Stripe     │ │  Pipedrive   │
│   Database   │ │   OAuth 2.0  │ │     API      │ │     API      │
│ localhost:   │ │   (HTTPS)    │ │   (HTTPS)    │ │   (HTTPS)    │
│   5432       │ │              │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

**Scheduled Jobs:**
- **Pipedrive Sync**: 8am, 11am, 2pm, 5pm EST (node-cron)

For detailed architecture, see [docs/architecture.md](docs/architecture.md).

---

## 📦 Prerequisites

- **Node.js:** v22.x or higher
- **PostgreSQL:** v15+ installed natively
- **PM2:** Globally installed (`npm install -g pm2`)
- **Git:** For deployment and version control

**External Services:**
- Google Cloud Platform (for OAuth 2.0 credentials)
- Stripe account (for payment processing)
- Pipedrive account (for lead sync)
- Cloudflare account (for tunnel)

---

## 🚀 Installation

### 1. Clone Repository

```bash
cd /home/newadmin/projects/blackbow-associates/
# Repository already present on VPS
```

### 2. Install Dependencies

```bash
cd backend
npm install --production
```

**Key Dependencies:**
- express
- @prisma/client
- @supabase/supabase-js
- stripe
- axios (Pipedrive API)
- node-cron (scheduler)
- winston (logging)
- dotenv
- cors
- express-rate-limit

---

## ⚙️ Configuration

### Environment Variables

Create `.env` file in `backend/` directory:

```bash
# Server Configuration
NODE_ENV=production
PORT=3450

# JWT Authentication
JWT_SECRET=your_secure_random_string_min_32_chars
JWT_EXPIRES_IN=7d

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Database (Native PostgreSQL)
DATABASE_URL="postgresql://blackbow_user:your_password@localhost:5432/blackbow?schema=public"

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Pipedrive Configuration
PIPEDRIVE_API_TOKEN=your_pipedrive_api_token

# Telegram Notifications
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# Application Settings
LEAD_PRICE=20.00
FEEDBACK_REWARD=2.00
INITIAL_BALANCE=100.00
```

**Security Notes:**
- NEVER commit `.env` file to git
- Use different keys for development/production
- Rotate secrets quarterly
- Bind service to `127.0.0.1` only (never `0.0.0.0`)

---

## 🗄️ Database Setup

### 1. Ensure PostgreSQL is Running

```bash
sudo systemctl status postgresql
# Should show active (running)
```

**Verify connection:**
```bash
psql -U blackbow_user -d blackbow -c "SELECT version();"
```

### 2. Run Prisma Migrations

```bash
cd backend
npx prisma migrate deploy
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Verify Database Connection

```bash
npx prisma db pull
# Should succeed without errors
```

**Database Schema:**
- users
- leads
- purchases
- transactions
- payment_methods
- user_lead_favorites
- admin_verifications
- lead_feedback

---

## 🏃 Running the Service

### Development Mode

```bash
npm run dev
# Starts with nodemon on port 3450
```

### Production Mode (PM2)

**Start Service:**
```bash
pm2 start ecosystem.config.js --only blackbow-api
pm2 save
```

**Reload (Zero Downtime):**
```bash
pm2 reload blackbow-api
```

**View Logs:**
```bash
pm2 logs blackbow-api --lines 100
```

**Monitor:**
```bash
pm2 monit
```

**Health Check:**
```bash
curl http://localhost:3450/health
# Expected: {"status":"ok","timestamp":"..."}
```

---

## 💾 Database Backup System

### Automated Backups

**Systemd Timer:** Daily backups at 2:00 AM UTC

**Installation:**
```bash
# Copy systemd files to system directory
sudo cp scripts/systemd/blackbow-backup.service /etc/systemd/system/
sudo cp scripts/systemd/blackbow-backup.timer /etc/systemd/system/

# Reload systemd and enable timer
sudo systemctl daemon-reload
sudo systemctl enable blackbow-backup.timer
sudo systemctl start blackbow-backup.timer

# Verify timer is active
sudo systemctl status blackbow-backup.timer
```

**Manual Backup:**
```bash
cd backend
./scripts/backup.sh
# Or use npm script
npm run backup
```

**Restore from Backup:**
```bash
cd backend
# List available backups
./scripts/restore.sh --list

# Restore from latest backup
./scripts/restore.sh

# Restore from specific backup
./scripts/restore.sh --backup blackbow_backup_YYYYMMDD_HHMMSS
```

**Backup Features:**
- PostgreSQL backup using `pg_dump`
- Compression with gzip
- SHA256 checksum verification
- JSON manifest with metadata
- Restic integration support (optional remote backup)
- 7-day local retention with automatic cleanup
- Telegram notifications

**Backup Location:**
- Local: `backend/backups/dumps/`
- Manifests: `backend/backups/manifests/`
- Logs: `/var/log/desaas/blackbow-backup.log`

For complete backup documentation, see [docs/BACKUP.md](docs/BACKUP.md).

---

## ⏰ Automated Services

### Pipedrive Sync Scheduler

**Purpose:** Automatically imports eligible leads from Pipedrive 4 times daily

**Schedule:** 8:00 AM, 11:00 AM, 2:00 PM, 5:00 PM EST

**Eligibility Criteria:**
- ✅ Date range: 3 days to 2 months old (based on deal creation date)
- ✅ Status: All statuses (open, won, lost)
- ❌ Excluded: "Production" pipeline
- ❌ Excluded: 5 stages in Lorena & Maureen pipelines:
  - "Lead In", "In Contact", "Quote Sent", "Quote Accepted", "Invoice sent"

**Manual Trigger (Admin Only):**
```bash
curl -X POST http://localhost:3450/api/pipedrive/sync-now \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Check Sync Status:**
```bash
curl http://localhost:3450/api/pipedrive/sync-status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Cron Configuration:**
- Implemented via `node-cron` (integrated into PM2 process)
- Timezone: America/New_York
- Concurrent sync prevention: ✅ Enabled
- Logging: Winston structured logs
- Notifications: Telegram alerts on failures

**Files:**
- `src/jobs/pipedrive-sync.job.js` - Main orchestration
- `src/services/pipedrive-metadata.service.js` - Pipeline/stage discovery
- `src/services/pipedrive.service.js` - API integration

---

## 📚 API Documentation

See [docs/API.md](docs/API.md) for complete endpoint documentation.

**Quick Reference:**

### Authentication
- `POST /api/auth/sync-user` - Sync user from Supabase Auth

### Leads
- `GET /api/leads` - Get all available leads (marketplace)
- `GET /api/leads/:id` - Get lead details
- `POST /api/leads/:leadId/favorite` - Add to favorites
- `DELETE /api/leads/:leadId/favorite` - Remove from favorites
- `GET /api/leads/favorites/list` - Get user's favorites

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/billing-address` - Update billing address
- `GET /api/users/balance` - Get account balance

### Payments
- `POST /api/payment/deposit` - Create Stripe checkout session
- `POST /api/payment/purchase-lead/:leadId` - Purchase a lead

### Pipedrive (Admin Only)
- `POST /api/pipedrive/sync-now` - Manual sync trigger
- `GET /api/pipedrive/sync-status` - Get sync status

### Lead Feedback
- `POST /api/leads/:leadId/feedback` - Submit feedback (earns $2 reward)
- `GET /api/leads/purchased` - Get purchased leads with feedback status

---

## 🚀 Deployment

### Pre-Deployment Checklist

- [ ] Run build/syntax check: `node -c src/index.js`
- [ ] Verify `.env` file is configured
- [ ] Check database connection: `npx prisma db pull`
- [ ] Review recent logs: `pm2 logs blackbow-api --lines 50`
- [ ] Verify no active users/processes

### Deployment Steps

1. **Pull Latest Code:**
   ```bash
   cd /home/newadmin/projects/blackbow-associates/backend
   git pull origin main
   ```

2. **Install Dependencies:**
   ```bash
   npm install --production
   ```

3. **Run Migrations (if needed):**
   ```bash
   npx prisma migrate deploy
   ```

4. **Reload Service (Zero Downtime):**
   ```bash
   pm2 reload blackbow-api
   ```

5. **Verify Health:**
   ```bash
   curl http://localhost:3450/health
   pm2 logs blackbow-api --lines 20
   ```

### Rollback Procedure

```bash
git reset --hard HEAD~1
npm install --production
pm2 reload blackbow-api
curl http://localhost:3450/health
```

---

## 📊 Monitoring

### PM2 Monitoring

```bash
# Service status
pm2 status blackbow-api

# Real-time logs
pm2 logs blackbow-api

# Resource usage
pm2 monit

# Error logs only
pm2 logs blackbow-api --err
```

### Health Checks

**HTTP Health Endpoint:**
```bash
curl http://localhost:3450/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-01T20:30:00.000Z",
  "database": "connected",
  "memory": "124MB"
}
```

### Telegram Alerts

Critical events are automatically sent to @desaas_monitor_S1_bot:
- Pipedrive sync failures
- Database connection errors
- Uncaught exceptions

**Alert Cooldown:** 30 minutes (prevents spam)

### Log Files

**Location:** `/var/log/desaas/blackbow-api.log`

**Format:** JSON structured logs

**Rotation:** Daily (via PM2)

**Example:**
```json
{
  "level": "info",
  "message": "Pipedrive sync completed",
  "timestamp": "2025-11-01T08:00:15.123Z",
  "imported": 5,
  "updated": 3,
  "failed": 0,
  "duration": "2.3s"
}
```

---

## 🔧 Troubleshooting

### Service Won't Start

**Check PM2 status:**
```bash
pm2 status blackbow-api
pm2 logs blackbow-api --err
```

**Common Issues:**
- Port 3450 already in use: `lsof -i :3450`
- Database connection failed: Check Supabase containers `docker ps`
- Missing environment variables: Verify `.env` file exists

### Database Connection Errors

**Check PostgreSQL service:**
```bash
sudo systemctl status postgresql
# Should show active (running)

# Restart if needed:
sudo systemctl restart postgresql
```

**Test connection:**
```bash
npx prisma db pull
# Should succeed without errors
```

### Pipedrive Sync Failures

**Check sync status:**
```bash
curl http://localhost:3450/api/pipedrive/sync-status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Manual sync:**
```bash
curl -X POST http://localhost:3450/api/pipedrive/sync-now \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Check logs:**
```bash
pm2 logs blackbow-api | grep -i pipedrive
```

**Common Issues:**
- Invalid Pipedrive API token: Check `.env` PIPEDRIVE_API_TOKEN
- Rate limiting: Wait 1 hour and retry
- Network connectivity: `curl https://api.pipedrive.com/v1/pipelines`

### Authentication Errors

**Verify JWT configuration:**
```bash
# Check .env has JWT_SECRET and JWT_EXPIRES_IN
grep JWT_ /home/newadmin/projects/blackbow-associates/backend/.env
```

**Check Google OAuth credentials:**
```bash
# Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set
grep GOOGLE_ /home/newadmin/projects/blackbow-associates/backend/.env
```

**Test authentication:**
```bash
# Look for JWT initialization in logs
pm2 logs blackbow-api | grep -i jwt
```

### Emergency Procedures

See `/home/newadmin/docs-server/operations/emergency-procedures.md` for complete emergency runbook.

**Quick restart:**
```bash
pm2 restart blackbow-api
```

**Full service recovery:**
```bash
# Stop service
pm2 stop blackbow-api

# Restart PostgreSQL
sudo systemctl restart postgresql

# Wait 5 seconds
sleep 5

# Start service
pm2 start blackbow-api
```

---

## 📖 Documentation

- **CHANGELOG:** [CHANGELOG.md](CHANGELOG.md)
- **API Reference:** [docs/API.md](docs/API.md)
- **Architecture:** [docs/architecture.md](docs/architecture.md)
- **VPS Infrastructure:** `/home/newadmin/docs-server/VPS_INFRASTRUCTURE.md`
- **PM2 Operations:** `/home/newadmin/docs-server/operations/pm2-operations.md`
- **Emergency Procedures:** `/home/newadmin/docs-server/operations/emergency-procedures.md`

---

## 🔒 Security

### Security Headers (Helmet.js)

Enhanced security configuration with comprehensive headers:
- **Content Security Policy (CSP)** - Strict directives for resource loading
- **HTTP Strict Transport Security (HSTS)** - 1 year, includeSubDomains, preload
- **XSS Protection** - Enabled with filter
- **Frame Guard** - Deny all frames
- **Referrer Policy** - strict-origin-when-cross-origin
- **Permissions Policy** - Geolocation, microphone, camera disabled

### Input Validation

All user inputs validated using `express-validator`:
- User profile updates
- Billing address information
- Lead purchase requests
- Payment deposits
- CSV imports (admin)
- Balance adjustments (admin)

### Rate Limiting

Three-tier rate limiting system:
- **General API**: 100 requests per 15 minutes per IP/user
- **Authentication**: 10 requests per 15 minutes per IP
- **Payments**: 20 requests per hour per IP/user
- **Analytics**: 100 requests per hour per admin user

### Authentication & Authorization

- **JWT-based authentication** via jsonwebtoken library
- **Google OAuth 2.0** integration via googleapis SDK
- **Role-based access control** (admin vs regular user)
- **Token expiration** configurable (default: 7 days)
- **Webhook verification** for Stripe and Pipedrive

### Database Security

- **Parameterized queries** via Prisma ORM (SQL injection prevention)
- **Connection pooling** for performance
- **Environment variable** database credentials

### Error Handling

- **No sensitive data** exposed in error messages (production)
- **Structured logging** without credentials
- **Audit logging** for admin actions

### Backup Security

- **SHA256 checksums** for backup integrity verification
- **Encrypted backups** (via gzip compression)
- **Secure backup storage** (local + optional Restic remote)
- **7-day retention** with automatic cleanup

### Security Compliance

✅ All security requirements met:
- No hardcoded credentials (all use environment variables)
- .gitignore properly excludes sensitive files
- Production error handling secure
- Comprehensive input validation
- Rate limiting active
- Security headers configured

- All services bind to `127.0.0.1` (localhost) only
- Cloudflare Tunnel for public access (HTTPS)
- JWT-based authentication (jsonwebtoken)
- Google OAuth 2.0 (googleapis SDK)
- Rate limiting on all endpoints
- Input validation on all requests
- SQL injection prevention (Prisma parameterized queries)
- Secrets in `.env` only (never committed to git)
- CORS configured for frontend domain only

---

## 👥 Team & Support

**Maintainer:** Claude Code (Senior Production Engineer)
**Server:** angry-hamilton.hivelocitydns.com (74.50.113.202)
**Telegram Bot:** @desaas_monitor_S1_bot
**Infrastructure Repo:** `~/desaas-infrastructure` (git)

---

## 📝 License

Proprietary - BlackBow Associates

---

**Last Updated:** December 12, 2025
**Migration Status:** Completed - Supabase to Native PostgreSQL + Custom Auth
**Generated with:** [Claude Code](https://claude.com/claude-code)
