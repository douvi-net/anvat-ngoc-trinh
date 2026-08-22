import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const ORDER_FIELDS = [
  "customer_id",
  "customer_name",
  "customer_phone",
  "customer_address",
  "address_detail",
  "note",
  "subtotal",
  "shipping_fee_original",
  "shipping_discount",
  "coupon_discount",
  "shipping_fee",
  "discount_amount",
  "points_used",
  "points_earned",
  "points_discount",
  "coupon_code",
  "total",
  "status",
  "source",
  "payment_method",
  "payment_status",
  "delivery_distance_km",
  "delivery_area",
  "fulfillment_type",
  "delivery_status",
  "preparation_minutes",
  "delivery_minutes",
  "estimated_delivery_from",
  "estimated_delivery_to",
  "confirmed_at",
  "order_type",
  "scheduled_at",
  "scheduled_note",
  "branch_id",
] as const;

const ITEM_FIELDS = [
  "product_id",
  "product_name",
  "quantity",
  "price",
  "unit_price",
  "total",
  "note",
  "spicy_level",
  "toppings",
] as const;

function respond(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

function getSupabaseAdmin() {
  const url = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const serviceRoleKey = String(
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  ).trim();

  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function safeObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function pickFields(
  source: Record<string, unknown>,
  fields: readonly string[]
) {
  const result: Record<string, unknown> = {};

  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      result[field] = source[field];
    }
  }

  return result;
}

function generateOrderCode() {
  const timePart = Date.now().toString().slice(-8);
  const randomPart = Math.floor(Math.random() * 90 + 10).toString();
  return `AVNT${timePart}${randomPart}`;
}

function normalizeRequestId(value: unknown) {
  return String(value || "")
    .trim()
    .slice(0, 180);
}

async function findExistingOrder(
  supabaseAdmin: any,
  clientRequestId: string
) {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(
      "id,order_code,branch_id,total,status,payment_method,order_type,scheduled_at,client_request_id,created_at"
    )
    .eq("client_request_id", clientRequestId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function GET(request: NextRequest) {
  try {
    const clientRequestId = normalizeRequestId(
      request.nextUrl.searchParams.get("clientRequestId")
    );

    if (!clientRequestId) {
      return respond(
        { ok: false, message: "Thiếu mã kiểm tra đơn." },
        400
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return respond(
        { ok: false, message: "Thiếu cấu hình máy chủ." },
        500
      );
    }

    const order = await findExistingOrder(supabaseAdmin, clientRequestId);

    if (!order) {
      return respond(
        { ok: false, message: "Chưa tìm thấy đơn với mã gửi này." },
        404
      );
    }

    return respond({ ok: true, order });
  } catch (error) {
    console.error("ORDER RECOVERY API ERROR:", error);
    return respond(
      { ok: false, message: "Không kiểm tra được trạng thái đơn." },
      500
    );
  }
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();

  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return respond(
        { ok: false, message: "Thiếu cấu hình máy chủ." },
        500
      );
    }

    let body: Record<string, unknown>;

    try {
      body = safeObject(await request.json());
    } catch {
      return respond(
        { ok: false, message: "Dữ liệu đơn hàng không hợp lệ." },
        400
      );
    }

    const clientRequestId = normalizeRequestId(body.clientRequestId);
    const orderInput = safeObject(body.order);
    const rawItems = Array.isArray(body.items) ? body.items : [];
    const clientContext = safeObject(body.clientContext);

    if (!clientRequestId || clientRequestId.length < 12) {
      return respond(
        { ok: false, message: "Mã gửi đơn không hợp lệ." },
        400
      );
    }

    if (rawItems.length === 0 || rawItems.length > 80) {
      return respond(
        { ok: false, message: "Đơn hàng chưa có món hợp lệ." },
        400
      );
    }

    const existingOrder = await findExistingOrder(
      supabaseAdmin,
      clientRequestId
    );

    if (existingOrder) {
      return respond({
        ok: true,
        created: false,
        duplicatePrevented: true,
        order: existingOrder,
      });
    }

    const branchId = String(orderInput.branch_id || "").trim();
    const phone = String(orderInput.customer_phone || "").trim();

    if (!branchId) {
      return respond(
        { ok: false, message: "Đơn chưa xác định chi nhánh." },
        400
      );
    }

    if (!/^0(3|5|7|8|9)\d{8}$/.test(phone)) {
      return respond(
        { ok: false, message: "Số điện thoại đặt hàng không hợp lệ." },
        400
      );
    }

    const { data: branch, error: branchError } = await supabaseAdmin
      .from("branches")
      .select("id,is_active")
      .eq("id", branchId)
      .maybeSingle();

    if (branchError) throw branchError;

    if (!branch || branch.is_active === false) {
      return respond(
        { ok: false, message: "Chi nhánh hiện không khả dụng." },
        409
      );
    }

    const orderCode = generateOrderCode();
    const userAgent = String(
      request.headers.get("user-agent") || clientContext.userAgent || ""
    ).slice(0, 1000);

    const orderPayload = {
      ...pickFields(orderInput, ORDER_FIELDS),
      order_code: orderCode,
      client_request_id: clientRequestId,
      checkout_user_agent: userAgent || null,
      checkout_client: "web-reliable-v1",
    };

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert(orderPayload)
      .select(
        "id,order_code,branch_id,total,status,payment_method,order_type,scheduled_at,client_request_id,created_at"
      )
      .single();

    if (orderError) {
      // Handles two browser requests racing with the same idempotency key.
      if (String(orderError.code || "") === "23505") {
        const racedOrder = await findExistingOrder(
          supabaseAdmin,
          clientRequestId
        );

        if (racedOrder) {
          return respond({
            ok: true,
            created: false,
            duplicatePrevented: true,
            order: racedOrder,
          });
        }
      }

      throw orderError;
    }

    const normalizedItems: Record<string, unknown>[] = rawItems.map((raw) => {
      const item = safeObject(raw);
      return {
        ...pickFields(item, ITEM_FIELDS),
        order_id: order.id,
      };
    });

    const invalidItem = normalizedItems.find((item) => {
      const quantity = Number(item["quantity"] || 0);
      const name = String(item["product_name"] || "").trim();
      return !Number.isFinite(quantity) || quantity <= 0 || !name;
    });

    if (invalidItem) {
      await supabaseAdmin
        .from("orders")
        .delete()
        .eq("id", order.id)
        .eq("client_request_id", clientRequestId);

      return respond(
        { ok: false, message: "Có món không hợp lệ trong đơn hàng." },
        400
      );
    }

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(normalizedItems);

    if (itemsError) {
      console.error("ORDER ITEMS INSERT ERROR:", itemsError);

      // Manual rollback so customers never see an empty/orphan order as success.
      const { error: rollbackError } = await supabaseAdmin
        .from("orders")
        .delete()
        .eq("id", order.id)
        .eq("client_request_id", clientRequestId);

      if (rollbackError) {
        console.error("ORDER ROLLBACK ERROR:", rollbackError);
      }

      throw itemsError;
    }

    // Notification is only sent for the first successful creation.
    try {
      const notifyUrl = new URL("/api/notify-new-order", request.url);
      await fetch(notifyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          orderId: order.id,
          branchId: order.branch_id || branchId,
          orderCode: order.order_code,
          total: Number(order.total || 0),
          paymentMethod: order.payment_method || "cod",
          orderType: order.order_type || "now",
          scheduledAt: order.scheduled_at || null,
          status: order.status || "new",
        }),
      });
    } catch (notifyError) {
      // The order is already valid. Merchant fallback polling can recover it.
      console.error("ORDER CREATED BUT NOTIFY ERROR:", notifyError);
    }

    console.info("WEB ORDER CREATED", {
      orderId: order.id,
      orderCode: order.order_code,
      branchId,
      clientRequestId,
      durationMs: Date.now() - startedAt,
      userAgent: userAgent.slice(0, 180),
      language: String(clientContext.language || "").slice(0, 40),
      viewport: String(clientContext.viewport || "").slice(0, 40),
    });

    return respond({
      ok: true,
      created: true,
      duplicatePrevented: false,
      order,
    });
  } catch (error) {
    console.error("CREATE WEB ORDER API ERROR:", error);
    return respond(
      {
        ok: false,
        message: "Không tạo được đơn. Hệ thống chưa xác nhận đơn hàng.",
      },
      500
    );
  }
}
