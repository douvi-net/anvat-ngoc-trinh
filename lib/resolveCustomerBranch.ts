import { lookupCustomerByPhone } from "@/lib/customerLookup";
import { fetchMapsPreviewNearestBranch } from "@/lib/mapsPreviewNearestBranch";
import type {
  CustomerLookupCustomer,
  ResolveCustomerBranchResult,
} from "@/types/customer";

function hasValidCoordinates(customer: CustomerLookupCustomer) {
  return (
    typeof customer.lastLat === "number" &&
    Number.isFinite(customer.lastLat) &&
    typeof customer.lastLng === "number" &&
    Number.isFinite(customer.lastLng)
  );
}

export async function resolveCustomerBranch(
  phone: string,
  signal?: AbortSignal
): Promise<ResolveCustomerBranchResult> {
  const lookupResult = await lookupCustomerByPhone(phone, signal);

  if (!lookupResult.ok || !lookupResult.customer) {
    return {
      ok: lookupResult.ok,
      customer: null,
      selectedBranch: null,
      shouldChooseAddress: true,
      message: lookupResult.message,
    };
  }

  const customer = lookupResult.customer;

  if (!hasValidCoordinates(customer)) {
    return {
      ok: true,
      customer,
      selectedBranch: null,
      shouldChooseAddress: true,
      message: null,
    };
  }

  const latitude = customer.lastLat;
  const longitude = customer.lastLng;

  if (latitude === null || longitude === null) {
    return {
      ok: true,
      customer,
      selectedBranch: null,
      shouldChooseAddress: true,
      message: null,
    };
  }

  const previewResult = await fetchMapsPreviewNearestBranch(
    latitude,
    longitude,
    signal
  );

  if (!previewResult.ok || !previewResult.selectedBranch) {
    return {
      ok: false,
      customer,
      selectedBranch: null,
      shouldChooseAddress: true,
      message: previewResult.message || "Không thể xác định chi nhánh gần nhất.",
    };
  }

  return {
    ok: true,
    customer,
    selectedBranch: previewResult.selectedBranch,
    shouldChooseAddress: false,
    message: null,
  };
}