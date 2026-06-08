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
  if (distanceKm <= 2) return 15000;
  if (distanceKm <= 5) return 20000;
  if (distanceKm <= 8) return 30000;

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, message: "Missing GOOGLE_MAPS_API_KEY" },
        { status: 500 }
      );
    }

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

    const params = new URLSearchParams({
      origins: `${SHOP_LOCATION.lat},${SHOP_LOCATION.lng}`,
      destinations: `${lat},${lng}`,
      mode: "driving",
      language: "vi",
      units: "metric",
      key: apiKey,
    });

    const googleResponse = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`,
      {
        method: "GET",
      }
    );

    const data = await googleResponse.json();

    if (!googleResponse.ok || data.status !== "OK") {
      return NextResponse.json(
        {
          ok: false,
          message:
  data?.error_message ||
  JSON.stringify(data) ||
  "Không tính được tuyến đường từ Google Maps.",
          error: data,
        },
        { status: googleResponse.ok ? 400 : googleResponse.status }
      );
    }

    const element = data?.rows?.[0]?.elements?.[0];

    if (!element || element.status !== "OK") {
      return NextResponse.json(
        {
          ok: false,
          message:
            element?.status === "ZERO_RESULTS"
              ? "Không tìm thấy tuyến đường phù hợp."
              : element?.status || "Không tính được khoảng cách giao hàng.",
          error: data,
        },
        { status: 400 }
      );
    }

    const distanceMeters = Number(element.distance?.value || 0);
    const distanceKm = Number((distanceMeters / 1000).toFixed(2));

    const durationText = element.duration?.text || "";
    const distanceText = element.distance?.text || `${distanceKm} km`;

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
          : "Đã tính phí ship theo Google Distance Matrix.",
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