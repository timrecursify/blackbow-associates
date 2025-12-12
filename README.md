# BlackBow Associates - Wedding Lead Marketplace

**Production-grade wedding lead marketplace with custom JWT authentication, Google OAuth, native PostgreSQL, Stripe payments, and Pipedrive CRM integration.**

## 🎯 Project Status

**Backend:** ✅ Operational - All endpoints healthy
**Frontend:** ✅ Complete - All pages implemented
**Database:** ✅ Native PostgreSQL 15 (port 5432)
**Authentication:** ✅ Custom JWT + Direct Google OAuth (googleapis SDK)
**Infrastructure:** ✅ PM2 deployment (2 services, 0 Docker containers)

**Version:** 2.0.0 (LIVE PRODUCTION - Accepting Real Payments)
**Last Updated:** 2025-12-12
**Server:** VPS Production (angry-hamilton.hivelocitydns.com)
**Payment Status:** 🔴 **STRIPE LIVE MODE ACTIVE**

**Latest Updates:**
- **2025-12-12: MIGRATION COMPLETE - Supabase → Native PostgreSQL + Custom Auth** - Eliminated all 11 Supabase Docker containers, migrated to native PostgreSQL (port 5432), implemented custom JWT authentication with direct Google OAuth integration
- **2025-11-24: Frontend Server Fixed** - Added Express dependency (v4.21.2), switched from broken `npm run serve` to proper Express server, eliminated 16 restarts in 4 days
- **LIVE Stripe Keys Deployed** - Platform now accepting real payments with real credit cards
- **v1.8.0 Security Audit Complete** - Fixed 9 vulnerabilities (4 CRITICAL, 5 HIGH)
- All race conditions eliminated, atomic operations enforced, PCI-DSS compliance improved
- See CHANGELOG.md for complete details

---

## 📋 Overview

BlackBow Associates is a B2B marketplace connecting wedding vendors with qualified leads. Vendors can browse available wedding leads, purchase them with account credits, and access full contact information.

### Key Features

- **Custom JWT Authentication** - Email/password login with secure JWT tokens
- **Google OAuth Integration** - Direct Google OAuth 2.0 using googleapis SDK
- **Native PostgreSQL Database** - High-performance database on port 5432
- **Stripe Payments** - Deposit funds via credit card (PaymentIntents)
- **Lead Marketplace** - Browse, filter, and purchase wedding leads
- **Pipedrive Integration** - Automatic lead creation from CRM deals
- **Admin Dashboard** - User management, balance adjustments, CSV import
- **Transaction History** - Complete audit trail of all purchases and deposits
- **Onboarding Flow** - Multi-step registration with business details collection

---

## 🏗️ Architecture

### Backend (Express + Prisma + PostgreSQL)

**Tech Stack:**
- Node.js 18+ with ES Modules
- Express.js (REST API)
- Prisma ORM (PostgreSQL)
- JWT (jsonwebtoken - Custom authentication)
- Google OAuth 2.0 (googleapis SDK)
- Stripe SDK (Payments)
- Winston (Structured logging)
- PM2 (Process management)

**API Endpoints:** 26+ endpoints across 6 route groups
- `/api/auth` - Authentication, admin verification, user sync
- `/api/users` - Profile, balance, transactions, purchased leads, **onboarding completion**
- `/api/leads` - Browse, purchase (with row-level locking)
- `/api/payments` - Deposits, payment methods
- `/api/admin` - User management, balance adjustment, CSV import
- `/api/webhooks` - Stripe, Pipedrive webhooks

**Port:** 3450 (localhost only)
**Logs:** `/var/log/desaas/blackbow-*.log`

### Frontend (React + TypeScript + Vite)

**Tech Stack:**
- React 18 with TypeScript
- Vite (Build tool)
- Custom JWT Auth (Token-based authentication)
- Google OAuth 2.0 (Direct integration)
- Stripe React (Payment UI)
- Tailwind CSS (Styling)
- React Router (Navigation)
- Axios (API client)

**Pages Implemented:**
- Landing Page (public)
- Onboarding Page - Multi-step registration (business details collection)
- Marketplace Page - Browse and purchase leads with filters
- Account Page - Profile, balance, transactions, purchased leads
- Lead Details Page - Full contact info after purchase
- Admin Verification Page - Code entry for admin access
- Admin Dashboard - User/lead management, CSV import
- Auth Pages - Custom Supabase sign-in/sign-up with OAuth (Google, Facebook)
- Unsubscribe Page - Email unsubscribe (preserved from newsletter)

**Authentication Flow:**
- Step 1: Email/password or Google OAuth registration
- Step 2: Business details form (business name, location, vendor type, about)
- Required fields: All fields mandatory with validation
- Auto-creation: Users created in PostgreSQL database on registration
- Protection: Marketplace/account access blocked until onboarding complete

**✅ Recent Migration (2025-12-12):**
- **Migrated from Supabase → Native PostgreSQL + Custom Auth**
- **Reason:** Simplify infrastructure, eliminate 11 Docker containers, improve performance
- **Status:** Migration complete and operational
- **Changes:** Custom JWT authentication, direct Google OAuth (googleapis SDK), native PostgreSQL on port 5432
- **Infrastructure:** Lightweight PM2 deployment, no Docker containers required

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
# Required: JWT_SECRET, JWT_EXPIRES_IN
# Required: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
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
# Required: VITE_GOOGLE_CLIENT_ID
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
- `User` - JWT-authenticated users with balance tracking, location, about, onboardingCompleted
- `Lead` - Wedding leads (masked + full contact info)
- `Transaction` - Deposits and purchases
- `Purchase` - Lead ownership records
- `PaymentMethod` - Saved Stripe payment methods
- `AdminVerification` - Admin access audit logs

**Recent Schema Changes (2025-10-29):**
- Added `location` (String, nullable) - City/State for vendor business
- Added `about` (Text, nullable) - Business description
- Added `onboardingCompleted` (Boolean, default: false) - Onboarding status tracking
- Migration: `20251029_add_onboarding_fields`

**Key Features:**
- Row-level locking for concurrent purchase safety
- Decimal precision for money fields
- Indexed queries (status, dates, location)
- JSON storage for flexible lead data

---

## 🔐 Security

- ✅ Localhost-only binding (127.0.0.1)
- ✅ Custom JWT authentication (jsonwebtoken)
- ✅ Google OAuth 2.0 integration (googleapis SDK)
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
│   │   ├── pages/            # 9 pages (Landing, Onboarding, Marketplace, Account, etc.)
│   │   ├── services/         # API client (axios with JWT interceptor)
│   │   ├── App.tsx           # Router with ProtectedRoute wrapper for onboarding enforcement
│   │   └── main.tsx          # Auth context provider
│   ├── dist/                 # Production build
│   ├── server.js             # Custom Express server (localhost binding)
│   └── .env.production       # Environment variables
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

## 🔑 Configuration

**All credentials are stored in `.env` files:**
- Backend credentials: `backend/.env`
- Frontend credentials: `frontend/.env.production`

**See `.env.example` files for required variables.**

---

## 📝 API Keys Required

### Google OAuth (https://console.cloud.google.com)
1. Create project in Google Cloud Console
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Get Client ID and Client Secret
5. Configure authorized redirect URIs: `https://blackbowassociates.com/auth/callback`

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
curl -H "Authorization: Bearer <jwt-token>" \
  http://localhost:3450/api/leads

# Admin users list (requires admin auth)
curl -H "Authorization: Bearer <admin-jwt-token>" \
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
6. ✅ ~~Implement onboarding flow~~
7. ✅ ~~Deploy frontend with PM2~~
8. ✅ ~~Migrate to Native PostgreSQL + Custom Auth~~ - **COMPLETE (2025-12-12)**
9. ✅ **API Keys Configured** - Google OAuth, Stripe, Pipedrive in `.env`
10. ✅ **Auth Flow Working** - Email/password + Google OAuth operational
11. ✅ **Purchase Flow Working** - Deposits and lead purchases functional
12. ✅ **Webhooks Configured** - Stripe and Pipedrive webhooks active
13. ✅ **Production Testing** - End-to-end workflow verified

---

## 📞 Support

- GitHub Issues: [Create issue]
- Documentation: See `docs/` folder
- Session Report: `.claude-session-report.md`

---

**Built with care for BlackBow Associates**
**Status:** Production - Fully operational
**Deployed:** Backend + Frontend on PM2 (2 services, lightweight infrastructure)
**Authentication:** Custom JWT + Google OAuth
**Database:** Native PostgreSQL (port 5432)
**Maintained by:** Claude Code (Senior Production Engineer)
