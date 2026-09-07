import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PlacesRequestBody = {
  action?: "autocomplete" | "details";
  input?: string;
  placeId?: string;
};

type UnknownRecord = Record<string, unknown>;

// Server-side protection for Google Places.
// Note: module memory is best-effort on Vercel/serverless and is NOT a replacement
// for a durable/global rate limiter at the platform edge.
const AUTOCOMPLETE_MIN_LENGTH = 6;
const AUTOCOMPLETE_MAX_LENGTH = 160;
const RATE_WINDOW_MS = 60_000;
const AUTOCOMPLETE_LIMIT_PER_MINUTE = 20;
const DETAILS_LIMIT_PER_MINUTE = 10;
const GOOGLE_QUOTA_COOLDOWN_MS = 5 * 60_000;
const MAX_RATE_BUCKETS = 2_000;

type RateAction = "autocomplete" | "details";
type RateBucket = {
  windowStartedAt: number;
  autocomplete: number;
  details: number;
  lastSeenAt: number;
};

const rateBuckets = new Map<string, RateBucket>();
let autocompleteQuotaBlockedUntil = 0;
let detailsQuotaBlockedUntil = 0;

function normalizeAddressInput(value: string) {
  return value.trim().replace(/\\s+/g, " ");
}

function isMeaningfulAddressInput(value: string) {
  return (
    value.length >= AUTOCOMPLETE_MIN_LENGTH &&
    value.length <= AUTOCOMPLETE_MAX_LENGTH &&
    /[A-Za-zÀ-ỹ]/.test(value)
  );
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get("origin");

  // Same-origin browser POST requests normally include Origin. We still allow
  // requests without Origin because some legitimate clients/proxies omit it.
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    return originUrl.host === request.nextUrl.host;
  } catch {
    return false;
  }
}

function consumeRateLimit(ip: string, action: RateAction) {
  const now = Date.now();
  let bucket = rateBuckets.get(ip);

  if (!bucket || now - bucket.windowStartedAt >= RATE_WINDOW_MS) {
    bucket = {
      windowStartedAt: now,
      autocomplete: 0,
      details: 0,
      lastSeenAt: now,
    };
    rateBuckets.set(ip, bucket);
  }

  bucket.lastSeenAt = now;
  bucket[action] += 1;

  if (rateBuckets.size > MAX_RATE_BUCKETS) {
    const oldest = [...rateBuckets.entries()]
      .sort((a, b) => a[1].lastSeenAt - b[1].lastSeenAt)
      .slice(0, Math.ceil(MAX_RATE_BUCKETS * 0.2));

    for (const [key] of oldest) {
      rateBuckets.delete(key);
    }
  }

  const limit =
    action === "autocomplete"
      ? AUTOCOMPLETE_LIMIT_PER_MINUTE
      : DETAILS_LIMIT_PER_MINUTE;

  const remainingMs = Math.max(
    1,
    RATE_WINDOW_MS - (now - bucket.windowStartedAt)
  );

  return {
    allowed: bucket[action] <= limit,
    retryAfterSeconds: Math.ceil(remainingMs / 1000),
  };
}

function isGoogleQuotaError(status: number, message: string) {
  return (
    status === 429 ||
    /quota exceeded|resource_exhausted|autocompleteplacesrequest|rate limit/i.test(
      message
    )
  );
}

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
    if (!isSameOriginRequest(request)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Yêu cầu không được phép.",
        },
        { status: 403 }
      );
    }

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
      const input = normalizeAddressInput(String(body.input || ""));

      // Chặn request rác trước khi chạm Google API.
      // Ví dụ chỉ nhập "178" sẽ không tiêu quota.
      if (!isMeaningfulAddressInput(input)) {
        return NextResponse.json({
          ok: true,
          suggestions: [],
        });
      }

      if (Date.now() < autocompleteQuotaBlockedUntil) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Google Maps đang tạm giới hạn lượt tìm địa chỉ. Vui lòng thử lại sau ít phút.",
          },
          {
            status: 429,
            headers: { "Retry-After": "300" },
          }
        );
      }

      const rateLimit = consumeRateLimit(
        getClientIp(request),
        "autocomplete"
      );

      if (!rateLimit.allowed) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Bạn đang tìm địa chỉ quá nhanh. Vui lòng chờ một chút rồi thử lại.",
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(rateLimit.retryAfterSeconds),
            },
          }
        );
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
        const quotaError = isGoogleQuotaError(
          googleResponse.status,
          message
        );

        if (quotaError) {
          autocompleteQuotaBlockedUntil =
            Date.now() + GOOGLE_QUOTA_COOLDOWN_MS;
        }

        console.warn("GOOGLE PLACES AUTOCOMPLETE ERROR:", {
          status: googleResponse.status,
          message,
          quotaError,
          payload,
        });

        return NextResponse.json(
          {
            ok: false,
            // Không đưa project number / quota nội bộ của Google ra giao diện khách.
            message: quotaError
              ? "Google Maps đang tạm giới hạn lượt tìm địa chỉ. Vui lòng thử lại sau ít phút."
              : "Chưa tải được gợi ý địa chỉ. Vui lòng thử lại sau.",
          },
          {
            status: quotaError ? 429 : googleResponse.status || 502,
            headers: quotaError ? { "Retry-After": "300" } : undefined,
          }
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

      if (placeId.length > 256) {
        return NextResponse.json(
          {
            ok: false,
            message: "placeId không hợp lệ.",
          },
          { status: 400 }
        );
      }

      if (Date.now() < detailsQuotaBlockedUntil) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Google Maps đang tạm giới hạn lượt kiểm tra địa chỉ. Vui lòng thử lại sau ít phút.",
          },
          {
            status: 429,
            headers: { "Retry-After": "300" },
          }
        );
      }

      const rateLimit = consumeRateLimit(getClientIp(request), "details");

      if (!rateLimit.allowed) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Bạn đang kiểm tra địa chỉ quá nhanh. Vui lòng chờ một chút rồi thử lại.",
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(rateLimit.retryAfterSeconds),
            },
          }
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
        const quotaError = isGoogleQuotaError(
          googleResponse.status,
          message
        );

        if (quotaError) {
          detailsQuotaBlockedUntil =
            Date.now() + GOOGLE_QUOTA_COOLDOWN_MS;
        }

        console.warn("GOOGLE PLACE DETAILS ERROR:", {
          status: googleResponse.status,
          message,
          quotaError,
          payload,
        });

        return NextResponse.json(
          {
            ok: false,
            message: quotaError
              ? "Google Maps đang tạm giới hạn lượt kiểm tra địa chỉ. Vui lòng thử lại sau ít phút."
              : "Chưa kiểm tra được địa chỉ Google. Vui lòng thử lại sau.",
          },
          {
            status: quotaError ? 429 : googleResponse.status || 502,
            headers: quotaError ? { "Retry-After": "300" } : undefined,
          }
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
