"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";

type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
  unit_price?: number | null;
  total: number;
  note: string | null;
  toppings: any;
};

type Order = {
  id: string;
  order_code: string;
  customer_name: string | null;
  customer_phone: string | null;
  total: number;
  status: string;
  source: string | null;
  payment_method: string | null;
  created_at: string;
  order_items: OrderItem[];
};

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function money(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value || 0) + " đ";
}

function dateTime(value: string) {
  return new Date(value).toLocaleString("vi-VN");
}
function formatToppings(value: any) {
    if (!value) return "";
  
    if (typeof value === "string") {
      const text = value.trim();
      if (!text || text === "[]" || text === "{}") return "";
      return text;
    }
  
    if (Array.isArray(value)) {
      if (value.length === 0) return "";
      return value.join(", ");
    }
  
    const text = JSON.stringify(value);
    if (!text || text === "[]" || text === "{}") return "";
  
    return text;
  }
export default function FinanceOrdersPage() {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [sourceFilter, setSourceFilter] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [selectedMonth, sourceFilter]);

  async function fetchOrders() {
    setLoading(true);

    const startDate = `${selectedMonth}-01`;
    const endDate = new Date(`${selectedMonth}-01T00:00:00`);
    endDate.setMonth(endDate.getMonth() + 1);
    const endDateText = endDate.toISOString().slice(0, 10);

    let query = supabase
      .from("orders")
      .select("*, order_items(*)")
      .gte("created_at", `${startDate}T00:00:00+07:00`)
      .lt("created_at", `${endDateText}T00:00:00+07:00`)
      .in("status", ["completed", "cancelled"])
      .order("created_at", { ascending: false });

    if (sourceFilter !== "all") {
      query = query.eq("source", sourceFilter);
    }

    const { data, error } = await query;

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setOrders((data || []) as Order[]);
    setLoading(false);
  }

  async function cancelOrder(order: Order) {
    if (!confirm(`Hủy đơn #${order.order_code}? Đơn sẽ không tính doanh thu.`)) return;

    const { error } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (error) {
      alert(error.message);
      return;
    }

    setSelectedOrder(null);
    fetchOrders();
  }

  async function deleteOrder(order: Order) {
    if (
      !confirm(
        `XÓA HẲN đơn #${order.order_code}? Chỉ dùng khi đơn test hoặc bấm nhầm.`
      )
    ) {
      return;
    }

    await supabase.from("order_items").delete().eq("order_id", order.id);

    const { error } = await supabase.from("orders").delete().eq("id", order.id);

    if (error) {
      alert(error.message);
      return;
    }

    setSelectedOrder(null);
    fetchOrders();
  }

  const filteredOrders = useMemo(() => {
    const key = keyword.trim().toLowerCase();

    if (!key) return orders;

    return orders.filter((order) => {
      const text = [
        order.order_code,
        order.customer_name || "",
        order.customer_phone || "",
        order.source || "",
        order.payment_method || "",
        ...(order.order_items || []).map((item) => item.product_name),
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(key);
    });
  }, [orders, keyword]);

  const completedOrders = filteredOrders.filter((item) => item.status === "completed");
  const cancelledOrders = filteredOrders.filter((item) => item.status === "cancelled");

  const totalRevenue = completedOrders.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  );

  const avgOrder =
    completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-[#00B14F]">TÀI CHÍNH</p>
            <h1 className="text-3xl font-black text-[#06113C]">Doanh thu đơn</h1>
            <p className="mt-1 text-sm font-bold text-neutral-500">
              Xem đơn website/POS, món đã bán, ngày đặt và hủy đơn khi cần.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-2xl border bg-white px-4 py-3 font-black"
            />

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="rounded-2xl border bg-white px-4 py-3 font-black"
            >
              <option value="all">Tất cả nguồn</option>
              <option value="website">Website</option>
              <option value="pos">POS</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card title="Doanh thu đơn" value={money(totalRevenue)} />
          <Card title="Đơn hoàn thành" value={`${completedOrders.length} đơn`} />
          <Card title="Đơn đã hủy" value={`${cancelledOrders.length} đơn`} danger />
          <Card title="Trung bình / đơn" value={money(avgOrder)} />
        </div>

        <section className="rounded-3xl bg-white p-5 shadow-xl shadow-neutral-950/5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-black text-[#06113C]">
              Danh sách đơn trong tháng
            </h2>

            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm mã đơn, món, khách..."
              className="rounded-2xl border px-4 py-3 font-bold md:w-[320px]"
            />
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[1080px] text-sm">
              <thead>
                <tr className="bg-[#F5FFF8] text-left">
                  <th className="p-3">Ngày đặt</th>
                  <th className="p-3">Mã đơn</th>
                  <th className="p-3">Nguồn</th>
                  <th className="p-3">Món</th>
                  <th className="p-3">Thanh toán</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-right">Tổng</th>
                  <th className="p-3"></th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center font-bold">
                      Đang tải đơn...
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className={`border-b ${
                        order.status === "cancelled" ? "bg-red-50/60" : ""
                      }`}
                    >
                      <td className="p-3 font-bold">{dateTime(order.created_at)}</td>
                      <td className="p-3 font-black">#{order.order_code}</td>
                      <td className="p-3">{order.source || "website"}</td>
                      <td className="p-3">
                        {(order.order_items || [])
                          .slice(0, 2)
                          .map((item) => `${item.product_name} x${item.quantity}`)
                          .join(", ")}
                        {(order.order_items || []).length > 2
                          ? ` +${order.order_items.length - 2} món`
                          : ""}
                      </td>
                      <td className="p-3">{order.payment_method || "-"}</td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            order.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {order.status === "completed" ? "Hoàn thành" : "Đã hủy"}
                        </span>
                      </td>
                      <td className="p-3 text-right font-black">
                        {money(order.total)}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="rounded-xl bg-[#E8FFF1] px-3 py-2 font-black text-[#00B14F]"
                        >
                          Xem
                        </button>
                      </td>
                    </tr>
                  ))
                )}

                {!loading && filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center font-bold text-neutral-400">
                      Chưa có đơn trong tháng này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-[#00B14F]">CHI TIẾT ĐƠN</p>
                  <h2 className="text-2xl font-black text-[#06113C]">
                    #{selectedOrder.order_code}
                  </h2>
                  <p className="mt-1 text-sm font-bold text-neutral-500">
                    {dateTime(selectedOrder.created_at)}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-xl bg-neutral-100 px-4 py-2 font-black"
                >
                  Đóng
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {(selectedOrder.order_items || []).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-[#F5FFF8] p-4"
                  >
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-black text-[#06113C]">
                          {item.product_name} x{item.quantity}
                        </p>
                        {formatToppings(item.toppings) && (
  <p className="mt-1 text-sm font-bold text-neutral-500">
    {formatToppings(item.toppings)}
  </p>
)}
                        {item.note && (
                          <p className="mt-1 text-sm font-bold text-red-500">
                            Ghi chú: {item.note}
                          </p>
                        )}
                      </div>

                      <p className="font-black">{money(item.total)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl bg-[#06113C] p-4 text-white">
                <div className="flex justify-between text-xl font-black">
                  <span>Tổng đơn</span>
                  <span>{money(selectedOrder.total)}</span>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 md:flex-row md:justify-end">
                {selectedOrder.status !== "cancelled" && (
                  <button
                    onClick={() => cancelOrder(selectedOrder)}
                    className="rounded-2xl bg-red-50 px-5 py-3 font-black text-red-600"
                  >
                    Hủy đơn
                  </button>
                )}

                <button
                  onClick={() => deleteOrder(selectedOrder)}
                  className="rounded-2xl bg-red-600 px-5 py-3 font-black text-white"
                >
                  Xóa hẳn
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function Card({
  title,
  value,
  danger,
}: {
  title: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-xl shadow-neutral-950/5">
      <p className="text-sm font-black text-neutral-400">{title}</p>
      <p
        className={`mt-2 text-2xl font-black ${
          danger ? "text-red-500" : "text-[#06113C]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}