"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";

type Order = {
  id: string;
  order_code: string;
  total: number;
  status: string;
  source: string | null;
  payment_method: string | null;
  created_at: string;
  confirmed_at: string | null;
};

type Expense = {
  id: string;
  expense_date: string;
  item_name: string;
  amount: number;
  payment_method: string | null;
  expense_categories?: { name: string } | null;
};

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

function money(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value || 0) + " đ";
}

export default function FinancePage() {
  const [selectedDate, setSelectedDate] = useState(todayVN());
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cashEntries, setCashEntries] = useState<CashEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  async function fetchData() {
    setLoading(true);

    const start = `${selectedDate}T00:00:00+07:00`;
    const end = `${selectedDate}T23:59:59+07:00`;

    const [ordersRes, expensesRes, cashRes] = await Promise.all([
      supabase
        .from("orders")
        .select("id, order_code, total, status, source, payment_method, created_at, confirmed_at")
        .eq("status", "completed")
        .gte("created_at", start)
        .lte("created_at", end)
        .order("created_at", { ascending: false }),

      supabase
        .from("expenses")
        .select("*, expense_categories(name)")
        .eq("expense_date", selectedDate)
        .order("created_at", { ascending: false }),

      supabase
        .from("cash_entries")
        .select("*")
        .eq("entry_date", selectedDate)
        .order("created_at", { ascending: false }),
    ]);

    setOrders((ordersRes.data || []) as Order[]);
    setExpenses((expensesRes.data || []) as Expense[]);
    setCashEntries((cashRes.data || []) as CashEntry[]);
    setLoading(false);
  }

  const report = useMemo(() => {
    const orderRevenue = orders.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const manualIncome = cashEntries.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const expenseTotal = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const revenue = orderRevenue + manualIncome;

    return {
      orderRevenue,
      manualIncome,
      expenseTotal,
      revenue,
      profit: revenue - expenseTotal,
      orderCount: orders.length,
    };
  }, [orders, expenses, cashEntries]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-[#00B14F]">TÀI CHÍNH</p>
            <h1 className="text-3xl font-black text-[#06113C]">Tổng quan thu chi</h1>
            <p className="mt-1 text-sm font-bold text-neutral-500">
              Doanh thu tự lấy từ đơn hoàn thành + tiền thu ngoài + chi phí nhập tay.
            </p>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 font-black outline-none"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <Card title="Tổng thu" value={money(report.revenue)} />
          <Card title="Đơn website/POS" value={money(report.orderRevenue)} />
          <Card title="Thu ngoài" value={money(report.manualIncome)} />
          <Card title="Tổng chi" value={money(report.expenseTotal)} />
          <Card title="Lãi tạm tính" value={money(report.profit)} highlight={report.profit >= 0} />
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-6 font-black">Đang tải dữ liệu...</div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-3xl bg-white p-5 shadow-xl shadow-neutral-950/5">
              <h2 className="text-xl font-black text-[#06113C]">Tiền thu từ đơn hàng</h2>
              <p className="mt-1 text-sm font-bold text-neutral-500">
                {report.orderCount} đơn hoàn thành
              </p>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="bg-[#F5FFF8] text-left">
                      <th className="p-3">Mã đơn</th>
                      <th className="p-3">Nguồn</th>
                      <th className="p-3">Thanh toán</th>
                      <th className="p-3 text-right">Tổng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="p-3 font-black">#{item.order_code}</td>
                        <td className="p-3">{item.source || "website"}</td>
                        <td className="p-3">{item.payment_method || "-"}</td>
                        <td className="p-3 text-right font-black">{money(item.total)}</td>
                      </tr>
                    ))}

                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-6 text-center font-bold text-neutral-400">
                          Chưa có đơn hoàn thành trong ngày này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-xl shadow-neutral-950/5">
              <h2 className="text-xl font-black text-[#06113C]">Tiền chi trong ngày</h2>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="bg-[#F5FFF8] text-left">
                      <th className="p-3">Nhóm</th>
                      <th className="p-3">Mặt hàng</th>
                      <th className="p-3">Thanh toán</th>
                      <th className="p-3 text-right">Tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="p-3">{item.expense_categories?.name || "-"}</td>
                        <td className="p-3 font-bold">{item.item_name}</td>
                        <td className="p-3">{item.payment_method || "-"}</td>
                        <td className="p-3 text-right font-black">{money(item.amount)}</td>
                      </tr>
                    ))}

                    {expenses.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-6 text-center font-bold text-neutral-400">
                          Chưa có khoản chi nào.
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