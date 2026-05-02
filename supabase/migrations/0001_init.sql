-- TSMS schema. Money in paise (integer). Hours stored as hours_x2 to enforce 0.5 increments.

create extension if not exists "pgcrypto";

-- Customers ----------------------------------------------------------------

create table if not exists public.customers (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  phone       text,
  village     text,
  notes       text,
  created_at  timestamptz not null default now()
);
create index if not exists customers_owner_name_idx on public.customers (owner_id, name);

-- Tools --------------------------------------------------------------------

create table if not exists public.tools (
  id                   uuid primary key default gen_random_uuid(),
  owner_id             uuid not null references auth.users(id) on delete cascade,
  name                 text not null,
  rate_paise_per_hour  integer not null check (rate_paise_per_hour > 0),
  active               boolean not null default true,
  sort_order           integer not null default 0,
  created_at           timestamptz not null default now()
);
create index if not exists tools_owner_active_idx on public.tools (owner_id, active);

-- Services -----------------------------------------------------------------
-- hours_x2 stores hours * 2 as integer so 0.5 increments are enforceable.
-- total_paise is GENERATED — Postgres computes it; clients can never override.

create table if not exists public.services (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null references auth.users(id) on delete cascade,
  customer_id         uuid not null references public.customers(id) on delete restrict,
  tool_id             uuid not null references public.tools(id) on delete restrict,
  service_date        date not null default current_date,
  hours_x2            integer not null check (hours_x2 > 0),
  rate_paise_per_hour integer not null check (rate_paise_per_hour > 0),
  total_paise         integer generated always as (rate_paise_per_hour * hours_x2 / 2) stored,
  notes               text,
  created_at          timestamptz not null default now()
);
create index if not exists services_owner_customer_date_idx on public.services (owner_id, customer_id, service_date desc);
create index if not exists services_owner_date_idx on public.services (owner_id, service_date desc);

-- Payments -----------------------------------------------------------------

create table if not exists public.payments (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  customer_id   uuid not null references public.customers(id) on delete restrict,
  payment_date  date not null default current_date,
  amount_paise  integer not null check (amount_paise > 0),
  method        text not null check (method in ('cash','upi')),
  notes         text,
  created_at    timestamptz not null default now()
);
create index if not exists payments_owner_customer_date_idx on public.payments (owner_id, customer_id, payment_date desc);
create index if not exists payments_owner_date_idx on public.payments (owner_id, payment_date desc);

-- Expenses -----------------------------------------------------------------

create table if not exists public.expenses (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  expense_date  date not null default current_date,
  category      text not null check (category in ('fuel','maintenance','repair','other')),
  amount_paise  integer not null check (amount_paise > 0),
  notes         text,
  created_at    timestamptz not null default now()
);
create index if not exists expenses_owner_date_idx on public.expenses (owner_id, expense_date desc);

-- Customer balances view ---------------------------------------------------

create or replace view public.customer_balances
with (security_invoker = true) as
select
  c.id            as customer_id,
  c.owner_id,
  c.name,
  c.phone,
  c.village,
  coalesce(s.billed_paise, 0)                                 as total_billed_paise,
  coalesce(p.paid_paise,   0)                                 as total_paid_paise,
  coalesce(s.billed_paise, 0) - coalesce(p.paid_paise, 0)     as balance_paise,
  coalesce(s.last_service_date, p.last_payment_date)          as last_activity_date
from public.customers c
left join (
  select customer_id, sum(total_paise) as billed_paise, max(service_date) as last_service_date
  from public.services group by customer_id
) s on s.customer_id = c.id
left join (
  select customer_id, sum(amount_paise) as paid_paise, max(payment_date) as last_payment_date
  from public.payments group by customer_id
) p on p.customer_id = c.id;

-- RLS ----------------------------------------------------------------------

alter table public.customers enable row level security;
alter table public.tools     enable row level security;
alter table public.services  enable row level security;
alter table public.payments  enable row level security;
alter table public.expenses  enable row level security;

drop policy if exists customers_owner_all on public.customers;
create policy customers_owner_all on public.customers
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists tools_owner_all on public.tools;
create policy tools_owner_all on public.tools
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists services_owner_all on public.services;
create policy services_owner_all on public.services
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists payments_owner_all on public.payments;
create policy payments_owner_all on public.payments
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists expenses_owner_all on public.expenses;
create policy expenses_owner_all on public.expenses
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Auto-fill owner_id from auth.uid() so clients don't need to pass it -----

create or replace function public.set_owner_id()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.owner_id is null then
    new.owner_id := auth.uid();
  end if;
  return new;
end $$;

drop trigger if exists customers_set_owner on public.customers;
create trigger customers_set_owner before insert on public.customers
  for each row execute function public.set_owner_id();

drop trigger if exists tools_set_owner on public.tools;
create trigger tools_set_owner before insert on public.tools
  for each row execute function public.set_owner_id();

drop trigger if exists services_set_owner on public.services;
create trigger services_set_owner before insert on public.services
  for each row execute function public.set_owner_id();

drop trigger if exists payments_set_owner on public.payments;
create trigger payments_set_owner before insert on public.payments
  for each row execute function public.set_owner_id();

drop trigger if exists expenses_set_owner on public.expenses;
create trigger expenses_set_owner before insert on public.expenses
  for each row execute function public.set_owner_id();
