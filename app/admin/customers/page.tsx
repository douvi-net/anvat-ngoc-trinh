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
  total_points?: number | null;
  created_at: string;
  updated_at: string | null;
};

type Order = {
  id: string;
  order_code?: string | null;
  customer_id: string | null;
  customer_phone: string;
  total: number;
  status: string;
  created_at: string;
};

type CustomerFlag = {
  phone: string;
  status: "normal" | "warning" | "blocked" | string;
  note: string | null;
  updated_at?: string | null;
};

type OrderReview = {
  id: string;
  customer_phone: string;
  rating: number;
  reward_points: number;
  created_at: string;
};

type GoogleReviewReward = {
  id: string;
  customer_phone: string;
  status: "pending" | "approved" | "rejected" | string;
  reward_points: number;
  created_at: string;
};

type FilterType =
  | "all"
  | "repeat"
  | "vip"
  | "new"
  | "points"
  | "warning"
  | "blocked";

const flagOptions = [
  { value: "normal", label: "Bình thường" },
  { value: "warning", label: "Cần xác nhận" },
  { value: "blocked", label: "Chặn đặt hàng" },
];

function getFlagMeta(status?: string) {
  if (status === "blocked") {
    return {
      label: "Chặn đặt hàng",
      className: "bg-red-100 text-red-700",
    };
  }

  if (status === "warning") {
    return {
      label: "Cần xác nhận",
      className: "bg-yellow-100 text-yellow-700",
    };
  }

  return {
    label: "Bình thường",
    className: "bg-[#E8FFF1] text-[#00B14F]",
  };
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [flags, setFlags] = useState<CustomerFlag[]>([]);
  const [reviews, setReviews] = useState<OrderReview[]>([]);
  const [googleReviews, setGoogleReviews] = useState<GoogleReviewReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [savingFlagPhone, setSavingFlagPhone] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    const [
      { data: customerData, error: customerError },
      { data: orderData, error: orderError },
      { data: flagData, error: flagError },
      { data: reviewData, error: reviewError },
      { data: googleReviewData, error: googleReviewError },
    ] = await Promise.all([
      supabase
        .from("customers")
        .select("*")
        .order("updated_at", { ascending: false }),

      supabase
        .from("orders")
        .select("id,order_code,customer_id,customer_phone,total,status,created_at"),

      supabase.from("customer_flags").select("phone,status,note,updated_at"),

      supabase
        .from("order_reviews")
        .select("id,customer_phone,rating,reward_points,created_at"),

      supabase
        .from("google_review_rewards")
        .select("id,customer_phone,status,reward_points,created_at"),
    ]);

    if (customerError) console.error("CUSTOMERS ERROR:", customerError);
    if (orderError) console.error("ORDERS ERROR:", orderError);
    if (flagError) console.error("FLAGS ERROR:", flagError);
    if (reviewError) console.error("REVIEWS ERROR:", reviewError);
    if (googleReviewError) console.error("GOOGLE REVIEWS ERROR:", googleReviewError);

    setCustomers((customerData || []) as Customer[]);
    setOrders((orderData || []) as Order[]);
    setFlags((flagData || []) as CustomerFlag[]);
    setReviews((reviewData || []) as OrderReview[]);
    setGoogleReviews((googleReviewData || []) as GoogleReviewReward[]);
    setLoading(false);
  }

  function getCustomerOrders(customer: Customer) {
    return orders.filter(
      (order) =>
        order.customer_id === customer.id ||
        order.customer_phone === customer.phone
    );
  }

  function getCustomerFlag(phone: string) {
    return flags.find((item) => item.phone === phone) || null;
  }

  function getCustomerReviews(phone: string) {
    return reviews.filter((item) => item.customer_phone === phone);
  }

  function getCustomerGoogleReviews(phone: string) {
    return googleReviews.filter((item) => item.customer_phone === phone);
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

  async function updateCustomerFlag(
    phone: string,
    status: "normal" | "warning" | "blocked",
    currentNote?: string | null
  ) {
    let note = currentNote || "";

    if (status !== "normal") {
      const input = window.prompt(
        status === "blocked"
          ? "Lý do chặn khách này?"
          : "Ghi chú lý do cần xác nhận trước?",
        currentNote || ""
      );

      if (input === null) return;
      note = input.trim();
    }

    setSavingFlagPhone(phone);

    try {
      if (status === "normal") {
        const { error } = await supabase
          .from("customer_flags")
          .delete()
          .eq("phone", phone);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("customer_flags").upsert(
          {
            phone,
            status,
            note,
            flagged_by: "admin",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "phone" }
        );

        if (error) throw error;
      }

      await fetchData();
    } catch (error: any) {
      console.error("UPDATE CUSTOMER FLAG ERROR:", error);
      alert(error?.message || "Không cập nhật được trạng thái khách.");
    } finally {
      setSavingFlagPhone("");
    }
  }

  const enrichedCustomers = useMemo(() => {
    return customers.map((customer) => {
      const customerOrders = getCustomerOrders(customer);
      const completedOrders = customerOrders.filter(
        (order) => order.status === "completed"
      );
      const cancelledOrders = customerOrders.filter(
        (order) => order.status === "cancelled"
      );
      const activeOrders = customerOrders.filter(
        (order) => order.status !== "cancelled"
      );
      const revenue = completedOrders.reduce(
        (sum, order) => sum + Number(order.total || 0),
        0
      );
      const activeRevenue = activeOrders.reduce(
        (sum, order) => sum + Number(order.total || 0),
        0
      );
      const lastOrder = [...customerOrders].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
      const customerReviews = getCustomerReviews(customer.phone);
      const customerGoogleReviews = getCustomerGoogleReviews(customer.phone);
      const approvedGoogleReviews = customerGoogleReviews.filter(
        (item) => item.status === "approved"
      );
      const pendingGoogleReviews = customerGoogleReviews.filter(
        (item) => item.status === "pending"
      );
      const flag = getCustomerFlag(customer.phone);
      const flagStatus = flag?.status || "normal";

      return {
        ...customer,
        orderCount: activeOrders.length,
        totalOrderCount: customerOrders.length,
        completedOrderCount: completedOrders.length,
        cancelledOrderCount: cancelledOrders.length,
        revenue,
        activeRevenue,
        lastOrder,
        reviewCount: customerReviews.length,
        averageRating:
          customerReviews.length > 0
            ? customerReviews.reduce((sum, item) => sum + Number(item.rating), 0) /
              customerReviews.length
            : 0,
        googleReviewCount: approvedGoogleReviews.length,
        pendingGoogleReviewCount: pendingGoogleReviews.length,
        flag,
        flagStatus,
        totalPoints: Number((customer as any).total_points || 0),
      };
    });
  }, [customers, orders, flags, reviews, googleReviews]);

  const filteredCustomers = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    return enrichedCustomers
      .filter((customer) => {
        if (!q) return true;

        return (
          String(customer.name || "").toLowerCase().includes(q) ||
          String(customer.phone || "").toLowerCase().includes(q) ||
          String(customer.last_address || "").toLowerCase().includes(q)
        );
      })
      .filter((customer) => {
        if (filter === "all") return true;
        if (filter === "repeat") return customer.orderCount >= 2;
        if (filter === "vip") return customer.revenue >= 300000;
        if (filter === "new") return customer.orderCount <= 1;
        if (filter === "points") return customer.totalPoints > 0;
        if (filter === "warning") return customer.flagStatus === "warning";
        if (filter === "blocked") return customer.flagStatus === "blocked";
        return true;
      })
      .sort((a, b) => {
        if (filter === "points") return b.totalPoints - a.totalPoints;
        if (filter === "warning" || filter === "blocked") {
          return (
            new Date(b.flag?.updated_at || b.updated_at || b.created_at).getTime() -
            new Date(a.flag?.updated_at || a.updated_at || a.created_at).getTime()
          );
        }
        return b.revenue - a.revenue;
      });
  }, [enrichedCustomers, keyword, filter]);

  const totalCompletedRevenue = enrichedCustomers.reduce(
    (sum, customer) => sum + customer.revenue,
    0
  );

  const totalActiveRevenue = enrichedCustomers.reduce(
    (sum, customer) => sum + customer.activeRevenue,
    0
  );

  const totalPoints = enrichedCustomers.reduce(
    (sum, customer) => sum + customer.totalPoints,
    0
  );

  const repeatCustomers = enrichedCustomers.filter(
    (customer) => customer.orderCount >= 2
  ).length;

  const vipCustomers = enrichedCustomers.filter(
    (customer) => customer.revenue >= 300000
  ).length;

  const warningCustomers = enrichedCustomers.filter(
    (customer) => customer.flagStatus === "warning"
  ).length;

  const blockedCustomers = enrichedCustomers.filter(
    (customer) => customer.flagStatus === "blocked"
  ).length;

  const totalWebReviews = reviews.length;
  const totalGoogleApprovedReviews = googleReviews.filter(
    (item) => item.status === "approved"
  ).length;
  const totalGooglePendingReviews = googleReviews.filter(
    (item) => item.status === "pending"
  ).length;

  const topCustomer = [...enrichedCustomers].sort(
    (a, b) => b.revenue - a.revenue
  )[0];

  const topPointsCustomer = [...enrichedCustomers].sort(
    (a, b) => b.totalPoints - a.totalPoints
  )[0];

  return (
    <AdminLayout>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-black text-[#00B14F]">Admin/POS</p>

          <h1 className="mt-1 text-4xl font-black text-[#06113C]">
            Dashboard khách hàng thân thiết
          </h1>

          <p className="mt-2 text-sm font-semibold text-neutral-500">
            Quản lý khách cũ, xu tích lũy, đánh giá, khách VIP và khách rủi ro.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="rounded-2xl bg-[#00B14F] px-5 py-4 text-sm font-black text-white shadow-lg shadow-[#00B14F]/25"
        >
          Làm mới dữ liệu
        </button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
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
          <p className="text-sm font-black text-neutral-400">Xu đang lưu hành</p>
          <p className="mt-2 text-3xl font-black text-[#B45309]">
            {totalPoints.toLocaleString("vi-VN")}
          </p>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5">
          <p className="text-sm font-black text-neutral-400">Cần xác nhận</p>
          <p className="mt-2 text-3xl font-black text-yellow-600">
            {warningCustomers}
          </p>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5">
          <p className="text-sm font-black text-neutral-400">Đang chặn</p>
          <p className="mt-2 text-3xl font-black text-red-600">
            {blockedCustomers}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[28px] bg-[#06113C] p-5 text-white shadow-lg shadow-neutral-950/5">
          <p className="text-sm font-black text-white/50">Doanh thu hoàn thành</p>
          <p className="mt-2 text-3xl font-black">
            {totalCompletedRevenue.toLocaleString("vi-VN")}đ
          </p>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5">
          <p className="text-sm font-black text-neutral-400">Doanh thu hợp lệ</p>
          <p className="mt-2 text-3xl font-black text-[#06113C]">
            {totalActiveRevenue.toLocaleString("vi-VN")}đ
          </p>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5">
          <p className="text-sm font-black text-neutral-400">Review web</p>
          <p className="mt-2 text-3xl font-black text-[#00B14F]">
            {totalWebReviews}
          </p>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5">
          <p className="text-sm font-black text-neutral-400">Google Review</p>
          <p className="mt-2 text-3xl font-black text-[#06113C]">
            {totalGoogleApprovedReviews}
          </p>
          {totalGooglePendingReviews > 0 && (
            <p className="mt-1 text-xs font-black text-yellow-600">
              {totalGooglePendingReviews} đang chờ duyệt
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {topCustomer && (
          <div className="rounded-[32px] bg-[#06113C] p-6 text-white shadow-xl shadow-neutral-950/5">
            <p className="font-black text-[#00B14F]">Khách chi tiêu cao nhất</p>
            <h2 className="mt-2 text-3xl font-black">{topCustomer.name}</h2>
            <p className="mt-2 text-sm font-bold text-white/70">
              {topCustomer.phone} · {topCustomer.completedOrderCount} đơn hoàn thành ·{" "}
              {topCustomer.revenue.toLocaleString("vi-VN")}đ
            </p>
          </div>
        )}

        {topPointsCustomer && topPointsCustomer.totalPoints > 0 && (
          <div className="rounded-[32px] bg-[#FFF7E8] p-6 shadow-xl shadow-neutral-950/5">
            <p className="font-black text-[#B45309]">Khách có nhiều xu nhất</p>
            <h2 className="mt-2 text-3xl font-black text-[#06113C]">
              {topPointsCustomer.name}
            </h2>
            <p className="mt-2 text-sm font-bold text-neutral-600">
              {topPointsCustomer.phone} · {topPointsCustomer.totalPoints} xu ·{" "}
              {topPointsCustomer.orderCount} đơn hợp lệ
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 rounded-[32px] bg-white p-5 shadow-xl shadow-neutral-950/5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#06113C]">
              Danh sách khách hàng
            </h2>
            <p className="mt-1 text-sm font-semibold text-neutral-500">
              Tìm theo tên, số điện thoại hoặc địa chỉ. Có thể đánh dấu khách rủi ro ngay tại đây.
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
              <option value="points">Có xu</option>
              <option value="warning">Cần xác nhận</option>
              <option value="blocked">Đang chặn</option>
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
                const flagMeta = getFlagMeta(customer.flagStatus);
                const shouldSuggestWarning =
                  customer.flagStatus === "normal" && customer.cancelledOrderCount >= 2;

                return (
                  <div
                    key={customer.id}
                    className="grid gap-4 rounded-[28px] border border-black/5 bg-white p-4 shadow-lg shadow-neutral-950/5 xl:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-black text-[#06113C]">
                          {customer.name || "Khách chưa đặt tên"}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${flagMeta.className}`}
                        >
                          {flagMeta.label}
                        </span>

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

                        {customer.totalPoints > 0 && (
                          <span className="rounded-full bg-[#FFF7E8] px-3 py-1 text-xs font-black text-[#B45309]">
                            {customer.totalPoints} xu
                          </span>
                        )}

                        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-500">
                          {customer.last_payment_method === "momo" ? "Hay CK" : "Hay COD"}
                        </span>
                      </div>

                      {shouldSuggestWarning && (
                        <div className="mt-3 rounded-2xl bg-yellow-50 px-4 py-3 text-xs font-black text-yellow-700">
                          ⚠️ Khách có {customer.cancelledOrderCount} đơn huỷ. Nên cân nhắc đánh dấu “Cần xác nhận”.
                        </div>
                      )}

                      {customer.flag?.note && (
                        <div className="mt-3 rounded-2xl bg-neutral-100 px-4 py-3 text-xs font-bold text-neutral-600">
                          Ghi chú rủi ro: {customer.flag.note}
                        </div>
                      )}

                      <div className="mt-3 space-y-1 text-sm font-bold text-neutral-600">
                        <p>📞 {customer.phone}</p>
                        <p>📍 {customer.last_address || "Chưa có địa chỉ"}</p>
                        <p>
                          🕒 Lần mua cuối:{" "}
                          {customer.lastOrder
                            ? new Date(customer.lastOrder.created_at).toLocaleString("vi-VN")
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

                        <select
                          value={customer.flagStatus}
                          disabled={savingFlagPhone === customer.phone}
                          onChange={(e) =>
                            updateCustomerFlag(
                              customer.phone,
                              e.target.value as "normal" | "warning" | "blocked",
                              customer.flag?.note
                            )
                          }
                          className="rounded-xl border border-black/10 px-4 py-3 text-xs font-black outline-none focus:border-[#00B14F]"
                        >
                          {flagOptions.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[520px] xl:grid-cols-3">
                      <div className="rounded-2xl bg-[#F5FFF8] p-4">
                        <p className="text-xs font-black text-neutral-400">Đơn hợp lệ</p>
                        <p className="mt-1 text-2xl font-black text-[#06113C]">
                          {customer.orderCount}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#F5FFF8] p-4">
                        <p className="text-xs font-black text-neutral-400">Hoàn thành</p>
                        <p className="mt-1 text-2xl font-black text-[#00B14F]">
                          {customer.completedOrderCount}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#F5FFF8] p-4">
                        <p className="text-xs font-black text-neutral-400">Đơn huỷ</p>
                        <p className="mt-1 text-2xl font-black text-red-600">
                          {customer.cancelledOrderCount}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#F5FFF8] p-4">
                        <p className="text-xs font-black text-neutral-400">Tổng mua</p>
                        <p className="mt-1 text-xl font-black text-[#00B14F]">
                          {customer.revenue.toLocaleString("vi-VN")}đ
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#F5FFF8] p-4">
                        <p className="text-xs font-black text-neutral-400">Trung bình</p>
                        <p className="mt-1 text-lg font-black text-[#06113C]">
                          {customer.completedOrderCount > 0
                            ? Math.round(customer.revenue / customer.completedOrderCount).toLocaleString("vi-VN")
                            : 0}
                          đ
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#F5FFF8] p-4">
                        <p className="text-xs font-black text-neutral-400">Đánh giá</p>
                        <p className="mt-1 text-lg font-black text-[#06113C]">
                          {customer.reviewCount} web · {customer.googleReviewCount} Maps
                        </p>
                        {customer.pendingGoogleReviewCount > 0 && (
                          <p className="mt-1 text-xs font-black text-yellow-600">
                            {customer.pendingGoogleReviewCount} chờ duyệt
                          </p>
                        )}
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
