import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

function getAdminClient() {
  const url = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(request: NextRequest) {
  try {
    const branchIdParam = request.nextUrl.searchParams.get("branchId")?.trim() || "";
    const orderId = request.nextUrl.searchParams.get("orderId")?.trim() || "";

    if (!branchIdParam && !orderId) {
      return respond({ ok: false, message: "Thiếu chi nhánh hoặc đơn hàng." }, 400);
    }

    const supabaseAdmin = getAdminClient();
    if (!supabaseAdmin) {
      return respond({ ok: false, message: "Thiếu cấu hình máy chủ." }, 500);
    }

    let branchId = branchIdParam;

    if (!branchId && orderId) {
      const { data: orderData, error: orderError } = await supabaseAdmin
        .from("orders")
        .select("branch_id")
        .eq("id", orderId)
        .maybeSingle();

      if (orderError) {
        console.error("BRANCH PAYMENT ORDER LOOKUP ERROR:", orderError);
        return respond({ ok: false, message: "Không xác định được chi nhánh của đơn." }, 500);
      }

      branchId = String(orderData?.branch_id || "").trim();
      if (!branchId) {
        return respond(
          { ok: false, message: "Đơn hàng chưa có chi nhánh thanh toán. Vui lòng liên hệ quán." },
          409
        );
      }
    }

    const { data: branch, error: branchError } = await supabaseAdmin
      .from("branches")
      .select("id,code,short_name,is_active")
      .eq("id", branchId)
      .maybeSingle();

    if (branchError) {
      console.error("BRANCH PAYMENT BRANCH ERROR:", branchError);
      return respond({ ok: false, message: "Không tải được chi nhánh." }, 500);
    }

    if (!branch || branch.is_active === false) {
      return respond({ ok: false, message: "Chi nhánh không khả dụng." }, 404);
    }

    const { data: settings, error: settingsError } = await supabaseAdmin
      .from("branch_settings")
      .select(
        "branch_id,payment_enabled,payment_qr_url,payment_bank_name,payment_account_name,payment_account_number,payment_note"
      )
      .eq("branch_id", branch.id)
      .maybeSingle();

    if (settingsError) {
      console.error("BRANCH PAYMENT SETTINGS ERROR:", settingsError);
      return respond({ ok: false, message: "Không tải được cấu hình thanh toán." }, 500);
    }

    const paymentQrUrl = String(settings?.payment_qr_url || "").trim();

    return respond({
      ok: true,
      payment: {
        branch_id: branch.id,
        branch_code: branch.code,
        branch_name: branch.short_name,
        payment_enabled: settings?.payment_enabled !== false,
        payment_qr_url: paymentQrUrl || null,
        payment_bank_name: settings?.payment_bank_name || null,
        payment_account_name: settings?.payment_account_name || null,
        payment_account_number: settings?.payment_account_number || null,
        payment_note: settings?.payment_note || null,
        configured: Boolean(paymentQrUrl),
      },
    });
  } catch (error) {
    console.error("BRANCH PAYMENT API ERROR:", error);
    return respond({ ok: false, message: "Không tải được thông tin thanh toán." }, 500);
  }
}
