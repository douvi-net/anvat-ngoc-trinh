import { NextRequest, NextResponse } from "next/server";

const SHOP_LOCATION = {
  lat: 10.7456603,
  lng: 106.6345814,
  address: "240/127/22C Nguyễn Văn Luông, Quận 6, Hồ Chí Minh, Việt Nam",
};

type RouteRequestBody = {
  lat?: number;
  lng?: number;
};

function calculateShippingFee(distanceKm: number) {
  if (distanceKm <= 0.5) return 0;
  if (distanceKm <= 2) return 16000;
  if (distanceKm <= 5) return 21000;
  if (distanceKm <= 8) return 31000;

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

export async function POST(request: NextRequest) {
  try {
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

    const distanceKm = calculateDistanceKm(
      SHOP_LOCATION.lat,
      SHOP_LOCATION.lng,
      lat,
      lng
    );

    const distanceMeters = Math.round(distanceKm * 1000);
    const distanceText = `${distanceKm} km`;
    const durationText = estimateDurationText(distanceKm);
    const shippingFee = calculateShippingFee(distanceKm);

    return NextResponse.json({
      ok: true,
      shop: SHOP_LOCATION,
      distance_meters: distanceMeters,
      distance_km: distanceKm,
      distance_text: distanceText,
      duration_text: durationText,
      shipping_fee: shippingFee,
      is_supported_area: shippingFee !== null,
      message:
        shippingFee === null
          ? "Khoảng cách ngoài khu vực giao hàng tự động. Quán sẽ xác nhận phí ship."
          : "Đã tính phí ship tự động theo tọa độ Google Maps.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Lỗi server khi tính phí ship.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}