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

const MAX_FCM_TOKENS_PER_BATCH = 500;

const INVALID_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

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

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }

  return result;
}

async function resolveOrderBranchId(
  orderId: string,
  requestedBranchId: string
): Promise<string> {
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("id, branch_id")
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw error;

  const orderBranchId = String(order?.branch_id || "").trim();

  // orders.branch_id là nguồn dữ liệu chính xác nhất vì được lưu cùng đơn.
  // requestedBranchId chỉ là fallback tương thích trong giai đoạn rollout.
  return orderBranchId || requestedBranchId;
}

async function deactivateInvalidTokens(tokens: string[]) {
  if (tokens.length === 0) return;

  const uniqueTokens = [...new Set(tokens)];

  const { error } = await supabaseAdmin
    .from("merchant_devices")
    .update({ is_active: false })
    .in("fcm_token", uniqueTokens);

  if (error) {
    console.error("notify-new-order deactivate invalid tokens error:", error);
  }
}

export async function POST(request: Request) {
  try {
    initFirebaseAdmin();

    const body = await request.json();

    const orderId = String(body.orderId || "").trim();
    const requestedBranchId = String(body.branchId || "").trim();

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Thiếu orderId để xác định chi nhánh nhận thông báo.",
        },
        { status: 400 }
      );
    }

    const branchId = await resolveOrderBranchId(
      orderId,
      requestedBranchId
    );

    if (!branchId) {
      // Không bao giờ fallback gửi toàn hệ thống vì có thể làm Q1/Q6 reo nhầm.
      return NextResponse.json({
        success: false,
        message: "Đơn hàng chưa có branch_id nên không gửi FCM.",
        orderId,
      });
    }

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
      .eq("branch_id", branchId)
      .eq("is_active", true);

    if (error) throw error;

    const tokens = [
      ...new Set(
        (devices || [])
          .map((item) => String(item.fcm_token || "").trim())
          .filter(Boolean)
      ),
    ];

    if (tokens.length === 0) {
      return NextResponse.json({
        success: true,
        successCount: 0,
        failureCount: 0,
        branchId,
        message: "Chi nhánh hiện chưa có thiết bị Merchant đang hoạt động.",
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

    let successCount = 0;
    let failureCount = 0;
    const invalidTokens: string[] = [];

    for (const tokenBatch of chunk(tokens, MAX_FCM_TOKENS_PER_BATCH)) {
      const result = await getMessaging().sendEachForMulticast({
        tokens: tokenBatch,
        data: {
          type: "new_order",
          title,
          body: bodyText,
          order_id: orderId,
          order_code: String(orderCode),
          branch_id: branchId,
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

      successCount += result.successCount;
      failureCount += result.failureCount;

      result.responses.forEach((response, index) => {
        const errorCode = response.error?.code || "";

        if (!response.success && INVALID_TOKEN_CODES.has(errorCode)) {
          invalidTokens.push(tokenBatch[index]);
        }
      });
    }

    await deactivateInvalidTokens(invalidTokens);

    return NextResponse.json({
      success: true,
      successCount,
      failureCount,
      branchId,
      invalidTokenCount: [...new Set(invalidTokens)].length,
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
