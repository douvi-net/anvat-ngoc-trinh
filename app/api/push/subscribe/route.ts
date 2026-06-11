import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
);

type PushSubscriptionBody = {
  customerPhone?: string;
  subscription?: {
    endpoint?: string;
    expirationTime?: number | null;
    keys?: {
      p256dh?: string;
      auth?: string;
    };
  };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PushSubscriptionBody;

    const customerPhone = String(body.customerPhone || "").trim();
    const subscription = body.subscription;

    const endpoint = String(subscription?.endpoint || "").trim();
    const p256dh = String(subscription?.keys?.p256dh || "").trim();
    const auth = String(subscription?.keys?.auth || "").trim();

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        {
          success: false,
          message: "Thiếu thông tin thiết bị nhận thông báo.",
        },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get("user-agent") || "";

    const { error } = await supabaseAdmin
      .from("push_subscriptions")
      .upsert(
        {
          customer_phone: customerPhone || null,
          endpoint,
          p256dh,
          auth,
          user_agent: userAgent,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "endpoint",
        }
      );

    if (error) {
      console.error("SAVE PUSH SUBSCRIPTION ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message: error.message || "Không lưu được thiết bị thông báo.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Đã bật thông báo đơn hàng.",
    });
  } catch (error) {
    console.error("PUSH SUBSCRIBE API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Lỗi bật thông báo.",
      },
      { status: 500 }
    );
  }
}