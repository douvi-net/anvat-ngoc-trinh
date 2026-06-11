import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
);

webpush.setVapidDetails(
  process.env.WEB_PUSH_SUBJECT || "mailto:admin@anvatngoctrinh.vn",
  process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY!,
  process.env.WEB_PUSH_PRIVATE_KEY!
);

type OrderStatusPushBody = {
  orderId?: string;
  orderCode?: string;
  customerPhone?: string;
  status?: string;
};

function getStatusText(status: string) {
  switch (status) {
    case "waiting_payment":
      return "Đơn đang chờ thanh toán.";
    case "new":
      return "Quán đã nhận đơn của bạn.";
    case "making":
      return "Đơn của bạn đang được chuẩn bị.";
    case "completed":
      return "Đơn của bạn đã hoàn thành. Cảm ơn bạn đã ủng hộ!";
    case "cancelled":
      return "Đơn hàng đã được huỷ.";
    case "need_confirm":
      return "Đơn cần quán xác nhận trước khi làm món.";
    default:
      return "Đơn hàng của bạn vừa được cập nhật.";
  }
}

function getStatusTitle(status: string) {
  switch (status) {
    case "waiting_payment":
      return "💳 Chờ thanh toán";
    case "new":
      return "✅ Quán đã nhận đơn";
    case "making":
      return "🍳 Đơn đang được làm";
    case "completed":
      return "🎉 Đơn đã hoàn thành";
    case "cancelled":
      return "❌ Đơn đã huỷ";
    case "need_confirm":
      return "⚠️ Đơn cần xác nhận";
    default:
      return "🔔 Cập nhật đơn hàng";
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OrderStatusPushBody;

    const orderId = String(body.orderId || "").trim();
    const orderCode = String(body.orderCode || "").trim();
    const customerPhone = String(body.customerPhone || "").trim();
    const status = String(body.status || "").trim();

    if (!customerPhone || !status) {
      return NextResponse.json(
        {
          success: false,
          message: "Thiếu số điện thoại hoặc trạng thái đơn.",
        },
        { status: 400 }
      );
    }

    const { data: subscriptions, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id,endpoint,p256dh,auth")
      .eq("customer_phone", customerPhone);

    if (error) {
      console.error("FETCH PUSH SUBSCRIPTIONS ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message: error.message || "Không lấy được thiết bị nhận thông báo.",
        },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Khách chưa bật thông báo.",
      });
    }

    const title = getStatusTitle(status);
    const message = getStatusText(status);

    const payload = JSON.stringify({
      title,
      body: orderCode ? `#${orderCode} - ${message}` : message,
      icon: "/icon.png",
      badge: "/icon.png",
      url: orderCode ? `/tra-cuu-don?code=${orderCode}` : "/tra-cuu-don",
      data: {
        orderId,
        orderCode,
        status,
      },
    });

    const results = await Promise.allSettled(
      subscriptions.map((item) =>
        webpush.sendNotification(
          {
            endpoint: item.endpoint,
            keys: {
              p256dh: item.p256dh,
              auth: item.auth,
            },
          },
          payload
        )
      )
    );

    const failedIds: string[] = [];

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        const subscription = subscriptions[index];
        const reason: any = result.reason;

        console.error("SEND WEB PUSH ERROR:", reason);

        if (
          reason?.statusCode === 404 ||
          reason?.statusCode === 410
        ) {
          failedIds.push(subscription.id);
        }
      }
    });

    if (failedIds.length > 0) {
      await supabaseAdmin
        .from("push_subscriptions")
        .delete()
        .in("id", failedIds);
    }

    return NextResponse.json({
      success: true,
      sent: results.filter((item) => item.status === "fulfilled").length,
      failed: results.filter((item) => item.status === "rejected").length,
      removedExpired: failedIds.length,
    });
  } catch (error) {
    console.error("ORDER STATUS PUSH API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Lỗi gửi thông báo trạng thái đơn.",
      },
      { status: 500 }
    );
  }
}