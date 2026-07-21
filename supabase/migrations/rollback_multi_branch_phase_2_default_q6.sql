-- ROLLBACK: Phase 2 default Q6 branch trigger for orders
-- Date: 2026-07-21
-- Notes:
-- - Reverts only Phase 2 trigger/function and marker.
-- - Does not drop columns, tables, or data.
-- - Does not rollback Phase 1.

begin;

do $$
begin
  if to_regclass('public.orders') is not null then
    execute 'drop trigger if exists trg_orders_default_branch on public.orders';
  end if;
end $$;

drop function if exists public.avnt_set_default_order_branch();

do $$
begin
  if to_regclass('public.avnt_schema_migrations') is not null then
    delete from public.avnt_schema_migrations
    where migration_key = 'multi_branch_phase_2_default_q6_20260721';
  end if;
end $$;

commit;
