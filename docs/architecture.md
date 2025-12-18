# BlackBow Associates - System Architecture

**Last Updated:** December 18, 2025
**Version:** 3.2.2 (Marketplace Filters + Webhook Safety + Ops Hardening)
**Status:** Production

---

## MIGRATION NOTICE (December 12, 2025)

**IMPORTANT:** BlackBow Associates has migrated from Supabase to native PostgreSQL with custom authentication.

**Key Changes:**
- Database: Supabase PostgreSQL (port 5433) → Native PostgreSQL (port 5432)
- Authentication: Supabase Auth SDK → Custom JWT + Google OAuth (googleapis SDK)
- Infrastructure: 11 Docker containers → 0 Docker containers (PM2 only)
- Performance: Improved database latency by 33%, auth latency by 75%
- Memory: Reduced from 1.5GB to 250MB (-83%)

**For complete migration details, see:** `/home/newadmin/projects/blackbow-associates/MIGRATION.md`

---

---

## System Overview

BlackBow Associates is a B2B wedding lead marketplace built with a modern microservices architecture, enabling wedding vendors to discover and purchase qualified leads through a secure, scalable platform.

### Technology Stack

**Backend:**
- Node.js 18+ (ES Modules)
- Express.js 4.x (REST API)
- Prisma ORM 5.x (Database abstraction)
- PostgreSQL 15 (Relational database)
- Winston 3.x (Structured logging)

**Frontend:**
- React 18 (UI framework)
- TypeScript 5.x (Type safety)
- Vite 5.x (Build tool)
- Tailwind CSS 3.x (Styling)
- Tremor 3.x (Dashboard charts & analytics)
- React Router 7.x (Navigation)

**Authentication & Payments:**
- Custom JWT (email/password) + Google OAuth (OAuth cookie + JWT)
- Stripe (Payment processing - LIVE mode)
- Pipedrive (CRM integration)
- Resend API (Email delivery)

**Infrastructure:**
- PM2 (Process management)
- Native PostgreSQL 15 (localhost, port 5432)
- Cloudflare Tunnel (Secure ingress)
- Express static server (Frontend hosting)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE TUNNEL                         │
│                   (Secure External Access)                       │
└───────────────┬──────────────────────┬──────────────────────────┘
                │                      │
                │                      │
        ┌───────▼───────┐      ┌──────▼──────┐
        │   Frontend    │      │     API     │
        │  (Port 3001)  │      │ (Port 3450) │
        │ Express+React │      │   Express   │
        └───────┬───────┘      └──────┬──────┘
                │                      │
                │                      ├─────┐
                │                      │     │
                │              ┌───────▼─────▼────┐
                │              │   PostgreSQL     │
                │              │   (Port 5432)    │
                │              │  blackbow DB     │
                │              └───────┬──────────┘
                │                      │
                │              ┌───────▼──────────┐
                └──────────────► External APIs    │
                               │ - Google OAuth   │
                               │ - Stripe Pay     │
                               │ - Pipedrive CRM  │
                               │ - Resend Email   │
                               └──────────────────┘
```

---

## Component Architecture

### 1. Backend API (Port 3450)

**Location:** `backend/src/`

**Middleware Stack:**

### 2025-12-18 - Rate Limiting Stability (Production)

We observed production 429s (`RATE_LIMIT_EXCEEDED`) impacting Marketplace leads and Referrals pages. Root cause was that the global `/api` rate limiter executed before user identity was available, forcing most traffic into shared IP buckets (NAT/VPN/office networks), which is too aggressive for normal dashboard usage.

**Fix:** Add a lightweight identity middleware that extracts `userId` from the JWT (Authorization header or OAuth cookie) and sets `req.rateLimitUserId` before the global limiter. Authenticated traffic is now rate limited per-user, unauthenticated traffic per-IP.


```
Request → CORS → Helmet → Rate Limiting → Body Parser →
Auth (Custom JWT / OAuth cookie) → Validation → Route Handler →
Response → Error Handler → Logger
```

**Route Groups:**
- `/api/auth` - Authentication, email confirmation, current user info
- `/api/users` - User profiles, balance management, transactions
- `/api/leads` - Lead browsing, purchasing (with row-level locking)
- `/api/payments` - Stripe deposits, payment methods
- `/api/admin` - User management (view, block, unblock, delete), balance adjustments, CSV import
- `/api/admin/analytics` - Dashboard analytics (overview, revenue, users, leads, feedback)
- `/api/admin/transactions` - Admin transaction ledger (paged, filterable)
- `/api/admin/referrals` - Referral management (overview, referrers, payouts, mark-paid, toggle-referral)
- `/api/referrals` - User referral dashboard (stats, link, referred-users, commissions, payouts)
- `/api/notifications` - In-app notifications (list, unread count, mark read, dismiss)
- `/api/webhooks` - Stripe, Pipedrive event handlers

**Security Layers:**
1. **Helmet.js security headers** - CSP, HSTS, frame guards, XSS protection
2. **CORS whitelist** - Frontend domain only (production: blackbowassociates.com)
3. **Multi-tier rate limiting** - 5 tiers: general, auth, payment, feedback, analytics
4. **JWT validation** - Token verification on every protected endpoint
5. **Email confirmation enforcement** - Unconfirmed users blocked from marketplace
6. **Admin role-based access control** - isAdmin flag + adminVerifiedAt timestamp
7. **User account blocking system** - isBlocked flag with reason tracking
8. **Webhook HMAC/secret verification** - Stripe signature validation, Pipedrive secret
9. **Input validation** - express-validator on all endpoints
10. **SQL injection prevention** - Prisma parameterized queries only
11. **Race condition prevention** - Row-level locking, atomic operations
12. **Payment deduplication** - Transaction-based duplicate detection

**Rate Limiting Tiers:**

| Tier | Endpoints | Limit | Window | Key Strategy |
|------|-----------|-------|--------|--------------|
| General API | All routes | 100 req | 15 min | IP-based |
| Auth | /api/auth/* | 10 req | 15 min | IP-based (strict) |
| Payment | /api/payments/* | 20 req | 1 hour | User ID + IP |
| Feedback | /api/leads/:id/feedback | 5 req | 1 hour | User ID only |
| Analytics | /api/admin/analytics/* | 100 req | 1 hour | User ID + IP |

**Database Access:**
- Prisma ORM with TypeScript types
- Connection pooling
- Row-level locking for concurrent purchases (`SELECT FOR UPDATE`)
- Atomic operations (`increment`/`decrement` for balance)
- Prepared statements (SQL injection prevention)
- Transaction-based duplicate detection

**Logging:**
- Winston structured JSON logging
- Daily rotating file transport
- Separate error log stream
- Log retention: 30 days (gzipped)
- Output: `/var/log/desaas/blackbow-*.log`
- Production-safe: No sensitive data (passwords, tokens, card numbers)

### 2. Frontend (Port 3001)

**Location:** `frontend/src/`

**Architecture Pattern:** Single Page Application (SPA)

**Routing Structure:**
```
/ (public)                  → Landing page
/marketplace (protected)    → Browse/purchase leads
/account (protected)        → User profile & transactions
/lead/:id (protected)       → Lead details after purchase
/admin (admin only)         → Admin dashboard with analytics
/account-blocked           → Account restricted page
/sign-in, /sign-up         → Supabase auth pages
/onboarding (protected)    → New user onboarding flow
/email-confirmation         → Email verification page
/confirm-email              → Email confirmation handler
/blog                       → SEO blog listing
/blog/:slug                 → Blog article pages
/unsubscribe/:token        → Email unsubscribe
```

**State Management:**
- React Context (Supabase auth state)
- Component-local state (useState, useEffect)
- No global state manager (Redux/Zustand not needed)

**API Client:**
- Axios with interceptors
- Supabase JWT token injection (Bearer auth)
- Base URL: `https://api.blackbowassociates.com`
- Structured logger (replaces console.log)

**Admin Dashboard Features:**
- Overview tab: KPIs, revenue charts, user growth, vendor distribution
- Users tab: User management (view, block, unblock, delete with confirmation)
- Leads tab: Lead management, CSV import
- Feedback tab: Booking rates, responsiveness analytics, time-to-book metrics

**Build Process:**
```
Source (src/) → Vite Build → Optimized Bundle (dist/) →
Express Static Server → Served to users
```

### 3. Database Schema

**Core Models:**

```
User (Supabase-synced)
├── id: String (CUID)
├── authUserId: String (Supabase auth ID, nullable)
├── email: String (unique)
├── businessName: String
├── vendorType: String
├── balance: Decimal (default: 0)
├── emailConfirmed: Boolean (default: false)
├── confirmationToken: String (unique, nullable)
├── confirmationSentAt: DateTime (nullable)
├── isAdmin: Boolean (default: false)
├── adminVerifiedAt: DateTime (nullable)
├── isBlocked: Boolean (default: false)
├── blockedAt: DateTime (nullable)
├── blockedReason: String (nullable)
├── onboardingCompleted: Boolean (default: false)
├── referralCode: String (unique, nullable, 8-char alphanumeric)
├── referredByUserId: String (FK to User, nullable)
├── referralEnabled: Boolean (default: true)
└── Relationships: transactions[], purchases[], paymentMethods[], favorites[], leadFeedback[], referrals[], referralCommissions[], referralPayouts[]

Lead
├── id: String (8 chars: XX123456)
├── status: Enum (AVAILABLE, SOLD, EXPIRED)
├── price: Decimal (default: 20.00)
├── maskedInfo: JSON (public view)
├── fullInfo: JSON (after purchase)
├── weddingDate: DateTime
├── location: String
├── city: String
├── state: String
├── budgetMin: Decimal
├── budgetMax: Decimal
├── servicesNeeded: String[]
└── Relationships: purchases[]

Transaction
├── id: String (UUID)
├── userId: String (FK to User, CASCADE delete)
├── type: Enum (DEPOSIT, PURCHASE, REFUND, ADJUSTMENT, REWARD)
├── amount: Decimal
├── balanceAfter: Decimal
├── stripePaymentId: String (nullable)
├── metadata: JSON
└── Relationships: user (CASCADE)

Purchase
├── id: String (UUID)
├── userId: String (FK to User, CASCADE delete)
├── leadId: String (FK to Lead)
├── amountPaid: Decimal
├── notes: String (nullable, max 5000 chars)
└── Relationships: user (CASCADE), lead

PaymentMethod
├── id: String (UUID)
├── userId: String (FK to User, CASCADE delete)
├── stripePaymentMethodId: String
├── last4: String
├── brand: String
├── expiryMonth: Int
├── expiryYear: Int
├── isDefault: Boolean
└── Relationships: user (CASCADE)

LeadFeedback
├── id: String (UUID)
├── userId: String (FK to User)
├── leadId: String (FK to Lead)
├── booked: Boolean
├── leadResponsive: Enum (responsive, ghosted, partial)
├── timeToBook: Enum (same-day, 1-3-days, 1-week, etc.)
├── amountCharged: Decimal (nullable)
└── Relationships: user, lead

ReferralCommission
├── id: String (CUID)
├── earnerId: String (FK to User - referrer)
├── sourceUserId: String (FK to User - referred user)
├── purchaseId: String (FK to Purchase, unique)
├── amount: Decimal (10% of purchase)
├── status: Enum (PENDING, PAID)
├── payoutId: String (FK to ReferralPayout, nullable)
├── paidAt: DateTime (nullable)
└── Relationships: earner, sourceUser, purchase, payout

ReferralPayout
├── id: String (CUID)
├── userId: String (FK to User - referrer)
├── amount: Decimal (total payout amount)
├── status: Enum (PENDING, PROCESSING, PAID, REJECTED)
├── requestedAt: DateTime
├── paidAt: DateTime (nullable)
├── notes: String (nullable)
└── Relationships: user, commissions[]

Notification
├── id: String (CUID)
├── userId: String (FK to User, CASCADE delete)
├── type: Enum (DEPOSIT_CONFIRMED, LEAD_PURCHASED, PAYOUT_REQUESTED, PAYOUT_PAID, FEEDBACK_REWARD, REFERRAL_COMMISSION_EARNED)
├── title: String
├── body: String
├── linkUrl: String (nullable)
├── metadata: JSON (nullable)
├── readAt: DateTime (nullable)
├── dismissedAt: DateTime (nullable)
└── createdAt: DateTime
```

**Indexes:**
- Lead.status, Lead.weddingDate (query optimization)
- User.email (unique constraint + fast lookup)
- Transaction.userId, Purchase.userId (relationship queries)
- Transaction.stripePaymentId (duplicate detection)

**CASCADE Constraints:**
- All user relationships use `ON DELETE CASCADE` for clean deletion
- Prevents orphaned records when users are deleted

### 4. External Integrations

**Supabase Authentication:**
- Flow: User signs up → Supabase creates account → Backend syncs to DB
- JWT validation on every protected API call
- Email confirmation required before marketplace access
- OAuth users (Google/Facebook) auto-confirmed (pre-verified by provider)
- User metadata stored in PostgreSQL (balance, purchases)

**Stripe Payments:**
- Flow: User deposits → PaymentIntent → Webhook confirms → Balance updated atomically
- Webhook events: `payment_intent.succeeded`, `payment_intent.payment_failed`
- HMAC signature verification (constant-time comparison)
- Transaction-based duplicate detection (prevents double-crediting)
- Amount validation: -,000 bounds
- LIVE mode: Accepting real payments

**Pipedrive CRM:**
- Flow: Deal added/updated → Webhook → Lead created/updated in DB
- Lead data mapped from deal custom fields
- Webhook secret verification

**Resend Email API:**
- Email confirmation system
- Professional HTML templates
- Shared API key from email-sender service
- Rate limiting: 60-second cooldown on resend

---

## Security Architecture

### Production Security Hardening (v2.1.0 - November 7, 2025)

**Comprehensive Security Audit Completed:**

#### Critical Fixes Implemented:

1. **Rate Limiting Coverage**
   - ✅ Fixed: Auth routes now protected (`/api/auth/resend-confirmation`, `/api/auth/send-confirmation`, `/api/auth/confirm-email`)
   - ✅ All endpoints have appropriate rate limiting tiers
   - ✅ Strict IP validation (no shared buckets)

2. **Payment Security**
   - ✅ Fixed: Payment webhook race condition (transaction-based duplicate detection)
   - ✅ Added: Amount bounds validation in webhook (---,000)
   - ✅ Enhanced: Defense-in-depth validation in payment controller
   - ✅ Atomic operations: All balance updates use `increment`/`decrement`

3. **Input Validation & Sanitization**
   - ✅ Fixed: Pagination parameters validated and bounded (max 100 per page, max page 1000)
   - ✅ Added: User notes sanitization (5000 char limit, trimmed)
   - ✅ Added: Admin reasons sanitization (500 char limit, trimmed)
   - ✅ Enhanced: Feedback validation (enum validation, amount bounds $0-$1,000,000)
