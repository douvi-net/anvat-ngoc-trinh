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
  confirmed_at?: string | null;
preparation_minutes?: number | null;
delivery_minutes?: number | null;
estimated_delivery_from?: string | null;
estimated_delivery_to?: string | null;
  promotion_name: string | null;
  promotion_discount: number | null;
  order_items: OrderItem[];
  points_used?: number | null;
points_discount?: number | null;
points_processed?: boolean | null;
};


type GoogleReviewReward = {
  id: string;
  order_id: string;
  customer_phone: string;
  customer_name: string | null;
  screenshot_url: string | null;
  status: "pending" | "approved" | "rejected";
  reward_points: number;
  points_awarded?: boolean | null;
  admin_note?: string | null;
  reviewed_at?: string | null;
  created_at: string;
};

type CustomerFlag = {
  phone: string;
  status: "normal" | "warning" | "blocked";
  note: string | null;
  flagged_by: string | null;
  created_at: string;
  updated_at: string;
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
    key: "need_confirm",
    title: "Cần xác nhận",
    color: "bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
    action: "Xác nhận đơn",
    next: "making",
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
  { key: "need_confirm", label: "Cần xác nhận" },
  { key: "new", label: "Đơn mới" },
  { key: "making", label: "Đang làm" },
  { key: "completed", label: "Hoàn thành" },
  { key: "cancelled", label: "Đã huỷ" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [googleReviewRewards, setGoogleReviewRewards] = useState<Record<string, GoogleReviewReward>>({});
  const [customerFlags, setCustomerFlags] = useState<Record<string, CustomerFlag>>({});
  const [processingFlagPhone, setProcessingFlagPhone] = useState("");
  const [processingGoogleReviewId, setProcessingGoogleReviewId] = useState("");
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "google_review_rewards" },
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
    const [orderResult, googleReviewResult, flagResult] = await Promise.all([
      supabase
        .from("orders")
        .select("*, order_items (*)")
        .order("created_at", { ascending: false }),

      supabase
        .from("google_review_rewards")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("customer_flags")
        .select("*")
        .order("updated_at", { ascending: false }),
    ]);

    if (orderResult.error) {
      console.error(orderResult.error);
      setLoading(false);
      return;
    }

    if (googleReviewResult.error) {
      console.error("GOOGLE REVIEW REWARD ERROR:", googleReviewResult.error);
    }

    if (flagResult.error) {
      console.error("CUSTOMER FLAGS ERROR:", flagResult.error);
    }

    const reviewMap: Record<string, GoogleReviewReward> = {};
    const flagMap: Record<string, CustomerFlag> = {};

    ((googleReviewResult.data || []) as GoogleReviewReward[]).forEach((item) => {
      reviewMap[item.order_id] = item;
    });

    ((flagResult.data || []) as CustomerFlag[]).forEach((item) => {
      flagMap[item.phone] = item;
    });

    setOrders((orderResult.data || []) as Order[]);
    setGoogleReviewRewards(reviewMap);
    setCustomerFlags(flagMap);
    setLoading(false);
  }

  function getSupabaseErrorMessage(error: any) {
    if (!error) return "Không rõ lỗi.";
    if (typeof error === "string") return error;
    return error.message || error.details || error.hint || JSON.stringify(error);
  }

  function getCustomerFlag(phone?: string | null) {
    const cleanPhone = String(phone || "").trim();
    return customerFlags[cleanPhone] || null;
  }

  function getFlagMeta(flag?: CustomerFlag | null) {
    if (!flag || flag.status === "normal") {
      return {
        label: "Bình thường",
        className: "bg-[#E8FFF1] text-[#00B14F] ring-[#00B14F]/20",
        icon: "🟢",
      };
    }

    if (flag.status === "warning") {
      return {
        label: "Cần xác nhận trước",
        className: "bg-yellow-50 text-yellow-700 ring-yellow-300",
        icon: "🟡",
      };
    }

    return {
      label: "Đang chặn đặt hàng",
      className: "bg-red-50 text-red-600 ring-red-200",
      icon: "🔴",
    };
  }

  async function updateCustomerFlag(
    phone: string,
    status: "normal" | "warning" | "blocked",
    defaultNote = ""
  ) {
    const cleanPhone = phone.trim();
    if (!cleanPhone) return;

    const note =
      status === "normal"
        ? ""
        : window.prompt(
            status === "warning"
              ? "Lý do đánh dấu khách cần xác nhận trước:"
              : "Lý do chặn khách đặt hàng:",
            defaultNote
          );

    if (status !== "normal" && note === null) return;

    const ok =
      status === "normal"
        ? window.confirm(`Gỡ cảnh báo/chặn cho số ${cleanPhone}?`)
        : window.confirm(
            status === "warning"
              ? `Đánh dấu số ${cleanPhone} là cần xác nhận trước?`
              : `Chặn số ${cleanPhone} đặt hàng?`
          );

    if (!ok) return;

    setProcessingFlagPhone(cleanPhone);

    try {
      const { error } = await supabase.from("customer_flags").upsert(
        {
          phone: cleanPhone,
          status,
          note: status === "normal" ? null : note || "",
          flagged_by: "admin",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "phone" }
      );

      if (error) throw error;

      await fetchOrders();
    } catch (error: any) {
      console.error("UPDATE CUSTOMER FLAG ERROR:", error);
      alert(`Không cập nhật được trạng thái khách: ${getSupabaseErrorMessage(error)}`);
    } finally {
      setProcessingFlagPhone("");
    }
  }

  async function approveGoogleReviewReward(reward: GoogleReviewReward) {
    if (!reward || reward.status === "approved" || reward.points_awarded) return;

    const ok = window.confirm(
      `Duyệt Google Maps review và cộng ${reward.reward_points || 20} xu cho khách ${reward.customer_phone}?`
    );

    if (!ok) return;

    setProcessingGoogleReviewId(reward.id);

    try {
      const { data, error } = await supabase.rpc("approve_google_review_reward", {
        p_reward_id: reward.id,
      });

      if (error) throw error;

      await fetchOrders();

      const rewardPoints =
        Number((data as any)?.reward_points || reward.reward_points || 20);

      alert(`Đã duyệt Google Maps review và cộng ${rewardPoints} xu cho khách.`);
    } catch (error: any) {
      console.error("APPROVE GOOGLE REVIEW ERROR:", error);

      const message = getSupabaseErrorMessage(error);

      if (message.includes("PHONE_ALREADY_REWARDED")) {
        alert("Số điện thoại này đã nhận thưởng Google Maps review rồi.");
        return;
      }

      if (message.includes("REWARD_NOT_FOUND")) {
        alert("Không tìm thấy yêu cầu Google Maps review này.");
        return;
      }

      if (message.includes("REWARD_NOT_PENDING")) {
        alert("Yêu cầu này không còn ở trạng thái chờ duyệt.");
        return;
      }

      alert(`Không duyệt được Google Maps review: ${message}`);
    } finally {
      setProcessingGoogleReviewId("");
    }
  }

  async function rejectGoogleReviewReward(reward: GoogleReviewReward) {
    if (!reward || reward.status !== "pending") return;

    const ok = window.confirm("Từ chối yêu cầu nhận xu Google Maps review này?");
    if (!ok) return;

    setProcessingGoogleReviewId(reward.id);

    try {
      const { error } = await supabase.rpc("reject_google_review_reward", {
        p_reward_id: reward.id,
        p_admin_note: "Admin từ chối vì chưa đủ điều kiện hoặc ảnh không hợp lệ.",
      });

      if (error) throw error;

      await fetchOrders();
    } catch (error: any) {
      console.error("REJECT GOOGLE REVIEW ERROR:", error);
      alert(`Không từ chối được yêu cầu: ${getSupabaseErrorMessage(error)}`);
    } finally {
      setProcessingGoogleReviewId("");
    }
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
  function estimatePreparationMinutes(itemCount: number) {
    if (itemCount <= 2) return 10;
    if (itemCount <= 5) return 15;
    if (itemCount <= 10) return 20;
    return 30;
  }
  
  function estimateDeliveryMinutes(distanceKm: number) {
    if (distanceKm <= 2) return 10;
    if (distanceKm <= 5) return 15;
    if (distanceKm <= 8) return 20;
    return 30;
  }
  async function updateOrderStatus(orderId: string, status: string) {
    let currentOrder = orders.find((item) => item.id === orderId);

if (!currentOrder) {
  const { data } = await supabase
    .from("orders")
    .select("*, order_items (*)")
    .eq("id", orderId)
    .single();

  currentOrder = data as Order;
}
  
    const now = new Date();

    let updateData: Record<string, any> =
      status === "new"
        ? {
            status,
            payment_status: "paid",
            payment_confirmed_at: now.toISOString(),
            updated_at: now.toISOString(),
          }
        : {
            status,
            updated_at: now.toISOString(),
          };
    
    if (currentOrder && status === "making") {
      const itemCount =
        currentOrder.order_items?.reduce(
          (sum, item) => sum + Number(item.quantity || 0),
          0
        ) || 1;
    
      const distanceKm = Number(currentOrder.delivery_distance_km || 2);
    
      const preparationMinutes = estimatePreparationMinutes(itemCount);
      const deliveryMinutes = estimateDeliveryMinutes(distanceKm);
    
      const estimatedFrom = new Date(
        now.getTime() + (preparationMinutes + deliveryMinutes) * 60 * 1000
      );
    
      const estimatedTo = new Date(estimatedFrom.getTime() + 10 * 60 * 1000);
    
      updateData = {
        ...updateData,
        confirmed_at: now.toISOString(),
        preparation_minutes: preparationMinutes,
        delivery_minutes: deliveryMinutes,
        estimated_delivery_from: estimatedFrom.toISOString(),
        estimated_delivery_to: estimatedTo.toISOString(),
      };
    }
  
    const { error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId);
  
    if (error) {
      alert("Không cập nhật được trạng thái đơn.");
      console.error(error);
      return;
    }
  
    if (
      currentOrder &&
      status === "completed" &&
      currentOrder.status !== "completed" &&
      !(currentOrder as any).points_processed
    ) {
      const phone = currentOrder.customer_phone?.trim();
      const orderTotal = Number(currentOrder.total || 0);
      const pointsUsed = Number(currentOrder.points_used || 0);
      const pointsEarned = Math.floor(orderTotal / 10000);

      if (phone) {
        const { data: existingHistory } = await supabase
          .from("points_history")
          .select("id")
          .eq("order_id", orderId)
          .eq("type", "complete")
          .maybeSingle();

        if (!existingHistory) {
          const { data: existingCustomer } = await supabase
            .from("customers")
            .select("*")
            .eq("phone", phone)
            .maybeSingle();

          const oldPoints = Number(existingCustomer?.total_points || 0);
          const oldSpent = Number(existingCustomer?.total_spent || 0);
          const newPoints = Math.max(0, oldPoints - pointsUsed + pointsEarned);

          if (existingCustomer) {
            await supabase
              .from("customers")
              .update({
                name: currentOrder.customer_name,
                total_points: newPoints,
                total_spent: oldSpent + orderTotal,
                updated_at: new Date().toISOString(),
              })
              .eq("phone", phone);
          } else {
            await supabase.from("customers").insert({
              phone,
              name: currentOrder.customer_name,
              total_points: Math.max(0, pointsEarned - pointsUsed),
              total_orders: 1,
              total_spent: orderTotal,
            });
          }

          if (pointsUsed > 0) {
            await supabase.from("points_history").insert({
              customer_phone: phone,
              order_id: orderId,
              points: -pointsUsed,
              type: "redeem",
              note: `Dùng ${pointsUsed} xu cho đơn ${currentOrder.order_code}`,
            });

            await supabase
              .from("reward_redemptions")
              .update({
                status: "used",
                used_at: new Date().toISOString(),
              })
              .eq("customer_phone", phone)
              .eq("code", `${currentOrder.order_code}-REWARD`);
          }

          if (pointsEarned > 0) {
            await supabase.from("points_history").insert({
              customer_phone: phone,
              order_id: orderId,
              points: pointsEarned,
              type: "earn",
              note: `Cộng ${pointsEarned} xu từ đơn ${currentOrder.order_code}`,
            });
          }

          await supabase.from("points_history").insert({
            customer_phone: phone,
            order_id: orderId,
            points: pointsEarned - pointsUsed,
            type: "complete",
            note: `Hoàn thành đơn ${currentOrder.order_code}`,
          });

          await supabase
            .from("orders")
            .update({
              points_processed: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);
        }
      }
    }

    if (
      currentOrder &&
      status === "cancelled" &&
      currentOrder.status !== "cancelled"
    ) {
      const phone = currentOrder.customer_phone?.trim();

      if (phone) {
        await supabase
          .from("reward_redemptions")
          .update({
            status: "cancelled",
          })
          .eq("customer_phone", phone)
          .eq("code", `${currentOrder.order_code}-REWARD`)
          .eq("status", "pending");
      }
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

  const pendingGoogleReviewCount = Object.values(googleReviewRewards).filter(
    (item) => item.status === "pending"
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

      <div className="mt-8 grid gap-4 md:grid-cols-5">
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

        <div className="rounded-[28px] bg-[#E8FFF1] p-5">
          <p className="text-sm font-black text-[#00B14F]">Google Review</p>
          <p className="mt-2 text-3xl font-black text-[#00B14F]">
            {pendingGoogleReviewCount}
          </p>
          <p className="mt-2 text-xs font-bold text-[#00B14F]">
            Chờ duyệt cộng xu
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

                        <div
                          className={`mt-4 rounded-2xl p-4 text-sm font-bold ring-1 ${
                            getFlagMeta(getCustomerFlag(order.customer_phone)).className
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-black">
                                {getFlagMeta(getCustomerFlag(order.customer_phone)).icon}{" "}
                                Khách: {getFlagMeta(getCustomerFlag(order.customer_phone)).label}
                              </p>

                              {getCustomerFlag(order.customer_phone)?.note && (
                                <p className="mt-1 text-xs font-bold opacity-80">
                                  Ghi chú: {getCustomerFlag(order.customer_phone)?.note}
                                </p>
                              )}

                              {order.status === "need_confirm" && (
                                <p className="mt-1 text-xs font-black">
                                  Đơn này đang chờ quán xác nhận trước khi làm món.
                                </p>
                              )}
                            </div>

                            <div className="flex shrink-0 flex-col gap-2">
                              {getCustomerFlag(order.customer_phone)?.status !== "warning" && (
                                <button
                                  type="button"
                                  disabled={processingFlagPhone === order.customer_phone}
                                  onClick={() =>
                                    updateCustomerFlag(
                                      order.customer_phone,
                                      "warning",
                                      "Khách cần xác nhận trước khi làm món."
                                    )
                                  }
                                  className="rounded-xl bg-yellow-100 px-3 py-2 text-xs font-black text-yellow-700 disabled:opacity-60"
                                >
                                  Cần xác nhận
                                </button>
                              )}

                              {getCustomerFlag(order.customer_phone)?.status !== "blocked" && (
                                <button
                                  type="button"
                                  disabled={processingFlagPhone === order.customer_phone}
                                  onClick={() =>
                                    updateCustomerFlag(
                                      order.customer_phone,
                                      "blocked",
                                      "Khách có dấu hiệu đặt ảo/boom hàng."
                                    )
                                  }
                                  className="rounded-xl bg-red-100 px-3 py-2 text-xs font-black text-red-600 disabled:opacity-60"
                                >
                                  Chặn
                                </button>
                              )}

                              {getCustomerFlag(order.customer_phone)?.status &&
                                getCustomerFlag(order.customer_phone)?.status !== "normal" && (
                                  <button
                                    type="button"
                                    disabled={processingFlagPhone === order.customer_phone}
                                    onClick={() =>
                                      updateCustomerFlag(order.customer_phone, "normal")
                                    }
                                    className="rounded-xl bg-white px-3 py-2 text-xs font-black text-[#06113C] ring-1 ring-black/10 disabled:opacity-60"
                                  >
                                    Gỡ
                                  </button>
                                )}
                            </div>
                          </div>
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

                        {googleReviewRewards[order.id] && (
                          <div
                            className={`mt-4 rounded-2xl p-4 ${
                              googleReviewRewards[order.id].status === "pending"
                                ? "bg-yellow-50 ring-1 ring-yellow-300"
                                : googleReviewRewards[order.id].status === "approved"
                                ? "bg-[#E8FFF1] ring-1 ring-[#00B14F]/30"
                                : "bg-red-50 ring-1 ring-red-200"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-black text-neutral-500">
                                  ⭐ Google Maps review
                                </p>

                                <p className="mt-1 text-sm font-black text-[#06113C]">
                                  {googleReviewRewards[order.id].status === "pending"
                                    ? `Chờ duyệt +${googleReviewRewards[order.id].reward_points || 20} xu`
                                    : googleReviewRewards[order.id].status === "approved"
                                    ? `Đã duyệt +${googleReviewRewards[order.id].reward_points || 20} xu`
                                    : "Đã từ chối"}
                                </p>

                                <p className="mt-1 text-xs font-bold text-neutral-500">
                                  Gửi lúc{" "}
                                  {new Date(
                                    googleReviewRewards[order.id].created_at
                                  ).toLocaleString("vi-VN")}
                                </p>
                              </div>

                              {googleReviewRewards[order.id].screenshot_url && (
                                <a
                                  href={googleReviewRewards[order.id].screenshot_url || "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-black text-[#06113C] ring-1 ring-black/10"
                                >
                                  Xem ảnh
                                </a>
                              )}
                            </div>

                            {googleReviewRewards[order.id].status === "pending" && (
                              <div className="mt-3 grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  disabled={
                                    processingGoogleReviewId ===
                                    googleReviewRewards[order.id].id
                                  }
                                  onClick={() =>
                                    approveGoogleReviewReward(
                                      googleReviewRewards[order.id]
                                    )
                                  }
                                  className="rounded-xl bg-[#00B14F] px-3 py-2 text-xs font-black text-white disabled:opacity-60"
                                >
                                  Duyệt + xu
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    processingGoogleReviewId ===
                                    googleReviewRewards[order.id].id
                                  }
                                  onClick={() =>
                                    rejectGoogleReviewReward(
                                      googleReviewRewards[order.id]
                                    )
                                  }
                                  className="rounded-xl bg-red-100 px-3 py-2 text-xs font-black text-red-600 disabled:opacity-60"
                                >
                                  Từ chối
                                </button>
                              </div>
                            )}

                            {googleReviewRewards[order.id].admin_note && (
                              <p className="mt-2 text-xs font-bold text-neutral-500">
                                Ghi chú: {googleReviewRewards[order.id].admin_note}
                              </p>
                            )}
                          </div>
                        )}

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