import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, serviceRoleKey);

const ALLOWED_KEYS = [
  "ga_id",
  "clarity_id",
  "google_verification",
  "bing_verification",
  "indexnow_key",
];

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("key,value");

    if (error) {
      return NextResponse.json(
        { error: "Không thể lấy SEO settings", detail: error.message },
        { status: 500 }
      );
    }

    const settings = ALLOWED_KEYS.reduce<Record<string, string>>((acc, key) => {
      acc[key] = "";
      return acc;
    }, {});

    data?.forEach((item) => {
      if (ALLOWED_KEYS.includes(item.key)) {
        settings[item.key] = item.value || "";
      }
    });

    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      { error: "Lỗi server", detail: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
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
        { error: "Không thể lưu SEO settings", detail: error.message },
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