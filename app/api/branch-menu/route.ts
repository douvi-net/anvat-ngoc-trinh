import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type BranchRow = {
  id: string;
  code: string;
  name: string;
  short_name: string;
  is_active: boolean;
  is_open: boolean;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string | null;
  price: number;
  badge: string | null;
  image_url: string | null;
  description: string | null;
  is_sold_out: boolean | null;
  category: string | null;
  topping_category: string | null;
  sort_order: number | null;
  is_active: boolean | null;
};

type BranchProductSettingRow = {
  product_id: string;
  is_available: boolean;
  is_sold_out: boolean;
  price_override: number | null;
  sort_order: number | null;
};

type BranchMenuItem = {
  id: string;
  name: string;
  slug: string | null;
  base_price: number;
  effective_price: number;
  is_available_for_branch: boolean;
  is_sold_out_for_branch: boolean;
  price_overridden: boolean;
  sort_order: number;
  badge: string | null;
  image_url: string | null;
  description: string | null;
  category: string | null;
  topping_category: string | null;
  missing_branch_setting: boolean;
};

function isTrue(value: string | null) {
  return String(value || "").toLowerCase() === "true";
}

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const branchId = request.nextUrl.searchParams.get("branchId")?.trim() || "";
    const branchCode =
      request.nextUrl.searchParams.get("branchCode")?.trim().toLowerCase() || "";
    const includeUnavailable = isTrue(
      request.nextUrl.searchParams.get("includeUnavailable")
    );

    if (!branchId && !branchCode) {
      return jsonResponse(
        {
          ok: false,
          message: "Thiếu chi nhánh.",
        },
        400
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("branch-menu api config error: missing supabase env");
      return jsonResponse(
        {
          ok: false,
          message: "Không tải được menu chi nhánh.",
        },
        500
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    let branchQuery = supabaseAdmin
      .from("branches")
      .select("id,code,name,short_name,is_active,is_open")
      .limit(1);

    if (branchId) {
      branchQuery = branchQuery.eq("id", branchId);
    } else {
      branchQuery = branchQuery.eq("code", branchCode);
    }

    const { data: branchData, error: branchError } = await branchQuery.maybeSingle();

    if (branchError) {
      console.error("branch-menu api branch query error:", branchError);
      return jsonResponse(
        {
          ok: false,
          message: "Không tải được menu chi nhánh.",
        },
        500
      );
    }

    if (!branchData) {
      return jsonResponse(
        {
          ok: false,
          message: "Không tìm thấy chi nhánh.",
        },
        404
      );
    }

    const branch = branchData as BranchRow;

    const { data: productData, error: productError } = await supabaseAdmin
      .from("products")
      .select(
        "id,name,slug,price,badge,image_url,description,is_sold_out,category,topping_category,sort_order,is_active"
      );

    if (productError) {
      console.error("branch-menu api products query error:", productError);
      return jsonResponse(
        {
          ok: false,
          message: "Không tải được menu chi nhánh.",
        },
        500
      );
    }

    const { data: settingData, error: settingError } = await supabaseAdmin
      .from("branch_product_settings")
      .select("product_id,is_available,is_sold_out,price_override,sort_order")
      .eq("branch_id", branch.id);

    if (settingError) {
      console.error("branch-menu api settings query error:", settingError);
      return jsonResponse(
        {
          ok: false,
          message: "Không tải được menu chi nhánh.",
        },
        500
      );
    }

    const products = (productData || []) as ProductRow[];
    const settings = (settingData || []) as BranchProductSettingRow[];
    const settingByProductId = new Map(settings.map((item) => [item.product_id, item]));

    const items: BranchMenuItem[] = [];

    for (const product of products) {
      if (product.is_active === false) {
        continue;
      }

      const setting = settingByProductId.get(product.id);
      const basePrice = Number(product.price || 0);
      const defaultSortOrder = Number(product.sort_order ?? 0);

      if (!setting) {
        if (!includeUnavailable) {
          continue;
        }

        items.push({
          id: product.id,
          name: product.name,
          slug: product.slug,
          base_price: basePrice,
          effective_price: basePrice,
          is_available_for_branch: false,
          is_sold_out_for_branch: Boolean(product.is_sold_out ?? false),
          price_overridden: false,
          sort_order: defaultSortOrder,
          badge: product.badge,
          image_url: product.image_url,
          description: product.description,
          category: product.category,
          topping_category: product.topping_category,
          missing_branch_setting: true,
        });
        continue;
      }

      if (!includeUnavailable && !setting.is_available) {
        continue;
      }

      const hasOverride = setting.price_override !== null;
      const effectivePrice = hasOverride ? Number(setting.price_override) : basePrice;
      const effectiveSortOrder =
        setting.sort_order === null || setting.sort_order === undefined
          ? defaultSortOrder
          : Number(setting.sort_order);

      items.push({
        id: product.id,
        name: product.name,
        slug: product.slug,
        base_price: basePrice,
        effective_price: effectivePrice,
        is_available_for_branch: Boolean(setting.is_available),
        is_sold_out_for_branch: Boolean(setting.is_sold_out),
        price_overridden: hasOverride,
        sort_order: effectiveSortOrder,
        badge: product.badge,
        image_url: product.image_url,
        description: product.description,
        category: product.category,
        topping_category: product.topping_category,
        missing_branch_setting: false,
      });
    }

    items.sort((a, b) => {
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }
      return a.name.localeCompare(b.name, "vi");
    });

    return jsonResponse({
      ok: true,
      branch: {
        id: branch.id,
        code: branch.code,
        name: branch.name,
        short_name: branch.short_name,
        is_active: branch.is_active,
        is_open: branch.is_open,
      },
      items,
      meta: {
        total: items.length,
        branch_code: branch.code,
        mode: "preview_only",
      },
    });
  } catch (error) {
    console.error("branch-menu api unexpected error:", error);
    return jsonResponse(
      {
        ok: false,
        message: "Không tải được menu chi nhánh.",
      },
      500
    );
  }
}
