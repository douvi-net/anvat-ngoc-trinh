"use client";

import { useEffect, useRef, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import InstallAppButton from "@/components/InstallAppButton";
import { supabase } from "@/lib/supabase";
import PushNotificationSetup from "@/components/PushNotificationSetup";
type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
  note: string | null;
  spicy_level: string | null;
  toppings: { id: string; name: string; price: number }[] | null;
};

type Order = {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  note: string | null;
  subtotal: number;
  shipping_fee: number;
  total: number;
  status: string;
  source: string;
  created_at: string;
  payment_method: string | null;
  payment_status: string | null;
  delivery_distance_km: number | null;
  delivery_area: string | null;
  delivery_status: string | null;
  promotion_name: string | null;
  promotion_discount: number | null;
  order_items: OrderItem[];
};

const columns = [
  {
    key: "waiting_payment",
    title: "Chờ thanh toán",
    color: "bg-orange-50",
    badge: "bg-orange-100 text-orange-700",
    action: "Đã nhận tiền",
    next: "new",
  },
  {
    key: "new",
    title: "Đơn mới",
    color: "bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
    action: "Xác nhận đơn",
    next: "making",
  },
  {
    key: "making",
    title: "Đang làm",
    color: "bg-yellow-50",
    badge: "bg-yellow-100 text-yellow-700",
    action: "Hoàn thành",
    next: "completed",
  },
  {
    key: "completed",
    title: "Hoàn thành",
    color: "bg-green-50",
    badge: "bg-green-100 text-green-700",
    action: "Đã hoàn thành",
    next: "completed",
  },
  {
    key: "cancelled",
    title: "Đã huỷ",
    color: "bg-red-50",
    badge: "bg-red-100 text-red-700",
    action: "Đã huỷ",
    next: "cancelled",
  },
];

const filters = [
  { key: "all", label: "Tất cả" },
  { key: "today", label: "Hôm nay" },
  { key: "waiting_payment", label: "Chờ thanh toán" },
  { key: "customer_sent", label: "Khách báo CK" },
  { key: "new", label: "Đơn mới" },
  { key: "making", label: "Đang làm" },
  { key: "completed", label: "Hoàn thành" },
  { key: "cancelled", label: "Đã huỷ" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrderAlert, setNewOrderAlert] = useState<Order | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [filter, setFilter] = useState("all");
  const [keyword, setKeyword] = useState("");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const alertIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchOrders();

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("avnt_sound_enabled");
      if (saved === "1") setSoundEnabled(true);
    }

    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        async (payload) => {
          await fetchOrders();

          const newOrderId = payload.new.id;

          const { data } = await supabase
            .from("orders")
            .select("*, order_items (*)")
            .eq("id", newOrderId)
            .single();

          if (data) {
            setNewOrderAlert(data as Order);
            startOrderSound();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        () => {
          fetchOrders();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items" },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      stopOrderSound();
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items (*)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setOrders((data || []) as Order[]);
    setLoading(false);
  }

  function startOrderSound() {
    if ("vibrate" in navigator) {
      navigator.vibrate([500, 250, 500, 250, 500]);
    }
    if (!audioRef.current) {
      audioRef.current = new Audio("/sounds/new-order.mp3");
      audioRef.current.volume = 1;
    }

    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});

    if (alertIntervalRef.current) clearInterval(alertIntervalRef.current);

    alertIntervalRef.current = setInterval(() => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    }, 2500);
  }

  function stopOrderSound() {
    if (alertIntervalRef.current) {
      clearInterval(alertIntervalRef.current);
      alertIntervalRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setNewOrderAlert(null);
  }

  function enableSound() {
    if (!audioRef.current) {
      audioRef.current = new Audio("/sounds/new-order.mp3");
      audioRef.current.volume = 1;
    }

    audioRef.current
      .play()
      .then(() => {
        audioRef.current?.pause();
        if (audioRef.current) audioRef.current.currentTime = 0;

        setSoundEnabled(true);
        localStorage.setItem("avnt_sound_enabled", "1");
        alert("Đã bật âm thanh báo đơn.");
      })
      .catch(() => {
        alert("Trình duyệt chưa cho phát âm thanh. Anh bấm lại lần nữa.");
      });
  }

  async function updateOrderStatus(orderId: string, status: string) {
    const updateData =
      status === "new"
        ? {
            status,
            payment_status: "paid",
            payment_confirmed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        : {
            status,
            updated_at: new Date().toISOString(),
          };

    const { error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId);

    if (error) {
      alert("Không cập nhật được trạng thái đơn.");
      console.error(error);
      return;
    }

    if (status === "making" || status === "cancelled" || status === "new") {
      stopOrderSound();
    }

    fetchOrders();
  }

  const todayText = new Date().toLocaleDateString("vi-VN");

  const visibleOrders = orders.filter((order) => {
    const q = keyword.trim().toLowerCase();

    const matchKeyword =
      !q ||
      order.order_code.toLowerCase().includes(q) ||
      order.customer_name.toLowerCase().includes(q) ||
      order.customer_phone.toLowerCase().includes(q) ||
      order.customer_address.toLowerCase().includes(q);

    if (!matchKeyword) return false;

    if (filter === "all") return true;

    if (filter === "today") {
      return new Date(order.created_at).toLocaleDateString("vi-VN") === todayText;
    }

    if (filter === "customer_sent") {
      return order.payment_status === "customer_sent";
    }

    return order.status === filter;
  });

  const validOrders = orders.filter((order) => order.status !== "cancelled");

  const todayOrders = validOrders.filter(
    (order) => new Date(order.created_at).toLocaleDateString("vi-VN") === todayText
  );

  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);

  const newOrders = orders.filter((order) => order.status === "new").length;

  const pendingOrders = orders.filter((order) =>
    ["waiting_payment", "new", "making"].includes(order.status)
  ).length;

  const customerSentCount = orders.filter(
    (order) => order.payment_status === "customer_sent"
  ).length;
  function printOrder(order: Order) {
    const itemsHtml = order.order_items
      ?.map(
        (item) => `
          <div style="margin-bottom:8px;">
            <strong>${item.product_name} x${item.quantity}</strong>
            <div>${item.total.toLocaleString("vi-VN")}đ</div>
            ${
              item.toppings?.length
                ? `<div>Topping: ${item.toppings
                    .map((topping) => topping.name)
                    .join(", ")}</div>`
                : ""
            }
            ${item.spicy_level ? `<div>Độ cay: ${item.spicy_level}</div>` : ""}
            ${item.note ? `<div>Ghi chú: ${item.note}</div>` : ""}
          </div>
        `
      )
      .join("");
  
    const printWindow = window.open("", "_blank", "width=380,height=700");
  
    if (!printWindow) return;
  
    printWindow.document.write(`
      <html>
        <head>
          <title>Bill ${order.order_code}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              width: 280px;
              padding: 10px;
              font-size: 13px;
            }
            h2, p { margin: 4px 0; }
            .center { text-align: center; }
            .line { border-top: 1px dashed #000; margin: 10px 0; }
            .total { font-size: 18px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="center">
            <h2>ĂN VẶT NGỌC TRINH</h2>
            <p>240/127/22C Nguyễn Văn Luông, Q.6</p>
            <p>0392496220</p>
          </div>
  
          <div class="line"></div>
  
          <p><strong>Mã đơn:</strong> ${order.order_code}</p>
          <p><strong>Khách:</strong> ${order.customer_name}</p>
          <p><strong>SĐT:</strong> ${order.customer_phone}</p>
          <p><strong>Địa chỉ:</strong> ${order.customer_address}</p>
          <p><strong>Thời gian:</strong> ${new Date(
            order.created_at
          ).toLocaleString("vi-VN")}</p>
  
          <div class="line"></div>
  
          ${itemsHtml}
  
          <div class="line"></div>
  
          <p>Tạm tính: ${order.subtotal.toLocaleString("vi-VN")}đ</p>
          <p>Ship: ${order.shipping_fee.toLocaleString("vi-VN")}đ</p>
          ${
            order.promotion_name
              ? `<p>Ưu đãi: ${order.promotion_name} (-${Number(
                  order.promotion_discount || 0
                ).toLocaleString("vi-VN")}đ)</p>`
              : ""
          }
          <p class="total">Tổng: ${order.total.toLocaleString("vi-VN")}đ</p>
          <p>Thanh toán: ${
            order.payment_method === "momo" ? "Momo/CK" : "COD"
          }</p>
  
          <div class="line"></div>
  
          <p class="center">Cảm ơn quý khách!</p>
  
          <script>
            window.print();
          </script>
        </body>
      </html>
    `);
  
    printWindow.document.close();
  }
  return (
    <AdminLayout>
      {newOrderAlert && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
    <div className="w-full max-w-md rounded-[36px] bg-white p-6 text-center shadow-2xl">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#E8FFF1] text-4xl">
        🔔
      </div>

      <p className="mt-5 text-sm font-black text-[#00B14F]">
        BẠN CÓ ĐƠN HÀNG MỚI
      </p>

      <h2 className="mt-2 text-4xl font-black text-[#06113C]">
        #{newOrderAlert.order_code}
      </h2>

      <div className="mt-5 rounded-3xl bg-[#F5FFF8] p-5 text-left">
        <p className="font-black text-[#06113C]">
          👤 {newOrderAlert.customer_name}
        </p>

        <p className="mt-2 font-bold text-neutral-600">
          📞 {newOrderAlert.customer_phone}
        </p>

        <p className="mt-2 font-bold text-neutral-600">
          📍 {newOrderAlert.customer_address}
        </p>

        <p className="mt-4 text-2xl font-black text-[#00B14F]">
          {newOrderAlert.total.toLocaleString("vi-VN")}đ
        </p>
      </div>

      <button
        onClick={() =>
          updateOrderStatus(
            newOrderAlert.id,
            newOrderAlert.status === "waiting_payment" ? "new" : "making"
          )
        }
        className="mt-5 w-full rounded-2xl bg-[#00B14F] px-5 py-4 text-base font-black text-white"
      >
        {newOrderAlert.status === "waiting_payment"
          ? "Đã nhận tiền"
          : "Xác nhận đơn"}
      </button>

      <button
        onClick={stopOrderSound}
        className="mt-3 w-full rounded-2xl bg-neutral-100 px-5 py-4 text-sm font-black text-[#06113C]"
      >
        Để lát xử lý
      </button>
    </div>
  </div>
)}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-black text-[#00B14F]">Admin/POS</p>

          <h1 className="mt-1 text-4xl font-black text-[#06113C]">
            Quản lý đơn hàng
          </h1>

          <p className="mt-2 text-sm font-semibold text-neutral-500">
            Chờ thanh toán → Đơn mới → Đang làm → Hoàn thành.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <InstallAppButton />
            <PushNotificationSetup />
            <button
              onClick={enableSound}
              className={`rounded-2xl px-5 py-3 text-sm font-black text-white ${
                soundEnabled ? "bg-[#00B14F]" : "bg-red-500"
              }`}
            >
              {soundEnabled ? "Âm thanh đã bật" : "Bật âm thanh báo đơn"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white px-5 py-4 shadow-lg shadow-neutral-950/5">
          <p className="text-xs font-black text-neutral-400">
            Trạng thái hệ thống
          </p>
          <p className="mt-1 font-black text-[#00B14F]">● Realtime đang bật</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5">
          <p className="text-sm font-black text-neutral-400">Tổng đơn</p>
          <p className="mt-2 text-3xl font-black text-[#06113C]">
            {orders.length}
          </p>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5">
          <p className="text-sm font-black text-neutral-400">
            Doanh thu hôm nay
          </p>
          <p className="mt-2 text-3xl font-black text-[#06113C]">
            {todayRevenue.toLocaleString("vi-VN")}đ
          </p>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5">
          <p className="text-sm font-black text-neutral-400">Đơn mới</p>
          <p className="mt-2 text-3xl font-black text-blue-600">{newOrders}</p>
        </div>

        <div className="rounded-[28px] bg-yellow-50 p-5">
          <p className="text-sm font-black text-yellow-700">Khách báo CK</p>
          <p className="mt-2 text-3xl font-black text-yellow-700">
            {customerSentCount}
          </p>
          <p className="mt-2 text-xs font-bold text-yellow-700">
            Chờ quán kiểm tra tiền
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto]">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm theo mã đơn, tên, SĐT, địa chỉ..."
          className="rounded-2xl border border-black/10 bg-white px-5 py-4 font-bold outline-none focus:border-[#00B14F]"
        />

        <div className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#06113C] shadow-lg shadow-neutral-950/5">
          Đang hiển thị: {visibleOrders.length} đơn · Chờ xử lý: {pendingOrders}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 rounded-[28px] bg-white p-4 shadow-lg shadow-neutral-950/5">
        {filters.map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`rounded-2xl px-4 py-3 text-sm font-black ${
              filter === item.key
                ? "bg-[#00B14F] text-white"
                : "bg-[#F5FFF8] text-[#06113C]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-10 font-black text-[#06113C]">Đang tải đơn...</p>
      ) : (
        <div className="mt-8 grid gap-5 xl:grid-cols-5">
          {columns.map((column) => {
            const columnOrders = visibleOrders.filter(
              (order) => order.status === column.key
            );

            return (
              <div key={column.key} className={`rounded-[32px] p-4 ${column.color}`}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-black text-[#06113C]">
                    {column.title}
                  </h2>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${column.badge}`}
                  >
                    {columnOrders.length} đơn
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  {columnOrders.length === 0 ? (
                    <div className="rounded-[28px] bg-white/70 p-5 text-sm font-bold text-neutral-500">
                      Chưa có đơn.
                    </div>
                  ) : (
                    columnOrders.map((order) => (
                      <div
                        key={order.id}
                        className={`rounded-[28px] p-5 shadow-xl shadow-neutral-950/5 ${
                          order.payment_status === "customer_sent"
                            ? "bg-yellow-50 ring-2 ring-yellow-300"
                            : "bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-black text-neutral-400">
                              {new Date(order.created_at).toLocaleString("vi-VN")}
                            </p>

                            <h3 className="mt-1 text-xl font-black text-[#06113C]">
                              #{order.order_code}
                            </h3>
                          </div>

                          <div className="rounded-full bg-[#E8FFF1] px-3 py-1 text-xs font-black text-[#00B14F]">
                            {order.source || "Website"}
                          </div>
                        </div>

                        <div className="mt-4 space-y-2 text-sm font-bold text-neutral-600">
                          <p>
                            👤 {order.customer_name} · {order.customer_phone}
                          </p>
                          <p>📍 {order.customer_address}</p>
                        </div>

                        <div className="mt-4 rounded-2xl bg-[#F5FFF8] p-4">
                          <p className="text-xs font-black text-neutral-400">
                            Món đặt
                          </p>

                          <ul className="mt-2 space-y-2 text-sm font-black text-[#06113C]">
                            {order.order_items?.map((item) => (
                              <li key={item.id} className="rounded-2xl bg-white p-3">
                                <div className="flex justify-between gap-2">
                                  <span>
                                    • {item.product_name} x{item.quantity}
                                  </span>

                                  <span>
                                    {item.total.toLocaleString("vi-VN")}đ
                                  </span>
                                </div>

                                {item.toppings && item.toppings.length > 0 && (
                                  <p className="mt-1 text-xs font-bold text-neutral-500">
                                    Topping:{" "}
                                    {item.toppings
                                      .map((topping) => topping.name)
                                      .join(", ")}
                                  </p>
                                )}

                                {item.spicy_level && (
                                  <p className="mt-1 text-xs font-bold text-neutral-500">
                                    Độ cay: {item.spicy_level}
                                  </p>
                                )}

                                {item.note && (
                                  <p className="mt-1 text-xs font-bold text-neutral-500">
                                    Ghi chú món: {item.note}
                                  </p>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {order.note && (
                          <div className="mt-4 rounded-2xl bg-neutral-50 p-4">
                            <p className="text-xs font-black text-neutral-400">
                              Ghi chú đơn
                            </p>
                            <p className="mt-1 text-sm font-bold text-neutral-600">
                              {order.note}
                            </p>
                          </div>
                        )}

                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-sm font-bold text-neutral-500">
                            <span>Tạm tính</span>
                            <span>{order.subtotal.toLocaleString("vi-VN")}đ</span>
                          </div>

                          <div className="flex justify-between text-sm font-bold text-neutral-500">
                            <span>Ship sau ưu đãi</span>
                            <span>{order.shipping_fee.toLocaleString("vi-VN")}đ</span>
                          </div>

                          {order.promotion_name &&
                            Number(order.promotion_discount || 0) > 0 && (
                              <div className="rounded-2xl bg-[#E8FFF1] p-3">
                                <p className="text-xs font-black text-[#00B14F]">
                                  🎁 {order.promotion_name}
                                </p>

                                <div className="mt-1 flex justify-between text-sm font-bold text-neutral-600">
                                  <span>Giảm phí ship</span>
                                  <span className="font-black text-[#00B14F]">
                                    -
                                    {Number(
                                      order.promotion_discount || 0
                                    ).toLocaleString("vi-VN")}
                                    đ
                                  </span>
                                </div>
                              </div>
                            )}

                          <div className="flex justify-between border-t pt-3">
                            <span className="font-black text-[#06113C]">
                              Tổng
                            </span>

                            <span className="text-xl font-black text-[#00B14F]">
                              {order.total.toLocaleString("vi-VN")}đ
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl bg-[#F5FFF8] p-4">
                          <p className="text-xs font-black text-neutral-400">
                            Thanh toán & giao hàng
                          </p>

                          <div className="mt-2 space-y-1 text-sm font-bold text-neutral-600">
                            <p>
                              💳 Thanh toán:{" "}
                              {order.payment_method === "momo"
                                ? "Momo/Chuyển khoản"
                                : "COD"}
                            </p>

                            <p>
                              🧾 Trạng thái tiền:{" "}
                              {order.payment_status === "paid"
                                ? "Đã nhận tiền"
                                : order.payment_status === "customer_sent"
                                ? "Khách báo đã chuyển khoản"
                                : order.payment_method === "momo"
                                ? "Chờ quán kiểm tra"
                                : "Thu khi giao"}
                            </p>

                            <p>🚚 Khu vực ship: {order.delivery_area || "Chưa có"}</p>

                            <p>
                              📏 Khoảng cách tạm tính:{" "}
                              {order.delivery_distance_km || 0}km
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
  <button
    onClick={() => printOrder(order)}
    className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#06113C] ring-1 ring-black/10"
  >
    In bill
  </button>
                          {column.key !== "completed" &&
                            column.key !== "cancelled" && (
                              <button
                              onClick={() => {
                                if (column.next === "making") {
                                  printOrder(order);
                                }
                            
                                updateOrderStatus(order.id, column.next);
                              }}
                              className="rounded-2xl bg-[#06113C] px-4 py-3 text-sm font-black text-white"
                            >
                              {column.action}
                            </button>
                            )}

                          {column.key === "completed" && (
                            <button className="rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-black text-[#06113C]">
                              Đã hoàn thành
                            </button>
                          )}

                          {column.key === "cancelled" && (
                            <button className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-600">
                              Đã huỷ
                            </button>
                          )}

                          {column.key !== "completed" &&
                            column.key !== "cancelled" && (
                              <button
                                onClick={() =>
                                  updateOrderStatus(order.id, "cancelled")
                                }
                                className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-600"
                              >
                                Huỷ đơn
                              </button>
                            )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}