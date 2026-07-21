-- PHASE 1: Multi-branch database foundation (backward-compatible, additive only)
-- Date: 2026-07-21
-- Notes:
-- - No destructive changes.
-- - No NOT NULL for new branch_id columns.
-- - No runtime behavior changes.

begin;

create extension if not exists pgcrypto;

create table if not exists public.avnt_schema_migrations (
  migration_key text primary key,
  created_at timestamptz not null default now()
);

alter table public.avnt_schema_migrations enable row level security;

do $$
begin
  if to_regclass('public.products') is null then
    raise exception 'Missing required legacy table: public.products';
  end if;

  if to_regclass('public.orders') is null then
    raise exception 'Missing required legacy table: public.orders';
  end if;

  if to_regclass('public.merchant_devices') is null then
    raise exception 'Missing required legacy table: public.merchant_devices';
  end if;

  if to_regclass('public.shop_settings') is null then
    raise exception 'Missing required legacy table: public.shop_settings';
  end if;
end $$;

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  short_name text not null,
  address text not null,
  phone text,
  latitude double precision,
  longitude double precision,
  is_active boolean not null default true,
  is_open boolean not null default true,
  preparation_minutes integer not null default 15,
  delivery_radius_km numeric not null default 10,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_branches_is_active on public.branches (is_active);
create index if not exists idx_branches_sort_order on public.branches (sort_order);

insert into public.branches (
  code,
  name,
  short_name,
  address,
  phone,
  latitude,
  longitude,
  is_active,
  is_open,
  preparation_minutes,
  delivery_radius_km,
  sort_order,
  updated_at
)
values (
  'q6',
  'Ăn Vặt Ngọc Trinh - Chi nhánh Quận 6',
  'Quận 6',
  '240/127/22C Nguyễn Văn Luông, Phường Bình Phú, TP.HCM',
  null,
  10.7456603,
  106.6345814,
  true,
  true,
  15,
  10,
  0,
  now()
)
on conflict (code) do update
set
  name = excluded.name,
  short_name = excluded.short_name,
  address = excluded.address,
  phone = excluded.phone,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  updated_at = now();

insert into public.branches (
  code,
  name,
  short_name,
  address,
  phone,
  latitude,
  longitude,
  is_active,
  is_open,
  preparation_minutes,
  delivery_radius_km,
  sort_order,
  updated_at
)
values (
  'q1',
  'Ăn Vặt Ngọc Trinh - Chi nhánh Quận 1',
  'Quận 1',
  '178/4A Cô Giang, Phường Cầu Ông Lãnh, TP.HCM',
  null,
  10.7381566,
  106.6401792,
  false,
  false,
  15,
  10,
  10,
  now()
)
on conflict (code) do update
set
  name = excluded.name,
  short_name = excluded.short_name,
  address = excluded.address,
  phone = excluded.phone,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  updated_at = now();

do $$
declare
  product_id_type text;
begin
  select format_type(a.atttypid, a.atttypmod)
  into product_id_type
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'products'
    and a.attname = 'id'
    and a.attnum > 0
    and not a.attisdropped
  limit 1;

  if product_id_type is null then
    raise exception 'Cannot resolve public.products.id data type';
  end if;

  execute format(
    'create table if not exists public.branch_product_settings (
      id uuid primary key default gen_random_uuid(),
      branch_id uuid not null references public.branches(id) on delete cascade,
      product_id %s not null references public.products(id) on delete cascade,
      is_available boolean not null default true,
      is_sold_out boolean not null default false,
      price_override bigint,
      sort_order integer not null default 0,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (branch_id, product_id)
    )',
    product_id_type
  );
end $$;

create index if not exists idx_bps_branch_id on public.branch_product_settings (branch_id);
create index if not exists idx_bps_product_id on public.branch_product_settings (product_id);
create index if not exists idx_bps_available on public.branch_product_settings (branch_id, is_available, is_sold_out);

alter table public.branches enable row level security;
alter table public.branch_product_settings enable row level security;

alter table if exists public.orders
  add column if not exists branch_id uuid;

alter table if exists public.merchant_devices
  add column if not exists branch_id uuid;

alter table if exists public.shop_settings
  add column if not exists branch_id uuid;

create index if not exists idx_orders_branch_id on public.orders (branch_id);
create index if not exists idx_merchant_devices_branch_id on public.merchant_devices (branch_id);
create index if not exists idx_shop_settings_branch_id on public.shop_settings (branch_id);

insert into public.avnt_schema_migrations (migration_key)
values ('multi_branch_phase_1_20260721')
on conflict (migration_key) do nothing;

commit;
