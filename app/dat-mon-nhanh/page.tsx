import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
);

function initFirebaseAdmin() {
  if (getApps().length > 0) return;

  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    }),
  });
}

function formatScheduledTime(value: string | null) {
  if (!value) return "";

  try {
    const date = new Date(value);

    return date.toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  try {
    initFirebaseAdmin();

    const body = await request.json();

    const orderCode = body.orderCode || "Đơn mới";
    const total = Number(body.total || 0);
    const paymentMethod = body.paymentMethod || "cod";
    const status = body.status || "new";
    const orderType = body.orderType || "now";
    const scheduledAt = body.scheduledAt || null;

    const { data: devices, error } = await supabaseAdmin
      .from("merchant_devices")
      .select("fcm_token")
      .eq("shop_id", "avnt")
      .eq("is_active", true);

    if (error) throw error;

    const tokens =
      devices?.map((item) => item.fcm_token).filter(Boolean) || [];

    if (tokens.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Không có thiết bị nhận thông báo",
      });
    }

    const isScheduled = orderType === "scheduled";
    const scheduledText = formatScheduledTime(scheduledAt);

    const title =
      status === "waiting_payment"
        ? "💳 Đơn chờ thanh toán"
        : isScheduled
        ? "🕒 Có đơn đặt trước"
        : "🔔 Đơn hàng mới";

    const bodyText =
      paymentMethod === "momo"
        ? `#${orderCode} - Khách chọn chuyển khoản`
        : isScheduled
        ? `#${orderCode} - ${total.toLocaleString("vi-VN")}đ - Giao lúc ${scheduledText}`
        : `#${orderCode} - ${total.toLocaleString("vi-VN")}đ`;

    const result = await getMessaging().sendEachForMulticast({
      tokens,
      data: {
        type: "new_order",
        title,
        body: bodyText,
        order_id: String(body.orderId || ""),
        order_code: String(orderCode),
        total: String(total),
        payment_method: String(paymentMethod),
        status: String(status),
        order_type: String(orderType),
        scheduled_at: scheduledAt ? String(scheduledAt) : "",
      },

      android: {
        priority: "high",
        ttl: 60 * 60 * 1000,
      },
    });

    return NextResponse.json({
      success: true,
      successCount: result.successCount,
      failureCount: result.failureCount,
      responses: result.responses.map((item) => ({
        success: item.success,
        error: item.error?.message || null,
      })),
    });
  } catch (error) {
    console.error("notify-new-order error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Lỗi gửi thông báo",
        detail: String(error),
      },
      { status: 500 }
    );
  }
}