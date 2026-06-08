import { NextRequest, NextResponse } from "next/server";

type PlacesRequestBody = {
  action?: "autocomplete" | "details";
  input?: string;
  placeId?: string;
};

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, message: "Missing GOOGLE_MAPS_API_KEY" },
        { status: 500 }
      );
    }

    const body = (await request.json()) as PlacesRequestBody;

    if (body.action === "autocomplete") {
      const input = String(body.input || "").trim();

      if (input.length < 2) {
        return NextResponse.json({ ok: true, suggestions: [] });
      }

      const googleResponse = await fetch(
        "https://places.googleapis.com/v1/places:autocomplete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
          },
          body: JSON.stringify({
            input,
            languageCode: "vi",
            regionCode: "VN",
            includedRegionCodes: ["vn"],
            locationBias: {
              circle: {
                center: {
                  latitude: 10.7456603,
                  longitude: 106.6345814,
                },
                radius: 12000,
              },
            },
          }),
        }
      );

      const data = await googleResponse.json();

      if (!googleResponse.ok) {
        return NextResponse.json(
          {
            ok: false,
            message:
              data?.error?.message || "Không lấy được gợi ý địa chỉ.",
            error: data,
          },
          { status: googleResponse.status }
        );
      }

      const suggestions = (data?.suggestions || [])
        .map((item: any) => {
          const prediction = item.placePrediction;

          if (!prediction?.placeId) return null;

          return {
            placeId: prediction.placeId,
            text: prediction.text?.text || "",
            mainText:
              prediction.structuredFormat?.mainText?.text ||
              prediction.text?.text ||
              "",
            secondaryText:
              prediction.structuredFormat?.secondaryText?.text || "",
          };
        })
        .filter(Boolean);

      return NextResponse.json({
        ok: true,
        suggestions,
      });
    }

    if (body.action === "details") {
      const placeId = String(body.placeId || "").trim();

      if (!placeId) {
        return NextResponse.json(
          { ok: false, message: "Thiếu placeId." },
          { status: 400 }
        );
      }

      const googleResponse = await fetch(
        `https://places.googleapis.com/v1/places/${placeId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask":
              "id,formattedAddress,displayName,location",
          },
        }
      );

      const data = await googleResponse.json();

      if (!googleResponse.ok) {
        return NextResponse.json(
          {
            ok: false,
            message:
              data?.error?.message || "Không lấy được chi tiết địa chỉ.",
            error: data,
          },
          { status: googleResponse.status }
        );
      }

      return NextResponse.json({
        ok: true,
        place: {
          id: data.id,
          address:
            data.formattedAddress ||
            data.displayName?.text ||
            "",
          lat: data.location?.latitude,
          lng: data.location?.longitude,
        },
      });
    }

    return NextResponse.json(
      { ok: false, message: "Action không hợp lệ." },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Lỗi server khi xử lý địa chỉ.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}