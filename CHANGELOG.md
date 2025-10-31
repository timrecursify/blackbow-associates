# Changelog

All notable changes to the BlackBow Associates project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-10-31

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
