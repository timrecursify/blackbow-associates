# Employee Reporting System PRD

## Overview

A lightweight time-tracking and reporting system for Blackbow Associates employees. Employees receive a daily unique code via email, use it to clock in on a dedicated reporting portal, and submit work reports in 2-hour intervals throughout their 6-hour workday. Reports are aggregated, processed by GPT-4o, and sent as a daily summary to management.

## Goals

- Simple code-based access (no login/password)
- Progressive report unlocking (prevents batch reporting)
- Automated daily summaries via AI processing
- Minimal friction for employees

## Users

### Employees
- zayra@preciouspicspro.com (sales)
- joyce@preciouspicspro.com (shooter sourcing)

### Report Recipients
- tim@preciouspicspro.com
- slava@preciouspicspro.com

## System Architecture

### New Components

**Frontend: reporting.blackbowassociates.com**
- Standalone React/Vite app (separate from main site)
- Single-page reporting interface
- Mobile-responsive design

**Backend: Extend existing Express.js API**
- New routes under `/api/reporting`
- New Prisma models for employees, codes, reports
- Cron jobs for scheduled emails
- GPT-4o integration for summary generation

### Domain Setup
- Subdomain: `reporting.blackbowassociates.com`
- API: Use existing `api.blackbowassociates.com` with new routes

## Core Flow

### 1. Daily Clock-In Code (9 AM Eastern)

```
[Cron Job: 9:00 AM ET Daily]
    ↓
Generate unique 6-character alphanumeric code
    ↓
Store in database with employee_id, date, expires_at (midnight ET)
    ↓
Send email via Resend to employee
    ↓
Email contains: code + link to reporting.blackbowassociates.com
```

**Code Format:** 6 characters, uppercase alphanumeric (e.g., `X7K2M9`)
- Non-deterministic (crypto random)
- One code per employee per day
- Expires at midnight Eastern

### 2. Clock-In Process

```
Employee visits reporting.blackbowassociates.com
    ↓
Enters code in single input field
    ↓
System validates: code exists, not expired, not already used
    ↓
On success: Store clock_in_time, show reporting dashboard
    ↓
Set browser session/cookie with session token (no login needed)
```

### 3. Reporting Dashboard

**Layout:**
```
┌─────────────────────────────────────────┐
│  Blackbow Employee Reporting            │
│  Today: January 13, 2026                │
├─────────────────────────────────────────┤
│                                         │
│  ● Clocked In: 9:15 AM                  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Slot 1                    [OPEN]  │  │
│  │ • Bullet point input...          │  │
│  │ • Add another...                 │  │
│  │                    [Submit Slot] │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Slot 2                  [LOCKED]  │  │
│  │ Unlocks in: 1h 45m               │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Slot 3                  [LOCKED]  │  │
│  │ Unlocks in: 3h 45m               │  │
│  └───────────────────────────────────┘  │
│                                         │
│              [End Day & Submit All]     │
└─────────────────────────────────────────┘
```

**Slot Unlocking Logic:**
- Slot 1: Available immediately after clock-in
- Slot 2: Unlocks 2 hours after clock-in
- Slot 3: Unlocks 4 hours after clock-in

**Report Input:**
- Each slot has multiple bullet point text inputs
- Add/remove bullet points dynamically
- Auto-save drafts to backend every 30 seconds
- "Submit Slot" button marks slot as complete

### 4. Reminder Emails (Every 2 Hours)

```
[Cron Job: Check every minute]
    ↓
For each clocked-in employee:
  - If 2 hours since clock-in AND Slot 1 not submitted → Send reminder
  - If 4 hours since clock-in AND Slot 2 not submitted → Send reminder
  - If 6 hours since clock-in AND Slot 3 not submitted → Send final reminder
    ↓
Email contains: "Time to submit your report" + button to reporting page
```

**Email triggers based on clock-in time, not fixed hours**

### 5. Final Submission & AI Processing

```
Employee clicks "End Day & Submit All"
    ↓
Validate all 3 slots have content (warn if empty, allow anyway)
    ↓
Mark workday as complete, store clock_out_time
    ↓
Aggregate all bullet points from all slots
    ↓
Send to GPT-4o with prompt:
  "Summarize this employee's daily work report into a concise,
   professional summary organized by category. Keep bullet format.
   Employee: {name}, Date: {date}"
    ↓
Send summary email to tim@preciouspicspro.com, slava@preciouspicspro.com
    ↓
Store processed summary in database
```

## Database Schema (Prisma)

```prisma
model Employee {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  active    Boolean  @default(true)
  createdAt DateTime @default(now())

  clockInCodes ClockInCode[]
  workdays     Workday[]
}

model ClockInCode {
  id         String   @id @default(uuid())
  code       String   @unique
  employeeId String
  employee   Employee @relation(fields: [employeeId], references: [id])
  date       DateTime @db.Date
  expiresAt  DateTime
  usedAt     DateTime?
  createdAt  DateTime @default(now())

  @@unique([employeeId, date])
}

model Workday {
  id           String    @id @default(uuid())
  employeeId   String
  employee     Employee  @relation(fields: [employeeId], references: [id])
  date         DateTime  @db.Date
  clockInTime  DateTime
  clockOutTime DateTime?
  sessionToken String    @unique
  completed    Boolean   @default(false)

  reports      Report[]

  @@unique([employeeId, date])
}

model Report {
  id          String   @id @default(uuid())
  workdayId   String
  workday     Workday  @relation(fields: [workdayId], references: [id])
  slotNumber  Int      // 1, 2, or 3
  bullets     Json     // Array of strings
  submitted   Boolean  @default(false)
  submittedAt DateTime?
  isLate      Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([workdayId, slotNumber])
}

model DailySummary {
  id           String   @id @default(uuid())
  workdayId    String   @unique
  rawContent   String   @db.Text  // Original bullets combined
  aiSummary    String   @db.Text  // GPT-4o processed summary
  emailSentAt  DateTime?
  createdAt    DateTime @default(now())
}
```

## API Endpoints

### Public (Code-based auth)

```
POST /api/reporting/clock-in
Body: { code: "X7K2M9" }
Response: { sessionToken, workdayId, clockInTime }

GET /api/reporting/status
Header: X-Session-Token: <token>
Response: { workday, reports[], slotsUnlocked[] }
```

### Authenticated (Session token)

```
POST /api/reporting/reports/:slotNumber/save
Body: { bullets: ["Task 1", "Task 2"] }
Response: { saved: true }

POST /api/reporting/reports/:slotNumber/submit
Body: { bullets: ["Task 1", "Task 2"] }
Response: { submitted: true, isLate: boolean }

POST /api/reporting/end-day
Response: { completed: true, summaryQueued: true }
```

### Internal (Cron jobs)

```
POST /api/reporting/internal/send-clock-in-codes
POST /api/reporting/internal/send-reminders
POST /api/reporting/internal/process-summaries
```

## Email Templates

### 1. Daily Clock-In Code

**Subject:** Your Blackbow Reporting Code for {date}

```html
Good morning!

Your reporting code for today is:

    [ X7K2M9 ]

Click below to clock in and start your day:

    [Start Reporting →]

This code expires at midnight Eastern.
```

### 2. Slot Reminder

**Subject:** Time to submit Slot {n} report

```html
Hi {name},

It's been 2 hours since your last report submission.

Please take a moment to log your work for Slot {n}:

    [Submit Report →]

Your progress is being saved automatically.
```

### 3. Final Reminder

**Subject:** Don't forget to end your day

```html
Hi {name},

Your workday is almost complete! Please submit any remaining
reports and click "End Day" to generate your daily summary.

    [Complete Your Day →]
```

### 4. Daily Summary (to management)

**Subject:** Daily Report: {employee_name} - {date}

```html
Employee: {name}
Date: {date}
Clock In: {clock_in_time}
Clock Out: {clock_out_time}

─────────────────────────────

{ai_generated_summary}

─────────────────────────────

Raw Reports:

Slot 1:
• {bullets}

Slot 2:
• {bullets}

Slot 3:
• {bullets}
```

## Cron Schedule

| Job | Schedule | Description |
|-----|----------|-------------|
| send-clock-in-codes | `0 9 * * 1-5` (9 AM ET, Mon-Fri) | Generate and send daily codes |
| check-reminders | `* * * * *` (every minute) | Check for pending reminders |
| process-summaries | `0 * * * *` (every hour) | Process completed workdays |

## Tech Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Backend:** Express.js (extend existing)
- **Database:** PostgreSQL + Prisma (extend existing)
- **Email:** Resend (existing integration)
- **AI:** OpenAI GPT-4o API
- **Scheduling:** node-cron (existing pattern)

## Security Considerations

- Codes are cryptographically random (crypto.randomBytes)
- Session tokens are UUIDs, stored in httpOnly cookies
- No sensitive data exposed without valid session
- Rate limiting on clock-in attempts (prevent brute force)
- Codes single-use per day

## Future Scalability

- Add more employees to Employee table
- Configure per-employee schedules if needed
- Add manager dashboard for viewing all reports
- Export reports to CSV/PDF
- Slack/Teams integration option

## Implementation Order

1. Database schema migration
2. Backend API endpoints
3. Cron job for daily codes
4. Email templates
5. Frontend reporting app
6. Cron job for reminders
7. GPT-4o integration
8. Summary email sending
9. Testing & deployment

## Deployment

- **Frontend:** PM2 on port 3002 (service name: `blackbow-reporting`)
- **Backend:** Extend existing blackbow-api service (port 3450)
- **Cloudflare Tunnel:** Add route `reporting.blackbowassociates.com` → localhost:3002
- **Port binding:** 127.0.0.1 only (localhost)
- **Resend:** Uses existing blackbowassociates.com domain

---

*Document created: January 13, 2026*
*Status: Ready for development*
