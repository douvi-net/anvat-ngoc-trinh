# MULTI BRANCH PHASE 4.3B CUSTOMER LOOKUP REPORT

Ngay thuc hien: 2026-07-21
Pham vi: Tao module tra cuu khach hang theo so dien thoai, chua noi vao frontend.

## 1) File da tao/sua

- lib/customerLookup.ts
- types/customer.ts
- docs/MULTI_BRANCH_PHASE_4_3B_CUSTOMER_LOOKUP_REPORT.md

Khong sua `app/dat-mon-nhanh/page.tsx`, khong sua API, khong sua database, khong noi module vao UI.

## 2) Contract function

Function:
- `lookupCustomerByPhone(phone: string, signal?: AbortSignal)`

Response:

```ts
{
  ok: boolean;
  normalizedPhone: string;
  customer: {
    id: string;
    phone: string;
    name: string | null;
    lastAddress: string | null;
    lastAddressDetail: string | null;
    lastPaymentMethod: string | null;
    lastLat: number | null;
    lastLng: number | null;
    totalOrders: number;
    totalPoints: number;
    totalSpent: number;
  } | null;
  message: string | null;
}
```

## 3) Quy tac normalize phone

Module normalize phone truoc khi query:
- trim khoang trang
- bo ky tu khong phai so
- neu bat dau bang `+84` thi doi ve `0`
- neu bat dau bang `84` va du do dai hop le thi doi ve `0`
- khong tu doan so neu qua ngan hoac sai dinh dang

Neu phone khong hop le:
- `ok = false`
- `customer = null`
- `message = "Số điện thoại chưa hợp lệ."`

## 4) Field database da su dung

Module chi select dung cac cot runtime audit da xac nhan:
- `id`
- `phone`
- `name`
- `last_address`
- `last_address_detail`
- `last_payment_method`
- `last_lat`
- `last_lng`
- `total_orders`
- `total_points`
- `total_spent`

Query dung:
- `from("customers")`
- `.eq("phone", normalizedPhone)`
- `.maybeSingle()`

## 5) Xu ly not found

Neu khong tim thay khach:
- `ok = true`
- `customer = null`
- `message = null`
- `normalizedPhone` van duoc tra ve de caller co the debug

## 6) Xu ly loi

- Loi query thong thuong khong throw ra caller.
- Module tra:
  - `ok = false`
  - `customer = null`
  - `message = "Không thể tra cứu khách hàng."`
- Raw Supabase error khong tra ra UI.
- Chi log console o server/client runtime de debug noi bo.

## 7) AbortSignal

- Module co nhan `signal?: AbortSignal`.
- Da co co che tap trung call `abortSignal(signal)` neu builder Supabase/Postgrest cung cap method nay.
- Khong viet workaround phuc tap neu runtime khong ho tro ky thuat nay.
- Gioi han hien tai: neu builder build ra khong co `abortSignal`, signal se khong duoc ap dung truc tiep.

## 8) Vi sao khong anh huong production

- Module chua duoc import vao `app/dat-mon-nhanh/page.tsx`.
- Khong doi luong menu, cart, branch, shipping, order insert.
- Khong dung service role, chi dung client supabase hien co.
- Khong them localStorage, khong set address/branch/cart.

## 9) Gioi han hien tai

- Module chi la lookup layer doc lap.
- Chua co UI gate phone-first.
- Chua co prefill dia chi hay branch-first onboarding.
- Chua validate cart/menu theo branch.

## 10) Ke hoach Phase 4.3C

- Tao gate nhap so dien thoai tren `app/dat-mon-nhanh/page.tsx` nhung chua chan menu.
- Noi module lookup vao UI o che do an toan, co fallback khach moi.
- Giữ menu/checkout hien tai nguyen ven cho den khi co selectedBranch.
- Test mobile va cac nhánh loi khac nhau truoc khi chuyen sang branch-first.
