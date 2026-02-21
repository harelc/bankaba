# CLAUDE.md — הבנק של אבא

## What is this project?
A family banking web app (Hebrew, RTL). Kids manage virtual deposits with compound interest. Admin (dad) manages accounts and settings.

## Key decisions
- **No ORM** — raw SQL via `@libsql/client`. 4 tables, not worth the abstraction.
- **Money in agorot** (integers) — avoids floating-point. 100 agorot = 1 shekel. Rates in basis points (100 bps = 1%).
- **No NextAuth** — simple JWT (jose) + bcrypt. Family app with ~5 users doesn't need OAuth.
- **No i18n library** — all Hebrew strings in `src/lib/constants.ts`. Single language.
- **Hybrid interest** — daily cron writes to DB (source of truth), on-the-fly projection for display between crons.
- **Netlify** for hosting — uses `@netlify/plugin-nextjs` and Netlify Scheduled Functions for the daily cron.

## Commands
- `npm run dev` — start dev server (turbopack, port 3000)
- `npm run build` — production build
- `npm run seed` — seed database (reads TURSO_DATABASE_URL from env, falls back to local.db)

## Database
- **Turso** (libsql) in production, `file:local.db` for local dev
- Schema auto-migrates via `initializeDatabase()` (called in API routes)
- Tables: `accounts`, `deposits`, `transactions`, `settings`

## Auth
- JWT in HttpOnly cookie named `session`, 7-day expiry
- Middleware handles page auth (redirects to `/`); API routes check auth internally
- Roles: `admin` and `child`

## File conventions
- API routes: `src/app/api/[resource]/route.ts`
- Pages: `src/app/[route]/page.tsx` (all client components with `'use client'`)
- Shared UI: `src/components/ui/` (button, card, input, badge, dialog)
- Feature components: `src/components/dashboard/`, `src/components/deposits/`
- Hooks: `src/hooks/` (SWR-based data fetching)

## Important gotchas
- Next.js 16 deprecates `middleware.ts` in favor of `proxy` — still works but shows a warning
- Recharts types are strict — use `any` for Tooltip formatter params
- The `netlify/` directory is excluded from tsconfig to avoid build conflicts
- `.env.local` has real Turso credentials — never commit it
