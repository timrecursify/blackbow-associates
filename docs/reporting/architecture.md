# Employee Reporting System - Architecture

## Overview

The Employee Reporting System is a time-tracking and daily reporting tool for Blackbow Associates employees. Employees receive a daily code via email at 9 AM ET, clock in via web interface, log tasks in 3 time slots (unlocked progressively), and clock out to generate an AI-summarized daily report sent to management.

## System Components

### Frontend (reporting-frontend/)
- **Framework**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Port**: 3002 (served via PM2)
- **Domain**: reporting.blackbowassociates.com (Cloudflare Tunnel)

```
reporting-frontend/
├── src/
│   ├── api/
│   │   └── reporting.ts       # API client functions
│   ├── components/
│   │   └── SlotCard.tsx       # Report slot UI component
│   ├── pages/
│   │   ├── CodeEntry.tsx      # Clock-in code entry page
│   │   └── ReportingDashboard.tsx  # Main reporting interface
│   ├── App.tsx                # Root component with auth routing
│   └── main.tsx               # Entry point
├── .env                       # VITE_API_BASE_URL
└── package.json
```

### Backend (backend/src/)
- **Framework**: Express v5 + Node.js
- **Database**: PostgreSQL via Prisma ORM
- **Port**: 3450 (blackbow-api PM2 process)
- **Domain**: api.blackbowassociates.com

```
backend/src/
├── controllers/
│   └── reporting.controller.js   # HTTP request handlers
├── services/
│   └── reportingService.js       # Core business logic
├── routes/
│   └── reporting.routes.js       # Route definitions
├── jobs/
│   └── reporting.job.js           # In-process node-cron (daily codes + reminders)
├── scripts/
│   └── send-clock-in-codes.js     # Manual fallback script (not scheduled)
├── templates/
│   └── reporting-onboarding.html  # Onboarding email for new employees
└── prisma/
    └── schema.prisma              # Database models (lines 448-538)
```

## Database Schema

### ReportingEmployee
Stores employee information.
```
- id: cuid
- email: unique
- name: string
- active: boolean (default true)
```

### ReportingClockInCode
Daily codes sent to employees.
```
- code: 6-char alphanumeric (unique)
- employeeId: FK to ReportingEmployee
- date: Date (unique per employee per day)
- expiresAt: DateTime (midnight ET)
- usedAt: DateTime (null until first use)
```

### ReportingWorkday
Tracks a single work session.
```
- employeeId: FK
- date: Date
- clockInTime: DateTime
- clockOutTime: DateTime (null until clock-out)
- sessionToken: UUID (for auth)
- completed: boolean
```

### ReportingSlotReport
Individual time slot reports (3 per workday).
```
- workdayId: FK
- slotNumber: 1, 2, or 3
- bullets: JSON array of {text, timeFrom, timeTo}
- submitted: boolean
- submittedAt: DateTime
- isLate: boolean
```

### ReportingDailySummary
Generated when employee clocks out.
```
- workdayId: FK (unique)
- rawContent: text (formatted bullet points)
- aiSummary: text (GPT-4o generated)
- emailSentAt: DateTime
```

### ReportingReminderSent
Tracks reminder emails to prevent duplicates.
```
- workdayId: FK
- slotNumber: 1, 2, or 3
- sentAt: DateTime
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reporting/clock-in` | Authenticate with daily code |
| GET | `/api/reporting/status` | Get workday status, slots, reports |
| POST | `/api/reporting/reports/:slot/save` | Auto-save bullets |
| POST | `/api/reporting/reports/:slot/submit` | Submit slot report |
| POST | `/api/reporting/end-day` | Clock out, generate summary |
| POST | `/api/reporting/internal/send-clock-in-codes` | Trigger code emails (internal) |
| POST | `/api/reporting/internal/send-reminders` | Trigger reminder check (internal) |

## Authentication Flow

1. **Daily Code Generation** (9 AM ET cron)
   - Generate 6-char alphanumeric code per active employee
   - Store with date and midnight ET expiration
   - Send email via Resend

2. **Clock-In**
   - Employee enters code on frontend
   - Backend validates: exists, not expired, workday not completed
   - If code already used but workday active: allow re-auth with new session
   - Create/update ReportingWorkday with new sessionToken
   - Set httpOnly cookie (`reporting_session`) with SameSite=none for cross-domain

3. **Session Validation**
   - All subsequent requests use cookie or `x-session-token` header
   - Lookup workday by sessionToken

## Time Slot System

- **Slot 1**: Unlocks immediately at clock-in
- **Slot 2**: Unlocks 2 hours after clock-in
- **Slot 3**: Unlocks 4 hours after clock-in

Each slot has a 2-hour window before being marked "late".

## Email System

Uses Resend API via `emailService.js`.

### Email Types
1. **Clock-In Code** (9 AM ET) - Daily code with link to reporting site
2. **Slot Reminders** (2h after each slot unlocks) - If slot not submitted
3. **Daily Summary** (on clock-out) - To management with AI summary
4. **Onboarding** (manual, one-time) - Sent to new employees via `templates/reporting-onboarding.html`

### Recipients
- Clock-in/reminders: Employee email
- Daily summary: tim@preciouspicspro.com, slava@preciouspicspro.com

## AI Summary Generation

- **Model**: GPT-4o via OpenAI API
- **Trigger**: Clock-out (endDay)
- **Input**: All bullets from all slots with time ranges
- **Output**: 2-4 sentence professional summary
- **Fallback**: Raw bullet list if API fails

## Cron Jobs

Handled by in-process node-cron inside `blackbow-api` PM2 process (see `src/jobs/reporting.job.js`).
No external cron jobs are used.

| Schedule | Timezone | Job |
|----------|----------|-----|
| `0 9 * * 1-5` | America/New_York | Send daily clock-in codes to all active employees |
| `* * * * *` | America/New_York | Check and send slot reminders for active workdays |

A standalone script (`src/scripts/send-clock-in-codes.js`) exists as a manual fallback if needed.

## Infrastructure

### PM2 Processes
- `blackbow-api` (port 3450) - Backend API
- `blackbow-reporting` (port 3002) - Frontend static server

### Cloudflare Tunnel
- `reporting.blackbowassociates.com` -> 127.0.0.1:3002
- `api.blackbowassociates.com` -> 127.0.0.1:3450

### Logs
- **Active:** `/var/log/desaas/blackbow-combined-YYYY-MM-DD.log` (Winston, rotated daily)
- **Stale (ignore):** `/var/log/desaas/blackbow-clock-in-codes.log` — from retired external cron, last entry Jan 29, 2026

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
RESEND_API_KEY=re_...
REPORTING_INTERNAL_SECRET=... (for internal endpoints)
```

### Frontend (.env)
```
VITE_API_BASE_URL=https://api.blackbowassociates.com
```
