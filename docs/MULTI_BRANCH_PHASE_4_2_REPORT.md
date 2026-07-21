# MULTI BRANCH PHASE 4.2 REPORT

Ngay thuc hien: 2026-07-21
Pham vi: Tao API server-side preview menu theo chi nhanh, chua noi vao frontend.

## 1) File da tao/sua

- app/api/branch-menu/route.ts
- docs/MULTI_BRANCH_PHASE_4_2_REPORT.md

Khong sua runtime frontend dat mon hoac cac file UI khac.

## 2) Product fields thuc te da doc tu app/dat-mon-nhanh/page.tsx

Trang dat mon dang doc products voi cac field:
- id
- name
- slug
- price
- badge
- image_url
- description
- is_sold_out
- category
- topping_category

Ngoai ra trang dat mon dang filter/order bang:
- is_active
- sort_order

Phase 4.2 API select dung cac field tren, khong dung select("*").

## 3) API contract

Endpoint:
- GET /api/branch-menu?branchCode=q6
- GET /api/branch-menu?branchId=<uuid>

Rule param:
- Bat buoc co `branchCode` hoac `branchId`.
- Neu ca 2 cung co: uu tien `branchId`.
- Neu thieu ca 2: 400.

Response loi:
- 400: `{ ok:false, message:"Thiếu chi nhánh." }`
- 404: `{ ok:false, message:"Không tìm thấy chi nhánh." }`
- 500: `{ ok:false, message:"Không tải được menu chi nhánh." }`

Response thanh cong:
- Tra `branch` (id/code/name/short_name/is_active/is_open)
- Tra `items` menu da resolve theo branch
- Tra `meta.mode = "preview_only"`

## 4) Resolve gia, sold-out, availability

Voi moi product:
- `base_price = products.price`
- `effective_price = bps.price_override` neu khac null, nguoc lai `products.price`
- `is_available_for_branch = bps.is_available`
- `is_sold_out_for_branch = bps.is_sold_out`
- `price_overridden = (bps.price_override != null)`
- `sort_order = bps.sort_order` neu co, nguoc lai `products.sort_order`, neu tiep tuc null thi `0`

Sap xep:
- sort_order tang dan
- sau do name tang dan

## 5) Xu ly product thieu branch setting

Khong fallback menu sang products thuan.

Mac dinh (`includeUnavailable` khong co):
- Chi tra items co setting va `bps.is_available = true`.

Neu `includeUnavailable=true` (preview noi bo):
- Co tra ca item thieu setting voi:
  - `is_available_for_branch = false`
  - `missing_branch_setting = true`

Ly do:
- Hieu ro mon nao chua duoc cau hinh theo branch.
- Khong am tham cho ban mon thieu setting.

## 6) Bao mat

- API dung Supabase service-role o server side.
- Khong expose service key/env cho client.
- Khong tra `error.message`, SQL error, stack trace cho client.
- Khong dung `select("*")`.
- Co `export const dynamic = "force-dynamic"`.
- Co `Cache-Control: no-store`.
- Khong tao RLS policy moi trong Phase 4.2.

## 7) Cach test local

1. Preview menu branch q6:

```bash
curl "http://localhost:3000/api/branch-menu?branchCode=q6"
```

Kiem tra:
- `ok=true`
- `branch.code=q6`
- `items` co du lieu
- `meta.mode=preview_only`
- `effective_price` dung quy tac override
- Mon unavailable khong xuat hien o mode mac dinh

2. Preview theo branchId:

```bash
curl "http://localhost:3000/api/branch-menu?branchId=<uuid>"
```

3. Preview noi bo gom unavailable/missing setting:

```bash
curl "http://localhost:3000/api/branch-menu?branchCode=q6&includeUnavailable=true"
```

Kiem tra:
- Item thieu setting co `missing_branch_setting=true`
- Khong co du lieu nhay cam noi bo

4. Error cases:

```bash
curl "http://localhost:3000/api/branch-menu"
curl "http://localhost:3000/api/branch-menu?branchCode=not-exist"
```

Ky vong lan luot 400 va 404.

## 8) Vi sao chua anh huong website production

- API moi chua duoc import vao app/dat-mon-nhanh/page.tsx.
- Frontend hien tai van doc menu tu public.products nhu cu.
- Khong doi giỏ hàng, gia hien thi, payment, shipping, order insert.

## 9) Gioi han hien tai

- Chua co auth admin rieng cho includeUnavailable.
- Chua cho phep quan ly branch menu tren admin.
- Chua branch-aware menu render o frontend.

## 10) Ke hoach Phase 4.3

- Noi API branch-menu vao luong load menu o frontend theo selectedBranch.
- Xu ly UI canh bao mon unavailable khi doi branch.
- Giu fallback an toan khi branch setting thieu, tranh ban sai mon.
- Chuan bi admin flow quan ly is_available/is_sold_out/price_override theo branch.
