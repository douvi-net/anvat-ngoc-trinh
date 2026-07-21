# MULTI BRANCH PHASE 4.3A BRANCH-FIRST AUDIT

Ngay thuc hien: 2026-07-21
Pham vi: Audit va lap ke hoach branch-first onboarding truoc khi hien thi menu. Khong sua runtime.

## 1) Luong hien tai tu khi mo trang den khi tao don

1. Trang dat mon khoi tao state va goi load du lieu ngay khi mount tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L231).
2. Luong mount hien tai goi `fetchInitialData()` va `loadSavedCustomer()` tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L231).
3. `fetchInitialData()` dang tai menu va dung lieu hien thi ngay lap tuc, gom products, toppings, shipping zones, shop settings, banners, coupons, rewards, shipping promotions tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L291).
4. `loadSavedCustomer()` nap lai phone, name, address, address detail va payment method tu localStorage tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L362).
5. Khi customerPhone co du 9 ky tu, effect tu dong goi `findCustomerByPhone()` tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L280).
6. `findCustomerByPhone()` tra customer cu theo phone; neu co lat/lng da luu thi set lai address va goi `calculateRouteByLatLng()` tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L423).
7. Khi nguoi dung chon dia chi Google, `selectAddressSuggestion()` lay detail va sau do goi `calculateRouteByLatLng()` tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L1210).
8. `calculateRouteByLatLng()` dang goi maps preview branch va maps production path song song, sau do set selectedBranch, distance, shipping fee va routeMessage tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L1256).
9. `submitOrder()` validate, upsert customer, insert orders, insert order_items va notify tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L1367).
10. `branch_id` duoc them vao payload orders tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L1530).

## 2) Danh sach state lien quan

- Phone: `customerPhone` tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L195), `loadSavedCustomer()` tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L362), va localStorage keys tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L365).
- Customer: `customerId`, `customerName`, `customerFlag`, `customerPoints`, `customerFoundMessage` tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L194), [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L196), [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L223).
- Address: `customerAddress`, `customerAddressDetail`, `addressSuggestions`, `addressLoading`, `addressSelected` tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L197).
- Coordinates: `deliveryLat`, `deliveryLng` tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L202).
- Products: `products` tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L173), filtered display tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L713).
- Toppings: `toppings` tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L174), derived display tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L999).
- Cart: `cart` tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L182), rehydrate tu localStorage tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L231).
- Selected branch: `selectedBranch` tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L211), set trong route preview tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L1281).
- Shipping: `deliveryDistanceKm`, `routeLoading`, `routeMessage`, `googleShippingFee` tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L214) va [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L215).

## 3) Danh sach function va vi tri

- `fetchInitialData()` - tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L291) - tai products, toppings, shipping zones, shop settings, banners, coupons, rewards, shipping promotions.
- `loadSavedCustomer()` - tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L362) - nap thong tin khach tu localStorage.
- `fetchCustomerFlag()` - tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L399) - doc customer_flags theo phone.
- `findCustomerByPhone()` - tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L423) - tim customers theo phone va set lai state.
- `upsertCustomer()` - tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L1092) - insert/update customers.
- `searchAddressSuggestions()` - tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L1210) - autocomplete places.
- `selectAddressSuggestion()` - tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L1210) - lay place details va tinh route.
- `calculateRouteByLatLng()` - tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L1256) - goi maps preview va route production.
- `getScheduledDateTime()` - tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L1324) - xu ly scheduled order.
- `submitOrder()` - tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L1367) - tao don.
- `getItemUnitTotal()` va cart helpers - quanh [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L629).

## 4) API / helper dang co san

- Branch menu preview API server-side tai [app/api/branch-menu/route.ts](app/api/branch-menu/route.ts#L69), branch query tai [app/api/branch-menu/route.ts](app/api/branch-menu/route.ts#L111), products select tai [app/api/branch-menu/route.ts](app/api/branch-menu/route.ts#L146), branch settings select tai [app/api/branch-menu/route.ts](app/api/branch-menu/route.ts#L164).
- Maps preview branch logic tai [app/api/maps/route.ts](app/api/maps/route.ts#L219), previewNearestBranch query tai [app/api/maps/route.ts](app/api/maps/route.ts#L221), active+open filter tai [app/api/maps/route.ts](app/api/maps/route.ts#L126), selected_branch response tai [app/api/maps/route.ts](app/api/maps/route.ts#L287).
- Branch list API tai [app/api/branches/route.ts](app/api/branches/route.ts#L7), active filter tai [app/api/branches/route.ts](app/api/branches/route.ts#L35).
- Preview helper tai [lib/mapsPreviewNearestBranch.ts](lib/mapsPreviewNearestBranch.ts#L90).

## 5) Schema khach hang va dia chi thuc te trong repo

Khong tim thay DDL CREATE TABLE cho `customers` hoac `orders` trong cac migration da scan trong repo. Vi vay phan nay duoc xac nhan tu runtime code dang su dung thay vi DDL. Co the ket luan an toan nhu sau:

- `customers` dang duoc doc/ghi voi cac cot: `id`, `phone`, `name`, `last_address`, `last_address_detail`, `last_payment_method`, `last_lat`, `last_lng`, `total_orders`, `total_points`, `total_spent`, `updated_at`.
- `orders` dang duoc insert voi cac cot: `order_code`, `customer_id`, `customer_name`, `customer_phone`, `customer_address`, `address_detail`, `note`, `subtotal`, `shipping_fee_original`, `shipping_discount`, `coupon_discount`, `shipping_fee`, `discount_amount`, `points_used`, `points_earned`, `points_discount`, `coupon_code`, `total`, `status`, `source`, `payment_method`, `payment_status`, `delivery_distance_km`, `delivery_area`, `fulfillment_type`, `delivery_status`, `preparation_minutes`, `delivery_minutes`, `estimated_delivery_from`, `estimated_delivery_to`, `confirmed_at`, `order_type`, `scheduled_at`, `scheduled_note`, `branch_id`.
- `order_items` dang duoc insert voi: `order_id`, `product_id`, `product_name`, `quantity`, `price`, `unit_price`, `total`, `note`, `spicy_level`, `toppings`.
- Khong tim thay `last_order` trong cac file da scan.
- Khong tim thay bang multi-address rieng; hien tai model customer dang luu 1 dia chi gan nhat trong cac cot `last_*`.
- Migration branch-related lien quan `orders.branch_id` co o [supabase/migrations/20260721_multi_branch_phase_1.sql](supabase/migrations/20260721_multi_branch_phase_1.sql#L183) va trigger default Q6 o [supabase/migrations/20260721_multi_branch_phase_2_default_q6.sql](supabase/migrations/20260721_multi_branch_phase_2_default_q6.sql#L1).

## 6) Diem co the tai su dung

- `findCustomerByPhone()` co the tai su dung cho onboarding branch-first vi no da co luong tim khach cu va set lai dia chi.
- `calculateRouteByLatLng()` co the tai su dung cho buoc xac dinh branch truoc khi menu load.
- `selectedBranch` state va helper preview branch da ton tai tai [app/dat-mon-nhanh/page.tsx](app/dat-mon-nhanh/page.tsx#L211) va [lib/mapsPreviewNearestBranch.ts](lib/mapsPreviewNearestBranch.ts#L90).
- API preview branch menu da co san tai [app/api/branch-menu/route.ts](app/api/branch-menu/route.ts#L69).
- Luong insert orders da co `branch_id` va trigger fallback Q6 da co san.
- LocalStorage cho phone, address, payment method da co san.

## 7) Diem phai thay doi trong tuong lai

- Menu hien tai dang load ngay trong `fetchInitialData()` thay vi chờ branch; day la diem chinh can doi.
- Products va toppings dang dat theo global `public.products` va `public.toppings`, chua branch-aware.
- `calculateRouteByLatLng()` dang tra shipping theo Q6 production, preview branch chi la song song; future branch-first onboarding can branch-aware loading gate.
- `submitOrder()` dang chấp nhận dat don truoc khi co branch menu validation.
- Cart hien tai khong co validate against branch-menu khi doi dia chi.

## 8) Rui ro khi bat nhap so dien thoai truoc

- Khach moi co the cam thay bi chan neu UI bat phone qua som ma khong co fallback ro rang.
- Customer lookup co the that bai do phone sai dinh dang hoac khong ton tai, neu xu ly cuong ep se mat conversion.
- Neu chua co dia chi, phone-first co the tao cam giac luu ho so qua som; can cho phep tiep tuc nhu khach moi.
- Neu page phuc vu delivery va pickup cung luc, gate phone-first co the anh huong pickup neu khong tach luong.

## 9) Cach khong lam mat khach moi

- Gate phone phai la soft gate: khach nhap phone, neu khong tim thay van cho tiep tuc nhu khach moi.
- Khong duoc require customer cu phai co dia chi san; neu khong co, bat buoc chon Google Maps.
- Neu lookup that bai, hien thong bao trung lap nhung khong chan boi dat don ve sau.
- Ngan menu cho den khi co branch va tuong thich branch, nhung van cho thao tac nhap thong tin co ban.

## 10) Cach xu ly khach cu co dia chi

- `findCustomerByPhone()` hien tai da lay `last_address`, `last_address_detail`, `last_lat`, `last_lng` va `last_payment_method`.
- Neu co lat/lng hop le, `calculateRouteByLatLng()` se chay ngay, nen co the prefill va yeu cau xac nhan dia chi gan nhat.
- Neu chi co `last_address` nhung khong co toado, can cho khach xac nhan/dien lai Google Maps.
- Hien tai khong co bang dia chi phu rieng; vi vay “dia chi gan nhat” = dia chi gan nhat duoc luu trong `last_*`.

## 11) Cach xu ly neu schema sau nay co nhieu dia chi

- Hien tai repo khong tim thay multi-address table.
- Neu phase sau them bang dia chi rieng, onboarding nen chon danh sach dia chi cua customer sau khi lookup phone.
- Cho den luc do, branch-first audit nay chi co the co nhan dinh 1 customer = 1 dia chi gan nhat duoc luu trong `last_*`.

## 12) Cach xu ly doi dia chi lam doi chi nhanh

- Khi doi dia chi, phai goi lai maps preview de lay `selectedBranch` moi.
- Sau do phai doi branch-menu preview va so sanh giu cart hien tai voi menu branch moi.
- Khong tu dong xoa mon; phai bao cao danh sach mon khong hop le va cho khach xac nhan.
- Neu branch moi van khac nhung cart hop le, cho phep giu cart va tiep tuc.

## 13) Cach validate gioi hang gio hang voi branch-menu

- Dung `product_id` trong cart so voi `items.id` tu [app/api/branch-menu/route.ts](app/api/branch-menu/route.ts#L69).
- Kiem tra `is_available_for_branch` va `missing_branch_setting`.
- Neu mon khong available hoac thieu setting, hien canh bao thay vi xoa ngam.
- Do branch-menu preview co `includeUnavailable=true`, co the dung de debug noi bo, nhung default flow khong nen phu thuoc vao no.

## 14) Cach xu ly pickup

- Hien tai pickup dang set `fulfillmentType = "pickup"`, `orderType = "scheduled"`, xoa selectedBranch, va order insert `branch_id` null de trigger fallback Q6.
- Trong branch-first onboarding, pickup can duoc xem la mot ngoai le rieng: co the bo qua menu gate neu pickup luon phuc vu tai Q6, hoac van phai chon branch neu co nhu cau branch-aware future.
- Khong nen bat khach pickup di qua gate dia chi neu chua co quy tac branch cho pickup.

## 15) Cach xu ly khi API / customer lookup / maps loi

- Customer lookup loi: khong chan khach moi, cho nhap tiep thong tin va chon dia chi.
- Maps loi: khong hien menu; hien retry va giu trang thai an toan.
- Branch-menu preview loi: khong hien menu branch-aware, tra ve retry an toan; khong fallback sang menu global trong preview branch-first.
- Dat don loi: giu branch_id null neu chua xac dinh duoc branch, trigger fallback Q6 theo Phase 2.

## 16) Kich ban can luu y ve request preview

- `calculateRouteByLatLng()` co the duoc goi nhieu lan tu: chon dia chi Google, customer cu co saved lat/lng, nut tinh lai phi ship, va bat dau luong sau khi cap nhat state.
- Vi preview branch dang tach rieng, can co de-dup/abort o phase sau de tranh race khi nguoi dung nhap nhanh.

## 17) Kế hoạch triển khai chia cực nhỏ

- Phase 4.3B: Tạo module tra cứu khách theo số điện thoại, chưa nối UI.
  - File được phép sửa: file module mới cho lookup, report.
  - File không được sửa: `app/dat-mon-nhanh/page.tsx` và mọi runtime UI.
  - Hành vi production: không đổi.
  - Rollback: xóa module mới.
  - Test bắt buộc: gọi module bằng input giả và kiểm tra shape kết quả.

- Phase 4.3C: Tạo màn hình/gate nhập số điện thoại, chưa chặn menu.
  - File được phép sửa: `app/dat-mon-nhanh/page.tsx`, report.
  - File không được sửa: API, database.
  - Hành vi production: chưa chặn menu, chỉ chuẩn bị state/UX.
  - Rollback: bỏ gate, giữ luồng cũ.
  - Test bắt buộc: khách mới vẫn vào được luồng, khách cũ có thể lookup.

- Phase 4.3D: Tự điền địa chỉ khách cũ và yêu cầu xác nhận.
  - File được phép sửa: `app/dat-mon-nhanh/page.tsx`, report.
  - File không được sửa: branch/menu APIs.
  - Hành vi production: chỉ prefill, không đổi đặt đơn.
  - Rollback: tắt prefill.
  - Test bắt buộc: khách cũ thấy địa chỉ gần nhất, có thể đổi.

- Phase 4.3E: Xác định selectedBranch trước khi tải menu.
  - File được phép sửa: `app/dat-mon-nhanh/page.tsx`, report.
  - File không được sửa: order insert logic.
  - Hành vi production: chưa đổi menu thực tế.
  - Rollback: revert branch gate.
  - Test bắt buộc: không tải menu cho đến khi có selectedBranch.

- Phase 4.3F: Tải branch-menu vào state preview, chưa thay menu production.
  - File được phép sửa: `app/dat-mon-nhanh/page.tsx`, report.
  - File không được sửa: UI menu production.
  - Hành vi production: chỉ preview state.
  - Rollback: tắt preview state.
  - Test bắt buộc: data preview khớp branch-menu, menu cũ vẫn render.

- Phase 4.3G: So sánh products hiện tại và branch-menu.
  - File được phép sửa: helper/module so sánh, report.
  - File không được sửa: insert order payload.
  - Hành vi production: chỉ cảnh báo.
  - Rollback: bỏ validator.
  - Test bắt buộc: phát hiện món thiếu setting/khác giá.

- Phase 4.3H: Chuyển menu production sang branch-menu với fallback Q6.
  - File được phép sửa: `app/dat-mon-nhanh/page.tsx`, helper branch-menu, report.
  - File không được sửa: database schema.
  - Hành vi production: đổi nguồn menu chính, nhưng fallback Q6 phải an toàn.
  - Rollback: fallback lại `public.products`.
  - Test bắt buộc: q6 vẫn ổn, q1/inactive không làm sập menu.

- Phase 4.3I: Chặn menu trước khi xác định chi nhánh.
  - File được phép sửa: `app/dat-mon-nhanh/page.tsx`, report.
  - File không được sửa: branch-menu API.
  - Hành vi production: khóa menu sớm hơn, giảm sai đơn.
  - Rollback: bỏ gate.
  - Test bắt buộc: trước selectedBranch không có add-to-cart.

- Phase 4.3J: Validate giỏ khi đổi địa chỉ/chi nhánh.
  - File được phép sửa: cart validator, page, report.
  - File không được sửa: payment flow.
  - Hành vi production: chỉ cảnh báo, không xóa âm thầm.
  - Rollback: tắt validator.
  - Test bắt buộc: branch change hiển thị món xung đột, không auto-delete.

- Phase 4.3K: Hoàn thiện UX và test mobile.
  - File được phép sửa: page, styles nhỏ, report.
  - File không được sửa: backend APIs.
  - Hành vi production: chỉ polish UX.
  - Rollback: revert polish nếu cần.
  - Test bắt buộc: mobile flow, retry/error states, pickup/delivery parity.

## 18) Ket luan audit

- Nguon menu hien tai chua branch-first; no duoc load truoc khi xac dinh branch.
- Khach va dia chi dang luu theo mo hinh 1 dia chi gan nhat trong `customers`.
- Da co san selectedBranch, maps preview va branch-menu preview API de tai su dung.
- Buoc an toan nhat la dien khai tung phase nho, bat dau bang lookup khach va branch gate, sau do moi doi nguon menu.
