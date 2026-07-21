# MULTI BRANCH PHASE 3.4 REPORT

Ngay thuc hien: 2026-07-21
Pham vi: Chi tao module goi API maps preview nearest branch va parse response, chua tich hop vao frontend.

## 1) File da sua

- lib/mapsPreviewNearestBranch.ts
- docs/MULTI_BRANCH_PHASE_3_4_REPORT.md

## 2) Muc tieu da dat

- Tao module `fetchMapsPreviewNearestBranch(lat, lng, signal?)` de goi:
  - POST /api/maps?previewNearestBranch=true
- Parse response an toan va tra ve object typed:
  - ok
  - message
  - selectedBranch (nullable)

## 3) Cam ket khong doi hanh vi website

- Khong import module vao frontend.
- Khong sua app/dat-mon-nhanh/page.tsx.
- Khong sua UI.
- Khong sua payload insert orders.
- Khong gui branch_id.
- Khong doi phi ship, subtotal, promotion, shipping discount, total.

## 4) Contract module moi

- File: lib/mapsPreviewNearestBranch.ts
- Export types:
  - PreviewSelectedBranch
  - PreviewMapsResult
- Export function:
  - fetchMapsPreviewNearestBranch(lat, lng, signal?)
- Error handling:
  - Neu API loi/network loi/response sai schema => ok=false, selectedBranch=null, message chung.

## 5) Kiem thu

1. Chay build:

```bash
npm run build
```

Ky vong:
- Build pass.
- Khong co thay doi hanh vi runtime vi module chua duoc import vao luong frontend.
