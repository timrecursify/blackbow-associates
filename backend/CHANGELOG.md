# Changelog
All notable changes to BlackBow Associates Backend will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.8.0] - 2025-11-03

### Security
- **🔒 CRITICAL SECURITY FIXES** - 9 vulnerabilities patched

  **CRITICAL (4 fixes):**
  1. **Blocked User Authentication Bypass** (`auth.js:335-349`)
     - Added enforcement check to reject blocked users at authentication layer
     - Blocked users now receive HTTP 403 with reason from database
     - Prevents banned accounts from accessing any protected routes

  2. **Race Condition in Balance Deduction** (`leadsPurchaseController.js:70-103`)
     - Replaced manual balance calculation with atomic `{ decrement }` operation
     - Added WHERE constraint to prevent updates if insufficient funds
     - Eliminates race condition that could cause negative balances

  3. **Race Condition in Lead Purchase** (`leadsPurchaseController.js:27-37`)
     - Implemented row-level locking with `SELECT ... FOR UPDATE`
     - Ensures only one purchase can proceed at a time per lead
     - Prevents double-purchasing by concurrent requests

  4. **Payment Double-Crediting Vulnerability** (`payments.controller.js:169-225`)
     - Wrapped payment verification in atomic Prisma transaction
     - Added duplicate payment detection before crediting balance
     - Prevents webhook + manual verification from both crediting same payment

  **HIGH PRIORITY (5 fixes):**
  5. **Feedback Reward Spam Prevention** (`rateLimiter.js:127-162`, `leads.routes.js:27`)
     - Added strict rate limiter: 5 feedback submissions per hour per user
     - Prevents unlimited $2 reward farming through spam submissions
     - Uses user-specific keys to prevent sharing rate limit buckets

  6. **Webhook Timing Attack Vulnerability** (`webhooks.controller.js:111-137`)
     - Replaced string comparison (`!==`) with `crypto.timingSafeEqual()`
     - Implements constant-time comparison to prevent timing attacks
     - Protects Pipedrive webhook secret from brute-force attempts

  7. **Admin Balance Adjustment Abuse** (`admin.controller.js:144-230`)
     - Added strict bounds: -$10,000 to +$10,000 per adjustment
     - Implemented atomic increment/decrement operations
     - Requires non-empty reason for all adjustments
     - Prevents unlimited fund creation by admin accounts

  8. **Rate Limiter IP Bypass** (`rateLimiter.js:4-24`)
     - Replaced 'unknown' fallback with strict validation
     - Rejects requests without proper IP or user identification
     - Prevents attackers from bypassing rate limits via shared bucket

  9. **Webhook Sensitive Data Logging** (`webhooks.controller.js:82-108`)
     - Sanitized payment error logs to exclude card details
     - Only logs error codes, types, and decline codes
     - Prevents PCI-DSS violations from logging payment method data

### Changed
- **Enhanced Security Posture**
  - All financial operations now use atomic database operations
  - All webhook authentications use constant-time comparisons
  - All rate limiters enforce strict client identification
  - All logs sanitized to exclude sensitive payment data

### Fixed
- Race conditions in concurrent purchase scenarios
- Missing authentication checks for blocked users
- Timing attack vulnerabilities in webhook verification
- Information disclosure through verbose error logging

### Deployment
- Zero-downtime PM2 reload completed successfully
- Health check: ✅ Responding in 3ms
- Database: ✅ Connected
- Build validation: ✅ Zero syntax errors
- Frontend build: ✅ Zero TypeScript errors
- Logs: ✅ Zero errors post-deployment
- Memory: 123MB (healthy)
- Status: Production-stable

### Technical Debt Resolved
- ✅ All race conditions in financial transactions eliminated
- ✅ PCI-DSS compliance improved (no card data in logs)
- ✅ Rate limiting hardened against bypass attacks
- ✅ Admin operations protected with bounds validation
- ✅ Webhook security strengthened against timing attacks

---

## [1.7.0] - 2025-11-03

### Changed
- **Code Refactoring for Production Standards**
  - Split `analyticsController.js` (1,044 lines) into 6 modular files:
    - `analytics/analyticsHelpers.js` - Shared utility functions
    - `analytics/analyticsOverviewController.js` - KPI overview & CSV export (181 lines)
    - `analytics/analyticsRevenueController.js` - Revenue analytics & growth (270 lines)
    - `analytics/analyticsUsersController.js` - User analytics & engagement (253 lines)
    - `analytics/analyticsLeadsController.js` - Lead performance analytics (119 lines)
    - `analytics/analyticsFeedbackController.js` - Feedback & booking analytics (147 lines)
  - Split `leads.controller.js` (611 lines) into 4 modular files:
    - `leads/leadsHelpers.js` - Shared utility functions & tag calculation
    - `leads/leadsMarketplaceController.js` - Browse/filter/view leads (218 lines)
    - `leads/leadsPurchaseController.js` - Purchase logic & feedback (267 lines)
    - `leads/leadsFavoritesController.js` - Favorites system (135 lines)
  - **All files now comply with 500-line production standard**
  - Updated route imports in `analyticsRoutes.js` and `leads.routes.js`

### Added
- **Build Validation Script** (`npm run validate`)
  - Syntax validation using `node --check`
  - Ensures code passes before deployment
  - Zero errors confirmed for production deployment

### Fixed
- **TypeScript Configuration** - Added validation script to leverage existing `tsconfig.json` for IDE support
- **Documentation Updates** - Updated `docs/status.md` to reflect current Supabase authentication (removed outdated Clerk references)

### Deployment
- Zero-downtime PM2 reload completed successfully
- Health check: ✅ Responding in 3ms
- Database: ✅ Connected
- Logs: ✅ Zero errors post-deployment
- Uptime after reload: Stable

### Technical Debt Resolved
- ✅ All production code files now under 500 lines
- ✅ Improved maintainability with modular controller architecture
- ✅ Enhanced code organization following single responsibility principle
- ✅ Better separation of concerns (marketplace, purchase, favorites, analytics categories)

---

## [1.5.0] - 2025-11-01

### Added
- **Pipedrive Automated Sync Scheduler**
  - Scheduled sync service running 4 times daily (8am, 11am, 2pm, 5pm EST)
  - Cron scheduler using node-cron with America/New_York timezone
  - Concurrent sync prevention flag to avoid overlapping imports
  - Comprehensive logging with statistics (imported, updated, failed counts)
  - Duration tracking for performance monitoring

- **Pipeline/Stage Metadata Service** (`src/services/pipedrive-metadata.service.js`)
  - Dynamic Pipedrive API integration for pipeline/stage discovery
  - 1-hour metadata cache to reduce API calls
  - Automatic exclusion map building by name matching
  - Functions: `fetchPipelines()`, `fetchStages()`, `buildExclusionMap()`, `getExcludedStageIds()`, `getExcludedPipelineIds()`

- **Scheduled Sync Job** (`src/jobs/pipedrive-sync.job.js`)
  - Main orchestration logic for automated imports
  - Telegram notification integration for failures
  - Sync status tracking (last run time, results, errors)
  - Manual trigger support via API endpoint

- **Intelligent Lead Filtering**
  - Date range: 3 days to 2 months old (based on deal creation date)
  - Status filter: All statuses included (open, won, lost)
  - Pipeline exclusion: "Production" pipeline excluded
  - Stage exclusion: 5 stages in Lorena & Maureen pipelines ("Lead In", "In Contact", "Quote Sent", "Quote Accepted", "Invoice sent")

- **Manual Sync Endpoints**
  - `POST /api/pipedrive/sync-now` - Manually trigger sync (admin only)
  - `GET /api/pipedrive/sync-status` - Check last sync status and results

### Changed
- **Pipedrive Service Enhancements** (`src/services/pipedrive.service.js`)
  - Added `fetchAll` parameter to `fetchDeals()` for pagination support
  - Implemented while loop to fetch all 19,192+ deals (max 500 per request)
  - Added `sort: 'add_time DESC'` to get newest deals first
  - Implemented early exit optimization when past 2-month threshold
  - Fixed pipeline name matching: "lauren" → "loren" to match "Lorena"

- **Cron Scheduler Integration** (`src/index.js`)
  - Added cron scheduler initialization on server startup
  - Imported `initCronScheduler()` from jobs module

### Fixed
- **Critical Pagination Bug**: Was only fetching first 500 deals out of 19,192 total
  - Root cause: No pagination implementation
  - Fix: Implemented pagination loop using `start` offset and `more_items_in_collection` flag

- **Critical Sort Order Bug**: Was fetching oldest deals first (from 2019)
  - Root cause: Default Pipedrive API sort by ID ascending
  - Fix: Added explicit `sort: 'add_time DESC'` parameter

- **Pipeline Name Typo**: Code searched for "lauren" but actual pipeline is "Lorena"
  - Fix: Changed to "loren" to match both "Lorena" and "Lauren"

### Dependencies
- Added `node-cron@^3.0.3` for cron scheduling

### Deployment
- Zero downtime PM2 reload (PID 444400)
- Health check: Passing (10ms response time)
- Memory usage: 118.6 MB

---

## [1.4.0] - 2025-11-01

### Added
- **Lead Feedback System with $2 Reward**
  - `POST /api/leads/:leadId/feedback` endpoint with validation
  - LeadFeedback database model with unique constraint (userId, leadId)
  - Atomic Prisma transactions for feedback + $2 reward + balance update
  - FEEDBACK_REWARD transaction type added to enum
  - `hasFeedback` flag in `getPurchasedLeads()` response

- **Frontend Components**
  - LeadFeedbackModal component (265 lines) - 4-step questionnaire
  - FeedbackSuccessModal component (47 lines) - $2 reward confirmation
  - Conditional "Provide Feedback" button on AccountPage

- **Purchased Leads Page Enhancements**
  - Pagination: 10 leads per page (80% data transfer reduction)
  - Lead IDs: Monospace display with gray styling (#leadId format)
  - NEW badge: Redesigned to match marketplace service tags
  - NEW badge logic: 24-hour rolling window (not calendar day)
  - Green frame highlighting: Restored for NEW leads
  - Page counter: Shows "Page X of Y"
  - Total count: Shows "Showing X of Y leads"

### Fixed
- **CRITICAL: Mobile Sign-Up Phase 2 Bug** (production-blocking)
  - Root cause: Type casting bug accessing `.checked` property on select/textarea elements
  - Fix: Safe property access pattern in `handleChange()` function

- **Step 2 Registration Page CSS Fixes**
  - Fixed malformed flex layout: `to-gray-50s-center` → proper Tailwind classes
  - Fixed invisible step indicator numbers: Added `text-white` and `text-gray-600`
  - Fixed error box styling: Added border, padding, rounded corners

- **Error Box Styling Consistency** across all auth pages

- **Marketplace Pagination Visibility**
  - Fixed black-on-black text for active page
  - Added `text-white` class for visibility

- **Marketplace Lead Count Display**
  - Updated format from "20 leads" to "20 of 50 leads"

### Database
- Migration: `lead_feedback` table created
  - Unique constraint: (userId, leadId)
  - Indexes: userId, leadId, booked columns
  - Foreign keys: Cascade delete

---

## [1.3.1] - 2025-11-01

### Fixed
- **CRITICAL OUTAGE: 502 Bad Gateway** at auth.blackbowassociates.com
  - Root cause: All 13 Supabase Docker containers stopped
  - Fixed docker-compose.yml: Boolean environment variables compatibility
  - Removed unsupported `name:` field from docker-compose.yml
  - Restarted Kong (8304), Auth (9999), Database (5433), all services

- **Frontend Styling Issues** (28 malformed Tailwind CSS classes)
  - Fixed CustomSignUpPage.tsx (4 instances)
  - Fixed AccountPage.tsx (12 instances)
  - Fixed MarketplacePage.tsx (1 instance)
  - Fixed OnboardingPage.tsx (3 instances)
  - Root cause: Incomplete dark mode implementation attempt

### Added
- **Health Monitoring** for Supabase service
  - Created `/home/newadmin/scripts/monitor-supabase.sh`
  - Crontab: Monitors port 8304 every 5 minutes
  - Telegram alerts via @desaas_monitor_S1_bot (30-min cooldown)
  - Logs to syslog for audit trail

- **Systemd Auto-Restart Service** (prepared)
  - `/tmp/blackbow-supabase.service` created
  - Ensures Supabase auto-starts on VPS reboot
  - Installation scripts ready

---

## [1.3.0] - 2025-10-31

### Added
- **Billing Address Collection** (2-step deposit flow)
  - `PUT /api/users/billing-address` endpoint with full validation
  - Frontend: Refactored DepositModal with Step 1 (billing) → Step 2 (payment)
  - Fields: firstName, lastName, addressLine1, addressLine2, city, state, ZIP
  - Validation: ZIP format, state code, required fields (client + server)

- **Star/Favorite Functionality**
  - `POST /api/leads/:leadId/favorite` - Add favorite
  - `DELETE /api/leads/:leadId/favorite` - Remove favorite
  - `GET /api/leads/favorites/list` - Get user's favorites
  - `isFavorited` flag in `getLeads()` response (Set-based O(1) lookup)
  - `favoritesOnly` query parameter for filtering
  - Frontend: Star icons in all 3 views (table, list, card)
  - Frontend: "Favorites Only" filter button

### Database
- UserLeadFavorite model fully utilized (was existing but unused)

---

## [1.2.0] - 2025-10-31

### Changed
- **Database Migration to Supabase PostgreSQL**
  - Migrated all data from local PostgreSQL (port 5432) to Supabase (port 5433)
  - Migrated: 8 users, 36 leads, 23 transactions, 10 purchases (100% data integrity)
  - Method: Prisma-based migration script (safe, transactional)
  - Removed legacy PostgreSQL service

### Fixed
- **Lead Purchase Validation** - Updated middleware to accept new 8-char lead IDs (was rejecting with 400 error)

---

## [1.1.1] - 2025-10-31

### Fixed
- **CRITICAL: JWT Verification Failure** (blocker resolved)
  - Root cause: Backend couldn't verify JWTs via Supabase Kong Gateway (port 8304)
  - Solution: Exposed Supabase Auth service on localhost:9999
  - Created dedicated `supabaseAdmin` client bypassing Kong
  - Result: All endpoints now returning HTTP 200

---

## [1.1.0] - 2025-10-30

### Added
- **Supabase Authentication System** (self-hosted)
  - Migrated from Clerk to Supabase
  - Self-hosted Docker stack (11 containers)
  - Kong Gateway: Port 8304 (public API)
  - Auth Service: Port 9999 (Admin API)
  - Custom auth pages with OAuth (Google, Facebook) + email/password

### Fixed
- Database connection port mismatch (5433 → 5432)
- Cloudflare Tunnel 404 errors

### Removed
- All legacy Clerk code from backend
- `clerk_user_id` column from database

---

## [1.0.0] - 2025-10-29

### Initial Release
- Wedding lead marketplace backend
- Express + Prisma + PostgreSQL
- Lead management endpoints
- User authentication (Clerk)
- Stripe payment integration
- PM2 deployment

---

**Last Updated:** 2025-11-01 by Claude Code
**Generated with:** [Claude Code](https://claude.com/claude-code)
