import { supabase } from "@/lib/supabase";
import type { CustomerLookupCustomer, CustomerLookupResult } from "@/types/customer";

function normalizePhone(phone: string) {
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

function isValidPhone(phone: string) {
  return /^0(3|5|7|8|9)\d{8}$/.test(phone);
}

function mapCustomerRow(row: {
  id: string;
  phone: string;
  name: string | null;
  last_address: string | null;
  last_address_detail: string | null;
  last_payment_method: string | null;
  last_lat: number | null;
  last_lng: number | null;
  total_orders: number | null;
  total_points: number | null;
  total_spent: number | null;
}): CustomerLookupCustomer {
  return {
    id: row.id,
    phone: row.phone,
    name: row.name,
    lastAddress: row.last_address,
    lastAddressDetail: row.last_address_detail,
    lastPaymentMethod: row.last_payment_method,
    lastLat: row.last_lat,
    lastLng: row.last_lng,
    totalOrders: Number(row.total_orders || 0),
    totalPoints: Number(row.total_points || 0),
    totalSpent: Number(row.total_spent || 0),
  };
}

export async function lookupCustomerByPhone(
  phone: string,
  signal?: AbortSignal
): Promise<CustomerLookupResult> {
  const normalizedPhone = normalizePhone(phone);

  if (!isValidPhone(normalizedPhone)) {
    return {
      ok: false,
      normalizedPhone,
      customer: null,
      message: "Số điện thoại chưa hợp lệ.",
    };
  }

  try {
    let query = supabase
      .from("customers")
      .select(
        "id,phone,name,last_address,last_address_detail,last_payment_method,last_lat,last_lng,total_orders,total_points,total_spent"
      )
      .eq("phone", normalizedPhone);

    if (signal) {
      query = query.abortSignal(signal);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("lookupCustomerByPhone error:", error);
      return {
        ok: false,
        normalizedPhone,
        customer: null,
        message: "Không thể tra cứu khách hàng.",
      };
    }

    if (!data) {
      return {
        ok: true,
        normalizedPhone,
        customer: null,
        message: null,
      };
    }

    return {
      ok: true,
      normalizedPhone,
      customer: mapCustomerRow(data),
      message: null,
    };
  } catch (error) {
    console.error("lookupCustomerByPhone unexpected error:", error);
    return {
      ok: false,
      normalizedPhone,
      customer: null,
      message: "Không thể tra cứu khách hàng.",
    };
  }
}
