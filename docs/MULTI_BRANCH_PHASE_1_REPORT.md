# MULTI BRANCH PHASE 1 REPORT

Ngay thuc hien: 2026-07-21
Pham vi: PHASE 1 - Nen tang database da chi nhanh tuong thich nguoc.

## 1) Cac file da tao

- supabase/migrations/20260721_multi_branch_phase_1.sql
- supabase/migrations/rollback_multi_branch_phase_1.sql
- types/branch.ts
- docs/MULTI_BRANCH_PHASE_1_REPORT.md

## 2) Schema moi duoc bo sung (additive)

Migration phase 1 bo sung cac thanh phan sau:

- Bang moi public.branches
  - id uuid primary key default gen_random_uuid()
  - code text unique not null
  - name text not null
  - short_name text not null
  - address text not null
  - phone text nullable
  - latitude double precision nullable
  - longitude double precision nullable
  - is_active boolean default true
  - is_open boolean default true
  - preparation_minutes integer default 15
  - delivery_radius_km numeric default 10
  - sort_order integer default 0
  - created_at timestamptz default now()
  - updated_at timestamptz default now()

- Seed du lieu branch mac dinh:
  - q6 (dang hoat dong)
  - q1 (chua hoat dong)

- Bang moi public.branch_product_settings
  - id uuid primary key default gen_random_uuid()
  - branch_id uuid references branches(id) on delete cascade
  - product_id dung dung kieu du lieu thuc te cua products.id (resolve dong bang format_type)
  - is_available boolean default true
  - is_sold_out boolean default false
  - price_override bigint nullable
  - sort_order integer default 0
  - created_at timestamptz default now()
  - updated_at timestamptz default now()
  - unique(branch_id, product_id)

- Them cot nullable branch_id:
  - orders.branch_id
  - merchant_devices.branch_id
  - shop_settings.branch_id

- Them cac index moi cho hieu nang va tra cuu branch.

- Bat RLS cho 2 bang moi (chua tao policy trong Phase 1):
  - alter table public.branches enable row level security;
  - alter table public.branch_product_settings enable row level security;
  - Service role van truy cap duoc, phu hop cho migration + admin backend.

- Them marker schema migration:
  - Bang: public.avnt_schema_migrations (migration_key, created_at)
  - Marker key: multi_branch_phase_1_20260721

- Toan bo migration va rollback deu duoc boc transaction:
  - begin; ... commit;
  - Neu loi giua chung, se rollback toan bo, khong de trang thai chay do.

- Kiem tra bang legacy bat buoc ngay dau migration:
  - public.products
  - public.orders
  - public.merchant_devices
  - public.shop_settings
  - Neu thieu, migration raise exception ro rang va dung ngay.

- Seed branches idempotent an toan van hanh:
  - ON CONFLICT(code) chi cap nhat truong thong tin tinh:
    name, short_name, address, phone, latitude, longitude, updated_at.
  - KHONG cap nhat trang thai van hanh:
    is_active, is_open, preparation_minutes, delivery_radius_km, sort_order.
  - Dieu nay tranh truong hop chay lai migration lam doi trang thai branch dang van hanh.

- branch_product_settings.product_id FK:
  - references public.products(id) on delete cascade
  - Khi xoa mon goc, cau hinh theo branch cua mon do cung tu xoa.

## 3) Vi sao Phase 1 khong anh huong website dang chay

- Toan bo thay doi la additive (them bang, them cot nullable, them index).
- Toan bo migration duoc transaction hoa, tranh partial apply.
- Khong doi hanh vi runtime cua website.
- Khong sua cac file runtime nhay cam:
  - app/dat-mon-nhanh/page.tsx
  - app/api/maps/route.ts
  - app/api/notify-new-order/route.ts
- Khong dat NOT NULL cho branch_id moi => insert/update luong cu van chay.
- Khong doi ten/xoa cot cu, khong doi primary key cu.
- Chua backfill du lieu cu trong Phase 1.

## 4) Nhung gi chua bat trong Phase 1

- Chua bat giao dien chon chi nhanh cho khach.
- Chua bat auto-route chi nhanh.
- Chua doi cach tinh phi ship.
- Chua doi menu khach hang theo branch.
- Chua doi FCM runtime theo branch.
- Chua doi luong admin runtime.
- Chua dual-write branch_id tu app.
- Chua tao policy RLS cho anon/authenticated tren bang branches va branch_product_settings.

## 5) Cach chay migration thu cong (chua thuc hien trong phien nay)

Lua chon 1: Chay bang Supabase SQL Editor
1. Mo file supabase/migrations/20260721_multi_branch_phase_1.sql
2. Copy toan bo SQL
3. Paste vao SQL Editor cua project Supabase
4. Execute va kiem tra log thanh cong

Lua chon 2: Neu dung quy trinh cli noi bo cua team
1. Ap dung dung file migration tren moi truong staging truoc
2. Verify schema + smoke test
3. Moi chay production theo change window

## 6) Cach rollback

Neu can rollback Phase 1:
1. Chay file supabase/migrations/rollback_multi_branch_phase_1.sql
2. File rollback se:
   - KIEM TRA marker multi_branch_phase_1_20260721
   - MAC DINH chan rollback de tranh chay nham
   - Yeu cau xac nhan thu cong bang:
     SET avnt.allow_phase1_rollback = 'yes';
   - Sau khi xac nhan thu cong, rollback moi cho phep xoa doi tuong Phase 1
   - rollback duoc boc transaction de tranh xoa do dang
3. Khong dong vao cac cot/bang cu khac.

## 7) Rui ro con lai

- Chua co dual-write branch_id tu runtime nen cot moi chua duoc su dung.
- product_id type trong branch_product_settings duoc suy ra dong luc chay; can dam bao bang products ton tai truoc khi chay migration.
- Rollback la thao tac pha huy, can verify thu cong truoc khi bat safety gate.

## 8) Buoc tiep theo (Phase 2)

- Phase 2: Dual-write branch_id cho orders va merchant_devices (van fallback Q6).
- Bo sung branch selection context noi bo (chua expose UI neu chua can).
- Chuan bi branch-aware notify path nhung van fallback path cu.
- Chua bat thay doi menu/ship cho khach cho den khi co test day du.
