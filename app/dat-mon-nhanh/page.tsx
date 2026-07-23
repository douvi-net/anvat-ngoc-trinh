"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { resolveCustomerBranch } from "@/lib/resolveCustomerBranch";
import {
  fetchBranchMenuPreview,
  type BranchMenuPreviewItem,
} from "@/lib/fetchBranchMenuPreview";
import {
  fetchMapsPreviewNearestBranch,
  type PreviewSelectedBranch,
} from "@/lib/mapsPreviewNearestBranch";
import {
  buildBranchMenuDiagnostics,
  validateBranchFirstGateState,
  validateBranchMenuData,
  hasCriticalErrors,
} from "@/lib/branchMenuDiagnostics";
import {
  BranchFirstGate,
  BranchSelectorModal,
} from "@/components/order/BranchFirstGate";
import {
  validateCartForBranch,
  type BranchCartValidationResult,
} from "@/lib/validateBranchCart";
import { BranchCartValidationModal } from "@/components/order/BranchCartValidationModal";

type Product = {
  id: string;
  name: string;
  slug?: string | null;
  price: number;
  badge: string | null;
  image_url: string | null;
  description: string | null;
  is_sold_out?: boolean | null;
  category?: string | null;
  topping_category?: string | null;
};

type Topping = {
  id: string;
  name: string;
  price: number;
  category?: string | null;
};

type CartItem = Product & {
  cartKey: string;
  quantity: number;
  selectedToppings: Topping[];
  spicyLevel: string;
  itemNote: string;
};
type ShippingPromotion = {
  id: string;
  name: string;
  promotion_type: string;
  min_order_value: number;
  max_distance_km: number;
  discount_value: number;
  is_active: boolean;
  sort_order: number;
};
type Customer = {
  id: string;
  name: string;
  phone: string;
  last_address: string | null;
  last_address_detail?: string | null;
  last_payment_method: string | null;
  last_lat?: number | null;
  last_lng?: number | null;
  total_orders: number | null;
total_points?: number | null;
total_spent?: number | null;
};

type ShippingZone = {
  id: string;
  name: string;
  min_km: number;
  max_km: number;
  fee: number;
};

type ShopSettings = {
  id: number | string;
  shop_name: string;
  hotline?: string | null;
  open_time?: string | null;
  close_time?: string | null;
  order_status?: string | null;
  is_open?: boolean | null;
};

type Banner = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
};

type Coupon = {
  id: string;
  code: string;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  discount_type?: string | null;
  type?: string | null;
  value?: number | null;
  discount_value?: number | null;
  min_order?: number | null;
  min_order_value?: number | null;
  max_discount?: number | null;
  is_active?: boolean | null;
  gift_product_id?: string | null;
gift_product_name?: string | null;
gift_quantity?: number | null;
};
type Reward = {
  id: string;
  name: string;
  points_required: number;
  reward_value?: number | null;
  description?: string | null;
  is_active?: boolean | null;
  sort_order?: number | null;
};

type CustomerFlag = {
  phone: string;
  status: "normal" | "warning" | "blocked";
  note?: string | null;
};

type PlaceSuggestion = {
  placeId: string;
  text: string;
  mainText: string;
  secondaryText: string;
};
type AvailableBranch = PreviewSelectedBranch & {
  name?: string | null;
  address?: string | null;
  is_active?: boolean | null;
};
const spicyOptions = ["Không cay", "Cay ít", "Cay vừa", "Cay nhiều"];
const iceOptions = ["Không đá", "Ít đá", "Đá bình thường"];
const sugarOptions = ["Ít ngọt", "Ngọt bình thường"];
const MIN_SHIPPING_FEE = 15000;

function normalizePhoneForLookup(phone: string) {
  const trimmed = phone.trim();

  if (!trimmed) {
    return "";
  }

  let normalized = trimmed.replace(/\s+/g, "");

  if (normalized.startsWith("+84")) {
    normalized = `0${normalized.slice(3)}`;
  } else if (normalized.startsWith("84") && normalized.length >= 11) {
    normalized = `0${normalized.slice(2)}`;
  }

  normalized = normalized.replace(/\D/g, "");

  if (normalized.startsWith("84") && normalized.length >= 10) {
    normalized = `0${normalized.slice(2)}`;
  }

  return normalized;
}

function isValidLookupPhone(phone: string) {
  return /^0(3|5|7|8|9)\d{8}$/.test(phone);
}

function normalizePlaceSuggestions(payload: unknown): PlaceSuggestion[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const nestedData =
    record.data && typeof record.data === "object"
      ? (record.data as Record<string, unknown>)
      : null;
  const nestedResult =
    record.result && typeof record.result === "object"
      ? (record.result as Record<string, unknown>)
      : null;

  const rawItems = Array.isArray(record.suggestions)
    ? record.suggestions
    : Array.isArray(record.predictions)
    ? record.predictions
    : Array.isArray(record.items)
    ? record.items
    : Array.isArray(nestedData?.suggestions)
    ? nestedData.suggestions
    : Array.isArray(nestedData?.predictions)
    ? nestedData.predictions
    : Array.isArray(nestedResult?.suggestions)
    ? nestedResult.suggestions
    : Array.isArray(nestedResult?.predictions)
    ? nestedResult.predictions
    : [];

  return rawItems
    .map((rawItem): PlaceSuggestion | null => {
      if (!rawItem || typeof rawItem !== "object") {
        return null;
      }

      const item = rawItem as Record<string, unknown>;

      /*
       * Google Places API mới:
       *
       * {
       *   suggestions: [
       *     {
       *       placePrediction: {
       *         placeId: "...",
       *         text: { text: "..." },
       *         structuredFormat: {
       *           mainText: { text: "..." },
       *           secondaryText: { text: "..." }
       *         }
       *       }
       *     }
       *   ]
       * }
       */
      const placePrediction =
        item.placePrediction &&
        typeof item.placePrediction === "object"
          ? (item.placePrediction as Record<string, unknown>)
          : null;

      const legacyStructuredFormatting =
        item.structured_formatting &&
        typeof item.structured_formatting === "object"
          ? (item.structured_formatting as Record<string, unknown>)
          : null;

      const newStructuredFormat =
        placePrediction?.structuredFormat &&
        typeof placePrediction.structuredFormat === "object"
          ? (placePrediction.structuredFormat as Record<string, unknown>)
          : null;

      const predictionText =
        placePrediction?.text &&
        typeof placePrediction.text === "object"
          ? String(
              (placePrediction.text as Record<string, unknown>).text || ""
            ).trim()
          : "";

      const predictionMainText =
        newStructuredFormat?.mainText &&
        typeof newStructuredFormat.mainText === "object"
          ? String(
              (newStructuredFormat.mainText as Record<string, unknown>).text ||
                ""
            ).trim()
          : "";

      const predictionSecondaryText =
        newStructuredFormat?.secondaryText &&
        typeof newStructuredFormat.secondaryText === "object"
          ? String(
              (
                newStructuredFormat.secondaryText as Record<string, unknown>
              ).text || ""
            ).trim()
          : "";

      const placeId = String(
        placePrediction?.placeId ||
          item.placeId ||
          item.place_id ||
          item.id ||
          ""
      ).trim();

      const text = String(
        predictionText ||
          item.text ||
          item.description ||
          item.formatted_address ||
          ""
      ).trim();

      const mainText = String(
        predictionMainText ||
          item.mainText ||
          item.main_text ||
          legacyStructuredFormatting?.main_text ||
          text
      ).trim();

      const secondaryText = String(
        predictionSecondaryText ||
          item.secondaryText ||
          item.secondary_text ||
          legacyStructuredFormatting?.secondary_text ||
          ""
      ).trim();

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
      (item): item is PlaceSuggestion =>
        item !== null
    );
}

function buildAddressSearchCandidates(input: string) {
  const candidates = [input];
  const normalized = input.toLocaleLowerCase("vi-VN");
  const alreadyHasLocality =
    normalized.includes("hồ chí minh") ||
    normalized.includes("ho chi minh") ||
    normalized.includes("tp hcm") ||
    normalized.includes("tphcm") ||
    normalized.includes("sài gòn") ||
    normalized.includes("sai gon");

  if (!alreadyHasLocality) {
    candidates.push(`${input}, Hồ Chí Minh`);
  }

  return Array.from(new Set(candidates));
}

const frequentlyBoughtTogether: Record<string, string[]> = {
  "Cuốn đỏ sốt me": [
    "Trà sữa truyền thống",
    "Cuốn trứng chấm me",
    "Bánh tráng trộn",
  ],

  "Bánh tráng trộn": [
    "Trà đào",
    "Cuốn đỏ sốt me",
    "Bánh tráng cuốn",
  ],

  "Cuốn trứng chấm me": [
    "Trà sữa truyền thống",
    "Cuốn đỏ sốt me",
  ],
};
const comboSuggestions: Record<
  string,
  {
    product: string;
    discount: number;
  }[]
> = {
  "Cuốn đỏ sốt me": [
    {
      product: "Trà đào",
      discount: 5000,
    },
  ],

  "Cuốn trứng chấm me": [
    {
      product: "Trà sữa truyền thống",
      discount: 5000,
    },
  ],
};
export default function DatMonNhanhPage() {
  const router = useRouter();
  const [betaResolved, setBetaResolved] = useState(false);
  const [isBranchBeta, setIsBranchBeta] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [selectedRewardId, setSelectedRewardId] = useState("");
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [shippingPromotions, setShippingPromotions] = useState<ShippingPromotion[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedToppingIds, setSelectedToppingIds] = useState<string[]>([]);
  const [selectedSpicyLevel, setSelectedSpicyLevel] = useState("Cay vừa");
  const [selectedIceLevel, setSelectedIceLevel] = useState("Đá bình thường");
const [selectedSugarLevel, setSelectedSugarLevel] = useState("Ngọt bình thường");
  const [itemNote, setItemNote] = useState("");

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerAddressDetail, setCustomerAddressDetail] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<PlaceSuggestion[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressSearchMessage, setAddressSearchMessage] = useState("");
  const [addressSelected, setAddressSelected] = useState(false);
  const [deliveryLat, setDeliveryLat] = useState<number | null>(null);
  const [deliveryLng, setDeliveryLng] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("momo");
  const [fulfillmentType, setFulfillmentType] =
    useState<"delivery" | "pickup">("delivery");
  const [orderType, setOrderType] = useState<"now" | "scheduled">("now");
const [scheduledDate, setScheduledDate] = useState("");
const [scheduledTime, setScheduledTime] = useState("");
const [scheduledNote, setScheduledNote] = useState("");
  const [selectedBranch, setSelectedBranch] =
    useState<PreviewSelectedBranch | null>(null);
  const [availableBranches, setAvailableBranches] =
    useState<AvailableBranch[]>([]);
  const [branchSelectorOpen, setBranchSelectorOpen] = useState(false);
  const [manualBranchId, setManualBranchId] = useState<string | null>(null);
  const [branchMenuPreview, setBranchMenuPreview] =
    useState<BranchMenuPreviewItem[]>([]);
  const [branchMenuPreviewBranchId, setBranchMenuPreviewBranchId] =
    useState<string | null>(null);
  const [branchMenuPreviewLoading, setBranchMenuPreviewLoading] =
    useState(false);
  const [branchMenuPreviewError, setBranchMenuPreviewError] = useState("");
  const [deliveryDistanceKm, setDeliveryDistanceKm] = useState(2);
  const [routeLoading, setRouteLoading] = useState(false);
const [routeMessage, setRouteMessage] = useState("");
const [googleShippingFee, setGoogleShippingFee] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [selectedDiscountCoupon, setSelectedDiscountCoupon] = useState<Coupon | null>(null);
const [selectedGiftCoupon, setSelectedGiftCoupon] = useState<Coupon | null>(null);
  const [customerPoints, setCustomerPoints] = useState(0);
  const [usePointsDiscount, setUsePointsDiscount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checkingCustomer, setCheckingCustomer] = useState(false);
  const [checkedCustomerPhone, setCheckedCustomerPhone] = useState("");
  const [customerFoundMessage, setCustomerFoundMessage] = useState("");
  const [customerFlag, setCustomerFlag] = useState<CustomerFlag | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const [cartAnimate, setCartAnimate] = useState(false);
  const [branchGateConfirmed, setBranchGateConfirmed] = useState(false);
  const [branchGateLocked, setBranchGateLocked] = useState(false);
  const [branchCartValidation, setBranchCartValidation] =
    useState<BranchCartValidationResult | null>(null);
  const [branchCartModalOpen, setBranchCartModalOpen] = useState(false);
  const addressSearchTimerRef = useRef<number | null>(null);
  const addressSearchRequestRef = useRef(0);
  const addressSearchAbortRef = useRef<AbortController | null>(null);
  const routeRequestRef = useRef(0);

  // Private beta is controlled directly by the URL:
  // /dat-mon-nhanh?beta=branch
  // This avoids stale NEXT_PUBLIC_* values being embedded at build time.
  const isBranchMenuPreviewEnabled =
    betaResolved && isBranchBeta;

  const isBranchFirstGateEnabled =
    betaResolved && isBranchBeta;

  const isBranchCartValidationEnabled =
    betaResolved && isBranchBeta;

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const betaEnabled = searchParams.get("beta") === "branch";

    setIsBranchBeta(betaEnabled);
    setBetaResolved(true);
  }, []);

  useEffect(() => {
    if (!betaResolved) {
      return;
    }

    void fetchInitialData();
    loadSavedCustomer();
  }, [betaResolved]);

  useEffect(() => {
    return () => {
      if (addressSearchTimerRef.current !== null) {
        window.clearTimeout(addressSearchTimerRef.current);
      }
      addressSearchAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!products.length) return;
  
    const raw = localStorage.getItem("avnt_reorder_items");
    if (!raw) return;
  
    try {
      const reorderItems = JSON.parse(raw);
  
      const newCartItems = reorderItems
        .map((oldItem: any) => {
          const product = products.find(
            (item) =>
              item.name.trim().toLowerCase() ===
              oldItem.product_name.trim().toLowerCase()
          );
  
          if (!product || product.is_sold_out) return null;
  
          const cartKey = `${product.id}_${Date.now()}_${Math.random()}`;
  
          return {
            ...product,
            cartKey,
            quantity: Number(oldItem.quantity || 1),
            selectedToppings: [],
            spicyLevel: oldItem.spicy_level || "Cay vừa",
            itemNote: oldItem.note || "",
          };
        })
        .filter(Boolean);
  
      if (newCartItems.length > 0) {
        setCart(newCartItems);
        setCheckoutOpen(true);
        showToast("Đã thêm món từ đơn cũ vào giỏ");
      }
  
      localStorage.removeItem("avnt_reorder_items");
    } catch (error) {
      console.error("REORDER ERROR:", error);
      localStorage.removeItem("avnt_reorder_items");
    }
  }, [products]);
  useEffect(() => {
    const normalizedPhone = normalizePhoneForLookup(customerPhone);

    addressSearchRequestRef.current += 1;
    routeRequestRef.current += 1;
    addressSearchAbortRef.current?.abort();
    addressSearchAbortRef.current = null;

    if (addressSearchTimerRef.current !== null) {
      window.clearTimeout(addressSearchTimerRef.current);
      addressSearchTimerRef.current = null;
    }

    setAddressLoading(false);
    setRouteLoading(false);

    if (!isValidLookupPhone(normalizedPhone)) {
      setCheckedCustomerPhone("");
      return;
    }

    setCheckedCustomerPhone("");

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void findCustomerByPhone(normalizedPhone, controller.signal);
    }, 600);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [customerPhone]);

  useEffect(() => {
    if (!isBranchMenuPreviewEnabled) {
      setBranchMenuPreview([]);
      setBranchMenuPreviewBranchId(null);
      setBranchMenuPreviewError("");
      setBranchMenuPreviewLoading(false);
      return;
    }

    const branchId = selectedBranch?.id || null;
    const branchCode = selectedBranch?.code || null;

    if (!branchId && !branchCode) {
      setBranchMenuPreview([]);
      setBranchMenuPreviewBranchId(null);
      setBranchMenuPreviewError("");
      setBranchMenuPreviewLoading(false);
      return;
    }

    const controller = new AbortController();

    setBranchMenuPreview([]);
    setBranchMenuPreviewBranchId(null);
    setBranchMenuPreviewLoading(true);
    setBranchMenuPreviewError("");

    void (async () => {
      const result = await fetchBranchMenuPreview(
        {
          branchId,
          branchCode,
        },
        controller.signal
      );

      if (controller.signal.aborted) {
        return;
      }

      if (result.ok) {
        setBranchMenuPreview(result.items);
        setBranchMenuPreviewBranchId(branchId);
        setBranchMenuPreviewError("");
      } else {
        setBranchMenuPreview([]);
        setBranchMenuPreviewBranchId(branchId);
        setBranchMenuPreviewError(
          result.message || "Không tải được menu chi nhánh."
        );
      }

      setBranchMenuPreviewLoading(false);
    })();

    return () => {
      controller.abort();
    };
  }, [selectedBranch, isBranchMenuPreviewEnabled]);

  // Branch cart validation — runs after selectedBranch changes and menu loads
  const prevBranchIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isBranchCartValidationEnabled) return;
    if (cart.length === 0) return;
    if (!selectedBranch) {
      prevBranchIdRef.current = null;
      setBranchCartValidation(null);
      return;
    }
    if (branchMenuPreviewLoading || branchMenuPreviewError) return;
    if (branchMenuPreview.length === 0) return;
    if (branchMenuPreviewBranchId !== selectedBranch.id) return;
    // Only trigger once per branch change
    if (prevBranchIdRef.current === selectedBranch.id) return;
    prevBranchIdRef.current = selectedBranch.id;

    const result = validateCartForBranch(cart, branchMenuPreview);
    if (result.changed) {
      setBranchCartValidation(result);
      setBranchCartModalOpen(true);
    }
  }, [
    selectedBranch,
    branchMenuPreview,
    branchMenuPreviewBranchId,
    branchMenuPreviewLoading,
    branchMenuPreviewError,
    isBranchCartValidationEnabled,
    cart,
  ]);

  async function fetchInitialData() {
  const [
  productResult,
  toppingResult,
  zoneResult,
  settingResult,
  bannerResult,
  couponResult,
  rewardResult,
  promotionResult,
  branchResult,
] = await Promise.all([
      supabase
        .from("products")
        .select(
          "id,name,slug,price,badge,image_url,description,is_sold_out,category,topping_category"
        )
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),

      supabase
        .from("toppings")
        .select("id,name,price,category")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),

      supabase
        .from("shipping_zones")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),

      supabase.from("shop_settings").select("*").limit(1).maybeSingle(),

      supabase
        .from("banners")
        .select("id,title,description,image_url")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),

      supabase.from("coupons").select("*"),

      supabase
        .from("rewards")
        .select("id,name,points_required,reward_value,description,is_active,sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),

      supabase
  .from("shipping_promotions")
  .select("*")
  .eq("is_active", true)
  .order("sort_order", { ascending: true }),
      supabase
        .from("branches")
        .select("*")
        .eq("is_active", true)
        .order("code", { ascending: true }),
    ]);

    setProducts((productResult.data || []) as Product[]);
    setToppings((toppingResult.data || []) as Topping[]);
    setShippingZones((zoneResult.data || []) as ShippingZone[]);
    setShopSettings((settingResult.data || null) as ShopSettings | null);
    setBanners((bannerResult.data || []) as Banner[]);

    const activeCoupons = ((couponResult.data || []) as Coupon[]).filter(
      (item) => item.is_active !== false
    );
    setCoupons(activeCoupons);
    setRewards((rewardResult.data || []) as Reward[]);
    setShippingPromotions(
      (promotionResult.data || []) as ShippingPromotion[]
    );
    if (branchResult.error) {
  console.error("LOAD BRANCHES ERROR:", branchResult.error);
  setAvailableBranches([]);
} else {
  setAvailableBranches(
    (branchResult.data || []) as AvailableBranch[]
  );
}
    setLoading(false);
  }

  function loadSavedCustomer() {
    if (typeof window === "undefined") return;

    setCustomerPhone(localStorage.getItem("avnt_customer_phone") || "");
    setCustomerName(localStorage.getItem("avnt_customer_name") || "");
    setCustomerAddress(localStorage.getItem("avnt_customer_address") || "");
    setCustomerAddressDetail(
      localStorage.getItem("avnt_customer_address_detail") || ""
    );
    setPaymentMethod(localStorage.getItem("avnt_payment_method") || "momo");
  }
  function playSound(type: "add" | "open" | "success") {
    if (typeof window === "undefined") return;
  
    const soundMap = {
      add: "/sounds/add-to-cart.wav",
      open: "/sounds/open-cart.wav",
      success: "/sounds/order-success.wav",
    };
  
    const audio = new Audio(soundMap[type]);
    audio.volume = 0.35;
    audio.play().catch(() => {});
  }
  function saveCustomerLocal() {
    if (typeof window === "undefined") return;

    localStorage.setItem(
      "avnt_customer_phone",
      normalizePhoneForLookup(customerPhone)
    );
    localStorage.setItem("avnt_customer_name", customerName.trim());
    localStorage.setItem("avnt_customer_address", customerAddress.trim());
    localStorage.setItem(
      "avnt_customer_address_detail",
      customerAddressDetail.trim()
    );
    localStorage.setItem("avnt_payment_method", paymentMethod);
  }

  async function fetchCustomerFlag(phone: string, signal?: AbortSignal) {
    const cleanPhone = phone.trim();
    if (cleanPhone.length < 9) {
      setCustomerFlag(null);
      return null;
    }

    let query = supabase
      .from("customer_flags")
      .select("phone,status,note")
      .eq("phone", cleanPhone);

    if (signal) {
      query = query.abortSignal(signal);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("CUSTOMER FLAG ERROR:", error);
      setCustomerFlag(null);
      return null;
    }

    const flag = (data || null) as CustomerFlag | null;
    setCustomerFlag(flag);
    return flag;
  }

  async function findCustomerByPhone(phone: string, signal?: AbortSignal) {
    const cleanPhone = normalizePhoneForLookup(phone);
    if (!isValidLookupPhone(cleanPhone)) return;

    setCheckingCustomer(true);
    setCheckedCustomerPhone("");
    setCustomerFoundMessage("");

    try {
      await fetchCustomerFlag(cleanPhone, signal);
      if (signal?.aborted) {
        return;
      }

      const bootstrap = await resolveCustomerBranch(cleanPhone, signal);
      if (signal?.aborted) {
        return;
      }

      if (bootstrap.ok && bootstrap.customer) {
        const customer = bootstrap.customer;
        const savedLat = Number(customer.lastLat || 0);
        const savedLng = Number(customer.lastLng || 0);
        const hasSavedLocation =
          Number.isFinite(savedLat) &&
          Number.isFinite(savedLng) &&
          savedLat !== 0 &&
          savedLng !== 0;

        setCustomerId(customer.id);
        setCustomerName(customer.name || "");
        setCustomerAddress(customer.lastAddress || "");
        setCustomerAddressDetail(customer.lastAddressDetail || "");
        setPaymentMethod(customer.lastPaymentMethod || "momo");
        setCustomerPoints(Number(customer.totalPoints || 0));

        if (Number(customer.totalPoints || 0) < 50) {
          setUsePointsDiscount(0);
          setSelectedRewardId("");
        }

        if (isBranchMenuPreviewEnabled && bootstrap.selectedBranch) {
          setSelectedBranch(bootstrap.selectedBranch);
        }

        if (hasSavedLocation) {
          setDeliveryLat(savedLat);
          setDeliveryLng(savedLng);
          setAddressSelected(true);
          setCustomerFoundMessage("");
          await calculateRouteByLatLng(savedLat, savedLng, {
            skipBranchPreview:
              isBranchMenuPreviewEnabled &&
              Boolean(bootstrap.selectedBranch),
            branchId:
              isBranchMenuPreviewEnabled
                ? bootstrap.selectedBranch?.id || null
                : null,
          });
          if (signal?.aborted) {
            return;
          }
        } else {
          setDeliveryLat(null);
          setDeliveryLng(null);

          if (bootstrap.shouldChooseAddress) {
            setSelectedBranch(null);
          }

          setGoogleShippingFee(null);
          setRouteMessage("");
          setAddressSelected(false);
          setCustomerFoundMessage(
            "Địa chỉ cũ chưa có tọa độ. Anh/chị chọn lại địa chỉ từ gợi ý Google một lần để lần sau tự tính phí ship."
          );
        }

        return;
      }

      let query = supabase
        .from("customers")
        .select("*")
        .eq("phone", cleanPhone);

      if (signal) {
        query = query.abortSignal(signal);
      }

      const { data, error } = await query.maybeSingle();
      if (signal?.aborted) {
        return;
      }

      if (!error && data) {
        const customer = data as Customer;
        const savedLat = Number(customer.last_lat || 0);
        const savedLng = Number(customer.last_lng || 0);
        const hasSavedLocation =
          Number.isFinite(savedLat) &&
          Number.isFinite(savedLng) &&
          savedLat !== 0 &&
          savedLng !== 0;

        setCustomerId(customer.id);
        setCustomerName(customer.name || "");
        setCustomerAddress(customer.last_address || "");
        setCustomerAddressDetail(customer.last_address_detail || "");
        setPaymentMethod(customer.last_payment_method || "momo");
        setCustomerPoints(Number((customer as any).total_points || 0));

        if (Number((customer as any).total_points || 0) < 50) {
          setUsePointsDiscount(0);
          setSelectedRewardId("");
        }

        if (hasSavedLocation) {
          setDeliveryLat(savedLat);
          setDeliveryLng(savedLng);
          setAddressSelected(true);
          setCustomerFoundMessage("");
          await calculateRouteByLatLng(savedLat, savedLng);
          if (signal?.aborted) {
            return;
          }
        } else {
          setDeliveryLat(null);
          setDeliveryLng(null);
          setSelectedBranch(null);
          setGoogleShippingFee(null);
          setRouteMessage("");
          setAddressSelected(false);
          setCustomerFoundMessage(
            "Địa chỉ cũ chưa có tọa độ. Anh/chị chọn lại địa chỉ từ gợi ý Google một lần để lần sau tự tính phí ship."
          );
        }
      } else {
        setCustomerPoints(0);
        setUsePointsDiscount(0);
        setSelectedRewardId("");
        setCustomerId("");
        setCustomerName("");
        setCustomerAddress("");
        setCustomerAddressDetail("");
        setDeliveryLat(null);
        setDeliveryLng(null);
        setAddressSelected(false);
        setAddressSuggestions([]);
        setGoogleShippingFee(null);
        setRouteMessage("");
        setCustomerFoundMessage(
          "Đây là lần đầu bạn đặt món. Hãy chọn địa chỉ để quán xác định chi nhánh phục vụ."
        );

        setSelectedBranch(null);
      }
    } catch (error) {
      if (signal?.aborted) {
        return;
      }

      console.error("CUSTOMER LOOKUP ERROR:", error);
      setCustomerId("");
      setCustomerName("");
      setCustomerAddress("");
      setCustomerAddressDetail("");
      setCustomerPoints(0);
      setUsePointsDiscount(0);
      setSelectedRewardId("");
      setDeliveryLat(null);
      setDeliveryLng(null);
      setAddressSelected(false);
      setAddressSuggestions([]);
      setSelectedBranch(null);
      setGoogleShippingFee(null);
      setRouteMessage("");
      setCustomerFoundMessage(
        "Không thể tải địa chỉ cũ. Anh/chị vui lòng chọn lại địa chỉ giao hàng."
      );
    } finally {
      if (!signal?.aborted) {
        setCheckedCustomerPhone(cleanPhone);
        setCheckingCustomer(false);
      }
    }
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  }

  function triggerCartAnimation() {
    setCartAnimate(true);
    window.setTimeout(() => setCartAnimate(false), 420);
  }
  function isDrinkProduct(product: Product) {
    const category = String(product.category || "").toLowerCase();
    const toppingCategory = String(product.topping_category || "").toLowerCase();
  
    return (
      category.includes("nước") ||
      category.includes("trà") ||
      category.includes("trà sữa") ||
      toppingCategory.includes("nước") ||
      toppingCategory.includes("trà sữa")
    );
  }
  function isUpsizeOneLiterTopping(topping: Topping) {
    const name = topping.name.toLowerCase();
  
    return (
      name.includes("upsize") ||
      name.includes("1 lít") ||
      name.includes("1 lit")
    );
  }
  function openProductOptions(product: Product) {
    if (product.is_sold_out) {
      showToast("Món này đang tạm hết");
      return;
    }
  
    // Không có topping => thêm thẳng
    if (!product.topping_category) {
      const cartKey = [
        product.id,
        "no-topping",
        "Cay vừa",
        "",
      ].join("_");
  
      setCart((prev) => {
        const existing = prev.find(
          (item) => item.cartKey === cartKey
        );
  
        if (existing) {
          return prev.map((item) =>
            item.cartKey === cartKey
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
  
        return [
          ...prev,
          {
            ...product,
            cartKey,
            quantity: 1,
            selectedToppings: [],
            spicyLevel: "",
            itemNote: "",
          },
        ];
      });
  
      showToast(`Đã thêm ${product.name} vào giỏ`);
      playSound("add");
      triggerCartAnimation();
      return;
    }
  
    const matchedToppings = toppings.filter(
      (topping) =>
        topping.category === product.topping_category ||
        topping.category === "Topping dùng chung"
    );
  
    if (matchedToppings.length === 0) {
      // thêm thẳng
      const cartKey = [
        product.id,
        "no-topping",
        "Cay vừa",
        "",
      ].join("_");
  
      setCart((prev) => {
        const existing = prev.find(
          (item) => item.cartKey === cartKey
        );
  
        if (existing) {
          return prev.map((item) =>
            item.cartKey === cartKey
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
  
        return [
          ...prev,
          {
            ...product,
            cartKey,
            quantity: 1,
            selectedToppings: [],
            spicyLevel: "Cay vừa",
            itemNote: "",
          },
        ];
      });
  
      showToast(`Đã thêm ${product.name} vào giỏ`);
      playSound("add");
      triggerCartAnimation();
      return;
    }
  
    setSelectedProduct(product);
    setSelectedToppingIds([]);
    setSelectedSpicyLevel("Cay vừa");
    setSelectedIceLevel("Đá bình thường");
setSelectedSugarLevel("Ngọt bình thường");
    setItemNote("");
  }

  function toggleTopping(toppingId: string) {
    setSelectedToppingIds((prev) =>
      prev.includes(toppingId)
        ? prev.filter((id) => id !== toppingId)
        : [...prev, toppingId]
    );
  }

  function getItemUnitTotal(item: CartItem) {
    const toppingTotal = item.selectedToppings.reduce(
      (sum, topping) => sum + Number(topping.price),
      0
    );

    return Number(item.price) + toppingTotal;
  }

  function addSelectedProductToCart() {
    if (!selectedProduct) return;

    const selectedToppings = toppings.filter((topping) =>
      selectedToppingIds.includes(topping.id)
    );
    const optionNote =
    selectedProduct && isDrinkProduct(selectedProduct)
      ? `${selectedIceLevel}, ${selectedSugarLevel}`
      : selectedSpicyLevel;
    const cartKey = [
      selectedProduct.id,
      [...selectedToppingIds].sort().join("-"),
      optionNote,
      itemNote.trim(),
    ].join("_");

    setCart((prev) => {
      const existing = prev.find((item) => item.cartKey === cartKey);

      if (existing) {
        return prev.map((item) =>
          item.cartKey === cartKey
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...prev,
        {
          ...selectedProduct,
          cartKey,
          quantity: 1,
          selectedToppings,
          spicyLevel: optionNote,
          itemNote,
        },
      ];
    });

    showToast(`Đã thêm ${selectedProduct.name} vào giỏ`);
    playSound("add");
    triggerCartAnimation();
    setSelectedProduct(null);
  }

  function increaseItem(cartKey: string) {
    setCart((prev) =>
      prev.map((item) =>
        item.cartKey === cartKey
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
    triggerCartAnimation();
  }

  function decreaseItem(cartKey: string) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.cartKey === cartKey
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
    triggerCartAnimation();
  }








  const branchMenuValidationIssues = useMemo(() => {
    if (!isBranchMenuPreviewEnabled || branchMenuPreview.length === 0) {
      return { duplicateIds: [], invalidPriceIds: [], negativePriceIds: [], missingFieldIds: [], emptyPreview: true, branchInactive: false, branchClosed: false };
    }
    return validateBranchMenuData(branchMenuPreview);
  }, [isBranchMenuPreviewEnabled, branchMenuPreview]);

  const effectiveProducts = useMemo(() => {
    if (
      !isBranchMenuPreviewEnabled ||
      !selectedBranch ||
      branchMenuPreviewBranchId !== selectedBranch.id ||
      branchMenuPreview.length === 0 ||
      branchMenuPreviewLoading ||
      branchMenuPreviewError
    ) {
      return products;
    }

    // Guard: Fallback if critical validation errors detected
    if (hasCriticalErrors(branchMenuValidationIssues)) {
      return products;
    }

    return branchMenuPreview.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      price: item.effective_price,
      badge: item.badge,
      image_url: item.image_url,
      description: item.description,
      is_sold_out: item.is_sold_out_for_branch,
      category: item.category,
      topping_category: item.topping_category,
    }));
  }, [
    isBranchMenuPreviewEnabled,
    selectedBranch,
    branchMenuPreview,
    branchMenuPreviewBranchId,
    branchMenuPreviewLoading,
    branchMenuPreviewError,
    branchMenuValidationIssues,
    products,
  ]);
  const branchGateDiagnostics = useMemo(
    () =>
      validateBranchFirstGateState({
        enabled:
          isBranchFirstGateEnabled || isBranchMenuPreviewEnabled,
        fulfillmentType,
        phone: normalizePhoneForLookup(customerPhone),
        checkedPhone: checkedCustomerPhone,
        address: customerAddress,
        latitude: deliveryLat,
        longitude: deliveryLng,
        selectedBranchId: selectedBranch?.id || null,
      }),
    [
      isBranchFirstGateEnabled,
      isBranchMenuPreviewEnabled,
      fulfillmentType,
      customerPhone,
      checkedCustomerPhone,
      customerAddress,
      deliveryLat,
      deliveryLng,
      selectedBranch,
    ]
  );

  const branchMenuGateLoading =
    isBranchMenuPreviewEnabled &&
    !!selectedBranch &&
    (branchMenuPreviewLoading ||
      branchMenuPreviewBranchId !== selectedBranch.id);

  const categories = useMemo(() => {
    const list = effectiveProducts.map((item) => item.category || "Món ngon");
    return ["Tất cả", ...Array.from(new Set(list))];
  }, [effectiveProducts]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "Tất cả") return effectiveProducts;

    return effectiveProducts.filter(
      (item) => (item.category || "Món ngon") === selectedCategory
    );
  }, [effectiveProducts, selectedCategory]);
  const branchMenuPreviewDiff = useMemo(() => {
    const legacyIds = new Set(products.map((item) => item.id));
    const previewIds = new Set(branchMenuPreview.map((item) => item.id));

    return {
      legacyCount: products.length,
      previewCount: branchMenuPreview.length,
      legacyMissingInPreview: products
        .filter((item) => !previewIds.has(item.id))
        .map((item) => item.id),
      previewOnlyIds: branchMenuPreview
        .filter((item) => !legacyIds.has(item.id))
        .map((item) => item.id),
    };
  }, [products, branchMenuPreview]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    if (
      !selectedBranch ||
      !isBranchMenuPreviewEnabled ||
      (branchMenuPreviewBranchId &&
        branchMenuPreviewBranchId !== selectedBranch.id)
    ) {
      return;
    }

    const diagnostics = buildBranchMenuDiagnostics(
      isBranchMenuPreviewEnabled,
      selectedBranch,
      branchMenuPreview,
      branchMenuPreviewLoading,
      branchMenuPreviewError,
      products,
      branchMenuPreviewDiff
    );

    console.debug("branch-menu preview validation", diagnostics);
  }, [
    selectedBranch,
    isBranchMenuPreviewEnabled,
    branchMenuPreview,
    branchMenuPreviewBranchId,
    branchMenuPreviewLoading,
    branchMenuPreviewError,
    branchMenuPreviewDiff,
    products,
  ]);

  // Wait until the URL beta state is resolved before deciding whether
  // the Branch First Gate should be open or closed.
  useEffect(() => {
    if (!betaResolved) {
      return;
    }

    if (!isBranchFirstGateEnabled) {
      setBranchGateConfirmed(true);
      setBranchGateLocked(false);
      return;
    }

    // Every fresh beta visit starts at the gate.
    if (!branchGateLocked) {
      setBranchGateConfirmed(false);
      return;
    }

    // If confirmed data becomes invalid, reopen the gate.
    if (!branchGateDiagnostics.readyForMenu) {
      setBranchGateConfirmed(false);
    }
  }, [
    betaResolved,
    isBranchFirstGateEnabled,
    branchGateLocked,
    branchGateDiagnostics.readyForMenu,
  ]);

  useEffect(() => {
    if (
      process.env.NODE_ENV !== "development" ||
      !isBranchFirstGateEnabled
    ) {
      return;
    }

    console.debug("branch-first gate validation", branchGateDiagnostics);
  }, [isBranchFirstGateEnabled, branchGateDiagnostics]);

 

  const subtotal = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + getItemUnitTotal(item) * item.quantity,
      0
    );
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);
  const suggestedProducts = useMemo(() => {
    if (!cart.length) return [];
  
    const firstProduct = cart[0]?.name;
  
    if (!firstProduct) return [];
  
    const suggestedNames =
      frequentlyBoughtTogether[firstProduct] || [];
  
    return effectiveProducts.filter((product) =>
      suggestedNames.includes(product.name)
    );
  }, [cart, effectiveProducts]);
  const comboProduct = useMemo(() => {
    if (!cart.length) return null;
  
    const firstProduct = cart[0]?.name;
  
    const combo =
      comboSuggestions[firstProduct]?.[0];
  
    if (!combo) return null;
  
    const product = effectiveProducts.find(
      (item) => item.name === combo.product
    );
  
    if (!product) return null;
  
    return {
      ...product,
      discount: combo.discount,
    };
  }, [cart, effectiveProducts]);
  const selectedShippingZone = useMemo(() => {
    return (
      shippingZones.find(
        (zone) =>
          deliveryDistanceKm >= Number(zone.min_km) &&
          deliveryDistanceKm <= Number(zone.max_km)
      ) || null
    );
  }, [shippingZones, deliveryDistanceKm]);

  const shippingFee =
  googleShippingFee !== null
    ? googleShippingFee
    : selectedShippingZone?.fee || 15000;
    let actualShippingFee = shippingFee;

    // Dưới 500m vẫn có phí giao gốc.
    // Nếu đơn đủ điều kiện, chương trình freeship sẽ tự giảm phí này về 0đ.
    if (
      fulfillmentType === "delivery" &&
      deliveryDistanceKm <= 0.5 &&
      actualShippingFee === 0
    ) {
      actualShippingFee = MIN_SHIPPING_FEE;
    }
  function getCouponValue(coupon: Coupon) {
    return Number(coupon.discount_value || coupon.value || 0);
  }

  function getCouponType(coupon: Coupon) {
    return String(coupon.discount_type || coupon.type || "fixed").toLowerCase();
  }
  function isGiftCoupon(coupon: Coupon) {
    return (
      getCouponType(coupon) === "gift" ||
      !!coupon.gift_product_id ||
      !!coupon.gift_product_name
    );
  }
  function getCouponMinOrder(coupon: Coupon) {
    return Number(coupon.min_order || coupon.min_order_value || 0);
  }

  function calculateDiscount(coupon: Coupon | null) {
    if (!coupon) return 0;

    const minOrder = getCouponMinOrder(coupon);
    if (subtotal < minOrder) return 0;

    const value = getCouponValue(coupon);
    const type = getCouponType(coupon);

    let discount = 0;

    if (type === "percent" || type === "percentage") {
      discount = Math.floor((subtotal * value) / 100);

      if (coupon.max_discount) {
        discount = Math.min(discount, Number(coupon.max_discount));
      }
    } else {
      discount = value;
    }

    return Math.min(discount, subtotal);
  }

  const discountAmount = calculateDiscount(selectedDiscountCoupon);

useEffect(() => {
  if (
    selectedDiscountCoupon &&
    subtotal < getCouponMinOrder(selectedDiscountCoupon)
  ) {
    setSelectedDiscountCoupon(null);
    showToast("Đã bỏ mã giảm giá vì đơn chưa đủ điều kiện");
  }

  if (
    selectedGiftCoupon &&
    subtotal < getCouponMinOrder(selectedGiftCoupon)
  ) {
    setSelectedGiftCoupon(null);
    showToast("Đã bỏ quà tặng vì đơn chưa đủ điều kiện");
  }
}, [subtotal, selectedDiscountCoupon, selectedGiftCoupon]);

const validShippingPromotions = shippingPromotions.filter((promo) => {
  const maxDistance = Number(promo.max_distance_km || 0);

  return (
    subtotal >= Number(promo.min_order_value || 0) &&
    (maxDistance <= 0 || deliveryDistanceKm <= maxDistance)
  );
});

const bestShippingPromotion =
  validShippingPromotions
    .map((promo) => {
      let promoDiscount = 0;

      if (promo.promotion_type === "free_ship") {
        promoDiscount = actualShippingFee;
      }

      if (promo.promotion_type === "ship_percent") {
        promoDiscount = Math.floor(
          actualShippingFee * (Number(promo.discount_value || 0) / 100)
        );
      }

      if (promo.promotion_type === "fixed") {
        promoDiscount = Number(promo.discount_value || 0);
      }

      return {
        ...promo,
        discountAmount: Math.min(promoDiscount, actualShippingFee),
      };
    })
    .sort((a, b) => b.discountAmount - a.discountAmount)[0] || null;
    const availableShippingPromotions = shippingPromotions.filter((promo) => {
      const maxDistance = Number(promo.max_distance_km || 0);
    
      return (
        promo.is_active &&
        subtotal >= Number(promo.min_order_value || 0) &&
        (maxDistance <= 0 || deliveryDistanceKm <= maxDistance)
      );
    });
    const shippingDiscount =
    fulfillmentType === "pickup" ? 0 : bestShippingPromotion?.discountAmount || 0;
  
  const finalShippingFee =
    fulfillmentType === "pickup" ? 0 : Math.max(0, actualShippingFee - shippingDiscount);
  
  const total = Math.max(0, subtotal + finalShippingFee - discountAmount);

const selectedReward = rewards.find((reward) => reward.id === selectedRewardId) || null;
const rewardPointsUsed = selectedReward ? Number(selectedReward.points_required || 0) : 0;
const canUseSelectedReward =
  !!selectedReward &&
  subtotal >= 50000 &&
  customerPoints >= rewardPointsUsed;

const redeemableRewards = rewards.filter(
  (reward) =>
    customerPoints >= Number(reward.points_required || 0) &&
    subtotal >= 50000
);

const totalAfterPoints = Math.max(
  0,
  total - usePointsDiscount
);
const estimatedReceive = getEstimatedReceiveTime();
const rewardPoints = Math.floor(totalAfterPoints / 10000);
const pointsDiscountUsed =
  usePointsDiscount === 10000 ? 100 : usePointsDiscount === 5000 ? 50 : 0;

const totalPointsUsed = pointsDiscountUsed + rewardPointsUsed;
const nextPointTarget =
  Math.ceil(totalAfterPoints / 10000) * 10000;

const amountToNextPoint =
  nextPointTarget - totalAfterPoints;

  const nextShippingPromotion = shippingPromotions
  .filter((promo) => {
    const maxDistance = Number(promo.max_distance_km || 0);

    return (
      promo.is_active &&
      fulfillmentType === "delivery" &&
      Number(promo.min_order_value || 0) > subtotal &&
      (maxDistance <= 0 || deliveryDistanceKm <= maxDistance)
    );
  })
  .sort(
    (a, b) =>
      Number(a.min_order_value || 0) -
      Number(b.min_order_value || 0)
  )[0];

const amountToNextShippingPromo = nextShippingPromotion
  ? Number(nextShippingPromotion.min_order_value) - subtotal
  : 0;
  const homepagePromotions = [
    ...coupons.slice(0, 4).map((coupon) => ({
      id: coupon.id,
      icon: isGiftCoupon(coupon) ? "🎁" : "🎟️",
      title: isGiftCoupon(coupon)
      ? "Tặng quà"
      : getCouponType(coupon).includes("percent")
      ? `Giảm ${getCouponValue(coupon)}%`
      : `Giảm ${getCouponValue(coupon).toLocaleString("vi-VN")}đ`,
  desc: isGiftCoupon(coupon)
  ? `Đơn từ ${getCouponMinOrder(coupon).toLocaleString("vi-VN")}đ`
  : `Đơn từ ${getCouponMinOrder(coupon).toLocaleString("vi-VN")}đ`,
      type: "coupon",
    })),
    ...shippingPromotions.slice(0, 3).map((promo) => ({
      id: promo.id,
      icon: "🚚",
      title:
  promo.promotion_type === "free_ship"
    ? "Freeship"
    : "Giảm ship",
      desc: `Đơn từ ${Number(promo.min_order_value || 0).toLocaleString(
        "vi-VN"
      )}đ`,
      type: "shipping",
    })),
    {
      id: "points",
      icon: "⭐",
      title: "Tích xu",
      desc: "Đổi quà",
      type: "points",
  },
  ];
  const shippingProgress = nextShippingPromotion
  ? Math.min(
      100,
      Math.round(
        (subtotal / Number(nextShippingPromotion.min_order_value || 1)) * 100
      )
    )
  : 100;
  const selectedToppings = useMemo(() => {
    return toppings.filter((item) => selectedToppingIds.includes(item.id));
  }, [toppings, selectedToppingIds]);

  const visibleToppings = useMemo(() => {
    if (!selectedProduct) return [];

    const productToppingCategory =
      selectedProduct.topping_category || "Topping bánh tráng";

    return toppings.filter(
      (topping) =>
        topping.category === productToppingCategory ||
        topping.category === "Topping dùng chung"
    );
  }, [toppings, selectedProduct]);
  const upsizeTopping = useMemo(() => {
    return visibleToppings.find((topping) =>
      isUpsizeOneLiterTopping(topping)
    );
  }, [visibleToppings]);
  
  const displayToppings = useMemo(() => {
    return visibleToppings.filter(
      (topping) => !isUpsizeOneLiterTopping(topping)
    );
  }, [visibleToppings]);
  const selectedProductTotal = useMemo(() => {
    if (!selectedProduct) return 0;
  
    const toppingTotal = selectedToppings.reduce(
      (sum, topping) => sum + Number(topping.price),
      0
    );

    return Number(selectedProduct.price) + toppingTotal;
  }, [selectedProduct, selectedToppings]);
  function isNowWithinShopHours(openTime?: string | null, closeTime?: string | null) {
    if (!openTime || !closeTime) return true;
  
    const openParts = openTime.split(":").map(Number);
    const closeParts = closeTime.split(":").map(Number);
  
    if (openParts.length < 2 || closeParts.length < 2) return true;
  
    const openMinutes = openParts[0] * 60 + openParts[1];
    const closeMinutes = closeParts[0] * 60 + closeParts[1];
  
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
  
    if (openMinutes === closeMinutes) return true;
  
    if (openMinutes < closeMinutes) {
      return nowMinutes >= openMinutes && nowMinutes <= closeMinutes;
    }
  
    return nowMinutes >= openMinutes || nowMinutes <= closeMinutes;
  }
  
  const isWithinShopHours = isNowWithinShopHours(
    shopSettings?.open_time,
    shopSettings?.close_time
  );
  const isShopOpen =
  shopSettings?.order_status === "closed" ||
  shopSettings?.order_status === "paused"
    ? false
    : shopSettings?.is_open === false
    ? false
    : !isWithinShopHours
    ? false
    : true;

    function applyCoupon(coupon: Coupon) {
      const minOrder = getCouponMinOrder(coupon);
    
      if (subtotal < minOrder) {
        alert(
          `Khuyến mãi này cần đơn tối thiểu ${minOrder.toLocaleString(
            "vi-VN"
          )}đ để áp dụng.`
        );
        return;
      }
    
      if (isGiftCoupon(coupon)) {
        setSelectedGiftCoupon(coupon);
        showToast("Đã chọn quà tặng");
      } else {
        setSelectedDiscountCoupon(coupon);
        showToast("Đã áp dụng mã giảm giá");
      }
    
      // Không đóng popup để khách chọn tiếp mã khác
    }

  async function upsertCustomer() {
    const cleanPhone = normalizePhoneForLookup(customerPhone);

    if (customerId) {
      const { data, error } = await supabase
        .from("customers")
        .update({
          name: customerName.trim(),
          last_address: customerAddress.trim(),
          last_address_detail: customerAddressDetail.trim(),
          last_payment_method: paymentMethod,
          last_lat: deliveryLat,
          last_lng: deliveryLng,
          updated_at: new Date().toISOString(),
        })
        .eq("id", customerId)
        .select()
        .single();

      if (error) throw error;
      return data as Customer;
    }

    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("*")
      .eq("phone", cleanPhone)
      .maybeSingle();

    if (existingCustomer) {
      const customer = existingCustomer as Customer;
      const { data: rewardData } = await supabase
      .from("customers")
      .select("total_points")
      .eq("phone", cleanPhone)
      .maybeSingle();
    
    setCustomerPoints(
      Number(rewardData?.total_points || 0)
    );
      const { data, error } = await supabase
        .from("customers")
        .update({
          name: customerName.trim(),
          last_address: customerAddress.trim(),
          last_address_detail: customerAddressDetail.trim(),
          last_payment_method: paymentMethod,
          last_lat: deliveryLat,
          last_lng: deliveryLng,
          updated_at: new Date().toISOString(),
        })
        .eq("id", customer.id)
        .select()
        .single();

      if (error) throw error;
      return data as Customer;
    }

    const { data, error } = await supabase
  .from("customers")
  .insert({
    name: customerName.trim(),
    phone: cleanPhone,
    last_address: customerAddress.trim(),
    last_address_detail: customerAddressDetail.trim(),
    last_payment_method: paymentMethod,
    last_lat: deliveryLat,
    last_lng: deliveryLng,
    total_orders: 0,
total_points: 0,
total_spent: 0,
  })
      .select()
      .single();

    if (error) throw error;
    return data as Customer;
  }
  function handleDeliveryAddressInputChange(value: string) {
    const requestId = addressSearchRequestRef.current + 1;
    addressSearchRequestRef.current = requestId;
    routeRequestRef.current += 1;
    addressSearchAbortRef.current?.abort();
    addressSearchAbortRef.current = null;

    setCustomerAddress(value);
    setDeliveryLat(null);
    setDeliveryLng(null);
    setSelectedBranch(null);
    setManualBranchId(null);
    setGoogleShippingFee(null);
    setRouteMessage("");
    setAddressSelected(false);
    setAddressSearchMessage("");

    if (addressSearchTimerRef.current !== null) {
      window.clearTimeout(addressSearchTimerRef.current);
      addressSearchTimerRef.current = null;
    }

    if (value.trim().length < 3) {
      setAddressSuggestions([]);
      setAddressLoading(false);
      return;
    }

    addressSearchTimerRef.current = window.setTimeout(() => {
      void searchAddressSuggestions(value, requestId);
      addressSearchTimerRef.current = null;
    }, 350);
  }

  async function searchAddressSuggestions(
    value: string,
    requestId: number
  ) {
    const input = value.trim();

    if (input.length < 3) {
      if (requestId === addressSearchRequestRef.current) {
        setAddressSuggestions([]);
        setAddressSearchMessage("");
      }
      return;
    }

    const controller = new AbortController();
    addressSearchAbortRef.current?.abort();
    addressSearchAbortRef.current = controller;
    setAddressLoading(true);
    setAddressSearchMessage("");

    try {
      let suggestions: PlaceSuggestion[] = [];
      let lastErrorMessage = "";

      for (const candidate of buildAddressSearchCandidates(input)) {
        const res = await fetch("/api/places", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          signal: controller.signal,
          body: JSON.stringify({
            action: "autocomplete",
            input: candidate,
          }),
        });

        const data = await res.json().catch(() => null);
if (process.env.NODE_ENV === "development") {
  console.debug("GOOGLE PLACES AUTOCOMPLETE RESPONSE:", {
    status: res.status,
    input: candidate,
    data,
  });
}
        if (requestId !== addressSearchRequestRef.current) {
          return;
        }

        if (!res.ok || !data?.ok) {
          lastErrorMessage = String(
            data?.message ||
              `Google Maps trả về lỗi ${res.status || "không xác định"}.`
          );
          console.warn("PLACES AUTOCOMPLETE ERROR:", {
            status: res.status,
            data,
          });
          continue;
        }

        suggestions = normalizePlaceSuggestions(data);
if (process.env.NODE_ENV === "development") {
  console.debug("NORMALIZED PLACE SUGGESTIONS:", suggestions);
}
        if (suggestions.length > 0) {
          break;
        }
      }

      if (requestId !== addressSearchRequestRef.current) {
        return;
      }

      setAddressSuggestions(suggestions);

      if (suggestions.length === 0) {
        setAddressSearchMessage(
          lastErrorMessage ||
            "Chưa tìm thấy địa chỉ. Hãy nhập thêm tên đường, phường hoặc quận, ví dụ: 178 Cô Giang, Quận 1."
        );
      }
    } catch (error) {
      if (
        controller.signal.aborted ||
        requestId !== addressSearchRequestRef.current
      ) {
        return;
      }

      console.error("SEARCH ADDRESS ERROR:", error);
      setAddressSuggestions([]);
      setAddressSearchMessage(
        "Không tải được gợi ý Google Maps. Hãy kiểm tra API Places hoặc thử tải lại trang."
      );
    } finally {
      if (requestId === addressSearchRequestRef.current) {
        setAddressLoading(false);
        if (addressSearchAbortRef.current === controller) {
          addressSearchAbortRef.current = null;
        }
      }
    }
  }

  async function selectAddressSuggestion(suggestion: PlaceSuggestion) {
    const requestId = addressSearchRequestRef.current + 1;
    addressSearchRequestRef.current = requestId;
    addressSearchAbortRef.current?.abort();
    addressSearchAbortRef.current = null;

    if (addressSearchTimerRef.current !== null) {
      window.clearTimeout(addressSearchTimerRef.current);
      addressSearchTimerRef.current = null;
    }

    setAddressLoading(true);
    setRouteMessage("");
    setAddressSuggestions([]);
    setAddressSearchMessage("");

    try {
      const res = await fetch("/api/places", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "details",
          placeId: suggestion.placeId,
        }),
      });

      const data = await res.json();

      if (requestId !== addressSearchRequestRef.current) {
        return;
      }

      if (!data.ok) {
        alert(data.message || "Không lấy được tọa độ địa chỉ.");
        return;
      }

      const lat = Number(data.place?.lat);
      const lng = Number(data.place?.lng);
      const address = String(data.place?.address || suggestion.text);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        alert(
          "Địa chỉ này chưa có tọa độ rõ ràng. Anh/chị chọn địa chỉ khác giúp em."
        );
        return;
      }

      setCustomerAddress(address);
      setDeliveryLat(lat);
      setDeliveryLng(lng);
      setAddressSelected(true);
      setManualBranchId(null);

      await calculateRouteByLatLng(lat, lng);
    } catch (error) {
      if (requestId !== addressSearchRequestRef.current) {
        return;
      }

      console.error("SELECT ADDRESS ERROR:", error);
      alert("Lỗi khi chọn địa chỉ.");
    } finally {
      if (requestId === addressSearchRequestRef.current) {
        setAddressLoading(false);
      }
    }
  }

  async function calculateRouteByLatLng(
    lat: number,
    lng: number,
    options?: {
      skipBranchPreview?: boolean;
      branchId?: string | null;
    }
  ) {
    const requestId = routeRequestRef.current + 1;
    routeRequestRef.current = requestId;

    setRouteLoading(true);
    setRouteMessage("");

    try {
      const shouldResolveBranch =
        isBranchMenuPreviewEnabled &&
        !options?.skipBranchPreview;

      /*
       * Quan trọng:
       * Phải xác định chi nhánh trước rồi mới gọi /api/maps.
       * Nếu gọi song song, React state selectedBranch vẫn có thể là chi nhánh cũ
       * và quãng đường sẽ bị tính từ sai điểm xuất phát.
       */
      let resolvedBranch: PreviewSelectedBranch | null = null;

      if (shouldResolveBranch) {
        const previewResult = await fetchMapsPreviewNearestBranch(lat, lng);

        if (requestId !== routeRequestRef.current) {
          return;
        }

        if (!previewResult.ok || !previewResult.selectedBranch?.id) {
          setSelectedBranch(null);
          setGoogleShippingFee(null);
          setRouteMessage(
            previewResult.message ||
              "Không xác định được chi nhánh phục vụ."
          );
          return;
        }

        resolvedBranch = previewResult.selectedBranch;
        setSelectedBranch(resolvedBranch);
        setManualBranchId(null);
      }

      const resolvedBranchId =
        options?.branchId ||
        resolvedBranch?.id ||
        manualBranchId ||
        selectedBranch?.id ||
        null;

      if (isBranchMenuPreviewEnabled && !resolvedBranchId) {
        setGoogleShippingFee(null);
        setRouteMessage(
          "Không xác định được chi nhánh dùng để tính quãng đường."
        );
        return;
      }

      const res = await fetch("/api/maps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          lat,
          lng,
          branchId: resolvedBranchId,
        }),
      });

      const data = await res.json().catch(() => null);

      if (requestId !== routeRequestRef.current) {
        return;
      }

      if (!res.ok || !data?.ok) {
        setRouteMessage(
          data?.message || "Không tính được phí ship."
        );
        setGoogleShippingFee(null);
        return;
      }

      const routeBranch =
        data.selected_branch &&
        typeof data.selected_branch === "object"
          ? (data.selected_branch as PreviewSelectedBranch)
          : null;

      /*
       * Server là nguồn xác nhận cuối cùng về chi nhánh đã dùng để tính.
       * Điều này giữ giao diện, phí ship và branch_id đồng bộ tuyệt đối.
       */
      if (routeBranch?.id) {
        setSelectedBranch(routeBranch);
      }

      setDeliveryDistanceKm(Number(data.distance_km || 0));
      setGoogleShippingFee(
        data.shipping_fee === null
          ? null
          : Number(data.shipping_fee)
      );

      const branchLabel =
        routeBranch?.short_name ||
        resolvedBranch?.short_name ||
        selectedBranch?.short_name ||
        "chi nhánh đã chọn";

      setRouteMessage(
        `${branchLabel}: ${data.distance_text} - ${
          data.duration_text
        }. Phí ship: ${
          data.shipping_fee === null
            ? "quán xác nhận"
            : Number(data.shipping_fee).toLocaleString("vi-VN") + "đ"
        }`
      );
    } catch (error) {
      if (requestId !== routeRequestRef.current) {
        return;
      }

      console.error("MAP ROUTE ERROR:", error);
      setRouteMessage("Lỗi khi tính phí ship.");
      setGoogleShippingFee(null);
    } finally {
      if (requestId === routeRequestRef.current) {
        setRouteLoading(false);
      }
    }
  }

  function estimatePreparationMinutes(itemCount: number) {
    if (itemCount <= 2) return 10;
    if (itemCount <= 5) return 15;
    if (itemCount <= 10) return 20;
    return 30;
  }
  
  function estimateDeliveryMinutes(distanceKm: number) {
    if (distanceKm <= 2) return 10;
    if (distanceKm <= 5) return 15;
    if (distanceKm <= 8) return 20;
    return 30;
  }
  
  function formatTime(date: Date) {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  function getScheduledDateTime() {
    if (orderType !== "scheduled") return null;
    if (!scheduledDate || !scheduledTime) return null;
  
    const date = new Date(`${scheduledDate}T${scheduledTime}:00`);
  
    if (Number.isNaN(date.getTime())) return null;
  
    return date;
  }
  function getEstimatedReceiveTime() {
    const prepMinutes = estimatePreparationMinutes(cartCount);
    const deliveryMinutes = estimateDeliveryMinutes(deliveryDistanceKm);
  
    const now = new Date();
  
    const from = new Date(
      now.getTime() + (prepMinutes + deliveryMinutes) * 60 * 1000
    );
  
    const to = new Date(from.getTime() + 10 * 60 * 1000);
  
    return {
      prepMinutes,
      deliveryMinutes,
      fromText: formatTime(from),
      toText: formatTime(to),
    };
  }
  function todayInputValue() {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  }
  
  function suggestedScheduledTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);
  
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
  
    return `${hour}:${minute}`;
  }
  async function submitOrder() {
    if (!isShopOpen) {
      alert("Hiện tại quán chưa nhận đơn. Anh quay lại sau giúp em nha.");
      return;
    }

    if (cart.length === 0) {
      alert("Anh chọn ít nhất 1 món trước khi đặt nha.");
      return;
    }

    const normalizedSubmitPhone = normalizePhoneForLookup(customerPhone);

    if (!isValidLookupPhone(normalizedSubmitPhone) || !customerName.trim()) {
      alert("Anh/chị nhập số điện thoại hợp lệ và tên giúp em nha.");
      return;
    }

    if (fulfillmentType === "delivery" && !customerAddress.trim()) {
      alert("Anh/chị nhập địa chỉ giao hàng giúp em nha.");
      return;
    }

    if (
      fulfillmentType === "delivery" &&
      (isBranchFirstGateEnabled || isBranchMenuPreviewEnabled) &&
      !branchGateDiagnostics.readyForMenu
    ) {
      alert(
        branchGateDiagnostics.blockingReasons[0] ||
          "Anh/chị vui lòng chọn lại địa chỉ để xác định chi nhánh phục vụ."
      );
      setBranchGateConfirmed(false);
      setBranchGateLocked(true);
      setCheckoutOpen(false);
      return;
    }

    const latestFlag = await fetchCustomerFlag(normalizedSubmitPhone);
    if (latestFlag?.status === "blocked") {
      alert("Rất tiếc, quán hiện chưa thể tiếp nhận đơn hàng từ số điện thoại này. Anh/chị vui lòng liên hệ hotline 0392 496 220.");
      return;
    }

    if (fulfillmentType === "delivery" && (!deliveryLat || !deliveryLng)) {
      alert("Anh/chị vui lòng chọn địa chỉ từ danh sách gợi ý Google.");
      return;
    }
    
    if (fulfillmentType === "delivery" && routeLoading) {
      alert("Hệ thống đang tính phí ship, anh/chị chờ vài giây nha.");
      return;
    }
    
    if (fulfillmentType === "delivery" && !routeMessage) {
      alert("Anh/chị bấm tính lại phí ship trước khi đặt hàng nha.");
      return;
    }

    if (selectedReward && !canUseSelectedReward) {
      alert("Quà đã chọn chưa đủ điều kiện. Anh/chị bỏ quà hoặc chọn quà khác giúp em nha.");
      return;
    }
    const scheduledDateTime = getScheduledDateTime();

    if (orderType === "scheduled" || fulfillmentType === "pickup") {
      if (!scheduledDateTime) {
        alert(
          fulfillmentType === "pickup"
            ? "Anh/chị chọn ngày và giờ đến lấy món giúp em nha."
            : "Anh/chị chọn ngày và giờ nhận món giúp em nha."
        );
        return;
      }
    
      const minTime = new Date(Date.now() + 30 * 60 * 1000);
    
      if (scheduledDateTime < minTime) {
        alert("Đơn đặt trước cần cách hiện tại ít nhất 30 phút nha.");
        return;
      }
    }
    
    setSubmitting(true);
    try {
      saveCustomerLocal();

      const customer = await upsertCustomer();
      const orderCode = `AVNT${Date.now().toString().slice(-6)}`;

      const estimateBaseTime = new Date();
      const estimatedFrom = new Date(
        estimateBaseTime.getTime() +
          (estimatedReceive.prepMinutes + estimatedReceive.deliveryMinutes) *
            60 *
            1000
      );
      const estimatedTo = new Date(estimatedFrom.getTime() + 10 * 60 * 1000);

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_code: orderCode,
          customer_id: customer.id,
          customer_name: customerName.trim(),
          customer_phone: normalizedSubmitPhone,
          customer_address:
  fulfillmentType === "delivery" ? customerAddress.trim() : "Khách tự đến lấy",
address_detail:
  fulfillmentType === "delivery" ? customerAddressDetail.trim() || null : null,
          note: [
            orderType === "scheduled" && scheduledDateTime
              ? `⏰ Đơn đặt trước: ${scheduledDateTime.toLocaleString("vi-VN")}${
                  scheduledNote.trim() ? `\nGhi chú đặt trước: ${scheduledNote.trim()}` : ""
                }`
              : "",
            note.trim(),
            latestFlag?.status === "warning"
              ? `⚠️ Khách cần xác nhận trước: ${latestFlag.note || "Admin đã đánh dấu cần xác nhận."}`
              : "",
            selectedReward ? `🎁 Quà đổi xu: ${selectedReward.name} (${rewardPointsUsed} xu)` : "",
          ]
            .filter(Boolean)
            .join("\n"),
          subtotal,
          shipping_fee_original:
          fulfillmentType === "pickup" ? 0 : actualShippingFee,
        
        shipping_discount:
          fulfillmentType === "pickup" ? 0 : shippingDiscount,
        
        coupon_discount: discountAmount,
        
        shipping_fee:
          fulfillmentType === "pickup" ? 0 : finalShippingFee,
        
        discount_amount:
          discountAmount + shippingDiscount + usePointsDiscount,

          points_used: totalPointsUsed,
          points_earned: rewardPoints,
          points_discount: usePointsDiscount,
          
          coupon_code: [
            selectedDiscountCoupon?.code || "",
            selectedGiftCoupon?.code || "",
          ]
            .filter(Boolean)
            .join(", ") || null,
          total: totalAfterPoints,
          status:
            paymentMethod === "momo"
              ? "waiting_payment"
              : latestFlag?.status === "warning"
              ? "need_confirm"
              : "new",
          source: "website",
          payment_method: paymentMethod,
          payment_status: paymentMethod === "cod" ? "unpaid" : "pending",
          delivery_distance_km: fulfillmentType === "pickup" ? 0 : deliveryDistanceKm,
delivery_area:
  fulfillmentType === "pickup"
    ? "Tự đến lấy"
    : selectedShippingZone?.name || "Quán xác nhận",
fulfillment_type: fulfillmentType,
          delivery_status: "pending",
          preparation_minutes: estimatedReceive.prepMinutes,
          delivery_minutes: estimatedReceive.deliveryMinutes,
          estimated_delivery_from: estimatedFrom.toISOString(),
          estimated_delivery_to: estimatedTo.toISOString(),
          confirmed_at: paymentMethod === "cod" ? new Date().toISOString() : null,
          order_type: fulfillmentType === "pickup" ? "scheduled" : orderType,
scheduled_at:
  (orderType === "scheduled" || fulfillmentType === "pickup") && scheduledDateTime
    ? scheduledDateTime.toISOString()
    : null,
    scheduled_note:
  orderType === "scheduled" || fulfillmentType === "pickup"
    ? scheduledNote.trim() || null
    : null,
    branch_id:
  fulfillmentType === "delivery" &&
  isBranchBeta &&
  selectedBranch?.id
    ? selectedBranch.id
    : null,
        })
        .select()
        .single();

      if (orderError || !order) throw orderError;

      const orderItems = [
        ...cart.map((item) => ({
          order_id: order.id,
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          price: getItemUnitTotal(item),
          unit_price: getItemUnitTotal(item),
          total: getItemUnitTotal(item) * item.quantity,
          note: item.itemNote || null,
          spicy_level: item.spicyLevel || null,
          toppings: item.selectedToppings.map((topping) => ({
            id: topping.id,
            name: topping.name,
            price: topping.price,
            category: topping.category || null,
          })),
        })),
        ...(selectedGiftCoupon
          ? [
              {
                order_id: order.id,
                product_id: selectedGiftCoupon.gift_product_id || null,
                product_name: `🎁 Món tặng: ${selectedGiftCoupon.gift_product_name}`,
                quantity: Number(selectedGiftCoupon.gift_quantity || 1),
                price: 0,
                unit_price: 0,
                total: 0,
                note: `Tặng theo chương trình ${selectedGiftCoupon.code}`,
                spicy_level: null,
                toppings: [],
              },
            ]
          : []),
        ...(selectedReward
          ? [
              {
                order_id: order.id,
                product_id: null,
                product_name: `🎁 Quà đổi xu: ${selectedReward.name}`,
                quantity: 1,
                price: 0,
                unit_price: 0,
                total: 0,
                note: `Dùng ${rewardPointsUsed} xu. Quán làm/giao chung với đơn.`,
                spicy_level: null,
                toppings: [],
              },
            ]
          : []),
      ];

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      if (selectedReward) {
        await supabase.from("reward_redemptions").insert({
          customer_phone: normalizedSubmitPhone,
          reward_id: selectedReward.id,
          reward_name: selectedReward.name,
          points_used: rewardPointsUsed,
          code: `${orderCode}-REWARD`,
          status: "pending",
        });
      }

      await supabase
      .from("customers")
      .update({
        total_orders: (customer.total_orders || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", customer.id);

      await fetch("/api/notify-new-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          orderCode,
          total: totalAfterPoints,
          paymentMethod,
          orderType,
          scheduledAt:
            orderType === "scheduled" && scheduledDateTime
              ? scheduledDateTime.toISOString()
              : null,
          status:
          
            paymentMethod === "momo"
              ? "waiting_payment"
              : latestFlag?.status === "warning"
              ? "need_confirm"
              : "new",
        }),
      });

      setCart([]);
      setNote("");
      setSelectedDiscountCoupon(null);
setSelectedGiftCoupon(null);
      setSelectedRewardId("");
      setOrderType("now");
setScheduledDate("");
setScheduledTime("");
setScheduledNote("");
      setCheckoutOpen(false);
      playSound("success");
      router.push(`/tra-cuu-don?code=${orderCode}`);
    } catch (error) {
      console.error("CREATE ORDER ERROR:", error);
      alert("Lỗi tạo đơn hàng. Anh thử lại giúp em.");
    } finally {
      setSubmitting(false);
    }
  }

  // Branch cart validation handlers
  const handleApplyBranchCartValidation = () => {
    if (!branchCartValidation) return;
    const toRemoveKeys = new Set([
      ...branchCartValidation.removedItems.map((i) => i.cartKey),
      ...branchCartValidation.unavailableItems.map((i) => i.cartKey),
    ]);
    const priceMap = new Map(
      branchCartValidation.updatedPrices.map((i) => [i.cartKey, i.newPrice])
    );
    setCart((prev) =>
      prev
        .filter((item) => !toRemoveKeys.has(item.cartKey))
        .map((item) =>
          priceMap.has(item.cartKey)
            ? { ...item, price: priceMap.get(item.cartKey)! }
            : item
        )
    );
    setBranchCartModalOpen(false);
    setBranchCartValidation(null);
  };

  const handleCancelBranchCartValidation = () => {
    setBranchCartModalOpen(false);
    setBranchCartValidation(null);
  };

  // Branch First Gate handlers
  const handlePhoneChangeGate = (newPhone: string) => {
    const normalizedPhone = normalizePhoneForLookup(newPhone);

    setBranchGateConfirmed(false);
    setBranchGateLocked(false);
    setCheckedCustomerPhone("");
    setCustomerPhone(normalizedPhone);
  };

  const handleConfirmSavedAddress = () => {
    if (!branchGateDiagnostics.readyForMenu) {
      setCustomerFoundMessage(
        branchGateDiagnostics.blockingReasons[0] ||
          "Hãy chọn địa chỉ từ gợi ý Google để xác định chi nhánh."
      );
      return;
    }

    setBranchGateConfirmed(true);
    setBranchGateLocked(true);
  };

  const handleChooseAddressGate = () => {
    addressSearchRequestRef.current += 1;
    routeRequestRef.current += 1;
    addressSearchAbortRef.current?.abort();
    addressSearchAbortRef.current = null;

    if (addressSearchTimerRef.current !== null) {
      window.clearTimeout(addressSearchTimerRef.current);
      addressSearchTimerRef.current = null;
    }

    setAddressLoading(false);
    setRouteLoading(false);
    setCustomerAddress("");
    setCustomerAddressDetail("");
    setDeliveryLat(null);
    setDeliveryLng(null);
    setSelectedBranch(null);
    setManualBranchId(null);
    setBranchSelectorOpen(false);
    setAddressSelected(false);
    setAddressSuggestions([]);
    setAddressSearchMessage("");
    setGoogleShippingFee(null);
    setRouteMessage("");
    setCustomerFoundMessage(
      "Nhập địa chỉ mới và chọn đúng kết quả Google để quán đổi chi nhánh an toàn."
    );
    setBranchGateConfirmed(false);
    setBranchGateLocked(false);
  };

  const handleChangePhoneGate = () => {
    addressSearchRequestRef.current += 1;
    routeRequestRef.current += 1;
    addressSearchAbortRef.current?.abort();
    addressSearchAbortRef.current = null;

    if (addressSearchTimerRef.current !== null) {
      window.clearTimeout(addressSearchTimerRef.current);
      addressSearchTimerRef.current = null;
    }

    setAddressLoading(false);
    setRouteLoading(false);
    setBranchGateConfirmed(false);
    setBranchGateLocked(false);
    setCheckedCustomerPhone("");
    setCheckingCustomer(false);
    setCustomerPhone("");
    setCustomerId("");
    setCustomerName("");
    setCustomerAddress("");
    setCustomerAddressDetail("");
    setCustomerPoints(0);
    setUsePointsDiscount(0);
    setSelectedRewardId("");
    setCustomerFlag(null);
    setDeliveryLat(null);
    setDeliveryLng(null);
    setSelectedBranch(null);
    setManualBranchId(null);
    setBranchSelectorOpen(false);
    setAddressSelected(false);
    setAddressSuggestions([]);
    setAddressSearchMessage("");
    setGoogleShippingFee(null);
    setRouteMessage("");
    setCustomerFoundMessage("");

    if (typeof window !== "undefined") {
      localStorage.removeItem("avnt_customer_phone");
      localStorage.removeItem("avnt_customer_name");
      localStorage.removeItem("avnt_customer_address");
      localStorage.removeItem("avnt_customer_address_detail");
    }
  };

  const handleOpenBranchSelector = () => {
    if (availableBranches.length === 0) {
      showToast("Chưa tải được danh sách chi nhánh.");
      return;
    }

    setBranchSelectorOpen(true);
  };

  const handleCloseBranchSelector = () => {
    setBranchSelectorOpen(false);
  };

  const handleSelectManualBranch = async (
    branch: PreviewSelectedBranch
  ) => {
    if (branch.id === selectedBranch?.id) {
      setBranchSelectorOpen(false);
      return;
    }

    setBranchGateLocked(false);
    setManualBranchId(branch.id || null);
    setSelectedCategory("Tất cả");

    setBranchMenuPreview([]);
    setBranchMenuPreviewBranchId(null);
    setBranchMenuPreviewError("");

    setSelectedBranch(branch);
    setBranchSelectorOpen(false);

    if (deliveryLat !== null && deliveryLng !== null) {
      await calculateRouteByLatLng(deliveryLat, deliveryLng, {
        skipBranchPreview: true,
        branchId: branch.id || null,
      });
    }

    setBranchGateLocked(true);
    showToast(
      `Đã chuyển sang menu ${
        branch.short_name || branch.code || "chi nhánh"
      }`
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5FFF8] px-4 py-20 text-center">
        <p className="text-xl font-black text-[#06113C]">Đang tải menu...</p>
      </main>
    );
  }

  // Show BranchFirstGate only for the private beta URL.
  if (isBranchFirstGateEnabled && !branchGateConfirmed) {
    return (
      <>
        <div className="fixed left-1/2 top-3 z-[4000] flex w-[94%] max-w-md -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-lg">
          <div className="min-w-0">
            <p className="text-xs font-black text-amber-700">
              BETA · Chọn chi nhánh thông minh
            </p>
            <p className="mt-1 text-[11px] font-bold text-amber-600">
              Phiên bản thử nghiệm nội bộ
            </p>
          </div>

          <a
            href="/dat-mon-nhanh"
            className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-black text-[#06113C] ring-1 ring-black/10"
          >
            Bản ổn định
          </a>
        </div>

        <BranchFirstGate
          phone={customerPhone}
          phoneChecked={branchGateDiagnostics.customerLookupComplete}
          customerName={customerName}
          customerAddress={customerAddress}
          customerAddressDetail={customerAddressDetail}
          selectedBranch={selectedBranch}
          availableBranches={availableBranches}
          branchSelectorOpen={branchSelectorOpen}
          checkingCustomer={checkingCustomer}
          addressLoading={addressLoading}
          routeLoading={routeLoading}
          branchMenuLoading={branchMenuGateLoading}
          addressSelected={addressSelected}
          addressSuggestions={addressSuggestions}
          addressSearchMessage={addressSearchMessage}
          statusMessage={customerFoundMessage}
          routeMessage={routeMessage}
          onPhoneChange={handlePhoneChangeGate}
          onConfirmSavedAddress={handleConfirmSavedAddress}
          onChooseAddress={handleChooseAddressGate}
          onChangePhone={handleChangePhoneGate}
          onAddressChange={handleDeliveryAddressInputChange}
          onAddressDetailChange={setCustomerAddressDetail}
          onSelectAddressSuggestion={selectAddressSuggestion}
          onOpenBranchSelector={handleOpenBranchSelector}
          onCloseBranchSelector={handleCloseBranchSelector}
          onSelectBranch={handleSelectManualBranch}
        />
      </>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5FFF8] pb-36">
      {isBranchBeta && (
        <div className="sticky top-0 z-[950] border-b border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-amber-700">
                BETA · Menu theo chi nhánh
              </p>
              <p className="mt-1 text-[11px] font-bold text-amber-600">
                Đang thử nghiệm trên website thật · Gate v2
              </p>
            </div>

            <a
              href="/dat-mon-nhanh"
              className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-black text-[#06113C] ring-1 ring-black/10"
            >
              Quay lại bản ổn định
            </a>
          </div>
        </div>
      )}
      {isBranchBeta && (
        <BranchSelectorModal
          open={branchSelectorOpen}
          branches={availableBranches}
          selectedBranch={selectedBranch}
          onClose={handleCloseBranchSelector}
          onSelect={handleSelectManualBranch}
        />
      )}
      {toast && (
        <div className="fixed left-1/2 top-4 z-[1000] w-[92%] max-w-sm -translate-x-1/2 rounded-2xl bg-[#06113C] px-5 py-4 text-center text-sm font-black text-white shadow-2xl">
          ✅ {toast}
        </div>
      )}

      {branchCartModalOpen && branchCartValidation && (
        <BranchCartValidationModal
          open={branchCartModalOpen}
          result={branchCartValidation}
          branchName={selectedBranch?.code || "chi nhánh mới"}
          onApply={handleApplyBranchCartValidation}
          onCancel={handleCancelBranchCartValidation}
        />
      )}

<section className="relative h-56 overflow-hidden">
  {banners[0]?.image_url ? (
    <img
      src={banners[0].image_url}
      alt={banners[0].title || "Banner"}
      className="protected-img h-full w-full object-cover"
    />
  ) : (
    <img
      src="/images/og-back.png"
      alt="Ăn Vặt Ngọc Trinh"
      className="protected-img h-full w-full object-cover"
    />
  )}

  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/35 to-black/60" />
</section>

      <section className="relative z-10 mx-auto -mt-16 max-w-6xl px-4">
        <div className="rounded-[32px] bg-white p-5 shadow-2xl shadow-neutral-950/10">
          <div className="flex gap-4">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-3xl bg-[#E8FFF1]">
              <img
                src="/images/hero.png"
                alt="Ăn Vặt Ngọc Trinh"
                className="protected-img h-full w-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-black leading-tight text-[#06113C] md:text-4xl">
                {shopSettings?.shop_name || "Ăn Vặt Ngọc Trinh"}
              </h1>

              <p className="mt-2 text-sm font-bold text-neutral-500">
                Bánh tráng & ăn vặt Quận 6
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-black text-yellow-700">
                  ⭐ 5.0
                </span>

                <span className="rounded-full bg-[#E8FFF1] px-3 py-1 text-xs font-black text-[#00B14F]">
                  {isShopOpen ? "Đang bán" : "Tạm đóng"}
                </span>

                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-600">
                  {shopSettings?.open_time || "10:00"} -{" "}
                  {shopSettings?.close_time || "22:00"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {isBranchMenuPreviewEnabled && selectedBranch && (
        <section className="mx-auto mt-4 max-w-6xl px-4">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#00B14F]/20 bg-[#E8FFF1] px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-black text-[#00B14F]">
                Menu đang xem
              </p>
              <p className="mt-1 truncate text-sm font-black text-[#06113C]">
                Ăn Vặt Ngọc Trinh -{" "}
                {selectedBranch.short_name ||
                  selectedBranch.code ||
                  "Chi nhánh"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenBranchSelector}
              className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-black text-[#00B14F] ring-1 ring-[#00B14F]/20"
            >
              Đổi menu
            </button>
          </div>
        </section>
      )}

      <section className="mx-auto mt-4 max-w-6xl px-4">
  <div className="flex gap-2 overflow-x-auto pb-2">
    {homepagePromotions.map((promo) => (
      <button
        key={`${promo.type}-${promo.id}`}
        type="button"
        onClick={() => {
          if (promo.type === "coupon") {
            setCheckoutOpen(true);
            setCouponOpen(true);
            return;
          }

          showToast(
            promo.type === "points"
              ? "Đặt đơn hoàn thành sẽ được cộng xu đổi quà"
              : "Ưu đãi ship sẽ tự áp dụng khi đơn đủ điều kiện"
          );
        }}
        className="flex min-w-fit items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-black/5 active:scale-[0.98]"
      >
        <span className="text-base">{promo.icon}</span>
        <span className="whitespace-nowrap text-xs font-black text-[#06113C]">
          {promo.title}
        </span>
      </button>
    ))}
  </div>
</section>
      {banners.length > 0 && (
        <section className="mx-auto mt-6 max-w-6xl px-4">
          <h2 className="text-2xl font-black text-[#06113C]">Ưu đãi hôm nay</h2>

          <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="min-w-[280px] overflow-hidden rounded-[28px] bg-white shadow-lg shadow-neutral-950/5 md:min-w-[420px]"
              >
                <div className="h-36 bg-[#E8FFF1]">
                  {banner.image_url && (
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="protected-img h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="p-4">
                  <p className="font-black text-[#06113C]">{banner.title}</p>

                  {banner.description && (
                    <p className="mt-1 line-clamp-2 text-sm font-semibold text-neutral-500">
                      {banner.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
     

{!isShopOpen && (
  <section className="mx-auto mt-6 max-w-6xl px-4">
    <div
      className={`rounded-[28px] p-5 ${
        shopSettings?.order_status === "closed"
          ? "bg-red-50 text-red-700"
          : "bg-yellow-50 text-yellow-700"
      }`}
    >
      <p className="text-xl font-black">
        {shopSettings?.order_status === "closed"
          ? "Quán hiện đang đóng cửa"
          : "Quán đang tạm ngưng nhận đơn"}
      </p>

      <p className="mt-2 text-sm font-bold">
        Khách vẫn có thể xem menu, nhưng hiện tại chưa thể gửi đơn mới.
      </p>
    </div>
  </section>
)}


      <section className="sticky top-0 z-40 mt-6 bg-[#F5FFF8]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-6xl overflow-x-auto">
          <div className="flex gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap rounded-full px-5 py-3 text-sm font-black ${
                  selectedCategory === category
                    ? "bg-[#00B14F] text-white shadow-lg shadow-[#00B14F]/25"
                    : "bg-white text-[#06113C]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-4 max-w-6xl px-4">
        <h2 className="text-2xl font-black text-[#06113C]">
          {selectedCategory === "Tất cả" ? "Dành cho bạn" : selectedCategory}
        </h2>

        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`overflow-hidden rounded-[28px] bg-white shadow-lg shadow-neutral-950/5 ${
                product.is_sold_out ? "opacity-50" : ""
              }`}
            >
              <button
                onClick={() => openProductOptions(product)}
                className="block w-full text-left"
              >
                <div className="relative h-40 bg-[#E8FFF1] md:h-48">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="protected-img h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-5xl">
                      🍽️
                    </div>
                  )}

                  {product.badge && (
                    <span className="absolute left-3 top-3 rounded-full bg-[#00B14F] px-3 py-1 text-xs font-black text-white">
                      {product.badge}
                    </span>
                  )}

                  {!product.is_sold_out && (
                    <span className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#00B14F] text-3xl font-black text-white shadow-lg">
                      +
                    </span>
                  )}
                </div>

                <div className="p-3">
                  <h3 className="line-clamp-2 min-h-[48px] text-base font-black leading-6 text-[#06113C]">
                    {product.name}
                  </h3>

                  <p className="mt-2 text-lg font-black text-[#06113C]">
                    {Number(product.price).toLocaleString("vi-VN")}đ
                  </p>

                  {product.is_sold_out && (
                    <p className="mt-1 text-sm font-black text-red-500">
                      Tạm hết món
                    </p>
                  )}
                </div>
              </button>
            </div>
          ))}
        </div>
      </section>

      {cart.length > 0 && (
        <div className="fixed bottom-[78px] left-0 right-0 z-[900] px-4 md:bottom-5 md:left-1/2 md:max-w-xl md:-translate-x-1/2">
          <button
            onClick={() => {
              playSound("open");
              setCheckoutOpen(true);
            }}
            className={`flex w-full items-center justify-between rounded-[24px] bg-[#06113C] px-5 py-4 text-white shadow-2xl shadow-black/25 transition active:scale-95 ${
              cartAnimate ? "scale-[1.02]" : ""
            }`}
          >
            <div className="text-left">
              <p className="text-xs font-black text-white/60">Giỏ hàng</p>
              <p className="text-sm font-black">
                🛒 {cartCount} món · {total.toLocaleString("vi-VN")}đ
              </p>
            </div>

            <div className="rounded-2xl bg-[#00B14F] px-4 py-2 text-sm font-black">
              Xem giỏ
            </div>
          </button>
        </div>
      )}

{selectedProduct && (
  <div className="fixed inset-0 z-[999] flex items-end bg-black/50 p-3 backdrop-blur-sm md:items-center md:justify-center">
    <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl md:max-w-xl">
      <div className="overflow-y-auto p-5 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 gap-3">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#E8FFF1]">
              <img
                src={selectedProduct.image_url || "/images/hero.jpg"}
                alt={selectedProduct.name}
                className="protected-img h-full w-full object-cover"
              />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-black text-[#00B14F]">Tùy chọn món</p>

              <h2 className="mt-1 line-clamp-2 text-xl font-black leading-tight text-[#06113C]">
                {selectedProduct.name}
              </h2>

              <p className="mt-1 text-lg font-black text-[#00B14F]">
                {Number(selectedProduct.price).toLocaleString("vi-VN")}đ
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedProduct(null)}
            className="shrink-0 rounded-full bg-neutral-100 px-4 py-2 font-black text-[#06113C]"
          >
            ✕
          </button>
        </div>

        {selectedProduct.description && (
          <p className="mt-4 line-clamp-2 text-sm font-semibold leading-6 text-neutral-600">
            {selectedProduct.description}
          </p>
        )}

        <div className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <p className="font-black text-[#06113C]">Chọn topping</p>

            <p className="text-xs font-bold text-neutral-400">
              Chọn thêm nếu muốn
            </p>
          </div>

          {displayToppings.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-[#F5FFF8] p-4 text-sm font-bold text-neutral-500">
              Món này chưa có topping phù hợp.
            </p>
          ) : (
            <div className="mt-3 max-h-[260px] space-y-2 overflow-y-auto pr-1">
              {displayToppings.map((topping) => {
                const active = selectedToppingIds.includes(topping.id);

                return (
                  <button
                    key={topping.id}
                    type="button"
                    onClick={() => toggleTopping(topping.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left font-black ${
                      active
                        ? "border-[#00B14F] bg-[#E8FFF1] text-[#00B14F]"
                        : "border-black/10 bg-white text-[#06113C]"
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="block truncate text-sm">
                        {topping.name}
                      </span>

                      <span className="block text-xs text-neutral-500">
                        +{Number(topping.price).toLocaleString("vi-VN")}đ
                      </span>
                    </div>

                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                        active
                          ? "border-[#00B14F] bg-[#00B14F] text-white"
                          : "border-neutral-300 text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selectedProduct && isDrinkProduct(selectedProduct) ? (
  <>
    {upsizeTopping && (
      <div className="mt-5">
        <p className="font-black text-[#06113C]">Dung tích ly</p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              if (selectedToppingIds.includes(upsizeTopping.id)) {
                toggleTopping(upsizeTopping.id);
              }
            }}
            className={`rounded-xl px-3 py-4 text-sm font-black ${
              selectedToppingIds.includes(upsizeTopping.id)
                ? "bg-[#F5FFF8] text-[#06113C]"
                : "bg-[#00B14F] text-white"
            }`}
          >
            700ml
          </button>

          <button
            type="button"
            onClick={() => {
              if (!selectedToppingIds.includes(upsizeTopping.id)) {
                toggleTopping(upsizeTopping.id);
              }
            }}
            className={`rounded-xl px-3 py-4 text-sm font-black ${
              selectedToppingIds.includes(upsizeTopping.id)
                ? "bg-[#00B14F] text-white"
                : "bg-[#F5FFF8] text-[#06113C]"
            }`}
          >
            1 lít +{Number(upsizeTopping.price).toLocaleString("vi-VN")}đ
          </button>
        </div>
      </div>
    )}

    <div className="mt-5">
      <p className="font-black text-[#06113C]">Lượng đá</p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {iceOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setSelectedIceLevel(option)}
            className={`rounded-xl px-2 py-3 text-xs font-black ${
              selectedIceLevel === option
                ? "bg-[#00B14F] text-white"
                : "bg-[#F5FFF8] text-[#06113C]"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>

    <div className="mt-5">
      <p className="font-black text-[#06113C]">Độ ngọt</p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {sugarOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setSelectedSugarLevel(option)}
            className={`rounded-xl px-2 py-3 text-xs font-black ${
              selectedSugarLevel === option
                ? "bg-[#00B14F] text-white"
                : "bg-[#F5FFF8] text-[#06113C]"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  </>
) : (
  <div className="mt-5">
    <p className="font-black text-[#06113C]">Độ cay</p>

    <div className="mt-3 grid grid-cols-4 gap-2">
      {spicyOptions.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setSelectedSpicyLevel(option)}
          className={`rounded-xl px-2 py-3 text-xs font-black ${
            selectedSpicyLevel === option
              ? "bg-[#00B14F] text-white"
              : "bg-[#F5FFF8] text-[#06113C]"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  </div>
)}

        <textarea
          value={itemNote}
          onChange={(e) => setItemNote(e.target.value)}
          placeholder="Ghi chú riêng cho món này"
          rows={2}
          className="mt-5 w-full rounded-2xl border border-black/10 px-4 py-3 text-sm font-bold outline-none focus:border-[#00B14F]"
        />
      </div>

      <div className="border-t border-black/10 bg-white p-4">
        <button
          onClick={addSelectedProductToCart}
          className="w-full rounded-2xl bg-[#00B14F] px-5 py-4 text-base font-black text-white"
        >
          Thêm vào giỏ · {selectedProductTotal.toLocaleString("vi-VN")}đ
        </button>
      </div>
    </div>
  </div>
)}

      {checkoutOpen && (
        <div className="fixed inset-0 z-[999] flex items-end bg-black/50 backdrop-blur-sm md:items-center md:justify-center">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[32px] bg-white p-5 shadow-2xl md:max-w-2xl md:rounded-[32px]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-black text-[#00B14F]">Đơn hàng</p>
                <h2 className="mt-1 text-3xl font-black text-[#06113C]">
                  Giỏ món của bạn
                </h2>
              </div>

              <button
                onClick={() => setCheckoutOpen(false)}
                className="rounded-full bg-neutral-100 px-4 py-2 font-black text-[#06113C]"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {cart.map((item) => (
                <div key={item.cartKey} className="rounded-3xl bg-[#F5FFF8] p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white">
                      <img
                        src={item.image_url || "/images/hero.jpg"}
                        alt={item.name}
                        className="protected-img h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex flex-1 items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-black text-[#06113C]">{item.name}</p>

                        {item.selectedToppings.length > 0 && (
                          <p className="mt-1 text-xs font-bold text-neutral-500">
                            Topping:{" "}
                            {item.selectedToppings
                              .map((topping) => topping.name)
                              .join(", ")}
                          </p>
                        )}

{item.spicyLevel && (
  <p className="mt-1 text-xs font-bold text-neutral-500">
    Tùy chọn: {item.spicyLevel}
  </p>
)}

                        {item.itemNote && (
                          <p className="mt-1 text-xs font-bold text-neutral-500">
                            Ghi chú: {item.itemNote}
                          </p>
                        )}

                        <p className="mt-1 text-sm font-bold text-[#00B14F]">
                          {(getItemUnitTotal(item) * item.quantity).toLocaleString(
                            "vi-VN"
                          )}
                          đ
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => decreaseItem(item.cartKey)}
                          className="h-8 w-8 rounded-full bg-white font-black"
                        >
                          -
                        </button>

                        <span className="font-black">{item.quantity}</span>

                        <button
                          onClick={() => increaseItem(item.cartKey)}
                          className="h-8 w-8 rounded-full bg-[#00B14F] font-black text-white"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedReward && (
              <div className="mt-3 rounded-3xl border border-[#00B14F]/30 bg-[#E8FFF1] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-[#00B14F]">
                      🎁 Quà đổi xu
                    </p>
                    <p className="mt-1 font-black text-[#06113C]">
                      {selectedReward.name}
                    </p>
                    <p className="mt-1 text-xs font-bold text-neutral-500">
                      Dùng {rewardPointsUsed} xu · Quà sẽ được làm chung với đơn
                    </p>
                  </div>

                  <p className="shrink-0 text-sm font-black text-[#00B14F]">
                    0đ
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 rounded-[28px] bg-[#F5FFF8] p-4">
  <p className="text-xl font-black text-[#06113C]">
    Ưu đãi & giảm giá
  </p>

  {bestShippingPromotion && shippingDiscount > 0 ? (
    <div className="mt-4 rounded-2xl border border-[#00B14F]/30 bg-[#E8FFF1] p-4">
      <p className="font-black text-[#06113C]">
        🎁 Đã tự động áp dụng
      </p>

      <p className="mt-1 text-sm font-bold text-[#00B14F]">
        {bestShippingPromotion.name}
      </p>

      <p className="mt-1 text-sm font-bold text-neutral-500">
        Giảm {shippingDiscount.toLocaleString("vi-VN")}đ phí ship
      </p>
    </div>
  ) : nextShippingPromotion && amountToNextShippingPromo > 0 ? (
    <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-black/10">
      <p className="font-black text-[#06113C]">
        🎁 Sắp nhận ưu đãi
      </p>

      <p className="mt-1 text-sm font-bold text-neutral-500">
        Mua thêm {amountToNextShippingPromo.toLocaleString("vi-VN")}đ để nhận:
      </p>

      <p className="mt-1 text-sm font-black text-[#00B14F]">
        {nextShippingPromotion.name}
      </p>

      <div className="mt-3 h-3 overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-[#00B14F]"
          style={{ width: `${shippingProgress}%` }}
        />
      </div>
    </div>
  ) : (
    <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-bold text-neutral-500 ring-1 ring-black/10">
      Chưa có ưu đãi vận chuyển phù hợp.
    </div>
  )}

  <button
    type="button"
    onClick={() => setCouponOpen(true)}
    className="mt-4 flex w-full items-center justify-between rounded-2xl bg-white px-4 py-4 text-left shadow-sm ring-1 ring-black/10"
  >
    <div>
      <p className="font-black text-[#06113C]">
        🎟️{" "}
        {selectedDiscountCoupon || selectedGiftCoupon
  ? [
      selectedDiscountCoupon?.title ||
        selectedDiscountCoupon?.name ||
        selectedDiscountCoupon?.code,
      selectedGiftCoupon?.title ||
        selectedGiftCoupon?.name ||
        selectedGiftCoupon?.code,
    ]
      .filter(Boolean)
      .join(" + ")
  : "Chọn khuyến mãi nếu có"}
      </p>

      {selectedDiscountCoupon && discountAmount > 0 && (
  <p className="mt-1 text-sm font-bold text-[#00B14F]">
    Giảm {discountAmount.toLocaleString("vi-VN")}đ
  </p>
)}

{selectedGiftCoupon && (
  <p className="mt-1 text-sm font-bold text-[#00B14F]">
    Tặng {selectedGiftCoupon.gift_product_name || "món quà"} x
    {selectedGiftCoupon.gift_quantity || 1}
  </p>
)}
    </div>

    <span className="text-2xl font-black">›</span>
  </button>
</div>

            <div className="mt-6 rounded-[28px] bg-[#F5FFF8] p-4">
              <p className="font-black text-[#06113C]">Thông tin khách</p>

              <div className="mt-4 space-y-3">
                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Số điện thoại"
                  type="tel"
                  inputMode="numeric"
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
                />

                {checkingCustomer && (
                  <p className="text-xs font-black text-neutral-500">
                    Đang kiểm tra khách cũ...
                  </p>
                )}

                {customerFoundMessage && (
                  <p className="rounded-2xl bg-[#E8FFF1] px-4 py-3 text-xs font-black text-[#00B14F]">
                    {customerFoundMessage}
                  </p>
                )}

                {customerFlag?.status === "warning" && (
                  <div className="rounded-2xl border border-yellow-300 bg-yellow-50 px-4 py-3 text-xs font-bold text-yellow-700">
                    <p className="font-black">⚠️ Đơn hàng cần quán xác nhận trước</p>
                    <p className="mt-1">
                      {customerFlag.note ||
                        "Quán sẽ kiểm tra và xác nhận trước khi làm món."}
                    </p>
                  </div>
                )}

                {customerFlag?.status === "blocked" && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
                    <p className="font-black">🚫 Số điện thoại đang bị hạn chế đặt hàng</p>
                    <p className="mt-1">
                      Vui lòng liên hệ hotline 0392 496 220 để được hỗ trợ.
                    </p>
                  </div>
                )}

                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Tên khách hàng"
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
                />
{fulfillmentType === "delivery" && (
  <>
<div className="relative">
  <input
    value={customerAddress}
    onChange={(e) => handleDeliveryAddressInputChange(e.target.value)}
    placeholder="Nhập địa chỉ giao hàng"
    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
  />

  {addressLoading && (
    <p className="mt-2 rounded-2xl bg-white px-4 py-3 text-xs font-black text-neutral-500">
      Đang tìm địa chỉ...
    </p>
  )}

  {addressSuggestions.length > 0 && (
    <div className="absolute left-0 right-0 top-full z-[1200] mt-2 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
      {addressSuggestions.map((suggestion) => (
        <button
          key={suggestion.placeId}
          type="button"
          onClick={() => selectAddressSuggestion(suggestion)}
          className="block w-full border-b border-black/5 px-4 py-3 text-left last:border-b-0 hover:bg-[#F5FFF8]"
        >
          <p className="text-sm font-black text-[#06113C]">
            {suggestion.mainText || suggestion.text}
          </p>

          {suggestion.secondaryText && (
            <p className="mt-1 text-xs font-bold text-neutral-500">
              {suggestion.secondaryText}
            </p>
          )}
        </button>
      ))}
    </div>
  )}

  {addressSelected && googleShippingFee !== null && (
    <p className="mt-2 rounded-2xl bg-[#E8FFF1] px-4 py-3 text-xs font-black text-[#00B14F]">
      ✅ Đã chọn địa chỉ Google và tính phí ship.
    </p>
  )}
</div>
<textarea
      value={customerAddressDetail}
      onChange={(e) => setCustomerAddressDetail(e.target.value)}
      placeholder="Chi tiết địa chỉ: Block, tầng, căn hộ, hẻm, khách sạn, gọi trước khi tới..."
      rows={2}
      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-4 text-sm font-bold outline-none focus:border-[#00B14F]"
    />
</>
)}
              </div>
            </div>

            <div className="mt-6 rounded-[28px] bg-[#F5FFF8] p-4">
              <p className="font-black text-[#06113C]">Giao hàng & thanh toán</p>

              <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="col-span-2 rounded-[24px] bg-white p-4 ring-1 ring-black/10">
  <p className="font-black text-[#06113C]">Nhận món bằng cách nào?</p>

  <div className="mt-3 grid grid-cols-2 gap-2">
    <button
      type="button"
      onClick={() => {
        setFulfillmentType("delivery");
      }}
      className={`rounded-2xl px-3 py-4 text-sm font-black ${
        fulfillmentType === "delivery"
          ? "bg-[#00B14F] text-white"
          : "bg-[#F5FFF8] text-[#06113C]"
      }`}
    >
      🛵 Giao tận nơi
    </button>

    <button
      type="button"
      onClick={() => {
        setFulfillmentType("pickup");
        setOrderType("scheduled");
        setSelectedBranch(null);
        setGoogleShippingFee(0);
        setDeliveryDistanceKm(0);
        setRouteMessage("Tự đến lấy tại quán - không tính phí ship");

        if (!scheduledDate) setScheduledDate(todayInputValue());
        if (!scheduledTime) setScheduledTime(suggestedScheduledTime());
      }}
      className={`rounded-2xl px-3 py-4 text-sm font-black ${
        fulfillmentType === "pickup"
          ? "bg-[#00B14F] text-white"
          : "bg-[#F5FFF8] text-[#06113C]"
      }`}
    >
      🏃 Tự đến lấy
    </button>
  </div>

  {fulfillmentType === "pickup" && (
    <div className="mt-3 rounded-2xl bg-[#FFF7E8] px-4 py-3 text-xs font-bold leading-5 text-[#B45309]">
      🏃 Tự đến lấy tại quán. Quán cần ít nhất 30 phút để chuẩn bị.
      <br />
      Địa chỉ: 240/127/22C Nguyễn Văn Luông, Bình Phú, Quận 6.
    </div>
  )}
</div>
              <div className="col-span-2 rounded-[24px] bg-white p-4 ring-1 ring-black/10">
  <div className="flex items-start justify-between gap-3">
    <div>
      <p className="text-lg font-black text-[#06113C]">
        Thời gian nhận món
      </p>
      <p className="mt-1 text-xs font-bold text-neutral-500">
        Chọn giao ngay hoặc hẹn giờ để quán chuẩn bị đúng lúc.
      </p>
    </div>

    <span
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
        orderType === "scheduled"
          ? "bg-[#FFF7E8] text-[#B45309]"
          : "bg-[#E8FFF1] text-[#00B14F]"
      }`}
    >
      {orderType === "scheduled" ? "Đặt trước" : "Giao ngay"}
    </span>
  </div>

  <div className={`mt-4 grid gap-3 ${
  fulfillmentType === "pickup" ? "grid-cols-1" : "grid-cols-2"
}`}>
    {fulfillmentType === "delivery" && (
    <button
      type="button"
      onClick={() => {
        setOrderType("now");
        setScheduledNote("");
      }}
      className={`rounded-2xl px-3 py-4 text-center font-black transition active:scale-[0.98] ${
        orderType === "now"
          ? "bg-[#00B14F] text-white shadow-lg shadow-[#00B14F]/20"
          : "bg-[#F5FFF8] text-[#06113C]"
      }`}
    >
      <span className="block text-lg">⚡</span>
      <span className="mt-1 block text-sm">Giao ngay</span>
      <span
        className={`mt-1 block text-[11px] font-bold ${
          orderType === "now" ? "text-white/80" : "text-neutral-500"
        }`}
      >
        Càng sớm càng tốt
      </span>
      </button>
    )}

    <button
      type="button"
      onClick={() => {
        setOrderType("scheduled");

        if (!scheduledDate) {
          setScheduledDate(todayInputValue());
        }

        if (!scheduledTime) {
          setScheduledTime(suggestedScheduledTime());
        }
      }}
      className={`rounded-2xl px-3 py-4 text-center font-black transition active:scale-[0.98] ${
        orderType === "scheduled"
          ? "bg-[#00B14F] text-white shadow-lg shadow-[#00B14F]/20"
          : "bg-[#F5FFF8] text-[#06113C]"
      }`}
    >
      <span className="block text-lg">🕒</span>
      <span className="mt-1 block text-sm">Đặt trước</span>
      <span
        className={`mt-1 block text-[11px] font-bold ${
          orderType === "scheduled" ? "text-white/80" : "text-neutral-500"
        }`}
      >
        Hẹn giờ nhận món
      </span>
    </button>
  </div>

  {orderType === "scheduled" && (
    <div className="mt-4 rounded-[22px] border border-[#00B14F]/20 bg-[#F5FFF8] p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-black text-neutral-500">
            Ngày nhận món
          </span>
          <input
            type="date"
            value={scheduledDate}
            min={todayInputValue()}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="h-14 w-full rounded-2xl border border-black/10 bg-white px-4 text-base font-black text-[#06113C] outline-none focus:border-[#00B14F]"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-black text-neutral-500">
            Giờ nhận món
          </span>
          <input
            type="time"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="h-14 w-full rounded-2xl border border-black/10 bg-white px-4 text-base font-black text-[#06113C] outline-none focus:border-[#00B14F]"
          />
        </label>
      </div>

      {scheduledDate && scheduledTime && (
        <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#00B14F]">
          ✅ Quán sẽ chuẩn bị đơn để nhận khoảng {scheduledTime} ngày{" "}
          {new Date(`${scheduledDate}T00:00:00`).toLocaleDateString("vi-VN")}
        </div>
      )}

      <textarea
        value={scheduledNote}
        onChange={(e) => setScheduledNote(e.target.value)}
        placeholder="Ghi chú thời gian, ví dụ: giao đúng 18:30 giúp em"
        rows={2}
        className="mt-3 w-full rounded-2xl border border-black/10 bg-white px-4 py-4 text-sm font-bold outline-none focus:border-[#00B14F]"
      />
    </div>
  )}
</div>

<div className="col-span-2 rounded-2xl bg-white p-4 ring-1 ring-black/10">
  <p className="font-black text-[#06113C]">Phương thức thanh toán</p>

  <div className="mt-3 grid grid-cols-2 gap-2">
    <button
      type="button"
      onClick={() => setPaymentMethod("momo")}
      className={`rounded-xl px-3 py-3 text-sm font-black ${
        paymentMethod === "momo"
          ? "bg-[#00B14F] text-white"
          : "bg-[#F5FFF8] text-[#06113C]"
      }`}
    >
      Chuyển khoản
    </button>

    <button
      type="button"
      onClick={() => setPaymentMethod("cod")}
      className={`rounded-xl px-3 py-3 text-sm font-black ${
        paymentMethod === "cod"
          ? "bg-[#00B14F] text-white"
          : "bg-[#F5FFF8] text-[#06113C]"
      }`}
    >
      Tiền mặt
    </button>
  </div>
</div>
{fulfillmentType === "delivery" && (
  <>
<button
  type="button"
  onClick={() => {
    if (!deliveryLat || !deliveryLng) {
      alert("Anh chọn địa chỉ từ gợi ý Google trước nha.");
      return;
    }
  
    calculateRouteByLatLng(deliveryLat, deliveryLng);
  }}
  disabled={routeLoading}
  className="col-span-2 rounded-2xl bg-[#00B14F] px-4 py-4 font-black text-white disabled:opacity-60"
>
{routeLoading ? "Đang tính phí ship..." : "🚚 Tính lại phí ship"}
</button>
</>
)}
{fulfillmentType === "delivery" && routeMessage && (
  <div
    className={`col-span-2 rounded-2xl px-4 py-3 text-sm font-bold ${
      googleShippingFee === null
        ? "border border-yellow-300 bg-yellow-50 text-yellow-700"
        : "bg-white text-[#06113C]"
    }`}
  >
    {googleShippingFee === null ? (
      <>
        <p className="font-black">
          ⚠️ Địa chỉ nằm ngoài khu vực giao tự động.
        </p>
        <p className="mt-1">
          Quán sẽ liên hệ xác nhận phí ship trước khi làm món. Anh/chị vẫn có
          thể đặt hàng bình thường.
        </p>
        <p className="mt-1">{routeMessage}</p>
      </>
    ) : (
      routeMessage
    )}
  </div>
)}
{fulfillmentType === "delivery" &&
  isBranchMenuPreviewEnabled &&
  selectedBranch && (
  <div className="col-span-2 rounded-2xl border border-[#00B14F]/20 bg-[#E8FFF1] px-4 py-3 text-[#06113C]">
    <p className="text-sm font-black">📍 Chi nhánh phục vụ</p>
    <p className="mt-1 text-sm font-black">Ăn Vặt Ngọc Trinh - {selectedBranch.short_name}</p>
    <p className="mt-1 text-xs font-bold text-[#00B14F]">
      Menu và đơn hàng đang dùng chi nhánh này
    </p>
    <button
      type="button"
      onClick={handleOpenBranchSelector}
      className="mt-3 w-full rounded-xl border border-[#00B14F]/30 bg-white px-4 py-3 text-sm font-black text-[#00B14F]"
    >
      Đổi menu chi nhánh
    </button>
  </div>
)}
              </div>

              {paymentMethod === "momo" && (
                <div className="mt-4 rounded-[24px] bg-white p-4">
                  <p className="text-center text-lg font-black text-[#06113C]">
                    Quét mã để chuyển khoản
                  </p>

                  <div className="mt-4 flex justify-center">
                    <img
                      src="/images/payment-qr.jpg"
                      alt="QR thanh toán Ăn Vặt Ngọc Trinh"
                      className="w-full max-w-[320px] rounded-3xl border border-black/10 shadow-lg"
                    />
                  </div>

                  <div className="mt-5 rounded-2xl bg-[#F5FFF8] p-4">
                    <p className="font-black text-[#06113C]">Nội dung CK:</p>

                    <p className="mt-1 text-xl font-black text-[#00B14F]">
                      AVNT {customerPhone || "SDT"}
                    </p>

                    <p className="mt-4 font-black text-[#06113C]">Số tiền:</p>

                    <p className="mt-1 text-2xl font-black text-[#00B14F]">
                      {totalAfterPoints.toLocaleString("vi-VN")}đ
                    </p>
                  </div>

                  <p className="mt-4 text-center text-xs font-semibold text-neutral-500">
                    Sau khi chuyển khoản, quán sẽ kiểm tra và xác nhận đơn hàng.
                  </p>
                </div>
              )}

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú chung cho đơn hàng"
                rows={3}
                className="mt-4 w-full rounded-2xl border border-black/10 bg-white px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
              />
            </div>
            {suggestedProducts.length > 0 && (
  <div className="mt-4 rounded-2xl bg-white/10 p-3">
    {comboProduct && (
  <div className="mb-4 rounded-2xl border border-[#00B14F]/20 bg-[#E8FFF1] p-4">
    <p className="text-sm font-black text-[#00B14F]">
      🔥 Combo đề xuất
    </p>

    <p className="mt-2 font-black text-[#06113C]">
      {cart[0]?.name}
    </p>

    <p className="text-center text-xl font-black text-[#00B14F]">
      +
    </p>

    <p className="font-black text-[#06113C]">
      {comboProduct.name}
    </p>

    <p className="mt-2 text-sm font-black text-[#00B14F]">
      Tiết kiệm {comboProduct.discount.toLocaleString("vi-VN")}đ
    </p>

    <button
      type="button"
      onClick={() =>
        openProductOptions(comboProduct)
      }
      className="mt-3 w-full rounded-xl bg-[#00B14F] px-4 py-3 text-sm font-black text-white"
    >
      Thêm combo
    </button>
  </div>
)}
    <p className="text-sm font-black text-white">
      🔥 Khách thường mua thêm
    </p>

    <div className="mt-3 space-y-2">
      {suggestedProducts.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => openProductOptions(item)}
          className="flex w-full items-center justify-between rounded-xl bg-white/10 px-3 py-2 text-left"
        >
          <div>
            <p className="text-sm font-bold text-white">
              {item.name}
            </p>

            <p className="text-xs text-white/60">
              {Number(item.price).toLocaleString("vi-VN")}đ
            </p>
          </div>

          <span className="rounded-lg bg-[#00B14F] px-3 py-1 text-xs font-black text-white">
            + Thêm
          </span>
        </button>
      ))}
    </div>
  </div>
)}
{fulfillmentType === "pickup" ? (
  <div className="mt-6 rounded-[28px] bg-[#E8FFF1] p-4">
    <p className="text-lg font-black text-[#06113C]">
      🏃 Đến lấy tại quán
    </p>

    <div className="mt-3 space-y-2 text-sm font-bold text-[#06113C]">
      <p>🍳 Quán cần ít nhất 30 phút để chuẩn bị.</p>

      <p className="text-base font-black text-[#00B14F]">
        🕒 Giờ đến lấy: {scheduledTime || "Vui lòng chọn giờ"}
      </p>

      <p>
        📍 240/127/22C Nguyễn Văn Luông, Bình Phú, Quận 6
      </p>

      <p className="text-[#00B14F]">
        💚 Không tính phí giao hàng
      </p>
    </div>
  </div>
) : (
  <div className="mt-6 rounded-[28px] bg-[#E8FFF1] p-4">
    <p className="text-lg font-black text-[#06113C]">
      ⏱️ Thời gian dự kiến
    </p>

    {googleShippingFee === null ? (
      <p className="mt-2 text-sm font-bold text-yellow-700">
        ⚠️ Địa chỉ ngoài khu vực giao tự động. Quán sẽ gọi xác nhận thời gian giao
        trước khi làm món.
      </p>
    ) : (
      <div className="mt-3 space-y-2 text-sm font-bold text-[#06113C]">
        <p>🍳 Làm món: khoảng {estimatedReceive.prepMinutes} phút</p>
        <p>🛵 Giao hàng: khoảng {estimatedReceive.deliveryMinutes} phút</p>
        <p className="text-base font-black text-[#00B14F]">
          📦 Dự kiến nhận món: {estimatedReceive.fromText} -{" "}
          {estimatedReceive.toText}
        </p>
      </div>
    )}
  </div>
)}
            <div className="mt-6 rounded-3xl bg-[#06113C] p-5 text-white">
              <div className="flex justify-between text-sm font-bold text-white/70">
                <span>Tạm tính</span>
                <span>{subtotal.toLocaleString("vi-VN")}đ</span>
              </div>

              <div className="mt-3 flex justify-between text-sm font-bold text-white/70">
              <span>
  {fulfillmentType === "pickup"
    ? "Phí ship"
    : `Phí ship ${selectedShippingZone ? `(${selectedShippingZone.name})` : ""}`}
</span>
                {shippingDiscount > 0 ? (
  <div className="text-right">
    <div className="text-xs text-white/40 line-through">
    {actualShippingFee.toLocaleString("vi-VN")}đ
    </div>
    <div className="font-black text-[#00B14F]">
      {finalShippingFee.toLocaleString("vi-VN")}đ
    </div>
  </div>
) : (
<span>
{fulfillmentType === "pickup"
  ? "0đ"
  : googleShippingFee === null
  ? "Quán xác nhận"
  : `${actualShippingFee.toLocaleString("vi-VN")}đ`}
</span>
)}
              </div>
  
              {discountAmount > 0 && (
                <div className="mt-3 flex justify-between text-sm font-bold text-[#00B14F]">
                  <span>Giảm giá</span>
                  <span>-{discountAmount.toLocaleString("vi-VN")}đ</span>
                </div>
              )}

        
{amountToNextPoint > 0 &&
 amountToNextPoint < 10000 && (
  <div className="mt-3 rounded-xl bg-[#FFF7E8] px-3 py-2 text-xs font-bold text-[#B45309]">
    🎁 Mua thêm{" "}
    {amountToNextPoint.toLocaleString("vi-VN")}đ
    để nhận thêm 1 Xu
  </div>
)}



              <div className="mt-4 border-t border-white/20 pt-4">
  <div className="rounded-2xl bg-white/10 px-3 py-2">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-black text-white">
          🪙 Xu Ăn Vặt
        </p>

        <p className="text-xs text-white/60">
          Bạn đang có {customerPoints} xu
        </p>
        {usePointsDiscount > 0 && (
  <p className="mt-1 text-xs font-bold text-[#FBBF24]">
    Đang dùng{" "}
    {usePointsDiscount === 10000 ? 100 : 50} xu để giảm{" "}
    {usePointsDiscount.toLocaleString("vi-VN")}đ
  </p>
)}
      </div>

      <div className="rounded-full bg-[#FFF7E8] px-3 py-1 text-xs font-black text-[#B45309]">
        {customerPoints} xu
      </div>
    </div>

    {rewards.length > 0 && (
      <div className="mt-4 rounded-2xl bg-white/10 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-white">
              🎁 Đổi quà trực tiếp
            </p>
            <p className="mt-1 text-xs font-bold text-white/60">
              Đơn từ 50.000đ, mỗi đơn chọn tối đa 1 quà.
            </p>
          </div>

          {selectedReward && (
            <button
              type="button"
              onClick={() => setSelectedRewardId("")}
              className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white"
            >
              Bỏ chọn
            </button>
          )}
        </div>

        {subtotal < 50000 ? (
          <p className="mt-3 rounded-xl bg-[#FFF7E8] px-3 py-2 text-xs font-bold text-[#B45309]">
            Mua thêm {(50000 - subtotal).toLocaleString("vi-VN")}đ để mở đổi quà.
          </p>
        ) : redeemableRewards.length === 0 ? (
          <p className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white/70">
            Bạn chưa đủ xu để đổi quà. Quà thấp nhất cần{" "}
            {Math.min(...rewards.map((item) => Number(item.points_required || 0)))} xu.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {rewards.map((reward) => {
              const requiredPoints = Number(reward.points_required || 0);
              const canRedeem = customerPoints >= requiredPoints && subtotal >= 50000;
              const active = selectedRewardId === reward.id;

              return (
                <button
                  key={reward.id}
                  type="button"
                  disabled={!canRedeem}
                  onClick={() => {
                    setSelectedRewardId(active ? "" : reward.id);
                    setUsePointsDiscount(0);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left ${
                    active
                      ? "bg-[#00B14F] text-white"
                      : canRedeem
                      ? "bg-white text-[#06113C]"
                      : "bg-white/10 text-white/40"
                  }`}
                >
                  <div>
                    <p className="text-sm font-black">
                      {reward.name}
                    </p>

                    {reward.description && (
                      <p className={`mt-1 text-xs font-bold ${
                        active ? "text-white/80" : "text-neutral-500"
                      }`}>
                        {reward.description}
                      </p>
                    )}
                  </div>

                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                    active
                      ? "bg-white text-[#00B14F]"
                      : canRedeem
                      ? "bg-[#FFF7E8] text-[#B45309]"
                      : "bg-white/10 text-white/50"
                  }`}>
                    {requiredPoints} xu
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {selectedReward && (
          <p className="mt-3 rounded-xl bg-[#E8FFF1] px-3 py-2 text-xs font-black text-[#00B14F]">
            ✅ Quà sẽ hiện trong đơn: {selectedReward.name} - 0đ
          </p>
        )}
      </div>
    )}

    <div className="mt-3 flex gap-2">
      {customerPoints >= 50 && !selectedReward && (
        <button
          type="button"
          onClick={() =>
            setUsePointsDiscount(
              usePointsDiscount === 5000 ? 0 : 5000
            )
          }
          className={`rounded-xl px-3 py-2 text-xs font-black ${
            usePointsDiscount === 5000
              ? "bg-[#00B14F] text-white"
              : "bg-white/10 text-white"
          }`}
        >
          50 xu -5k
        </button>
      )}

      {customerPoints >= 100 && !selectedReward && (
        <button
          type="button"
          onClick={() =>
            setUsePointsDiscount(
              usePointsDiscount === 10000 ? 0 : 10000
            )
          }
          className={`rounded-xl px-3 py-2 text-xs font-black ${
            usePointsDiscount === 10000
              ? "bg-[#00B14F] text-white"
              : "bg-white/10 text-white"
          }`}
        >
          100 xu -10k
        </button>
      )}
    </div>
  </div>

  {usePointsDiscount > 0 && (
    <div className="mt-3 flex justify-between text-sm font-bold text-[#FBBF24]">
      <span>Giảm Xu</span>
      <span>
        -{usePointsDiscount.toLocaleString("vi-VN")}đ
      </span>
    </div>
  )}

  {selectedReward && (
    <div className="mt-3 flex justify-between gap-3 text-sm font-bold text-[#FBBF24]">
      <span>Quà đổi xu</span>
      <span className="text-right">
        {selectedReward.name} · -{rewardPointsUsed} xu
      </span>
    </div>
  )}

  <div className="mt-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white/70">
    🪙 Hoàn thành đơn này nhận thêm{" "}
    <span className="text-[#FBBF24]">
      {rewardPoints} xu
    </span>
  </div>

  <div className="mt-2 flex justify-between text-2xl font-black">
                  <span>Tổng cộng</span>
                  <span>{totalAfterPoints.toLocaleString("vi-VN")}đ</span>
                </div>
     
              </div>
            </div>

            <button
              onClick={submitOrder}
              disabled={submitting || !isShopOpen || customerFlag?.status === "blocked"}
              className="mt-5 w-full rounded-2xl bg-[#00B14F] px-5 py-4 text-base font-black text-white disabled:opacity-60"
            >
              {submitting
                ? "Đang gửi đơn..."
                : !isShopOpen
                ? "Quán đang tạm ngưng"
                : customerFlag?.status === "blocked"
                ? "Số điện thoại đang bị hạn chế"
                : customerFlag?.status === "warning"
                ? `Gửi đơn chờ xác nhận · ${totalAfterPoints.toLocaleString("vi-VN")}đ`
                : fulfillmentType === "pickup"
                ? `Đặt món đến lấy · ${totalAfterPoints.toLocaleString("vi-VN")}đ`
                : orderType === "scheduled"
                ? `Đặt trước · ${totalAfterPoints.toLocaleString("vi-VN")}đ`
                : `Đặt hàng · ${totalAfterPoints.toLocaleString("vi-VN")}đ`}
            </button>
          </div>
        </div>
      )}

{couponOpen && (
  <div className="fixed inset-0 z-[1000] flex items-end bg-black/50 md:items-center md:justify-center">
    <div className="max-h-[85vh] w-full overflow-y-auto rounded-t-[32px] bg-white p-5 md:max-w-xl md:rounded-[32px]">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-[#06113C]">
        Chọn khuyến mãi
        </h2>

        <button
          onClick={() => setCouponOpen(false)}
          className="rounded-full bg-neutral-100 px-4 py-2 font-black"
        >
          Đóng
        </button>
      </div>

      <p className="mt-2 text-sm font-bold text-neutral-500">
        Khuyến mãi freeship sẽ được hệ thống tự áp dụng nếu đơn đủ điều kiện.
      </p>

      <div className="mt-5 space-y-3">
        {coupons.length === 0 ? (
          <p className="font-semibold text-neutral-500">
            Hiện chưa có khuyến mãi.
          </p>
        ) : (
          coupons.map((coupon) => {
            const minOrder = getCouponMinOrder(coupon);
            const canUse = subtotal >= minOrder;
            const isSelected = isGiftCoupon(coupon)
            ? selectedGiftCoupon?.id === coupon.id
            : selectedDiscountCoupon?.id === coupon.id;

            return (
              <button
                key={coupon.id}
                onClick={() => applyCoupon(coupon)}
                disabled={!canUse}
                className={`w-full rounded-2xl p-4 text-left ring-1 ring-black/10 ${
                  isSelected
                    ? "bg-[#E8FFF1] ring-[#00B14F]"
                    : canUse
                    ? "bg-white"
                    : "bg-neutral-100 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-[#06113C]">
                    {isGiftCoupon(coupon) ? "🎁" : "🎟️"}{" "}
                    {coupon.title || coupon.name || coupon.code}
                    </p>

                    <p className="mt-1 text-sm font-bold text-neutral-600">
                      Mã: {coupon.code}
                    </p>

                    <p className="mt-1 text-sm font-black text-[#00B14F]">
                    {isGiftCoupon(coupon)
  ? `Tặng ${coupon.gift_product_name || "món quà"} x${
      coupon.gift_quantity || 1
    }`
  : getCouponType(coupon).includes("percent")
  ? `Giảm ${getCouponValue(coupon)}%`
  : `Giảm ${getCouponValue(coupon).toLocaleString("vi-VN")}đ`}
                    </p>

                    {minOrder > 0 && (
                      <p className="mt-1 text-xs font-bold text-neutral-500">
                        Đơn tối thiểu {minOrder.toLocaleString("vi-VN")}đ
                      </p>
                    )}
                  </div>

                  {isSelected && (
                    <span className="rounded-full bg-[#00B14F] px-3 py-1 text-xs font-black text-white">
                      Đã chọn
                    </span>
                  )}
                </div>

                {!canUse && (
                  <p className="mt-2 text-xs font-bold text-red-500">
                    Chưa đủ điều kiện áp dụng
                  </p>
                )}
              </button>
            );
          })
        )}
      </div>

      {(selectedDiscountCoupon || selectedGiftCoupon) && (
        <button
          onClick={() => {
            setSelectedDiscountCoupon(null);
setSelectedGiftCoupon(null);
            setCouponOpen(false);
          }}
          className="mt-5 w-full rounded-2xl bg-red-50 px-5 py-4 font-black text-red-600"
        >
          Bỏ mã giảm giá
        </button>
      )}
    </div>
  </div>
)}  
    </main>
  );
}