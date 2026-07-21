# MULTI BRANCH PHASE 3.1 REPORT

Ngay thuc hien: 2026-07-21
Pham vi: Tao API server-side doc danh sach chi nhanh, khong doi hanh vi website.

## 1) File da tao/sua

- app/api/branches/route.ts
- types/branch.ts
- docs/MULTI_BRANCH_PHASE_3_1_REPORT.md

## 2) API contract

Endpoint:
- GET /api/branches

Hanh vi:
- Chi tra chi nhanh is_active = true
- Sap xep theo sort_order tang dan

Response thanh cong:

```json
{
  "ok": true,
  "branches": [
    {
      "id": "...",
      "code": "q6",
      "name": "...",
      "short_name": "...",
      "address": "...",
      "phone": null,
      "latitude": 10.7456603,
      "longitude": 106.6345814,
      "is_active": true,
      "is_open": true,
      "preparation_minutes": 15,
      "delivery_radius_km": 10,
      "sort_order": 0
    }
  ]
}
```

Response loi:

```json
{
  "ok": false,
  "message": "Không tải được danh sách chi nhánh."
}
```

Ghi chu bao mat:
- API doc bang branches bang service role o server.
- Khong expose service role key, SQL error nhay cam, hoac env cho client.

## 3) Cach test local

1. Chay app local (dev hoac production build/start).
2. Goi API:

```bash
curl "http://localhost:3000/api/branches"
```

Ky vong:
- ok=true
- branches chi gom chi nhanh dang is_active=true
- hien tai thuong la q6

3. Neu khong co chi nhanh active:
- API van tra ok=true
- branches=[]

## 4) Vi sao khong anh huong website hien tai

- Chi them API doc du lieu, khong doi runtime dat mon.
- Khong sua app/dat-mon-nhanh/page.tsx.
- Khong sua maps/menu/phi ship/FCM/merchant/admin.
- Khong ghi branch_id tu frontend.
- Khong sua DB schema/RLS/policy trong Phase 3.1.

## 5) Phan chua trien khai

- Chua tu dong chon chi nhanh.
- Chua cho phep khach doi chi nhanh.
- Chua branch-aware maps/ship/menu.
- Chua branch-aware notify-new-order va merchant routing.
- Chua branch filter cho admin.

## 6) Buoc tiep theo (Phase 3.2)

- Tich hop API /api/branches vao luong server-side lay branch context (chua doi UI khach).
- Dinh nghia quy tac fallback an toan Q6 khi branch context khong hop le.
- Chuan bi branch context de su dung cho cac phase tiep theo (maps/menu/ship), van duy tri backward compatibility.
