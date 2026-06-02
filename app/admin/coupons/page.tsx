"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";

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
};

const emptyForm = {
  code: "",
  name: "",
  discount_type: "fixed",
  discount_value: 10000,
  min_order_value: 0,
  usage_limit: 0,
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoupons();
  }, []);

  async function fetchCoupons() {
    setLoading(true);

    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setCoupons(data || []);
    }

    setLoading(false);
  }

  function startEdit(coupon: Coupon) {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      name: coupon.name,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_value: coupon.min_order_value,
      usage_limit: coupon.usage_limit,
    });
  }

  async function saveCoupon() {
    if (!form.code.trim() || !form.name.trim()) {
      alert("Nhập mã và tên khuyến mãi.");
      return;
    }

    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_order_value: Number(form.min_order_value),
      usage_limit: Number(form.usage_limit),
    };

    if (editingCoupon) {
      const { error } = await supabase
        .from("coupons")
        .update(payload)
        .eq("id", editingCoupon.id);

      if (error) {
        alert("Sửa mã thất bại.");
        return;
      }
    } else {
      const { error } = await supabase.from("coupons").insert({
        ...payload,
        used_count: 0,
        is_active: true,
      });

      if (error) {
        alert("Thêm mã thất bại. Có thể mã bị trùng.");
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
    const ok = confirm(`Xóa mã ${coupon.code}?`);
    if (!ok) return;

    await supabase.from("coupons").delete().eq("id", coupon.id);
    fetchCoupons();
  }

  return (
    <AdminLayout>
      <div>
        <p className="font-black text-[#00B14F]">Admin/POS</p>
        <h1 className="mt-1 text-4xl font-black text-[#06113C]">
          Mã giảm giá
        </h1>
        <p className="mt-2 text-sm font-semibold text-neutral-500">
          Tạo mã giảm giá để tăng đơn hàng từ website.
        </p>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="h-fit rounded-[32px] bg-white p-5 shadow-xl shadow-neutral-950/5">
          <p className="font-black text-[#00B14F]">
            {editingCoupon ? "Sửa mã" : "Thêm mã"}
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
              placeholder="Mã: AVNT10"
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
                }))
              }
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none"
            >
              <option value="fixed">Giảm tiền cố định</option>
              <option value="percent">Giảm theo %</option>
            </select>

            <input
              type="number"
              value={form.discount_value}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  discount_value: Number(e.target.value),
                }))
              }
              placeholder="Giá trị giảm"
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none"
            />

            <input
              type="number"
              value={form.min_order_value}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  min_order_value: Number(e.target.value),
                }))
              }
              placeholder="Đơn tối thiểu"
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
              {editingCoupon ? "Lưu sửa" : "Thêm mã"}
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
            Danh sách mã
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

                    <p className="mt-2 text-sm font-bold text-neutral-500">
                      Giảm:{" "}
                      {coupon.discount_type === "percent"
                        ? `${coupon.discount_value}%`
                        : `${coupon.discount_value.toLocaleString("vi-VN")}đ`}
                    </p>

                    <p className="mt-1 text-sm font-bold text-neutral-500">
                      Đơn tối thiểu:{" "}
                      {coupon.min_order_value.toLocaleString("vi-VN")}đ · Đã
                      dùng: {coupon.used_count}
                      {coupon.usage_limit > 0
                        ? `/${coupon.usage_limit}`
                        : ""}
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
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}