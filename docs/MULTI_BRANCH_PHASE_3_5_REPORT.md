# MULTI BRANCH PHASE 3.5 REPORT

Ngay thuc hien: 2026-07-21
Pham vi: Website gui branch_id vao payload tao don khi selectedBranch hop le, trigger DB van la fallback.

## 1) File da sua

- app/dat-mon-nhanh/page.tsx
- docs/MULTI_BRANCH_PHASE_3_5_REPORT.md

## 2) Thay doi chinh

- Bo sung import module preview branch:
  - `fetchMapsPreviewNearestBranch`
  - `PreviewSelectedBranch`
- Bo sung React state nullable:
  - `selectedBranch: PreviewSelectedBranch | null`
- Trong `calculateRouteByLatLng(lat, lng)`:
  - Goi them preview API qua module `fetchMapsPreviewNearestBranch(lat, lng)`.
  - Neu route API loi: `selectedBranch = null`, luong cu tiep tuc nhu truoc.
  - Neu route API thanh cong: cap nhat `selectedBranch` tu ket qua preview.
- Payload insert `orders` bo sung:
  - `branch_id: fulfillmentType === "delivery" && selectedBranch?.id ? selectedBranch.id : null`
- Khong co update branch lan hai sau khi insert order.

## 3) Dam bao khong doi hanh vi hien tai

Khong thay doi:
- menu
- phi ship hien thi
- giao dien
- FCM
- Merchant
- diem
- coupon
- subtotal
- shipping discount
- total
- payment flow

Ghi chu:
- Neu `selectedBranch` null hoac khong co `id`, payload gui `branch_id = null`.
- Trigger DB se fallback gan Q6 nhu thiet ke truoc do.
- Khong chan dat don khi preview branch loi.

## 4) Test bat buoc va ket qua ky vong

1. Dia chi binh thuong, tao don thanh cong:
- Chon dia chi Google hop le, dat don.
- Ky vong: don tao thanh cong nhu cu.

2. branch_id duoc ghi:
- Truong hop `selectedBranch.id` hop le.
- Ky vong: row orders co `branch_id` = selected branch id.

3. selectedBranch null van tao don va trigger gan Q6:
- Gia lap loi preview hoac khong lay duoc selected branch.
- Ky vong: don van tao thanh cong, `branch_id` null khi insert, trigger fallback Q6.

4. COD va chuyen khoan deu hoat dong:
- Dat don voi `payment_method=cod` va `payment_method=momo`.
- Ky vong: ca hai flow tao don binh thuong, khong phat sinh buoc branch update lan hai.

## 5) Ngoai pham vi Phase 3.5

- Chua thay doi UI hien thi chi nhanh cho khach.
- Chua branch-aware menu/filter san pham.
- Chua thay doi DB schema/policy.
- Khong deploy, khong commit, khong push.
