# BlackBow Backend Setup Instructions

**Status:** ✅ Database created, migrations run, backend deployed on PM2 port 3450

## Prerequisites

1. **PostgreSQL** must be installed and running ✅
2. **Node.js 18+** installed ✅
3. **npm** installed ✅

## Database Setup ✅ COMPLETED

The PostgreSQL database has been created and migrations run:

```bash
sudo -u postgres psql -f create_database.sql
```

Or manually:

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE blackbow;
CREATE USER blackbow_user WITH ENCRYPTED PASSWORD 'Ji8cKXf6eWJOrOKA4ZUKFyDFUPhvpm5g';
GRANT ALL PRIVILEGES ON DATABASE blackbow TO blackbow_user;
\c blackbow
GRANT ALL ON SCHEMA public TO blackbow_user;
ALTER DATABASE blackbow OWNER TO blackbow_user;
\q
```

## Completed Setup Steps ✅

1. **Prisma Migrations:** ✅ Run (migration: 20251029121434_init)
2. **Prisma Client:** ✅ Generated
3. **Environment Variables:** ⚠️ NEEDS API KEYS (see below)
4. **Backend Deployment:** ✅ Running on PM2 (port 3450)

## Current Status

**Backend API:** Running on http://localhost:3450
```bash
# Check health
curl http://localhost:3450/health

# View logs
pm2 logs blackbow-api

# Restart after config changes
pm2 restart blackbow-api
```

## ⚠️ REQUIRED: API Keys Configuration

Edit `backend/.env` and add:

```bash
# Clerk Authentication (https://clerk.com)
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Stripe Payments (https://stripe.com - use test mode)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Pipedrive CRM (https://pipedrive.com)
PIPEDRIVE_API_TOKEN=your_token
PIPEDRIVE_WEBHOOK_SECRET=your_secret
```

**After adding keys:** `pm2 restart blackbow-api`

## Development (if needed)

```bash
npm run dev
```

## Redeployment

```bash
bash scripts/deploy.sh
```

## Credentials

- **Database Password:** `Ji8cKXf6eWJOrOKA4ZUKFyDFUPhvpm5g`
- **Admin Verification Code:** `JOM13vMi6aUHeCOUQPpioTrZI1U835O3`

**⚠️ IMPORTANT:** Change these in production!
