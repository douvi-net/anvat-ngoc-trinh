"use client";

import { useEffect, useRef, useState } from "react";
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

type OrderReview = {
  id: string;
  order_id: string;
  rating: number;
  comment: string | null;
  reward_points: number;
  created_at: string;
};

type GoogleReviewReward = {
  id: string;
  order_id: string;
  customer_phone: string;
  customer_name: string | null;
  screenshot_url: string | null;
  status: "pending" | "approved" | "rejected" | string;
  reward_points: number;
  reviewed_at: string | null;
  created_at: string;
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
  order_reviews?: OrderReview[];
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
const REVIEW_REWARD_POINTS = 5;
const GOOGLE_REVIEW_REWARD_POINTS = 20;
const GOOGLE_MAPS_REVIEW_URL = "https://maps.app.goo.gl/BWLqLKMz1V77BPKw7";
const GOOGLE_REVIEW_BUCKET = "google-review-screenshots";

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
  const [activeTab, setActiveTab] = useState<"orders" | "rewards">("orders");
  const [trackedKeyword, setTrackedKeyword] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [reviewRatings, setReviewRatings] = useState<Record<string, number>>({});
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});
  const [reviewingOrderId, setReviewingOrderId] = useState("");
  const silentRefreshRef = useRef(false);
  const [orderReviews, setOrderReviews] = useState<Record<string, OrderReview>>({});
  const [googleReviewRewards, setGoogleReviewRewards] = useState<Record<string, GoogleReviewReward>>({});
  const [googleReviewFiles, setGoogleReviewFiles] = useState<Record<string, File | null>>({});
  const [submittingGoogleReviewOrderId, setSubmittingGoogleReviewOrderId] = useState("");
  useEffect(() => {
    fetchRewards();

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      setKeyword(code);
      searchOrders(code);
    }
  }, []);

  async function searchOrders(input?: string, silent = false) {
    const q = (input || keyword).trim();

    if (!q) {
      alert("Nhập mã đơn hoặc số điện thoại để tra cứu.");
      return;
    }

    if (!silent) {
      setLoading(true);
    }
    setSearched(true);
    setTrackedKeyword(q);

    const isOrderCode = q.toUpperCase().startsWith("AVNT");

    let query = supabase
      .from("orders")
      .select("*, order_items (*), order_reviews (*)")
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
      if (!silent) {
        setLoading(false);
      }
      return;
    }

    const rawOrders = (data || []) as Order[];
    const orderIds = rawOrders.map((order) => order.id);

    let reviewMap: Record<string, OrderReview> = {};
    let googleReviewMap: Record<string, GoogleReviewReward> = {};

    if (orderIds.length > 0) {
      const { data: reviewData, error: reviewError } = await supabase
        .from("order_reviews")
        .select("id,order_id,rating,comment,reward_points,created_at")
        .in("order_id", orderIds);

      if (!reviewError && reviewData) {
        reviewData.forEach((review) => {
          reviewMap[review.order_id] = review as OrderReview;
        });
      }

      const { data: googleReviewData, error: googleReviewError } = await supabase
        .from("google_review_rewards")
        .select("id,order_id,customer_phone,customer_name,screenshot_url,status,reward_points,reviewed_at,created_at")
        .in("order_id", orderIds);

      if (!googleReviewError && googleReviewData) {
        googleReviewData.forEach((item) => {
          googleReviewMap[item.order_id] = item as GoogleReviewReward;
        });
      }
    }

    const foundOrders = rawOrders.map((order) => ({
      ...order,
      order_reviews: reviewMap[order.id]
        ? [reviewMap[order.id]]
        : order.order_reviews || [],
    }));

    setOrders(foundOrders);
    setOrderReviews(reviewMap);
    setGoogleReviewRewards(googleReviewMap);
    setLastUpdatedAt(new Date());

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

    setCustomerReward(
      customerData
        ? (customerData as CustomerReward)
        : {
            phone: phoneForReward,
            name: null,
            total_points: 0,
            total_orders: 0,
            total_spent: 0,
          }
    );
    
    await fetchRewards();
} else {
  setCustomerReward(null);
  

}

if (!silent) {
  setLoading(false);
}
  }

  useEffect(() => {
    const q = trackedKeyword.trim();

    if (!searched || !q) return;

    const timer = window.setInterval(() => {
      searchOrders(q, true);
    }, 10000);

    return () => window.clearInterval(timer);
  }, [searched, trackedKeyword]);

  useEffect(() => {
    const q = trackedKeyword.trim();

    if (!searched || !q) return;

    const channel = supabase
      .channel(`avnt-track-order-${q}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          if (silentRefreshRef.current) return;
          silentRefreshRef.current = true;

          window.setTimeout(() => {
            searchOrders(q, true).finally(() => {
              silentRefreshRef.current = false;
            });
          }, 400);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items" },
        () => {
          if (silentRefreshRef.current) return;
          silentRefreshRef.current = true;

          window.setTimeout(() => {
            searchOrders(q, true).finally(() => {
              silentRefreshRef.current = false;
            });
          }, 400);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_reviews" },
        () => {
          if (silentRefreshRef.current) return;
          silentRefreshRef.current = true;

          window.setTimeout(() => {
            searchOrders(q, true).finally(() => {
              silentRefreshRef.current = false;
            });
          }, 400);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "google_review_rewards" },
        () => {
          if (silentRefreshRef.current) return;
          silentRefreshRef.current = true;

          window.setTimeout(() => {
            searchOrders(q, true).finally(() => {
              silentRefreshRef.current = false;
            });
          }, 400);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [searched, trackedKeyword]);

  async function fetchRewards() {
    const { data, error } = await supabase
      .from("rewards")
      .select("id,name,points_required,reward_value,description")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
  
    console.log("FETCH REWARDS:", data, error);
  
    if (error) {
      console.error("FETCH REWARDS ERROR:", error);
      setRewards([]);
      return;
    }
  
    setRewards((data || []) as Reward[]);
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
  async function submitReview(order: Order) {
    const rating = reviewRatings[order.id] || 5;
    const comment = (reviewComments[order.id] || "").trim();

    if (order.status !== "completed") {
      alert("Đơn hoàn thành mới đánh giá được nha.");
      return;
    }

    if (orderReviews[order.id] || (order.order_reviews && order.order_reviews.length > 0)) {
      return;
    }

    setReviewingOrderId(order.id);

    const { data, error } = await supabase.rpc("submit_order_review", {
      p_order_id: order.id,
      p_rating: rating,
      p_comment: comment,
    });

    setReviewingOrderId("");

    if (error) {
      console.error("SUBMIT REVIEW ERROR:", error);

      const message = String(error.message || "");

      if (message.includes("ALREADY_REVIEWED")) {
        const { data: existingReview } = await supabase
          .from("order_reviews")
          .select("id,order_id,rating,comment,reward_points,created_at")
          .eq("order_id", order.id)
          .maybeSingle();

        if (existingReview) {
          const review = existingReview as OrderReview;

          setOrderReviews((prev) => ({
            ...prev,
            [order.id]: review,
          }));

          setOrders((prev) =>
            prev.map((item) =>
              item.id === order.id
                ? { ...item, order_reviews: [review] }
                : item
            )
          );
        }

        return;
      }

      if (message.includes("ORDER_NOT_COMPLETED")) {
        alert("Đơn hoàn thành mới đánh giá được nha.");
      } else {
        alert("Không gửi được đánh giá. Anh/chị thử lại giúp quán nha.");
      }

      return;
    }

    const rewardPoints = Number(data?.reward_points || REVIEW_REWARD_POINTS);

    const newReview: OrderReview = {
      id: `local-${order.id}`,
      order_id: order.id,
      rating,
      comment: comment || null,
      reward_points: rewardPoints,
      created_at: new Date().toISOString(),
    };

    setOrderReviews((prev) => ({
      ...prev,
      [order.id]: newReview,
    }));

    setOrders((prev) =>
      prev.map((item) =>
        item.id === order.id
          ? { ...item, order_reviews: [newReview] }
          : item
      )
    );

    setReviewComments((prev) => ({
      ...prev,
      [order.id]: "",
    }));

    alert(`Cảm ơn anh/chị đã đánh giá. Quán đã cộng ${rewardPoints} xu vào tài khoản.`);
    searchOrders(trackedKeyword || keyword, true);
  }

  function safeFileName(name: string) {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .toLowerCase();
  }

  async function submitGoogleReview(order: Order) {
    const existing = googleReviewRewards[order.id];

    if (existing?.status === "pending") {
      alert("Ảnh đánh giá Google Maps của đơn này đang chờ quán duyệt.");
      return;
    }

    if (existing?.status === "approved") {
      alert("Đơn này đã được duyệt thưởng Google Maps rồi nha.");
      return;
    }

    const file = googleReviewFiles[order.id];

    if (!file) {
      alert("Anh/chị vui lòng tải ảnh chụp màn hình đánh giá Google Maps trước nha.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("File tải lên phải là hình ảnh.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Ảnh hơi nặng. Anh/chị chọn ảnh dưới 5MB giúp quán nha.");
      return;
    }

    setSubmittingGoogleReviewOrderId(order.id);

    try {
      const filePath = `${order.id}/${Date.now()}-${safeFileName(file.name)}`;

      const { error: uploadError } = await supabase.storage
        .from(GOOGLE_REVIEW_BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("UPLOAD GOOGLE REVIEW ERROR:", uploadError);
        console.log(uploadError);
alert(uploadError?.message || "Upload thất bại");
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from(GOOGLE_REVIEW_BUCKET)
        .getPublicUrl(filePath);

      const payload = {
        order_id: order.id,
        customer_phone: order.customer_phone,
        customer_name: order.customer_name,
        screenshot_url: publicUrlData.publicUrl,
        status: "pending",
        reward_points: GOOGLE_REVIEW_REWARD_POINTS,
      };

      let savedReward: GoogleReviewReward | null = null;

      if (existing?.status === "rejected") {
        const { data, error } = await supabase
          .from("google_review_rewards")
          .update({
            screenshot_url: payload.screenshot_url,
            status: "pending",
            reward_points: GOOGLE_REVIEW_REWARD_POINTS,
            reviewed_at: null,
          })
          .eq("id", existing.id)
          .select("id,order_id,customer_phone,customer_name,screenshot_url,status,reward_points,reviewed_at,created_at")
          .single();

        if (error) throw error;
        savedReward = data as GoogleReviewReward;
      } else {
        const { data, error } = await supabase
          .from("google_review_rewards")
          .insert(payload)
          .select("id,order_id,customer_phone,customer_name,screenshot_url,status,reward_points,reviewed_at,created_at")
          .single();

        if (error) throw error;
        savedReward = data as GoogleReviewReward;
      }

      setGoogleReviewRewards((prev) => ({
        ...prev,
        [order.id]: savedReward as GoogleReviewReward,
      }));

      setGoogleReviewFiles((prev) => ({
        ...prev,
        [order.id]: null,
      }));

      alert("Quán đã nhận ảnh đánh giá Google Maps. Sau khi duyệt, hệ thống sẽ cộng +20 xu.");
    } catch (error: any) {
      console.error("SUBMIT GOOGLE REVIEW ERROR:", error);

      const message = String(error?.message || "");

      if (message.includes("duplicate") || message.includes("unique")) {
        alert("Đơn này đã gửi đánh giá Google Maps rồi nha.");
        searchOrders(trackedKeyword || keyword, true);
      } else {
        alert("Không gửi được ảnh đánh giá Google Maps. Anh/chị thử lại giúp quán nha.");
      }
    } finally {
      setSubmittingGoogleReviewOrderId("");
    }
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
      10.000đ = 1 xu. Xu được cộng khi đơn hoàn thành.
    </p>

    <button
      type="button"
      onClick={() => {
        window.location.href = "/dat-mon-nhanh";
      }}
      className="mt-4 w-full rounded-2xl bg-[#00B14F] px-5 py-4 text-sm font-black text-white shadow-lg shadow-[#00B14F]/25"
    >
      Đặt món mới để dùng xu đổi quà
    </button>
  </div>
)}
        <div className="mt-6 rounded-[28px] bg-white p-2 shadow-lg shadow-neutral-950/5">
          <div className="grid grid-cols-2 gap-2 rounded-3xl bg-[#F5FFF8] p-2">
            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                activeTab === "orders"
                  ? "bg-[#00B14F] text-white shadow-lg shadow-[#00B14F]/20"
                  : "text-[#06113C]"
              }`}
            >
              📦 Đơn hàng
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("rewards")}
              className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                activeTab === "rewards"
                  ? "bg-[#00B14F] text-white shadow-lg shadow-[#00B14F]/20"
                  : "text-[#06113C]"
              }`}
            >
              🎁 Điều kiện nhận quà
            </button>
          </div>
        </div>

        {activeTab === "orders" && (
        <div className="mt-6 space-y-5">
          {searched && orders.length > 0 && (
            <div className="rounded-[24px] bg-white p-4 text-sm font-bold text-neutral-500 shadow-lg shadow-neutral-950/5">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <span>
                  🔄 Trạng thái đơn sẽ tự cập nhật khi quán xử lý.
                </span>

                {lastUpdatedAt && (
                  <span className="text-xs font-black text-[#00B14F]">
                    Cập nhật lúc {lastUpdatedAt.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                )}
              </div>
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

                {order.status === "completed" && (
                  <div className="mt-5 rounded-[28px] border border-yellow-200 bg-yellow-50 p-5">
                    {(() => {
                      const existingReview =
                        orderReviews[order.id] ||
                        (order.order_reviews && order.order_reviews.length > 0
                          ? order.order_reviews[0]
                          : null);

                      if (existingReview) {
                        const rating = Number(existingReview.rating || 5);

                        return (
                          <div>
                            <p className="text-lg font-black text-[#06113C]">
                              ⭐ Bạn đã đánh giá đơn hàng
                            </p>

                            <p className="mt-2 text-sm font-bold text-neutral-600">
                              Cảm ơn anh/chị đã góp ý cho quán. Đơn này đã được
                              cộng{" "}
                              <span className="font-black text-[#00B14F]">
                                +{existingReview.reward_points || REVIEW_REWARD_POINTS} xu
                              </span>
                              .
                            </p>

                            <div className="mt-4 rounded-2xl bg-white p-4">
                              <p className="text-2xl text-yellow-500">
                                {"★".repeat(rating)}
                                <span className="text-neutral-300">
                                  {"☆".repeat(5 - rating)}
                                </span>
                              </p>

                              {existingReview.comment && (
                                <p className="mt-3 rounded-2xl bg-[#F5FFF8] p-3 text-sm font-bold text-neutral-600">
                                  “{existingReview.comment}”
                                </p>
                              )}

                              <p className="mt-3 text-xs font-black text-[#B45309]">
                                Đánh giá đã được ghi nhận. Mỗi đơn chỉ nhận xu
                                đánh giá 1 lần.
                              </p>
                            </div>

                            <div className="mt-4 rounded-2xl border border-[#00B14F]/20 bg-[#F5FFF8] p-4">
                              {(() => {
                                const googleReward = googleReviewRewards[order.id];

                                if (googleReward?.status === "approved") {
                                  return (
                                    <div>
                                      <p className="font-black text-[#06113C]">
                                        ✅ Google Maps review đã được duyệt
                                      </p>
                                      <p className="mt-1 text-sm font-bold text-neutral-600">
                                        Quán đã cộng{" "}
                                        <span className="font-black text-[#00B14F]">
                                          +{googleReward.reward_points || GOOGLE_REVIEW_REWARD_POINTS} xu
                                        </span>{" "}
                                        cho đánh giá Google Maps của anh/chị.
                                      </p>
                                      {googleReward.screenshot_url && (
                                        <a
                                          href={googleReward.screenshot_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="mt-3 inline-flex text-xs font-black text-[#00B14F]"
                                        >
                                          Xem ảnh đã gửi →
                                        </a>
                                      )}
                                    </div>
                                  );
                                }

                                if (googleReward?.status === "pending") {
                                  return (
                                    <div>
                                      <p className="font-black text-[#06113C]">
                                        ⏳ Google Maps review đang chờ duyệt
                                      </p>
                                      <p className="mt-1 text-sm font-bold text-neutral-600">
                                        Quán đã nhận ảnh. Sau khi admin xác nhận,
                                        hệ thống sẽ cộng +{googleReward.reward_points || GOOGLE_REVIEW_REWARD_POINTS} xu.
                                      </p>
                                      {googleReward.screenshot_url && (
                                        <a
                                          href={googleReward.screenshot_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="mt-3 inline-flex text-xs font-black text-[#00B14F]"
                                        >
                                          Xem ảnh đã gửi →
                                        </a>
                                      )}
                                    </div>
                                  );
                                }

                                return (
                                  <div>
                                    <p className="font-black text-[#06113C]">
                                      📍 Đánh giá Google Maps nhận +{GOOGLE_REVIEW_REWARD_POINTS} xu
                                    </p>

                                    <p className="mt-1 text-sm font-bold leading-6 text-neutral-600">
                                      Sau khi đã đánh giá đơn hàng trên web, anh/chị có thể
                                      đánh giá quán trên Google Maps và gửi ảnh chụp màn hình
                                      để quán duyệt cộng xu.
                                    </p>

                                    {googleReward?.status === "rejected" && (
                                      <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600">
                                        Ảnh trước đó chưa được duyệt. Anh/chị có thể gửi lại ảnh rõ hơn.
                                      </p>
                                    )}

                                    <a
                                      href={GOOGLE_MAPS_REVIEW_URL}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="mt-3 inline-flex w-full justify-center rounded-2xl bg-[#00B14F] px-4 py-3 text-sm font-black text-white"
                                    >
                                      Mở Google Maps để đánh giá
                                    </a>

                                    <label className="mt-3 block rounded-2xl bg-white p-4 text-sm font-bold text-neutral-600 ring-1 ring-black/10">
                                      <span className="block font-black text-[#06113C]">
                                        Tải ảnh chụp màn hình review
                                      </span>

                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0] || null;
                                          setGoogleReviewFiles((prev) => ({
                                            ...prev,
                                            [order.id]: file,
                                          }));
                                        }}
                                        className="mt-3 block w-full text-xs font-bold"
                                      />

                                      {googleReviewFiles[order.id] && (
                                        <span className="mt-2 block text-xs font-black text-[#00B14F]">
                                          Đã chọn: {googleReviewFiles[order.id]?.name}
                                        </span>
                                      )}
                                    </label>

                                    <button
                                      type="button"
                                      onClick={() => submitGoogleReview(order)}
                                      disabled={submittingGoogleReviewOrderId === order.id}
                                      className="mt-3 w-full rounded-2xl bg-[#06113C] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
                                    >
                                      {submittingGoogleReviewOrderId === order.id
                                        ? "Đang gửi ảnh..."
                                        : `Gửi ảnh chờ duyệt · Nhận +${GOOGLE_REVIEW_REWARD_POINTS} xu`}
                                    </button>

                                    <p className="mt-3 text-xs font-bold leading-5 text-neutral-500">
                                      Mỗi đơn chỉ gửi Google Maps review 1 lần. Xu chỉ được cộng
                                      sau khi quán kiểm tra ảnh hợp lệ.
                                    </p>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div>
                          <p className="text-lg font-black text-[#06113C]">
                            ⭐ Đánh giá đơn hàng
                          </p>

                          <p className="mt-1 text-sm font-bold text-neutral-600">
                            Đánh giá trải nghiệm để nhận +{REVIEW_REWARD_POINTS} xu. Mỗi đơn chỉ nhận xu 1 lần.
                          </p>

                          <div className="mt-4 flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => {
                              const current = reviewRatings[order.id] || 5;

                              return (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() =>
                                    setReviewRatings((prev) => ({
                                      ...prev,
                                      [order.id]: star,
                                    }))
                                  }
                                  className={`text-3xl ${
                                    star <= current ? "text-yellow-500" : "text-neutral-300"
                                  }`}
                                >
                                  ★
                                </button>
                              );
                            })}
                          </div>

                          <textarea
                            value={reviewComments[order.id] || ""}
                            onChange={(e) =>
                              setReviewComments((prev) => ({
                                ...prev,
                                [order.id]: e.target.value,
                              }))
                            }
                            placeholder="Góp ý cho quán nếu có..."
                            rows={3}
                            className="mt-4 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#00B14F]"
                          />

                          <button
                            type="button"
                            onClick={() => submitReview(order)}
                            disabled={reviewingOrderId === order.id}
                            className="mt-4 w-full rounded-2xl bg-[#00B14F] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
                          >
                            {reviewingOrderId === order.id
                              ? "Đang gửi đánh giá..."
                              : `Gửi đánh giá · Nhận +${REVIEW_REWARD_POINTS} xu`}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}

        {activeTab === "rewards" && (
          rewards.length > 0 ? (
<div className="rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5">
            <h2 className="text-xl font-black text-[#06113C]">
              🎁 Điều kiện nhận quà
            </h2>

            <p className="mt-2 text-sm font-bold leading-6 text-neutral-500">
              Quà sẽ được đổi trực tiếp trong phần thanh toán khi khách đặt món mới.
              Không cần lấy mã, không cần xác nhận riêng tại quán.
            </p>

            <div className="mt-4 space-y-3">
              {rewards.map((reward) => {
                const currentPoints = Number(customerReward?.total_points || 0);
                const requiredPoints = Number(reward.points_required || 0);
                const canRedeem = currentPoints >= requiredPoints;

                return (
                  <div
                    key={reward.id}
                    className={`rounded-2xl border p-4 ${
                      canRedeem
                        ? "border-[#00B14F]/30 bg-[#E8FFF1]"
                        : "border-black/10 bg-neutral-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-[#06113C]">
                          {reward.name}
                        </p>

                        <p className="mt-1 text-sm font-bold text-neutral-500">
                          Cần {requiredPoints} xu
                          {Number(reward.reward_value || 0) > 0
                            ? ` · Giá trị ${Number(reward.reward_value || 0).toLocaleString("vi-VN")}đ`
                            : ""}
                        </p>

                        {reward.description && (
                          <p className="mt-1 text-xs font-bold text-neutral-400">
                            {reward.description}
                          </p>
                        )}
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                          canRedeem
                            ? "bg-[#00B14F] text-white"
                            : "bg-neutral-200 text-neutral-500"
                        }`}
                      >
                        {canRedeem ? "Đủ xu" : "Chưa đủ"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 rounded-2xl bg-[#F5FFF8] p-4 text-xs font-bold leading-5 text-neutral-500">
              Mỗi đơn chỉ nên đổi tối đa 1 quà. Quà đổi xu sẽ được hiển thị trong
              đơn đặt món mới để quán làm chung với món khách đã đặt.
            </p>
          </div>
          ) : (
            <div className="mt-6 rounded-[28px] bg-white p-6 text-center font-bold text-neutral-500 shadow-xl shadow-neutral-950/5">
              Chưa có điều kiện quà tặng. Vui lòng thử lại sau.
            </div>
          )
        )}


      </section>
    </main>
  );
}