# AVNT Web Cleanup — 2026-08-20

Bản này đã được dọn từ ZIP làm việc hiện tại.

## Đã tích hợp
- Branch Payment QR theo `branch_id` cho `/dat-mon-nhanh`.
- Branch Payment QR theo `orders.branch_id` cho `/tra-cuu-don`.
- Menu Admin `Thanh toán chi nhánh`.
- Maintenance Notice toàn website.
- Menu Admin `Bảo trì website`.
- Checkout guard khi bật khóa đặt món bảo trì.

## Đã dọn
- Android project bị copy nhầm: `app/src`, Gradle wrapper, Android `build.gradle.kts`, `google-services.json`, v.v.
- `public/nfcdouvi.apk` không thuộc website AVNT.
- `node_modules`, `.next`, cache TypeScript.
- `.env.local` khỏi ZIP để tránh chia sẻ secret.
- Báo cáo Phase của AVNT Merchant Android khỏi root website.
- Script patch một lần sau khi đã áp dụng thành công.

## Lưu ý khi dùng ZIP sạch
- Giữ file `.env.local` hiện tại trên máy của bạn; ZIP sạch cố ý không chứa file secret này.
- Sau khi giải nén project trên máy mới, chạy `npm install` trước khi `npm run dev`.
- Không copy project Android AVNTMerchant vào thư mục website này.
