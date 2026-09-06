/** Shared client-side topping checks. No service key or database writes here. */
export type BranchTopping = {
  id: string;
  name: string;
  price: number;
  category?: string | null;
};

type ToppingCartItem = {
  id: string;
  cartKey: string;
  quantity: number;
  price: number;
  selectedToppings: BranchTopping[];
  spicyLevel: string;
  itemNote: string;
};

export type CartToppingChanges = {
  changed: boolean;
  unavailableNames: string[];
  priceChangedNames: string[];
};

let requestSequence = 0;

export async function fetchBranchToppings(
  branchId: string,
  signal?: AbortSignal
): Promise<BranchTopping[]> {
  if (!branchId.trim()) throw new Error("Chưa chọn chi nhánh.");

  // Unique query also avoids a stale response from an OLDER installed PWA worker.
  const query = new URLSearchParams({
    branchId,
    _fresh: `${Date.now()}-${++requestSequence}-${Math.random().toString(36).slice(2)}`,
  });
  const response = await fetch(`/api/branch-toppings?${query}`, {
    method: "GET",
    cache: "no-store",
    credentials: "same-origin",
    signal,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok !== true) {
    throw new Error(payload?.message || "Không tải được topping chi nhánh.");
  }
  if (payload.branch_id !== branchId || !Array.isArray(payload.items)) {
    throw new Error("Dữ liệu topping không khớp chi nhánh. Vui lòng tải lại.");
  }

  const seen = new Set<string>();
  return payload.items.map((value: unknown) => {
    if (!value || typeof value !== "object") {
      throw new Error("Dữ liệu topping không hợp lệ.");
    }
    const item = value as Record<string, unknown>;
    const price = Number(item.price);
    if (
      typeof item.id !== "string" || !item.id.trim() || seen.has(item.id) ||
      typeof item.name !== "string" || !item.name.trim() ||
      item.price == null || !Number.isFinite(price) || price < 0 ||
      (item.category != null && typeof item.category !== "string")
    ) {
      throw new Error("Dữ liệu topping không hợp lệ.");
    }
    seen.add(item.id);
    return {
      id: item.id,
      name: item.name,
      price,
      category: (item.category as string | null | undefined) ?? null,
    };
  });
}

export function getCartToppingChanges(
  cart: ReadonlyArray<{ selectedToppings: BranchTopping[] }>,
  available: readonly BranchTopping[]
): CartToppingChanges {
  const byId = new Map(available.map((topping) => [topping.id, topping]));
  const unavailable = new Set<string>();
  const priceChanged = new Set<string>();
  for (const item of cart) {
    for (const topping of item.selectedToppings) {
      const current = byId.get(topping.id);
      if (!current) unavailable.add(topping.name);
      else if (Number(current.price) !== Number(topping.price)) {
        priceChanged.add(current.name);
      }
    }
  }
  return {
    changed: unavailable.size > 0 || priceChanged.size > 0,
    unavailableNames: [...unavailable],
    priceChangedNames: [...priceChanged],
  };
}

/** Call only after the customer clicks the explicit cart-update button. */
export function applyCartToppingChanges<T extends ToppingCartItem>(
  cart: readonly T[],
  available: readonly BranchTopping[]
): T[] {
  const byId = new Map(available.map((topping) => [topping.id, topping]));
  const updated: T[] = [];
  for (const item of cart) {
    const changes = getCartToppingChanges([item], available);
    if (!changes.changed) {
      updated.push(item);
      continue;
    }
    const selectedToppings = item.selectedToppings.flatMap((topping) => {
      const current = byId.get(topping.id);
      return current ? [current] : [];
    });
    // Do not retain a key containing a removed topping: adding that topping
    // again later must not increment a line which no longer contains it.
    const cartKey = [
      item.id,
      selectedToppings.map((topping) => topping.id).sort().join("-"),
      item.spicyLevel,
      item.itemNote.trim(),
    ].join("_");
    updated.push({ ...item, selectedToppings, cartKey });
  }

  // Two lines may become identical after removing an unavailable topping.
  const merged = new Map<string, T>();
  for (const item of updated) {
    const existing = merged.get(item.cartKey);
    if (existing && existing.price === item.price &&
        JSON.stringify(existing.selectedToppings) === JSON.stringify(item.selectedToppings)) {
      merged.set(item.cartKey, { ...existing, quantity: existing.quantity + item.quantity });
    } else if (existing) {
      // Preserve both lines rather than merge different prices/options.
      const cartKey = `${item.cartKey}_topping-sync-${merged.size}`;
      merged.set(cartKey, { ...item, cartKey });
    } else {
      merged.set(item.cartKey, item);
    }
  }
  return [...merged.values()];
}
