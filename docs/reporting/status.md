# Employee Reporting System - Status

**Last Updated**: March 16, 2026

## Current State: LIVE

The system is deployed and operational.

## Deployment URLs

| Component | URL | Status |
|-----------|-----|--------|
| Frontend | https://reporting.blackbowassociates.com | Live |
| API | https://api.blackbowassociates.com/api/reporting/* | Live |

## Active Employees

| Name | Email | Status |
|------|-------|--------|
| Zayra | zayra@preciouspicspro.com | Active |
| Joyce | joyce@preciouspicspro.com | Deactivated (April 2026) |

## Summary Recipients

- tim@preciouspicspro.com
- slava@preciouspicspro.com

## Features Implemented

### Core Features
- [x] Daily clock-in code generation and email (9 AM ET, Mon-Fri)
- [x] Code-based authentication (no password)
- [x] Code reusable throughout the day (until clock-out)
- [x] 3 progressive time slots (unlock every 2 hours)
- [x] Bullet point task entry with time ranges (from/to)
- [x] Auto-save every 30 seconds
- [x] Manual save and submit per slot
- [x] Late submission tracking
- [x] Clock-out with AI summary generation (GPT-4o)
- [x] Daily summary email to management

### Authentication
- [x] Cross-domain cookie support (SameSite=none, Secure)
- [x] Session token in httpOnly cookie
- [x] Fallback to x-session-token header
- [x] Re-authentication with same code (if workday active)

### UI/UX
- [x] Responsive design (mobile-friendly)
- [x] Real-time countdown to next slot unlock
- [x] Visual status indicators (locked/open/submitted)
- [x] Rainbow gradient "Add another task" button
- [x] Time inputs (native browser time picker)
- [x] Keyboard shortcuts (Enter to add bullet, Backspace to remove empty)

## Known Issues

None currently.

## Recent Changes (March 16, 2026)

1. **Added second employee** - Joyce (joyce@preciouspicspro.com) added to reporting system for shooter sourcing role.

2. **Created onboarding email template** - Reusable template at `backend/templates/reporting-onboarding.html` with `{{name}}` and `{{portalUrl}}` variables for onboarding future employees.

3. **Clarified cron script** - Updated comment in `src/scripts/send-clock-in-codes.js` to document it as manual-only (not scheduled). Daily codes are sent by in-process node-cron in `src/jobs/reporting.job.js`.

## Recent Changes (January 14, 2026)

1. **Fixed email delivery tracking** - Added `emailSentAt` field to `ReportingClockInCode` table. Cron now only marks "already_sent" if email was actually delivered.

2. **Fixed email retry logic** - If code exists but email failed, cron will retry sending with the same code instead of skipping.

3. **Improved cron logging** - Added timestamps, detailed output per employee, error stack traces. Logs to `/var/log/desaas/blackbow-clock-in-codes.log`.

4. **Added instructions to clock-in email** - "How it works" section explaining clock-in, slot unlocks, reminders, and clock-out.

5. **Resend suppression fix** - Removed zayra@preciouspicspro.com from Resend suppression list (was blocking delivery).

## Recent Changes (January 13, 2026)

1. **Fixed date display** - Was showing wrong day due to timezone issue. Now uses `clockInTime` with `America/New_York` timezone.

2. **Fixed code reuse** - Code can now be used multiple times during the day. Only throws "already used" after clock-out.

3. **Fixed clock-out time in email** - Was showing "N/A" because workday object had stale data. Now passes current time directly.

4. **Added time inputs** - Each bullet point now has timeFrom/timeTo fields.

5. **Fixed race condition** - Page refresh was erasing local edits. Added `initialized` flag to prevent status updates from overwriting local state.

6. **Added cron job** - `0 14 * * 1-5` sends clock-in codes at 9 AM ET.

## Cron Schedule

Scheduling is handled by in-process node-cron inside `blackbow-api` (see `src/jobs/reporting.job.js`), NOT by an external cron job.

| Time (ET) | Days | Job |
|-----------|------|-----|
| 9:00 AM | Mon-Fri | Send clock-in codes to all active employees |
| Every minute | Daily | Check and send slot reminders for active workdays |

**Logs:** `/var/log/desaas/blackbow-combined-YYYY-MM-DD.log` (Winston, rotated daily)
**Stale log (ignore):** `/var/log/desaas/blackbow-clock-in-codes.log` — from retired external cron, last entry Jan 29, 2026.

## PM2 Processes

```
blackbow-api        port 3450   Backend API
blackbow-reporting  port 3002   Frontend
```

## Files Modified

### Backend
- `src/services/reportingService.js` - Core reporting logic
- `src/controllers/reporting.controller.js` - HTTP handlers
- `src/routes/reporting.routes.js` - Route definitions
- `src/jobs/reporting.job.js` - In-process node-cron scheduler (daily codes + reminders)
- `src/scripts/send-clock-in-codes.js` - Manual fallback script (not scheduled)
- `templates/reporting-onboarding.html` - Onboarding email template for new employees
- `prisma/schema.prisma` - Database models (lines 448-538)

### Frontend
- `src/api/reporting.ts` - API client with types
- `src/pages/CodeEntry.tsx` - Clock-in page
- `src/pages/ReportingDashboard.tsx` - Main dashboard
- `src/components/SlotCard.tsx` - Slot card component
- `src/App.tsx` - Root with auth routing

## Testing Checklist

- [ ] Generate code (run cron script or wait for 9 AM)
- [ ] Enter code, verify clock-in
- [ ] Verify correct date displayed
- [ ] Add tasks with time ranges
- [ ] Submit slot 1
- [ ] Wait for slot 2 unlock (or adjust SLOT_DURATION_MS for testing)
- [ ] Refresh page - verify data persists
- [ ] Re-enter same code - should work
- [ ] Clock out
- [ ] Verify summary email received with correct times
- [ ] Re-enter code after clock-out - should fail

## Future Enhancements

- [x] Reminder emails (2h after slot unlock if not submitted)
- [x] Multiple employees support
- [ ] Admin dashboard to view all employee reports
- [ ] Weekly/monthly summary aggregation
- [ ] Slack/Teams integration for notifications
