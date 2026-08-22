# AVNT Branch Toppings Patch

## Mục tiêu
- Q1/Q6 tạm hết topping độc lập.
- Website không hiển thị topping tạm hết của branch đang đặt.
- Không sửa bảng `toppings.is_active` khi Merchant toggle.

## Cài website
1. Copy nội dung ZIP vào root project web.
2. Chạy `node APPLY_BRANCH_TOPPINGS.cjs`.
3. Chạy SQL `supabase/migrations/20260822_branch_topping_settings.sql` trên Supabase.
4. `npx tsc --noEmit` rồi `npm run dev`.

## Test
- Merchant Q1 tắt topping A -> website Q1 không thấy topping A.
- Website Q6 vẫn thấy topping A.
- Bật lại Q1 -> topping xuất hiện lại.

## Git web
```bash
git add app/dat-mon-nhanh/page.tsx
git add app/api/branch-toppings/route.ts
git add supabase/migrations/20260822_branch_topping_settings.sql
git commit -m "feat: add branch-specific topping availability"
git push origin main
```
