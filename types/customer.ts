export type CustomerLookupCustomer = {
  id: string;
  phone: string;
  name: string | null;
  lastAddress: string | null;
  lastAddressDetail: string | null;
  lastPaymentMethod: string | null;
  lastLat: number | null;
  lastLng: number | null;
  totalOrders: number;
  totalPoints: number;
  totalSpent: number;
};

export type CustomerLookupResult = {
  ok: boolean;
  normalizedPhone: string;
  customer: CustomerLookupCustomer | null;
  message: string | null;
};

export type ResolveCustomerBranchResult = {
  ok: boolean;
  customer: CustomerLookupCustomer | null;
  selectedBranch: {
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
  } | null;
  shouldChooseAddress: boolean;
  message: string | null;
};