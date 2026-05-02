# Prakash Tractor — Service Manager (TSMS)

A mobile-first Next.js + Supabase app that replaces the operator's paper notebook. Records services, tracks customer balances, generates shareable statements.

## Quick start

```bash
pnpm install
cp .env.local.example .env.local   # fill in Supabase credentials
pnpm dev
```

Then open http://localhost:3000 on your phone over the local network for the real test.

## Environment

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
NEXT_PUBLIC_BUSINESS_NAME=Prakash Tractor Service
```

## Supabase setup

1. Create a project at supabase.com.
2. Run the migration: copy `supabase/migrations/0001_init.sql` into the SQL editor and execute.
3. Create the operator account: **Authentication → Users → Add user** (email + password). Then disable sign-ups under **Authentication → Providers → Email** so this stays single-user.
4. (Optional) Seed: edit `supabase/seed.sql` — replace `<OPERATOR_UUID>` with the new user's id, then run it.

RLS is enabled on every table and pins rows to `auth.uid()`. The `set_owner_id` trigger fills `owner_id` automatically, so client inserts never need to pass it.

## What's enforced server-side (not just in the UI)

- **Service total** (`total_paise`) is a `GENERATED ALWAYS AS (rate × hours_x2 / 2) STORED` column — clients can never override it.
- **0.5-hour increments** are guaranteed because hours are stored as `hours_x2 INTEGER`.
- **Money in paise** (integer) avoids float drift.
- **RLS** keeps a stranger's anon key from reading anything.

## Scripts

- `pnpm dev` — Next.js dev server
- `pnpm build` — production build
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm lint` — ESLint
- `pnpm test` — vitest (domain unit tests)

## Layout

```
app/
  (auth)/login        — single-user sign-in
  (app)/              — authenticated shell (bottom tabs + FAB on mobile, sidebar ≥md)
    page.tsx          — Dashboard
    services/new      — Service entry (the speed-critical screen)
    services          — Recent services feed
    customers         — Ledger, [id] detail, [id]/report (print + WhatsApp)
    payments/new      — Payment entry
    expenses          — List + add
    tools             — List + add + edit
    more              — Mobile menu
components/
  shell/              — BottomNav, FabNewService (inside BottomNav), DesktopSidebar
  customers/          — CustomerPicker, CustomerLedgerCard, BalancePill
  services/           — ServiceForm, ToolPicker, HoursStepper
  payments/           — PaymentForm
  reports/            — CustomerStatement (print-ready), ShareButton
  dashboard/          — StatTile, RevenueByToolChart
  common/             — Money, EmptyState, PageHeader, Toast
lib/
  domain/             — pricing, balance, types (pure, unit-tested)
  queries/            — react-query hooks per entity
  supabase/           — client, server, middleware
  format.ts, share.ts, cn.ts
supabase/
  migrations/0001_init.sql
  seed.sql
```

## Design

- Palette: warm off-white background (`#FAFAF7`), agriculture green primary (`#2F7D32`), red for outstanding, green for settled. High contrast for sunlight reading.
- Touch targets ≥44px; inputs are 48px tall.
- Tabular numerals on every money/hours display so columns align.
- Print styles for `/customers/[id]/report` (Android Chrome → "Save as PDF" produces a clean statement).
- WhatsApp sharing builds a plain-text statement and opens `wa.me/<phone>` (or the system share sheet via `navigator.share()` when available).
