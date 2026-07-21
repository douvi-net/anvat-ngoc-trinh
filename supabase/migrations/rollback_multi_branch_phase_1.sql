-- ROLLBACK: Multi-branch database foundation phase 1
-- Date: 2026-07-21
-- Notes:
-- - Removes only objects introduced in phase 1.
-- - Does not touch legacy columns/data beyond dropping newly added branch_id columns.
-- - Guarded rollback: blocked by default to avoid accidental destructive execution.

begin;

do $$
begin
  if to_regclass('public.avnt_schema_migrations') is null then
    raise exception 'Rollback blocked: marker table public.avnt_schema_migrations does not exist. Verify manually before destructive rollback.';
  end if;

  if not exists (
    select 1
    from public.avnt_schema_migrations
    where migration_key = 'multi_branch_phase_1_20260721'
  ) then
    raise exception 'Rollback blocked: marker multi_branch_phase_1_20260721 not found. Refusing blind rollback.';
  end if;

  if coalesce(current_setting('avnt.allow_phase1_rollback', true), '') <> 'yes' then
    raise exception 'Rollback blocked by safety gate. After manual verification, run: SET avnt.allow_phase1_rollback = ''yes''; then re-run this file.';
  end if;
end $$;

-- Drop indexes introduced in phase 1

drop index if exists public.idx_orders_branch_id;
drop index if exists public.idx_merchant_devices_branch_id;
drop index if exists public.idx_shop_settings_branch_id;

drop index if exists public.idx_bps_available;
drop index if exists public.idx_bps_product_id;
drop index if exists public.idx_bps_branch_id;

drop index if exists public.idx_branches_sort_order;
drop index if exists public.idx_branches_is_active;

-- Drop added nullable columns

alter table if exists public.orders
  drop column if exists branch_id;

alter table if exists public.merchant_devices
  drop column if exists branch_id;

alter table if exists public.shop_settings
  drop column if exists branch_id;

-- Drop new tables

drop table if exists public.branch_product_settings;
drop table if exists public.branches;

delete from public.avnt_schema_migrations
where migration_key = 'multi_branch_phase_1_20260721';

commit;
