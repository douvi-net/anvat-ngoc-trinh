import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type MaintenancePayload = {
  maintenance_enabled?: boolean;
  maintenance_disable_checkout?: boolean;
  maintenance_title?: string;
  maintenance_message?: string;
  maintenance_zalo_q1?: string;
  maintenance_zalo_q6?: string;
};

const defaults = {
  maintenance_enabled: false,
  maintenance_disable_checkout: false,
  maintenance_title: "Website đang được cập nhật",
  maintenance_message:
    "Hệ thống đặt món trực tuyến đang được bảo trì để nâng cấp trải nghiệm. Trong thời gian này, bạn có thể đặt món nhanh qua Zalo của từng chi nhánh.",
  maintenance_zalo_q1: "0392968034",
  maintenance_zalo_q6: "0392496220",
  updated_at: null as string | null,
};

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

function cleanPhone(value: unknown, fallback: string) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length >= 9 ? digits : fallback;
}

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    if (!supabaseAdmin) {
      return respond(
        { ok: false, message: "Thiếu cấu hình máy chủ." },
        500
      );
    }

    const { data, error } = await supabaseAdmin
      .from("shop_settings")
      .select(
        "maintenance_enabled,maintenance_disable_checkout,maintenance_title,maintenance_message,maintenance_zalo_q1,maintenance_zalo_q6,updated_at"
      )
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      console.error("ADMIN MAINTENANCE GET ERROR:", error);
      return respond(
        { ok: false, message: "Không tải được cấu hình bảo trì." },
        500
      );
    }

    return respond({
      ok: true,
      settings: {
        ...defaults,
        ...(data || {}),
      },
    });
  } catch (error) {
    console.error("ADMIN MAINTENANCE GET UNEXPECTED ERROR:", error);
    return respond(
      { ok: false, message: "Không tải được cấu hình bảo trì." },
      500
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    if (!supabaseAdmin) {
      return respond(
        { ok: false, message: "Thiếu cấu hình máy chủ." },
        500
      );
    }

    let body: MaintenancePayload;

    try {
      body = (await request.json()) as MaintenancePayload;
    } catch {
      return respond(
        { ok: false, message: "Dữ liệu gửi lên không hợp lệ." },
        400
      );
    }

    const payload = {
      maintenance_enabled: Boolean(body.maintenance_enabled),
      maintenance_disable_checkout: Boolean(
        body.maintenance_disable_checkout
      ),
      maintenance_title:
        String(body.maintenance_title || "").trim() ||
        defaults.maintenance_title,
      maintenance_message:
        String(body.maintenance_message || "").trim() ||
        defaults.maintenance_message,
      maintenance_zalo_q1: cleanPhone(
        body.maintenance_zalo_q1,
        defaults.maintenance_zalo_q1
      ),
      maintenance_zalo_q6: cleanPhone(
        body.maintenance_zalo_q6,
        defaults.maintenance_zalo_q6
      ),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("shop_settings")
      .update(payload)
      .eq("id", 1)
      .select(
        "maintenance_enabled,maintenance_disable_checkout,maintenance_title,maintenance_message,maintenance_zalo_q1,maintenance_zalo_q6,updated_at"
      )
      .single();

    if (error) {
      console.error("ADMIN MAINTENANCE PATCH ERROR:", error);
      return respond(
        { ok: false, message: "Không lưu được chế độ bảo trì." },
        500
      );
    }

    return respond({
      ok: true,
      settings: data,
      message: payload.maintenance_enabled
        ? "Đã bật chế độ bảo trì website."
        : "Đã tắt chế độ bảo trì website.",
    });
  } catch (error) {
    console.error("ADMIN MAINTENANCE PATCH UNEXPECTED ERROR:", error);
    return respond(
      { ok: false, message: "Không lưu được chế độ bảo trì." },
      500
    );
  }
}
