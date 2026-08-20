import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const BUCKET = "branch-payment-qr";

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

function cleanString(value: unknown) {
  const text = String(value || "").trim();
  return text || null;
}

export async function GET() {
  try {
    const supabaseAdmin = getAdminClient();
    if (!supabaseAdmin) {
      return respond({ ok: false, message: "Thiếu cấu hình máy chủ." }, 500);
    }

    const { data: branches, error: branchError } = await supabaseAdmin
      .from("branches")
      .select("id,code,short_name,address,is_active,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (branchError) {
      console.error("ADMIN BRANCH PAYMENTS BRANCHES ERROR:", branchError);
      return respond({ ok: false, message: "Không tải được danh sách chi nhánh." }, 500);
    }

    const branchIds = (branches || []).map((item) => item.id);
    let settings: unknown[] = [];

    if (branchIds.length > 0) {
      const { data: settingsData, error: settingsError } = await supabaseAdmin
        .from("branch_settings")
        .select(
          "branch_id,payment_enabled,payment_qr_url,payment_bank_name,payment_account_name,payment_account_number,payment_note,updated_at"
        )
        .in("branch_id", branchIds);

      if (settingsError) {
        console.error("ADMIN BRANCH PAYMENTS SETTINGS ERROR:", settingsError);
        return respond({ ok: false, message: "Không tải được cấu hình thanh toán." }, 500);
      }

      settings = settingsData || [];
    }

    return respond({ ok: true, branches: branches || [], settings });
  } catch (error) {
    console.error("ADMIN BRANCH PAYMENTS GET ERROR:", error);
    return respond({ ok: false, message: "Không tải được cấu hình thanh toán." }, 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabaseAdmin = getAdminClient();
    if (!supabaseAdmin) {
      return respond({ ok: false, message: "Thiếu cấu hình máy chủ." }, 500);
    }

    const body = await request.json();
    const branchId = String(body?.branch_id || "").trim();

    if (!branchId) {
      return respond({ ok: false, message: "Thiếu chi nhánh." }, 400);
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("branch_settings")
      .select("branch_id")
      .eq("branch_id", branchId)
      .maybeSingle();

    if (existingError) {
      console.error("BRANCH PAYMENT SETTINGS CHECK ERROR:", existingError);
      return respond({ ok: false, message: "Không kiểm tra được cài đặt chi nhánh." }, 500);
    }

    if (!existing) {
      return respond(
        {
          ok: false,
          message: "Chi nhánh chưa có branch_settings. Hãy khởi tạo cài đặt chi nhánh trước.",
        },
        409
      );
    }

    const payload = {
      payment_enabled: body?.payment_enabled !== false,
      payment_qr_url: cleanString(body?.payment_qr_url),
      payment_bank_name: cleanString(body?.payment_bank_name),
      payment_account_name: cleanString(body?.payment_account_name),
      payment_account_number: cleanString(body?.payment_account_number),
      payment_note: cleanString(body?.payment_note),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("branch_settings")
      .update(payload)
      .eq("branch_id", branchId)
      .select(
        "branch_id,payment_enabled,payment_qr_url,payment_bank_name,payment_account_name,payment_account_number,payment_note,updated_at"
      )
      .single();

    if (error) {
      console.error("BRANCH PAYMENT SETTINGS UPDATE ERROR:", error);
      return respond({ ok: false, message: "Không lưu được cấu hình thanh toán." }, 500);
    }

    return respond({ ok: true, settings: data, message: "Đã lưu thanh toán cho chi nhánh." });
  } catch (error) {
    console.error("ADMIN BRANCH PAYMENTS PATCH ERROR:", error);
    return respond({ ok: false, message: "Không lưu được cấu hình thanh toán." }, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getAdminClient();
    if (!supabaseAdmin) {
      return respond({ ok: false, message: "Thiếu cấu hình máy chủ." }, 500);
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const branchId = String(formData.get("branch_id") || "").trim();

    if (!branchId) return respond({ ok: false, message: "Thiếu chi nhánh." }, 400);
    if (!(file instanceof File)) return respond({ ok: false, message: "Chưa chọn ảnh QR." }, 400);
    if (!file.type.startsWith("image/")) return respond({ ok: false, message: "QR phải là file ảnh." }, 400);
    if (file.size > 5 * 1024 * 1024) return respond({ ok: false, message: "Ảnh QR tối đa 5MB." }, 400);

    const { data: branch, error: branchError } = await supabaseAdmin
      .from("branches")
      .select("id,code")
      .eq("id", branchId)
      .maybeSingle();

    if (branchError || !branch) {
      return respond({ ok: false, message: "Không tìm thấy chi nhánh." }, 404);
    }

    const extension =
      file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
    const safeCode = String(branch.code || branchId)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-");
    const storagePath = `${safeCode}/qr-${Date.now()}.${extension}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(storagePath, bytes, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("BRANCH PAYMENT QR UPLOAD ERROR:", uploadError);
      return respond({ ok: false, message: "Không upload được ảnh QR." }, 500);
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    return respond({
      ok: true,
      payment_qr_url: publicUrlData.publicUrl,
      storage_path: storagePath,
      message: "Đã upload QR. Bấm Lưu để áp dụng cho chi nhánh.",
    });
  } catch (error) {
    console.error("ADMIN BRANCH PAYMENT UPLOAD ERROR:", error);
    return respond({ ok: false, message: "Không upload được ảnh QR." }, 500);
  }
}
