# MULTI-BRANCH PHASE 4.4A - BRANCH MENU PREVIEW REPORT

Date: 2026-07-21
Status: Completed — Phase A (bootstrap restore) + Phase B (branch-menu preview loader) implemented.

---

## 1. Phase 4.3D — Trạng thái trước khi sửa

Khi so sánh working tree với HEAD commit `6a39727`:

- `resolveCustomerBranch` chưa được import trong page.tsx.
- `fetchBranchMenuPreview` chưa tồn tại.
- `normalizePhoneForLookup` và `isValidLookupPhone` chưa có trong page.tsx.
- Effect customerPhone dùng `phone.trim()` thô, không có AbortController.
- `findCustomerByPhone` không có `signal` param, không gọi bootstrap.
- `fetchCustomerFlag` không có `signal` param, không gắn `abortSignal`.
- `calculateRouteByLatLng` không có `options.skipBranchPreview`.
- State preview `branchMenuPreview`, `branchMenuPreviewLoading`, `branchMenuPreviewError` chưa tồn tại.

---

## 2. Phase 4.3D — Các phần đã bổ sung / giữ nguyên

### Đã bổ sung:

1. **Import `resolveCustomerBranch`** từ `@/lib/resolveCustomerBranch`.
2. **Import `fetchBranchMenuPreview`, `BranchMenuPreviewItem`** từ `@/lib/fetchBranchMenuPreview`.
3. **`normalizePhoneForLookup(phone)`** — helper normalize VN phone (chuỗi prefix +84/84/0, loại ký tự không phải số).
4. **`isValidLookupPhone(phone)`** — validate regex `^0(3|5|7|8|9)\d{8}$`.
5. **Effect customerPhone** — thay `phone.length >= 9` bằng validate strict + `AbortController`, cleanup gọi `controller.abort()`.
6. **`fetchCustomerFlag(phone, signal?)`** — thêm optional `AbortSignal`, gắn `query.abortSignal(signal)` khi có.
7. **`findCustomerByPhone(phone, signal?)`** — gọi `resolveCustomerBranch` trước, nếu bootstrap thành công dùng data bootstrap; nếu không fallback query customers cũ; các branch aborted chỉ `return;` không reset loading state; `finally` chỉ gọi `setCheckingCustomer(false)` khi không aborted.
8. **`calculateRouteByLatLng(lat, lng, options?)`** — thêm `options.skipBranchPreview` để không fetch preview lần hai khi bootstrap đã có selectedBranch.

### Đã giữ nguyên:
- Toàn bộ JSX/layout/UI.
- Cart state và logic.
- Coupon, discount, reward.
- Payment method.
- Shipping formula (shippingZones, shippingPromotions, googleShippingFee).
- Tổng tiền (subtotal, total, totalAfterPoints).
- Order payload (ngoại trừ branch_id đã có từ Phase 3.5).
- `fetchInitialData()` — vẫn load products production từ supabase.products.
- Render menu — vẫn dùng state `products` từ fetchInitialData.

---

## 3. File đã sửa / tạo

| File | Loại | Ghi chú |
|---|---|---|
| `app/dat-mon-nhanh/page.tsx` | Sửa | Phase A + B, minimal diff |
| `lib/fetchBranchMenuPreview.ts` | Tạo mới | Module fetch branch-menu preview |
| `docs/MULTI_BRANCH_PHASE_4_4A_BRANCH_MENU_PREVIEW_REPORT.md` | Tạo mới | Báo cáo này |

File **không sửa**:
- `app/api/branch-menu/route.ts`
- `app/api/maps/route.ts`
- `app/api/branches/route.ts`
- `lib/resolveCustomerBranch.ts`
- `lib/customerLookup.ts`
- `types/customer.ts`
- `types/branch.ts`
- Database / migrations
- Admin / payment / coupon / shipping formula / submitOrder

---

## 4. Contract của `fetchBranchMenuPreview`

**File:** `lib/fetchBranchMenuPreview.ts`

**Signature:**
```ts
fetchBranchMenuPreview(
  params: { branchId?: string | null; branchCode?: string | null },
  signal?: AbortSignal
): Promise<BranchMenuPreviewResult>
```

**Return type:**
```ts
type BranchMenuPreviewResult = {
  ok: boolean;
  branch: BranchMenuPreviewBranch | null;
  items: BranchMenuPreviewItem[];
  meta: BranchMenuPreviewMeta | null;
  message: string | null;
};
```

**Quy tắc gọi API:**
- Nếu có `branchId`: gọi `GET /api/branch-menu?branchId=<uuid>`
- Nếu không có `branchId` nhưng có `branchCode`: gọi `GET /api/branch-menu?branchCode=<code>`
- Nếu thiếu cả hai: trả `{ ok: false, ... }` ngay, không gọi API.

**Contract response khớp với `app/api/branch-menu/route.ts`:**
- `ok: boolean`
- `branch: { id, code, name, short_name, is_active, is_open }`
- `items: BranchMenuPreviewItem[]` — mỗi item có `id, name, slug, base_price, effective_price, is_available_for_branch, is_sold_out_for_branch, price_overridden, sort_order, badge, image_url, description, category, topping_category, missing_branch_setting`
- `meta: { total, branch_code, mode }`
- `message: string | null`

**Không throw lỗi ra caller.** Mọi exception đều trả `{ ok: false, items: [], ... }`.

---

## 5. State preview đã thêm

```ts
const [branchMenuPreview, setBranchMenuPreview] = useState<BranchMenuPreviewItem[]>([]);
const [branchMenuPreviewLoading, setBranchMenuPreviewLoading] = useState(false);
const [branchMenuPreviewError, setBranchMenuPreviewError] = useState("");
```

Các state này hoàn toàn tách biệt với `products` dùng để render menu production.

---

## 6. Effect preview hoạt động thế nào

```
selectedBranch thay đổi
  → nếu không có branchId và branchCode: reset state preview, return
  → tạo AbortController mới
  → setBranchMenuPreviewLoading(true)
  → gọi fetchBranchMenuPreview()
  → nếu signal bị abort trước khi response trả về: return, không set state
  → nếu ok: setBranchMenuPreview(result.items)
  → nếu lỗi: setBranchMenuPreviewError(message)
  → setBranchMenuPreviewLoading(false)
  → cleanup: controller.abort()
```

---

## 7. Cách AbortController tránh race condition

### Effect customerPhone:
- Mỗi lần `customerPhone` thay đổi, tạo một `AbortController` mới.
- `controller.abort()` được gọi trong cleanup function của effect.
- Nếu phone thay đổi trước khi request cũ hoàn thành, request cũ bị abort.
- Mọi await point trong `findCustomerByPhone` đều kiểm tra `signal?.aborted` và `return;` ngay.
- `setCheckingCustomer(false)` chỉ được gọi trong `finally` khi `!signal?.aborted`, tránh stale loading reset.

### Effect branch-menu:
- Mỗi lần `selectedBranch` thay đổi, tạo một `AbortController` mới.
- Request cũ bị abort khi branch đổi.
- Sau khi `await fetchBranchMenuPreview()` trả về, kiểm tra `controller.signal.aborted` trước khi `setState`.

---

## 8. Cách bảo đảm products production không đổi

- `fetchInitialData()` vẫn được gọi khi mount, load từ `supabase.from("products")`.
- `setProducts(...)` chỉ được gọi duy nhất trong `fetchInitialData()`.
- Không có dòng `setProducts(branchMenuPreview.items)` ở bất kỳ đâu.
- Menu trong JSX vẫn render từ `filteredProducts` (derived từ `products`).
- `branchMenuPreview` chỉ được dùng trong `branchMenuPreviewDiff` useMemo và debug log.

---

## 9. So sánh legacy menu và branch menu

Được thực hiện qua `branchMenuPreviewDiff` useMemo:

```ts
const branchMenuPreviewDiff = useMemo(() => {
  const legacyIds = new Set(products.map((item) => item.id));
  const previewIds = new Set(branchMenuPreview.map((item) => item.id));

  return {
    legacyCount: products.length,
    previewCount: branchMenuPreview.length,
    legacyMissingInPreview: products
      .filter((item) => !previewIds.has(item.id))
      .map((item) => item.id),
    previewOnlyIds: branchMenuPreview
      .filter((item) => !legacyIds.has(item.id))
      .map((item) => item.id),
  };
}, [products, branchMenuPreview]);
```

**Không hiển thị ra giao diện.** Chỉ dùng để log trong `development`:

```ts
if (process.env.NODE_ENV === "development") {
  console.debug("branch-menu preview diff", { ... });
}
```

---

## 10. Tổng diff thật của page.tsx

```
138 additions / 18 deletions
```

So sánh với HEAD `6a39727`, git diff ghi nhận các vùng đã sửa:
1. Import block: thêm `resolveCustomerBranch`, `fetchBranchMenuPreview`, `BranchMenuPreviewItem`.
2. Helpers: thêm `normalizePhoneForLookup`, `isValidLookupPhone` (module-level functions).
3. State declarations: thêm 3 state preview.
4. Effect customerPhone: thay `phone.length >= 9` bằng validate + AbortController.
5. Effect branch-menu: thêm mới (theo selectedBranch).
6. `fetchCustomerFlag`: thêm `signal?` param + `query.abortSignal(signal)`.
7. `findCustomerByPhone`: thêm `signal?` param, thêm bootstrap call, fallback query, finally guard.
8. `calculateRouteByLatLng`: thêm `options?` param + `skipBranchPreview` guard.
9. `branchMenuPreviewDiff` useMemo + debug effect: thêm mới.

---

## 11. Vì sao website production không bị ảnh hưởng

- Menu production vẫn render từ `products` state (global Supabase query).
- `branchMenuPreview` chỉ là state parallel, không được setProducts().
- Khách đặt món bình thường: không thay đổi cart, coupon, payment, shipping, submit.
- `resolveCustomerBranch` chỉ được gọi sau khi khách nhập SĐT hợp lệ và debounce 600ms.
- Nếu bootstrap lỗi: fallback sang legacy `customers` query, hành vi giống trước.
- AbortController đảm bảo không có stale setState làm lệch UI.

---

## 12. Cách rollback

1. `git checkout -- app/dat-mon-nhanh/page.tsx` — restore toàn bộ page về HEAD.
2. Xóa `lib/fetchBranchMenuPreview.ts` — module mới, không cần bởi bất kỳ file nào khác.
3. Các file khác (resolveCustomerBranch, customerLookup, types/customer) không bị sửa trong phase này, giữ nguyên hoặc rollback cùng.

---

## 13. Kế hoạch Phase 4.4B

### Tiêu chí trước khi chuyển sang Phase 4.4B:

1. Xác nhận `branchMenuPreview.items` trả về đủ data từ API (không empty khi branch có setting).
2. So sánh `legacyCount` vs `previewCount` — phải đủ gần nhau (±2–3 món) cho Q6 sau khi Phase 4.1 seed.
3. `legacyMissingInPreview` phải ≤ 3 hoặc 0 (chỉ còn món chưa có setting ở Q6).
4. `is_available_for_branch` và `is_sold_out_for_branch` đang phản ánh đúng.

### Sau khi xác nhận đủ data:

Phase 4.4B có thể cân nhắc:
- Thêm một state `menuSource: "legacy" | "branch"` (mặc định `"legacy"`).
- Khi `branchMenuPreview.items.length > 0` và branch hợp lệ, cho phép admin/developer bật flag chuyển sang dùng branch-menu.
- Trong Phase 4.4B, chỉ đổi nguồn render menu (từ `products` sang `branchMenuPreview`), giữ nguyên cart/payment/shipping/submit.
- Vẫn cần fallback về `products` nếu `branchMenuPreview.items.length === 0`.

**Không thực hiện Phase 4.4B trong Phase 4.4A.** Cần stop để review trước.

---

## Build & Lint

- **Build:** PASS — `next build --webpack` thành công, 45/45 static pages, không có TypeScript error.
- **Lint:** Có lỗi nhưng 100% là pre-existing (no-explicit-any, setState in effect — line số dịch chuyển do code mới thêm, nhưng file gốc cũng có các lỗi tương đương).
- **Lint mới gây ra:** 0 lỗi mới.
