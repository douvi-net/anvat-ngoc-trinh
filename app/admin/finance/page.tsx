"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";

type Expense = {
  id: string;
  expense_date: string;
  item_name: string;
  amount: number;
  payment_method: string | null;
  expense_categories?: { name: string } | { name: string }[] | null;
};

type CashEntry = {
  id: string;
  entry_date: string;
  source: string;
  amount: number;
  payment_method: string | null;
  note: string | null;
};

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function money(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value || 0) + " đ";
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
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

function paymentText(value: string | null) {
  if (value === "cash") return "Tiền mặt";
  if (value === "bank") return "Chuyển khoản";
  if (value === "momo") return "Chuyển khoản";
  return value || "-";
}

function categoryName(expense: Expense) {
  const category = expense.expense_categories;

  if (Array.isArray(category)) {
    return category[0]?.name || "Chi khác";
  }

  return category?.name || "Chi khác";
}

export default function FinancePage() {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cashEntries, setCashEntries] = useState<CashEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  async function fetchData() {
    setLoading(true);

    const startDate = `${selectedMonth}-01`;

    const endDate = new Date(`${selectedMonth}-01T00:00:00`);
    endDate.setMonth(endDate.getMonth() + 1);
    const endDateText = endDate.toISOString().slice(0, 10);

    const [expensesRes, cashRes] = await Promise.all([
      supabase
        .from("expenses")
        .select("*, expense_categories(name)")
        .gte("expense_date", startDate)
        .lt("expense_date", endDateText)
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false }),

      supabase
        .from("cash_entries")
        .select("*")
        .gte("entry_date", startDate)
        .lt("entry_date", endDateText)
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);

    if (expensesRes.error) alert(expensesRes.error.message);
    if (cashRes.error) alert(cashRes.error.message);

    setExpenses((expensesRes.data || []) as Expense[]);
    setCashEntries((cashRes.data || []) as CashEntry[]);
    setLoading(false);
  }

  const report = useMemo(() => {
    const manualIncome = cashEntries.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const expenseTotal = expenses.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    return {
      manualIncome,
      expenseTotal,
      profit: manualIncome - expenseTotal,
      incomeCount: cashEntries.length,
      expenseCount: expenses.length,
    };
  }, [expenses, cashEntries]);

  function exportFinanceReport() {
    const rows = [
      ["BÁO CÁO THU CHI NHẬP TAY", selectedMonth],
      [],
      ["Tổng thu nhập tay", String(report.manualIncome)],
      ["Tổng chi", String(report.expenseTotal)],
      ["Lãi tạm tính", String(report.profit)],
      ["Số khoản thu", String(report.incomeCount)],
      ["Số khoản chi", String(report.expenseCount)],
      [],
      ["GHI CHÚ"],
      [
        "Báo cáo này chỉ dùng dữ liệu nhập tay. Đơn website/POS nằm ở mục Doanh thu đơn và không cộng vào báo cáo này.",
      ],
      [],
      ["DANH SÁCH THU NHẬP TAY"],
      ["Ngày", "Nguồn", "Thanh toán", "Ghi chú", "Số tiền"],
      ...cashEntries.map((item) => [
        item.entry_date,
        item.source,
        paymentText(item.payment_method),
        item.note || "",
        String(item.amount || 0),
      ]),
      [],
      ["DANH SÁCH CHI"],
      ["Ngày", "Nhóm", "Mặt hàng", "Thanh toán", "Số tiền"],
      ...expenses.map((item) => [
        item.expense_date,
        categoryName(item),
        item.item_name,
        paymentText(item.payment_method),
        String(item.amount || 0),
      ]),
    ];

    downloadCsv(`bao-cao-thu-chi-nhap-tay-${selectedMonth}.csv`, rows);
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-[#00B14F]">TÀI CHÍNH</p>
            <h1 className="text-3xl font-black text-[#06113C]">
              Tổng quan thu chi
            </h1>
            <p className="mt-1 text-sm font-bold text-neutral-500">
              Báo cáo chốt tiền thật, chỉ tính dữ liệu nhập tay.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 font-black outline-none"
            />

            <button
              onClick={exportFinanceReport}
              className="rounded-2xl bg-[#06113C] px-5 py-3 font-black text-white"
            >
              Xuất Excel
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <Card title="Tổng thu nhập tay" value={money(report.manualIncome)} />
          <Card title="Tổng chi" value={money(report.expenseTotal)} />
          <Card
            title="Lãi tạm tính"
            value={money(report.profit)}
            highlight={report.profit >= 0}
          />
          <Card title="Số khoản thu" value={`${report.incomeCount} khoản`} />
          <Card title="Số khoản chi" value={`${report.expenseCount} khoản`} />
        </div>

        <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-4 text-sm font-bold leading-6 text-yellow-700">
          ⚠️ Đơn website/POS không cộng vào báo cáo này. Muốn xem đơn hàng, vào
          mục Doanh thu đơn để đối chiếu tham khảo.
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/admin/finance/income"
            className="rounded-3xl bg-white p-5 shadow-xl shadow-neutral-950/5"
          >
            <p className="text-sm font-black text-[#00B14F]">NHẬP TAY</p>
            <h2 className="mt-1 text-xl font-black text-[#06113C]">
              Thu nhập tay
            </h2>
            <p className="mt-2 text-sm font-bold text-neutral-500">
              Dùng để chốt tổng thu thật.
            </p>
          </Link>

          <Link
            href="/admin/finance/expenses"
            className="rounded-3xl bg-white p-5 shadow-xl shadow-neutral-950/5"
          >
            <p className="text-sm font-black text-red-500">CHI PHÍ</p>
            <h2 className="mt-1 text-xl font-black text-[#06113C]">
              Tiền chi
            </h2>
            <p className="mt-2 text-sm font-bold text-neutral-500">
              Dùng để trừ lãi tạm tính.
            </p>
          </Link>

          <Link
            href="/admin/finance/orders"
            className="rounded-3xl bg-white p-5 shadow-xl shadow-neutral-950/5"
          >
            <p className="text-sm font-black text-yellow-600">THAM KHẢO</p>
            <h2 className="mt-1 text-xl font-black text-[#06113C]">
              Doanh thu đơn
            </h2>
            <p className="mt-2 text-sm font-bold text-neutral-500">
              Chỉ xem đơn website/POS, không chốt tiền.
            </p>
          </Link>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-6 font-black">
            Đang tải dữ liệu...
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-3xl bg-white p-5 shadow-xl shadow-neutral-950/5">
              <h2 className="text-xl font-black text-[#06113C]">
                Thu nhập tay trong tháng
              </h2>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="bg-[#F5FFF8] text-left">
                      <th className="p-3">Ngày</th>
                      <th className="p-3">Nguồn</th>
                      <th className="p-3">Thanh toán</th>
                      <th className="p-3 text-right">Số tiền</th>
                    </tr>
                  </thead>

                  <tbody>
                    {cashEntries.slice(0, 10).map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="p-3 font-bold">{item.entry_date}</td>
                        <td className="p-3 font-bold">{item.source}</td>
                        <td className="p-3">{paymentText(item.payment_method)}</td>
                        <td className="p-3 text-right font-black text-[#00B14F]">
                          {money(item.amount)}
                        </td>
                      </tr>
                    ))}

                    {cashEntries.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-6 text-center font-bold text-neutral-400"
                        >
                          Chưa có khoản thu nhập tay trong tháng này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-xl shadow-neutral-950/5">
              <h2 className="text-xl font-black text-[#06113C]">
                Tiền chi trong tháng
              </h2>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="bg-[#F5FFF8] text-left">
                      <th className="p-3">Ngày</th>
                      <th className="p-3">Nhóm</th>
                      <th className="p-3">Mặt hàng</th>
                      <th className="p-3 text-right">Tiền</th>
                    </tr>
                  </thead>

                  <tbody>
                    {expenses.slice(0, 10).map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="p-3 font-bold">{item.expense_date}</td>
                        <td className="p-3">{categoryName(item)}</td>
                        <td className="p-3 font-bold">{item.item_name}</td>
                        <td className="p-3 text-right font-black text-red-500">
                          {money(item.amount)}
                        </td>
                      </tr>
                    ))}

                    {expenses.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
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
        )}
      </div>
    </AdminLayout>
  );
}

function Card({
  title,
  value,
  highlight,
}: {
  title: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-xl shadow-neutral-950/5">
      <p className="text-sm font-black text-neutral-400">{title}</p>
      <p
        className={`mt-2 text-2xl font-black ${
          highlight === undefined
            ? "text-[#06113C]"
            : highlight
            ? "text-[#00B14F]"
            : "text-red-500"
        }`}
      >
        {value}
      </p>
    </div>
  );
}