# MULTI BRANCH PHASE 4.1 REPORT

Ngay thuc hien: 2026-07-21
Pham vi: Khoi tao cau hinh menu Q6 trong branch_product_settings bang toan bo public.products hien co.

## 1) File da tao

- supabase/migrations/20260721_multi_branch_phase_4_1_seed_q6_products.sql
- supabase/migrations/rollback_multi_branch_phase_4_1_seed_q6_products.sql
- docs/MULTI_BRANCH_PHASE_4_1_REPORT.md

## 2) Schema da pre-check

Migration kiem tra day du truoc khi seed:
- Ton tai `public.branches`
- Ton tai `public.products`
- Ton tai `public.branch_product_settings`
- Ton tai branch `code = 'q6'`
- Type `public.products.id` trung type `public.branch_product_settings.product_id`
- Type `public.avnt_phase_4_1_seeded_products.product_id` (neu table ton tai) trung type `public.products.id`

Neu thieu bat ky dieu kien nao: `raise exception`, toan bo transaction rollback.

## 3) Cach seed Q6 khong ghi de cau hinh cu

- Migration lay `q6` branch id tu `public.branches` (khong hardcode UUID).
- Migration su dung 1 statement nguyen tu:
  - `with inserted as (insert ... on conflict do nothing returning branch_id, product_id)`
  - `insert vao public.avnt_phase_4_1_seeded_products tu inserted`
- Audit CHI ghi cac dong da duoc insert thanh cong vao `branch_product_settings`.
- Su dung `on conflict (branch_id, product_id) do nothing` de giu idempotent.
- Khong update, khong overwrite cau hinh da ton tai.

## 3.1) Loai bo race condition

- Da loai bo cach audit truoc, insert sau.
- Vi audit duoc ghi tu `insert ... returning`, rollback ve sau chi co the xoa nhung dong migration nay tao that su.
- Khong tao audit gia cho dong do tien trinh khac insert truoc.

## 4) Gia tri mac dinh khi seed

- `branch_id = q6.id`
- `product_id = products.id`
- `is_available = true`
- `is_sold_out`:
  - Neu `products` co cot `is_sold_out` -> dung `coalesce(products.is_sold_out, false)`
  - Neu khong co cot -> `false`
- `price_override = null`
- `sort_order`:
  - Neu `products` co cot `sort_order` -> dung `coalesce(products.sort_order, 0)::integer`
  - Neu khong co cot -> `0`

## 5) Marker migration

Neu bang marker ton tai, migration ghi:
- `multi_branch_phase_4_1_seed_q6_products_20260721`
vao `public.avnt_schema_migrations` voi `on conflict do nothing`.

## 5.1) RLS cho audit table

- Sau khi tao `public.avnt_phase_4_1_seeded_products`, migration bat:
  - `alter table public.avnt_phase_4_1_seeded_products enable row level security;`
- Khong tao policy cho anon/authenticated trong Phase 4.1.

## 6) Rollback an toan

Rollback KHONG xoa theo `branch_id = q6` mo rong.
Rollback chi xoa cac dong `branch_product_settings` khop danh sach audit cua migration key:
- `multi_branch_phase_4_1_seed_q6_products_20260721`

Sau do rollback:
- xoa audit rows cua migration key
- xoa marker migration key (neu bang marker ton tai)

Rollback KHONG:
- drop bang `branch_product_settings`
- sua/xoa `public.products`
- dong vao q1
- dong vao schema Phase 1-3

## 7) SQL kiem tra sau migration

A. Dem so san pham hien co:

```sql
select count(*) from public.products;
```

B. Dem cau hinh Q6:

```sql
select count(*)
from public.branch_product_settings bps
join public.branches b on b.id = bps.branch_id
where b.code = 'q6';
```

C. Tim san pham chua co cau hinh Q6:

```sql
select p.id, p.name
from public.products p
where not exists (
  select 1
  from public.branch_product_settings bps
  join public.branches b on b.id = bps.branch_id
  where bps.product_id = p.id
    and b.code = 'q6'
);
```

Ky vong sau migration:
- Query C tra ve 0 dong.

## 8) Vi sao website hien tai khong bi anh huong

- Khong sua runtime (`app/`, `components/`, `lib/`, `types/`).
- Khong sua `public.products` nen menu hien tai cua khach khong doi.
- Khong doi gia, sort_order, is_active o san pham goc.
- Chua bat branch menu filtering tren frontend/admin.

## 9) Chua trien khai trong Phase 4.1

- Chua tao cau hinh san pham cho q1.
- Chua cho frontend doc menu theo branch.
- Chua cho admin quan ly product availability theo branch.

## 10) Ke hoach Phase 4.2

- Seed cau hinh branch_product_settings cho Q1 (co kiem soat open/active).
- Bo sung API/menu resolver theo selected branch (co fallback an toan).
- Them kiem tra mon khong ban theo branch truoc khi cho phep doi branch tren frontend.

## 11) So luong san pham du kien duoc seed

- Du kien = so dong query C truoc khi chay migration.
- Migration khong execute trong pham vi task nay, nen so cu the can duoc xac nhan khi DBA chay SQL tren moi truong dich.
