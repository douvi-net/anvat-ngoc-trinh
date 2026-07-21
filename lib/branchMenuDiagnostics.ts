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
