import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

function getSupabaseServer() {
  const url = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const serviceRoleKey = String(
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  ).trim();
  const anonKey = String(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  ).trim();

  const key = serviceRoleKey || anonKey;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function GET() {
  try {
    const supabase = getSupabaseServer();

    if (!supabase) {
      return respond({ ok: true, settings: defaults });
    }

    const { data, error } = await supabase
      .from("shop_settings")
      .select(
        "maintenance_enabled,maintenance_disable_checkout,maintenance_title,maintenance_message,maintenance_zalo_q1,maintenance_zalo_q6,updated_at"
      )
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      console.error("PUBLIC MAINTENANCE SETTINGS ERROR:", error);
      return respond({ ok: true, settings: defaults });
    }

    return respond({
      ok: true,
      settings: {
        ...defaults,
        ...(data || {}),
      },
    });
  } catch (error) {
    console.error("PUBLIC MAINTENANCE API ERROR:", error);
    return respond({ ok: true, settings: defaults });
  }
}
