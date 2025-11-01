# Changelog

All notable changes to the BlackBow Associates project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.3] - 2025-11-01 (Session 3 - Comprehensive UI Fixes)

### Fixed - Complete UI Polish Pass
- **Homepage**
  - Reduced subtitle text size from `text-lg/text-2xl` to `text-base/text-xl`
  - Ensures better visual hierarchy on landing page

- **Authentication Pages (Sign In & Sign Up)**
  - Added `rounded-lg` to ALL form input fields (email, password, names)
  - All 4 input fields on sign up page now have consistent rounded corners
  - Email and password fields on sign in page verified with proper rounded corners

- **Onboarding Page (Step 2 - Registration)**
  - Fixed malformed icon className: `text-gray-400s-none z-10` → `text-gray-400 pointer-events-none z-10`
  - Fixed location detection emoji showing as `?` instead of `📍`
  - "Tell us about your business" textarea properly styled with `rounded-lg`

- **Marketplace Page**
  - Fixed pagination selector showing black text on black background
  - Active page button now shows white text on black background
  - Inactive page buttons show gray text on light gray background with hover effects

- **Account Page - COMPREHENSIVE FIXES**
  - Fixed main container background (removed incorrect modal-style wrapper)
  - Added `rounded-lg` to balance card
  - Fixed malformed `text-blacks` className → `text-black`
  - Added `rounded-lg` to ALL 9 form input fields:
    - Business Name input
    - Vendor Type input
    - Company Name input
    - First Name input
    - Last Name input
    - Address Line 1 input
    - Address Line 2 input
    - City, State, ZIP inputs
  - Fixed company/individual toggle background: `bg-gray-50sition-colors` → `bg-gray-50 rounded-lg transition-colors`
  - Fixed desktop transaction table header: `bg-gray-50sition-colors` → `bg-gray-50 transition-colors`
  - Fixed table body divider: `divide-gray-100sition-colors` → `divide-gray-100 transition-colors`
  - Fixed table row hover: `hover:bg-gray-50sition-colors` → `hover:bg-gray-50 transition-colors`
  - Fixed mobile transaction cards to use consistent border styling
  - Fixed "Browse Marketplace" button: added proper `rounded-lg`, `text-white`, and padding
  - Fixed purchased lead cards: added `rounded-lg`, `shadow-sm`, and proper border
  - Fixed service badges: `bg-blue-50sition-colors` → `bg-blue-50 text-blue-700 rounded`
  - Fixed all border classes: removed malformed `border-gray-*sition-colors` patterns
  - Fixed desktop lead info labels: `text-gray-600semibold` → `text-gray-600 font-semibold` (4 instances)
  - Fixed contact info section: added `rounded-lg p-4` to background
  - Fixed notes section textarea: added `rounded-lg` (both mobile and desktop)
  - Fixed notes section buttons: added `rounded-lg`, proper colors, and disabled states (4 buttons total)
  - Fixed malformed `whitespace-pre-wrap` classes

- **Modal Components**
  - **DepositModal**:
    - Added `rounded-lg` to success state Close button
    - Added `rounded-lg` to error state Close button
    - Added `rounded-lg` to submit Deposit button
  - **ErrorBoundary**:
    - Changed "Try Again" button from `rounded` to `rounded-lg`
    - Changed "Reload Page" button from `rounded` to `rounded-lg`
  - **ConfirmationModal**: Already properly styled (verified)
  - **MarketplacePage Modals**: Already properly styled (verified)

### Changed - UI Consistency
- ALL form inputs across the entire application now have consistent `rounded-lg` corners
- ALL buttons across the application now have consistent `rounded-lg` corners
- ALL modal dialogs now have consistent button styling
- Improved Account page styling to match the rest of the application design language

### Technical Details
- Total files modified: 8
  - `frontend/src/App.tsx` (homepage subtitle)
  - `frontend/src/pages/CustomSignUpPage.tsx` (4 input fields)
  - `frontend/src/pages/CustomSignInPage.tsx` (verified, already correct)
  - `frontend/src/pages/OnboardingPage.tsx` (icon, emoji fixes)
  - `frontend/src/pages/MarketplacePage.tsx` (pagination styling)
  - `frontend/src/pages/AccountPage.tsx` (47 styling fixes - most comprehensive)
  - `frontend/src/components/DepositModal.tsx` (3 button fixes)
  - `frontend/src/components/ErrorBoundary.tsx` (2 button fixes)
- Build status: ✅ Zero errors, zero warnings
- Deployment: PM2 zero-downtime reload successful
- All services verified online and healthy

## [1.3.2] - 2025-11-01 (Minor UI/UX Fixes)

### Fixed - User Interface Issues
- **Homepage Footer**
  - Fixed copyright symbol displaying as "?" instead of "©"
  - Updated both mobile and desktop footer copyright text

- **Homepage Sign Up Button**
  - Added rounded corners (`rounded-lg`) to match other buttons
  - Improved visual consistency across the landing page

- **Authentication Pages (Sign In & Sign Up)**
  - Fixed "Or continue with" text styling
  - Removed excessive classes (was using card container classes)
  - Applied proper text styling with gray color

- **Modal Styling Improvements**
  - Buy Leads modal: Added rounded corners to buttons, fixed spacing
  - Buy Leads in Bulk modal: Added rounded corners to buttons, improved spacing
  - Both modals: Enhanced button styling with background colors and hover states
  - Fixed lead details card in purchase modal (added rounded corners and proper spacing)

### Changed - UI Consistency
- All buttons now have consistent rounded corners across the application
- Modal buttons now have proper background colors (gray for cancel, black for confirm)
- Improved visual hierarchy in confirmation modals

## [1.3.1] - 2025-11-01 (Emergency Fix - Styling & Auth Service)

### Fixed - Critical Production Issues
- **Supabase Docker Containers Restored**
  - All Supabase containers were stopped (~1 hour before fix)
  - Restored Kong (port 8304), Auth, Database, and all dependent services
  - Fixed docker-compose.yml boolean environment variables (true → "true")
  - Removed unsupported `name:` field for docker-compose 1.29.2 compatibility
  - Result: auth.blackbowassociates.com now responding (no more 502 Bad Gateway)

- **Malformed Tailwind CSS Classes Removed**
  - Fixed 28 instances of broken dark mode syntax across 5 files:
    - CustomSignUpPage.tsx (4 fixes): Removed `blacks:`, `s:ring-2` malformed syntax
    - AccountPage.tsx (12 fixes): Fixed input and textarea className patterns
    - MarketplacePage.tsx (1 fix): Fixed search input styling
    - OnboardingPage.tsx (3 fixes): Fixed location, vendor type, and about field styling
    - CustomSignInPage.tsx: Already clean, no changes needed
  - All form inputs now display proper borders, focus states, and responsive behavior
  - Dark mode attempt completely removed per requirements (clean light mode only)

### Added - Operational Improvements
- **Supabase Health Monitoring Script**
  - Created `/home/newadmin/scripts/monitor-supabase.sh`
  - Monitors Kong on port 8304 every 5 minutes (ready for cron)
  - Sends Telegram alerts via @desaas_monitor_S1_bot when service is down
  - Alert cooldown: 30 minutes to prevent spam
  - Logs to syslog for audit trail

- **Systemd Service for Auto-Restart**
  - Created `/tmp/blackbow-supabase.service` systemd unit file
  - Ensures Supabase containers auto-start on VPS reboot
  - Installation script: `/tmp/install-supabase-systemd.sh` (requires sudo)

### Changed - Build & Deployment
- Frontend rebuilt with zero TypeScript errors
- Deployed via PM2 zero-downtime reload
- All services verified healthy post-deployment

### Technical Debt Addressed
- Fixed docker-compose.yml to be compatible with docker-compose 1.29.2
- Removed incomplete dark mode implementation that caused CSS breakage

## [1.3.0] - 2025-10-31 (Session 5 - Phase 2 Features)

### Added - Billing Address Collection
- **2-Step Deposit Flow** with billing address collection before payment
  - Step 1: Billing address form (firstName, lastName, addressLine1, addressLine2, city, state, ZIP)
  - Step 2: Payment form (amount selection + card details)
  - Step indicators and back button for smooth UX
  - Backend endpoint: `PUT /api/users/billing-address` with full validation
  - Client-side and server-side validation for ZIP code format (12345 or 12345-6789)
  - Client-side and server-side validation for state code (2-letter format)
  - All required fields validated before proceeding to payment step

### Added - Star/Favorite Functionality
- **Complete favorites system** across all marketplace views
  - Backend endpoints:
    - `POST /api/leads/:leadId/favorite` - Add lead to favorites
    - `DELETE /api/leads/:leadId/favorite` - Remove from favorites
    - `GET /api/leads/favorites/list` - Get all favorited leads
  - Backend performance optimization:
    - Added `isFavorited` flag to getLeads response (Set-based O(1) lookup)
    - Single query fetches all user favorites upfront
    - `favoritesOnly` query parameter for filtering marketplace view
  - Frontend star icons in all 3 views:
    - **Table view:** First column with clickable star
    - **List view:** Star at beginning of row
    - **Card view:** Star in top-right corner with ID
  - Visual feedback: Yellow filled star for favorited, gray outlined for non-favorited
  - "Favorites Only" filter button in filters panel
  - Optimistic UI updates for instant feedback
  - Event propagation handling to prevent row expansion when clicking star

### Changed - Database Migration
- **Migrated from local PostgreSQL to Supabase PostgreSQL**
  - Source: Local PostgreSQL (port 5432)
  - Destination: Supabase PostgreSQL in Docker (port 5433)
  - Data migrated: 8 users, 36 leads, 23 transactions, 10 purchases
  - 100% data integrity verified
  - Migration method: Prisma-based migration script (safe, transactional)
  - Legacy PostgreSQL service removed and uninstalled
  - Port 5432 now available (freed)

### Infrastructure
- **Production deployment with zero downtime**
  - Frontend build: 5.89s, zero errors, 563.95 KB bundle (156.13 KB gzipped)
  - Backend reload: Successful (PM2 restart #18)
  - Frontend reload: Successful (PM2 restart #18)
  - All services: 🟢 Online, no errors in logs
- **Documentation updates**
  - VPS_INFRASTRUCTURE.md: Updated all database references from port 5432 to 5433
  - PROJECT_STATUS.md: Added Session 4 and Session 5 details
  - operations/emergency-procedures.md: Converted PostgreSQL commands to Docker-based

### Technical Details
- Utilized existing `UserLeadFavorite` Prisma model (junction table)
- Composite unique key: `userId_leadId` for favorites relationship
- Database schema already had billing address fields (no migration needed)
- Validation rules:
  - ZIP code regex: `/^\d{5}(-\d{4})?$/`
  - State code: 2-letter uppercase format
  - Address lengths: 5-100 chars (line 1), up to 100 chars (line 2)

### Performance
- Favorite lookup optimized with JavaScript Set (O(1) instead of O(n))
- Single database query for all user favorites (no N+1 query problem)
- Optimistic UI updates reduce perceived latency

## [1.2.0] - 2025-10-31

### Added
- **Automatic Location Detection** on onboarding form (step 2)
  - Location field auto-fills based on user's IP geolocation
  - Uses ipapi.co for reliable IP-based location detection
  - Shows city and state in format: "Miami, FL"
  - Graceful fallback to manual entry if detection fails
  - Removed redundant manual "Detect" button (auto-detection on page load only)

### Changed - V2 Lead ID Format
- **Simplified Lead IDs:** Changed from 20-char to 8-char format
  - OLD: `MD202510311030451234` (2-char state + 14-digit timestamp + 4-digit random)
  - NEW: `MD123456` (2-char state + 6-digit unique number)
- **Improved State Detection:** City-to-state mapping for missing states
  - Boston → MA (not XX)
  - Bridgewater → PA (even if state field invalid)
  - Comprehensive mapping of 100+ major US cities
- **All 36 existing leads migrated** to new format
  - Purchase records and foreign keys maintained
  - Zero data loss, zero downtime

### Fixed
- **CRITICAL:** Registration working again - fixed Supabase Admin API configuration
  - Admin client now correctly uses Kong gateway with service role key
  - Email/password and OAuth registration both functional
  - Issue: Admin API endpoints not available on direct localhost:9999 port

### Changed
- **Lead ID Format:** Migrated from CUID format to state-based format
  - New format: `[STATE][TIMESTAMP][RANDOM]` (e.g., `MD202510311030451234`)
  - 20 characters total: 2-char state code + 14-digit timestamp + 4-digit random
  - Unknown states use "XX" as state code
  - All 36 existing leads migrated successfully
  - Purchase records and foreign keys maintained

### Added
- Lead ID generator utility with validation functions
- State code normalization (handles invalid states gracefully)
- ID format validation and extraction utilities

### Technical
- Updated Prisma schema to use custom ID format
- Modified Pipedrive import to generate new ID format
- Created migration script with temporary column approach
- All IDs sortable by state and creation time
- Reverted supabaseAdmin client to use Kong gateway with proper headers

## [1.1.2] - 2025-10-31

### Fixed
- **CRITICAL:** Resolved Supabase JWT verification failure on backend Admin API calls
- User profile endpoints now working correctly (no more 500 errors)
- Onboarding flow functional - users can complete registration
- User auto-creation from Supabase Auth metadata now operational

### Changed
- Exposed Supabase Auth service on localhost:9999 for direct Admin API access
- Created dedicated `supabaseAdmin` client bypassing Kong gateway
- Updated infrastructure documentation (port registry, VPS docs, PROJECT_STATUS)

### Technical Details
- Added port mapping `127.0.0.1:9999:9999` to Supabase Auth container
- Modified `backend/src/middleware/auth.js` to use dual Supabase clients
- `supabase` client: User operations through Kong (https://auth.blackbowassociates.com)
- `supabaseAdmin` client: Admin API calls direct to Auth service (http://localhost:9999)
- Root cause: Kong gateway authentication blocking Admin API, bypassed by direct connection

## [1.1.1] - 2025-10-30 (Session 2 - INCOMPLETE)

### Fixed
- Cloudflare Tunnel 404 errors on `auth.blackbowassociates.com` (added public hostname in CF dashboard)
- Removed all legacy Clerk code from backend (`syncUser` webhook, `clerkUserId` fields)
- Dropped `clerk_user_id` column from database (test users removed)
- Regenerated Prisma client after schema changes
- Cleaned up validation middleware (removed `clerkWebhook` validation)

### Known Issues - BLOCKER
**Authentication 500 Errors on Profile/Onboarding Endpoints**

**Error:** `Failed to fetch user from Supabase Auth: invalid JWT: unable to parse or verify signature, token signature is invalid`

**Root Cause:** Backend cannot verify Supabase JWT tokens when calling Supabase Admin API (`supabase.auth.admin.getUserById()`). This indicates:
1. `SUPABASE_SERVICE_ROLE_KEY` in backend `.env` may be incorrect/mismatched with Supabase instance
2. OR `SUPABASE_JWT_SECRET` is not matching the JWT secret configured in Supabase Docker instance

**Impact:**
- Users can authenticate via OAuth (Google/Facebook) on frontend
- Frontend receives valid Supabase access tokens
- Backend JWT verification passes (token is valid)
- Backend fails when trying to fetch user metadata from Supabase Auth API
- All `/api/users/profile` requests return 500 errors
- Onboarding flow cannot complete

**Next Steps for Developer:**
1. Verify `SUPABASE_JWT_SECRET` matches value in `/home/newadmin/infrastructure/supabase/docker/.env`
2. Verify `SUPABASE_SERVICE_ROLE_KEY` matches value in Supabase `.env`
3. Check if Supabase Auth container is using correct JWT secret for signing tokens
4. May need to regenerate JWT keys in Supabase and update both frontend and backend
5. Test with `curl` to Supabase Admin API endpoint directly to isolate issue

**Files to Check:**
- `/home/newadmin/projects/blackbow-associates/backend/.env` (lines 15-17)
- `/home/newadmin/infrastructure/supabase/docker/.env` (lines 7, 9)
- `/home/newadmin/projects/blackbow-associates/backend/src/middleware/auth.js` (lines 32, 88)

## [1.1.0] - 2025-10-30

### Changed

- **BREAKING:** Migrated authentication from Clerk to Supabase (self-hosted)
- Updated backend JWT verification to use Supabase JWT secret
- Replaced Clerk components with custom Supabase auth pages
- Updated database schema with dual auth fields (`authUserId` for Supabase, `clerkUserId` legacy)
- Configured Cloudflare Tunnel routing for `auth.blackbowassociates.com` → Supabase Kong gateway

### Added

- Supabase Docker stack (local self-hosted instance)
- Custom sign-in and sign-up pages with OAuth (Google, Facebook) support
- Automatic user creation in PostgreSQL database on first Supabase login
- Support for dual authentication systems during migration period

### Fixed

- Database connection port mismatch (5433 → 5432) in backend `.env`
- Supabase container stability issues (db, auth, kong now running healthy)
- OAuth redirect loop issues (resolved by migrating away from Clerk)

### Removed

- Clerk SDK dependencies from backend and frontend
- Clerk React components (`SignIn`, `SignUp`, `ClerkProvider`)
- Clerk webhook endpoints

## [1.0.0] - 2025-10-29

### Added

- Initial production deployment with Clerk authentication
- Complete wedding lead marketplace functionality
- Stripe payment integration for deposits
- Pipedrive CRM integration for lead creation
- Admin dashboard for user and lead management
- Onboarding flow for new user registration
- Transaction history and purchased leads tracking
- PM2 deployment on VPS production server

### Infrastructure

- Backend API deployed on PM2 port 3450
- Frontend deployed on PM2 port 3001
- PostgreSQL database on port 5432
- Cloudflare Tunnel for public access
- Winston structured logging to `/var/log/desaas/`

---

**Last Updated:** 2025-10-30 by Claude Code
