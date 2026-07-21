# MULTI BRANCH PHASE 3.2 REPORT

Ngay thuc hien: 2026-07-21
Pham vi: Nang cap API maps de tinh khoang cach den cac chi nhanh active o che do preview, khong doi chi nhanh phuc vu production.

## 1) File da sua

- app/api/maps/route.ts
- docs/MULTI_BRANCH_PHASE_3_2_REPORT.md

## 2) Muc tieu da dat

- Bo sung doc public.branches bang service role tren server.
- Chi lay branch dang active (is_active=true).
- Tinh khoang cach va thoi gian du kien cho tung branch co toa do hop le.
- Tim branch gan nhat va tra them truong nearest_branch_preview.
- Tra them branch_selection_mode="preview_only" de xac nhan chua bat tu chon chi nhanh.

## 3) Cam ket giu nguyen hanh vi production

Cac field cu tiep tuc tinh bang Q6 hardcode (SHOP_LOCATION) nhu truoc:
- shop
- distance_meters
- distance_km
- distance_text
- duration_text
- shipping_fee
- is_supported_area
- message

Bang gia shipping giu nguyen:
- <=0.5km = 0
- <=2km = 18000
- <=3km = 22000
- <=4km = 26000
- <=5km = 30000
- <=6km = 34000
- <=7km = 38000
- <=8km = 42000
- <=9km = 46000
- <=10km = 50000
- >10km = null

Cong thuc khoang cach giu nguyen:
- Duong chim bay x 1.25

## 4) Truong moi trong response

- nearest_branch_preview
  - id
  - code
  - short_name
  - address
  - distance_km
  - distance_text
  - duration_text
  - shipping_fee
  - is_supported_area
- branch_selection_mode: "preview_only"

## 5) Co che fallback an toan

- Neu loi doc branches hoac thieu env service role: nearest_branch_preview = null.
- Neu khong co branch active nao co toa do hop le: nearest_branch_preview = null.
- Du lieu phi ship production van duoc tinh tu SHOP_LOCATION Q6 hardcode, API khong bi loi dat mon vi logic preview.

## 6) Kiem thu local de xac nhan

1. Chay build:

```bash
npm run build
```

2. Goi API maps:

```bash
curl -X POST "http://localhost:3000/api/maps" \
  -H "Content-Type: application/json" \
  -d "{\"lat\":10.75,\"lng\":106.65}"
```

Ky vong:
- Cac field cu van tinh theo Q6 hardcode.
- Co them branch_selection_mode="preview_only".
- nearest_branch_preview co gia tri neu co branch active co toa do hop le; neu khong co thi null.

## 7) Ngoai pham vi Phase 3.2

- Chua doi branch phuc vu thuc te.
- Chua branch-aware menu, merchant, FCM, admin, frontend dat mon.
- Chua thay doi schema/database hoac chay SQL.
