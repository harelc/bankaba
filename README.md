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

## Fork & Set Up Your Own Bank

Want to run your own family bank? Here's how to get it up and running in about 10 minutes.

### 1. Fork & Clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/bankaba.git
cd bankaba
npm install
```

### 2. Create a Turso Database

Turso provides a free serverless SQLite database. Create an account at [turso.tech](https://turso.tech), then:

```bash
# Install the Turso CLI
brew install tursodatabase/tap/turso   # macOS
# or: curl -sSfL https://get.tur.so/install.sh | bash

# Authenticate
turso auth login

# Create a database (pick a region close to you)
turso db create my-family-bank --location ams

# Get your database URL
turso db show my-family-bank --url
# → libsql://my-family-bank-yourname.turso.io

# Create an auth token
turso db tokens create my-family-bank
# → eyJhbGciOi...
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
TURSO_DATABASE_URL=libsql://my-family-bank-yourname.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOi...your-token-here
JWT_SECRET=any-random-string-at-least-32-chars
```

The `JWT_SECRET` can be anything — generate one with `openssl rand -hex 32` if you like.

### 4. Seed the Database

```bash
npm run seed
```

This creates the schema and populates it with test accounts:
- **אבא** (admin) — password: `admin123`
- **אייל** (child) — password: `1234`
- **רעות** (child) — password: `1234`

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Log in as אבא to access the admin panel.

### 6. Customize Your Bank

**Change account names and passwords**: Log in as admin, go to the admin panel, and edit accounts or create new ones. You can also re-edit `src/lib/seed.ts` and re-run `npm run seed` (this will reset all data).

**Change the bank name**: Edit `src/lib/constants.ts` — the `appName` field and any other Hebrew strings you want to personalize.

**Change default interest rates**: Log in as admin → Settings, or edit the defaults in `src/lib/constants.ts`.

**Change the currency**: The app uses Israeli Shekels (₪/agorot). To change currency:
1. Update `formatCurrency` in `src/lib/utils.ts` (change `currency: 'ILS'`)
2. Update the currency symbol in the settings table
3. Note: all amounts are stored as integers in the smallest unit (e.g., cents for USD, pence for GBP)

### 7. Deploy to Netlify

1. Push your fork to GitHub
2. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
3. Connect your GitHub repo
4. Build settings should auto-detect from `netlify.toml`, but verify:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
5. Add environment variables in **Site settings → Environment variables**:
   - `TURSO_DATABASE_URL` — your Turso database URL
   - `TURSO_AUTH_TOKEN` — your Turso auth token
   - `JWT_SECRET` — same value as your `.env.local`
6. Deploy!

### 8. Seed the Production Database

After the first deploy, seed your production database:

```bash
TURSO_DATABASE_URL="libsql://my-family-bank-yourname.turso.io" \
TURSO_AUTH_TOKEN="your-token" \
npm run seed
```

Then log in to your live site and change the admin password immediately.

### 9. Verify the Daily Interest Cron

The daily interest cron runs as a Netlify Scheduled Function at 2am UTC. To verify it's working:

1. In the Netlify dashboard, go to **Functions** → look for `daily-interest`
2. It should show as a **Scheduled** function
3. You can trigger it manually by visiting `https://your-site.netlify.app/api/cron/interest` in your browser (GET is supported for testing)
4. Check the function logs the next day to confirm it ran

### Troubleshooting

- **"שגיאת שרת" on every page**: Check that your `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are correct in Netlify environment variables. Redeploy after changing env vars.
- **Login doesn't work after deploy**: Make sure you ran the seed script against the production database (step 8).
- **Interest not accruing daily**: Check Netlify Functions logs. The cron talks directly to Turso, so it needs `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in your Netlify env vars.
- **Amounts look wrong**: All money is stored in agorot (1/100 shekel). If you see `500000`, that's ₪5,000.00.

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
