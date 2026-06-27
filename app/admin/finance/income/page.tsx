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

const INCOME_SOURCES = [
  "Website",
  "GrabFood",
  "ShopeeFood",
  "XanhNgon",
  "BeFood",
  "Bán ngoài",
  "Khác",
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Tiền mặt" },
  { value: "bank", label: "Chuyển khoản" },
  { value: "other", label: "Khác" },
];

function todayVN() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function money(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value || 0) + " đ";
}

function paymentText(value: string | null) {
  if (value === "cash") return "Tiền mặt";
  if (value === "bank") return "Chuyển khoản";
  if (value === "other") return "Khác";
  return value || "-";
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function IncomePage() {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    entry_date: todayVN(),
    source: "Website",
    amount: 0,
    payment_method: "cash",
    note: "",
  });

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

  function resetForm(date?: string) {
    setForm({
      entry_date: date || todayVN(),
      source: "Website",
      amount: 0,
      payment_method: "cash",
      note: "",
    });

    setEditingId(null);
  }

  async function saveEntry() {
    if (!form.amount || Number(form.amount) <= 0) {
      alert("Nhập số tiền thu.");
      return;
    }

    setSaving(true);

    const payload = {
      entry_date: form.entry_date,
      source: form.source,
      amount: Number(form.amount),
      payment_method: form.payment_method,
      note: form.note || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = editingId
      ? await supabase.from("cash_entries").update(payload).eq("id", editingId)
      : await supabase.from("cash_entries").insert(payload);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setSelectedMonth(form.entry_date.slice(0, 7));
    resetForm(form.entry_date);
    setTimeout(fetchEntries, 100);
  }

  function startEdit(item: CashEntry) {
    setEditingId(item.id);

    setForm({
      entry_date: item.entry_date,
      source: item.source || "Website",
      amount: Number(item.amount || 0),
      payment_method: item.payment_method || "cash",
      note: item.note || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteEntry(id: string) {
    if (!confirm("Xóa khoản thu này?")) return;

    const { error } = await supabase.from("cash_entries").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    if (editingId === id) resetForm();

    fetchEntries();
  }

  function exportExcel() {
    const rows = [
      ["BÁO CÁO TIỀN THU NHẬP TAY", selectedMonth],
      [],
      ["Ngày", "Nguồn thu", "Thanh toán", "Ghi chú", "Số tiền"],
      ...entries.map((item) => [
        item.entry_date,
        item.source,
        paymentText(item.payment_method),
        item.note || "",
        String(item.amount || 0),
      ]),
      [],
      ["Tổng thu nhập tay", "", "", "", String(total)],
    ];

    downloadCsv(`tien-thu-nhap-tay-${selectedMonth}.csv`, rows);
  }

  const total = entries.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-black text-[#00B14F]">TÀI CHÍNH</p>
          <h1 className="text-3xl font-black text-[#06113C]">
            Tiền thu ngoài
          </h1>
          <p className="mt-1 text-sm font-bold text-neutral-500">
            Nhập tay doanh thu thật để đối soát: Website, GrabFood, ShopeeFood,
            XanhNgon, BeFood, bán ngoài.
          </p>
        </div>

        <section
          className={`rounded-3xl bg-white p-5 shadow-xl shadow-neutral-950/5 ${
            editingId ? "border-2 border-[#00B14F]" : ""
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black text-[#06113C]">
              {editingId ? "Đang sửa khoản thu" : "Nhập khoản thu"}
            </h2>

            {editingId && (
              <button
                onClick={() => resetForm(form.entry_date)}
                className="rounded-2xl bg-neutral-100 px-5 py-3 text-sm font-black text-neutral-700"
              >
                Hủy sửa
              </button>
            )}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-12">
            <input
              type="date"
              value={form.entry_date}
              onChange={(e) =>
                setForm({ ...form, entry_date: e.target.value })
              }
              className="rounded-xl border px-3 py-3 font-bold md:col-span-2"
            />

            <select
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="rounded-xl border px-3 py-3 font-bold md:col-span-2"
            >
              {INCOME_SOURCES.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={form.amount}
              onChange={(e) =>
                setForm({ ...form, amount: Number(e.target.value) })
              }
              placeholder="Số tiền"
              className="rounded-xl border px-3 py-3 font-bold md:col-span-2"
            />

            <select
              value={form.payment_method}
              onChange={(e) =>
                setForm({ ...form, payment_method: e.target.value })
              }
              className="rounded-xl border px-3 py-3 font-bold md:col-span-2"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
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
              {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Lưu"}
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
                Tổng thu nhập tay: {money(total)}
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-2xl border px-4 py-3 font-black"
              />

              <button
                onClick={exportExcel}
                className="rounded-2xl bg-[#06113C] px-5 py-3 font-black text-white"
              >
                Xuất Excel
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="bg-[#F5FFF8] text-left">
                  <th className="p-3">Ngày</th>
                  <th className="p-3">Nguồn thu</th>
                  <th className="p-3">Thanh toán</th>
                  <th className="p-3">Ghi chú</th>
                  <th className="p-3 text-right">Số tiền</th>
                  <th className="p-3"></th>
                </tr>
              </thead>

              <tbody>
                {entries.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b ${
                      editingId === item.id ? "bg-[#E8FFF1]" : ""
                    }`}
                  >
                    <td className="p-3 font-bold">{item.entry_date}</td>
                    <td className="p-3 font-black">{item.source}</td>
                    <td className="p-3">{paymentText(item.payment_method)}</td>
                    <td className="p-3">{item.note || "-"}</td>
                    <td className="p-3 text-right font-black">
                      {money(item.amount)}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => startEdit(item)}
                          className="rounded-xl bg-[#E8FFF1] px-3 py-2 font-black text-[#00B14F]"
                        >
                          Sửa
                        </button>

                        <button
                          onClick={() => deleteEntry(item.id)}
                          className="rounded-xl bg-red-50 px-3 py-2 font-black text-red-600"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {entries.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-6 text-center font-bold text-neutral-400"
                    >
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