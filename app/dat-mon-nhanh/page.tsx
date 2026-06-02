"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  slug?: string | null;
  price: number;
  badge: string | null;
  image_url: string | null;
  description: string | null;
  is_sold_out: boolean | null;
  category: string | null;
};

type Topping = {
  id: string;
  name: string;
  price: number;
};

type CartItem = Product & {
  cartKey: string;
  quantity: number;
  selectedToppings: Topping[];
  spicyLevel: string;
  itemNote: string;
  itemTotal: number;
};

type ShippingZone = {
  id: string;
  name: string;
  min_km: number;
  max_km: number;
  fee: number;
};

type ShopSettings = {
  id: string;
  shop_name: string;
  is_open: boolean;
  open_time: string;
  close_time: string;
  description: string | null;
  delivery_note: string | null;
};

type Banner = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  button_text: string | null;
  button_link: string | null;
};

const spicyOptions = ["Không cay", "Cay ít", "Cay vừa", "Cay nhiều"];

export default function DatMonNhanhPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);

  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedToppingIds, setSelectedToppingIds] = useState<string[]>([]);
  const [selectedSpicyLevel, setSelectedSpicyLevel] = useState("Cay vừa");
  const [itemNote, setItemNote] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [deliveryDistanceKm, setDeliveryDistanceKm] = useState(2);
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetchInitialData();

    setCustomerName(localStorage.getItem("avnt_customer_name") || "");
    setCustomerPhone(localStorage.getItem("avnt_customer_phone") || "");
    setCustomerAddress(localStorage.getItem("avnt_customer_address") || "");
    setPaymentMethod(localStorage.getItem("avnt_payment_method") || "cod");
  }, []);

  async function fetchInitialData() {
    const [
      { data: productData },
      { data: toppingData },
      { data: zoneData },
      { data: settingsData },
      { data: bannerData },
    ] = await Promise.all([
      supabase
        .from("products")
        .select(
          "id,name,slug,price,badge,image_url,description,is_sold_out,category"
        )
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),

      supabase
        .from("toppings")
        .select("id,name,price")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),

      supabase
        .from("shipping_zones")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),

      supabase.from("shop_settings").select("*").limit(1).maybeSingle(),

      supabase
        .from("banners")
        .select("id,title,description,image_url,button_text,button_link")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
    ]);

    setProducts((productData || []) as Product[]);
    setToppings((toppingData || []) as Topping[]);
    setShippingZones((zoneData || []) as ShippingZone[]);
    setShopSettings((settingsData || null) as ShopSettings | null);
    setBanners((bannerData || []) as Banner[]);
    setLoading(false);
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  }

  const categories = useMemo(() => {
    const list = products.map((item) => item.category || "Món ngon");
    return ["Tất cả", ...Array.from(new Set(list))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "Tất cả") return products;
    return products.filter(
      (item) => (item.category || "Món ngon") === selectedCategory
    );
  }, [products, selectedCategory]);

  const selectedToppings = useMemo(() => {
    return toppings.filter((item) => selectedToppingIds.includes(item.id));
  }, [toppings, selectedToppingIds]);

  const selectedItemTotal = useMemo(() => {
    if (!selectedProduct) return 0;

    const toppingTotal = selectedToppings.reduce(
      (sum, item) => sum + Number(item.price),
      0
    );

    return Number(selectedProduct.price) + toppingTotal;
  }, [selectedProduct, selectedToppings]);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.itemTotal * item.quantity,
    0
  );

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const shippingFee = useMemo(() => {
    const zone = shippingZones.find(
      (item) =>
        deliveryDistanceKm >= Number(item.min_km) &&
        deliveryDistanceKm <= Number(item.max_km)
    );

    return zone ? Number(zone.fee) : 0;
  }, [shippingZones, deliveryDistanceKm]);

  const total = subtotal + shippingFee;

  function openProduct(product: Product) {
    if (product.is_sold_out) {
      showToast("Món này đang tạm hết");
      return;
    }

    setSelectedProduct(product);
    setSelectedToppingIds([]);
    setSelectedSpicyLevel("Cay vừa");
    setItemNote("");
  }

  function addSelectedProductToCart() {
    if (!selectedProduct) return;

    const cartKey = `${selectedProduct.id}-${Date.now()}-${Math.random()}`;

    const item: CartItem = {
      ...selectedProduct,
      cartKey,
      quantity: 1,
      selectedToppings,
      spicyLevel: selectedSpicyLevel,
      itemNote,
      itemTotal: selectedItemTotal,
    };

    setCart((prev) => [...prev, item]);
    setSelectedProduct(null);
    showToast(`Đã thêm ${selectedProduct.name}`);
  }

  function changeQuantity(cartKey: string, amount: number) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.cartKey === cartKey
            ? { ...item, quantity: Math.max(0, item.quantity + amount) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function makeOrderCode() {
    return `AVNT${Date.now().toString().slice(-6)}`;
  }

  function saveCustomerToLocal() {
    localStorage.setItem("avnt_customer_name", customerName.trim());
    localStorage.setItem("avnt_customer_phone", customerPhone.trim());
    localStorage.setItem("avnt_customer_address", customerAddress.trim());
    localStorage.setItem("avnt_payment_method", paymentMethod);
  }

  async function submitOrder() {
    if (cart.length === 0) {
      alert("Bạn chưa chọn món.");
      return;
    }

    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      alert("Nhập đầy đủ tên, số điện thoại và địa chỉ.");
      return;
    }

    setSubmitting(true);

    try {
      saveCustomerToLocal();

      const orderCode = makeOrderCode();

      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .insert({
          name: customerName.trim(),
          phone: customerPhone.trim(),
          last_address: customerAddress.trim(),
          last_payment_method: paymentMethod,
          total_orders: 1,
        })
        .select()
        .single();

      if (customerError) throw customerError;

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_code: orderCode,
          customer_id: customerData?.id || null,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          customer_address: customerAddress.trim(),
          subtotal,
          shipping_fee: shippingFee,
          total,
          status: paymentMethod === "cod" ? "new" : "waiting_payment",
          source: "website",
          payment_method: paymentMethod,
          payment_status: paymentMethod === "cod" ? "cod" : "pending",
          note: note.trim(),
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map((item) => ({
        order_id: orderData.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total: item.itemTotal * item.quantity,
        toppings: item.selectedToppings,
        spicy_level: item.spicyLevel,
        note: item.itemNote,
      }));

      const { error: itemError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemError) throw itemError;

      await fetch("/api/notify-new-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderCode,
          total,
          paymentMethod,
          status: paymentMethod === "cod" ? "new" : "waiting_payment",
        }),
      });

      setCart([]);
      setCartOpen(false);
      setNote("");

      alert(`Đặt món thành công. Mã đơn: ${orderCode}`);
    } catch (error) {
      console.error(error);
      alert("Đặt món thất bại. Kiểm tra lại dữ liệu hoặc Supabase.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5FFF8] px-4 py-20 text-center">
        <p className="text-xl font-black text-[#06113C]">Đang tải menu...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5FFF8] pb-36">
      {toast && (
        <div className="fixed left-4 top-24 z-[9999] rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#06113C] shadow-2xl">
          {toast}
        </div>
      )}

      <section className="relative h-52 overflow-hidden bg-[#00B14F]">
        {banners[0]?.image_url ? (
          <img
            src={banners[0].image_url}
            alt={banners[0].title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#00B14F] to-[#06113C]" />
        )}

        <div className="absolute inset-0 bg-black/35" />
      </section>

      <section className="relative z-10 mx-auto -mt-16 max-w-6xl px-4">
        <div className="rounded-[32px] bg-white p-5 shadow-2xl shadow-neutral-950/10">
          <div className="flex gap-4">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-3xl bg-[#E8FFF1]">
              <img
                src="/images/hero.jpg"
                alt="Ăn Vặt Ngọc Trinh"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-black leading-tight text-[#06113C] md:text-4xl">
                {shopSettings?.shop_name || "Ăn Vặt Ngọc Trinh"}
              </h1>

              <p className="mt-2 text-sm font-bold text-neutral-500">
                Bánh tráng & ăn vặt Quận 6
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-black text-yellow-700">
                  ⭐ 4.8
                </span>

                <span className="rounded-full bg-[#E8FFF1] px-3 py-1 text-xs font-black text-[#00B14F]">
                  {shopSettings?.is_open ? "Đang bán" : "Tạm đóng"}
                </span>

                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-600">
                  {shopSettings?.open_time || "10:00"} -{" "}
                  {shopSettings?.close_time || "22:00"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {banners.length > 0 && (
        <section className="mx-auto mt-6 max-w-6xl px-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-[#06113C]">
              Ưu đãi hôm nay
            </h2>
            <span className="rounded-full bg-white px-4 py-2 text-xl">→</span>
          </div>

          <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="min-w-[280px] overflow-hidden rounded-[28px] bg-white shadow-lg shadow-neutral-950/5 md:min-w-[420px]"
              >
                <div className="h-36 bg-[#E8FFF1]">
                  {banner.image_url && (
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="p-4">
                  <p className="font-black text-[#06113C]">{banner.title}</p>
                  {banner.description && (
                    <p className="mt-1 line-clamp-2 text-sm font-semibold text-neutral-500">
                      {banner.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="sticky top-0 z-40 mt-6 border-y border-black/5 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-6xl overflow-x-auto">
          <div className="flex gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap rounded-full px-5 py-3 text-sm font-black ${
                  selectedCategory === category
                    ? "bg-[#00B14F] text-white shadow-lg shadow-[#00B14F]/25"
                    : "bg-[#F5FFF8] text-[#06113C]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-5 max-w-6xl px-4">
        <h2 className="text-2xl font-black text-[#06113C]">
          {selectedCategory === "Tất cả" ? "Dành cho bạn" : selectedCategory}
        </h2>

        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`overflow-hidden rounded-[28px] bg-white shadow-lg shadow-neutral-950/5 ${
                product.is_sold_out ? "opacity-50" : ""
              }`}
            >
              <button
                onClick={() => openProduct(product)}
                className="block w-full text-left"
              >
                <div className="relative h-40 bg-[#E8FFF1] md:h-48">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-5xl">
                      🍽️
                    </div>
                  )}

                  {product.badge && (
                    <span className="absolute left-3 top-3 rounded-full bg-[#00B14F] px-3 py-1 text-xs font-black text-white">
                      {product.badge}
                    </span>
                  )}

                  {!product.is_sold_out && (
                    <span className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#00B14F] text-3xl font-black text-white shadow-lg">
                      +
                    </span>
                  )}
                </div>

                <div className="p-3">
                  <h3 className="line-clamp-2 min-h-[48px] text-base font-black leading-6 text-[#06113C]">
                    {product.name}
                  </h3>

                  <p className="mt-2 text-lg font-black text-[#06113C]">
                    {Number(product.price).toLocaleString("vi-VN")}đ
                  </p>

                  {product.is_sold_out && (
                    <p className="mt-1 text-sm font-black text-red-500">
                      Tạm hết món
                    </p>
                  )}
                </div>
              </button>
            </div>
          ))}
        </div>
      </section>

      {cart.length > 0 && (
        <div className="fixed bottom-24 left-4 right-4 z-[90] md:left-1/2 md:max-w-xl md:-translate-x-1/2">
          <button
            onClick={() => setCartOpen(true)}
            className="flex w-full items-center justify-between rounded-[24px] bg-[#00B14F] px-5 py-4 text-white shadow-2xl shadow-[#00B14F]/30"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg text-[#00B14F]">
                🛒
              </span>
              <div className="text-left">
                <p className="text-xs font-bold opacity-90">{itemCount} món</p>
                <p className="text-lg font-black">
                  {total.toLocaleString("vi-VN")}đ
                </p>
              </div>
            </div>

            <span className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#00B14F]">
              Xem giỏ
            </span>
          </button>
        </div>
      )}

      {selectedProduct && (
        <div className="fixed inset-0 z-[9999] flex items-end bg-black/50 md:items-center md:justify-center">
          <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-[32px] bg-white p-5 md:max-w-xl md:rounded-[32px]">
            <div className="flex gap-4">
              <div className="h-24 w-24 overflow-hidden rounded-2xl bg-[#E8FFF1]">
                {selectedProduct.image_url && (
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.name}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-black text-[#06113C]">
                  {selectedProduct.name}
                </h2>

                <p className="mt-2 font-black text-[#00B14F]">
                  {selectedProduct.price.toLocaleString("vi-VN")}đ
                </p>
              </div>
            </div>

            {selectedProduct.description && (
              <p className="mt-4 text-sm font-semibold leading-6 text-neutral-600">
                {selectedProduct.description}
              </p>
            )}

            <div className="mt-5">
              <p className="font-black text-[#06113C]">Topping</p>

              <div className="mt-3 space-y-2">
                {toppings.map((top) => (
                  <label
                    key={top.id}
                    className="flex items-center justify-between rounded-2xl bg-[#F5FFF8] px-4 py-3"
                  >
                    <span className="font-bold text-[#06113C]">
                      {top.name}{" "}
                      <span className="text-[#00B14F]">
                        +{top.price.toLocaleString("vi-VN")}đ
                      </span>
                    </span>

                    <input
                      type="checkbox"
                      checked={selectedToppingIds.includes(top.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedToppingIds((prev) => [...prev, top.id]);
                        } else {
                          setSelectedToppingIds((prev) =>
                            prev.filter((id) => id !== top.id)
                          );
                        }
                      }}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="font-black text-[#06113C]">Độ cay</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {spicyOptions.map((item) => (
                  <button
                    key={item}
                    onClick={() => setSelectedSpicyLevel(item)}
                    className={`rounded-full px-4 py-2 text-sm font-black ${
                      selectedSpicyLevel === item
                        ? "bg-[#00B14F] text-white"
                        : "bg-[#F5FFF8] text-[#06113C]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={itemNote}
              onChange={(e) => setItemNote(e.target.value)}
              placeholder="Ghi chú cho món này"
              rows={3}
              className="mt-5 w-full rounded-2xl border border-black/10 px-4 py-4 font-bold"
            />

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedProduct(null)}
                className="rounded-2xl bg-neutral-100 px-5 py-4 text-sm font-black text-[#06113C]"
              >
                Hủy
              </button>

              <button
                onClick={addSelectedProductToCart}
                className="rounded-2xl bg-[#00B14F] px-5 py-4 text-sm font-black text-white"
              >
                Thêm · {selectedItemTotal.toLocaleString("vi-VN")}đ
              </button>
            </div>
          </div>
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end bg-black/50 md:items-center md:justify-center">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[32px] bg-white p-5 md:max-w-2xl md:rounded-[32px]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-[#00B14F]">Giỏ hàng</p>
                <h2 className="text-3xl font-black text-[#06113C]">
                  Xác nhận đơn
                </h2>
              </div>

              <button
                onClick={() => setCartOpen(false)}
                className="rounded-2xl bg-neutral-100 px-4 py-3 font-black text-[#06113C]"
              >
                Đóng
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {cart.map((item) => (
                <div
                  key={item.cartKey}
                  className="flex gap-3 rounded-3xl bg-[#F5FFF8] p-3"
                >
                  <div className="h-20 w-20 overflow-hidden rounded-2xl bg-white">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="font-black text-[#06113C]">{item.name}</p>

                    {item.selectedToppings.length > 0 && (
                      <p className="mt-1 text-xs font-semibold text-neutral-500">
                        Topping:{" "}
                        {item.selectedToppings
                          .map((top) => top.name)
                          .join(", ")}
                      </p>
                    )}

                    <p className="mt-1 text-xs font-semibold text-neutral-500">
                      {item.spicyLevel}
                      {item.itemNote ? ` · ${item.itemNote}` : ""}
                    </p>

                    <p className="mt-2 font-black text-[#00B14F]">
                      {(item.itemTotal * item.quantity).toLocaleString("vi-VN")}
                      đ
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => changeQuantity(item.cartKey, -1)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white font-black"
                    >
                      -
                    </button>

                    <span className="font-black">{item.quantity}</span>

                    <button
                      onClick={() => changeQuantity(item.cartKey, 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00B14F] font-black text-white"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3">
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Tên khách"
                className="rounded-2xl border border-black/10 px-4 py-4 font-bold"
              />

              <input
                type="tel"
                inputMode="numeric"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Số điện thoại"
                className="rounded-2xl border border-black/10 px-4 py-4 font-bold"
              />

              <textarea
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Địa chỉ giao hàng"
                rows={2}
                className="rounded-2xl border border-black/10 px-4 py-4 font-bold"
              />

              <div className="grid grid-cols-2 gap-3">
                <select
                  value={deliveryDistanceKm}
                  onChange={(e) => setDeliveryDistanceKm(Number(e.target.value))}
                  className="rounded-2xl border border-black/10 px-4 py-4 font-bold"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((km) => (
                    <option key={km} value={km}>
                      {km}km
                    </option>
                  ))}
                </select>

                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="rounded-2xl border border-black/10 px-4 py-4 font-bold"
                >
                  <option value="cod">COD</option>
                  <option value="momo">Chuyển khoản</option>
                </select>
              </div>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú đơn hàng"
                rows={3}
                className="rounded-2xl border border-black/10 px-4 py-4 font-bold"
              />
            </div>

            <div className="sticky bottom-0 -mx-5 mt-5 border-t border-black/5 bg-white p-5">
              <div className="mb-4 space-y-1 text-sm font-bold text-neutral-600">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span>{subtotal.toLocaleString("vi-VN")}đ</span>
                </div>

                <div className="flex justify-between">
                  <span>Phí ship</span>
                  <span>{shippingFee.toLocaleString("vi-VN")}đ</span>
                </div>

                <div className="flex justify-between text-lg font-black text-[#06113C]">
                  <span>Tổng cộng</span>
                  <span>{total.toLocaleString("vi-VN")}đ</span>
                </div>
              </div>

              <button
                onClick={submitOrder}
                disabled={submitting || cart.length === 0}
                className="w-full rounded-2xl bg-[#00B14F] px-6 py-4 text-sm font-black text-white disabled:opacity-50"
              >
                {submitting
                  ? "Đang gửi đơn..."
                  : `Đặt hàng · ${total.toLocaleString("vi-VN")}đ`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}