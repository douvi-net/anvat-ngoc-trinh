# AVNT Website Maintenance Mode

## Chức năng

- Popup bảo trì toàn website, khách có thể đóng.
- Sau khi đóng, trong cùng phiên trình duyệt popup không tự bật lại.
- Thanh cảnh báo nhỏ vẫn còn và có thể mở popup lại.
- Zalo Quận 1: 0392.968.034
- Zalo Quận 6: 0392.496.220
- Admin bật/tắt tại `/admin/maintenance`.
- Tùy chọn khóa checkout trong lúc bảo trì.
- Khi checkout bị khóa, khách bấm xác nhận đơn sẽ mở lại popup Zalo và không insert order.

## An toàn

- `/admin/maintenance` và `/api/admin/maintenance` tự được middleware hiện tại bảo vệ vì đều bắt đầu bằng `/admin` và `/api/admin`.
- API công khai `/api/maintenance` chỉ trả cấu hình thông báo, không trả secret.
- Database migration mặc định maintenance_enabled=false nên deploy code/migration không tự khóa website.

## Cài đặt

### 1. Copy các file mới vào project
- components/MaintenanceNotice.tsx
- app/api/maintenance/route.ts
- app/api/admin/maintenance/route.ts
- app/admin/maintenance/page.tsx
- APPLY_MAINTENANCE.cjs

### 2. Chạy script tại root project
node APPLY_MAINTENANCE.cjs

Script chỉ chèn 3 thay đổi nhỏ:
- app/layout.tsx
- components/AdminLayout.tsx
- app/dat-mon-nhanh/page.tsx

### 3. Chạy SQL
Supabase SQL Editor:
supabase/migrations/20260819_website_maintenance_mode.sql

### 4. Kiểm tra TypeScript
npx tsc --noEmit

### 5. Chạy local
npm run dev

Mở:
- http://localhost:3000/admin/maintenance
- http://localhost:3000/

Bật `Chế độ bảo trì`.
Nếu đang sửa hệ thống đặt món, bật thêm `Tạm khóa đặt món trên website`.

### 6. Git
Không dùng git add . nếu thư mục web của bạn vẫn còn file Android untracked.

Dùng:
git add app/layout.tsx
git add components/AdminLayout.tsx
git add app/dat-mon-nhanh/page.tsx
git add components/MaintenanceNotice.tsx
git add app/api/maintenance/route.ts
git add app/api/admin/maintenance/route.ts
git add app/admin/maintenance/page.tsx
git add supabase/migrations/20260819_website_maintenance_mode.sql
git commit -m "feat: add website maintenance mode"
git push origin main

## Tắt bảo trì

Không cần deploy lại.
Vào `/admin/maintenance` → bỏ chọn `Chế độ bảo trì` → `Lưu chế độ bảo trì`.
