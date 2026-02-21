# הבנק של אבא 🏦

A family banking web app where kids can manage virtual deposits with interest. Dad (admin) sets interest rates, manages accounts, and oversees all deposits. Kids can deposit, withdraw, and watch their money grow with daily compound interest.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Netlify CDN                       │
│              bankaba.netlify.app                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │  Login Page  │  │  Dashboard   │  │  Admin    │  │
│  │  (/)        │  │  (/dashboard)│  │  (/admin) │  │
│  └──────┬──────┘  └──────┬───────┘  └─────┬─────┘  │
│         │                │                │         │
│  ┌──────┴────────────────┴────────────────┴─────┐   │
│  │           Next.js Middleware                  │   │
│  │     JWT verification + role-based routing     │   │
│  └──────────────────┬───────────────────────────┘   │
│                     │                               │
│  ┌──────────────────┴───────────────────────────┐   │
│  │              API Routes (/api/*)              │   │
│  │                                               │   │
│  │  auth/login    accounts/     deposits/        │   │
│  │  auth/logout   accounts/[id] deposits/[id]    │   │
│  │  auth/me       admin/settings deposits/[id]/  │   │
│  │  cron/interest transactions/  withdraw        │   │
│  └──────────────────┬───────────────────────────┘   │
│                     │                               │
├─────────────────────┼───────────────────────────────┤
│  Netlify Functions  │                               │
│  ┌─────────────────┐│                               │
│  │ daily-interest  ││  Scheduled: 0 2 * * *         │
│  │ (cron job)      │├──► POST /api/cron/interest    │
│  └─────────────────┘│                               │
└─────────────────────┼───────────────────────────────┘
                      │
              ┌───────┴───────┐
              │   Turso DB    │
              │  (libsql)     │
              │               │
              │  accounts     │
              │  deposits     │
              │  transactions │
              │  settings     │
              └───────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript, Server Components) |
| Database | Turso (libsql) — serverless SQLite |
| Auth | bcryptjs (password hashing) + jose (JWT in HttpOnly cookies) |
| Styling | Tailwind CSS v4 + Heebo font (Hebrew) |
| UI | lucide-react icons, framer-motion animations, recharts charts |
| Data fetching | SWR (client-side) |
| Validation | Zod |
| Hosting | Netlify (with @netlify/plugin-nextjs) |
| Cron | Netlify Scheduled Functions |

## Database Schema

All monetary values stored as **integers in agorot** (1/100 shekel) to avoid floating-point issues. Interest rates in **basis points** (1/100 percent).

| Table | Purpose |
|-------|---------|
| `accounts` | Users (admin + children). Fields: name, password_hash, role, avatar_emoji |
| `deposits` | Savings deposits. Fields: principal, balance, interest_rate_bps, type (flexible/fixed), term, maturity_date, penalty_pct, status |
| `transactions` | Immutable ledger. Types: deposit, withdrawal, interest, penalty, admin_adjustment |
| `settings` | Single-row global config: default rates, penalty %, min deposit |

## Interest Calculation

**Hybrid approach**: daily cron for accrual (source of truth) + on-the-fly projection for real-time display.

- **Daily cron** (2am): For each active deposit, computes daily compound interest since last accrual, updates balance, creates transaction records.
- **On-the-fly projection**: When viewing a deposit, computes unaccrued interest since last cron for real-time display (never written to DB).
- **Formula**: `balance *= (1 + annualRateBps / 10000 / 365)` per day
- **Early withdrawal penalty** (fixed deposits): Forfeits a configurable % of earned interest.

## Auth Flow

1. Login page shows avatar cards for each account
2. User clicks their avatar, enters password
3. `POST /api/auth/login` validates with bcrypt, returns signed JWT
4. JWT stored in HttpOnly, Secure, SameSite=Strict cookie (7-day expiry)
5. Middleware verifies JWT on every page request; API routes verify internally
6. Admin routes require `role === 'admin'`

## Pages

| Route | Auth | Description |
|-------|------|-------------|
| `/` | Public | Login page with avatar grid |
| `/dashboard` | Child/Admin | Balance summary, deposit cards, recent transactions |
| `/dashboard/deposits/[id]` | Owner/Admin | Deposit detail with growth chart, transaction history, withdraw |
| `/dashboard/deposits/new` | Child/Admin | Create new deposit (flexible or fixed) |
| `/admin` | Admin | All accounts overview with total balances |
| `/admin/accounts` | Admin | Create/edit child accounts |
| `/admin/accounts/new` | Admin | New account form |
| `/admin/settings` | Admin | Default rates, penalties, min deposit |

## API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/auth/login` | Public | Authenticate, set cookie |
| `POST` | `/api/auth/logout` | Any | Clear cookie |
| `GET` | `/api/auth/me` | Any | Get current session |
| `GET` | `/api/accounts` | Any | List accounts (admin gets balances) |
| `POST` | `/api/accounts` | Admin | Create account |
| `GET/PATCH` | `/api/accounts/[id]` | Admin | Get/update account |
| `GET` | `/api/deposits` | Auth | List deposits (own or all for admin) |
| `POST` | `/api/deposits` | Auth | Create deposit |
| `GET/PATCH` | `/api/deposits/[id]` | Owner/Admin | Get/override deposit |
| `POST` | `/api/deposits/[id]/withdraw` | Owner/Admin | Withdraw from deposit |
| `GET` | `/api/transactions` | Auth | Transaction ledger |
| `GET` | `/api/admin/settings` | Any | Get global settings |
| `PUT` | `/api/admin/settings` | Admin | Update global settings |
| `POST/GET` | `/api/cron/interest` | Cron secret | Daily interest accrual |

## Local Development

```bash
npm install
npm run seed    # Creates test accounts and deposits in local.db
npm run dev     # Starts dev server at localhost:3000
```

### Test Accounts (after seed)
- 👨‍💼 **אבא** (admin) — password: `admin123`
- 🦁 **אייל** — password: `1234` — ₪2,500
- 🦊 **רעות** — password: `1234` — ₪2,500

## Deployment (Netlify)

1. Push to GitHub
2. Connect repo on Netlify
3. Set environment variables: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `JWT_SECRET`, `CRON_SECRET`
4. Deploy — `@netlify/plugin-nextjs` handles the build
5. Seed remote DB: `source .env.local && TURSO_DATABASE_URL="$TURSO_DATABASE_URL" TURSO_AUTH_TOKEN="$TURSO_AUTH_TOKEN" npm run seed`
6. Daily interest cron runs automatically via Netlify Scheduled Functions

## Project Structure

```
bankaba/
├── netlify.toml                  # Netlify config
├── netlify/functions/
│   └── daily-interest.ts         # Scheduled cron (2am daily)
├── src/
│   ├── middleware.ts              # JWT auth + role routing
│   ├── app/
│   │   ├── layout.tsx            # Root: RTL, Heebo font
│   │   ├── page.tsx              # Login page
│   │   ├── dashboard/            # Child UI
│   │   ├── admin/                # Admin UI
│   │   └── api/                  # 11 API routes
│   ├── lib/
│   │   ├── db.ts                 # Turso client
│   │   ├── db-schema.ts          # Schema + auto-migration
│   │   ├── auth.ts               # JWT + bcrypt utilities
│   │   ├── interest.ts           # Compound interest engine
│   │   ├── constants.ts          # Hebrew strings
│   │   ├── utils.ts              # Formatting helpers
│   │   └── seed.ts               # Test data seeder
│   ├── components/               # UI components
│   ├── hooks/                    # useAuth, useDeposits (SWR)
│   └── types/                    # TypeScript interfaces
└── .env.local                    # Turso + JWT secrets
```
