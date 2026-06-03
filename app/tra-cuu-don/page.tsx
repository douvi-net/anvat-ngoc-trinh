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
} else {
  setCustomerReward(null);
}

setLoading(false);
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
  return (
    <main className="min-h-screen bg-[#F5FFF8] px-4 py-10 md:px-8">
      <section className="mx-auto max-w-3xl">
        <div className="rounded-[36px] bg-white p-6 shadow-2xl shadow-neutral-950/10 md:p-8">
          <p className="font-black text-[#00B14F]">Ăn Vặt Ngọc Trinh</p>

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

        <div className="mt-6 space-y-5">
        {customerReward && (
  <div className="mt-6 rounded-[28px] bg-[#06113C] p-5 text-white shadow-xl">
    <p className="text-sm font-black text-[#00B14F]">Xu Ăn Vặt</p>

    <div className="mt-3 grid grid-cols-3 gap-3 text-center">
      <div className="rounded-2xl bg-white/10 p-3">
        <p className="text-2xl font-black">
          {customerReward.total_points || 0}
        </p>
        <p className="mt-1 text-xs font-bold text-white/60">Xu hiện có</p>
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