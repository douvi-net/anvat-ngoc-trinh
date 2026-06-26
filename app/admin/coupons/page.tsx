"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  price: number;
  is_active?: boolean | null;
  is_sold_out?: boolean | null;
};

type Coupon = {
  id: string;
  code: string;
  name: string;
  discount_type: string;
  discount_value: number;
  min_order_value: number;
  usage_limit: number;
  used_count: number;
  is_active: boolean;
  gift_product_id?: string | null;
  gift_product_name?: string | null;
  gift_quantity?: number | null;
};

const emptyForm = {
  code: "",
  name: "",
  discount_type: "fixed",
  discount_value: 10000,
  min_order_value: 0,
  usage_limit: 0,
  gift_product_id: "",
  gift_product_name: "",
  gift_quantity: 1,
};

function money(value: number) {
  return Number(value || 0).toLocaleString("vi-VN") + "đ";
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const isGift = form.discount_type === "gift";

  useEffect(() => {
    fetchCoupons();
    fetchProducts();
  }, []);

  async function fetchCoupons() {
    setLoading(true);

    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setCoupons((data || []) as Coupon[]);
    }

    setLoading(false);
  }

  async function fetchProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("id,name,price,is_active,is_sold_out")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (!error) {
      setProducts((data || []) as Product[]);
    }
  }

  function startEdit(coupon: Coupon) {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code || "",
      name: coupon.name || "",
      discount_type: coupon.discount_type || "fixed",
      discount_value: Number(coupon.discount_value || 0),
      min_order_value: Number(coupon.min_order_value || 0),
      usage_limit: Number(coupon.usage_limit || 0),
      gift_product_id: coupon.gift_product_id || "",
      gift_product_name: coupon.gift_product_name || "",
      gift_quantity: Number(coupon.gift_quantity || 1),
    });
  }

  function selectGiftProduct(productId: string) {
    const product = products.find((item) => item.id === productId);

    setForm((prev) => ({
      ...prev,
      gift_product_id: product?.id || "",
      gift_product_name: product?.name || "",
    }));
  }

  async function saveCoupon() {
    if (!form.code.trim() || !form.name.trim()) {
      alert("Nhập mã và tên khuyến mãi.");
      return;
    }

    if (isGift && !form.gift_product_id) {
      alert("Chọn món tặng.");
      return;
    }

    if (Number(form.min_order_value || 0) <= 0) {
      alert("Nhập đơn tối thiểu.");
      return;
    }

    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      discount_type: form.discount_type,
      discount_value: isGift ? 0 : Number(form.discount_value || 0),
      min_order_value: Number(form.min_order_value || 0),
      usage_limit: Number(form.usage_limit || 0),
      gift_product_id: isGift ? form.gift_product_id : null,
      gift_product_name: isGift ? form.gift_product_name : null,
      gift_quantity: isGift ? Number(form.gift_quantity || 1) : 1,
    };

    if (editingCoupon) {
      const { error } = await supabase
        .from("coupons")
        .update(payload)
        .eq("id", editingCoupon.id);

      if (error) {
        alert("Sửa khuyến mãi thất bại.");
        return;
      }
    } else {
      const { error } = await supabase.from("coupons").insert({
        ...payload,
        used_count: 0,
        is_active: true,
      });

      if (error) {
        alert("Thêm khuyến mãi thất bại. Có thể mã bị trùng.");
        return;
      }
    }

    setEditingCoupon(null);
    setForm(emptyForm);
    fetchCoupons();
  }

  async function toggleCoupon(coupon: Coupon) {
    await supabase
      .from("coupons")
      .update({ is_active: !coupon.is_active })
      .eq("id", coupon.id);

    fetchCoupons();
  }

  async function deleteCoupon(coupon: Coupon) {
    const ok = confirm(`Xóa khuyến mãi ${coupon.code}?`);
    if (!ok) return;

    await supabase.from("coupons").delete().eq("id", coupon.id);
    fetchCoupons();
  }

  function couponTypeText(coupon: Coupon) {
    if (coupon.discount_type === "gift") return "🎁 Tặng món";
    if (coupon.discount_type === "percent") return "Giảm theo %";
    return "Giảm tiền cố định";
  }

  function couponValueText(coupon: Coupon) {
    if (coupon.discount_type === "gift") {
      return `Tặng: ${coupon.gift_product_name || "Chưa chọn món"} x${
        coupon.gift_quantity || 1
      }`;
    }

    if (coupon.discount_type === "percent") {
      return `Giảm: ${coupon.discount_value}%`;
    }

    return `Giảm: ${money(coupon.discount_value)}`;
  }

  return (
    <AdminLayout>
      <div>
        <p className="font-black text-[#00B14F]">Admin/POS</p>
        <h1 className="mt-1 text-4xl font-black text-[#06113C]">
          Khuyến mãi
        </h1>
        <p className="mt-2 text-sm font-semibold text-neutral-500">
          Tạo mã giảm giá, giảm phần trăm hoặc tặng món cho đơn hàng website.
        </p>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="h-fit rounded-[32px] bg-white p-5 shadow-xl shadow-neutral-950/5">
          <p className="font-black text-[#00B14F]">
            {editingCoupon ? "Sửa khuyến mãi" : "Thêm khuyến mãi"}
          </p>

          <div className="mt-5 space-y-4">
            <input
              value={form.code}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  code: e.target.value.toUpperCase(),
                }))
              }
              placeholder="Mã: AVNT10 hoặc GIFT200"
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none"
            />

            <input
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Tên chương trình"
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none"
            />

            <select
              value={form.discount_type}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  discount_type: e.target.value,
                  discount_value: e.target.value === "gift" ? 0 : prev.discount_value,
                }))
              }
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none"
            >
              <option value="fixed">Giảm tiền cố định</option>
              <option value="percent">Giảm theo %</option>
              <option value="gift">🎁 Tặng món</option>
            </select>

            {!isGift && (
              <input
                type="number"
                value={form.discount_value}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    discount_value: Number(e.target.value),
                  }))
                }
                placeholder={
                  form.discount_type === "percent"
                    ? "Phần trăm giảm, ví dụ: 10"
                    : "Giá trị giảm, ví dụ: 5000"
                }
                className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none"
              />
            )}

            {isGift && (
              <div className="rounded-3xl bg-[#F5FFF8] p-4">
                <p className="font-black text-[#06113C]">Món tặng</p>

                <select
                  value={form.gift_product_id}
                  onChange={(e) => selectGiftProduct(e.target.value)}
                  className="mt-3 w-full rounded-2xl border border-black/10 bg-white px-4 py-4 font-bold outline-none"
                >
                  <option value="">Chọn sản phẩm tặng</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {money(product.price)}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min={1}
                  value={form.gift_quantity}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      gift_quantity: Math.max(1, Number(e.target.value || 1)),
                    }))
                  }
                  placeholder="Số lượng tặng"
                  className="mt-3 w-full rounded-2xl border border-black/10 bg-white px-4 py-4 font-bold outline-none"
                />

                <p className="mt-2 text-xs font-bold text-neutral-500">
                  Món tặng sẽ được đưa vào đơn với giá 0đ nếu khách đủ điều kiện.
                </p>
              </div>
            )}

            <input
              type="number"
              value={form.min_order_value}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  min_order_value: Number(e.target.value),
                }))
              }
              placeholder="Đơn tối thiểu, ví dụ: 200000"
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none"
            />

            <input
              type="number"
              value={form.usage_limit}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  usage_limit: Number(e.target.value),
                }))
              }
              placeholder="Giới hạn lượt dùng, 0 là không giới hạn"
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none"
            />

            <button
              onClick={saveCoupon}
              className="w-full rounded-2xl bg-[#00B14F] px-5 py-4 font-black text-white"
            >
              {editingCoupon ? "Lưu sửa" : "Thêm khuyến mãi"}
            </button>

            {editingCoupon && (
              <button
                onClick={() => {
                  setEditingCoupon(null);
                  setForm(emptyForm);
                }}
                className="w-full rounded-2xl bg-neutral-100 px-5 py-4 font-black text-[#06113C]"
              >
                Huỷ sửa
              </button>
            )}
          </div>
        </div>

        <div className="rounded-[32px] bg-white p-5 shadow-xl shadow-neutral-950/5">
          <h2 className="text-2xl font-black text-[#06113C]">
            Danh sách khuyến mãi
          </h2>

          {loading ? (
            <p className="mt-6 font-black">Đang tải...</p>
          ) : (
            <div className="mt-6 space-y-4">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="grid gap-4 rounded-[28px] border border-black/5 p-4 md:grid-cols-[1fr_auto]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-black text-[#06113C]">
                        {coupon.discount_type === "gift" ? "🎁 " : "🎟️ "}
                        {coupon.code}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          coupon.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {coupon.is_active ? "Đang bật" : "Đang tắt"}
                      </span>
                    </div>

                    <p className="mt-2 font-bold text-neutral-600">
                      {coupon.name}
                    </p>

                    <p className="mt-2 text-sm font-black text-[#00B14F]">
                      {couponTypeText(coupon)}
                    </p>

                    <p className="mt-1 text-sm font-bold text-neutral-500">
                      {couponValueText(coupon)}
                    </p>

                    <p className="mt-1 text-sm font-bold text-neutral-500">
                      Đơn tối thiểu: {money(coupon.min_order_value)} · Đã dùng:{" "}
                      {coupon.used_count}
                      {coupon.usage_limit > 0 ? `/${coupon.usage_limit}` : ""}
                    </p>
                  </div>

                  <div className="flex gap-2 md:flex-col">
                    <button
                      onClick={() => startEdit(coupon)}
                      className="rounded-xl bg-[#06113C] px-4 py-3 text-xs font-black text-white"
                    >
                      Sửa
                    </button>

                    <button
                      onClick={() => toggleCoupon(coupon)}
                      className="rounded-xl bg-[#E8FFF1] px-4 py-3 text-xs font-black text-[#00B14F]"
                    >
                      {coupon.is_active ? "Tắt" : "Bật"}
                    </button>

                    <button
                      onClick={() => deleteCoupon(coupon)}
                      className="rounded-xl bg-red-50 px-4 py-3 text-xs font-black text-red-600"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}

              {coupons.length === 0 && (
                <p className="rounded-2xl bg-[#F5FFF8] p-4 font-bold text-neutral-500">
                  Chưa có khuyến mãi nào.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}