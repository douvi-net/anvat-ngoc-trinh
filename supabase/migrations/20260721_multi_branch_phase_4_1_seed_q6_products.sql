-- PHASE 4.1: Seed Q6 branch product settings from legacy products (additive, idempotent)
-- Date: 2026-07-21
-- Notes:
-- - Does not change public.products.
-- - Seeds only q6 branch.
-- - Uses audit rows so rollback can delete only records created by this phase.

begin;

do $$
declare
  v_migration_key constant text := 'multi_branch_phase_4_1_seed_q6_products_20260721';
  v_q6_branch_id uuid;
  v_products_id_type text;
  v_bps_product_id_type text;
  v_has_products_is_sold_out boolean;
  v_has_products_sort_order boolean;
  v_audit_product_id_type text;
  v_is_sold_out_expr text;
  v_sort_order_expr text;
  v_sql text;
begin
  if to_regclass('public.branches') is null then
    raise exception 'Missing required table: public.branches';
  end if;

  if to_regclass('public.products') is null then
    raise exception 'Missing required table: public.products';
  end if;

  if to_regclass('public.branch_product_settings') is null then
    raise exception 'Missing required table: public.branch_product_settings';
  end if;

  select b.id
  into v_q6_branch_id
  from public.branches b
  where b.code = 'q6'
  limit 1;

  if v_q6_branch_id is null then
    raise exception 'Missing required branch seed: public.branches code=q6';
  end if;

  select format_type(a.atttypid, a.atttypmod)
  into v_products_id_type
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'products'
    and a.attname = 'id'
    and a.attnum > 0
    and not a.attisdropped
  limit 1;

  if v_products_id_type is null then
    raise exception 'Cannot resolve data type: public.products.id';
  end if;

  select format_type(a.atttypid, a.atttypmod)
  into v_bps_product_id_type
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'branch_product_settings'
    and a.attname = 'product_id'
    and a.attnum > 0
    and not a.attisdropped
  limit 1;

  if v_bps_product_id_type is null then
    raise exception 'Cannot resolve data type: public.branch_product_settings.product_id';
  end if;

  if v_products_id_type <> v_bps_product_id_type then
    raise exception
      'Type mismatch: public.products.id (%) != public.branch_product_settings.product_id (%)',
      v_products_id_type,
      v_bps_product_id_type;
  end if;

  execute format(
    'create table if not exists public.avnt_phase_4_1_seeded_products (
      migration_key text not null,
      branch_id uuid not null,
      product_id %s not null,
      created_at timestamptz not null default now(),
      unique (migration_key, branch_id, product_id)
    )',
    v_products_id_type
  );

  alter table public.avnt_phase_4_1_seeded_products
  enable row level security;

  select format_type(a.atttypid, a.atttypmod)
  into v_audit_product_id_type
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'avnt_phase_4_1_seeded_products'
    and a.attname = 'product_id'
    and a.attnum > 0
    and not a.attisdropped
  limit 1;

  if v_audit_product_id_type is distinct from v_products_id_type then
    raise exception
      'Type mismatch: public.avnt_phase_4_1_seeded_products.product_id (%) != public.products.id (%)',
      coalesce(v_audit_product_id_type, '<null>'),
      v_products_id_type;
  end if;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'is_sold_out'
  )
  into v_has_products_is_sold_out;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'sort_order'
  )
  into v_has_products_sort_order;

  v_is_sold_out_expr :=
    case
      when v_has_products_is_sold_out then 'coalesce(p.is_sold_out, false)'
      else 'false'
    end;

  v_sort_order_expr :=
    case
      when v_has_products_sort_order then 'coalesce(p.sort_order, 0)::integer'
      else '0'
    end;

  v_sql := format(
    'with inserted as (
      insert into public.branch_product_settings (
        branch_id,
        product_id,
        is_available,
        is_sold_out,
        price_override,
        sort_order
      )
      select
        %L::uuid,
        p.id,
        true,
        %s,
        null,
        %s
      from public.products p
      on conflict (branch_id, product_id) do nothing
      returning branch_id, product_id
    )
    insert into public.avnt_phase_4_1_seeded_products (
      migration_key,
      branch_id,
      product_id
    )
    select
      %L,
      i.branch_id,
      i.product_id
    from inserted i
    on conflict (migration_key, branch_id, product_id) do nothing',
    v_q6_branch_id::text,
    v_is_sold_out_expr,
    v_sort_order_expr,
    v_migration_key
  );

  execute v_sql;

  if to_regclass('public.avnt_schema_migrations') is not null then
    insert into public.avnt_schema_migrations (migration_key)
    values (v_migration_key)
    on conflict (migration_key) do nothing;
  end if;
end $$;

commit;
