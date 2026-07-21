-- PHASE 2: Auto-assign Q6 branch_id for new orders (backward-compatible)
-- Date: 2026-07-21
-- Notes:
-- - Keeps current website flow working when branch_id is not provided.
-- - Preserves branch_id if runtime explicitly sends one.
-- - No backfill for old orders.
-- - No NOT NULL/foreign key changes on public.orders.branch_id.

begin;

do $$
begin
  if to_regclass('public.branches') is null then
    raise exception 'Missing required table: public.branches';
  end if;

  if to_regclass('public.orders') is null then
    raise exception 'Missing required table: public.orders';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'orders'
      and column_name = 'branch_id'
  ) then
    raise exception 'Missing required column: public.orders.branch_id';
  end if;

  if not exists (
    select 1
    from public.branches
    where code = 'q6'
  ) then
    raise exception 'Missing required branch seed: public.branches code=q6';
  end if;
end $$;

create or replace function public.avnt_set_default_order_branch()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_q6_branch_id uuid;
begin
  if new.branch_id is not null then
    return new;
  end if;

  select b.id
  into v_q6_branch_id
  from public.branches b
  where b.code = 'q6'
  limit 1;

  if v_q6_branch_id is null then
    raise exception 'Cannot assign default order branch: code=q6 not found in public.branches';
  end if;

  new.branch_id := v_q6_branch_id;
  return new;
end;
$$;

drop trigger if exists trg_orders_default_branch on public.orders;

create trigger trg_orders_default_branch
before insert on public.orders
for each row
execute function public.avnt_set_default_order_branch();

do $$
begin
  if to_regclass('public.avnt_schema_migrations') is not null then
    insert into public.avnt_schema_migrations (migration_key)
    values ('multi_branch_phase_2_default_q6_20260721')
    on conflict (migration_key) do nothing;
  end if;
end $$;

commit;
