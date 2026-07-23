import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

type JwtPayload = {
  ref?: string;
  role?: string;
};

function isTrue(value: string | null) {
  return String(value || "").trim().toLowerCase() === "true";
}

function normalizeBranchCode(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

function getProjectRefFromUrl(url: string) {
  try {
    return new URL(url).hostname.split(".")[0] || "";
  } catch {
    return "";
  }
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const payloadPart = token.split(".")[1];

    if (!payloadPart) {
      return null;
    }

    const normalized = payloadPart
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payloadPart.length / 4) * 4, "=");

    return JSON.parse(
      Buffer.from(normalized, "base64").toString("utf8")
    ) as JwtPayload;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const branchId =
      request.nextUrl.searchParams.get("branchId")?.trim() || "";
    const branchCode = normalizeBranchCode(
      request.nextUrl.searchParams.get("branchCode")
    );
    const includeUnavailable = isTrue(
      request.nextUrl.searchParams.get("includeUnavailable")
    );
    const debug = isTrue(request.nextUrl.searchParams.get("debug"));

    if (!branchId && !branchCode && !debug) {
      return jsonResponse(
        {
          ok: false,
          message: "Thiếu chi nhánh.",
        },
        400
      );
    }

    const supabaseUrl = String(
      process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    ).trim();
    const serviceRoleKey = String(
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    ).trim();

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("branch-menu api config error: missing supabase env");

      return jsonResponse(
        {
          ok: false,
          message: "Không tải được menu chi nhánh.",
          ...(debug
            ? {
                debug: {
                  hasSupabaseUrl: Boolean(supabaseUrl),
                  hasServiceRoleKey: Boolean(serviceRoleKey),
                },
              }
            : {}),
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

    /*
     * Đọc danh sách branch trước rồi normalize code trong JavaScript.
     * Cách này xử lý được dữ liệu có khoảng trắng hoặc viết hoa ngoài ý muốn.
     */
    const { data: allBranchData, error: allBranchError } =
      await supabaseAdmin
        .from("branches")
        .select("id,code,name,short_name,is_active,is_open")
        .order("sort_order", { ascending: true });

    if (allBranchError) {
      console.error(
        "branch-menu api branches query error:",
        allBranchError
      );

      return jsonResponse(
        {
          ok: false,
          message: "Không tải được danh sách chi nhánh.",
          ...(debug
            ? {
                debug: {
                  projectRef: getProjectRefFromUrl(supabaseUrl),
                  supabaseError: {
                    code: allBranchError.code,
                    message: allBranchError.message,
                    details: allBranchError.details,
                    hint: allBranchError.hint,
                  },
                },
              }
            : {}),
        },
        500
      );
    }

    const branches = (allBranchData || []) as BranchRow[];
    const jwtPayload = decodeJwtPayload(serviceRoleKey);

    if (debug && !branchId && !branchCode) {
      return jsonResponse({
        ok: true,
        debug: {
          projectRefFromUrl: getProjectRefFromUrl(supabaseUrl),
          projectRefFromKey: jwtPayload?.ref || null,
          roleFromKey: jwtPayload?.role || null,
          branchCount: branches.length,
          branchCodes: branches.map((branch) => ({
            id: branch.id,
            rawCode: branch.code,
            normalizedCode: normalizeBranchCode(branch.code),
            is_active: branch.is_active,
            is_open: branch.is_open,
          })),
        },
      });
    }

    const branch =
      branches.find((item) =>
        branchId
          ? item.id === branchId
          : normalizeBranchCode(item.code) === branchCode
      ) || null;

    if (!branch) {
      return jsonResponse(
        {
          ok: false,
          message: "Không tìm thấy chi nhánh.",
          ...(debug
            ? {
                debug: {
                  requestedBranchId: branchId || null,
                  requestedBranchCode: branchCode || null,
                  projectRefFromUrl: getProjectRefFromUrl(supabaseUrl),
                  projectRefFromKey: jwtPayload?.ref || null,
                  roleFromKey: jwtPayload?.role || null,
                  branchCount: branches.length,
                  visibleBranchCodes: branches.map((item) => ({
                    rawCode: item.code,
                    normalizedCode: normalizeBranchCode(item.code),
                  })),
                },
              }
            : {}),
        },
        404
      );
    }

    const { data: productData, error: productError } =
      await supabaseAdmin
        .from("products")
        .select(
          "id,name,slug,price,badge,image_url,description,is_sold_out,category,topping_category,sort_order,is_active"
        );

    if (productError) {
      console.error(
        "branch-menu api products query error:",
        productError
      );

      return jsonResponse(
        {
          ok: false,
          message: "Không tải được menu chi nhánh.",
        },
        500
      );
    }

    const { data: settingData, error: settingError } =
      await supabaseAdmin
        .from("branch_product_settings")
        .select(
          "product_id,is_available,is_sold_out,price_override,sort_order"
        )
        .eq("branch_id", branch.id);

    if (settingError) {
      console.error(
        "branch-menu api settings query error:",
        settingError
      );

      return jsonResponse(
        {
          ok: false,
          message: "Không tải được menu chi nhánh.",
        },
        500
      );
    }

    const products = (productData || []) as ProductRow[];
    const settings =
      (settingData || []) as BranchProductSettingRow[];

    const settingByProductId = new Map(
      settings.map((item) => [item.product_id, item])
    );

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
          is_sold_out_for_branch: Boolean(
            product.is_sold_out ?? false
          ),
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
      const effectivePrice = hasOverride
        ? Number(setting.price_override)
        : basePrice;
      const effectiveSortOrder =
        setting.sort_order === null ||
        setting.sort_order === undefined
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
        code: normalizeBranchCode(branch.code),
        name: branch.name,
        short_name: branch.short_name,
        is_active: branch.is_active,
        is_open: branch.is_open,
      },
      items,
      meta: {
        total: items.length,
        branch_code: normalizeBranchCode(branch.code),
        mode: "preview_only",
      },
      ...(debug
        ? {
            debug: {
              projectRefFromUrl: getProjectRefFromUrl(supabaseUrl),
              projectRefFromKey: jwtPayload?.ref || null,
              roleFromKey: jwtPayload?.role || null,
              branchCount: branches.length,
              productCount: products.length,
              settingCount: settings.length,
            },
          }
        : {}),
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