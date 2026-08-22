import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type ToppingRow = {
  id: string;
  name: string;
  price: number;
  category: string | null;
  sort_order: number | null;
  is_active: boolean | null;
};

type BranchToppingSettingRow = {
  topping_id: string;
  is_available: boolean;
  is_sold_out: boolean;
  sort_order: number | null;
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

export async function GET(request: NextRequest) {
  try {
    const branchId =
      request.nextUrl.searchParams.get("branchId")?.trim() || "";

    if (!branchId) {
      return respond({ ok: false, message: "Thiếu chi nhánh." }, 400);
    }

    const supabaseUrl = String(
      process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    ).trim();
    const serviceRoleKey = String(
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    ).trim();

    if (!supabaseUrl || !serviceRoleKey) {
      return respond(
        { ok: false, message: "Thiếu cấu hình máy chủ." },
        500
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: branch, error: branchError } = await supabaseAdmin
      .from("branches")
      .select("id,is_active")
      .eq("id", branchId)
      .maybeSingle();

    if (branchError || !branch || branch.is_active === false) {
      return respond(
        { ok: false, message: "Chi nhánh không khả dụng." },
        404
      );
    }

    const [toppingResult, settingResult] = await Promise.all([
      supabaseAdmin
        .from("toppings")
        .select("id,name,price,category,sort_order,is_active"),
      supabaseAdmin
        .from("branch_topping_settings")
        .select("topping_id,is_available,is_sold_out,sort_order")
        .eq("branch_id", branchId),
    ]);

    if (toppingResult.error) {
      console.error("BRANCH TOPPINGS BASE ERROR:", toppingResult.error);
      return respond(
        { ok: false, message: "Không tải được topping." },
        500
      );
    }

    if (settingResult.error) {
      console.error("BRANCH TOPPINGS SETTINGS ERROR:", settingResult.error);
      return respond(
        { ok: false, message: "Không tải được topping chi nhánh." },
        500
      );
    }

    const toppings = (toppingResult.data || []) as ToppingRow[];
    const settings =
      (settingResult.data || []) as BranchToppingSettingRow[];

    const settingByToppingId = new Map(
      settings.map((item) => [item.topping_id, item])
    );

    const items = toppings
      .filter((topping) => topping.is_active !== false)
      .filter((topping) => {
        const setting = settingByToppingId.get(topping.id);

        if (!setting) {
          return true;
        }

        return setting.is_available !== false && setting.is_sold_out !== true;
      })
      .map((topping) => {
        const setting = settingByToppingId.get(topping.id);

        return {
          id: topping.id,
          name: topping.name,
          price: topping.price,
          category: topping.category,
          sort_order: setting?.sort_order ?? topping.sort_order ?? 99,
        };
      })
      .sort((a, b) => {
        if (a.sort_order !== b.sort_order) {
          return a.sort_order - b.sort_order;
        }

        return a.name.localeCompare(b.name, "vi");
      });

    return respond({
      ok: true,
      branch_id: branchId,
      items,
    });
  } catch (error) {
    console.error("BRANCH TOPPINGS API ERROR:", error);
    return respond(
      { ok: false, message: "Không tải được topping chi nhánh." },
      500
    );
  }
}
