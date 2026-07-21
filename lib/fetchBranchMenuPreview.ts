type UnknownRecord = Record<string, unknown>;

export type BranchMenuPreviewBranch = {
  id: string;
  code: string;
  name: string;
  short_name: string;
  is_active: boolean;
  is_open: boolean;
};

export type BranchMenuPreviewItem = {
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

export type BranchMenuPreviewMeta = {
  total: number;
  branch_code: string;
  mode: string;
};

export type BranchMenuPreviewResult = {
  ok: boolean;
  branch: BranchMenuPreviewBranch | null;
  items: BranchMenuPreviewItem[];
  meta: BranchMenuPreviewMeta | null;
  message: string | null;
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function toNumberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toBooleanOrNull(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function parseBranch(value: unknown): BranchMenuPreviewBranch | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = toStringOrNull(value.id);
  const code = toStringOrNull(value.code);
  const name = toStringOrNull(value.name);
  const shortName = toStringOrNull(value.short_name);
  const isActive = toBooleanOrNull(value.is_active);
  const isOpen = toBooleanOrNull(value.is_open);

  if (
    id === null ||
    code === null ||
    name === null ||
    shortName === null ||
    isActive === null ||
    isOpen === null
  ) {
    return null;
  }

  return {
    id,
    code,
    name,
    short_name: shortName,
    is_active: isActive,
    is_open: isOpen,
  };
}

function parseItem(value: unknown): BranchMenuPreviewItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = toStringOrNull(value.id);
  const name = toStringOrNull(value.name);
  const slugRaw = value.slug;
  const slug = typeof slugRaw === "string" || slugRaw === null ? slugRaw : null;
  const basePrice = toNumberOrNull(value.base_price);
  const effectivePrice = toNumberOrNull(value.effective_price);
  const isAvailable = toBooleanOrNull(value.is_available_for_branch);
  const isSoldOut = toBooleanOrNull(value.is_sold_out_for_branch);
  const priceOverridden = toBooleanOrNull(value.price_overridden);
  const sortOrder = toNumberOrNull(value.sort_order);

  const badgeRaw = value.badge;
  const badge = typeof badgeRaw === "string" || badgeRaw === null ? badgeRaw : null;

  const imageUrlRaw = value.image_url;
  const imageUrl =
    typeof imageUrlRaw === "string" || imageUrlRaw === null ? imageUrlRaw : null;

  const descriptionRaw = value.description;
  const description =
    typeof descriptionRaw === "string" || descriptionRaw === null
      ? descriptionRaw
      : null;

  const categoryRaw = value.category;
  const category =
    typeof categoryRaw === "string" || categoryRaw === null ? categoryRaw : null;

  const toppingCategoryRaw = value.topping_category;
  const toppingCategory =
    typeof toppingCategoryRaw === "string" || toppingCategoryRaw === null
      ? toppingCategoryRaw
      : null;

  const missingBranchSetting = toBooleanOrNull(value.missing_branch_setting);

  if (
    id === null ||
    name === null ||
    basePrice === null ||
    effectivePrice === null ||
    isAvailable === null ||
    isSoldOut === null ||
    priceOverridden === null ||
    sortOrder === null ||
    missingBranchSetting === null
  ) {
    return null;
  }

  return {
    id,
    name,
    slug,
    base_price: basePrice,
    effective_price: effectivePrice,
    is_available_for_branch: isAvailable,
    is_sold_out_for_branch: isSoldOut,
    price_overridden: priceOverridden,
    sort_order: sortOrder,
    badge,
    image_url: imageUrl,
    description,
    category,
    topping_category: toppingCategory,
    missing_branch_setting: missingBranchSetting,
  };
}

function parseMeta(value: unknown): BranchMenuPreviewMeta | null {
  if (!isRecord(value)) {
    return null;
  }

  const total = toNumberOrNull(value.total);
  const branchCode = toStringOrNull(value.branch_code);
  const mode = toStringOrNull(value.mode);

  if (total === null || branchCode === null || mode === null) {
    return null;
  }

  return {
    total,
    branch_code: branchCode,
    mode,
  };
}

export async function fetchBranchMenuPreview(
  params: {
    branchId?: string | null;
    branchCode?: string | null;
  },
  signal?: AbortSignal
): Promise<BranchMenuPreviewResult> {
  const branchId = params.branchId?.trim() || "";
  const branchCode = params.branchCode?.trim() || "";

  if (!branchId && !branchCode) {
    return {
      ok: false,
      branch: null,
      items: [],
      meta: null,
      message: "Thiếu chi nhánh.",
    };
  }

  const searchParams = new URLSearchParams();

  if (branchId) {
    searchParams.set("branchId", branchId);
  } else {
    searchParams.set("branchCode", branchCode);
  }

  try {
    const response = await fetch(`/api/branch-menu?${searchParams.toString()}`, {
      method: "GET",
      cache: "no-store",
      signal,
    });

    const payloadUnknown: unknown = await response.json();

    if (!isRecord(payloadUnknown)) {
      return {
        ok: false,
        branch: null,
        items: [],
        meta: null,
        message: "Không tải được menu chi nhánh.",
      };
    }

    const ok = payloadUnknown.ok === true;
    const message = toStringOrNull(payloadUnknown.message);

    if (!ok) {
      return {
        ok: false,
        branch: null,
        items: [],
        meta: null,
        message: message || "Không tải được menu chi nhánh.",
      };
    }

    const branch = parseBranch(payloadUnknown.branch);
    const meta = parseMeta(payloadUnknown.meta);
    const rawItems = Array.isArray(payloadUnknown.items) ? payloadUnknown.items : [];
    const items = rawItems
      .map((item) => parseItem(item))
      .filter((item): item is BranchMenuPreviewItem => item !== null);

    if (!branch || !meta) {
      return {
        ok: false,
        branch: null,
        items: [],
        meta: null,
        message: "Không tải được menu chi nhánh.",
      };
    }

    return {
      ok: true,
      branch,
      items,
      meta,
      message,
    };
  } catch {
    return {
      ok: false,
      branch: null,
      items: [],
      meta: null,
      message: "Không tải được menu chi nhánh.",
    };
  }
}
