import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ALLOWED_KEYS = [
  "ga_id",
  "clarity_id",
  "google_verification",
  "bing_verification",
  "indexnow_key",
] as const;

type SeoKey = (typeof ALLOWED_KEYS)[number];

function getSupabase() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

export async function GET() {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("site_settings")
      .select("key,value")
      .in("key", [...ALLOWED_KEYS]);

    if (error) {
      return NextResponse.json(
        { error: "Không thể lấy cấu hình SEO", detail: error.message },
        { status: 500 }
      );
    }

    const settings: Record<SeoKey, string> = {
      ga_id: "",
      clarity_id: "",
      google_verification: "",
      bing_verification: "",
      indexnow_key: "",
    };

    data?.forEach((item) => {
      if (ALLOWED_KEYS.includes(item.key as SeoKey)) {
        settings[item.key as SeoKey] = item.value || "";
      }
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json(
      { error: "Lỗi server", detail: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await req.json();

    const rows = ALLOWED_KEYS.map((key) => ({
      key,
      value: typeof body[key] === "string" ? body[key].trim() : "",
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("site_settings")
      .upsert(rows, { onConflict: "key" });

    if (error) {
      return NextResponse.json(
        { error: "Không thể lưu cấu hình SEO", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Lỗi server", detail: String(error) },
      { status: 500 }
    );
  }
}