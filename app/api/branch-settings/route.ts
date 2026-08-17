import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type BranchRow = {
  id: string;
  code: string;
  short_name: string;
  is_active: boolean;
  is_open: boolean | null;
  preparation_minutes: number | null;
};

type LegacyShopSettings = {
  id: number | string;
  shop_name?: string | null;
  is_open?: boolean | null;
  order_status?: string | null;
  open_time?: string | null;
  close_time?: string | null;
  preparation_minutes?: number | null;
};

function normalizeCode(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

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

export async function GET(request: NextRequest) {
  const branchId = request.nextUrl.searchParams.get("branchId")?.trim() || "";
  const branchCode = normalizeCode(
    request.nextUrl.searchParams.get("branchCode")
  );

  if (!branchId && !branchCode) {
    return respond({ ok: false, message: "Thiếu chi nhánh." }, 400);
  }

  const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return respond({ ok: false, message: "Thiếu cấu hình máy chủ." }, 500);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: branchData, error: branchError } = await supabaseAdmin
    .from("branches")
    .select("id,code,short_name,is_active,is_open,preparation_minutes")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (branchError) {
    console.error("branch-settings branches error", branchError);
    return respond({ ok: false, message: "Không tải được chi nhánh." }, 500);
  }

  const branches = (branchData || []) as BranchRow[];
  const branch =
    branches.find((item) =>
      branchId
        ? item.id === branchId
        : normalizeCode(item.code) === branchCode
    ) || null;

  if (!branch) {
    return respond({ ok: false, message: "Không tìm thấy chi nhánh." }, 404);
  }

  const { data: branchSettings, error: settingsError } = await supabaseAdmin
    .from("branch_settings")
    .select(
      "id,branch_id,is_open,order_status,open_time,close_time,preparation_minutes,updated_at"
    )
    .eq("branch_id", branch.id)
    .maybeSingle();

  if (!settingsError && branchSettings) {
    return respond({
      ok: true,
      branch: {
        id: branch.id,
        code: branch.code,
        short_name: branch.short_name,
      },
      settings: branchSettings,
      source: "branch_settings",
    });
  }

  if (settingsError) {
    console.warn(
      "branch-settings fallback to legacy shop_settings:",
      settingsError.message
    );
  }

  const { data: legacyData, error: legacyError } = await supabaseAdmin
    .from("shop_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (legacyError) {
    console.error("branch-settings legacy fallback error", legacyError);
    return respond({ ok: false, message: "Không tải được cài đặt chi nhánh." }, 500);
  }

  const legacy = (legacyData || null) as LegacyShopSettings | null;
  const isOpen = branch.is_open !== false && legacy?.is_open !== false;

  return respond({
    ok: true,
    branch: {
      id: branch.id,
      code: branch.code,
      short_name: branch.short_name,
    },
    settings: {
      id: legacy?.id ?? `legacy-${branch.id}`,
      branch_id: branch.id,
      is_open: isOpen,
      order_status: isOpen ? legacy?.order_status || "open" : "paused",
      open_time: legacy?.open_time || "10:00",
      close_time: legacy?.close_time || "22:00",
      preparation_minutes:
        branch.preparation_minutes ?? legacy?.preparation_minutes ?? 15,
    },
    source: "legacy_fallback",
  });
}
