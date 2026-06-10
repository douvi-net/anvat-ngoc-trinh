"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  total: number;
  spicy_level: string | null;
  note: string | null;
  toppings: { name: string; price: number }[] | null;
};

type Order = {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
  status: string;
  payment_method: string | null;
  payment_status: string | null;
  created_at: string;
confirmed_at?: string | null;
preparation_minutes?: number | null;
delivery_minutes?: number | null;
estimated_delivery_from?: string | null;
estimated_delivery_to?: string | null;
promotion_name: string | null;
promotion_discount: number | null;
  order_items: OrderItem[];
};
type CustomerReward = {
  phone: string;
  name: string | null;
  total_points: number;
  total_orders: number;
  total_spent: number;
};
type Reward = {
  id: string;
  name: string;
  points_required: number;
  reward_value: number;
  description: string | null;
};

type RewardRedemption = {
  id: string;
  reward_name: string;
  points_used: number;
  code: string;
  status: string;
  expires_at: string | null;
  created_at: string;
};
const statusMap: Record<string, { label: string; color: string; desc: string }> = {
  waiting_payment: {
    label: "Chờ thanh toán",
    color: "bg-orange-100 text-orange-700",
    desc: "Quán đang chờ kiểm tra thanh toán.",
  },
  new: {
    label: "Đơn mới",
    color: "bg-blue-100 text-blue-700",
    desc: "Quán đã nhận đơn và sẽ xử lý sớm.",
  },
  making: {
    label: "Đang làm",
    color: "bg-yellow-100 text-yellow-700",
    desc: "Đơn của bạn đang được chuẩn bị.",
  },
  completed: {
    label: "Hoàn thành",
    color: "bg-green-100 text-green-700",
    desc: "Đơn hàng đã hoàn thành.",
  },
  cancelled: {
    label: "Đã huỷ",
    color: "bg-red-100 text-red-700",
    desc: "Đơn hàng đã bị huỷ.",
  },
};

export default function TrackOrderPage() {
  const [keyword, setKeyword] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [customerReward, setCustomerReward] = useState<CustomerReward | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
const [redeeming, setRedeeming] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      setKeyword(code);
      searchOrders(code);
    }
  }, []);

  async function searchOrders(input?: string) {
    const q = (input || keyword).trim();

    if (!q) {
      alert("Nhập mã đơn hoặc số điện thoại để tra cứu.");
      return;
    }

    setLoading(true);
    setSearched(true);

    const isOrderCode = q.toUpperCase().startsWith("AVNT");

    let query = supabase
      .from("orders")
      .select("*, order_items (*)")
      .order("created_at", { ascending: false })
      .limit(10);

    if (isOrderCode) {
      query = query.ilike("order_code", q.toUpperCase());
    } else {
      query = query.eq("customer_phone", q);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      alert("Không tra cứu được đơn. Vui lòng thử lại.");
      setLoading(false);
      return;
    }

    const foundOrders = (data || []) as Order[];
setOrders(foundOrders);

let phoneForReward = "";

if (isOrderCode && foundOrders.length > 0) {
  phoneForReward = foundOrders[0].customer_phone;
} else {
  phoneForReward = q;
}

if (phoneForReward) {
  const { data: customerData } = await supabase
    .from("customers")
    .select("phone,name,total_points,total_orders,total_spent")
    .eq("phone", phoneForReward)
    .maybeSingle();

  setCustomerReward((customerData || null) as CustomerReward | null);
  await fetchRewards();
await fetchRedemptions(phoneForReward);
} else {
  setCustomerReward(null);
  

}

setLoading(false);
  }
  async function fetchRewards() {
    const { data, error } = await supabase
      .from("rewards")
      .select("id,name,points_required,reward_value,description")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
  
    if (!error) {
      setRewards((data || []) as Reward[]);
    }
  }
  
  async function fetchRedemptions(phone: string) {
    const { data, error } = await supabase
      .from("reward_redemptions")
      .select("id,reward_name,points_used,code,status,expires_at,created_at")
      .eq("customer_phone", phone)
      .order("created_at", { ascending: false })
      .limit(5);
  
    if (!error) {
      setRedemptions((data || []) as RewardRedemption[]);
    }
  }
  
  function makeRewardCode() {
    return `RW-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }
  async function redeemReward(reward: Reward) {
    if (!customerReward) return;
  
    const currentPoints = Number(customerReward.total_points || 0);
  
    if (currentPoints < reward.points_required) {
      alert("Bạn chưa đủ xu để đổi quà này.");
      return;
    }
  
    const confirmed = confirm(
      `Đổi ${reward.points_required} xu để nhận "${reward.name}"?\n\nSau khi đổi, mã quà có hiệu lực 7 ngày.`
    );
  
    if (!confirmed) return;
  
    setRedeeming(true);
  
    try {
      const newPoints = currentPoints - reward.points_required;
      const code = makeRewardCode();
  
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
  
      const { error: updateError } = await supabase
        .from("customers")
        .update({
          total_points: newPoints,
          updated_at: new Date().toISOString(),
        })
        .eq("phone", customerReward.phone);
  
      if (updateError) throw updateError;
  
      const { error: redemptionError } = await supabase
        .from("reward_redemptions")
        .insert({
          customer_phone: customerReward.phone,
          reward_id: reward.id,
          reward_name: reward.name,
          points_used: reward.points_required,
          code,
          status: "unused",
          expires_at: expiresAt.toISOString(),
        });
  
      if (redemptionError) throw redemptionError;
  
      await supabase.from("points_history").insert({
        customer_phone: customerReward.phone,
        points: -reward.points_required,
        type: "reward",
        note: `Đổi ${reward.points_required} xu lấy quà: ${reward.name} - Mã ${code}`,
      });
  
      setCustomerReward({
        ...customerReward,
        total_points: newPoints,
      });
  
      await fetchRedemptions(customerReward.phone);
  
      alert(`Đổi quà thành công!\nMã quà của bạn: ${code}`);
    } catch (error) {
      console.error("REDEEM REWARD ERROR:", error);
      alert("Không đổi được quà. Vui lòng thử lại.");
    } finally {
      setRedeeming(false);
    }
  }
  function reorder(order: Order) {
    const reorderItems = order.order_items.map((item) => ({
      product_name: item.product_name,
      quantity: item.quantity,
      spicy_level: item.spicy_level || "Cay vừa",
      note: item.note || "",
      toppings: item.toppings || [],
    }));
  
    localStorage.setItem("avnt_reorder_items", JSON.stringify(reorderItems));
    window.location.href = "/dat-mon-nhanh?reorder=1";
  }
  async function markCustomerSentPayment(orderId: string) {
    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: "customer_sent",
        payment_note: "Khách báo đã chuyển khoản",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);
  
    if (error) {
      alert("Không cập nhật được trạng thái thanh toán.");
      return;
    }
  
    alert("Quán đã nhận được thông báo. Quán sẽ kiểm tra và xác nhận đơn.");
  
    searchOrders();
  }
  function formatTime(value?: string | null) {
    if (!value) return "";
  
    return new Date(value).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return (
    <main className="min-h-screen bg-[#F5FFF8] px-4 py-10 md:px-8">
      <section className="mx-auto max-w-3xl">
        <div className="rounded-[36px] bg-white p-6 shadow-2xl shadow-neutral-950/10 md:p-8">
        

          <h1 className="mt-2 text-4xl font-black text-[#06113C]">
            Tra cứu đơn hàng
          </h1>

          <p className="mt-3 text-sm font-semibold leading-6 text-neutral-500">
            Nhập mã đơn hoặc số điện thoại để xem trạng thái đơn hàng.
          </p>

          <div className="mt-6 flex flex-col gap-3 md:flex-row">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") searchOrders();
              }}
              placeholder="Ví dụ: AVNT123456 hoặc 0979..."
              className="flex-1 rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
            />

            <button
              onClick={() => searchOrders()}
              disabled={loading}
              className="rounded-2xl bg-[#00B14F] px-6 py-4 font-black text-white shadow-xl shadow-[#00B14F]/25 disabled:opacity-60"
            >
              {loading ? "Đang tra..." : "Tra cứu"}
            </button>
          </div>
        </div>
        {customerReward && (
  <div className="mt-6 rounded-[28px] bg-[#06113C] p-5 text-white shadow-xl">
    <p className="text-sm font-black text-[#00B14F]">Xu Ăn Vặt</p>

    <div className="mt-3 grid grid-cols-3 gap-3 text-center">
      <div className="rounded-2xl bg-white/10 p-3">
        <p className="text-2xl font-black">
          {customerReward.total_points || 0}
        </p>
        <p className="mt-1 text-xs font-bold text-white/60">Xu hiện có</p>
        {customerReward && rewards.length > 0 && (
  <div className="mt-5 rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5">
    <h2 className="text-xl font-black text-[#06113C]">
      🎁 Đổi quà bằng xu
    </h2>

    <p className="mt-1 text-sm font-bold text-neutral-500">
      Bạn đang có{" "}
      <span className="text-[#00B14F]">
        {customerReward.total_points || 0} xu
      </span>
    </p>

    <div className="mt-4 space-y-3">
      {rewards.map((reward) => {
        const canRedeem =
          Number(customerReward.total_points || 0) >=
          Number(reward.points_required || 0);

        return (
          <div
            key={reward.id}
            className={`rounded-2xl border p-4 ${
              canRedeem
                ? "border-[#00B14F]/30 bg-[#E8FFF1]"
                : "border-black/10 bg-neutral-50 opacity-70"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-[#06113C]">
                  {reward.name}
                </p>

                <p className="mt-1 text-sm font-bold text-neutral-500">
                  Cần {reward.points_required} xu · Giá trị{" "}
                  {Number(reward.reward_value || 0).toLocaleString("vi-VN")}đ
                </p>

                {reward.description && (
                  <p className="mt-1 text-xs font-bold text-neutral-400">
                    {reward.description}
                  </p>
                )}
              </div>

              <button
                type="button"
                disabled={!canRedeem || redeeming}
                onClick={() => redeemReward(reward)}
                className={`shrink-0 rounded-xl px-4 py-2 text-sm font-black ${
                  canRedeem
                    ? "bg-[#00B14F] text-white"
                    : "bg-neutral-200 text-neutral-500"
                }`}
              >
                {canRedeem ? "Đổi" : "Chưa đủ"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}
      </div>

      <div className="rounded-2xl bg-white/10 p-3">
        <p className="text-2xl font-black">
          {customerReward.total_orders || 0}
        </p>
        <p className="mt-1 text-xs font-bold text-white/60">Đơn đã mua</p>
      </div>

      <div className="rounded-2xl bg-white/10 p-3">
        <p className="text-lg font-black">
          {Number(customerReward.total_spent || 0).toLocaleString("vi-VN")}đ
        </p>
        <p className="mt-1 text-xs font-bold text-white/60">Đã chi tiêu</p>
      </div>
    </div>

    <p className="mt-4 rounded-2xl bg-white/10 p-3 text-xs font-bold text-white/70">
      10 Xu = giảm 1.000đ. Xu chỉ được cộng khi đơn hoàn thành.
    </p>
  </div>
)}
        <div className="mt-6 space-y-5">
        
          {searched && !loading && orders.length === 0 && (
            <div className="rounded-[28px] bg-white p-6 text-center font-bold text-neutral-500 shadow-xl shadow-neutral-950/5">
              Không tìm thấy đơn hàng phù hợp.
            </div>
          )}

          {orders.map((order) => {
            const status = statusMap[order.status] || {
              label: order.status,
              color: "bg-neutral-100 text-neutral-600",
              desc: "",
            };

            return (
              <div
                key={order.id}
                className="rounded-[36px] bg-white p-6 shadow-2xl shadow-neutral-950/10"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-black text-neutral-400">Mã đơn</p>
                    <h2 className="mt-1 text-3xl font-black text-[#06113C]">
                      #{order.order_code}
                    </h2>
                  </div>

                  <span
                    className={`w-fit rounded-full px-4 py-2 text-sm font-black ${status.color}`}
                  >
                    {status.label}
                  </span>
                </div>

                <p className="mt-4 rounded-2xl bg-[#F5FFF8] p-4 text-sm font-bold text-neutral-600">
                  {status.desc}
                </p>
                <div className="mt-4 rounded-2xl bg-[#E8FFF1] p-4">
  <p className="text-sm font-black text-[#06113C]">
    ⏱️ Thời gian dự kiến
  </p>

  {!order.confirmed_at ? (
    <p className="mt-2 text-sm font-bold text-neutral-600">
      Quán đang chờ xác nhận đơn. Thời gian nhận món sẽ được cập nhật sau khi
      quán xác nhận.
    </p>
  ) : order.estimated_delivery_from && order.estimated_delivery_to ? (
    <div className="mt-3 space-y-2 text-sm font-bold text-[#06113C]">
      <p>🍳 Làm món: khoảng {order.preparation_minutes || 0} phút</p>
      <p>🛵 Giao hàng: khoảng {order.delivery_minutes || 0} phút</p>
      <p className="text-base font-black text-[#00B14F]">
        📦 Dự kiến nhận món: {formatTime(order.estimated_delivery_from)} -{" "}
        {formatTime(order.estimated_delivery_to)}
      </p>
    </div>
  ) : (
    <p className="mt-2 text-sm font-bold text-yellow-700">
      Quán đã xác nhận đơn. Thời gian giao sẽ được cập nhật trong ít phút.
    </p>
  )}
</div>
                <div className="mt-5 rounded-2xl bg-[#F5FFF8] p-4">
                  <p className="text-xs font-black text-neutral-400">
                    Món đã đặt
                  </p>

                  <div className="mt-3 space-y-3">
                    {order.order_items?.map((item) => (
                      <div key={item.id} className="rounded-2xl bg-white p-3">
                        <div className="flex justify-between gap-3">
                          <p className="font-black text-[#06113C]">
                            {item.product_name} x{item.quantity}
                          </p>

                          <p className="font-black text-[#00B14F]">
                            {item.total.toLocaleString("vi-VN")}đ
                          </p>
                        </div>

                        {item.toppings && item.toppings.length > 0 && (
                          <p className="mt-1 text-xs font-bold text-neutral-500">
                            Topping:{" "}
                            {item.toppings.map((topping) => topping.name).join(", ")}
                          </p>
                        )}

                        {item.spicy_level && (
                          <p className="mt-1 text-xs font-bold text-neutral-500">
                            Độ cay: {item.spicy_level}
                          </p>
                        )}

                        {item.note && (
                          <p className="mt-1 text-xs font-bold text-neutral-500">
                            Ghi chú: {item.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-[#06113C] p-5 text-white">
                  <div className="flex justify-between text-sm font-bold text-white/70">
                    <span>Tạm tính</span>
                    <span>{order.subtotal.toLocaleString("vi-VN")}đ</span>
                  </div>

                  <div className="mt-2 flex justify-between text-sm font-bold text-white/70">
  <span>Ship sau ưu đãi</span>
  <span>{order.shipping_fee.toLocaleString("vi-VN")}đ</span>
</div>

{order.promotion_name && Number(order.promotion_discount || 0) > 0 && (
  <div className="mt-4 rounded-2xl bg-white/10 p-4">
    <p className="text-sm font-black text-[#00B14F]">
      🎁 {order.promotion_name}
    </p>

    <div className="mt-2 flex justify-between text-sm font-bold text-white/80">
      <span>Ưu đãi giao hàng</span>
      <span>-{Number(order.promotion_discount || 0).toLocaleString("vi-VN")}đ</span>
    </div>
  </div>
)}

                  <div className="mt-4 border-t border-white/20 pt-4">
                    <div className="flex justify-between text-xl font-black">
                      <span>Tổng cộng</span>
                      <span>{order.total.toLocaleString("vi-VN")}đ</span>
                    </div>
                  </div>

                  <p className="mt-4 text-xs font-semibold text-white/60">
                    Thanh toán:{" "}
                    {order.payment_method === "momo" ? "Momo/Chuyển khoản" : "COD"}
                  </p>
                  <button
  type="button"
  onClick={() => reorder(order)}
  className="mt-4 w-full rounded-2xl bg-[#00B14F] px-5 py-4 text-sm font-black text-white shadow-lg shadow-[#00B14F]/25"
>
  Mua lại đơn này
</button>
                  {order.status === "waiting_payment" &&
 order.payment_method === "momo" && (
  <div className="mt-5 rounded-3xl bg-white p-5 text-[#06113C]">
    <p className="text-center text-lg font-black">
      Quét mã để thanh toán
    </p>

    <div className="mt-4 flex justify-center">
      <img
        src="/images/payment-qr.jpg"
        alt="QR thanh toán"
        className="w-full max-w-[320px] rounded-3xl border"
      />
    </div>

    <div className="mt-4 rounded-2xl bg-[#F5FFF8] p-4">
      <p className="font-black">
        Nội dung chuyển khoản:
      </p>

      <p className="mt-2 text-xl font-black text-[#00B14F]">
        {order.order_code}
      </p>

      <p className="mt-4 font-black">
        Số tiền:
      </p>

      <p className="mt-2 text-2xl font-black text-[#00B14F]">
        {order.total.toLocaleString("vi-VN")}đ
      </p>
    </div>

    <p className="mt-4 text-center text-sm font-semibold text-neutral-500">
      Sau khi chuyển khoản quán sẽ xác nhận đơn.
    </p>
    <button
  onClick={() => markCustomerSentPayment(order.id)}
  className="mt-4 w-full rounded-2xl bg-[#00B14F] px-5 py-4 text-sm font-black text-white shadow-lg shadow-[#00B14F]/25"
>
  Tôi đã chuyển khoản
</button>
  </div>
)}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}