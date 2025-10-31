# BlackBow Associates - System Architecture

**Last Updated:** October 29, 2025
**Version:** 1.0.0
**Status:** Production-Ready (Pending API Keys)

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
- React Router 7.x (Navigation)

**Authentication & Payments:**
- Clerk (JWT-based authentication)
- Stripe (Payment processing)
- Pipedrive (CRM integration)

**Infrastructure:**
- PM2 (Process management)
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
                               │ - Clerk Auth     │
                               │ - Stripe Pay     │
                               │ - Pipedrive CRM  │
                               └──────────────────┘
```

---

## Component Architecture

### 1. Backend API (Port 3450)

**Location:** `backend/src/`

**Middleware Stack:**
```
Request → CORS → Helmet → Rate Limiting → Body Parser →
Auth (Clerk JWT) → Validation → Route Handler →
Response → Error Handler → Logger
```

**Route Groups:**
- `/api/auth` - Authentication, admin verification, user sync
- `/api/users` - User profiles, balance management, transactions
- `/api/leads` - Lead browsing, purchasing (with row-level locking)
- `/api/payments` - Stripe deposits, payment methods
- `/api/admin` - User management, balance adjustments, CSV import
- `/api/webhooks` - Stripe, Pipedrive, Clerk event handlers

**Security Layers:**
1. Helmet.js security headers
2. CORS whitelist (frontend domain only)
3. Rate limiting (3 tiers: general, strict, webhook)
4. Clerk JWT validation
5. Admin double-authentication (JWT + verification code)
6. Webhook HMAC/secret verification
7. Input validation (express-validator)

**Database Access:**
- Prisma ORM with TypeScript types
- Connection pooling
- Row-level locking for concurrent purchases
- Prepared statements (SQL injection prevention)

**Logging:**
- Winston structured JSON logging
- Daily rotating file transport
- Separate error log stream
- Log retention: 30 days (gzipped)
- Output: `/var/log/desaas/blackbow-*.log`

### 2. Frontend (Port 3001)

**Location:** `frontend/src/`

**Architecture Pattern:** Single Page Application (SPA)

**Routing Structure:**
```
/ (public)                  → Landing page
/marketplace (protected)    → Browse/purchase leads
/account (protected)        → User profile & transactions
/lead/:id (protected)       → Lead details after purchase
/admin-verify (protected)   → Admin code entry
/admin (admin only)         → Admin dashboard
/sign-in, /sign-up         → Clerk auth pages
/unsubscribe/:token        → Email unsubscribe
```

**State Management:**
- React Context (ClerkProvider for auth)
- Component-local state (useState, useEffect)
- No global state manager (Redux/Zustand not needed)

**API Client:**
- Axios with interceptors
- Clerk token injection (Bearer auth)
- Base URL: `https://api.blackbowassociates.com`

**Build Process:**
```
Source (src/) → Vite Build → Optimized Bundle (dist/) →
Express Static Server → Served to users
```

### 3. Database Schema

**6 Core Models:**

```
User (Clerk-synced)
├── id: String (Clerk userId)
├── email: String (unique)
├── name: String
├── balance: Decimal (default: 0)
├── isAdmin: Boolean (default: false)
└── Relationships: transactions[], purchases[], paymentMethods[]

Lead
├── id: String (UUID)
├── status: Enum (available, sold, reserved)
├── price: Decimal (default: 20.00)
├── brideName: String (masked until purchased)
├── groomName: String (masked until purchased)
├── email: String (masked)
├── phone: String (masked)
├── weddingDate: DateTime
├── venue: String
├── location: String
├── budget: Decimal
└── Relationships: purchases[]

Transaction
├── id: String (UUID)
├── userId: String (FK to User)
├── type: Enum (deposit, purchase)
├── amount: Decimal
├── status: Enum (pending, completed, failed)
├── stripePaymentIntentId: String (nullable)
└── Relationships: user

Purchase
├── id: String (UUID)
├── userId: String (FK to User)
├── leadId: String (FK to Lead)
├── pricePaid: Decimal
└── Relationships: user, lead

PaymentMethod
├── id: String (UUID)
├── userId: String (FK to User)
├── stripePaymentMethodId: String
└── Relationships: user

AdminVerification
├── id: String (UUID)
├── userId: String (FK to User)
├── code: String (hashed)
└── Relationships: user
```

**Indexes:**
- Lead.status, Lead.weddingDate (query optimization)
- User.email (unique constraint + fast lookup)
- Transaction.userId, Purchase.userId (relationship queries)

### 4. External Integrations

**Clerk Authentication:**
- Flow: User signs up → Clerk creates account → Webhook syncs to DB
- JWT validation on every protected API call
- User metadata stored in PostgreSQL (balance, purchases)

**Stripe Payments:**
- Flow: User deposits → PaymentIntent → Webhook confirms → Balance updated
- Webhook events: `payment_intent.succeeded`, `payment_intent.payment_failed`
- HMAC signature verification

**Pipedrive CRM:**
- Flow: Deal added/updated → Webhook → Lead created/updated in DB
- Lead data mapped from deal custom fields
- Webhook secret verification

---

## Data Flow Examples

### Purchase Flow (Critical Path)

```
1. User clicks "Purchase Lead" in frontend
2. Frontend calls POST /api/leads/:id/purchase (with Clerk token)
3. Backend validates JWT, checks user balance
4. Database transaction begins:
   a. Row-level lock on Lead (prevents double-purchase)
   b. Check lead.status === 'available'
   c. Deduct user.balance
   d. Update lead.status = 'sold'
   e. Create Purchase record
   f. Create Transaction record
   g. Commit transaction
5. Backend returns full lead data (unmasked)
6. Frontend displays success + full contact info
```

**Concurrency Safety:** Row-level locking prevents race conditions if multiple vendors attempt to purchase the same lead simultaneously.

### Deposit Flow

```
1. User enters amount, clicks "Deposit" in frontend
2. Frontend calls POST /api/payments/deposit (with Clerk token)
3. Backend creates Stripe PaymentIntent
4. Frontend displays Stripe payment form
5. User completes payment with Stripe
6. Stripe sends webhook to /api/webhooks/stripe
7. Backend verifies HMAC, updates user.balance
8. Transaction record created with status='completed'
9. Frontend polls or refreshes to show new balance
```

---

## Security Architecture

### Localhost-Only Binding

All services bind to `127.0.0.1` (localhost), never `0.0.0.0`:
- Backend API: `127.0.0.1:3450`
- Frontend: `127.0.0.1:3001`
- PostgreSQL: `127.0.0.1:5432`

External access only via Cloudflare Tunnel (encrypted, authenticated).

### Authentication Layers

**User Authentication:**
1. Clerk JWT token (15-min expiration)
2. Token validation on every protected endpoint
3. User ID extracted from token claims

**Admin Authentication:**
1. Clerk JWT token (user must be logged in)
2. User.isAdmin flag check in database
3. Admin verification code (separate secret)

### Input Validation

All user inputs validated with `express-validator`:
- Type checking (string, number, email, etc.)
- Length constraints
- Format validation (email, phone, dates)
- SQL injection prevention (Prisma parameterized queries)

### Rate Limiting

Three-tier rate limiting:
1. **General:** 100 requests/15min per IP
2. **Strict:** 10 requests/15min per IP (auth endpoints)
3. **Webhook:** 50 requests/15min per IP

---

## Deployment Architecture

### Process Management (PM2)

**Backend:**
```javascript
// ecosystem.config.cjs
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
```

**Frontend:**
```javascript
// ecosystem.config.cjs
{
  name: 'blackbow-frontend',
  script: 'node',
  args: 'server.js',
  instances: 1,
  env: { NODE_ENV: 'production', PORT: 3001, HOST: '127.0.0.1' },
  max_memory_restart: '200M'
}
```

### Cloudflare Tunnel Configuration

```yaml
# ~/.cloudflared/config.yml
ingress:
  - hostname: blackbowassociates.com
    service: http://127.0.0.1:3001
  - hostname: www.blackbowassociates.com
    service: http://127.0.0.1:3001
  - hostname: api.blackbowassociates.com
    service: http://127.0.0.1:3450
```

### Zero-Downtime Deployment

```bash
# Backend deployment script
cd backend
git pull origin main
npm install --production
npx prisma generate
pm2 reload blackbow-api  # Zero downtime restart
curl http://localhost:3450/health  # Verify
```

---

## Monitoring & Observability

**Structured Logging:**
- Format: JSON (Winston)
- Fields: timestamp, level, message, context (userId, requestId, etc.)
- Rotation: Daily, 30-day retention, gzipped
- Location: `/var/log/desaas/`

**Health Checks:**
- Endpoint: `GET /health`
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
- Backend: ~100MB memory, <5% CPU (idle)
- Frontend: ~50MB memory, <1% CPU (idle)
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
- Frequency: Daily (2:15 AM UTC)
- Method: Restic to Raspberry Pi SSD
- Retention: 30 days
- Verification: Automatic via Telegram alerts

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
```bash
# Backend
cd backend
npm run dev  # Nodemon with hot reload
npx prisma studio  # Database GUI

# Frontend
cd frontend
npm run dev  # Vite dev server with HMR
```

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
2. Admin analytics dashboard
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
