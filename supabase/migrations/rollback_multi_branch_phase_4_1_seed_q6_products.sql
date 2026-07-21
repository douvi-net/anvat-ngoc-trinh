-- ROLLBACK: Phase 4.1 seed Q6 branch product settings
-- Date: 2026-07-21
-- Notes:
-- - Deletes only branch_product_settings rows tracked by Phase 4.1 audit rows.
-- - Does not touch products, q1, or any schema from earlier phases.

begin;

do $$
declare
  v_migration_key constant text := 'multi_branch_phase_4_1_seed_q6_products_20260721';
begin
  if to_regclass('public.branch_product_settings') is null then
    raise exception 'Rollback blocked: missing table public.branch_product_settings';
  end if;

  if to_regclass('public.avnt_phase_4_1_seeded_products') is null then
    raise exception 'Rollback blocked: missing audit table public.avnt_phase_4_1_seeded_products';
  end if;

  delete from public.branch_product_settings bps
  using public.avnt_phase_4_1_seeded_products audit
  where audit.migration_key = v_migration_key
    and bps.branch_id = audit.branch_id
    and bps.product_id = audit.product_id;

  delete from public.avnt_phase_4_1_seeded_products audit
  where audit.migration_key = v_migration_key;

  if to_regclass('public.avnt_schema_migrations') is not null then
    delete from public.avnt_schema_migrations
    where migration_key = v_migration_key;
  end if;
end $$;

commit;
