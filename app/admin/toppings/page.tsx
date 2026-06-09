"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";

type Topping = {
  id: string;
  name: string;
  price: number;
  category: string | null;
  is_active: boolean;
  sort_order: number;
};

type ToppingForm = {
  name: string;
  price: number;
  category: string;
  sort_order: number;
};

const TOPPING_CATEGORIES = [
  "Topping bánh tráng",
  "Topping nước",
  "Topping trà sữa",
  "Topping dùng chung",
];

const emptyForm: ToppingForm = {
  name: "",
  price: 0,
  category: "Topping bánh tráng",
  sort_order: 99,
};

export default function AdminToppingsPage() {
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [editingTopping, setEditingTopping] = useState<Topping | null>(null);
  const [form, setForm] = useState<ToppingForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchToppings();
  }, []);

  const groupedToppings = useMemo(() => {
    return TOPPING_CATEGORIES.map((category) => ({
      category,
      items: toppings.filter(
        (item) => (item.category || "Topping bánh tráng") === category
      ),
    }));
  }, [toppings]);

  async function fetchToppings() {
    setLoading(true);

    const { data, error } = await supabase
      .from("toppings")
      .select("id,name,price,category,is_active,sort_order")
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true });

    if (error) {
      alert("Không tải được topping.");
      console.error(error);
    } else {
      setToppings((data || []) as Topping[]);
    }

    setLoading(false);
  }

  function startCreate() {
    setEditingTopping(null);
    setForm(emptyForm);
  }

  function startEdit(topping: Topping) {
    setEditingTopping(topping);
    setForm({
      name: topping.name,
      price: Number(topping.price || 0),
      category: topping.category || "Topping bánh tráng",
      sort_order: Number(topping.sort_order || 99),
    });
  }

  async function saveTopping() {
    if (!form.name.trim()) {
      alert("Nhập tên topping trước nha.");
      return;
    }
    async function toggleTopping(topping: Topping) {
      const { error } = await supabase
        .from("toppings")
        .update({
          is_active: !topping.is_active,
        })
        .eq("id", topping.id);
    
      if (error) {
        alert("Không cập nhật được trạng thái topping.");
        console.error(error);
        return;
      }
    
      fetchToppings();
    }
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      price: Number(form.price || 0),
      category: form.category || "Topping bánh tráng",
      sort_order: Number(form.sort_order || 99),
    };

    if (editingTopping) {
      const { error } = await supabase
        .from("toppings")
        .update(payload)
        .eq("id", editingTopping.id);

      setSaving(false);

      if (error) {
        alert("Sửa topping thất bại.");
        console.error(error);
        return;
      }

      alert("Đã sửa topping.");
      setEditingTopping(null);
      setForm(emptyForm);
      fetchToppings();
      return;
    }

    const { error } = await supabase.from("toppings").insert({
      ...payload,
      is_active: true,
    });

    setSaving(false);

    if (error) {
      alert("Thêm topping thất bại.");
      console.error(error);
      return;
    }

    alert("Đã thêm topping.");
    setForm(emptyForm);
    fetchToppings();
  }

  async function toggleTopping(topping: Topping) {
    const { error } = await supabase
      .from("toppings")
      .update({
        is_active: !topping.is_active,
      })
      .eq("id", topping.id);

    if (error) {
      alert("Không đổi được trạng thái topping.");
      console.error(error);
      return;
    }

    fetchToppings();
  }

  async function deleteTopping(topping: Topping) {
    const ok = confirm(`Xóa topping "${topping.name}"?`);

    if (!ok) return;

    const { error } = await supabase
      .from("toppings")
      .delete()
      .eq("id", topping.id);

    if (error) {
      alert("Không xóa được topping. Nên ẩn nếu topping đã từng có trong đơn.");
      console.error(error);
      return;
    }

    fetchToppings();
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-black text-[#00B14F]">Admin/POS</p>

          <h1 className="mt-1 text-4xl font-black text-[#06113C]">
            Quản lý topping
          </h1>

          <p className="mt-2 text-sm font-semibold text-neutral-500">
            Tạo topping theo nhóm: bánh tráng, nước, trà sữa hoặc dùng chung.
            Website khách sẽ tự lọc topping theo từng sản phẩm.
          </p>
        </div>

        <button
          onClick={startCreate}
          className="rounded-2xl bg-[#00B14F] px-5 py-4 text-sm font-black text-white shadow-lg shadow-[#00B14F]/25"
        >
          + Thêm topping
        </button>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="h-fit rounded-[32px] bg-white p-5 shadow-xl shadow-neutral-950/5 xl:sticky xl:top-8">
          <p className="font-black text-[#00B14F]">
            {editingTopping ? "Sửa topping" : "Thêm topping"}
          </p>

          <h2 className="mt-2 text-2xl font-black text-[#06113C]">
            Thông tin topping
          </h2>

          <div className="mt-6 space-y-4">
            <input
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="Tên topping"
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
            />

            <input
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  price: Number(e.target.value),
                }))
              }
              placeholder="Giá topping"
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
            />

            <select
              value={form.category}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  category: e.target.value,
                }))
              }
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
            >
              {TOPPING_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={form.sort_order}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  sort_order: Number(e.target.value),
                }))
              }
              placeholder="Thứ tự hiển thị"
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={saveTopping}
              disabled={saving}
              className="rounded-2xl bg-[#00B14F] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
            >
              {saving
                ? "Đang lưu..."
                : editingTopping
                ? "Lưu sửa"
                : "Thêm topping"}
            </button>

            <button
              onClick={startCreate}
              className="rounded-2xl bg-neutral-100 px-5 py-4 text-sm font-black text-[#06113C]"
            >
              Làm mới
            </button>
          </div>

          {editingTopping && (
            <div className="mt-4 rounded-[24px] bg-[#F5FFF8] p-4 text-sm font-bold text-neutral-500">
              Đang sửa:{" "}
              <span className="font-black text-[#06113C]">
                {editingTopping.name}
              </span>
            </div>
          )}

          <div className="mt-6 rounded-[28px] bg-[#06113C] p-5 text-white">
            <p className="font-black text-[#00B14F]">Gợi ý phân nhóm</p>

            <div className="mt-3 space-y-2 text-sm font-medium leading-7 text-white/75">
              <p>
                <b className="text-white">Topping bánh tráng:</b> Tóp mỡ, trứng
                cút, mỡ hành, sốt me thêm.
              </p>
              <p>
                <b className="text-white">Topping nước:</b> Nha đam, thạch dừa,
                hạt chia, upsize.
              </p>
              <p>
                <b className="text-white">Topping trà sữa:</b> Trân châu, pudding,
                kem cheese.
              </p>
              <p>
                <b className="text-white">Topping dùng chung:</b> Ít đá, nhiều đá,
                thêm đường.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] bg-white p-4 shadow-xl shadow-neutral-950/5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-[#06113C]">
                Danh sách topping
              </h2>

              <p className="mt-1 text-sm font-semibold text-neutral-500">
                Tổng: {toppings.length} topping
              </p>
            </div>

            <button
              onClick={fetchToppings}
              className="rounded-2xl bg-[#06113C] px-5 py-3 text-sm font-black text-white"
            >
              Làm mới
            </button>
          </div>

          {loading ? (
            <p className="mt-8 font-black text-[#06113C]">Đang tải...</p>
          ) : (
            <div className="mt-6 space-y-6">
              {groupedToppings.map((group) => (
                <div key={group.category}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-black text-[#06113C]">
                      {group.category}
                    </h3>

                    <span className="rounded-full bg-[#E8FFF1] px-3 py-1 text-xs font-black text-[#00B14F]">
                      {group.items.length} topping
                    </span>
                  </div>

                  {group.items.length === 0 ? (
                    <div className="rounded-[24px] bg-neutral-50 p-4 text-sm font-bold text-neutral-400">
                      Chưa có topping trong nhóm này.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {group.items.map((topping) => (
                        <div
                          key={topping.id}
                          className="grid gap-4 rounded-[28px] border border-black/5 p-4 md:grid-cols-[1fr_auto]"
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-black text-[#06113C]">
                                {topping.name}
                              </h3>

                              <span
                                className={`rounded-full px-3 py-1 text-[11px] font-black ${
                                  topping.is_active
                                    ? "bg-green-100 text-green-700"
                                    : "bg-neutral-100 text-neutral-500"
                                }`}
                              >
                                {topping.is_active ? "Đang bán" : "Đang ẩn"}
                              </span>
                            </div>

                            <p className="mt-2 text-xl font-black text-[#00B14F]">
                              +{Number(topping.price).toLocaleString("vi-VN")}đ
                            </p>

                            <p className="mt-1 text-xs font-bold text-neutral-400">
                              Thứ tự: {topping.sort_order}
                            </p>
                          </div>

                          <div className="flex flex-row gap-2 md:flex-col">
                            <button
                              onClick={() => startEdit(topping)}
                              className="rounded-xl bg-[#06113C] px-4 py-3 text-xs font-black text-white"
                            >
                              Sửa
                            </button>

                            <button
                              onClick={() => toggleTopping(topping)}
                              className="rounded-xl bg-[#E8FFF1] px-4 py-3 text-xs font-black text-[#00B14F]"
                            >
                              {topping.is_active ? "Ẩn" : "Hiện"}
                            </button>

                            <button
                              onClick={() => deleteTopping(topping)}
                              className="rounded-xl bg-red-50 px-4 py-3 text-xs font-black text-red-600"
                            >
                              Xóa
                            </button>
                            <button
  onClick={() => toggleTopping(topping)}
  className={`rounded-xl px-3 py-2 text-sm font-bold text-white ${
    topping.is_active
      ? "bg-green-500"
      : "bg-red-500"
  }`}
>
  {topping.is_active ? "🟢 Đang bán" : "🔴 Hết hàng"}
</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}