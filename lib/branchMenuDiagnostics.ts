import type { BranchMenuPreviewItem } from "./fetchBranchMenuPreview";
import type { PreviewSelectedBranch } from "./mapsPreviewNearestBranch";

export interface BranchMenuValidationIssues {
  duplicateIds: string[];
  invalidPriceIds: string[];
  negativePriceIds: string[];
  missingFieldIds: string[];
  emptyPreview: boolean;
  branchInactive: boolean;
  branchClosed: boolean;
}

export interface BranchMenuDiagnostics {
  flagEnabled: boolean;
  usingBranchMenu: boolean;
  branchId: string | null;
  branchCode: string | null;
  legacyCount: number;
  previewCount: number;
  missingInPreview: string[];
  previewOnlyIds: string[];
  invalidPriceIds: string[];
  unavailableIds: string[];
  soldOutIds: string[];
  duplicatePreviewIds: string[];
  criticalErrors: string[];
  shouldFallback: boolean;
}

/**
 * Validate branch menu preview data for critical issues
 * Returns list of product IDs with issues
 */
export function validateBranchMenuData(
  preview: BranchMenuPreviewItem[]
): BranchMenuValidationIssues {
  const issues: BranchMenuValidationIssues = {
    duplicateIds: [],
    invalidPriceIds: [],
    negativePriceIds: [],
    missingFieldIds: [],
    emptyPreview: preview.length === 0,
    branchInactive: false,
    branchClosed: false,
  };

  const seenIds = new Set<string>();

  for (const item of preview) {
    // Check for duplicate IDs
    if (seenIds.has(item.id)) {
      if (!issues.duplicateIds.includes(item.id)) {
        issues.duplicateIds.push(item.id);
      }
    }
    seenIds.add(item.id);

    // Check for missing critical fields
    if (!item.id || !item.name) {
      if (!issues.missingFieldIds.includes(item.id)) {
        issues.missingFieldIds.push(item.id);
      }
    }

    // Check for invalid prices
    const price = item.effective_price;
    if (!Number.isFinite(price)) {
      if (!issues.invalidPriceIds.includes(item.id)) {
        issues.invalidPriceIds.push(item.id);
      }
    }

    // Check for negative prices
    if (Number.isFinite(price) && price < 0) {
      if (!issues.negativePriceIds.includes(item.id)) {
        issues.negativePriceIds.push(item.id);
      }
    }
  }

  return issues;
}

/**
 * Determine if preview has critical errors requiring fallback
 */
export function hasCriticalErrors(issues: BranchMenuValidationIssues): boolean {
  return (
    issues.duplicateIds.length > 0 ||
    issues.invalidPriceIds.length > 0 ||
    issues.negativePriceIds.length > 0 ||
    issues.missingFieldIds.length > 0 ||
    issues.emptyPreview
  );
}

/**
 * Build comprehensive diagnostics object for development logging
 */
export function buildBranchMenuDiagnostics(
  flagEnabled: boolean,
  selectedBranch: PreviewSelectedBranch | null,
  preview: BranchMenuPreviewItem[],
  previewLoading: boolean,
  previewError: string | null,
  legacyProducts: { id: string }[],
  branchMenuDiff: {
    legacyCount: number;
    previewCount: number;
    legacyMissingInPreview: string[];
    previewOnlyIds: string[];
  }
): BranchMenuDiagnostics {
  const issues = validateBranchMenuData(preview);
  const criticalErrors: string[] = [];

  if (issues.duplicateIds.length > 0) {
    criticalErrors.push(
      `Duplicate product IDs: ${issues.duplicateIds.slice(0, 3).join(", ")}`
    );
  }
  if (issues.invalidPriceIds.length > 0) {
    criticalErrors.push(
      `Invalid prices: ${issues.invalidPriceIds.slice(0, 3).join(", ")}`
    );
  }
  if (issues.negativePriceIds.length > 0) {
    criticalErrors.push(
      `Negative prices: ${issues.negativePriceIds.slice(0, 3).join(", ")}`
    );
  }
  if (issues.missingFieldIds.length > 0) {
    criticalErrors.push(
      `Missing id/name: ${issues.missingFieldIds.slice(0, 3).join(", ")}`
    );
  }
  if (previewError) {
    criticalErrors.push(`API error: ${previewError}`);
  }

  const shouldFallback =
    hasCriticalErrors(issues) || previewError !== null || previewLoading;

  const usingBranchMenu: boolean =
    flagEnabled &&
    !!selectedBranch &&
    preview.length > 0 &&
    !previewLoading &&
    !previewError &&
    !shouldFallback;

  // Extract availability stats
  const unavailableIds = preview
    .filter((item) => !item.is_available_for_branch)
    .map((item) => item.id);

  const soldOutIds = preview
    .filter((item) => item.is_sold_out_for_branch)
    .map((item) => item.id);

  return {
    flagEnabled,
    usingBranchMenu,
    branchId: selectedBranch?.id ?? null,
    branchCode: selectedBranch?.code ?? null,
    legacyCount: branchMenuDiff.legacyCount,
    previewCount: branchMenuDiff.previewCount,
    missingInPreview: branchMenuDiff.legacyMissingInPreview,
    previewOnlyIds: branchMenuDiff.previewOnlyIds,
    invalidPriceIds: issues.invalidPriceIds,
    unavailableIds,
    soldOutIds,
    duplicatePreviewIds: issues.duplicateIds,
    criticalErrors,
    shouldFallback,
  };
}

export interface BranchFirstGateState {
  enabled: boolean;
  fulfillmentType: "delivery" | "pickup";
  phone: string;
  checkedPhone: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  selectedBranchId: string | null;
}

export interface BranchFirstGateDiagnostics {
  enabled: boolean;
  bypassedForPickup: boolean;
  validPhone: boolean;
  customerLookupComplete: boolean;
  hasAddress: boolean;
  hasCoordinates: boolean;
  hasSelectedBranch: boolean;
  readyForMenu: boolean;
  blockingReasons: string[];
}

function normalizeGatePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

/**
 * Validate every dependency required before a delivery customer can see a
 * branch-specific menu.
 *
 * Pickup orders intentionally bypass the address/branch requirement.
 */
export function validateBranchFirstGateState(
  state: BranchFirstGateState
): BranchFirstGateDiagnostics {
  const normalizedPhone = normalizeGatePhone(state.phone);
  const normalizedCheckedPhone = normalizeGatePhone(state.checkedPhone);

  const validPhone = /^0(3|5|7|8|9)\d{8}$/.test(normalizedPhone);
  const customerLookupComplete =
    validPhone && normalizedCheckedPhone === normalizedPhone;
  const hasAddress = state.address.trim().length > 0;
  const hasCoordinates =
    typeof state.latitude === "number" &&
    typeof state.longitude === "number" &&
    Number.isFinite(state.latitude) &&
    Number.isFinite(state.longitude) &&
    state.latitude !== 0 &&
    state.longitude !== 0;
  const hasSelectedBranch = Boolean(state.selectedBranchId);
  const bypassedForPickup = state.fulfillmentType === "pickup";

  const blockingReasons: string[] = [];

  if (!bypassedForPickup) {
    if (!validPhone) {
      blockingReasons.push("Số điện thoại chưa hợp lệ.");
    }

    if (validPhone && !customerLookupComplete) {
      blockingReasons.push("Chưa hoàn tất kiểm tra khách hàng.");
    }

    if (!hasAddress) {
      blockingReasons.push("Chưa có địa chỉ giao hàng.");
    }

    if (!hasCoordinates) {
      blockingReasons.push("Địa chỉ chưa có tọa độ Google hợp lệ.");
    }

    if (!hasSelectedBranch) {
      blockingReasons.push("Chưa xác định chi nhánh phục vụ.");
    }
  }

  const readyForMenu =
    !state.enabled ||
    bypassedForPickup ||
    (validPhone &&
      customerLookupComplete &&
      hasAddress &&
      hasCoordinates &&
      hasSelectedBranch);

  return {
    enabled: state.enabled,
    bypassedForPickup,
    validPhone,
    customerLookupComplete,
    hasAddress,
    hasCoordinates,
    hasSelectedBranch,
    readyForMenu,
    blockingReasons,
  };
}
