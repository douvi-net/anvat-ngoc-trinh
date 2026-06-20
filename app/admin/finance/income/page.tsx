"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";

type CashEntry = {
  id: string;
  entry_date: string;
  source: string;
  amount: number;
  payment_method: string | null;
  note: string | null;
};

function todayVN() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function money(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value || 0) + " đ";
}

export default function IncomePage() {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [form, setForm] = useState({
    entry_date: todayVN(),
    source: "Bán ngoài",
    amount: 0,
    payment_method: "cash",
    note: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, [selectedMonth]);

  async function fetchEntries() {
    const start = `${selectedMonth}-01`;

    const endDate = new Date(`${selectedMonth}-01T00:00:00`);
    endDate.setMonth(endDate.getMonth() + 1);
    const end = endDate.toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("cash_entries")
      .select("*")
      .gte("entry_date", start)
      .lt("entry_date", end)
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setEntries((data || []) as CashEntry[]);
  }

  async function saveEntry() {
    if (!form.amount || Number(form.amount) <= 0) {
      alert("Nhập số tiền thu.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("cash_entries").insert({
      entry_date: form.entry_date,
      source: form.source,
      amount: Number(form.amount),
      payment_method: form.payment_method,
      note: form.note || null,
    });

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    const monthOfEntry = form.entry_date.slice(0, 7);
    setSelectedMonth(monthOfEntry);

    setForm({
      entry_date: form.entry_date,
      source: "Bán ngoài",
      amount: 0,
      payment_method: "cash",
      note: "",
    });

    setTimeout(() => {
      fetchEntries();
    }, 100);
  }

  async function deleteEntry(id: string) {
    if (!confirm("Xóa khoản thu này?")) return;

    const { error } = await supabase.from("cash_entries").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchEntries();
  }

  const total = entries.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-black text-[#00B14F]">TÀI CHÍNH</p>
          <h1 className="text-3xl font-black text-[#06113C]">Tiền thu ngoài</h1>
          <p className="mt-1 text-sm font-bold text-neutral-500">
            Dùng để nhập Grab, Be, Shopee, bán ngoài, Momo/CK nếu chưa có đơn chi tiết.
          </p>
        </div>

        <section className="rounded-3xl bg-white p-5 shadow-xl shadow-neutral-950/5">
          <h2 className="text-xl font-black text-[#06113C]">Nhập khoản thu</h2>

          <div className="mt-4 grid gap-3 md:grid-cols-12">
            <input
              type="date"
              value={form.entry_date}
              onChange={(e) => setForm({ ...form, entry_date: e.target.value })}
              className="rounded-xl border px-3 py-3 font-bold md:col-span-2"
            />

            <select
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="rounded-xl border px-3 py-3 font-bold md:col-span-2"
            >
              <option>Bán ngoài</option>
              <option>POS tại quầy</option>
              <option>Grab</option>
              <option>Be</option>
              <option>Shopee</option>
              <option>MOMO/CK</option>
              <option>Khác</option>
            </select>

            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              placeholder="Số tiền"
              className="rounded-xl border px-3 py-3 font-bold md:col-span-2"
            />

            <select
              value={form.payment_method}
              onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
              className="rounded-xl border px-3 py-3 font-bold md:col-span-2"
            >
              <option value="cash">Tiền mặt</option>
              <option value="bank">Chuyển khoản</option>
              <option value="momo">Momo</option>
              <option value="app">App</option>
              <option value="other">Khác</option>
            </select>

            <input
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Ghi chú"
              className="rounded-xl border px-3 py-3 font-bold md:col-span-3"
            />

            <button
              onClick={saveEntry}
              disabled={saving}
              className="rounded-xl bg-[#00B14F] px-4 py-3 font-black text-white disabled:opacity-50 md:col-span-1"
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-xl shadow-neutral-950/5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-black text-[#06113C]">
                Danh sách tiền thu ngoài theo tháng
              </h2>
              <p className="mt-1 font-black text-[#00B14F]">
                Tổng thu ngoài: {money(total)}
              </p>
            </div>

            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-2xl border px-4 py-3 font-black"
            />
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="bg-[#F5FFF8] text-left">
                  <th className="p-3">Ngày</th>
                  <th className="p-3">Nguồn</th>
                  <th className="p-3">Thanh toán</th>
                  <th className="p-3">Ghi chú</th>
                  <th className="p-3 text-right">Số tiền</th>
                  <th className="p-3"></th>
                </tr>
              </thead>

              <tbody>
                {entries.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-3 font-bold">{item.entry_date}</td>
                    <td className="p-3 font-black">{item.source}</td>
                    <td className="p-3">{item.payment_method || "-"}</td>
                    <td className="p-3">{item.note || "-"}</td>
                    <td className="p-3 text-right font-black">{money(item.amount)}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => deleteEntry(item.id)}
                        className="rounded-xl bg-red-50 px-3 py-2 font-black text-red-600"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}

                {entries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center font-bold text-neutral-400">
                      Chưa có khoản thu ngoài nào trong tháng này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}