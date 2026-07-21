import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SHOP_LOCATION = {
  lat: 10.7456603,
  lng: 106.6345814,
  address: "240/127/22C Nguyễn Văn Luông, Quận 6, Hồ Chí Minh, Việt Nam",
};

type RouteRequestBody = {
  lat?: number;
  lng?: number;
};

type BranchRow = {
  id: string;
  code: string;
  short_name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
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

  // Hệ số quy đổi từ đường chim bay sang đường xe chạy thực tế trong nội thành.
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

async function getNearestBranchPreview(
  customerLat: number,
  customerLng: number
): Promise<SelectedBranchPreview | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabaseAdmin
    .from("branches")
    .select("id,code,short_name,address,latitude,longitude")
    .eq("is_active", true)
    .eq("is_open", true);

  if (error || !Array.isArray(data)) {
    return null;
  }

  const branches = data as BranchRow[];

  const candidates = branches.filter(
    (branch) =>
      isValidCoordinate(branch.latitude) && isValidCoordinate(branch.longitude)
  );

  if (candidates.length === 0) {
    return null;
  }

  let nearest: SelectedBranchPreview | null = null;

  for (const branch of candidates) {
    const distanceKm = calculateDistanceKm(
      branch.latitude as number,
      branch.longitude as number,
      customerLat,
      customerLng
    );
    const shippingFee = calculateShippingFee(distanceKm);

    const preview: SelectedBranchPreview = {
      id: branch.id,
      code: branch.code,
      short_name: branch.short_name,
      address: branch.address,
      latitude: branch.latitude as number,
      longitude: branch.longitude as number,
      distance_km: distanceKm,
      distance_text: `${distanceKm} km`,
      duration_text: estimateDurationText(distanceKm),
      shipping_fee: shippingFee,
      is_supported_area: shippingFee !== null,
    };

    if (!nearest || preview.distance_km < nearest.distance_km) {
      nearest = preview;
    }
  }

  return nearest;
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

export async function POST(request: NextRequest) {
  try {
    const previewNearestBranch =
      request.nextUrl.searchParams.get("previewNearestBranch") === "true";
    const body = (await request.json()) as RouteRequestBody;

    const lat = Number(body.lat);
    const lng = Number(body.lng);

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

    const q6Result = calculateDistanceResult(
      SHOP_LOCATION.lat,
      SHOP_LOCATION.lng,
      lat,
      lng
    );

    if (!previewNearestBranch) {
      return NextResponse.json({
        ok: true,
        shop: SHOP_LOCATION,
        distance_meters: q6Result.distanceMeters,
        distance_km: q6Result.distanceKm,
        distance_text: q6Result.distanceText,
        duration_text: q6Result.durationText,
        shipping_fee: q6Result.shippingFee,
        is_supported_area: q6Result.shippingFee !== null,
        message:
          q6Result.shippingFee === null
            ? "Khoảng cách trên 10km. Quán sẽ xác nhận phí ship."
            : "Đã tính phí ship tự động theo tọa độ Google Maps.",
      });
    }

    const nearestBranch =
      (await getNearestBranchPreview(lat, lng)) ||
      buildFallbackSelectedBranch(lat, lng);

    return NextResponse.json({
      ok: true,
      shop: {
        lat: nearestBranch.latitude,
        lng: nearestBranch.longitude,
        address: nearestBranch.address,
      },
      distance_meters: Math.round(nearestBranch.distance_km * 1000),
      distance_km: nearestBranch.distance_km,
      distance_text: nearestBranch.distance_text,
      duration_text: nearestBranch.duration_text,
      shipping_fee: nearestBranch.shipping_fee,
      is_supported_area: nearestBranch.is_supported_area,
      message:
        nearestBranch.shipping_fee === null
          ? "Khoảng cách trên 10km. Quán sẽ xác nhận phí ship."
          : "Đã tính phí ship tự động theo tọa độ Google Maps.",
      selected_branch: nearestBranch,
      branch_selection_mode: "preview_nearest_branch",
    });
  } catch (error) {
    console.error("maps route error:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Lỗi server khi tính phí ship.",
      },
      { status: 500 }
    );
  }
}