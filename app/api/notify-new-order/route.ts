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

export async function POST(request: Request) {
  try {
    initFirebaseAdmin();

    const body = await request.json();

    const orderCode = body.orderCode || "Đơn mới";
    const total = body.total || 0;
    const paymentMethod = body.paymentMethod || "cod";
    const status = body.status || "new";

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

    const title =
      status === "waiting_payment"
        ? "💳 Đơn chờ thanh toán"
        : "🔔 Đơn hàng mới";

    const bodyText =
      paymentMethod === "momo"
        ? `#${orderCode} - Khách chọn chuyển khoản`
        : `#${orderCode} - ${Number(total).toLocaleString("vi-VN")}đ`;

    const result = await getMessaging().sendEachForMulticast({
      tokens,
    
      data: {
        title,
        body: bodyText,
        order_code: String(orderCode),
        total: String(total),
        payment_method: String(paymentMethod),
        status: String(status),
      },
      android: {
        priority: "high",
        notification: {
          channelId: "avnt_new_order_channel_v4",
          sound: "default",
          priority: "high",
          visibility: "public",
        },
      },
    });

    return NextResponse.json({
      success: true,
      successCount: result.successCount,
      failureCount: result.failureCount,
    });
  } catch (error) {
    console.error("notify-new-order error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Lỗi gửi thông báo",
      },
      { status: 500 }
    );
  }
}