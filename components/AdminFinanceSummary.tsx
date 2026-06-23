"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Order = {
  id: string;
  total: number;
  status: string;
  source: string | null;
  created_at: string;
};

type Expense = {
  id: string;
  expense_date: string;
  amount: number;
  expense_categories?: { name: string } | null;
};

type CashEntry = {
  id: string;
  entry_date: string;
  amount: number;
  source: string;
};

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function money(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value || 0) + " đ";
}

export default function AdminFinanceSummary() {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cashEntries, setCashEntries] = useState<CashEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinance();
  }, [selectedMonth]);

  async function fetchFinance() {
    setLoading(true);

    const startDate = `${selectedMonth}-01`;

    const endDate = new Date(`${selectedMonth}-01T00:00:00`);
    endDate.setMonth(endDate.getMonth() + 1);
    const endDateText = endDate.toISOString().slice(0, 10);

    const start = `${startDate}T00:00:00+07:00`;
    const end = `${endDateText}T00:00:00+07:00`;

    const [ordersRes, expensesRes, cashRes] = await Promise.all([
      supabase
        .from("orders")
        .select("id, total, status, source, created_at")
        .eq("status", "completed")
        .gte("created_at", start)
        .lt("created_at", end),

      supabase
        .from("expenses")
        .select("id, expense_date, amount, expense_categories(name)")
        .gte("expense_date", startDate)
        .lt("expense_date", endDateText),

      supabase
        .from("cash_entries")
        .select("id, entry_date, amount, source")
        .gte("entry_date", startDate)
        .lt("entry_date", endDateText),
    ]);

    if (ordersRes.error) alert(ordersRes.error.message);
    if (expensesRes.error) alert(expensesRes.error.message);
    if (cashRes.error) alert(cashRes.error.message);

    setOrders((ordersRes.data || []) as Order[]);

    setExpenses(
      ((expensesRes.data || []) as any[]).map((item) => ({
        ...item,
        expense_categories: Array.isArray(item.expense_categories)
          ? item.expense_categories[0] || null
          : item.expense_categories,
      }))
    );

    setCashEntries((cashRes.data || []) as CashEntry[]);
    setLoading(false);
  }

  const report = useMemo(() => {
    const orderRevenue = orders
      .filter((item) => item.source !== "pos")
      .reduce((sum, item) => sum + Number(item.total || 0), 0);

    const manualIncome = cashEntries.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const expenseTotal = expenses.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const revenue = orderRevenue + manualIncome;

    const expenseMap = new Map<string, number>();

    expenses.forEach((item) => {
      const name = item.expense_categories?.name || "Chi khác";
      expenseMap.set(name, (expenseMap.get(name) || 0) + Number(item.amount || 0));
    });

    const expenseByCategory = Array.from(expenseMap.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      orderRevenue,
      manualIncome,
      expenseTotal,
      revenue,
      profit: revenue - expenseTotal,
      orderCount: orders.filter((item) => item.source !== "pos").length,
      expenseCount: expenses.length,
      expenseByCategory,
    };
  }, [orders, expenses, cashEntries]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black text-[#00B14F]">TÀI CHÍNH</p>
          <h2 className="text-2xl font-black text-[#06113C]">
            Tổng quan thu chi tháng
          </h2>
          <p className="mt-1 text-sm font-bold text-neutral-500">
            Tạm thời chỉ tính đơn website + thu ngoài + chi phí nhập tay.
          </p>
        </div>

        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 font-black outline-none"
        />
      </div>

      {loading ? (
        <div className="rounded-3xl bg-white p-5 font-black">
          Đang tải tài chính...
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-5">
            <FinanceCard title="Tổng thu" value={money(report.revenue)} />
            <FinanceCard title="Đơn website" value={money(report.orderRevenue)} />
            <FinanceCard title="Thu ngoài" value={money(report.manualIncome)} />
            <FinanceCard title="Tổng chi" value={money(report.expenseTotal)} danger />
            <FinanceCard
              title="Lãi tạm tính"
              value={money(report.profit)}
              success={report.profit >= 0}
              danger={report.profit < 0}
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-3xl bg-white p-5 shadow-xl shadow-neutral-950/5">
              <h3 className="text-xl font-black text-[#06113C]">
                Chi nhiều nhất tháng này
              </h3>

              <div className="mt-4 space-y-3">
                {report.expenseByCategory.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-2xl bg-[#F5FFF8] p-4"
                  >
                    <span className="font-black text-[#06113C]">{item.name}</span>
                    <span className="font-black text-red-500">
                      {money(item.total)}
                    </span>
                  </div>
                ))}

                {report.expenseByCategory.length === 0 && (
                  <p className="rounded-2xl bg-[#F5FFF8] p-4 text-sm font-bold text-neutral-400">
                    Chưa có khoản chi nào trong tháng này.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-xl shadow-neutral-950/5">
              <h3 className="text-xl font-black text-[#06113C]">
                Tóm tắt vận hành
              </h3>

              <div className="mt-4 grid gap-3">
                <SummaryRow
                  label="Số đơn website hoàn thành"
                  value={`${report.orderCount} đơn`}
                />
                <SummaryRow
                  label="Số khoản chi"
                  value={`${report.expenseCount} khoản`}
                />
                <SummaryRow
                  label="Doanh thu đơn website"
                  value={money(report.orderRevenue)}
                />
                <SummaryRow
                  label="Doanh thu nhập tay"
                  value={money(report.manualIncome)}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function FinanceCard({
  title,
  value,
  success,
  danger,
}: {
  title: string;
  value: string;
  success?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-xl shadow-neutral-950/5">
      <p className="text-sm font-black text-neutral-400">{title}</p>
      <p
        className={`mt-2 text-2xl font-black ${
          success
            ? "text-[#00B14F]"
            : danger
            ? "text-red-500"
            : "text-[#06113C]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-[#F5FFF8] p-4">
      <span className="font-bold text-neutral-500">{label}</span>
      <span className="font-black text-[#06113C]">{value}</span>
    </div>
  );
}