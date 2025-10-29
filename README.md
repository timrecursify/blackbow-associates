# BlackBow Associates - Wedding Lead Marketplace

**Production-grade wedding lead marketplace where vendors purchase qualified leads at $20/lead.**

---

## Project Status

**Phase:** Foundation & Planning Complete ✅
**Next:** Backend Development
**Timeline:** 3-4 weeks to production

---

## Architecture

- **Frontend:** React + TypeScript + Vite (Cloudflare Pages)
- **Backend:** Node.js + Express + PostgreSQL (VPS Port 3450)
- **Auth:** Clerk (with admin verification code)
- **Payments:** Stripe
- **CRM:** Pipedrive webhooks
- **Deployment:** PM2 + Cloudflare Tunnel
- **Backups:** Daily to Raspberry Pi via Restic

---

## Quick Start

### Backend Development
```bash
cd backend
npm install
cp .env.example .env          # Configure environment variables
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Frontend Development
```bash
cd frontend
npm install
cp .env.example .env          # Configure environment variables
npm run dev
```

### Production Deployment
```bash
# Backend
cd backend
bash scripts/deploy.sh

# Frontend
cd frontend
npm run build
wrangler pages deploy dist
```

---

## Documentation

📋 **[IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)** - Complete development plan (read this first!)
📖 **[blackbow_plan.md](docs/blackbow_plan.md)** - Original product requirements

---

## Project Structure

```
blackbow-associates/
├── backend/              # Node.js API (Port 3450)
│   ├── src/
│   │   ├── config/       # Database, environment
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Auth, validation, errors
│   │   ├── models/       # Prisma schema
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── utils/        # Helpers, logger
│   ├── migrations/       # Database migrations
│   ├── scripts/          # Deploy, backup scripts
│   └── prisma/          # Prisma schema
├── frontend/            # React app (Cloudflare Pages)
│   └── src/
│       ├── pages/       # LoginPage, MarketplacePage, AccountPage, etc.
│       ├── components/  # Reusable UI components
│       ├── services/    # API client
│       ├── hooks/       # Custom React hooks
│       └── types/       # TypeScript types
├── shared/              # Shared code
│   ├── types/          # Shared TypeScript types
│   └── constants/      # Shared constants
└── docs/               # Documentation
    ├── IMPLEMENTATION_PLAN.md
    └── blackbow_plan.md
```

---

## Key Features

### For Vendors
- ✅ Clerk authentication with business profile
- ✅ Browse available wedding leads (masked contact info)
- ✅ Purchase leads at $20/lead
- ✅ Deposit funds via Stripe
- ✅ Access full contact info after purchase
- ✅ Transaction history
- ✅ Saved payment methods

### For Admins
- ✅ Double authentication (Clerk + verification code)
- ✅ User management
- ✅ Lead management (CRUD)
- ✅ CSV lead import
- ✅ Balance adjustments
- ✅ Transaction reports
- ✅ System monitoring

### Lead Management
- ✅ Automatic lead creation from Pipedrive deals
- ✅ Masked info (preview before purchase)
- ✅ Full contact info revealed after purchase
- ✅ One lead, one purchase (prevent duplicates)
- ✅ Transaction-safe purchase logic

---

## Environment Variables Required

See **[IMPLEMENTATION_PLAN.md - Section: Environment Variables](docs/IMPLEMENTATION_PLAN.md#environment-variables--api-keys-required)** for complete list.

### Critical Keys Needed:
- Clerk API keys (auth)
- Stripe API keys (payments)
- Pipedrive API token (CRM integration)
- Admin verification code (security)
- PostgreSQL credentials (database)

---

## Commands

### Development
```bash
# Backend
npm run dev              # Start dev server
npm run prisma:studio    # Database GUI

# Frontend
npm run dev              # Start dev server
npm run build            # Production build
```

### Production
```bash
# Service management
pm2 status blackbow-api
pm2 logs blackbow-api
pm2 restart blackbow-api

# Health check
curl http://localhost:3450/health

# Deployment
bash backend/scripts/deploy.sh

# Backup
bash backend/scripts/backup.sh
```

### Database
```bash
# Migrations
npx prisma migrate dev       # Development
npx prisma migrate deploy    # Production

# Access database
psql -U blackbow_user -d blackbow
```

---

## Monitoring

### Logs
- **Location:** `/var/log/desaas/blackbow-*.log`
- **Format:** JSON structured logging
- **Rotation:** Daily with 30-day retention

### Health Check
- **Endpoint:** `GET http://localhost:3450/health`
- **Monitor:** Every 5 minutes via cron

### Notifications
- **Service:** Telegram (@desaas_monitor_S1_bot)
- **Events:** Deployments, errors, backups, admin access

### Backups
- **Schedule:** Daily at 2 AM
- **Target:** Raspberry Pi Restic repository
- **Retention:** 7 daily, 4 weekly, 12 monthly

---

## Development Workflow

1. **Read** [IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) completely
2. **Obtain** all required API keys (Clerk, Stripe, Pipedrive)
3. **Setup** PostgreSQL database
4. **Configure** environment variables
5. **Develop** following phase-by-phase plan
6. **Test** thoroughly (see testing checklist in plan)
7. **Deploy** to production (PM2 + Cloudflare)
8. **Monitor** logs and health

---

## Security Notes

- ⚠️ Backend binds to `127.0.0.1` ONLY (never 0.0.0.0)
- ⚠️ All secrets in `.env` files (never committed)
- ⚠️ Webhook signatures verified (Stripe, Pipedrive)
- ⚠️ Rate limiting enabled (100 req/15min)
- ⚠️ Admin access requires verification code
- ⚠️ Row-level locking prevents concurrent purchase issues

---

## Reusable Components from Email-Sender Project

Located at: `/home/newadmin/projects/email-sender/`

**High Priority (Use Immediately):**
- CSV import logic (`src/services/CSVImporter.js`)
- Database schema patterns
- Validation utilities
- Winston logger setup
- Error handling patterns

**Deferred:**
- Telegram notifications (add later)
- Email campaign system (not needed initially)

---

## Support

### Logs
```bash
# Real-time error monitoring
tail -f /var/log/desaas/blackbow-error-$(date +%Y-%m-%d).log | jq

# Recent requests
tail -100 /var/log/desaas/blackbow-combined-$(date +%Y-%m-%d).log | jq
```

### Troubleshooting
```bash
# Service not responding
pm2 restart blackbow-api
pm2 logs blackbow-api --err

# Database issues
psql -U blackbow_user -d blackbow -c "SELECT 1;"

# Disk space
df -h

# Memory usage
free -h
```

### Rollback
```bash
# Backend rollback
cd backend
git reset --hard HEAD~1
npm install --production
pm2 restart blackbow-api

# Frontend rollback
wrangler pages deployment rollback <DEPLOYMENT_ID>
```

---

## Resources

- **Clerk Docs:** https://clerk.com/docs
- **Stripe Docs:** https://stripe.com/docs/api
- **Pipedrive API:** https://developers.pipedrive.com/docs/api/v1
- **Prisma Docs:** https://www.prisma.io/docs
- **PM2 Docs:** https://pm2.keymetrics.io/docs

---

## Next Steps

1. ✅ ~~Project structure created~~
2. ✅ ~~Implementation plan documented~~
3. 🔲 Obtain API keys (Clerk, Stripe, Pipedrive)
4. 🔲 Setup PostgreSQL database
5. 🔲 Begin Phase 1: Backend Foundation

**See [IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) for detailed next steps.**

---

**Maintained by:** Claude Code (Senior Production Engineer)
**Last Updated:** 2025-10-28
**Server:** VPS Production (angry-hamilton.hivelocitydns.com)
**Port:** 3450 (localhost only)
