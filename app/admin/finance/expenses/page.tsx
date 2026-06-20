"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";

type Category = {
  id: string;
  name: string;
};

type Expense = {
  id: string;
  expense_date: string;
  item_name: string;
  quantity: number;
  unit: string | null;
  unit_price: number;
  amount: number;
  supplier: string | null;
  payment_method: string | null;
  spender: string | null;
  branch: string | null;
  note: string | null;
  expense_categories?: { name: string } | null;
};

type FormRow = {
  expense_date: string;
  category_id: string;
  item_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  supplier: string;
  payment_method: string;
  spender: string;
  branch: string;
  note: string;
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

const emptyRow = (date?: string): FormRow => ({
  expense_date: date || todayVN(),
  category_id: "",
  item_name: "",
  quantity: 1,
  unit: "",
  unit_price: 0,
  supplier: "",
  payment_method: "cash",
  spender: "Trung",
  branch: "Q6",
  note: "",
});

export default function ExpensesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [rows, setRows] = useState<FormRow[]>([emptyRow()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [selectedMonth]);

  async function fetchCategories() {
    const { data, error } = await supabase
      .from("expense_categories")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    setCategories((data || []) as Category[]);
  }

  async function fetchExpenses() {
    const start = `${selectedMonth}-01`;

    const endDate = new Date(`${selectedMonth}-01T00:00:00`);
    endDate.setMonth(endDate.getMonth() + 1);
    const end = endDate.toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("expenses")
      .select("*, expense_categories(name)")
      .gte("expense_date", start)
      .lt("expense_date", end)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setExpenses((data || []) as Expense[]);
  }

  function updateRow(index: number, key: keyof FormRow, value: string | number) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [key]: value } : row))
    );
  }

  function addRow() {
    const lastRow = rows[rows.length - 1];

    setRows((prev) => [
      ...prev,
      {
        ...emptyRow(lastRow?.expense_date || todayVN()),
        category_id: lastRow?.category_id || "",
        supplier: lastRow?.supplier || "",
        payment_method: lastRow?.payment_method || "cash",
        spender: lastRow?.spender || "Trung",
        branch: lastRow?.branch || "Q6",
      },
    ]);
  }

  function removeRow(index: number) {
    if (rows.length === 1) {
      setRows([emptyRow(rows[0].expense_date)]);
      return;
    }

    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveRows() {
    const validRows = rows.filter((row) => row.item_name.trim());

    if (validRows.length === 0) {
      alert("Nhập ít nhất 1 khoản chi.");
      return;
    }

    const invalidAmount = validRows.some(
      (row) => Number(row.quantity || 0) <= 0 || Number(row.unit_price || 0) <= 0
    );

    if (invalidAmount) {
      alert("Số lượng và đơn giá phải lớn hơn 0.");
      return;
    }

    setSaving(true);

    const payload = validRows.map((row) => ({
      expense_date: row.expense_date,
      category_id: row.category_id || null,
      item_name: row.item_name.trim(),
      quantity: Number(row.quantity || 1),
      unit: row.unit || null,
      unit_price: Number(row.unit_price || 0),
      amount: Math.round(Number(row.quantity || 1) * Number(row.unit_price || 0)),
      supplier: row.supplier || null,
      payment_method: row.payment_method,
      spender: row.spender,
      branch: row.branch,
      note: row.note || null,
    }));

    const { error } = await supabase.from("expenses").insert(payload);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    const monthOfFirstRow = validRows[0].expense_date.slice(0, 7);
    const lastRow = validRows[validRows.length - 1];

    setSelectedMonth(monthOfFirstRow);
    setRows([
      {
        ...emptyRow(lastRow.expense_date),
        category_id: lastRow.category_id,
        supplier: lastRow.supplier,
        payment_method: lastRow.payment_method,
        spender: lastRow.spender,
        branch: lastRow.branch,
      },
    ]);

    setTimeout(() => {
      fetchExpenses();
    }, 100);
  }

  async function deleteExpense(id: string) {
    if (!confirm("Xóa khoản chi này?")) return;

    const { error } = await supabase.from("expenses").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    fetchExpenses();
  }

  const total = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-black text-[#00B14F]">TÀI CHÍNH</p>
          <h1 className="text-3xl font-black text-[#06113C]">Nhập tiền chi</h1>
          <p className="mt-1 text-sm font-bold text-neutral-500">
            Nhập bất cứ lúc nào, chỉ cần chọn đúng ngày chi. Danh sách bên dưới hiển thị theo tháng.
          </p>
        </div>

        <section className="rounded-3xl bg-white p-5 shadow-xl shadow-neutral-950/5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-black text-[#06113C]">
              Nhập nhanh nhiều dòng
            </h2>

            <button
              onClick={addRow}
              className="rounded-2xl bg-[#06113C] px-5 py-3 text-sm font-black text-white"
            >
              + Thêm dòng
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {rows.map((row, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-2xl border border-neutral-100 bg-[#F9FFFB] p-4 md:grid-cols-12"
              >
                <input
                  type="date"
                  value={row.expense_date}
                  onChange={(e) => updateRow(index, "expense_date", e.target.value)}
                  className="rounded-xl border px-3 py-2 font-bold md:col-span-2"
                />

                <select
                  value={row.category_id}
                  onChange={(e) => updateRow(index, "category_id", e.target.value)}
                  className="rounded-xl border px-3 py-2 font-bold md:col-span-2"
                >
                  <option value="">Nhóm chi</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                <input
                  value={row.item_name}
                  onChange={(e) => updateRow(index, "item_name", e.target.value)}
                  placeholder="Tên mặt hàng"
                  className="rounded-xl border px-3 py-2 font-bold md:col-span-3"
                />

                <input
                  type="number"
                  value={row.quantity}
                  onChange={(e) => updateRow(index, "quantity", Number(e.target.value))}
                  placeholder="SL"
                  className="rounded-xl border px-3 py-2 font-bold md:col-span-1"
                />

                <input
                  value={row.unit}
                  onChange={(e) => updateRow(index, "unit", e.target.value)}
                  placeholder="Đơn vị"
                  className="rounded-xl border px-3 py-2 font-bold md:col-span-1"
                />

                <input
                  type="number"
                  value={row.unit_price}
                  onChange={(e) =>
                    updateRow(index, "unit_price", Number(e.target.value))
                  }
                  placeholder="Đơn giá"
                  className="rounded-xl border px-3 py-2 font-bold md:col-span-2"
                />

                <button
                  onClick={() => removeRow(index)}
                  className="rounded-xl bg-red-50 px-3 py-2 font-black text-red-600 md:col-span-1"
                >
                  Xóa
                </button>

                <input
                  value={row.supplier}
                  onChange={(e) => updateRow(index, "supplier", e.target.value)}
                  placeholder="Nhà cung cấp / chợ"
                  className="rounded-xl border px-3 py-2 font-bold md:col-span-3"
                />

                <select
                  value={row.payment_method}
                  onChange={(e) =>
                    updateRow(index, "payment_method", e.target.value)
                  }
                  className="rounded-xl border px-3 py-2 font-bold md:col-span-2"
                >
                  <option value="cash">Tiền mặt</option>
                  <option value="bank">Chuyển khoản</option>
                  <option value="momo">Momo</option>
                  <option value="other">Khác</option>
                </select>

                <select
                  value={row.spender}
                  onChange={(e) => updateRow(index, "spender", e.target.value)}
                  className="rounded-xl border px-3 py-2 font-bold md:col-span-2"
                >
                  <option value="Trung">Trung</option>
                  <option value="Ngọc Trinh">Ngọc Trinh</option>
                  <option value="Nhân viên">Nhân viên</option>
                </select>

                <select
                  value={row.branch}
                  onChange={(e) => updateRow(index, "branch", e.target.value)}
                  className="rounded-xl border px-3 py-2 font-bold md:col-span-2"
                >
                  <option value="Q6">Q6</option>
                  <option value="Q1">Q1</option>
                </select>

                <input
                  value={row.note}
                  onChange={(e) => updateRow(index, "note", e.target.value)}
                  placeholder="Ghi chú"
                  className="rounded-xl border px-3 py-2 font-bold md:col-span-4"
                />

                <div className="rounded-xl bg-white px-3 py-2 text-right font-black md:col-span-2">
                  {money(Number(row.quantity || 0) * Number(row.unit_price || 0))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={saveRows}
            disabled={saving}
            className="mt-4 rounded-2xl bg-[#00B14F] px-6 py-3 font-black text-white disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : "Lưu tất cả"}
          </button>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-xl shadow-neutral-950/5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-black text-[#06113C]">
                Danh sách chi theo tháng
              </h2>
              <p className="mt-1 font-black text-red-500">
                Tổng chi: {money(total)}
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
            <table className="w-full min-w-[1080px] text-sm">
              <thead>
                <tr className="bg-[#F5FFF8] text-left">
                  <th className="p-3">Ngày</th>
                  <th className="p-3">Nhóm</th>
                  <th className="p-3">Mặt hàng</th>
                  <th className="p-3">SL</th>
                  <th className="p-3">Đơn giá</th>
                  <th className="p-3">Nhà cung cấp</th>
                  <th className="p-3">Người chi</th>
                  <th className="p-3">Chi nhánh</th>
                  <th className="p-3">Thanh toán</th>
                  <th className="p-3 text-right">Thành tiền</th>
                  <th className="p-3"></th>
                </tr>
              </thead>

              <tbody>
                {expenses.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-3 font-bold">{item.expense_date}</td>
                    <td className="p-3">{item.expense_categories?.name || "-"}</td>
                    <td className="p-3 font-black">{item.item_name}</td>
                    <td className="p-3">
                      {item.quantity} {item.unit || ""}
                    </td>
                    <td className="p-3">{money(item.unit_price)}</td>
                    <td className="p-3">{item.supplier || "-"}</td>
                    <td className="p-3">{item.spender || "-"}</td>
                    <td className="p-3">{item.branch || "-"}</td>
                    <td className="p-3">{item.payment_method || "-"}</td>
                    <td className="p-3 text-right font-black">
                      {money(item.amount)}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => deleteExpense(item.id)}
                        className="rounded-xl bg-red-50 px-3 py-2 font-black text-red-600"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}

                {expenses.length === 0 && (
                  <tr>
                    <td
                      colSpan={11}
                      className="p-6 text-center font-bold text-neutral-400"
                    >
                      Chưa có khoản chi nào trong tháng này.
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