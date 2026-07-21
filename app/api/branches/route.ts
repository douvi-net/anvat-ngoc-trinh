import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { BranchApiItem } from "@/types/branch";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("branches api config error: missing supabase env");
      return NextResponse.json(
        {
          ok: false,
          message: "Không tải được danh sách chi nhánh.",
        },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await supabaseAdmin
      .from("branches")
      .select(
        "id,code,name,short_name,address,phone,latitude,longitude,is_active,is_open,preparation_minutes,delivery_radius_km,sort_order"
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("branches api query error:", error);
      return NextResponse.json(
        {
          ok: false,
          message: "Không tải được danh sách chi nhánh.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      branches: ((data || []) as BranchApiItem[]),
    });
  } catch (error) {
    console.error("branches api unexpected error:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Không tải được danh sách chi nhánh.",
      },
      { status: 500 }
    );
  }
}
