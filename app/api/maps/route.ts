import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SHOP_LOCATION = {
  lat: 10.7456603,
  lng: 106.6345814,
  address: "240/127/22C Nguyễn Văn Luông, Quận 6, Hồ Chí Minh, Việt Nam",
};

type RouteRequestBody = {
  lat?: number;
  lng?: number;
  branchId?: string | null;
};

type BranchRow = {
  id: string;
  code: string;
  short_name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  is_active?: boolean | null;
  is_open?: boolean | null;
};

type SelectedBranchPreview = {
  id: string | null;
  code: string;
  short_name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  distance_text: string;
  duration_text: string;
  shipping_fee: number | null;
  is_supported_area: boolean;
};

type DistanceResult = {
  distanceKm: number;
  distanceMeters: number;
  distanceText: string;
  durationText: string;
  shippingFee: number | null;
};

function calculateShippingFee(distanceKm: number) {
  if (distanceKm <= 0.5) return 0;
  if (distanceKm <= 2) return 18000;
  if (distanceKm <= 3) return 22000;
  if (distanceKm <= 4) return 26000;
  if (distanceKm <= 5) return 30000;
  if (distanceKm <= 6) return 34000;
  if (distanceKm <= 7) return 38000;
  if (distanceKm <= 8) return 42000;
  if (distanceKm <= 9) return 46000;
  if (distanceKm <= 10) return 50000;

  return null;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function calculateDistanceKm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightDistanceKm = earthRadiusKm * c;
  const estimatedRoadDistanceKm = straightDistanceKm * 1.25;

  return Number(estimatedRoadDistanceKm.toFixed(2));
}

function estimateDurationText(distanceKm: number) {
  const averageSpeedKmH = 22;
  const minutes = Math.max(5, Math.ceil((distanceKm / averageSpeedKmH) * 60));

  return `${minutes} phút`;
}

function isValidCoordinate(value: number | null) {
  return typeof value === "number" && Number.isFinite(value);
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function loadAvailableBranches(): Promise<BranchRow[]> {
  const supabaseAdmin = getSupabaseAdmin();

  if (!supabaseAdmin) {
    return [];
  }

  const { data, error } = await supabaseAdmin
    .from("branches")
    .select(
      "id,code,short_name,address,latitude,longitude,is_active,is_open"
    )
    .eq("is_active", true);

  if (error) {
    console.error("LOAD BRANCHES ERROR:", error);
    return [];
  }

  return ((data || []) as BranchRow[]).filter(
    (branch) =>
      branch.is_open !== false &&
      isValidCoordinate(branch.latitude) &&
      isValidCoordinate(branch.longitude)
  );
}

function calculateDistanceResult(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): DistanceResult {
  const distanceKm = calculateDistanceKm(fromLat, fromLng, toLat, toLng);

  return {
    distanceKm,
    distanceMeters: Math.round(distanceKm * 1000),
    distanceText: `${distanceKm} km`,
    durationText: estimateDurationText(distanceKm),
    shippingFee: calculateShippingFee(distanceKm),
  };
}

function buildBranchPreview(
  branch: BranchRow,
  customerLat: number,
  customerLng: number
): SelectedBranchPreview {
  const result = calculateDistanceResult(
    branch.latitude as number,
    branch.longitude as number,
    customerLat,
    customerLng
  );

  return {
    id: branch.id,
    code: branch.code,
    short_name: branch.short_name,
    address: branch.address,
    latitude: branch.latitude as number,
    longitude: branch.longitude as number,
    distance_km: result.distanceKm,
    distance_text: result.distanceText,
    duration_text: result.durationText,
    shipping_fee: result.shippingFee,
    is_supported_area: result.shippingFee !== null,
  };
}

function buildFallbackSelectedBranch(
  customerLat: number,
  customerLng: number
): SelectedBranchPreview {
  const fallbackDistance = calculateDistanceResult(
    SHOP_LOCATION.lat,
    SHOP_LOCATION.lng,
    customerLat,
    customerLng
  );

  return {
    id: null,
    code: "q6",
    short_name: "Quận 6",
    address: SHOP_LOCATION.address,
    latitude: SHOP_LOCATION.lat,
    longitude: SHOP_LOCATION.lng,
    distance_km: fallbackDistance.distanceKm,
    distance_text: fallbackDistance.distanceText,
    duration_text: fallbackDistance.durationText,
    shipping_fee: fallbackDistance.shippingFee,
    is_supported_area: fallbackDistance.shippingFee !== null,
  };
}

function findNearestBranch(
  branches: BranchRow[],
  customerLat: number,
  customerLng: number
) {
  let nearest: SelectedBranchPreview | null = null;

  for (const branch of branches) {
    const preview = buildBranchPreview(branch, customerLat, customerLng);

    if (!nearest || preview.distance_km < nearest.distance_km) {
      nearest = preview;
    }
  }

  return nearest;
}

function buildResponse(
  branch: SelectedBranchPreview,
  mode: "manual_branch" | "nearest_branch" | "fallback_shop"
) {
  return NextResponse.json({
    ok: true,
    shop: {
      lat: branch.latitude,
      lng: branch.longitude,
      address: branch.address,
    },
    distance_meters: Math.round(branch.distance_km * 1000),
    distance_km: branch.distance_km,
    distance_text: branch.distance_text,
    duration_text: branch.duration_text,
    shipping_fee: branch.shipping_fee,
    is_supported_area: branch.is_supported_area,
    message:
      branch.shipping_fee === null
        ? "Khoảng cách trên 10km. Quán sẽ xác nhận phí ship."
        : "Đã tính phí ship theo chi nhánh phục vụ.",
    selected_branch: branch,
    branch_selection_mode: mode,
    calculated_from_branch_id: branch.id,
    calculated_from_branch_code: branch.code,
  });
}

export async function POST(request: NextRequest) {
  try {
    const previewNearestBranch =
      request.nextUrl.searchParams.get("previewNearestBranch") === "true";

    let body: RouteRequestBody;

    try {
      body = (await request.json()) as RouteRequestBody;
    } catch {
      return NextResponse.json(
        { ok: false, message: "Dữ liệu gửi lên không hợp lệ." },
        { status: 400 }
      );
    }

    const lat = Number(body.lat);
    const lng = Number(body.lng);
    const requestedBranchId = String(body.branchId || "").trim();

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return NextResponse.json(
        { ok: false, message: "Thiếu tọa độ giao hàng." },
        { status: 400 }
      );
    }

    const branches = await loadAvailableBranches();

    if (requestedBranchId) {
      const selectedBranch = branches.find(
        (branch) => branch.id === requestedBranchId
      );

      if (!selectedBranch) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Chi nhánh đã chọn không tồn tại, đang đóng hoặc chưa có tọa độ.",
          },
          { status: 409 }
        );
      }

      return buildResponse(
        buildBranchPreview(selectedBranch, lat, lng),
        "manual_branch"
      );
    }

    const nearestBranch = findNearestBranch(branches, lat, lng);

    if (nearestBranch) {
      return buildResponse(nearestBranch, "nearest_branch");
    }

    /*
     * Không âm thầm dùng Quận 6 trong luồng chọn chi nhánh.
     * Nếu database không trả được chi nhánh, frontend cần biết để chặn đơn,
     * tránh hiển thị Quận 1 nhưng lại tính ship từ Quận 6.
     */
    if (previewNearestBranch) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Không tải được chi nhánh đang mở để tính quãng đường.",
        },
        { status: 503 }
      );
    }

    const fallbackBranch = buildFallbackSelectedBranch(lat, lng);
    return buildResponse(fallbackBranch, "fallback_shop");
  } catch (error) {
    console.error("MAPS ROUTE ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Lỗi server khi tính phí ship.",
      },
      { status: 500 }
    );
  }
}
