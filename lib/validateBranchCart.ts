import type { BranchMenuPreviewItem } from "@/lib/fetchBranchMenuPreview";

// Minimal cart item shape required for validation (subset of CartItem)
type ValidatableCartItem = {
  cartKey: string;
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type BranchCartValidationItem = {
  cartKey: string;
  productId: string;
  productName: string;
  quantity: number;
};

export type BranchCartPriceUpdate = {
  cartKey: string;
  productId: string;
  productName: string;
  quantity: number;
  oldPrice: number;
  newPrice: number;
};

export type BranchCartValidationResult = {
  /** true if any item was removed, unavailable, or price-changed */
  changed: boolean;
  /** Products not present in branch menu — should be removed */
  removedItems: BranchCartValidationItem[];
  /** Products present but sold out at this branch — block checkout */
  unavailableItems: BranchCartValidationItem[];
  /** Products with branch price override */
  updatedPrices: BranchCartPriceUpdate[];
  /** Products that are fine as-is */
  validItems: BranchCartValidationItem[];
};

/**
 * Pure function — no React, no side effects.
 * Validates every cart item against a branch menu preview.
 * Returns a structured diff result.
 */
export function validateCartForBranch(
  cart: ValidatableCartItem[],
  branchMenu: BranchMenuPreviewItem[]
): BranchCartValidationResult {
  // Empty cart or empty menu — nothing to validate
  if (cart.length === 0 || branchMenu.length === 0) {
    return {
      changed: false,
      removedItems: [],
      unavailableItems: [],
      updatedPrices: [],
      validItems: cart.map((item) => ({
        cartKey: item.cartKey,
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
      })),
    };
  }

  // Index branch menu by product id for O(1) lookups
  const menuMap = new Map<string, BranchMenuPreviewItem>();
  for (const item of branchMenu) {
    menuMap.set(item.id, item);
  }

  const removedItems: BranchCartValidationResult["removedItems"] = [];
  const unavailableItems: BranchCartValidationResult["unavailableItems"] = [];
  const updatedPrices: BranchCartValidationResult["updatedPrices"] = [];
  const validItems: BranchCartValidationResult["validItems"] = [];

  for (const cartItem of cart) {
    const menuItem = menuMap.get(cartItem.id);
    const base: BranchCartValidationItem = {
      cartKey: cartItem.cartKey,
      productId: cartItem.id,
      productName: cartItem.name,
      quantity: cartItem.quantity,
    };

    if (!menuItem || !menuItem.is_available_for_branch) {
      // Product does not exist at this branch
      removedItems.push(base);
      continue;
    }

    if (menuItem.is_sold_out_for_branch) {
      // Product exists but is sold out at this branch
      unavailableItems.push(base);
      continue;
    }

    if (menuItem.effective_price !== cartItem.price) {
      // Branch price override differs from current cart price
      updatedPrices.push({
        ...base,
        oldPrice: cartItem.price,
        newPrice: menuItem.effective_price,
      });
    } else {
      validItems.push(base);
    }
  }

  const changed =
    removedItems.length > 0 ||
    unavailableItems.length > 0 ||
    updatedPrices.length > 0;

  return { changed, removedItems, unavailableItems, updatedPrices, validItems };
}
