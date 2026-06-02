"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";

type Topping = {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  sort_order: number;
};

const emptyForm = {
  name: "",
  price: 0,
  sort_order: 99,
};

export default function AdminToppingsPage() {
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [editingTopping, setEditingTopping] = useState<Topping | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchToppings();
  }, []);

  async function fetchToppings() {
    setLoading(true);

    const { data, error } = await supabase
      .from("toppings")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      alert("Không tải được topping.");
      console.error(error);
    } else {
      setToppings(data || []);
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
      price: topping.price,
      sort_order: topping.sort_order,
    });
  }

  async function saveTopping() {
    if (!form.name.trim()) {
      alert("Nhập tên topping trước nha.");
      return;
    }

    setSaving(true);

    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      sort_order: Number(form.sort_order),
    };

    if (editingTopping) {
      const { error } = await supabase
        .from("toppings")
        .update(payload)
        .eq("id", editingTopping.id);

      if (error) {
        alert("Sửa topping thất bại.");
        console.error(error);
      } else {
        alert("Đã sửa topping.");
        setEditingTopping(null);
        setForm(emptyForm);
        fetchToppings();
      }
    } else {
      const { error } = await supabase.from("toppings").insert({
        ...payload,
        is_active: true,
      });

      if (error) {
        alert("Thêm topping thất bại.");
        console.error(error);
      } else {
        alert("Đã thêm topping.");
        setForm(emptyForm);
        fetchToppings();
      }
    }

    setSaving(false);
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
            Thêm, sửa giá, ẩn/hiện topping. Website khách sẽ tự cập nhật.
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
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Tên topping"
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none"
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
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none"
            />

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
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none"
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={saveTopping}
              disabled={saving}
              className="rounded-2xl bg-[#00B14F] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : editingTopping ? "Lưu sửa" : "Thêm topping"}
            </button>

            <button
              onClick={() => {
                setEditingTopping(null);
                setForm(emptyForm);
              }}
              className="rounded-2xl bg-neutral-100 px-5 py-4 text-sm font-black text-[#06113C]"
            >
              Làm mới
            </button>
          </div>

          <div className="mt-6 rounded-[28px] bg-[#06113C] p-5 text-white">
            <p className="font-black text-[#00B14F]">Gợi ý topping</p>
            <p className="mt-3 text-sm font-medium leading-7 text-white/70">
              Tóp mỡ, trứng cút, mỡ hành, sốt me thêm, đậu phộng thêm, khô bò thêm.
            </p>
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
          </div>

          {loading ? (
            <p className="mt-8 font-black text-[#06113C]">Đang tải...</p>
          ) : (
            <div className="mt-6 space-y-4">
              {toppings.map((topping) => (
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
                      +{topping.price.toLocaleString("vi-VN")}đ
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