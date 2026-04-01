# Kinetic Ledger

Production-style full-stack admin dashboard for financial operations, with secure auth, role-based access, analytics, and operational controls.

## Why This Project

Kinetic Ledger is designed as a focused control plane:

- Secure login with JWT.
- Clear RBAC separation: `viewer`, `analyst`, `admin`.
- Records and analytics in a single operator experience.
- System operations built into the dashboard: support tickets, logs, deploy action.

## Core Capabilities

- Authentication and authorization
   - Login with JWT bearer tokens.
   - Route protection and role guards.
- Financial records
   - Record listing with pagination.
   - Role-aware filters and CSV export.
   - Soft-delete behavior respected by listing APIs.
- Dashboard analytics
   - Summary metrics, category breakdown, trends, recent activity.
- Admin operations
   - User management.
   - Support ticket workflow.
   - System logs view.
   - Deploy Node action (admin-only).
- Frontend experience
   - Hero page at `/`.
   - Admin dashboard at `/dashboard`.
   - Multi-page dashboard navigation (Overview, Records, Analytics, Users, Settings, Support, Logs).

## Tech Stack

- Node.js + Express
- SQLite (`better-sqlite3`)
- JWT (`jsonwebtoken`)
- Validation (`zod`)
- Vanilla HTML/CSS/JS frontend (served by Express)

## Quick Start

```bash
npm install
npm run verify
npm start
```

Open:

- Hero: `http://localhost:3000/`
- Dashboard: `http://localhost:3000/dashboard`

## Seeded Accounts

- `admin@kinetic.local` / `Admin@123`
- `analyst@kinetic.local` / `Analyst@123`
- `viewer@kinetic.local` / `Viewer@123`

## API Surface (Primary)

- Auth: `/api/v1/auth/login`
- Users: `/api/v1/users`, `/api/v1/users/me`
- Records: `/api/v1/records`
- Dashboard: `/api/v1/dashboard/summary`, `/api/v1/dashboard/by-category`, `/api/v1/dashboard/trends`, `/api/v1/dashboard/recent`
- System: `/api/v1/system/support-ticket`, `/api/v1/system/logs`, `/api/v1/system/deploy`

## Verification

`npm run verify` validates:

- Auth login flow
- Dashboard summary endpoint
- Records endpoint
- Dashboard route wiring
- Hero route wiring

## Notes

- Standard API envelope: `{ success, data, error, meta }`.
- Inactive users cannot authenticate.
- Viewer role is read-only with restricted filter/query controls.
