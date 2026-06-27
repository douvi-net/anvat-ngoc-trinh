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

const pageSize = 100;

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function money(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value || 0) + " đ";
}

function dateOnly(value: string) {
  return new Date(value).toLocaleDateString("vi-VN");
}

function dateTime(value: string) {
  return new Date(value).toLocaleString("vi-VN");
}

function sourceText(value: string | null) {
  if (value === "pos") return "POS";
  if (value === "website") return "Website";
  return value || "Website";
}

function paymentText(value: string | null) {
  if (value === "cash") return "Tiền mặt";
  if (value === "bank") return "Chuyển khoản";
  if (value === "momo") return "Chuyển khoản";
  if (value === "cod") return "Tiền mặt";
  return value || "-";
}

function formatToppings(value: any) {
  if (!value) return "";

  if (typeof value === "string") {
    const text = value.trim();

    if (!text || text === "[]" || text === "{}") return "";

    try {
      const parsed = JSON.parse(text);
      return formatToppings(parsed);
    } catch {
      return text;
    }
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (!item) return "";

        if (typeof item === "string") return item;

        if (typeof item === "object") {
          const name = item.name || item.product_name || "";
          const price = Number(item.price || 0);

          if (!name) return "";

          return price > 0
            ? `${name} (+${money(price)})`
            : name;
        }

        return String(item);
      })
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    const name = value.name || value.product_name || "";
    if (name) return name;
  }

  return "";
}

export default function FinanceOrdersPage() {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [sourceFilter, setSourceFilter] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [selectedMonth, sourceFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, sourceFilter, keyword]);

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
    if (!confirm(`Hủy đơn #${order.order_code}?`)) return;

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

  const completedOrders = filteredOrders.filter(
    (item) => item.status === "completed"
  );

  const cancelledOrders = filteredOrders.filter(
    (item) => item.status === "cancelled"
  );

  const referenceRevenue = completedOrders.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  );

  const websiteOrders = completedOrders.filter(
    (item) => (item.source || "website") === "website"
  );

  const posOrders = completedOrders.filter((item) => item.source === "pos");

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));

  const pagedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-yellow-600">THAM KHẢO</p>
            <h1 className="text-3xl font-black text-[#06113C]">
              Doanh thu đơn tham khảo
            </h1>
            <p className="mt-1 text-sm font-bold text-neutral-500">
              Chỉ dùng để xem và đối chiếu đơn website/POS. Không cộng vào báo cáo thu chi.
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

        <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-4 text-sm font-bold leading-6 text-yellow-700">
          ⚠️ Trang này chỉ để tham khảo đơn hàng. POS có thể chưa đồng bộ đủ hoặc sai topping.
          Báo cáo chốt tiền thật nằm ở mục Tổng quan thu chi và chỉ lấy dữ liệu nhập tay.
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card title="Tổng đơn tham khảo" value={money(referenceRevenue)} />
          <Card title="Website hoàn thành" value={`${websiteOrders.length} đơn`} />
          <Card title="POS hoàn thành" value={`${posOrders.length} đơn`} />
          <Card title="Đơn đã hủy" value={`${cancelledOrders.length} đơn`} danger />
        </div>

        <section className="rounded-3xl bg-white p-5 shadow-xl shadow-neutral-950/5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black text-[#06113C]">
                Danh sách đơn trong tháng
              </h2>
              <p className="mt-1 text-sm font-bold text-neutral-500">
                Hiển thị 100 đơn mỗi trang. Dữ liệu dùng để kiểm tra, không chốt tiền.
              </p>
            </div>

            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm mã đơn, món, khách..."
              className="rounded-2xl border px-4 py-3 font-bold md:w-[320px]"
            />
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="bg-[#F5FFF8] text-left">
                  <th className="p-3">Ngày đặt</th>
                  <th className="p-3">Mã đơn</th>
                  <th className="p-3">Nguồn</th>
                  <th className="p-3">Thanh toán</th>
                  <th className="p-3 text-right">Tổng tham khảo</th>
                  <th className="p-3"></th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center font-bold">
                      Đang tải đơn...
                    </td>
                  </tr>
                ) : (
                  pagedOrders.map((order) => (
                    <tr
                      key={order.id}
                      className={`border-b ${
                        order.status === "cancelled" ? "bg-red-50/60" : ""
                      }`}
                    >
                      <td className="p-3 font-bold">{dateOnly(order.created_at)}</td>
                      <td className="p-3 font-black">#{order.order_code}</td>
                      <td className="p-3">{sourceText(order.source)}</td>
                      <td className="p-3">{paymentText(order.payment_method)}</td>
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
                    <td
                      colSpan={6}
                      className="p-6 text-center font-bold text-neutral-400"
                    >
                      Chưa có đơn trong tháng này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!loading && totalPages > 1 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {Array.from({ length: totalPages }).map((_, index) => {
                const page = index + 1;

                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`rounded-xl px-4 py-2 font-black ${
                      currentPage === page
                        ? "bg-[#06113C] text-white"
                        : "bg-[#F5FFF8] text-[#06113C]"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-yellow-600">
                    CHI TIẾT ĐƠN THAM KHẢO
                  </p>

                  <h2 className="text-2xl font-black text-[#06113C]">
                    #{selectedOrder.order_code}
                  </h2>

                  <p className="mt-1 text-sm font-bold text-neutral-500">
                    {dateTime(selectedOrder.created_at)}
                  </p>

                  <p className="mt-1 text-sm font-bold text-neutral-500">
                    Nguồn: {sourceText(selectedOrder.source)} • Thanh toán:{" "}
                    {paymentText(selectedOrder.payment_method)}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-xl bg-neutral-100 px-4 py-2 font-black"
                >
                  Đóng
                </button>
              </div>

              <div className="mt-5 rounded-2xl bg-yellow-50 p-4 text-sm font-bold text-yellow-700">
                ⚠️ Chi tiết món chỉ để đối chiếu. Nếu đơn POS hiển thị topping chưa đúng,
                hãy ưu tiên kiểm tra trên máy POS.
              </div>

              <div className="mt-5 space-y-3">
                {(selectedOrder.order_items || []).map((item) => {
                  const toppingsText = formatToppings(item.toppings);

                  return (
                    <div key={item.id} className="rounded-2xl bg-[#F5FFF8] p-4">
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="font-black text-[#06113C]">
                            {item.product_name} x{item.quantity}
                          </p>

                          {toppingsText && (
                            <p className="mt-1 text-sm font-bold text-neutral-500">
                              Topping: {toppingsText}
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
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl bg-[#06113C] p-4 text-white">
                <div className="flex justify-between text-xl font-black">
                  <span>Tổng tham khảo</span>
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