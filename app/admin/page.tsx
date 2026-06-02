"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";

type OrderItem = {
  product_name: string;
  quantity: number;
  total: number;
  toppings:
    | {
        name: string;
        price: number;
      }[]
    | null;
};

type Order = {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  status: string;
  payment_method: string | null;
  payment_status: string | null;
  created_at: string;
  order_items: OrderItem[];
};

type Customer = {
  id: string;
  name: string;
  phone: string;
  created_at: string;
};

type Product = {
  id: string;
  name: string;
  is_active: boolean;
  is_sold_out: boolean;
};

type Topping = {
  id: string;
  name: string;
  is_active: boolean;
  is_sold_out: boolean;
};

const statusLabel: Record<string, string> = {
  waiting_payment: "Chờ thanh toán",
  new: "Đơn mới",
  making: "Đang làm",
  completed: "Hoàn thành",
  cancelled: "Đã huỷ",
};

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    setLoading(true);

    const [
      { data: orderData },
      { data: customerData },
      { data: productData },
      { data: toppingData },
    ] = await Promise.all([
      supabase
        .from("orders")
        .select("*, order_items (*)")
        .order("created_at", { ascending: false }),

      supabase
        .from("customers")
        .select("id,name,phone,created_at")
        .order("created_at", { ascending: false }),

      supabase
        .from("products")
        .select("id,name,is_active,is_sold_out"),

      supabase
        .from("toppings")
        .select("id,name,is_active,is_sold_out"),
    ]);

    setOrders((orderData || []) as Order[]);
    setCustomers((customerData || []) as Customer[]);
    setProducts((productData || []) as Product[]);
    setToppings((toppingData || []) as Topping[]);
    setLoading(false);
  }

  const todayText = new Date().toLocaleDateString("vi-VN");

  const validOrders = orders.filter((order) => order.status !== "cancelled");

  const todayOrders = validOrders.filter(
    (order) =>
      new Date(order.created_at).toLocaleDateString("vi-VN") === todayText
  );

  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);

  const completedRevenue = validOrders
    .filter((order) => order.status === "completed")
    .reduce((sum, order) => sum + order.total, 0);

  const waitingPayment = orders.filter(
    (order) => order.status === "waiting_payment"
  ).length;

  const customerSentPayment = orders.filter(
    (order) => order.payment_status === "customer_sent"
  ).length;

  const newOrders = orders.filter((order) => order.status === "new").length;

  const makingOrders = orders.filter(
    (order) => order.status === "making"
  ).length;

  const completedToday = todayOrders.filter(
    (order) => order.status === "completed"
  ).length;

  const cancelledToday = orders.filter(
    (order) =>
      order.status === "cancelled" &&
      new Date(order.created_at).toLocaleDateString("vi-VN") === todayText
  ).length;

  const momoToday = todayOrders.filter(
    (order) => order.payment_method === "momo"
  ).length;

  const codToday = todayOrders.filter(
    (order) => order.payment_method !== "momo"
  ).length;

  const averageOrderValue =
    todayOrders.length > 0 ? Math.round(todayRevenue / todayOrders.length) : 0;

  const activeProducts = products.filter((product) => product.is_active).length;
  const soldOutProducts = products.filter((product) => product.is_sold_out).length;
  const soldOutToppings = toppings.filter((topping) => topping.is_sold_out).length;

  const topProducts = useMemo(() => {
    const map = new Map<
      string,
      { name: string; quantity: number; total: number }
    >();

    validOrders.forEach((order) => {
      order.order_items?.forEach((item) => {
        const current = map.get(item.product_name) || {
          name: item.product_name,
          quantity: 0,
          total: 0,
        };

        current.quantity += item.quantity;
        current.total += item.total;

        map.set(item.product_name, current);
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6);
  }, [orders]);

  const topToppings = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number }>();

    validOrders.forEach((order) => {
      order.order_items?.forEach((item) => {
        item.toppings?.forEach((topping) => {
          const current = map.get(topping.name) || {
            name: topping.name,
            quantity: 0,
          };

          current.quantity += item.quantity;
          map.set(topping.name, current);
        });
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6);
  }, [orders]);

  const recentOrders = orders.slice(0, 8);

  return (
    <AdminLayout>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-black text-[#00B14F]">Admin/POS</p>

          <h1 className="mt-1 text-4xl font-black text-[#06113C]">
            Tổng quan POS
          </h1>

          <p className="mt-2 text-sm font-semibold text-neutral-500">
            Theo dõi đơn hàng, doanh thu, sản phẩm, topping và khách hàng.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/orders"
            className="rounded-2xl bg-[#06113C] px-5 py-4 text-sm font-black text-white"
          >
            Xem đơn hàng
          </Link>

          <button
            onClick={fetchDashboard}
            className="rounded-2xl bg-[#00B14F] px-5 py-4 text-sm font-black text-white shadow-lg shadow-[#00B14F]/25"
          >
            Làm mới
          </button>
        </div>
      </div>

      {loading ? (
        <p className="mt-10 font-black text-[#06113C]">
          Đang tải tổng quan...
        </p>
      ) : (
        <>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5">
              <p className="text-sm font-black text-neutral-400">
                Doanh thu hôm nay
              </p>
              <p className="mt-2 text-3xl font-black text-[#06113C]">
                {todayRevenue.toLocaleString("vi-VN")}đ
              </p>
              <p className="mt-2 text-xs font-bold text-neutral-400">
                {todayOrders.length} đơn hợp lệ
              </p>
            </div>

            <div className="rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5">
              <p className="text-sm font-black text-neutral-400">
                Giá trị đơn TB
              </p>
              <p className="mt-2 text-3xl font-black text-[#06113C]">
                {averageOrderValue.toLocaleString("vi-VN")}đ
              </p>
              <p className="mt-2 text-xs font-bold text-neutral-400">
                Tính theo hôm nay
              </p>
            </div>

            <div className="rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5">
              <p className="text-sm font-black text-neutral-400">Khách hàng</p>
              <p className="mt-2 text-3xl font-black text-[#00B14F]">
                {customers.length}
              </p>
              <p className="mt-2 text-xs font-bold text-neutral-400">
                Tổng khách đã lưu
              </p>
            </div>

            <div className="rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5">
              <p className="text-sm font-black text-neutral-400">
                Doanh thu hoàn thành
              </p>
              <p className="mt-2 text-3xl font-black text-[#06113C]">
                {completedRevenue.toLocaleString("vi-VN")}đ
              </p>
              <p className="mt-2 text-xs font-bold text-neutral-400">
                Không tính đơn huỷ
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-5">
            <Link href="/admin/orders" className="rounded-[28px] bg-orange-50 p-5">
              <p className="text-sm font-black text-orange-700">
                Chờ thanh toán
              </p>
              <p className="mt-2 text-3xl font-black text-orange-700">
                {waitingPayment}
              </p>
            </Link>

            <Link href="/admin/orders" className="rounded-[28px] bg-yellow-50 p-5">
              <p className="text-sm font-black text-yellow-700">
                Khách báo CK
              </p>
              <p className="mt-2 text-3xl font-black text-yellow-700">
                {customerSentPayment}
              </p>
            </Link>

            <Link href="/admin/orders" className="rounded-[28px] bg-blue-50 p-5">
              <p className="text-sm font-black text-blue-700">Đơn mới</p>
              <p className="mt-2 text-3xl font-black text-blue-700">
                {newOrders}
              </p>
            </Link>

            <Link href="/admin/orders" className="rounded-[28px] bg-amber-50 p-5">
              <p className="text-sm font-black text-amber-700">Đang làm</p>
              <p className="mt-2 text-3xl font-black text-amber-700">
                {makingOrders}
              </p>
            </Link>

            <Link href="/admin/orders" className="rounded-[28px] bg-green-50 p-5">
              <p className="text-sm font-black text-green-700">
                Hoàn thành hôm nay
              </p>
              <p className="mt-2 text-3xl font-black text-green-700">
                {completedToday}
              </p>
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5">
              <p className="text-sm font-black text-neutral-400">COD hôm nay</p>
              <p className="mt-2 text-3xl font-black text-[#06113C]">
                {codToday}
              </p>
            </div>

            <div className="rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5">
              <p className="text-sm font-black text-neutral-400">
                Momo/CK hôm nay
              </p>
              <p className="mt-2 text-3xl font-black text-[#06113C]">
                {momoToday}
              </p>
            </div>

            <div className="rounded-[28px] bg-red-50 p-5">
              <p className="text-sm font-black text-red-700">Huỷ hôm nay</p>
              <p className="mt-2 text-3xl font-black text-red-700">
                {cancelledToday}
              </p>
            </div>

            <div className="rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5">
              <p className="text-sm font-black text-neutral-400">
                Món đang bán
              </p>
              <p className="mt-2 text-3xl font-black text-[#00B14F]">
                {activeProducts}
              </p>
              <p className="mt-2 text-xs font-bold text-neutral-400">
                {soldOutProducts} món tạm hết · {soldOutToppings} topping tạm hết
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
            <div className="rounded-[32px] bg-white p-5 shadow-xl shadow-neutral-950/5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-black text-[#06113C]">
                  Món bán chạy
                </h2>

                <Link
                  href="/admin/products"
                  className="rounded-xl bg-[#E8FFF1] px-4 py-2 text-xs font-black text-[#00B14F]"
                >
                  Quản lý món
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {topProducts.length === 0 ? (
                  <p className="rounded-2xl bg-[#F5FFF8] p-4 text-sm font-bold text-neutral-500">
                    Chưa có dữ liệu.
                  </p>
                ) : (
                  topProducts.map((item, index) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between rounded-2xl bg-[#F5FFF8] p-4"
                    >
                      <div>
                        <p className="font-black text-[#06113C]">
                          #{index + 1} {item.name}
                        </p>
                        <p className="mt-1 text-sm font-bold text-neutral-500">
                          Đã bán: {item.quantity}
                        </p>
                      </div>

                      <p className="font-black text-[#00B14F]">
                        {item.total.toLocaleString("vi-VN")}đ
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[32px] bg-white p-5 shadow-xl shadow-neutral-950/5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-black text-[#06113C]">
                  Topping hot
                </h2>

                <Link
                  href="/admin/toppings"
                  className="rounded-xl bg-[#E8FFF1] px-4 py-2 text-xs font-black text-[#00B14F]"
                >
                  Quản lý topping
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {topToppings.length === 0 ? (
                  <p className="rounded-2xl bg-[#F5FFF8] p-4 text-sm font-bold text-neutral-500">
                    Chưa có dữ liệu topping.
                  </p>
                ) : (
                  topToppings.map((item, index) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between rounded-2xl bg-[#F5FFF8] p-4"
                    >
                      <p className="font-black text-[#06113C]">
                        #{index + 1} {item.name}
                      </p>

                      <p className="font-black text-[#00B14F]">
                        {item.quantity} lượt
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-[32px] bg-white p-5 shadow-xl shadow-neutral-950/5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black text-[#06113C]">
                Đơn gần đây
              </h2>

              <Link
                href="/admin/orders"
                className="rounded-xl bg-[#06113C] px-4 py-2 text-xs font-black text-white"
              >
                Xem tất cả
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {recentOrders.length === 0 ? (
                <p className="rounded-2xl bg-[#F5FFF8] p-4 text-sm font-bold text-neutral-500">
                  Chưa có đơn gần đây.
                </p>
              ) : (
                recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`grid gap-3 rounded-2xl p-4 md:grid-cols-[1fr_auto] ${
                      order.payment_status === "customer_sent"
                        ? "bg-yellow-50 ring-2 ring-yellow-300"
                        : "bg-[#F5FFF8]"
                    }`}
                  >
                    <div>
                      <p className="font-black text-[#06113C]">
                        #{order.order_code} · {order.customer_name}
                      </p>

                      <p className="mt-1 text-sm font-bold text-neutral-500">
                        {order.customer_phone} ·{" "}
                        {new Date(order.created_at).toLocaleString("vi-VN")}
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="font-black text-[#00B14F]">
                        {order.total.toLocaleString("vi-VN")}đ
                      </p>

                      <p className="mt-1 text-xs font-black text-neutral-500">
                        {statusLabel[order.status] || order.status}
                      </p>

                      {order.payment_status === "customer_sent" && (
                        <p className="mt-1 text-xs font-black text-yellow-700">
                          Khách báo đã CK
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}