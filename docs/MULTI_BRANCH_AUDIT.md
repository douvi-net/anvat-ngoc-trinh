# MULTI BRANCH AUDIT - AN VAT NGOC TRINH

Ngay audit: 2026-07-21
Pham vi: chi audit va lap ke hoach, KHONG sua code, KHONG chay SQL, KHONG deploy, KHONG commit/push.

## 1) Tom tat hien trang (co dan chung)

He thong hien tai dang van hanh theo mo hinh 1 chi nhanh (Q6) voi nhieu diem hardcode/gia dinh global:

- Vi tri cua quan de tinh khoang cach va ship dang hardcode Q6 trong API map.
  - app/api/maps/route.ts:3 (const SHOP_LOCATION)
  - app/api/maps/route.ts:90-91 (dung SHOP_LOCATION.lat/lng de tinh distance)
- Goi y dia chi Places bias ve tam Q6 (ban kinh 12km).
  - app/api/places/route.ts:33-40 (locationBias center = 10.7456603, 106.6345814)
- Frontend dat mon doc du lieu global, khong co branch context:
  - app/dat-mon-nhanh/page.tsx:297 (from products)
  - app/dat-mon-nhanh/page.tsx:305 (from toppings)
  - app/dat-mon-nhanh/page.tsx:311 (from shipping_zones)
  - app/dat-mon-nhanh/page.tsx:316 (shop_settings limit(1).maybeSingle)
  - app/dat-mon-nhanh/page.tsx:333 (from shipping_promotions)
- Tao don khong gan branch_id.
  - app/dat-mon-nhanh/page.tsx:1436 (insert orders)
- FCM merchant lay token theo shop_id co dinh "avnt", chua tach theo chi nhanh.
  - app/api/notify-new-order/route.ts:60 (from merchant_devices)
  - app/api/notify-new-order/route.ts:62 (eq("shop_id", "avnt"))
- Frontend goi API thong bao don moi khong truyen branch.
  - app/dat-mon-nhanh/page.tsx:1599 (fetch /api/notify-new-order)

Ket luan hien trang: Chua co tham chieu branch_id trong codebase.
- Ket qua tim kiem: KHONG co match "branch_id" trong repo (grep toan bo file ts/tsx/sql/md/json).

## 2) Danh sach tham chieu theo keyword (toan repo)

### products
- app/dat-mon-nhanh/page.tsx:297
- app/admin/products/page.tsx:87, 322, 342, 364, 382, 406
- app/admin/coupons/page.tsx:77
- app/admin/page.tsx:93
- app/admin/tools/image-optimize/page.tsx:123
- app/api/admin/seo-ai/generate/route.ts:34
- app/page.tsx:4 (du lieu static data/products.ts)
- data/products.ts:1 (du lieu static cho homepage)

### orders
- app/dat-mon-nhanh/page.tsx:1436
- app/admin/orders/page.tsx:194, 237, 536, 588, 689
- app/admin/finance/orders/page.tsx:138, 165, 192
- app/admin/customers/page.tsx:120
- app/admin/page.tsx:84
- app/tra-cuu-don/page.tsx:154, 371
- components/AdminFinanceSummary.tsx:61

### merchant_devices
- app/api/notify-new-order/route.ts:60-62

### shop_settings
- app/dat-mon-nhanh/page.tsx:316
- app/admin/settings/page.tsx:94, 120, 135

### shipping_zones
- app/dat-mon-nhanh/page.tsx:311
- app/admin/settings/page.tsx:97, 196, 206, 225, 245

### shipping_promotions
- app/dat-mon-nhanh/page.tsx:333
- app/admin/settings/page.tsx:102, 292, 302, 321, 341

### SHOP_LOCATION
- app/api/maps/route.ts:3, 90, 91, 103

### notify-new-order
- app/dat-mon-nhanh/page.tsx:1599
- app/api/notify-new-order/route.ts:125 (log message)

### branch_id
- Khong tim thay tham chieu nao trong codebase.

## 3) Danh sach file can sua de dat muc tieu da chi nhanh

Luu y: Danh sach duoi day la danh sach can sua de dat 10 muc tieu ban de ra va van tuong thich nguoc.

### Nhom dat mon + van hanh don
- app/dat-mon-nhanh/page.tsx
- app/api/maps/route.ts
- app/api/places/route.ts
- app/api/notify-new-order/route.ts
- app/admin/orders/page.tsx
- app/api/push/order-status/route.ts (neu can gui thong bao khach theo branch context)

### Nhom admin cau hinh branch/menu/ship
- app/admin/settings/page.tsx
- app/admin/products/page.tsx
- app/admin/toppings/page.tsx
- app/admin/coupons/page.tsx
- app/admin/page.tsx

### Nhom finance + bao cao + customer tracking
- app/admin/finance/page.tsx
- app/admin/finance/orders/page.tsx
- components/AdminFinanceSummary.tsx
- app/admin/customers/page.tsx
- app/tra-cuu-don/page.tsx (hien thi branch/chi nhanh don neu can)

### Nhom lib/helper + typing
- lib/supabase.ts (chi khi bo sung wrapper/helper branch context)
- Cac type tai cac file tren can bo sung branch_id, branch metadata.

### Nhom co lien quan du lieu menu
- app/api/admin/seo-ai/generate/route.ts (neu can context menu theo branch khi dung AI content)

## 4) Diem rui ro cao (mat don, sai ship, FCM nham, mat menu)

### A. Rui ro gui FCM nham chi nhanh
- Bang chung:
  - app/api/notify-new-order/route.ts:60-62 dang lay merchant_devices theo shop_id = "avnt" va is_active = true.
  - Khong co branch filter, khong co branch_id trong payload.
- Hau qua:
  - Merchant app cua chi nhanh A/B co the nhan thong bao don khong thuoc chi nhanh minh.
  - Vi pham muc tieu "moi app Merchant chi nhan dung chi nhanh".

### B. Rui ro sai phi ship khi mo da chi nhanh
- Bang chung:
  - app/api/maps/route.ts:3 hardcode SHOP_LOCATION Q6.
  - app/api/maps/route.ts:90-91 luon tinh tu SHOP_LOCATION do.
  - app/dat-mon-nhanh/page.tsx:1249 ham calculateRouteByLatLng goi /api/maps khong truyen branch.
  - app/dat-mon-nhanh/page.tsx:759-767 chon selectedShippingZone tu shipping_zones global.
  - app/dat-mon-nhanh/page.tsx:1496-1499 luu delivery_area dua tren selectedShippingZone global.
- Hau qua:
  - Khach o gan chi nhanh khac van bi tinh phi theo Q6.
  - Co the sai gia ship, sai tuyen giao.

### C. Rui ro mat menu hoac menu sai chi nhanh
- Bang chung:
  - app/dat-mon-nhanh/page.tsx:297 load products global (is_active), khong phan nhanh.
  - app/dat-mon-nhanh/page.tsx:305 load toppings global.
  - app/admin/products/page.tsx va app/admin/toppings/page.tsx dang quan ly global.
- Hau qua:
  - Khong dap ung "moi chi nhanh co danh sach mon khac nhau".
  - Neu sua truc tiep products de phuc vu 1 chi nhanh se anh huong chi nhanh khac.

### D. Rui ro sai trang thai mo cua theo chi nhanh
- Bang chung:
  - app/dat-mon-nhanh/page.tsx:316 lay shop_settings limit(1).maybeSingle().
  - app/admin/settings/page.tsx:94, 135 thao tac ban ghi id=1.
- Hau qua:
  - Tat ca chi nhanh dung chung 1 trang thai order_status/is_open.
  - Khong dap ung gio mo cua/trang thai rieng tung chi nhanh.

### E. Rui ro admin/finance nhin du lieu gom tat ca, khong loc branch
- Bang chung:
  - app/admin/orders/page.tsx:237 select orders toan bo.
  - app/admin/orders/page.tsx:184-223 realtime channel lang nghe orders/order_items global.
  - app/admin/finance/orders/page.tsx:138 select orders completed/cancelled khong branch filter.
  - components/AdminFinanceSummary.tsx:61 select orders completed khong branch filter.
- Hau qua:
  - Bao cao nham branch, van hanh nham branch.

### F. Rui ro rollback/transition gay mat don neu ep branch_id qua som
- Bang chung:
  - Hien tai insert orders khong co branch_id: app/dat-mon-nhanh/page.tsx:1436.
  - Khong co bat ky tham chieu branch_id trong code.
- Hau qua:
  - Neu DB migration dat NOT NULL branch_id ngay lap tuc, don moi se fail insert.

## 5) Ke hoach migration theo giai doan (tuong thich nguoc)

## Giai doan 0 - Chuan bi schema, KHONG doi hanh vi cu
Muc tieu: bo sung cau truc de dual-run, khong anh huong website dang ban.

- Them bang branches (co ban ghi Q6 la default).
- Them bang branch_product_settings (branch_id, product_id, is_available, gia_override neu can, sort_order, prep_minutes_override neu can).
- Them cot nullable branch_id vao orders.
- Them cot nullable branch_id vao merchant_devices.
- Tach shop_settings theo branch_id (co the them cot branch_id nullable + unique theo branch, hoac tao bang moi branch_shop_settings). Giai doan dau van giu du lieu cu id=1.
- Khong dat NOT NULL/foreign key bat buoc ngay.
- Backfill du lieu cu -> branch mac dinh Q6 (co script idempotent).

Rollback G0:
- Drop cac doi tuong moi (neu can) hoac de nguyen (khong duoc code su dung nen khong anh huong runtime).

## Giai doan 1 - Dual write an toan cho don va device
Muc tieu: du lieu moi co branch_id, du lieu cu van doc duoc.

- Xac dinh branch tai diem dat hang (heuristic nearest + open + support area).
- Khi insert orders: ghi them branch_id, nhung van cho nullable de fallback.
- Khi dang ky/quan ly merchant_devices: ghi them branch_id.
- API notify-new-order doc theo branch_id uu tien, fallback logic cu khi branch_id null.

Rollback G1:
- Tat feature flag branch assignment, quay ve behavior cu.
- branch_id da ghi se bi bo qua (vi code fallback global).

## Giai doan 2 - Dual read cho menu/settings/ship
Muc tieu: branch-aware read, fallback ve cau hinh cu.

- Dat mon doc:
  - products qua branch_product_settings (neu co), fallback products global.
  - shop_settings theo branch, fallback ban ghi cu id=1.
  - shipping_zones/shipping_promotions theo branch (neu tach branch), fallback global.
  - maps/places tinh theo toa do branch dang chon/tu dong chon.
- UI cho phep khach doi chi nhanh thu cong.

Rollback G2:
- Tat branch-aware read qua feature flag, quay ve read global.

## Giai doan 3 - Admin branch filter + toan he thong
Muc tieu: admin co 2 mode: Toan he thong / Theo chi nhanh.

- admin/orders, admin/dashboard, finance, customers them bo loc branch.
- admin/settings quan ly theo branch.
- admin/products quan ly menu goc + branch_product_settings.

Rollback G3:
- Tat branch filter UI; quay ve toan he thong nhu cu.

## Giai doan 4 - Hardening
Muc tieu: khoa chat du lieu sau khi da on dinh.

- Sau khi da backfill + code on dinh:
  - Can nhac set default branch_id = Q6 cho inserts.
  - Them rang buoc/chi muc branch_id phu hop.
  - Chi khi chac chan moi luong da ghi branch_id thi moi can nhac NOT NULL.

Rollback G4:
- Bo constraint moi (neu co su co), giu nullable/fallback.

## 6) Thu tu trien khai an toan (de nghi)

1. Schema additive (khong pha vo) + backfill Q6.
2. Notify/device branch-aware truoc (tranh gui nham FCM).
3. Dat mon branch selection + order branch_id dual-write.
4. Menu/ship/settings dual-read branch-aware + fallback.
5. Admin filter branch va quan tri branch_product_settings.
6. Finance va dashboard branch mode.
7. Hardening constraints sau khi monitor on dinh.

## 7) Rollback theo tung giai doan

- G0: bo qua schema moi, runtime khong doi.
- G1: tat ghi branch_id va notify branch filter (feature flag), quay ve shop_id=avnt path cu.
- G2: tat branch-aware read, quay ve products/shop_settings/shipping_* global.
- G3: tat UI filter branch admin, quay ve tong hop.
- G4: go constraint moi va tiep tuc nullable/fallback.

## 8) Test bat buoc truoc merge

### Smoke + regression core
- Dat don COD va momo tu frontend thanh cong (khong branch, fallback branch mac dinh).
- Don tao thanh cong khi branch_id null (tuong thich nguoc).
- Don tao thanh cong khi branch_id duoc gan.

### Shipping
- Cung 1 dia chi, branch A/B cho ket qua distance/fee khac nhau dung ky vong.
- Fallback shipping khi branch config thieu van hoat dong (khong crash).

### Menu
- Branch A an mon X, Branch B hien mon X (khac nhau) theo branch_product_settings.
- Neu branch_product_settings chua co, menu fallback products global.

### FCM merchant
- Device branch A chi nhan don branch A.
- Device branch B khong nhan don branch A.
- Truong hop branch_id null van fallback theo Q6 theo dung chinh sach migration.

### Admin/Finance
- Mode Toan he thong va Theo chi nhanh cho so lieu dung tong/loc.
- Realtime orders khong do sai branch khi dang o mode loc branch.

### Data migration/backfill
- Don cu duoc gan branch Q6 dung 100%.
- Khong co don moi bi fail insert do constraint branch.

## 9) File da doc va chua tim thay

### Da doc (bat buoc + lien quan)
- app/dat-mon-nhanh/page.tsx
- app/api/maps/route.ts
- app/api/notify-new-order/route.ts
- app/admin/products/page.tsx
- app/admin/orders/page.tsx
- app/admin/settings/page.tsx
- app/admin/finance/page.tsx
- app/admin/finance/orders/page.tsx
- app/admin/finance/income/page.tsx
- app/admin/finance/expenses/page.tsx
- lib/supabase.ts
- app/admin/toppings/page.tsx
- app/admin/coupons/page.tsx
- app/admin/page.tsx
- app/admin/customers/page.tsx
- app/tra-cuu-don/page.tsx
- app/api/places/route.ts
- app/api/push/order-status/route.ts
- app/api/push/subscribe/route.ts
- components/PushNotificationSetup.tsx
- components/AdminFinanceSummary.tsx
- app/api/admin/seo-ai/generate/route.ts
- app/api/admin/seo-ai/generate-image/route.ts
- app/admin/login/page.tsx
- app/api/admin/login/route.ts

### Chua tim thay / khong ton tai trong repo
- Khong co file nao ten rieng de quan ly merchant_devices ngoai app/api/notify-new-order/route.ts.
- Khong co tham chieu branch_id trong codebase.

## 10) De xuat nguyen tac ky thuat de tranh gian doan ban hang

- Dung feature flag cho tung nhom: branch routing, branch menu, branch notify, branch admin filter.
- Mo hinh fallback ro rang: neu khong co branch config thi dung Q6/default.
- Tuyet doi tranh doi schema theo huong breaking (NOT NULL branch_id) truoc khi dual-write on dinh.
- Giu nguyen bang products lam danh muc goc, khong tao products_q6/products_q1 (dung branch_product_settings).

## 11) Ghi chu pham vi audit

- Audit nay dua tren source code hien tai va tham chieu tim thay trong repo.
- Chua thuc thi SQL migration trong phien nay theo yeu cau.
- Chua deploy/commit/push theo yeu cau.

## 12) Checklist implementation de chuan bi sprint tiep theo

- Xac dinh mo hinh branch chinh thuc (id, ma branch, toa do, gio mo cua, prep time).
- Chot quy tac auto-chon branch (gan nhat + dang mo + co menu + trong pham vi giao).
- Chot quy tac cho phep khach doi branch va anh huong den gio/phi/menu.
- Chot strategy fallback Q6 cho du lieu cu va luong cu.
- Chot test matrix UAT theo cac luong tren.
