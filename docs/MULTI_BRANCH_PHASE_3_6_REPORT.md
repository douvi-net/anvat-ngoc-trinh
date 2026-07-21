# MULTI BRANCH PHASE 3.6 REPORT

Ngay thuc hien: 2026-07-21
Pham vi: Hien thi the chi nhanh phuc vu tren frontend, khong cho doi chi nhanh.

## 1) File da sua

- app/dat-mon-nhanh/page.tsx
- docs/MULTI_BRANCH_PHASE_3_6_REPORT.md

## 2) Muc tieu da dat

- Sau khi co ket qua dia chi Google Maps va da xac dinh `selectedBranch`, hien thi the thong tin chi nhanh phuc vu.
- Noi dung the:
  - 📍 Chi nhánh phục vụ
  - Ăn Vặt Ngọc Trinh - {selectedBranch.short_name}
  - Đã tự chọn chi nhánh gần bạn nhất
- The khong co thao tac doi chi nhanh (chi hien thi thong tin).

## 3) Quy tac hien thi

- Chi hien thi khi:
  - `fulfillmentType === "delivery"`
  - `selectedBranch` khac null
- Khong hien thi trong pickup mode.
- Neu `selectedBranch` null thi khong hien.

## 4) Rang buoc khong thay doi

- Khong doi logic dat don.
- Khong doi logic phi ship.
- Khong doi menu.
- Khong doi giao dien luong khac (khong modal, khong menu moi).
- Khong thay doi FCM, Merchant, coupon, points, tong tien, payment flow.

## 5) UI va responsive

- Su dung bo mau hien co:
  - Navy: `#06113C`
  - Green: `#00B14F`
  - Nen xanh nhat: `#E8FFF1`
- Bo goc va typography theo pattern san co (`rounded-2xl`, `font-black`, `font-bold`).
- Render dang block don gian trong luoi hien tai, khong phat sinh layout shift lon tren mobile.

## 6) Kiem thu local

1. Chon giao hang va chon dia chi tu goi y Google.
2. Sau khi tinh route xong va co `selectedBranch`, the chi nhanh hien thi.
3. Chuyen sang pickup, the bien mat.
4. Dam bao dat don van hoat dong nhu cu.

## 7) Ngoai pham vi Phase 3.6

- Chua cho khach tu doi chi nhanh.
- Chua branch-aware menu/filter.
- Chua thay doi DB schema/policy.
- Khong deploy, khong commit, khong push.
