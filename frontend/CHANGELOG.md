# Changelog

All notable changes to the Black Bow Associates Frontend will be documented in this file.

## [1.1.0] - 2025-11-09

### Added
- Password reset request page (`ForgotPasswordPage.tsx`)
- Password reset form page (`ResetPasswordPage.tsx`)
- Email confirmation flow with Resend integration
- Password validation (8+ chars, uppercase, lowercase, numbers)
- Token expiration handling (1 hour for password reset, 24 hours for email confirmation)
- Rate limiting UI feedback (5 minutes between password reset requests)
- Comprehensive issue documentation (`docs/issue.md`)

### Fixed
- **CRITICAL**: Fixed 404 error on password reset endpoints caused by duplicate `/api` in URL paths
- **CRITICAL**: Fixed 500 error on password reset for users without `authUserId` (auto-linking implemented)
- API URL configuration consistency between axios client and direct fetch calls
- Marketplace API calls after environment variable changes

### Changed
- Standardized API endpoint paths to use `/auth/*` instead of `/api/auth/*` for password reset pages
- Maintained `.env.production` configuration with `VITE_API_URL=https://api.blackbowassociates.com/api`

### Security
- All password reset tokens expire after 1 hour
- Rate limiting on password reset requests (5 minute cooldown)
- Password complexity requirements enforced on frontend and backend
- Reset tokens cleared from database after successful password change

## [1.0.0] - 2025-11-08

### Initial Release
- User authentication with Supabase
- Vendor marketplace for lead browsing
- Lead purchasing with Stripe integration
- User dashboard with balance management
- Admin panel for lead management
- Mobile-responsive design
- Dark mode support
