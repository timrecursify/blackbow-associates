# BlackBow Associates - System Architecture

**Last Updated:** December 12, 2025
**Version:** 3.0.0 (Native PostgreSQL + Custom Auth)
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
- Supabase Auth (Self-hosted, JWT-based authentication)
- Stripe (Payment processing - LIVE mode)
- Pipedrive (CRM integration)
- Resend API (Email delivery)

**Infrastructure:**
- PM2 (Process management)
- Supabase (Self-hosted via Docker - Auth, PostgreSQL)
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
                │              │   (Port 5433)    │
                │              │  blackbow DB     │
                │              └───────┬──────────┘
                │                      │
                │              ┌───────▼──────────┐
                └──────────────► External APIs    │
                               │ - Supabase Auth  │
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
```
Request → CORS → Helmet → Rate Limiting → Body Parser →
Auth (Supabase JWT) → Validation → Route Handler →
Response → Error Handler → Logger
```

**Route Groups:**
- `/api/auth` - Authentication, email confirmation, current user info
- `/api/users` - User profiles, balance management, transactions
- `/api/leads` - Lead browsing, purchasing (with row-level locking)
- `/api/payments` - Stripe deposits, payment methods
- `/api/admin` - User management (view, block, unblock, delete), balance adjustments, CSV import
- `/api/admin/analytics` - Dashboard analytics (overview, revenue, users, leads, feedback)
- `/api/webhooks` - Stripe, Pipedrive event handlers

**Security Layers:**
1. **Helmet.js security headers** - CSP, HSTS, frame guards, XSS protection
2. **CORS whitelist** - Frontend domain only (production: blackbowassociates.com)
3. **Multi-tier rate limiting** - 5 tiers: general, auth, payment, feedback, analytics
4. **Supabase JWT validation** - Token verification on every protected endpoint
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
└── Relationships: transactions[], purchases[], paymentMethods[], favorites[], leadFeedback[]

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
   - ✅ Enhanced: Feedback validation (enum validation, amount bounds ---ssh -i ~/.ssh/id_ed25519 newadmin@74.50.113.202 "cd ~/projects/blackbow-associates && cat > /tmp/update_architecture.md << 'ARCHDOC'
# BlackBow Associates - System Architecture

**Last Updated: November 7, 2025
**Version: 2.1.0
**Status: Production (Hardened & Secure)

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
- Supabase Auth (Self-hosted, JWT-based authentication)
- Stripe (Payment processing - LIVE mode)
- Pipedrive (CRM integration)
- Resend API (Email delivery)

**Infrastructure:**
- PM2 (Process management)
- Supabase (Self-hosted via Docker - Auth, PostgreSQL)
- Cloudflare Tunnel (Secure ingress)
- Express static server (Frontend hosting)

---

## Architecture Diagram

\`\`\`
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
                │              │   (Port 5433)    │
                │              │  blackbow DB     │
                │              └───────┬──────────┘
                │                      │
                │              ┌───────▼──────────┐
                └──────────────► External APIs    │
                               │ - Supabase Auth  │
                               │ - Stripe Pay     │
                               │ - Pipedrive CRM  │
                               │ - Resend Email   │
                               └──────────────────┘
\`\`\`

---

## Component Architecture

### 1. Backend API (Port 3450)

**Location:** \`backend/src/\`

**Middleware Stack:**
\`\`\`
Request → CORS → Helmet → Rate Limiting → Body Parser →
Auth (Supabase JWT) → Validation → Route Handler →
Response → Error Handler → Logger
\`\`\`

**Route Groups:**
- \`/api/auth\` - Authentication, email confirmation, current user info
- \`/api/users\` - User profiles, balance management, transactions
- \`/api/leads\` - Lead browsing, purchasing (with row-level locking)
- \`/api/payments\` - Stripe deposits, payment methods
- \`/api/admin\` - User management (view, block, unblock, delete), balance adjustments, CSV import
- \`/api/admin/analytics\` - Dashboard analytics (overview, revenue, users, leads, feedback)
- \`/api/webhooks\` - Stripe, Pipedrive event handlers

**Security Layers:**
1. **Helmet.js security headers** - CSP, HSTS, frame guards, XSS protection
2. **CORS whitelist** - Frontend domain only (production: blackbowassociates.com)
3. **Multi-tier rate limiting** - 5 tiers: general, auth, payment, feedback, analytics
4. **Supabase JWT validation** - Token verification on every protected endpoint
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
- Row-level locking for concurrent purchases (\`SELECT FOR UPDATE\`)
- Atomic operations (\`increment\`/\`decrement\` for balance)
- Prepared statements (SQL injection prevention)
- Transaction-based duplicate detection

**Logging:**
- Winston structured JSON logging
- Daily rotating file transport
- Separate error log stream
- Log retention: 30 days (gzipped)
- Output: \`/var/log/desaas/blackbow-*.log\`
- Production-safe: No sensitive data (passwords, tokens, card numbers)

### 2. Frontend (Port 3001)

**Location:** \`frontend/src/\`

**Architecture Pattern:** Single Page Application (SPA)

**Routing Structure:**
\`\`\`
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
\`\`\`

**State Management:**
- React Context (Supabase auth state)
- Component-local state (useState, useEffect)
- No global state manager (Redux/Zustand not needed)

**API Client:**
- Axios with interceptors
- Supabase JWT token injection (Bearer auth)
- Base URL: \`https://api.blackbowassociates.com\`
- Structured logger (replaces console.log)

**Admin Dashboard Features:**
- Overview tab: KPIs, revenue charts, user growth, vendor distribution
- Users tab: User management (view, block, unblock, delete with confirmation)
- Leads tab: Lead management, CSV import
- Feedback tab: Booking rates, responsiveness analytics, time-to-book metrics

**Build Process:**
\`\`\`
Source (src/) → Vite Build → Optimized Bundle (dist/) →
Express Static Server → Served to users
\`\`\`

### 3. Database Schema

**Core Models:**

\`\`\`
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
└── Relationships: transactions[], purchases[], paymentMethods[], favorites[], leadFeedback[]

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
\`\`\`

**Indexes:**
- Lead.status, Lead.weddingDate (query optimization)
- User.email (unique constraint + fast lookup)
- Transaction.userId, Purchase.userId (relationship queries)
- Transaction.stripePaymentId (duplicate detection)

**CASCADE Constraints:**
- All user relationships use \`ON DELETE CASCADE\` for clean deletion
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
- Webhook events: \`payment_intent.succeeded\`, \`payment_intent.payment_failed\`
- HMAC signature verification (constant-time comparison)
- Transaction-based duplicate detection (prevents double-crediting)
- Amount validation: $20-$10,000 bounds
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
   - ✅ Fixed: Auth routes now protected (\`/api/auth/resend-confirmation\`, \`/api/auth/send-confirmation\`, \`/api/auth/confirm-email\`)
   - ✅ All endpoints have appropriate rate limiting tiers
   - ✅ Strict IP validation (no shared buckets)

2. **Payment Security**
   - ✅ Fixed: Payment webhook race condition (transaction-based duplicate detection)
   - ✅ Added: Amount bounds validation in webhook ($0-$10,000)
   - ✅ Enhanced: Defense-in-depth validation in payment controller
   - ✅ Atomic operations: All balance updates use \`increment\`/\`decrement\`

3. **Input Validation & Sanitization**
   - ✅ Fixed: Pagination parameters validated and bounded (max 100 per page, max page 1000)
   - ✅ Added: User notes sanitization (5000 char limit, trimmed)
   - ✅ Added: Admin reasons sanitization (500 char limit, trimmed)
   - ✅ Enhanced: Feedback validation (enum validation, amount bounds $0-$1M)

4. **SQL Injection Protection**
   - ✅ Verified: Prisma ORM uses parameterized queries exclusively
   - ✅ Verified: \`\$queryRaw\` uses Prisma template literals (safe)
   - ✅ No raw SQL concatenation found

5. **Authentication & Authorization**
   - ✅ Verified: All admin routes require \`requireAuth\` + \`requireAdmin\`
   - ✅ Verified: Email confirmation enforced (except allowed paths)
   - ✅ Verified: User ownership verified for lead operations
   - ✅ Verified: Admin operations protected (cannot block/delete admins)

6. **Error Handling**
   - ✅ Verified: Stack traces only in development mode
   - ✅ Verified: Generic error messages in production
   - ✅ Verified: Full error details logged internally

7. **Security Headers**
   - ✅ Verified: Helmet.js with CSP, HSTS, frame guards
   - ✅ Verified: HSTS with 1-year max-age and preload
   - ✅ Verified: CORS restricted to frontend domain

8. **CSRF Protection**
   - ✅ Verified: Bearer token authentication (stateless, no CSRF vulnerability)

### Localhost-Only Binding

All services bind to \`127.0.0.1\` (localhost), never \`0.0.0.0\`:
- Backend API: \`127.0.0.1:3450\`
- Frontend: \`127.0.0.1:3001\`
- PostgreSQL: \`127.0.0.1:5433\`

External access only via Cloudflare Tunnel (encrypted, authenticated).

### Authentication Layers

**User Authentication:**
1. Supabase JWT token (1-hour expiration)
2. Token validation on every protected endpoint
3. User ID extracted from token claims
4. Email confirmation required (24-hour token expiry)
5. OAuth users auto-confirmed (Google/Facebook pre-verified)

**Admin Authentication:**
1. Supabase JWT token (user must be logged in)
2. User.isAdmin flag check in database
3. Admin verification code (separate secret)
4. AdminVerifiedAt timestamp required

**Email Confirmation:**
1. Cryptographic token (32-byte hex string)
2. 24-hour expiry window
3. Single-use token (deleted after confirmation)
4. Rate limiting: 60-second cooldown on resend

### Input Validation

All user inputs validated with \`express-validator\`:
- Type checking (string, number, email, etc.)
- Length constraints (min/max)
- Format validation (email, phone, dates, enums)
- SQL injection prevention (Prisma parameterized queries)
- Sanitization (trim, substring for length limits)

**Validation Examples:**
- Deposit amount: $20-$10,000 (float, min/max)
- Lead ID: 8 characters, format XX123456
- Email: Standard email format
- Pagination: Integer, min 1, max 100 per page
- Feedback amount: $0-$1,000,000 (float, min/max)

### Race Condition Prevention

**Lead Purchase:**
- Row-level locking: \`SELECT FOR UPDATE\` on Lead table
- Atomic balance check: \`balance: { gte: leadPrice }\` in update
- Atomic decrement: \`balance: { decrement: leadPrice }\`
- Transaction isolation: All operations in single transaction

**Payment Processing:**
- Transaction-based duplicate detection
- Atomic balance increment: \`balance: { increment: amount }\`
- Database-level constraints prevent negative balances
- Webhook and manual verification both check for existing transaction

### Payment Security

**Stripe Integration:**
- HMAC signature verification (constant-time comparison)
- Webhook secret validation
- Amount bounds validation ($20-$10,000)
- Metadata validation (userId must match authenticated user)
- Transaction deduplication (prevents double-crediting)

**Payment Flow Security:**
1. User initiates deposit → Amount validated ($20-$10,000)
2. PaymentIntent created → Metadata includes userId
3. Stripe processes payment → Webhook sent
4. Webhook verified → HMAC signature checked
5. Duplicate check → Transaction table queried
6. Atomic credit → Balance incremented in transaction
7. Transaction record → Created atomically

### Error Handling

**Production Error Responses:**
\`\`\`json
{
  \"error\": {
    \"code\": \"VALIDATION_ERROR\",
    \"message\": \"Deposit amount must be between $20 and $10,000\"
  }
}
\`\`\`

**Development Error Responses:**
\`\`\`json
{
  \"error\": {
    \"code\": \"VALIDATION_ERROR\",
    \"message\": \"Deposit amount must be between $20 and $10,000\",
    \"stack\": \"Error: ...\" // Only in development
  }
}
\`\`\`

**Internal Logging:**
- Full error details logged to Winston
- Stack traces preserved in logs
- User context included (userId, IP, path)
- No sensitive data (passwords, tokens, card numbers)

---

## Data Flow Examples

### Purchase Flow (Critical Path)

\`\`\`
1. User clicks \"Purchase Lead\" in frontend
2. Frontend calls POST /api/leads/:id/purchase (with Supabase token)
3. Backend validates JWT, checks user balance
4. Database transaction begins:
   a. Row-level lock on Lead (SELECT FOR UPDATE)
   b. Check lead.status === 'AVAILABLE'
   c. Check vendor type purchase limit
   d. Check user hasn't already purchased
   e. Atomic balance deduction (balance: { gte: price, decrement: price })
   f. Update lead.status = 'SOLD'
   g. Create Purchase record
   h. Create Transaction record
   i. Commit transaction
5. Backend returns full lead data (unmasked)
6. Frontend displays success + full contact info
\`\`\`

**Concurrency Safety:** Row-level locking prevents race conditions if multiple vendors attempt to purchase the same lead simultaneously.

### Deposit Flow

\`\`\`
1. User enters amount, clicks \"Deposit\" in frontend
2. Frontend calls POST /api/payments/deposit (with Supabase token)
3. Backend validates amount ($20-$10,000)
4. Backend creates Stripe PaymentIntent
5. Frontend displays Stripe payment form
6. User completes payment with Stripe
7. Stripe sends webhook to /api/webhooks/stripe
8. Backend verifies HMAC signature
9. Backend checks for duplicate transaction
10. Backend atomically updates user.balance (increment)
11. Transaction record created with status='completed'
12. Frontend polls or refreshes to show new balance
\`\`\`

**Duplicate Prevention:** Transaction table checked before crediting balance. If \`stripePaymentId\` already exists, skip credit.

### Email Confirmation Flow

\`\`\`
1. User signs up via Supabase Auth
2. Frontend calls POST /api/auth/send-confirmation
3. Backend creates user in DB (if not exists)
4. Backend generates 32-byte hex token
5. Backend sends email via Resend API
6. User clicks confirmation link
7. Frontend calls GET /api/auth/confirm-email/:token
8. Backend validates token (24-hour expiry)
9. Backend sets emailConfirmed = true
10. Backend deletes confirmationToken
11. Frontend redirects to marketplace
\`\`\`

---

## Deployment Architecture

### Process Management (PM2)

**Backend:**
\`\`\`javascript
{
  name: 'blackbow-api',
  script: './dist/index.js',
  instances: 1,
  exec_mode: 'fork',
  env: { NODE_ENV: 'production', PORT: 3450, HOST: '127.0.0.1' },
  max_memory_restart: '500M',
  error_file: '/var/log/desaas/blackbow-error.log',
  out_file: '/var/log/desaas/blackbow-out.log'
}
\`\`\`

**Frontend:**
\`\`\`javascript
{
  name: 'blackbow-frontend',
  script: 'node',
  args: 'server.js',
  instances: 1,
  env: { NODE_ENV: 'production', PORT: 3001, HOST: '127.0.0.1' },
  max_memory_restart: '200M'
}
\`\`\`

### Cloudflare Tunnel Configuration

\`\`\`yaml
# ~/.cloudflared/config.yml
ingress:
  - hostname: blackbowassociates.com
    service: http://127.0.0.1:3001
  - hostname: www.blackbowassociates.com
    service: http://127.0.0.1:3001
  - hostname: api.blackbowassociates.com
    service: http://127.0.0.1:3450
\`\`\`

### Zero-Downtime Deployment

\`\`\`bash
# Backend deployment script
cd backend
git pull origin main
npm install --production
npx prisma generate
pm2 reload blackbow-api  # Zero downtime restart
curl http://localhost:3450/health  # Verify
\`\`\`

---

## Monitoring & Observability

**Structured Logging:**
- Format: JSON (Winston)
- Fields: timestamp, level, message, context (userId, requestId, etc.)
- Rotation: Daily, 30-day retention, gzipped
- Location: \`/var/log/desaas/\`
- Production-safe: No sensitive data (passwords, tokens, card numbers)

**Health Checks:**
- Endpoint: \`GET /health\`
- Checks: Database connectivity, memory usage, uptime
- Response time: <50ms

**Metrics:**
- PM2 monitoring (CPU, memory, restarts)
- PostgreSQL connection pool stats
- Application-level metrics (future: Prometheus)

**Alerts:**
- Telegram notifications for critical errors
- PM2 auto-restart on crashes (max 10 attempts)

---

## Performance Characteristics

**Expected Load:**
- Users: 50-100 concurrent
- Leads: 1000-10000 records
- Transactions: 100-500 per day

**Response Times (targets):**
- API endpoints: <100ms (p95)
- Lead listing: <200ms
- Purchase transaction: <500ms (includes DB lock)
- Frontend page load: <1s

**Resource Usage:**
- Backend: ~110MB memory, <5% CPU (idle)
- Frontend: ~75MB memory, <1% CPU (idle)
- Database: ~50MB memory

---

## Scalability Considerations

**Current Architecture:** Single-instance monolith (suitable for <10K users)

**Future Scaling Options:**
1. **Horizontal Scaling:** PM2 cluster mode (multiple backend instances)
2. **Database:** PostgreSQL replication, read replicas
3. **Caching:** Redis for session/balance caching
4. **CDN:** Cloudflare CDN for static assets
5. **Microservices:** Split auth, payments, leads into separate services

---

## Disaster Recovery

**Database Backups:**
- Frequency: Daily (2:00 AM UTC)
- Method: PostgreSQL pg_dump with gzip compression
- Storage: Local (7-day retention) + Remote (Restic to Raspberry Pi)
- Verification: SHA256 checksums
- Automation: Systemd timer

**Application Recovery:**
- Git repository: Complete source code history
- PM2 ecosystem files: Service configuration preserved
- .env.example: Environment variable template
- Migration history: Database schema versioning

**RTO/RPO:**
- Recovery Time Objective: <1 hour
- Recovery Point Objective: <24 hours (daily backup)

---

## Development Workflow

**Local Development:**
\`\`\`bash
# Backend
cd backend
npm run dev  # Nodemon with hot reload
npx prisma studio  # Database GUI

# Frontend
cd frontend
npm run dev  # Vite dev server with HMR
\`\`\`

**Testing:**
- Manual testing (no automated tests yet)
- Health check verification
- End-to-end workflow testing

**Deployment:**
1. Push to main branch
2. SSH to VPS
3. Run deployment script
4. Verify health checks
5. Monitor logs for errors

---

## Technology Decisions & Trade-offs

**Why Express over Next.js/NestJS?**
- Simplicity: Direct control over middleware
- Performance: Lower overhead than full frameworks
- Familiarity: Team expertise

**Why Prisma over TypeORM/Sequelize?**
- Type safety: Auto-generated TypeScript types
- Developer experience: Intuitive schema definition
- Migrations: Robust migration system

**Why PM2 over Docker/Kubernetes?**
- Simplicity: Lower operational complexity
- Cost: No container orchestration overhead
- Sufficient: Current scale doesn't require containerization

**Why Cloudflare Tunnel over Nginx?**
- Security: No exposed ports, automatic SSL
- DDoS protection: Cloudflare's global network
- Zero configuration: No certificate management

---

## Future Enhancements

**Planned:**
1. Automated testing (Jest, Playwright)
2. Enhanced admin analytics dashboard
3. Email notifications (purchase confirmations)
4. Lead matching algorithm (vendor preferences)
5. Subscription plans (premium vendors)

**Under Consideration:**
1. Mobile app (React Native)
2. Real-time notifications (WebSockets)
3. Multi-language support
4. Vendor verification system

---

**Document Maintained By:** Claude Code (Senior Production Engineer)
**Review Frequency:** Quarterly or on major changes
**Last Security Audit:** November 7, 2025 (v2.1.0)

---

## Security Hardening Update (v2.1.0 - November 7, 2025)

### Comprehensive Security Audit Completed

**Critical Security Fixes Implemented:**

#### 1. Rate Limiting Coverage ✅
- **Fixed:** Auth routes now protected with rate limiting
  -  - 10 req/15min
  -  - 10 req/15min  
  -  - 10 req/15min
- **Verified:** All endpoints have appropriate rate limiting tiers
- **Enhanced:** Strict IP validation (no shared buckets, rejects unknown sources)

#### 2. Payment Security ✅
- **Fixed:** Payment webhook race condition
  - Transaction-based duplicate detection prevents double-crediting
  - Atomic balance operations using Prisma increment/decrement
- **Added:** Amount bounds validation in webhook (---,000)
- **Enhanced:** Defense-in-depth validation in payment controller
- **Verified:** All balance operations use atomic database operations

#### 3. Input Validation & Sanitization ✅
- **Fixed:** Pagination parameters validated and bounded
  - Max 100 items per page
  - Max page number: 1000
  - Integer validation with fallbacks
- **Added:** User notes sanitization (5000 char limit, trimmed)
- **Added:** Admin reasons sanitization (500 char limit, trimmed)
- **Enhanced:** Feedback validation
  - Enum validation for timeToBook
  - Amount bounds: ---ssh -i ~/.ssh/id_ed25519 newadmin@74.50.113.202 "cd ~/projects/blackbow-associates/docs && cat >> architecture.md << 'ENDOFSEC'

---

## Security Hardening Update (v2.1.0 - November 7, 2025)

### Comprehensive Security Audit Completed

**Critical Security Fixes Implemented:**

#### 1. Rate Limiting Coverage ✅
- **Fixed:** Auth routes now protected with rate limiting
  - `/api/auth/resend-confirmation` - 10 req/15min
  - `/api/auth/send-confirmation` - 10 req/15min  
  - `/api/auth/confirm-email/:token` - 10 req/15min
- **Verified:** All endpoints have appropriate rate limiting tiers
- **Enhanced:** Strict IP validation (no shared buckets, rejects unknown sources)

#### 2. Payment Security ✅
- **Fixed:** Payment webhook race condition
  - Transaction-based duplicate detection prevents double-crediting
  - Atomic balance operations using Prisma increment/decrement
- **Added:** Amount bounds validation in webhook ($0-$10,000)
- **Enhanced:** Defense-in-depth validation in payment controller
- **Verified:** All balance operations use atomic database operations

#### 3. Input Validation & Sanitization ✅
- **Fixed:** Pagination parameters validated and bounded
  - Max 100 items per page
  - Max page number: 1000
  - Integer validation with fallbacks
- **Added:** User notes sanitization (5000 char limit, trimmed)
- **Added:** Admin reasons sanitization (500 char limit, trimmed)
- **Enhanced:** Feedback validation
  - Enum validation for timeToBook
  - Amount bounds: $0-$1,000,000
  - Type checking for all fields

#### 4. SQL Injection Protection ✅
- **Verified:** Prisma ORM uses parameterized queries exclusively
- **Verified:** \$queryRaw uses Prisma template literals (safe)
- **Verified:** No raw SQL concatenation found

#### 5. Authentication & Authorization ✅
- **Verified:** All admin routes require requireAuth + requireAdmin
- **Verified:** Email confirmation enforced (except allowed paths)
- **Verified:** User ownership verified for lead operations
- **Verified:** Admin operations protected (cannot block/delete admins)

#### 6. Error Handling ✅
- **Verified:** Stack traces only in development mode
- **Verified:** Generic error messages in production
- **Verified:** Full error details logged internally (Winston)

#### 7. Security Headers ✅
- **Verified:** Helmet.js with CSP, HSTS, frame guards
- **Verified:** HSTS with 1-year max-age and preload
- **Verified:** CORS restricted to frontend domain

#### 8. CSRF Protection ✅
- **Verified:** Bearer token authentication (stateless, no CSRF vulnerability)

### Rate Limiting Tiers (Updated)

| Tier | Endpoints | Limit | Window | Key Strategy |
|------|-----------|-------|--------|--------------|
| General API | All routes | 100 req | 15 min | IP-based |
| Auth | /api/auth/* | 10 req | 15 min | IP-based (strict) |
| Payment | /api/payments/* | 20 req | 1 hour | User ID + IP |
| Feedback | /api/leads/:id/feedback | 5 req | 1 hour | User ID only |
| Analytics | /api/admin/analytics/* | 100 req | 1 hour | User ID + IP |

### Production Security Checklist

- [x] Localhost binding (127.0.0.1 only)
- [x] Rate limiting on all endpoints
- [x] Input validation and sanitization
- [x] SQL injection prevention (Prisma)
- [x] Authentication and authorization
- [x] Error handling (production-safe)
- [x] Security headers (Helmet.js)
- [x] CSRF protection (Bearer tokens)
- [x] Payment security (race conditions prevented)
- [x] Console.log removal (production-ready logging)

**Last Security Audit:** November 7, 2025
**Audit Status:** ✅ All critical vulnerabilities patched
**Production Readiness:** ✅ Hardened and secure

---

## Backup & Recovery

### Automated Backups

**Schedule:** Daily at 2:00 AM UTC (systemd timer)

**Process:**
1. PostgreSQL dump using `pg_dump`
2. Compression with `gzip`
3. SHA256 checksum generation
4. JSON manifest creation
5. Optional Restic upload for remote backup
6. Automatic cleanup of old backups (7-day retention)

**Storage:**
- Local: `backend/backups/dumps/`
- Remote: Raspberry Pi SSD (via Restic)
- Retention: 7 days local, 30 days remote

**Verification:**
- SHA256 checksums verified before restore
- Telegram notifications on success/failure
- Logs: `/var/log/desaas/blackbow-backup.log`

**Manual Backup:**
```bash
cd backend
bash scripts/backup.sh
```

**Restore Procedure:**
```bash
cd backend
bash scripts/restore.sh
# Select backup from list
# Verify checksum
# Confirm restore
```

**Disaster Recovery:**
- RTO: <1 hour
- RPO: <24 hours (daily backup)
