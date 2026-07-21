# MULTI BRANCH PHASE 2 REPORT

Ngay thuc hien: 2026-07-21
Pham vi: Phase 2 - Tu dong gan branch_id Q6 cho don moi.

## 1) File da tao

- supabase/migrations/20260721_multi_branch_phase_2_default_q6.sql
- supabase/migrations/rollback_multi_branch_phase_2_default_q6.sql
- docs/MULTI_BRANCH_PHASE_2_REPORT.md

## 2) Trigger hoat dong nhu the nao

Migration tao function va trigger sau:

- Function: public.avnt_set_default_order_branch()
  - BEFORE INSERT tren public.orders.
  - Neu NEW.branch_id da co gia tri: giu nguyen, khong ghi de.
  - Neu NEW.branch_id la null: tim id branch code = 'q6' trong public.branches va gan vao NEW.branch_id.
  - Neu khong tim thay q6: raise exception ro rang.
  - Cau hinh function:
    - language plpgsql
    - security definer
    - set search_path = public

- Trigger: trg_orders_default_branch
  - BEFORE INSERT ON public.orders
  - Goi function public.avnt_set_default_order_branch().

Tinh idempotent:
- create or replace function
- drop trigger if exists truoc khi create trigger
- marker migration ghi vao public.avnt_schema_migrations neu bang marker ton tai

## 3) Vi sao khong anh huong website hien tai

- Luong website hien tai khong gui branch_id van insert orders binh thuong.
- Trigger se tu gan branch_id = Q6 cho don moi neu branch_id null.
- Khong sua runtime app/dat-mon-nhanh, maps, menu, ship, FCM, admin.
- Khong dat NOT NULL cho orders.branch_id.
- Khong backfill du lieu don cu.
- Neu runtime tuong lai gui branch_id (vd Q1), trigger giu nguyen gia tri do.

## 4) Kiem tra an toan truoc khi ap dung

Migration co pre-check va se raise exception neu thieu:
- public.branches
- public.orders
- public.orders.branch_id
- branch code = 'q6'

Toan bo migration duoc boc trong transaction begin/commit.

## 5) Cach chay SQL thu cong (khong thuc hien trong phien nay)

1. Mo file supabase/migrations/20260721_multi_branch_phase_2_default_q6.sql
2. Chay tren staging truoc.
3. Kiem tra trigger va luong tao don.
4. Dat lich change window moi chay production.

## 6) Cach rollback

Neu can rollback Phase 2:

1. Chay file supabase/migrations/rollback_multi_branch_phase_2_default_q6.sql
2. Rollback se:
   - drop trigger trg_orders_default_branch (neu public.orders ton tai)
   - drop function public.avnt_set_default_order_branch()
   - xoa marker Phase 2 (neu bang marker ton tai)
3. Rollback KHONG:
   - drop public.orders.branch_id
   - drop public.branches
   - dong vao du lieu orders
   - rollback Phase 1

## 7) SQL kiem tra sau migration (khong chay trong phien nay)

### A. Kiem tra trigger ton tai

```sql
select
  t.tgname as trigger_name,
  c.relname as table_name,
  n.nspname as schema_name,
  p.proname as function_name
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
join pg_proc p on p.oid = t.tgfoid
where n.nspname = 'public'
  and c.relname = 'orders'
  and t.tgname = 'trg_orders_default_branch'
  and not t.tgisinternal;
```

### B. Insert test trong transaction roi rollback

Khong the viet cau INSERT test an toan trong report nay ma khong doan cot bat buoc, vi schema create table public.orders khong co trong repo migration hien tai.

De xac minh sau migration, de xuat cach an toan:
1. Dat 1 don that qua website (khong gui branch_id).
2. Chay truy van kiem tra don moi nhat co branch_id da duoc gan:

```sql
select o.id, o.order_code, o.branch_id, b.code as branch_code
from public.orders o
left join public.branches b on b.id = o.branch_id
order by o.created_at desc
limit 5;
```

Ky vong:
- Don moi tu luong cu co branch_code = 'q6'.
- Neu runtime chu dong gui branch_id khac null, trigger khong ghi de.

## 8) Test matrix de xac nhan

- Case 1: Insert order voi branch_id = null
  - Ky vong: branch_id tu dong = id cua q6.

- Case 2: Insert order voi branch_id = id hop le (vd q1)
  - Ky vong: giu nguyen gia tri branch_id da gui.

- Case 3: Tam thoi xoa/doi code q6 (chi tren moi truong test)
  - Ky vong: INSERT branch_id null bi fail voi exception ro rang.

- Case 4: Regression luong dat mon website hien tai
  - Ky vong: tao don thanh cong, khong thay doi ux/runtime.

## 9) Phan chua trien khai

- Chua backfill don cu.
- Chua set NOT NULL hoac foreign key cho orders.branch_id.
- Chua cho phep khach chon chi nhanh.
- Chua doi maps/menu/phi ship/FCM/merchant theo branch.
- Chua bo sung branch filter cho admin runtime.
