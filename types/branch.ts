export type Branch = {
  id: string;
  code: string;
  name: string;
  short_name: string;
  address: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  is_open: boolean;
  preparation_minutes: number;
  delivery_radius_km: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type BranchApiItem = {
  id: string;
  code: string;
  name: string;
  short_name: string;
  address: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  is_open: boolean;
  preparation_minutes: number;
  delivery_radius_km: number;
  sort_order: number;
};

export type BranchProductSetting = {
  id: string;
  branch_id: string;
  product_id: string;
  is_available: boolean;
  is_sold_out: boolean;
  price_override: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type SelectedBranch = {
  branchId: string | null;
  branchCode: string | null;
  source: "auto" | "manual" | "default";
};

export type BranchContext = {
  selectedBranch: SelectedBranch;
  fallbackBranchCode: "q6";
};
