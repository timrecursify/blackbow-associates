# BlackBow Associates - Backend Architecture

**Last Updated:** November 2, 2025
**Version:** 1.6.0

---

## Table of Contents

- [System Overview](#system-overview)
- [Technology Stack](#technology-stack)
- [Architecture Diagram](#architecture-diagram)
- [Directory Structure](#directory-structure)
- [Core Components](#core-components)
- [Data Flow](#data-flow)
- [Database Schema](#database-schema)
- [External Integrations](#external-integrations)
- [Scheduled Jobs](#scheduled-jobs)
- [Security Architecture](#security-architecture)
- [Deployment Architecture](#deployment-architecture)
- [Scalability Considerations](#scalability-considerations)

---

## System Overview

BlackBow Associates backend is a Node.js/Express API service that powers a wedding lead marketplace. The architecture follows a **layered design pattern** with clear separation of concerns:

- **Controllers:** HTTP request handling and response formatting
- **Services:** Business logic and external API integration
- **Repositories:** Data access layer (Prisma ORM)
- **Middleware:** Authentication, validation, error handling, logging
- **Jobs:** Scheduled tasks (cron jobs)

**Design Principles:**
- Single Responsibility Principle (SRP)
- Dependency Injection
- Interface-based design
- Separation of concerns
- Fail-fast with comprehensive error handling

---

## Technology Stack

### Core Runtime
- **Node.js:** v22.18.0 (LTS)
- **Express.js:** 4.x (Web framework)
- **JavaScript:** ES Modules (ESM)

### Database & ORM
- **PostgreSQL:** 15.x (via Supabase Docker)
- **Prisma:** 5.x (ORM with type-safe queries)
- **Database Port:** 5433 (Supabase self-hosted)

### Authentication
- **Supabase Auth:** Self-hosted (Docker stack)
- **JWT:** JSON Web Tokens for session management
- **OAuth Providers:** Google, Facebook

### Payments
- **Stripe SDK:** Payment processing
- **Webhook Handling:** Event-driven updates

### CRM Integration
- **Pipedrive API:** v1 REST API
- **Axios:** HTTP client

### Scheduled Jobs
- **node-cron:** Cron-style task scheduler
- **Timezone:** America/New_York (EST)

### Logging & Monitoring
- **Winston:** Structured JSON logging
- **PM2:** Process management and log aggregation
- **Telegram:** Real-time alerting

### Security
- **express-rate-limit:** Rate limiting
- **helmet:** Enhanced HTTP security headers (CSP, HSTS, XSS protection)
- **cors:** CORS configuration
- **bcrypt:** Password hashing (via Supabase)
- **express-validator:** Input validation
- **Database Backup System:** Automated daily backups with integrity verification

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Cloudflare Tunnel (HTTPS)                         │
│                   api.blackbowassociates.com                             │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ HTTPS + JWT Auth
                             │
┌────────────────────────────▼────────────────────────────────────────────┐
│                        Express.js Application                            │
│                     localhost:3450 (PM2: blackbow-api)                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                │
│  │  Controllers  │  │   Middleware  │  │    Routes     │                │
│  ├───────────────┤  ├───────────────┤  ├───────────────┤                │
│  │ - auth        │  │ - requireAuth │  │ - /api/auth   │                │
│  │ - lead        │  │ - requireAdmin│  │ - /api/leads  │                │
│  │ - user        │  │ - validate    │  │ - /api/users  │                │
│  │ - payment     │  │ - errorHandle │  │ - /api/payment│                │
│  │ - pipedrive   │  │ - logger      │  │ - /api/pipedrive│              │
│  └───────┬───────┘  └───────────────┘  └───────────────┘                │
│          │                                                                │
│          ▼                                                                │
│  ┌───────────────────────────────────────────────────────┐               │
│  │                      Services                          │               │
│  ├───────────────────────────────────────────────────────┤               │
│  │ - lead.service.js        │ - user.service.js         │               │
│  │ - payment.service.js     │ - stripe.service.js       │               │
│  │ - pipedrive.service.js   │ - pipedrive-metadata.service.js│          │
│  │ - telegram.service.js    │ - supabase.service.js     │               │
│  └───────┬──────────────────────────────────────┬────────┘               │
│          │                                       │                        │
│          ▼                                       ▼                        │
│  ┌────────────────┐                    ┌────────────────┐                │
│  │  Prisma Client │                    │  External APIs │                │
│  │  (ORM Layer)   │                    │  - Stripe      │                │
│  └────────┬───────┘                    │  - Pipedrive   │                │
│           │                             │  - Telegram    │                │
│           │                             └────────────────┘                │
│           │                                                                │
│  ┌────────▼───────────────────────────────────────────────┐              │
│  │                   Scheduled Jobs (node-cron)            │              │
│  ├─────────────────────────────────────────────────────────┤              │
│  │ - pipedrive-sync.job.js (8am, 11am, 2pm, 5pm EST)     │              │
│  └─────────────────────────────────────────────────────────┘              │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
                             │                    │
                             ▼                    ▼
┌──────────────────────┐  ┌─────────────────┐  ┌──────────────────┐
│   Supabase Auth      │  │    Supabase     │  │  External APIs   │
│   localhost:9999     │  │   PostgreSQL    │  │                  │
│   (Admin API)        │  │  localhost:5433 │  │  - Stripe        │
└──────────────────────┘  └─────────────────┘  │  - Pipedrive     │
                                                │  - Telegram      │
                                                └──────────────────┘
```

---

## Directory Structure

```
backend/
├── src/
│   ├── controllers/          # HTTP request handlers
│   │   ├── auth.controller.js
│   │   ├── lead.controller.js
│   │   ├── user.controller.js
│   │   ├── payment.controller.js
│   │   └── pipedrive.controller.js
│   │
│   ├── services/             # Business logic
│   │   ├── lead.service.js
│   │   ├── user.service.js
│   │   ├── payment.service.js
│   │   ├── stripe.service.js
│   │   ├── pipedrive.service.js
│   │   ├── pipedrive-metadata.service.js
│   │   ├── telegram.service.js
│   │   └── supabase.service.js
│   │
│   ├── jobs/                 # Scheduled tasks
│   │   └── pipedrive-sync.job.js
│   │
│   ├── middleware/           # Express middleware
│   │   ├── auth.middleware.js
│   │   ├── validate.middleware.js
│   │   ├── error.middleware.js
│   │   └── logger.middleware.js
│   │
│   ├── routes/               # API routes
│   │   ├── auth.routes.js
│   │   ├── lead.routes.js
│   │   ├── user.routes.js
│   │   ├── payment.routes.js
│   │   └── pipedrive.routes.js
│   │
│   ├── utils/                # Utilities
│   │   ├── logger.js
│   │   ├── leadIdGeneratorV2.js
│   │   └── validation.js
│   │
│   └── index.js              # Entry point
│
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Database migrations
│
├── ecosystem.config.js       # PM2 configuration
├── package.json
├── .env                      # Environment variables
├── CHANGELOG.md
└── README.md
```

---

## Core Components

### 1. Controllers

**Responsibility:** HTTP request/response handling

**Key Controllers:**
- **auth.controller.js:** User sync from Supabase Auth
- **lead.controller.js:** Lead marketplace operations (get, search, favorite)
- **user.controller.js:** User profile, billing address, balance
- **payment.controller.js:** Stripe deposit, lead purchase
- **pipedrive.controller.js:** Manual sync trigger, sync status

**Pattern:**
```javascript
export const getLeads = asyncHandler(async (req, res) => {
  // 1. Extract and validate request data
  const { favoritesOnly, search } = req.query;
  const userId = req.user.id;

  // 2. Delegate to service layer
  const leads = await leadService.getLeads(userId, { favoritesOnly, search });

  // 3. Format and send response
  res.json({ success: true, data: leads });
});
```

### 2. Services

**Responsibility:** Business logic and external API integration

**Key Services:**
- **lead.service.js:** Lead CRUD, filtering, favorites
- **user.service.js:** User management, balance updates
- **payment.service.js:** Transaction processing, Stripe integration
- **pipedrive.service.js:** Pipedrive API calls, deal transformation
- **pipedrive-metadata.service.js:** Pipeline/stage discovery, caching
- **telegram.service.js:** Notification alerts

**Pattern:**
```javascript
export const getLeads = async (userId, filters = {}) => {
  // 1. Fetch data from database
  const leads = await prisma.lead.findMany({ where: { active: true } });

  // 2. Apply business logic
  const userFavorites = await prisma.userLeadFavorite.findMany({
    where: { userId }
  });

  // 3. Enrich data
  return leads.map(lead => ({
    ...lead,
    isFavorited: userFavorites.some(fav => fav.leadId === lead.id)
  }));
};
```

### 3. Middleware

**Responsibility:** Cross-cutting concerns (auth, logging, error handling)

**Key Middleware:**
- **requireAuth:** JWT verification and user extraction
- **requireAdmin:** Admin role verification
- **validate:** Request payload validation
- **errorHandler:** Global error handling
- **requestLogger:** Winston logging integration

**Pattern:**
```javascript
export const requireAuth = async (req, res, next) => {
  try {
    // 1. Extract JWT from Authorization header
    const token = req.headers.authorization?.split(' ')[1];

    // 2. Verify with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    // 3. Attach user to request
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};
```

### 4. Scheduled Jobs

**Responsibility:** Automated background tasks

**Jobs:**
- **pipedrive-sync.job.js:** Automated lead sync (4x daily)

**Pattern:**
```javascript
export const initCronScheduler = () => {
  cron.schedule('0 8,11,14,17 * * *', async () => {
    try {
      await scheduledSync();
    } catch (error) {
      logger.error('Cron job failed:', error);
    }
  }, {
    scheduled: true,
    timezone: 'America/New_York'
  });
};
```

---

## Data Flow

### 1. Lead Purchase Flow

```
User Request (Frontend)
  │
  ▼
POST /api/payment/purchase-lead/:leadId
  │
  ▼
requireAuth middleware
  ├─ Verify JWT token with Supabase
  ├─ Extract user from token
  └─ Attach user to req.user
  │
  ▼
validate middleware
  ├─ Validate leadId format
  └─ Check request body
  │
  ▼
payment.controller.purchaseLead()
  │
  ▼
payment.service.purchaseLead()
  ├─ Check user balance >= lead price
  ├─ Check lead not already purchased
  ├─ BEGIN TRANSACTION
  │   ├─ Create Purchase record
  │   ├─ Create Transaction record (LEAD_PURCHASE)
  │   ├─ Update User balance (-$20)
  │   └─ Update Lead status (SOLD)
  └─ COMMIT TRANSACTION
  │
  ▼
Response: { success: true, purchase: {...} }
```

### 2. Pipedrive Sync Flow

```
Cron Trigger (8am, 11am, 2pm, 5pm EST)
  │
  ▼
pipedrive-sync.job.scheduledSync()
  │
  ├─ Check if sync already in progress
  │  └─ If yes: Skip and log warning
  │
  ├─ Set isSyncing = true
  │
  ├─ Fetch exclusion lists
  │  ├─ pipedrive-metadata.getExcludedPipelineIds()
  │  │  ├─ Check cache (1-hour TTL)
  │  │  └─ If expired: Fetch from Pipedrive API
  │  │
  │  └─ pipedrive-metadata.getExcludedStageIds()
  │     ├─ Check cache (1-hour TTL)
  │     └─ If expired: Fetch from Pipedrive API
  │
  ├─ Fetch eligible deals
  │  └─ pipedrive.service.fetchEligibleDeals()
  │     ├─ Fetch ALL deals with pagination (sort: add_time DESC)
  │     │  └─ While more_items_in_collection:
  │     │     ├─ GET /deals?start=N&limit=500
  │     │     └─ Accumulate results
  │     │
  │     └─ Filter deals:
  │        ├─ Date range: 3 days to 2 months old
  │        ├─ Exclude Production pipeline
  │        └─ Exclude specific stages (Lorena & Maureen)
  │
  ├─ Process each eligible deal
  │  ├─ pipedrive.service.transformDealToLead()
  │  │  ├─ Fetch person data (contact info)
  │  │  ├─ Extract city, state, wedding date
  │  │  ├─ Generate lead ID (state + city + random)
  │  │  └─ Build lead object
  │  │
  │  └─ Upsert to database
  │     ├─ Check if exists (by pipedriveDealId)
  │     ├─ If exists: UPDATE
  │     └─ If new: CREATE
  │
  ├─ Log statistics
  │  ├─ imported: X
  │  ├─ updated: Y
  │  ├─ failed: Z
  │  └─ duration: Ns
  │
  ├─ Send Telegram notification (if failures > 0)
  │  └─ telegram.service.sendAlert()
  │
  └─ Set isSyncing = false
```

### 3. Lead Feedback Flow

```
User Request (Frontend)
  │
  ▼
POST /api/leads/:leadId/feedback
  │
  ▼
requireAuth middleware
  │
  ▼
validate middleware
  ├─ Validate booked (boolean)
  ├─ Validate leadResponsive (enum)
  ├─ Validate timeToBook (optional, integer)
  └─ Validate amountCharged (optional, decimal)
  │
  ▼
lead.controller.submitFeedback()
  │
  ▼
lead.service.submitFeedback()
  ├─ Verify user purchased this lead
  ├─ Check if feedback already exists
  ├─ BEGIN TRANSACTION
  │   ├─ Create LeadFeedback record
  │   ├─ Create Transaction record (FEEDBACK_REWARD, +$2)
  │   └─ Update User balance (+$2)
  └─ COMMIT TRANSACTION
  │
  ▼
Response: { success: true, reward: 2.00 }
```

---

## Database Schema

### Core Tables

#### users
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  supabase_user_id UUID UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  balance DECIMAL(10, 2) DEFAULT 100.00,
  billing_address_line1 TEXT,
  billing_address_line2 TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_zip TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### leads
```sql
CREATE TABLE leads (
  id TEXT PRIMARY KEY,  -- 8-char format: XX123456
  pipedrive_deal_id INTEGER UNIQUE,
  wedding_date DATE,
  city TEXT,
  state TEXT,
  location TEXT,
  description TEXT,
  ethnic_religious TEXT,
  first_name TEXT,       -- Hidden until purchase
  last_name TEXT,        -- Hidden until purchase
  email TEXT,            -- Hidden until purchase
  phone TEXT,            -- Hidden until purchase
  price DECIMAL(10, 2) DEFAULT 20.00,
  status TEXT DEFAULT 'AVAILABLE',  -- AVAILABLE, SOLD
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### purchases
```sql
CREATE TABLE purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  lead_id TEXT REFERENCES leads(id),
  price DECIMAL(10, 2) NOT NULL,
  purchased_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, lead_id)
);
```

#### transactions
```sql
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  type TEXT NOT NULL,  -- DEPOSIT, LEAD_PURCHASE, FEEDBACK_REWARD
  amount DECIMAL(10, 2) NOT NULL,
  stripe_payment_intent_id TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### user_lead_favorites
```sql
CREATE TABLE user_lead_favorites (
  user_id TEXT REFERENCES users(id),
  lead_id TEXT REFERENCES leads(id),
  created_at TIMESTAMP DEFAULT NOW(),

  PRIMARY KEY (user_id, lead_id)
);
```

#### lead_feedback
```sql
CREATE TABLE lead_feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  lead_id TEXT REFERENCES leads(id),
  booked BOOLEAN NOT NULL,
  lead_responsive TEXT NOT NULL,  -- 'responsive', 'ghosted', 'partial'
  time_to_book INTEGER,
  amount_charged DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, lead_id)
);
```

### Indexes

```sql
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_wedding_date ON leads(wedding_date);
CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_feedback_user_id ON lead_feedback(user_id);
CREATE INDEX idx_feedback_booked ON lead_feedback(booked);
```

---

## External Integrations

### 1. Supabase Auth

**Purpose:** User authentication (OAuth + email/password)

**Endpoints Used:**
- `POST /auth/v1/token` - Get JWT token
- `GET /auth/v1/user` - Verify JWT and get user data

**Configuration:**
```javascript
const supabase = createClient(
  'http://localhost:8304',
  process.env.SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  'http://localhost:9999',  // Direct to Auth service (bypass Kong)
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'auth' } }
);
```

**Flow:**
1. User signs in via frontend (Google/Facebook/Email)
2. Frontend receives JWT token from Supabase
3. Frontend sends JWT in Authorization header
4. Backend verifies JWT with `supabase.auth.getUser(token)`
5. Backend syncs user to local database

### 2. Stripe

**Purpose:** Payment processing (deposits, payouts)

**Endpoints Used:**
- `POST /v1/checkout/sessions` - Create checkout session
- `POST /v1/webhooks` - Handle webhook events

**Configuration:**
```javascript
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
```

**Flow:**
1. User requests deposit
2. Backend creates Stripe checkout session
3. User redirected to Stripe hosted page
4. User completes payment
5. Stripe sends webhook to `/api/payment/webhook`
6. Backend verifies webhook signature
7. Backend updates user balance

### 3. Pipedrive

**Purpose:** CRM integration, lead import

**Endpoints Used:**
- `GET /v1/pipelines` - Fetch all pipelines
- `GET /v1/stages` - Fetch all stages
- `GET /v1/deals` - Fetch deals (paginated)
- `GET /v1/persons/:id` - Fetch person details

**Configuration:**
```javascript
const PIPEDRIVE_BASE_URL = 'https://api.pipedrive.com/v1';
axios.get(`${PIPEDRIVE_BASE_URL}/deals`, {
  params: { api_token: process.env.PIPEDRIVE_API_TOKEN }
});
```

**Flow:**
1. Cron job triggers every 4 hours (8am, 11am, 2pm, 5pm EST)
2. Fetch pipelines and stages (cached 1 hour)
3. Fetch ALL deals with pagination (max 500 per request)
4. Filter deals by business rules
5. Transform deals to leads
6. Upsert to database

### 4. Telegram

**Purpose:** Real-time alerting

**Endpoints Used:**
- `POST /bot{token}/sendMessage` - Send alert message

**Configuration:**
```javascript
await axios.post(
  `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
  {
    chat_id: TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: 'Markdown'
  }
);
```

**Alerts:**
- Pipedrive sync failures
- Database connection errors
- Uncaught exceptions

---

## Scheduled Jobs

### Pipedrive Sync Job

**Schedule:** 4 times daily

| Time (EST) | Cron Expression | Purpose |
|------------|-----------------|---------|
| 8:00 AM    | `0 8 * * *`     | Morning sync |
| 11:00 AM   | `0 11 * * *`    | Mid-day sync |
| 2:00 PM    | `0 14 * * *`    | Afternoon sync |
| 5:00 PM    | `0 17 * * *`    | Evening sync |

**Combined Cron:** `0 8,11,14,17 * * *`

**Business Rules:**
- ✅ Date range: 3 days to 2 months old
- ✅ All statuses (open, won, lost)
- ❌ Exclude "Production" pipeline
- ❌ Exclude 5 stages in Lorena & Maureen pipelines:
  - "Lead In", "In Contact", "Quote Sent", "Quote Accepted", "Invoice sent"

**Metadata Caching:**
- Cache TTL: 1 hour
- Reduces API calls to Pipedrive
- Automatically refreshes when expired

**Error Handling:**
- Failed imports logged individually
- Sync continues even if some deals fail
- Telegram alert sent if failures > 0
- Statistics logged for monitoring

---

## Security Architecture

### 1. Network Security

**Localhost Binding:**
- All services bind to `127.0.0.1` only (no external exposure)
- Cloudflare Tunnel provides HTTPS access
- No firewall rules needed (ports not exposed)

**HTTPS/TLS:**
- Cloudflare Tunnel provides automatic HTTPS
- HSTS enabled (1 year, includeSubDomains, preload)
- TLS 1.3 enforced

### 2. Application Security

**Security Headers (Helmet.js):**
- **Content Security Policy (CSP)** - Strict directives for resource loading
- **HTTP Strict Transport Security (HSTS)** - 1 year, includeSubDomains, preload
- **XSS Protection** - Enabled with filter
- **Frame Guard** - Deny all frames
- **Referrer Policy** - strict-origin-when-cross-origin
- **Permissions Policy** - Geolocation, microphone, camera disabled

**Input Validation:**
- All endpoints use `express-validator` middleware
- Business logic validation (e.g., deposit amounts, lead IDs)
- SQL injection prevention via Prisma parameterized queries

**Rate Limiting:**
- **General API**: 100 requests per 15 minutes per IP/user
- **Authentication**: 10 requests per 15 minutes per IP
- **Payments**: 20 requests per hour per IP/user
- **Analytics**: 100 requests per hour per admin user
- **Feedback**: 5 submissions per hour per user (v1.8.0 - prevents reward spam)
- **Strict IP Validation**: No shared 'unknown' buckets (v1.8.0 - prevents bypasses)

**Transaction Safety (v1.8.0 Security Hardening):**
- **Atomic Operations**: All balance changes use atomic `increment`/`decrement` with WHERE constraints
- **Row-Level Locking**: Lead purchases use `SELECT ... FOR UPDATE` to prevent race conditions
- **Transaction Deduplication**: Payment verification uses transaction-based duplicate detection
- **Blocked User Enforcement**: Blocked users rejected at authentication middleware layer
- **Constant-Time Comparisons**: Webhook secrets verified with `crypto.timingSafeEqual()`
- **Admin Bounds Validation**: Balance adjustments limited to ±$10,000 per operation
- **PCI-DSS Log Compliance**: Payment error logs sanitized to exclude card details

### 3. Authentication & Authorization

**JWT Authentication:**
- Supabase Auth provides JWT tokens
- Tokens verified on every protected request
- Token expiration handled by Supabase

**Role-Based Access Control:**
- Admin users: `isAdmin = true` + `adminVerifiedAt` set
- Regular users: Standard marketplace access
- Admin middleware: `requireAdmin` enforces admin-only routes

**Webhook Verification:**
- Stripe webhooks: HMAC signature verification (Stripe SDK handles constant-time comparison)
- Pipedrive webhooks: Constant-time secret comparison via `crypto.timingSafeEqual()` (v1.8.0)

### 4. Data Security

**Database Security:**
- Parameterized queries via Prisma (SQL injection prevention)
- Connection pooling for performance
- Environment variable credentials (never hardcoded)

**Backup Security:**
- Automated daily backups with SHA256 checksums
- Compressed backups (gzip)
- JSON manifests with metadata
- 7-day local retention with automatic cleanup
- Optional Restic integration for remote encrypted backups

**Error Handling:**
- No sensitive data in error messages (production)
- Structured logging without credentials
- Audit logging for admin actions

### 5. Secrets Management

**Environment Variables:**
- All secrets in `.env` file (not committed)
- `.gitignore` excludes `.env` and backup files
- No hardcoded credentials in codebase

**Key Management:**
- Supabase keys: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`
- Stripe keys: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Pipedrive: `PIPEDRIVE_API_TOKEN`, `PIPEDRIVE_WEBHOOK_SECRET`
- Different secrets per environment (dev/staging/prod)

### 6. Backup System

**Automated Backups:**
- **Schedule**: Daily at 2:00 AM UTC via systemd timer
- **Script**: `scripts/backup.sh` with PostgreSQL backup
- **Compression**: gzip compression
- **Integrity**: SHA256 checksums for verification
- **Manifests**: JSON files with backup metadata
- **Retention**: 7 days local, optional Restic remote

**Restore Capability:**
- **Script**: `scripts/restore.sh` with integrity verification
- **Safety**: Confirmation prompts (with `--force` override)
- **Verification**: Checksum validation before restore

See [docs/BACKUP.md](BACKUP.md) for complete backup documentation.

---

## Deployment Architecture

### PM2 Configuration

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'blackbow-api',
    script: 'src/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3450
    },
    error_file: '/var/log/desaas/blackbow-api-error.log',
    out_file: '/var/log/desaas/blackbow-api-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '500M'
  }]
};
```

**Deployment Commands:**
```bash
# Zero-downtime reload
pm2 reload blackbow-api

# Restart (brief downtime)
pm2 restart blackbow-api

# Logs
pm2 logs blackbow-api

# Monitoring
pm2 monit
```

### Cloudflare Tunnel

**Configuration:**
```yaml
ingress:
  - hostname: api.blackbowassociates.com
    service: http://localhost:3450
```

**Benefits:**
- HTTPS automatic
- DDoS protection
- No exposed ports (all traffic via tunnel)
- Zero-trust network access

---

## Scalability Considerations

### Current Limits

- **Concurrent Users:** ~100 (single PM2 instance)
- **Database Connections:** 10 (Prisma default pool)
- **Memory:** ~125MB per instance
- **Requests/sec:** ~50 (rate limited to 100/15min)

### Horizontal Scaling Strategy

**Step 1: PM2 Cluster Mode**
```javascript
{
  instances: 4,  // 4 instances (1 per CPU core)
  exec_mode: 'cluster'
}
```

**Step 2: Database Connection Pooling**
```javascript
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  connection_limit = 20  // Increase pool
}
```

**Step 3: Caching Layer**
```javascript
// Redis for session storage and lead caching
const redis = new Redis({
  host: 'localhost',
  port: 6379
});
```

**Step 4: Load Balancer**
```
Cloudflare Tunnel → nginx → PM2 Cluster (4 instances)
```

### Performance Optimization

**Database Indexing:**
- All foreign keys indexed
- `status` column on leads table
- `wedding_date` for date range queries

**Query Optimization:**
- Prisma `select` to limit fields
- Pagination on all list endpoints
- Lazy loading for relationships

**Caching:**
- Pipedrive metadata: 1-hour cache
- Lead list: Consider Redis cache (future)

---

**Last Updated:** November 1, 2025
**Maintained by:** Claude Code
**Generated with:** [Claude Code](https://claude.com/claude-code)
