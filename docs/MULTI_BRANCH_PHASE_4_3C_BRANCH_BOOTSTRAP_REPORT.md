# MULTI BRANCH PHASE 4.3C BRANCH BOOTSTRAP REPORT

Ngay thuc hien: 2026-07-21
Pham vi: Tao service orchestration branch-first, khong noi vao UI.

## 1) File da tao/sua

- lib/resolveCustomerBranch.ts
- types/customer.ts
- docs/MULTI_BRANCH_PHASE_4_3C_BRANCH_BOOTSTRAP_REPORT.md

Khong sua `app/dat-mon-nhanh/page.tsx`, khong sua API, khong sua database, khong noi service nay vao frontend.

## 2) Contract service

Function:
- `resolveCustomerBranch(phone: string, signal?: AbortSignal)`

Return shape:

```ts
{
	ok: boolean;
	customer: CustomerLookupCustomer | null;
	selectedBranch: PreviewSelectedBranch | null;
	shouldChooseAddress: boolean;
	message: string | null;
}
```

Luong:
1. normalize phone
2. `lookupCustomerByPhone()`
3. neu khong co customer -> `customer:null`, `selectedBranch:null`, `shouldChooseAddress:true`
4. neu co customer nhung thieu lat/lng -> `customer`, `selectedBranch:null`, `shouldChooseAddress:true`
5. neu co lat/lng -> goi `fetchMapsPreviewNearestBranch()` va return `customer`, `selectedBranch`, `shouldChooseAddress:false`

Response type duoc mo rong trong `types/customer.ts`:
- `ResolveCustomerBranchResult`

## 3) Normalize phone va lookup reuse

- Service khong tu query customers truc tiep.
- Service reuse `lookupCustomerByPhone(phone, signal)` trong `lib/customerLookup.ts`.
- `lookupCustomerByPhone()` da co normalize phone, query `customers`, va tra customer typed.
- Validation phone da siết ve di dong Viet Nam 10 so: `^0(3|5|7|8|9)\d{8}$`.
- Phase 4.3C khong noi vao UI nen khong thay doi runtime website.

## 4) Cach xac dinh shouldChooseAddress

- `true` khi khong co customer.
- `true` khi co customer nhung khong co `lastLat/lastLng` hop le.
- `false` khi co customer va co lat/lng hop le, bat dau preview branch.

## 5) Field database/preview da su dung

Service nay tai su dung cac field da xac nhan:
- Customer fields: `id`, `phone`, `name`, `last_address`, `last_address_detail`, `last_payment_method`, `last_lat`, `last_lng`, `total_orders`, `total_points`, `total_spent`
- Maps preview result: `selectedBranch` tu `fetchMapsPreviewNearestBranch()`

## 5.1) Phan biet khach moi va loi he thong

- Sai so dien thoai hoac customer lookup loi: `ok=false`, `message` chung, khong gia vờ la khach moi.
- Lookup thanh cong nhung khong tim thay customer: `ok=true`, `customer=null`, `selectedBranch=null`, `shouldChooseAddress=true`, `message=null`.
- Co customer nhung thieu lat/lng: `ok=true`, `customer` co du lieu, `selectedBranch=null`, `shouldChooseAddress=true`, `message=null`.
- Co customer va Maps tim duoc branch: `ok=true`, `customer` co du lieu, `selectedBranch` co du lieu, `shouldChooseAddress=false`, `message=null`.
- Co customer nhung Maps loi hoac khong co branch hop le: `ok=false`, `selectedBranch=null`, `shouldChooseAddress=true`, `message` co noi dung de UI sau nay co the hien nut thu lai.

## 6) Xu ly loi va not found

- Service khong throw loi ra caller trong cac luong thong thuong.
- Neu lookup khong tim thay customer, service tra ve `shouldChooseAddress:true` de caller tiep tuc onboarding.
- Neu preview branch that bai, `fetchMapsPreviewNearestBranch()` se tra `selectedBranch:null`; service van tra `customer` va `shouldChooseAddress:false` trong truong hop co lat/lng, giup caller xem do toi uu co san. 
- Khong tra raw Supabase error ra UI.

## 7) Giới hạn AbortSignal

- Service co nhan `signal?: AbortSignal`.
- Signal duoc truyen xuong lookup va preview helper.
- `lookupCustomerByPhone()` su dung `query.abortSignal(signal)` khi signal co mat.
- `fetchMapsPreviewNearestBranch()` da nhan signal thang qua `fetch`.
- Khong viet workaround phuc tap moi.

## 8) Vi sao khong anh huong production

- Khong import vao `app/dat-mon-nhanh/page.tsx`.
- Khong doi menu, cart, payment, shipping, branch-menu, hay order insert.
- Khong dung service role.
- Khong them localStorage, khong set address/branch/cart.
- Khong tao API moi.

## 9) Gioi han hien tai

- Service chi la lop orchestration doc lap.
- Chua co gate phone-first trong UI.
- Chua auto-fill dia chi len state runtime.
- Chua tiep can cart/menu gating.

## 10) Ke hoach Phase 4.3D

- Noi `resolveCustomerBranch()` vao UI mot cach an toan.
- Neu khach cu co dia chi, prefill va cho xac nhan.
- Neu khong co dia chi, buoc chon Google Maps.
- Giu menu chua bi chan cho den khi branch-first flow duoc chot.
