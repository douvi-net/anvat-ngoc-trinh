# AVNT PHASE 5.1 — Branch Payment Settings

## Chức năng

- `/dat-mon-nhanh`: QR lấy theo `selectedBranch.id`.
- `/tra-cuu-don`: QR lấy theo `orders.branch_id` của chính đơn hàng.
- Không fallback QR Q6 sang Q1.
- Nếu branch chưa cấu hình QR: cảnh báo và không hiện QR sai.
- Admin mới: `/admin/branch-payments`.
- Upload QR vào Supabase Storage bucket `branch-payment-qr`.
- Thêm chi nhánh mới: tự xuất hiện trong dropdown Admin, không cần sửa code.

## Cài đặt

1. Copy toàn bộ nội dung ZIP vào root project web.
2. Chạy:
   `node APPLY_BRANCH_PAYMENT.cjs`
3. Supabase SQL Editor chạy:
   `supabase/migrations/20260820_branch_payment_settings.sql`
4. Chạy:
   `npx tsc --noEmit`
5. Chạy:
   `npm run dev`
6. Mở:
   `http://localhost:3000/admin/branch-payments`
7. Chọn Q1 → upload QR Q1 → nhập ngân hàng/STK/tên tài khoản → Lưu.
8. Chọn Q6 → kiểm tra QR cũ hoặc upload QR Q6 mới → Lưu.

## Test bắt buộc

### Q1
- Chọn địa chỉ Q1.
- Checkout chuyển khoản phải hiện QR Q1.
- Tạo đơn Q1.
- Tra cứu đơn đó vẫn phải hiện QR Q1.

### Q6
- Tương tự, QR phải là Q6.

### An toàn
Nếu Q1 chưa có QR:
- không được hiển thị QR Q6;
- phải hiện thông báo chưa cấu hình thanh toán.

## Git

Repo web của bạn có file Android untracked nên KHÔNG dùng `git add .`.

Chạy:

```bash
git add app/dat-mon-nhanh/page.tsx
git add app/tra-cuu-don/page.tsx
git add components/AdminLayout.tsx
git add components/payment/BranchPaymentQr.tsx
git add app/api/branch-payment/route.ts
git add app/api/admin/branch-payments/route.ts
git add app/admin/branch-payments/page.tsx
git add supabase/migrations/20260820_branch_payment_settings.sql
git commit -m "feat: add branch-specific payment QR settings"
git push origin main
```
