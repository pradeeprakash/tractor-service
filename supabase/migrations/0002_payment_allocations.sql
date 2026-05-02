-- Service-linked payments. A payment can settle one or more services. Once a service has
-- any allocation row, it is considered fully settled regardless of allocated amount —
-- shortfall vs total_paise is treated as a discount. Old customer-level payments (those
-- with no allocation rows) keep working as a customer-wide credit against outstanding.

create table if not exists public.payment_allocations (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  payment_id      uuid not null references public.payments(id) on delete cascade,
  service_id      uuid not null references public.services(id) on delete cascade,
  allocated_paise integer not null check (allocated_paise > 0),
  created_at      timestamptz not null default now(),
  unique (service_id)
);
create index if not exists payment_allocations_payment_idx on public.payment_allocations (payment_id);
create index if not exists payment_allocations_owner_idx   on public.payment_allocations (owner_id);

alter table public.payment_allocations enable row level security;

drop policy if exists payment_allocations_owner_all on public.payment_allocations;
create policy payment_allocations_owner_all on public.payment_allocations
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop trigger if exists payment_allocations_set_owner on public.payment_allocations;
create trigger payment_allocations_set_owner before insert on public.payment_allocations
  for each row execute function public.set_owner_id();

-- Atomic insert: payment + N allocations in one transaction. Supabase JS has no
-- client-side transactions, so this RPC is the safe entry point.
create or replace function public.record_payment_with_allocations(
  p_customer_id   uuid,
  p_payment_date  date,
  p_method        text,
  p_notes         text,
  p_allocations   jsonb
) returns public.payments
language plpgsql security invoker as $$
declare
  v_total integer;
  v_payment public.payments;
begin
  select coalesce(sum((a->>'allocated_paise')::int), 0)
    into v_total
    from jsonb_array_elements(p_allocations) a;

  if v_total <= 0 then
    raise exception 'allocations must total > 0';
  end if;

  insert into public.payments (customer_id, payment_date, amount_paise, method, notes)
    values (p_customer_id, p_payment_date, v_total, p_method, nullif(trim(p_notes), ''))
    returning * into v_payment;

  insert into public.payment_allocations (payment_id, service_id, allocated_paise)
  select v_payment.id, (a->>'service_id')::uuid, (a->>'allocated_paise')::int
    from jsonb_array_elements(p_allocations) a;

  return v_payment;
end $$;

-- Replace the customer balances view. Outstanding is now defined as:
--   (sum of service.total_paise for services with NO allocation)
--   minus
--   (sum of payment.amount_paise for payments with NO allocation rows).
-- total_billed_paise / total_paid_paise are kept as raw sums for reporting.
create or replace view public.customer_balances
with (security_invoker = true) as
with
  all_billed as (
    select customer_id, sum(total_paise) as total_billed_paise
      from public.services group by customer_id
  ),
  all_paid as (
    select customer_id, sum(amount_paise) as total_paid_paise
      from public.payments group by customer_id
  ),
  unsettled as (
    select s.customer_id,
           sum(s.total_paise)        as unsettled_billed_paise,
           max(s.service_date)       as last_service_date
      from public.services s
     where not exists (
       select 1 from public.payment_allocations pa where pa.service_id = s.id
     )
     group by s.customer_id
  ),
  legacy_credit as (
    select p.customer_id,
           sum(p.amount_paise)       as legacy_credit_paise,
           max(p.payment_date)       as last_payment_date
      from public.payments p
     where not exists (
       select 1 from public.payment_allocations pa where pa.payment_id = p.id
     )
     group by p.customer_id
  )
select
  c.id                                                                          as customer_id,
  c.owner_id,
  c.name,
  c.phone,
  c.village,
  coalesce(ab.total_billed_paise, 0)                                            as total_billed_paise,
  coalesce(ap.total_paid_paise, 0)                                              as total_paid_paise,
  coalesce(u.unsettled_billed_paise, 0) - coalesce(lc.legacy_credit_paise, 0)   as balance_paise,
  coalesce(u.last_service_date, lc.last_payment_date)                           as last_activity_date
from public.customers c
left join all_billed    ab on ab.customer_id = c.id
left join all_paid      ap on ap.customer_id = c.id
left join unsettled     u  on u.customer_id  = c.id
left join legacy_credit lc on lc.customer_id = c.id;
