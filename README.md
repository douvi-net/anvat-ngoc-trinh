# AVNT PHASE 6.2 — Reliable Checkout & Sticky Order CTA

## Mục tiêu

Giải quyết đồng thời:

1. Khách bấm đặt nhưng tưởng chưa đặt được trên Safari/Chrome/WebView/mạng chậm.
2. Khách bấm nhiều lần liên tiếp làm phát sinh nhiều order/bill.
3. Nút đặt hàng nằm cuối modal nên khách không chắc mình đã hoàn tất chưa.

## Đã triển khai

### Chống double tap ngay lập tức

`submitLockRef` khóa đồng bộ trước `await` đầu tiên. React chưa kịp render lại thì lần tap thứ 2 cũng đã bị chặn.

### Idempotency ở database

Mỗi lần checkout có `client_request_id` duy nhất và unique index trên `orders`.

Cùng một request ID gửi 2, 5 hay 20 lần vẫn chỉ có tối đa 1 order.

### Tạo order + order_items qua server

Endpoint mới:

`POST /api/orders/create`

Browser không còn tự insert `orders` rồi `order_items` thành hai bước rời rạc.

Nếu insert item lỗi, server rollback order vừa tạo để không để lại đơn rỗng/orphan.

### Recovery khi Safari/mạng mất response

Nếu POST timeout/mất response:

`GET /api/orders/create?clientRequestId=...`

Website kiểm tra nhiều lần xem order thực tế đã được tạo chưa.

- Có order -> hiện thành công, không tạo lại.
- Không có order -> khách có thể thử lại bằng cùng request ID.

### FCM chỉ gửi khi order mới thực sự được tạo

Server gọi `/api/notify-new-order` sau khi order + items hợp lệ.

Request trùng bị idempotency chặn sẽ không sinh thêm order/bill.

### Sticky Order CTA

Trong giỏ hàng mobile, nút luôn nằm ở đáy màn hình:

- `Còn N bước để đặt` nếu thiếu dữ liệu.
- Hiển thị bước thiếu đầu tiên.
- `Đặt hàng · xxxđ` khi đủ dữ liệu.
- `Đang gửi đơn...` sau lần tap đầu.
- Có safe-area cho Safari/iPhone.

### Loading overlay

Trong lúc gửi đơn, overlay chặn thao tác khác và ghi rõ:

`Vui lòng giữ nguyên màn hình. Không cần bấm nút thêm lần nữa.`

### Browser diagnostics

`orders.checkout_user_agent` và `orders.checkout_client` được lưu để sau này tra đúng Safari/Chrome/Zalo/Facebook WebView nào gặp lỗi.

## Cài đặt

### 1. Copy ZIP vào root project web

Giữ nguyên cấu trúc thư mục.

### 2. Chạy patch page.tsx

```powershell
node APPLY_RELIABLE_CHECKOUT.cjs
```

Patch đã được test tương thích với page có Branch Toppings.

### 3. Chạy SQL TRƯỚC khi test đặt đơn

Supabase -> SQL Editor -> chạy:

`supabase/migrations/20260822_reliable_checkout.sql`

### 4. Kiểm tra TypeScript

```powershell
npx tsc --noEmit
```

### 5. Local

```powershell
npm run dev
```

## Test bắt buộc

### A. Double tap

- Mở giỏ.
- Bấm nhanh nút Đặt hàng 5-10 lần.
- Database/app Merchant phải chỉ có 1 order.

### B. iPhone/Safari

- Safari thường.
- Chrome trên iPhone.
- Private mode nếu có.
- Bấm đặt một lần, phải thấy overlay ngay.

### C. Android

- Chrome.
- Samsung Internet nếu có máy Samsung.
- Zalo/Facebook in-app browser nếu link được mở từ đó.

### D. Mạng chậm

Chrome DevTools -> Network -> Slow 3G.

Bấm đặt 1 lần:
- nút khóa ngay;
- sau vài giây báo đang kiểm tra;
- không tạo order thứ 2.

### E. Recovery

Nếu response bị gián đoạn sau khi server đã tạo order, website phải tìm lại order theo `client_request_id` và chuyển sang trang tra cứu thay vì yêu cầu khách tạo lại.

## Git

Sau test local OK:

```powershell
git add app/dat-mon-nhanh/page.tsx
git add app/api/orders/create/route.ts
git add components/order/StickyCheckoutBar.tsx
git add supabase/migrations/20260822_reliable_checkout.sql
git commit -m "feat: add reliable idempotent checkout"
git push origin main
```

Không cần commit `reliable_checkout_page.patch` hoặc `APPLY_RELIABLE_CHECKOUT.cjs` sau khi patch đã áp dụng.
