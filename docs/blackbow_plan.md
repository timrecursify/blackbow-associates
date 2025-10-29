# Lead Marketplace Backend Development Plan

## Overview
Transform the newsletter system into a lead marketplace where vendors can purchase wedding leads from Pipedrive. Fixed pricing at $20/lead with Stripe payment processing.

## Phase 1: Project Restructuring & Cleanup

### Remove Newsletter Code
- Delete all Cloudflare Worker code (`src/` directory in root)
- Delete newsletter-related frontend pages (UnsubscribePage, ThankYouPage)
- Remove newsletter services, handlers, templates
- Delete `database-schema.sql`, `docs/`, `test/`, worker configs
- Clean up `public/` to keep only necessary assets

### Reorganize Directory Structure
New structure:
```
BlackBow/
├── backend/              # Node.js + Express + PostgreSQL
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── migrations/
│   ├── package.json
│   └── .env.example
├── frontend/             # React app (existing, updated)
└── README.md
```

## Phase 2: Backend Foundation

### Initialize Node.js Backend
**File**: `backend/package.json`
```json
{
  "name": "blackbow-backend",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.0",
    "dotenv": "^16.3.1",
    "@clerk/clerk-sdk-node": "^4.13.0",
    "stripe": "^14.0.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "express-validator": "^7.0.1",
    "winston": "^3.11.0"
  }
}
```

### Database Schema Design
**File**: `backend/migrations/001_initial_schema.sql`

Key tables:
1. **users** - Vendor accounts (synced with Clerk)
   - id, clerk_user_id, email, business_name, vendor_type, balance, created_at, updated_at
   
2. **leads** - Wedding leads from Pipedrive
   - id, pipedrive_deal_id, wedding_date, location, budget, services_needed, price, status (available/sold), masked_info (for preview), full_info (unlocked after purchase), created_at
   
3. **transactions** - Payment history
   - id, user_id, amount, type (deposit/purchase), stripe_payment_id, balance_after, created_at
   
4. **purchases** - Lead purchases
   - id, user_id, lead_id, amount_paid, purchased_at
   
5. **payment_methods** - Stored payment methods
   - id, user_id, stripe_payment_method_id, last4, brand, is_default, created_at

### Environment Configuration
**File**: `backend/.env.example`
```
DATABASE_URL=postgresql://user:password@localhost:5432/blackbow
PORT=3001
NODE_ENV=development

# Clerk
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Pipedrive
PIPEDRIVE_API_TOKEN=
PIPEDRIVE_WEBHOOK_SECRET=

# App
LEAD_PRICE=20
FRONTEND_URL=http://localhost:5173
```

## Phase 3: Core Backend Services

### Database Service
**File**: `backend/src/config/database.js`
- PostgreSQL connection pool setup
- Query helper functions
- Transaction management

### Clerk Authentication Middleware
**File**: `backend/src/middleware/auth.js`
- Verify Clerk session tokens
- Attach user to request object
- Protected route middleware

### Stripe Service
**File**: `backend/src/services/stripe.js`
- Initialize Stripe client
- Create deposit payment intents
- Store payment methods
- Handle webhooks (payment success, failure)
- Process refunds if needed

### Pipedrive Webhook Handler
**File**: `backend/src/services/pipedrive.js`
- Verify webhook signatures
- Parse deal updates
- Create leads when deals are added
- Update lead status when deal status changes
- Extract and mask contact information

## Phase 4: API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /api/auth/sync` - Sync Clerk user to database
- `GET /api/auth/me` - Get current user profile

### User Routes (`/api/users`)
- `GET /api/users/profile` - Get user profile with balance
- `PUT /api/users/profile` - Update profile
- `GET /api/users/transactions` - Get transaction history
- `GET /api/users/purchases` - Get purchased leads

### Lead Routes (`/api/leads`)
- `GET /api/leads` - List available leads (with masked contact info)
- `GET /api/leads/:id` - Get single lead details (masked if not purchased, full if purchased)
- `POST /api/leads/:id/purchase` - Purchase a lead (deduct from balance)

### Payment Routes (`/api/payments`)
- `POST /api/payments/deposit` - Create deposit payment intent
- `POST /api/payments/webhook` - Stripe webhook handler
- `GET /api/payments/methods` - List payment methods
- `POST /api/payments/methods` - Add payment method
- `DELETE /api/payments/methods/:id` - Remove payment method

### Webhook Routes (`/api/webhooks`)
- `POST /api/webhooks/pipedrive` - Pipedrive webhook handler
- `POST /api/webhooks/stripe` - Stripe webhook handler

## Phase 5: Frontend Updates

### Remove Newsletter Pages
- Delete `LeadsSignupPage.tsx`, `ThankYouPage.tsx`, `UnsubscribePage.tsx`
- Keep `AboutPage.tsx` (update content for marketplace)

### New Pages to Create

#### 1. LoginPage (`frontend/src/pages/LoginPage.tsx`)
- Clerk SignIn component
- Redirect to marketplace after login
- Link to register page

#### 2. RegisterPage (`frontend/src/pages/RegisterPage.tsx`)
- Clerk SignUp component
- Additional fields: business name, vendor type
- Sync with backend after Clerk registration

#### 3. MarketplacePage (`frontend/src/pages/MarketplacePage.tsx`)
Components:
- Header with balance display
- Lead table with columns:
  - Wedding Date
  - Location (city/state only)
  - Budget Range
  - Services Needed
  - Price ($20)
  - Buy Button
- Filters: date range, location, budget, services
- Pagination
- "Insufficient Funds" modal → redirect to deposit

#### 4. AccountPage (`frontend/src/pages/AccountPage.tsx`)
Sections:
- **Profile**: business name, vendor type, email
- **Balance**: current balance, "Add Funds" button
- **Payment Methods**: list saved cards, add/remove
- **My Leads**: table of purchased leads with full contact info
  - Couple Names
  - Email & Phone
  - Wedding Date
  - Full Details
  - Download button
- **Transaction History**: date, type, amount, balance after

#### 5. LeadDetailsPage (`frontend/src/pages/LeadDetailsPage.tsx`)
- Full lead information (only accessible if purchased)
- Contact details revealed
- Notes section
- Export as PDF/CSV option

### Update App Router
**File**: `frontend/src/App.tsx`
```tsx
Routes:
/ → Landing (public) or redirect to /marketplace if logged in
/login → LoginPage
/register → RegisterPage  
/marketplace → MarketplacePage (protected)
/account → AccountPage (protected)
/leads/:id → LeadDetailsPage (protected, ownership check)
/about → AboutPage (public, updated content)
```

### Clerk Integration
**File**: `frontend/src/main.tsx`
- Wrap app with `<ClerkProvider publishableKey={...}>`
- Configure Clerk with publishable key from env
- Set up protected routes using `<SignedIn>` and `<SignedOut>`

### Frontend Dependencies
**File**: `frontend/package.json`
Add:
```json
{
  "@clerk/clerk-react": "^4.27.0",
  "@stripe/stripe-js": "^2.2.0",
  "@stripe/react-stripe-js": "^2.4.0"
}
```

### API Service Updates
**File**: `frontend/src/services/api.ts`
Remove all newsletter API calls, add:
```typescript
// Leads
getLeads(filters?: LeadFilters): Promise<Lead[]>
getLead(id: string): Promise<Lead>
purchaseLead(id: string): Promise<PurchaseResult>
getMyLeads(): Promise<Lead[]>

// User
getUserProfile(): Promise<User>
updateUserProfile(data: UpdateProfileData): Promise<User>
syncUser(clerkUser: ClerkUser): Promise<User>

// Payments
createDeposit(amount: number): Promise<PaymentIntent>
getTransactions(): Promise<Transaction[]>
getPaymentMethods(): Promise<PaymentMethod[]>
addPaymentMethod(paymentMethodId: string): Promise<PaymentMethod>
removePaymentMethod(id: string): Promise<void>
```

## Phase 6: Business Logic Implementation

### Lead Purchase Flow
1. User clicks "Buy Lead" on marketplace
2. Frontend checks user balance (`balance >= $20`)
3. If insufficient: Show deposit modal
4. If sufficient: Call `POST /api/leads/:id/purchase`
5. Backend:
   - Start transaction
   - Lock lead row (FOR UPDATE)
   - Check lead is still available
   - Check user balance >= $20
   - Deduct $20 from user balance
   - Create purchase record
   - Update lead status to "sold"
   - Create transaction record
   - Commit transaction
6. Return full lead info to frontend
7. Update UI: redirect to lead details or show success modal

### Deposit Flow
1. User clicks "Add Funds" on account page
2. Show Stripe payment modal
3. User enters amount (minimum $20) and payment details
4. Frontend calls `POST /api/payments/deposit` with amount
5. Backend creates Stripe PaymentIntent
6. Frontend confirms payment with Stripe
7. Stripe webhook fires on success → `POST /api/webhooks/stripe`
8. Backend webhook handler:
   - Verify webhook signature
   - Add amount to user balance
   - Create transaction record
   - Update user's balance
9. Frontend polls or receives real-time update
10. UI updates with new balance

### Pipedrive Integration Flow
1. New deal added in Pipedrive → webhook fires to `POST /api/webhooks/pipedrive`
2. Backend verifies webhook signature
3. Extract lead information from deal:
   - Couple names (from person/organization)
   - Wedding date (from custom field)
   - Location (from custom field)
   - Budget (from deal value)
   - Services needed (from custom field or tags)
   - Contact info: email, phone
4. Create lead in database:
   - `full_info` JSON: all contact details
   - `masked_info` JSON: 
     - "Couple in [City]" instead of names
     - "555-***-****" for phone
     - No email shown
   - `price`: 20
   - `status`: "available"
   - `pipedrive_deal_id`: for reference
5. Lead immediately appears in marketplace
6. If deal is won/lost in Pipedrive → webhook updates lead status

## Phase 7: Security & Error Handling

### Security Measures
- Helmet.js for secure HTTP headers
- CORS configuration (whitelist frontend URL only)
- Rate limiting on API endpoints (express-rate-limit)
- Input validation with express-validator on all endpoints
- Webhook signature verification (Stripe HMAC, Pipedrive signature)
- SQL injection prevention (parameterized queries with pg)
- Clerk JWT verification for authentication
- Environment variable protection (never expose in responses)
- HTTPS only in production

### Error Handling
- Global error handler middleware
- Structured error responses:
```json
{
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "Balance too low to purchase lead",
    "details": {...}
  }
}
```
- Database transaction rollbacks on failures
- Payment failure recovery (log, notify)
- Logging with winston (info, warn, error levels)
- Error tracking (optional: Sentry)

### Validation Examples
```javascript
// Lead purchase validation
body('leadId').isUUID()
// Deposit validation  
body('amount').isFloat({ min: 20, max: 10000 })
// Profile update validation
body('businessName').trim().isLength({ min: 2, max: 100 })
body('vendorType').isIn(['photographer', 'videographer', 'planner', ...])
```

## Phase 8: Testing & Deployment

### Local Testing Checklist
- [ ] User registration via Clerk
- [ ] User sync to database
- [ ] Deposit funds via Stripe (test mode)
- [ ] View available leads
- [ ] Purchase lead (balance deduction)
- [ ] View purchased lead with full info
- [ ] Pipedrive webhook creates lead
- [ ] Stripe webhook updates balance
- [ ] Payment method management
- [ ] Transaction history display
- [ ] Insufficient funds handling

### Backend Deployment to VPS

#### PostgreSQL Setup
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE blackbow;
CREATE USER blackbow_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE blackbow TO blackbow_user;
```

#### Node.js Backend Deployment
```bash
# Install Node.js (use nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Install PM2
npm install -g pm2

# Clone/upload backend code
cd /var/www/blackbow-backend
npm install --production

# Run migrations
npm run migrate

# Start with PM2
pm2 start src/server.js --name blackbow-api
pm2 save
pm2 startup
```

#### Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name api.blackbowassociates.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### SSL Certificate (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.blackbowassociates.com
```

### Frontend Deployment
```bash
# Update .env with production values
VITE_API_BASE_URL=https://api.blackbowassociates.com
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Build
npm run build

# Deploy dist/ folder to your hosting (Vercel, Netlify, etc.)
```

### Webhook Configuration

#### Stripe Webhooks
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://api.blackbowassociates.com/api/webhooks/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

#### Pipedrive Webhooks
1. Go to Pipedrive → Settings → Webhooks
2. Add subscription: `https://api.blackbowassociates.com/api/webhooks/pipedrive`
3. Select events: `added.deal`, `updated.deal`
4. Copy webhook secret to `PIPEDRIVE_WEBHOOK_SECRET`

## Key Files to Create/Modify

### Backend (New Files)
```
backend/
├── src/
│   ├── server.js                          # Express app entry point
│   ├── config/
│   │   ├── database.js                    # PostgreSQL pool
│   │   └── env.js                         # Environment config
│   ├── middleware/
│   │   ├── auth.js                        # Clerk JWT verification
│   │   ├── errorHandler.js                # Global error handler
│   │   └── validate.js                    # Request validation
│   ├── controllers/
│   │   ├── auth.controller.js             # Auth & user sync
│   │   ├── leads.controller.js            # Lead CRUD & purchase
│   │   ├── users.controller.js            # User profile & transactions
│   │   └── payments.controller.js         # Stripe operations
│   ├── services/
│   │   ├── stripe.service.js              # Stripe integration
│   │   ├── pipedrive.service.js           # Pipedrive webhooks
│   │   └── lead.service.js                # Lead business logic
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── leads.routes.js
│   │   ├── users.routes.js
│   │   ├── payments.routes.js
│   │   └── webhooks.routes.js
│   └── utils/
│       ├── logger.js                      # Winston logger
│       └── helpers.js                     # Utility functions
├── migrations/
│   └── 001_initial_schema.sql
├── package.json
└── .env.example
```

### Frontend (Update/Create)
```
frontend/src/
├── App.tsx                                 # UPDATE: New routing
├── main.tsx                                # UPDATE: Wrap with ClerkProvider
├── pages/
│   ├── LandingPage.tsx                     # UPDATE: Existing landing
│   ├── AboutPage.tsx                       # UPDATE: Marketplace content
│   ├── LoginPage.tsx                       # NEW: Clerk SignIn
│   ├── RegisterPage.tsx                    # NEW: Clerk SignUp
│   ├── MarketplacePage.tsx                 # NEW: Browse & buy leads
│   ├── AccountPage.tsx                     # NEW: Profile, balance, my leads
│   └── LeadDetailsPage.tsx                 # NEW: Full lead info
├── components/
│   ├── Navbar.tsx                          # NEW: Auth-aware nav
│   ├── BalanceDisplay.tsx                  # NEW: Show current balance
│   ├── DepositModal.tsx                    # NEW: Stripe payment modal
│   ├── LeadTable.tsx                       # NEW: Marketplace table
│   └── PurchasedLeadTable.tsx              # NEW: My leads table
└── services/
    └── api.ts                              # UPDATE: New API calls
```

## Implementation Order
1. ✅ Remove newsletter code & reorganize directory structure
2. ✅ Set up backend structure & install dependencies
3. ✅ Create PostgreSQL database & run migrations
4. ✅ Implement Clerk authentication middleware
5. ✅ Build user sync and profile endpoints
6. ✅ Implement Stripe deposit flow (backend)
7. ✅ Build lead CRUD endpoints
8. ✅ Implement lead purchase logic with balance management
9. ✅ Integrate Pipedrive webhooks to create leads
10. ✅ Update frontend: integrate Clerk
11. ✅ Build MarketplacePage UI
12. ✅ Build AccountPage UI with Stripe deposit
13. ✅ Implement lead purchase flow (frontend)
14. ✅ Test complete user journey end-to-end
15. ✅ Deploy backend to VPS
16. ✅ Configure webhooks (Stripe, Pipedrive)
17. ✅ Deploy frontend
18. ✅ Production testing

## Database Schema Details

### users table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    vendor_type VARCHAR(100) NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### leads table
```sql
CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    pipedrive_deal_id INTEGER UNIQUE,
    wedding_date DATE,
    location VARCHAR(255),
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    services_needed TEXT[],
    price DECIMAL(10,2) DEFAULT 20.00,
    status VARCHAR(50) DEFAULT 'available', -- available, sold
    masked_info JSONB,  -- Preview info
    full_info JSONB,    -- Complete contact details
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### transactions table
```sql
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- deposit, purchase
    stripe_payment_id VARCHAR(255),
    balance_after DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### purchases table
```sql
CREATE TABLE purchases (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    lead_id INTEGER REFERENCES leads(id),
    amount_paid DECIMAL(10,2) NOT NULL,
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, lead_id)
);
```

### payment_methods table
```sql
CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    stripe_payment_method_id VARCHAR(255) UNIQUE NOT NULL,
    last4 VARCHAR(4),
    brand VARCHAR(50),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Response Examples

### GET /api/leads (Marketplace)
```json
{
  "leads": [
    {
      "id": 123,
      "wedding_date": "2025-06-15",
      "location": "Austin, TX",
      "budget": "$5,000 - $8,000",
      "services_needed": ["Photography", "Videography"],
      "price": 20.00,
      "status": "available",
      "preview": {
        "couple": "Couple in Austin",
        "venue_type": "Outdoor Garden",
        "guest_count": "100-150"
      }
    }
  ],
  "total": 45,
  "page": 1
}
```

### POST /api/leads/123/purchase (Success)
```json
{
  "success": true,
  "purchase": {
    "id": 456,
    "lead_id": 123,
    "amount_paid": 20.00,
    "purchased_at": "2025-01-15T10:30:00Z"
  },
  "lead": {
    "id": 123,
    "wedding_date": "2025-06-15",
    "location": "Austin, TX",
    "contact": {
      "bride_name": "Sarah Johnson",
      "groom_name": "Mike Smith",
      "email": "sarah.johnson@example.com",
      "phone": "+1-512-555-1234"
    },
    "details": {
      "venue": "Barton Creek Resort",
      "ceremony_time": "5:00 PM",
      "guest_count": 125,
      "notes": "Looking for golden hour outdoor shots"
    }
  },
  "new_balance": 80.00
}
```

### POST /api/payments/deposit (Create Intent)
```json
{
  "clientSecret": "pi_xxx_secret_yyy",
  "amount": 100.00
}
```

## Environment Variables (Production)

### Backend
```bash
DATABASE_URL=postgresql://blackbow_user:secure_password@localhost:5432/blackbow
PORT=3001
NODE_ENV=production

CLERK_SECRET_KEY=sk_live_xxxxx
CLERK_PUBLISHABLE_KEY=pk_live_xxxxx

STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

PIPEDRIVE_API_TOKEN=xxxxx
PIPEDRIVE_WEBHOOK_SECRET=xxxxx

LEAD_PRICE=20
FRONTEND_URL=https://blackbowassociates.com
```

### Frontend
```bash
VITE_API_BASE_URL=https://api.blackbowassociates.com
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
```

## Success Criteria
- ✅ Users can register with Clerk
- ✅ Users can deposit funds via Stripe
- ✅ Leads auto-create from Pipedrive deals
- ✅ Users can browse leads with masked info
- ✅ Users can purchase leads (balance deducted)
- ✅ Full lead info revealed after purchase
- ✅ Transaction history tracks all activity
- ✅ Payment methods can be saved/removed
- ✅ System handles concurrent purchases safely
- ✅ All webhooks verified and secure

