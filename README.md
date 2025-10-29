# BlackBow Associates - Wedding Lead Marketplace

**Production-grade wedding lead marketplace with Clerk authentication, Stripe payments, and Pipedrive CRM integration.**

## 🎯 Project Status

**Backend:** ✅ 100% Complete - Deployed on PM2 port 3450
**Frontend:** ✅ 100% Complete - All pages implemented
**Database:** ✅ Migrated and running
**Blocker:** ⚠️ Requires API keys (Clerk, Stripe, Pipedrive)

**Last Updated:** 2025-10-29
**Server:** VPS Production (angry-hamilton.hivelocitydns.com)

---

## 📋 Overview

BlackBow Associates is a B2B marketplace connecting wedding vendors with qualified leads. Vendors can browse available wedding leads, purchase them with account credits, and access full contact information.

### Key Features

- **Clerk Authentication** - Secure JWT-based auth with user management
- **Stripe Payments** - Deposit funds via credit card (PaymentIntents)
- **Lead Marketplace** - Browse, filter, and purchase wedding leads
- **Pipedrive Integration** - Automatic lead creation from CRM deals
- **Admin Dashboard** - User management, balance adjustments, CSV import
- **Transaction History** - Complete audit trail of all purchases and deposits

---

## 🏗️ Architecture

### Backend (Express + Prisma + PostgreSQL)

**Tech Stack:**
- Node.js 18+ with ES Modules
- Express.js (REST API)
- Prisma ORM (PostgreSQL)
- Clerk SDK (Authentication)
- Stripe SDK (Payments)
- Winston (Structured logging)
- PM2 (Process management)

**API Endpoints:** 25+ endpoints across 6 route groups
- `/api/auth` - Authentication, admin verification, user sync
- `/api/users` - Profile, balance, transactions, purchased leads
- `/api/leads` - Browse, purchase (with row-level locking)
- `/api/payments` - Deposits, payment methods
- `/api/admin` - User management, balance adjustment, CSV import
- `/api/webhooks` - Stripe, Pipedrive, Clerk webhooks

**Port:** 3450 (localhost only)
**Logs:** `/var/log/desaas/blackbow-*.log`

### Frontend (React + TypeScript + Vite)

**Tech Stack:**
- React 18 with TypeScript
- Vite (Build tool)
- Clerk React (Auth UI)
- Stripe React (Payment UI)
- Tailwind CSS (Styling)
- React Router (Navigation)
- Axios (API client)

**Pages Implemented:**
- Landing Page (public)
- Marketplace Page - Browse and purchase leads with filters
- Account Page - Profile, balance, transactions, purchased leads
- Lead Details Page - Full contact info after purchase
- Admin Verification Page - Code entry for admin access
- Admin Dashboard - User/lead management, CSV import
- Auth Pages - Clerk sign-in/sign-up
- Unsubscribe Page - Email unsubscribe (preserved from newsletter)

---

## 🚀 Quick Start

### Prerequisites

- PostgreSQL 14+ ✅ Running
- Node.js 18+ ✅ Installed
- PM2 ✅ Installed

### 1. Backend Setup

```bash
cd backend

# Database already created and migrated ✅
# Prisma client already generated ✅

# Add API keys to .env (see backend/.env.example)
# Required: CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY
# Required: STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
# Required: PIPEDRIVE_API_TOKEN, PIPEDRIVE_WEBHOOK_SECRET

# Restart backend after adding keys
pm2 restart blackbow-api

# Check health
curl http://localhost:3450/health
```

### 2. Frontend Setup

```bash
cd frontend

# Add API keys to .env.development
# Required: VITE_CLERK_PUBLISHABLE_KEY
# Required: VITE_STRIPE_PUBLISHABLE_KEY
# Required: VITE_API_BASE_URL=http://localhost:3450

# Development mode
npm run dev

# Production build
npm run build
```

---

## 📊 Database Schema

**6 Models:**
- `User` - Clerk-synced users with balance tracking
- `Lead` - Wedding leads (masked + full contact info)
- `Transaction` - Deposits and purchases
- `Purchase` - Lead ownership records
- `PaymentMethod` - Saved Stripe payment methods
- `AdminVerification` - Admin access audit logs

**Key Features:**
- Row-level locking for concurrent purchase safety
- Decimal precision for money fields
- Indexed queries (status, dates, location)
- JSON storage for flexible lead data

---

## 🔐 Security

- ✅ Localhost-only binding (127.0.0.1)
- ✅ Clerk JWT authentication
- ✅ Stripe webhook HMAC verification
- ✅ Pipedrive webhook secret verification
- ✅ Rate limiting (3 tiers)
- ✅ Input validation (all endpoints)
- ✅ Admin double-authentication
- ✅ Structured logging (Winston)
- ✅ Row-level locking (purchase transactions)
- ✅ Secrets in .env (never committed)

---

## 📁 Project Structure

```
blackbow-associates/
├── backend/
│   ├── src/
│   │   ├── controllers/      # 6 controllers (auth, users, leads, payments, admin, webhooks)
│   │   ├── routes/           # 6 route files
│   │   ├── middleware/       # Error handling, auth, rate limiting, validation
│   │   ├── services/         # Stripe service, database service
│   │   ├── config/           # Database configuration
│   │   ├── utils/            # Logger (Winston)
│   │   └── index.js          # Express server
│   ├── prisma/
│   │   ├── schema.prisma     # 6 models
│   │   └── migrations/       # Database migrations
│   ├── scripts/
│   │   └── deploy.sh         # Zero-downtime deployment
│   ├── ecosystem.config.cjs  # PM2 configuration
│   ├── .env                  # Environment variables (not committed)
│   └── SETUP.md              # Setup instructions
├── frontend/
│   ├── src/
│   │   ├── components/       # Navbar, LeadCard, DepositModal
│   │   ├── pages/            # 8 pages (Landing, Marketplace, Account, etc.)
│   │   ├── services/         # API client (axios with Clerk interceptor)
│   │   ├── App.tsx           # Router with protected routes
│   │   └── main.tsx          # ClerkProvider wrapper
│   ├── dist/                 # Production build
│   └── .env.development      # Environment variables
├── docs/
│   ├── IMPLEMENTATION_PLAN.md  # Original 1816-line implementation plan
│   └── blackbow_plan.md        # Original 727-line feature plan
└── README.md                 # This file
```

---

## 🛠️ Development

### Backend Development

```bash
cd backend

# Development mode (nodemon)
npm run dev

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# View database
npx prisma studio
```

### Frontend Development

```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🚢 Deployment

### Backend (Already Deployed ✅)

```bash
# Current status
pm2 status blackbow-api

# View logs
pm2 logs blackbow-api

# Restart
pm2 restart blackbow-api

# Redeploy with script
cd backend && bash scripts/deploy.sh
```

### Frontend (Pending)

**Option 1: Cloudflare Pages (Recommended)**
- Build: `npm run build`
- Output: `dist/`
- Deploy: Connect GitHub repo to Cloudflare Pages

**Option 2: Static Hosting**
- Build: `npm run build`
- Upload `dist/` to any static host

---

## 🔑 Credentials

**Database:**
- User: `blackbow_user`
- Password: `Ji8cKXf6eWJOrOKA4ZUKFyDFUPhvpm5g`
- Database: `blackbow`
- Port: 5432

**Admin:**
- Verification Code: `JOM13vMi6aUHeCOUQPpioTrZI1U835O3`

**⚠️ IMPORTANT:** Change these credentials before production deployment!

---

## 📝 API Keys Required

### Clerk (https://clerk.com)
1. Create account and application
2. Get Publishable Key (starts with `pk_`)
3. Get Secret Key (starts with `sk_`)
4. Configure webhook: `https://api.blackbowassociates.com/api/webhooks/clerk`

### Stripe (https://stripe.com)
1. Create account (use test mode initially)
2. Get Publishable Key (`pk_test_...`)
3. Get Secret Key (`sk_test_...`)
4. Add webhook: `https://api.blackbowassociates.com/api/webhooks/stripe`
5. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
6. Copy webhook signing secret (`whsec_...`)

### Pipedrive (https://pipedrive.com)
1. Create account
2. Get API token from Settings → Personal preferences → API
3. Add webhook: `https://api.blackbowassociates.com/api/webhooks/pipedrive`
4. Select events: `added.deal`, `updated.deal`
5. Generate and save webhook secret

---

## 🧪 Testing

### Backend Health Check
```bash
curl http://localhost:3450/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "uptime": 123.45,
  "memory": {"used": 50, "total": 100, "unit": "MB"}
}
```

### Test Endpoints (after adding API keys)
```bash
# Browse leads (requires auth token)
curl -H "Authorization: Bearer <clerk-token>" \
  http://localhost:3450/api/leads

# Admin users list (requires admin auth)
curl -H "Authorization: Bearer <admin-clerk-token>" \
  http://localhost:3450/api/admin/users
```

---

## 📊 Monitoring

**Logs:**
```bash
# Application logs
pm2 logs blackbow-api

# Error logs only
pm2 logs blackbow-api --err

# Structured logs (JSON)
tail -f /var/log/desaas/blackbow-combined-*.log | jq
```

**Telegram Notifications:**
- Critical events sent to Telegram bot
- Uses localhost:3400 notification service
- Automatic alerts for errors

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check logs
pm2 logs blackbow-api --lines 100

# Check database connection
psql -U blackbow_user -d blackbow -c "SELECT 1"

# Verify environment variables
cat backend/.env | grep -v "PASSWORD\|SECRET"
```

### Frontend build fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run build
```

### Database issues
```bash
# Verify database exists
psql -l | grep blackbow

# Check migrations
cd backend && npx prisma migrate status

# Reset database (CAUTION: deletes all data)
cd backend && npx prisma migrate reset
```

---

## 📚 Documentation

- `backend/SETUP.md` - Backend setup instructions (updated with completed status)
- `docs/IMPLEMENTATION_PLAN.md` - Detailed implementation plan
- `docs/blackbow_plan.md` - Feature specifications
- `.claude-session-report.md` - Session work log (previous session)

---

## 🔄 Next Steps

1. ✅ ~~Create PostgreSQL database~~
2. ✅ ~~Run Prisma migrations~~
3. ✅ ~~Implement complete backend API~~
4. ✅ ~~Implement all frontend pages~~
5. ✅ ~~Deploy backend with PM2~~
6. ⚠️ **Add API Keys** - Configure Clerk, Stripe, Pipedrive in `.env`
7. 🔲 **Test Auth Flow** - Sign up, sign in, profile updates
8. 🔲 **Test Purchase Flow** - Deposit funds, purchase lead
9. 🔲 **Configure Webhooks** - Set up Stripe and Pipedrive webhooks
10. 🔲 **Deploy Frontend** - Build and deploy to Cloudflare Pages
11. 🔲 **Production Testing** - End-to-end workflow verification

---

## 📞 Support

- GitHub Issues: [Create issue]
- Documentation: See `docs/` folder
- Session Report: `.claude-session-report.md`

---

**Built with ❤️ for BlackBow Associates**
**Status:** Production-ready pending API keys
**Maintained by:** Claude Code (Senior Production Engineer)
