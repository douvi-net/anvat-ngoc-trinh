import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PlacesRequestBody = {
  action?: "autocomplete" | "details";
  input?: string;
  placeId?: string;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function getGoogleApiKey() {
  return (
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_PLACES_API_KEY ||
    ""
  ).trim();
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const rawText = await response.text();

  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText) as unknown;
  } catch {
    return {
      rawText: rawText.slice(0, 1000),
    };
  }
}

function getGoogleErrorMessage(payload: unknown, fallback: string) {
  if (!isRecord(payload)) {
    return fallback;
  }

  const error = isRecord(payload.error) ? payload.error : null;
  const errorMessage =
    typeof error?.message === "string" ? error.message.trim() : "";

  const directMessage =
    typeof payload.message === "string" ? payload.message.trim() : "";

  return errorMessage || directMessage || fallback;
}

function normalizeAutocompleteSuggestions(payload: unknown) {
  if (!isRecord(payload) || !Array.isArray(payload.suggestions)) {
    return [];
  }

  return payload.suggestions
    .map((item) => {
      if (!isRecord(item) || !isRecord(item.placePrediction)) {
        return null;
      }

      const prediction = item.placePrediction;
      const textRecord = isRecord(prediction.text) ? prediction.text : null;
      const structuredFormat = isRecord(prediction.structuredFormat)
        ? prediction.structuredFormat
        : null;
      const mainTextRecord =
        structuredFormat && isRecord(structuredFormat.mainText)
          ? structuredFormat.mainText
          : null;
      const secondaryTextRecord =
        structuredFormat && isRecord(structuredFormat.secondaryText)
          ? structuredFormat.secondaryText
          : null;

      const placeId =
        typeof prediction.placeId === "string"
          ? prediction.placeId.trim()
          : "";
      const text =
        typeof textRecord?.text === "string" ? textRecord.text.trim() : "";
      const mainText =
        typeof mainTextRecord?.text === "string"
          ? mainTextRecord.text.trim()
          : text;
      const secondaryText =
        typeof secondaryTextRecord?.text === "string"
          ? secondaryTextRecord.text.trim()
          : "";

      if (!placeId || !text) {
        return null;
      }

      return {
        placeId,
        text,
        mainText,
        secondaryText,
      };
    })
    .filter(
      (
        item
      ): item is {
        placeId: string;
        text: string;
        mainText: string;
        secondaryText: string;
      } => item !== null
    );
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = getGoogleApiKey();

    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Thiếu GOOGLE_MAPS_API_KEY trong biến môi trường của server.",
        },
        { status: 500 }
      );
    }

    let body: PlacesRequestBody;

    try {
      body = (await request.json()) as PlacesRequestBody;
    } catch {
      return NextResponse.json(
        {
          ok: false,
          message: "Dữ liệu gửi lên không hợp lệ.",
        },
        { status: 400 }
      );
    }

    if (body.action === "autocomplete") {
      const input = String(body.input || "").trim();

      if (input.length < 2) {
        return NextResponse.json({
          ok: true,
          suggestions: [],
        });
      }

      const googleResponse = await fetch(
        "https://places.googleapis.com/v1/places:autocomplete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask":
              "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat",
          },
          cache: "no-store",
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
                radius: 30000,
              },
            },
          }),
        }
      );

      const payload = await readJsonResponse(googleResponse);

      if (!googleResponse.ok) {
        const message = getGoogleErrorMessage(
          payload,
          `Google Places Autocomplete trả về lỗi HTTP ${googleResponse.status}.`
        );

        console.warn("GOOGLE PLACES AUTOCOMPLETE ERROR:", {
          status: googleResponse.status,
          message,
          payload,
        });

        return NextResponse.json(
          {
            ok: false,
            message,
          },
          { status: googleResponse.status || 502 }
        );
      }

      const suggestions = normalizeAutocompleteSuggestions(payload);

      return NextResponse.json({
        ok: true,
        suggestions,
      });
    }

    if (body.action === "details") {
      const placeId = String(body.placeId || "").trim();

      if (!placeId) {
        return NextResponse.json(
          {
            ok: false,
            message: "Thiếu placeId.",
          },
          { status: 400 }
        );
      }

      const googleResponse = await fetch(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(
          placeId
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask":
              "id,formattedAddress,displayName,location",
          },
          cache: "no-store",
        }
      );

      const payload = await readJsonResponse(googleResponse);

      if (!googleResponse.ok) {
        const message = getGoogleErrorMessage(
          payload,
          `Google Place Details trả về lỗi HTTP ${googleResponse.status}.`
        );

        console.warn("GOOGLE PLACE DETAILS ERROR:", {
          status: googleResponse.status,
          message,
          payload,
        });

        return NextResponse.json(
          {
            ok: false,
            message,
          },
          { status: googleResponse.status || 502 }
        );
      }

      if (!isRecord(payload)) {
        return NextResponse.json(
          {
            ok: false,
            message: "Google không trả về dữ liệu địa chỉ hợp lệ.",
          },
          { status: 502 }
        );
      }

      const location = isRecord(payload.location)
        ? payload.location
        : null;
      const displayName = isRecord(payload.displayName)
        ? payload.displayName
        : null;

      const lat = Number(location?.latitude);
      const lng = Number(location?.longitude);
      const address =
        typeof payload.formattedAddress === "string"
          ? payload.formattedAddress.trim()
          : typeof displayName?.text === "string"
          ? displayName.text.trim()
          : "";

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        !address
      ) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Địa chỉ Google trả về chưa có đủ tọa độ hoặc địa chỉ hiển thị.",
          },
          { status: 502 }
        );
      }

      return NextResponse.json({
        ok: true,
        place: {
          id:
            typeof payload.id === "string"
              ? payload.id
              : placeId,
          address,
          lat,
          lng,
        },
      });
    }

    return NextResponse.json(
      {
        ok: false,
        message: "Action không hợp lệ.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("PLACES ROUTE ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? `Lỗi server khi xử lý địa chỉ: ${error.message}`
            : "Lỗi server khi xử lý địa chỉ.",
      },
      { status: 500 }
    );
  }
}
