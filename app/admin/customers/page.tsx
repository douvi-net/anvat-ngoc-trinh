"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";

type Customer = {
  id: string;
  name: string;
  phone: string;
  last_address: string | null;
  last_payment_method: string | null;
  total_orders: number | null;
  created_at: string;
  updated_at: string | null;
};

type Order = {
  id: string;
  customer_id: string | null;
  customer_phone: string;
  total: number;
  status: string;
  created_at: string;
};

type FilterType = "all" | "repeat" | "vip" | "new";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    const [{ data: customerData }, { data: orderData }] = await Promise.all([
      supabase
        .from("customers")
        .select("*")
        .order("updated_at", { ascending: false }),

      supabase
        .from("orders")
        .select("id,customer_id,customer_phone,total,status,created_at")
        .neq("status", "cancelled"),
    ]);

    setCustomers(customerData || []);
    setOrders(orderData || []);
    setLoading(false);
  }

  function getCustomerOrders(customer: Customer) {
    return orders.filter(
      (order) =>
        order.customer_id === customer.id ||
        order.customer_phone === customer.phone
    );
  }

  function getCustomerRevenue(customer: Customer) {
    return getCustomerOrders(customer).reduce(
      (sum, order) => sum + order.total,
      0
    );
  }

  function getLastOrder(customer: Customer) {
    const customerOrders = getCustomerOrders(customer).sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return customerOrders[0] || null;
  }

  async function copyPhone(phone: string) {
    await navigator.clipboard.writeText(phone);
    alert(`Đã copy số ${phone}`);
  }

  function callCustomer(phone: string) {
    window.location.href = `tel:${phone}`;
  }

  function openZalo(phone: string) {
    window.open(`https://zalo.me/${phone}`, "_blank");
  }

  const enrichedCustomers = useMemo(() => {
    return customers.map((customer) => {
      const customerOrders = orders.filter(
        (order) =>
          order.customer_id === customer.id ||
          order.customer_phone === customer.phone
      );

      const revenue = customerOrders.reduce(
        (sum, order) => sum + order.total,
        0
      );

      const lastOrder = [...customerOrders].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      return {
        ...customer,
        orderCount: customerOrders.length,
        revenue,
        lastOrder,
      };
    });
  }, [customers, orders]);

  const filteredCustomers = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    return enrichedCustomers
      .filter((customer) => {
        if (!q) return true;

        return (
          customer.name.toLowerCase().includes(q) ||
          customer.phone.toLowerCase().includes(q) ||
          (customer.last_address || "").toLowerCase().includes(q)
        );
      })
      .filter((customer) => {
        if (filter === "all") return true;
        if (filter === "repeat") return customer.orderCount >= 2;
        if (filter === "vip") return customer.revenue >= 300000;
        if (filter === "new") return customer.orderCount <= 1;
        return true;
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [enrichedCustomers, keyword, filter]);

  const totalRevenue = enrichedCustomers.reduce(
    (sum, customer) => sum + customer.revenue,
    0
  );

  const repeatCustomers = enrichedCustomers.filter(
    (customer) => customer.orderCount >= 2
  ).length;

  const vipCustomers = enrichedCustomers.filter(
    (customer) => customer.revenue >= 300000
  ).length;

  const topCustomer = enrichedCustomers.sort(
    (a, b) => b.revenue - a.revenue
  )[0];

  return (
    <AdminLayout>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-black text-[#00B14F]">Admin/POS</p>

          <h1 className="mt-1 text-4xl font-black text-[#06113C]">
            CRM khách hàng
          </h1>

          <p className="mt-2 text-sm font-semibold text-neutral-500">
            Quản lý khách cũ, khách quay lại, khách chi tiêu cao để chăm sóc lại.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="rounded-2xl bg-[#00B14F] px-5 py-4 text-sm font-black text-white shadow-lg shadow-[#00B14F]/25"
        >
          Làm mới dữ liệu
        </button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-5">
        <div className="rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5">
          <p className="text-sm font-black text-neutral-400">Tổng khách</p>
          <p className="mt-2 text-3xl font-black text-[#06113C]">
            {customers.length}
          </p>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5">
          <p className="text-sm font-black text-neutral-400">Khách quay lại</p>
          <p className="mt-2 text-3xl font-black text-[#00B14F]">
            {repeatCustomers}
          </p>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5">
          <p className="text-sm font-black text-neutral-400">Khách VIP</p>
          <p className="mt-2 text-3xl font-black text-yellow-600">
            {vipCustomers}
          </p>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5">
          <p className="text-sm font-black text-neutral-400">Tổng đơn hợp lệ</p>
          <p className="mt-2 text-3xl font-black text-[#06113C]">
            {orders.length}
          </p>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5">
          <p className="text-sm font-black text-neutral-400">
            Doanh thu từ khách
          </p>
          <p className="mt-2 text-3xl font-black text-[#06113C]">
            {totalRevenue.toLocaleString("vi-VN")}đ
          </p>
        </div>
      </div>

      {topCustomer && (
        <div className="mt-6 rounded-[32px] bg-[#06113C] p-6 text-white shadow-xl shadow-neutral-950/5">
          <p className="font-black text-[#00B14F]">Khách chi tiêu cao nhất</p>
          <h2 className="mt-2 text-3xl font-black">{topCustomer.name}</h2>
          <p className="mt-2 text-sm font-bold text-white/70">
            {topCustomer.phone} · {topCustomer.orderCount} đơn ·{" "}
            {topCustomer.revenue.toLocaleString("vi-VN")}đ
          </p>
        </div>
      )}

      <div className="mt-8 rounded-[32px] bg-white p-5 shadow-xl shadow-neutral-950/5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#06113C]">
              Danh sách khách hàng
            </h2>
            <p className="mt-1 text-sm font-semibold text-neutral-500">
              Tìm theo tên, số điện thoại hoặc địa chỉ.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm khách..."
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none transition focus:border-[#00B14F] md:w-80"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none transition focus:border-[#00B14F]"
            >
              <option value="all">Tất cả</option>
              <option value="repeat">Khách quay lại</option>
              <option value="vip">Khách VIP</option>
              <option value="new">Khách mới</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="mt-8 font-black text-[#06113C]">Đang tải khách...</p>
        ) : (
          <div className="mt-6 space-y-4">
            {filteredCustomers.length === 0 ? (
              <div className="rounded-[28px] bg-[#F5FFF8] p-6 text-sm font-bold text-neutral-500">
                Chưa có khách phù hợp.
              </div>
            ) : (
              filteredCustomers.map((customer) => {
                const isRepeat = customer.orderCount >= 2;
                const isVip = customer.revenue >= 300000;

                return (
                  <div
                    key={customer.id}
                    className="grid gap-4 rounded-[28px] border border-black/5 bg-white p-4 shadow-lg shadow-neutral-950/5 xl:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-black text-[#06113C]">
                          {customer.name}
                        </h3>

                        {isVip && (
                          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-black text-yellow-700">
                            VIP
                          </span>
                        )}

                        {isRepeat && (
                          <span className="rounded-full bg-[#E8FFF1] px-3 py-1 text-xs font-black text-[#00B14F]">
                            Khách quay lại
                          </span>
                        )}

                        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-500">
                          {customer.last_payment_method === "momo"
                            ? "Hay CK"
                            : "Hay COD"}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1 text-sm font-bold text-neutral-600">
                        <p>📞 {customer.phone}</p>
                        <p>📍 {customer.last_address || "Chưa có địa chỉ"}</p>
                        <p>
                          🕒 Lần mua cuối:{" "}
                          {customer.lastOrder
                            ? new Date(customer.lastOrder.created_at).toLocaleString(
                                "vi-VN"
                              )
                            : "Chưa có"}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => callCustomer(customer.phone)}
                          className="rounded-xl bg-[#00B14F] px-4 py-3 text-xs font-black text-white"
                        >
                          Gọi khách
                        </button>

                        <button
                          onClick={() => copyPhone(customer.phone)}
                          className="rounded-xl bg-[#06113C] px-4 py-3 text-xs font-black text-white"
                        >
                          Copy SĐT
                        </button>

                        <button
                          onClick={() => openZalo(customer.phone)}
                          className="rounded-xl bg-blue-50 px-4 py-3 text-xs font-black text-blue-600"
                        >
                          Mở Zalo
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[420px]">
                      <div className="rounded-2xl bg-[#F5FFF8] p-4">
                        <p className="text-xs font-black text-neutral-400">
                          Tổng đơn
                        </p>
                        <p className="mt-1 text-2xl font-black text-[#06113C]">
                          {customer.orderCount}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#F5FFF8] p-4">
                        <p className="text-xs font-black text-neutral-400">
                          Tổng mua
                        </p>
                        <p className="mt-1 text-2xl font-black text-[#00B14F]">
                          {customer.revenue.toLocaleString("vi-VN")}đ
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#F5FFF8] p-4">
                        <p className="text-xs font-black text-neutral-400">
                          Trung bình
                        </p>
                        <p className="mt-1 text-lg font-black text-[#06113C]">
                          {customer.orderCount > 0
                            ? Math.round(
                                customer.revenue / customer.orderCount
                              ).toLocaleString("vi-VN")
                            : 0}
                          đ
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}