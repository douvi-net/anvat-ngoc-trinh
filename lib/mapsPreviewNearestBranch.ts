export type PreviewSelectedBranch = {
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

export type PreviewMapsResult = {
  ok: boolean;
  message: string;
  selectedBranch: PreviewSelectedBranch | null;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toBooleanOrNull(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function parseSelectedBranch(value: unknown): PreviewSelectedBranch | null {
  if (!isRecord(value)) {
    return null;
  }

  const idRaw = value.id;
  const id: string | null =
    typeof idRaw === "string" ? idRaw : null;

  const code = toStringOrNull(value.code);
  const shortName = toStringOrNull(value.short_name);
  const address = toStringOrNull(value.address);
  const latitude = toNumberOrNull(value.latitude);
  const longitude = toNumberOrNull(value.longitude);
  const distanceKm = toNumberOrNull(value.distance_km);
  const distanceText = toStringOrNull(value.distance_text);
  const durationText = toStringOrNull(value.duration_text);
  const shippingFeeRaw = value.shipping_fee;
  const shippingFee =
    shippingFeeRaw === null ? null : toNumberOrNull(shippingFeeRaw);
  const isSupportedArea = toBooleanOrNull(value.is_supported_area);

  if (
    code === null ||
    shortName === null ||
    address === null ||
    latitude === null ||
    longitude === null ||
    distanceKm === null ||
    distanceText === null ||
    durationText === null ||
    isSupportedArea === null ||
    shippingFee === undefined
  ) {
    return null;
  }

  return {
    id,
    code,
    short_name: shortName,
    address,
    latitude,
    longitude,
    distance_km: distanceKm,
    distance_text: distanceText,
    duration_text: durationText,
    shipping_fee: shippingFee,
    is_supported_area: isSupportedArea,
  };
}

export async function fetchMapsPreviewNearestBranch(
  lat: number,
  lng: number,
  signal?: AbortSignal,
  branchId?: string | null
): Promise<PreviewMapsResult> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return {
      ok: false,
      message: "Tọa độ giao hàng không hợp lệ.",
      selectedBranch: null,
    };
  }

  try {
    const response = await fetch("/api/maps?previewNearestBranch=true", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        lat,
        lng,
        branchId: branchId?.trim() || null,
      }),
      signal,
    });

    const payloadUnknown: unknown = await response.json().catch(() => null);

    if (!isRecord(payloadUnknown)) {
      return {
        ok: false,
        message: "Không đọc được dữ liệu chi nhánh từ máy chủ.",
        selectedBranch: null,
      };
    }

    const ok = payloadUnknown.ok === true;
    const message =
      toStringOrNull(payloadUnknown.message) ||
      (ok
        ? "Đã xác định chi nhánh gần nhất."
        : `Không tải được chi nhánh. Mã lỗi ${response.status}.`);

    const selectedBranch = parseSelectedBranch(
      payloadUnknown.selected_branch
    );

    if (!response.ok || !ok) {
      return {
        ok: false,
        message,
        selectedBranch: null,
      };
    }

    if (!selectedBranch) {
      return {
        ok: false,
        message: "Máy chủ chưa trả về chi nhánh hợp lệ.",
        selectedBranch: null,
      };
    }

    return {
      ok: true,
      message,
      selectedBranch,
    };
  } catch (error) {
    if (signal?.aborted) {
      return {
        ok: false,
        message: "Yêu cầu xác định chi nhánh đã bị hủy.",
        selectedBranch: null,
      };
    }

    console.error("FETCH MAPS PREVIEW ERROR:", error);

    return {
      ok: false,
      message: "Không tải được dữ liệu chi nhánh từ máy chủ.",
      selectedBranch: null,
    };
  }
}
