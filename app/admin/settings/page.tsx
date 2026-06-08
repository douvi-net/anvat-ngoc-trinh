"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";

type ShopSettings = {
  id: number;
  shop_name: string;
  hotline: string;
  open_time: string;
  order_status: string;
  description: string | null;
  delivery_note: string | null;
  updated_at: string | null;
};

type ShippingZone = {
  id: string;
  name: string;
  min_km: number;
  max_km: number;
  fee: number;
  is_active: boolean;
  sort_order: number;
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

const defaultSettings: ShopSettings = {
  id: 1,
  shop_name: "Ăn Vặt Ngọc Trinh",
  hotline: "0392496220",
  open_time: "11:00 - 22:00",
  order_status: "open",
  description: "Bánh tráng, ăn vặt và nước uống khu vực Quận 6.",
  delivery_note:
    "Giao khu vực Quận 6 và lân cận. Phí ship sẽ được tính theo khoảng cách.",
  updated_at: null,
};

const defaultZoneForm = {
  name: "",
  min_km: 0,
  max_km: 2,
  fee: 15000,
  sort_order: 99,
};

const defaultPromotionForm = {
  name: "",
  promotion_type: "free_ship",
  min_order_value: 0,
  max_distance_km: 8,
  discount_value: 999999,
  sort_order: 99,
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<ShopSettings>(defaultSettings);

  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [zoneForm, setZoneForm] = useState(defaultZoneForm);

  const [shippingPromotions, setShippingPromotions] = useState<
    ShippingPromotion[]
  >([]);
  const [editingPromotion, setEditingPromotion] =
    useState<ShippingPromotion | null>(null);
  const [promotionForm, setPromotionForm] = useState(defaultPromotionForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);

    const [{ data: settingsData }, { data: zonesData }, { data: promoData }] =
      await Promise.all([
        supabase.from("shop_settings").select("*").eq("id", 1).single(),

        supabase
          .from("shipping_zones")
          .select("*")
          .order("sort_order", { ascending: true }),

        supabase
          .from("shipping_promotions")
          .select("*")
          .order("sort_order", { ascending: true }),
      ]);

    if (settingsData) {
      setSettings(settingsData as ShopSettings);
    }

    setShippingZones((zonesData || []) as ShippingZone[]);
    setShippingPromotions((promoData || []) as ShippingPromotion[]);
    setLoading(false);
  }

  async function saveSettings() {
    setSaving(true);

    const { error } = await supabase
      .from("shop_settings")
      .update({
        shop_name: settings.shop_name,
        hotline: settings.hotline,
        open_time: settings.open_time,
      
        order_status: settings.order_status,
      
        is_open:
          settings.order_status === "open",
      
        description: settings.description,
        delivery_note: settings.delivery_note,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    setSaving(false);

    if (error) {
      alert("Lưu cài đặt thất bại.");
      console.error(error);
      return;
    }

    alert("Đã lưu cài đặt quán.");
    fetchSettings();
  }

  function updateField<K extends keyof ShopSettings>(
    key: K,
    value: ShopSettings[K]
  ) {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function startCreateZone() {
    setEditingZone(null);
    setZoneForm(defaultZoneForm);
  }

  function startEditZone(zone: ShippingZone) {
    setEditingZone(zone);
    setZoneForm({
      name: zone.name,
      min_km: Number(zone.min_km),
      max_km: Number(zone.max_km),
      fee: Number(zone.fee),
      sort_order: Number(zone.sort_order),
    });
  }

  async function saveShippingZone() {
    if (!zoneForm.name.trim()) {
      alert("Nhập tên khu vực ship trước nha.");
      return;
    }

    if (Number(zoneForm.max_km) <= Number(zoneForm.min_km)) {
      alert("Km đến phải lớn hơn Km từ.");
      return;
    }

    const payload = {
      name: zoneForm.name.trim(),
      min_km: Number(zoneForm.min_km),
      max_km: Number(zoneForm.max_km),
      fee: Number(zoneForm.fee),
      sort_order: Number(zoneForm.sort_order),
    };

    if (editingZone) {
      const { error } = await supabase
        .from("shipping_zones")
        .update(payload)
        .eq("id", editingZone.id);

      if (error) {
        alert("Sửa khu vực ship thất bại.");
        console.error(error);
        return;
      }
    } else {
      const { error } = await supabase.from("shipping_zones").insert({
        ...payload,
        is_active: true,
      });

      if (error) {
        alert("Thêm khu vực ship thất bại.");
        console.error(error);
        return;
      }
    }

    setEditingZone(null);
    setZoneForm(defaultZoneForm);
    fetchSettings();
  }

  async function toggleShippingZone(zone: ShippingZone) {
    const { error } = await supabase
      .from("shipping_zones")
      .update({
        is_active: !zone.is_active,
      })
      .eq("id", zone.id);

    if (error) {
      alert("Không đổi được trạng thái khu vực ship.");
      console.error(error);
      return;
    }

    fetchSettings();
  }

  async function deleteShippingZone(zone: ShippingZone) {
    const ok = confirm(`Xóa khu vực "${zone.name}"?`);
    if (!ok) return;

    const { error } = await supabase
      .from("shipping_zones")
      .delete()
      .eq("id", zone.id);

    if (error) {
      alert("Không xóa được khu vực ship.");
      console.error(error);
      return;
    }

    fetchSettings();
  }

  function startCreatePromotion() {
    setEditingPromotion(null);
    setPromotionForm(defaultPromotionForm);
  }

  function startEditPromotion(promotion: ShippingPromotion) {
    setEditingPromotion(promotion);
    setPromotionForm({
      name: promotion.name,
      promotion_type: promotion.promotion_type,
      min_order_value: Number(promotion.min_order_value),
      max_distance_km: Number(promotion.max_distance_km),
      discount_value: Number(promotion.discount_value),
      sort_order: Number(promotion.sort_order),
    });
  }

  async function saveShippingPromotion() {
    if (!promotionForm.name.trim()) {
      alert("Nhập tên khuyến mãi trước nha.");
      return;
    }

    const payload = {
      name: promotionForm.name.trim(),
      promotion_type: promotionForm.promotion_type,
      min_order_value: Number(promotionForm.min_order_value),
      max_distance_km: Number(promotionForm.max_distance_km),
      discount_value: Number(promotionForm.discount_value),
      sort_order: Number(promotionForm.sort_order),
    };

    if (editingPromotion) {
      const { error } = await supabase
        .from("shipping_promotions")
        .update(payload)
        .eq("id", editingPromotion.id);

      if (error) {
        alert("Sửa khuyến mãi thất bại.");
        console.error(error);
        return;
      }
    } else {
      const { error } = await supabase.from("shipping_promotions").insert({
        ...payload,
        is_active: true,
      });

      if (error) {
        alert("Thêm khuyến mãi thất bại.");
        console.error(error);
        return;
      }
    }

    setEditingPromotion(null);
    setPromotionForm(defaultPromotionForm);
    fetchSettings();
  }

  async function toggleShippingPromotion(promotion: ShippingPromotion) {
    const { error } = await supabase
      .from("shipping_promotions")
      .update({
        is_active: !promotion.is_active,
      })
      .eq("id", promotion.id);

    if (error) {
      alert("Không đổi được trạng thái khuyến mãi.");
      console.error(error);
      return;
    }

    fetchSettings();
  }

  async function deleteShippingPromotion(promotion: ShippingPromotion) {
    const ok = confirm(`Xóa khuyến mãi "${promotion.name}"?`);
    if (!ok) return;

    const { error } = await supabase
      .from("shipping_promotions")
      .delete()
      .eq("id", promotion.id);

    if (error) {
      alert("Không xóa được khuyến mãi.");
      console.error(error);
      return;
    }

    fetchSettings();
  }

  return (
    <AdminLayout>
      <div>
        <p className="font-black text-[#00B14F]">Admin/POS</p>

        <h1 className="mt-1 text-4xl font-black text-[#06113C]">
          Cài đặt quán
        </h1>

        <p className="mt-2 text-sm font-semibold text-neutral-500">
          Quản lý thông tin quán, trạng thái nhận đơn, phí ship và khuyến mãi.
        </p>
      </div>

      {loading ? (
        <p className="mt-10 font-black text-[#06113C]">Đang tải cài đặt...</p>
      ) : (
        <>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.75fr]">
            <div className="rounded-[32px] bg-white p-6 shadow-xl shadow-neutral-950/5">
              <h2 className="text-2xl font-black text-[#06113C]">
                Thông tin quán
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-black text-neutral-500">
                    Tên quán
                  </label>
                  <input
                    value={settings.shop_name}
                    onChange={(e) => updateField("shop_name", e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
                  />
                </div>

                <div>
                  <label className="text-sm font-black text-neutral-500">
                    Hotline
                  </label>
                  <input
                    value={settings.hotline}
                    onChange={(e) => updateField("hotline", e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
                  />
                </div>

                <div>
                  <label className="text-sm font-black text-neutral-500">
                    Giờ mở cửa
                  </label>
                  <input
                    value={settings.open_time}
                    onChange={(e) => updateField("open_time", e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
                  />
                </div>

                <div>
                  <label className="text-sm font-black text-neutral-500">
                    Trạng thái nhận đơn
                  </label>
                  <select
                    value={settings.order_status}
                    onChange={(e) =>
                      updateField("order_status", e.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
                  >
                    <option value="open">Đang nhận đơn</option>
                    <option value="paused">Tạm ngưng nhận đơn</option>
                    <option value="closed">Đóng cửa</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-black text-neutral-500">
                    Mô tả ngắn
                  </label>
                  <textarea
                    value={settings.description || ""}
                    onChange={(e) => updateField("description", e.target.value)}
                    rows={4}
                    className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-black text-neutral-500">
                    Ghi chú giao hàng
                  </label>
                  <textarea
                    value={settings.delivery_note || ""}
                    onChange={(e) =>
                      updateField("delivery_note", e.target.value)
                    }
                    rows={4}
                    className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
                  />
                </div>
              </div>

              <button
                onClick={saveSettings}
                disabled={saving}
                className="mt-6 rounded-2xl bg-[#00B14F] px-6 py-4 font-black text-white shadow-lg shadow-[#00B14F]/25 disabled:opacity-60"
              >
                {saving ? "Đang lưu..." : "Lưu cài đặt"}
              </button>
            </div>

            <div className="space-y-6">
              <div className="rounded-[32px] bg-[#06113C] p-6 text-white shadow-xl shadow-neutral-950/5">
                <p className="font-black text-[#00B14F]">Trạng thái hiện tại</p>

                <h2 className="mt-3 text-4xl font-black">
                  {settings.order_status === "open"
                    ? "Đang nhận đơn"
                    : settings.order_status === "paused"
                    ? "Tạm ngưng"
                    : "Đóng cửa"}
                </h2>

                <p className="mt-4 text-sm font-medium leading-7 text-white/70">
                  Trạng thái này sẽ khóa/mở trang đặt món nhanh cho khách.
                </p>
              </div>

              <div className="rounded-[32px] bg-white p-6 shadow-xl shadow-neutral-950/5">
                <p className="font-black text-[#00B14F]">Cập nhật cuối</p>
                <p className="mt-2 text-sm font-bold text-neutral-600">
                  {settings.updated_at
                    ? new Date(settings.updated_at).toLocaleString("vi-VN")
                    : "Chưa có"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-[32px] bg-white p-6 shadow-xl shadow-neutral-950/5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#06113C]">
                  Khu vực & phí ship
                </h2>
                <p className="mt-1 text-sm font-semibold text-neutral-500">
                  Trang đặt món sẽ tự lấy phí ship từ bảng này.
                </p>
              </div>

              <button
                onClick={startCreateZone}
                className="rounded-2xl bg-[#06113C] px-5 py-3 text-sm font-black text-white"
              >
                + Thêm khu vực
              </button>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-[28px] bg-[#F5FFF8] p-5">
                <p className="font-black text-[#00B14F]">
                  {editingZone ? "Sửa khu vực" : "Thêm khu vực"}
                </p>

                <div className="mt-4 space-y-3">
                  <input
                    value={zoneForm.name}
                    onChange={(e) =>
                      setZoneForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Tên khu vực: Gần quán"
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-4 font-bold outline-none"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      value={zoneForm.min_km}
                      onChange={(e) =>
                        setZoneForm((prev) => ({
                          ...prev,
                          min_km: Number(e.target.value),
                        }))
                      }
                      placeholder="Từ km"
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-4 font-bold outline-none"
                    />

                    <input
                      type="number"
                      value={zoneForm.max_km}
                      onChange={(e) =>
                        setZoneForm((prev) => ({
                          ...prev,
                          max_km: Number(e.target.value),
                        }))
                      }
                      placeholder="Đến km"
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-4 font-bold outline-none"
                    />
                  </div>

                  <input
                    type="number"
                    value={zoneForm.fee}
                    onChange={(e) =>
                      setZoneForm((prev) => ({
                        ...prev,
                        fee: Number(e.target.value),
                      }))
                    }
                    placeholder="Phí ship"
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-4 font-bold outline-none"
                  />

                  <input
                    type="number"
                    value={zoneForm.sort_order}
                    onChange={(e) =>
                      setZoneForm((prev) => ({
                        ...prev,
                        sort_order: Number(e.target.value),
                      }))
                    }
                    placeholder="Thứ tự"
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-4 font-bold outline-none"
                  />
                </div>

                <button
                  onClick={saveShippingZone}
                  className="mt-4 w-full rounded-2xl bg-[#00B14F] px-5 py-4 text-sm font-black text-white"
                >
                  {editingZone ? "Lưu sửa" : "Thêm khu vực"}
                </button>
              </div>

              <div className="space-y-3">
                {shippingZones.map((zone) => (
                  <div
                    key={zone.id}
                    className="grid gap-3 rounded-[24px] border border-black/5 p-4 md:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-[#06113C]">{zone.name}</p>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            zone.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {zone.is_active ? "Đang dùng" : "Đang ẩn"}
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-bold text-neutral-600">
                        {zone.min_km}km - {zone.max_km}km
                      </p>

                      <p className="mt-1 text-xl font-black text-[#00B14F]">
                        {zone.fee.toLocaleString("vi-VN")}đ
                      </p>
                    </div>

                    <div className="flex gap-2 md:flex-col">
                      <button
                        onClick={() => startEditZone(zone)}
                        className="rounded-xl bg-[#06113C] px-4 py-3 text-xs font-black text-white"
                      >
                        Sửa
                      </button>

                      <button
                        onClick={() => toggleShippingZone(zone)}
                        className="rounded-xl bg-[#E8FFF1] px-4 py-3 text-xs font-black text-[#00B14F]"
                      >
                        {zone.is_active ? "Ẩn" : "Hiện"}
                      </button>

                      <button
                        onClick={() => deleteShippingZone(zone)}
                        className="rounded-xl bg-red-50 px-4 py-3 text-xs font-black text-red-600"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-[32px] bg-white p-6 shadow-xl shadow-neutral-950/5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#06113C]">
                  Khuyến mãi giao hàng
                </h2>
                <p className="mt-1 text-sm font-semibold text-neutral-500">
                  Tự động áp dụng giống Grab khi khách đủ điều kiện.
                </p>
              </div>

              <button
                onClick={startCreatePromotion}
                className="rounded-2xl bg-[#06113C] px-5 py-3 text-sm font-black text-white"
              >
                + Thêm khuyến mãi
              </button>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-[28px] bg-[#F5FFF8] p-5">
                <p className="font-black text-[#00B14F]">
                  {editingPromotion ? "Sửa khuyến mãi" : "Thêm khuyến mãi"}
                </p>

                <div className="mt-4 space-y-3">
                  <input
                    value={promotionForm.name}
                    onChange={(e) =>
                      setPromotionForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Tên: Freeship nội thành"
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-4 font-bold outline-none"
                  />

                  <select
                    value={promotionForm.promotion_type}
                    onChange={(e) =>
                      setPromotionForm((prev) => ({
                        ...prev,
                        promotion_type: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-4 font-bold outline-none"
                  >
                    <option value="free_ship">Freeship</option>
                    <option value="half_ship">Giảm % phí ship</option>
                    <option value="fixed">Giảm tiền phí ship</option>
                  </select>

                  <input
                    type="number"
                    value={promotionForm.min_order_value}
                    onChange={(e) =>
                      setPromotionForm((prev) => ({
                        ...prev,
                        min_order_value: Number(e.target.value),
                      }))
                    }
                    placeholder="Đơn tối thiểu"
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-4 font-bold outline-none"
                  />

                  <input
                    type="number"
                    value={promotionForm.max_distance_km}
                    onChange={(e) =>
                      setPromotionForm((prev) => ({
                        ...prev,
                        max_distance_km: Number(e.target.value),
                      }))
                    }
                    placeholder="Khoảng cách tối đa km"
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-4 font-bold outline-none"
                  />

                  <input
                    type="number"
                    value={promotionForm.discount_value}
                    onChange={(e) =>
                      setPromotionForm((prev) => ({
                        ...prev,
                        discount_value: Number(e.target.value),
                      }))
                    }
                    placeholder="Giá trị giảm"
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-4 font-bold outline-none"
                  />

                  <input
                    type="number"
                    value={promotionForm.sort_order}
                    onChange={(e) =>
                      setPromotionForm((prev) => ({
                        ...prev,
                        sort_order: Number(e.target.value),
                      }))
                    }
                    placeholder="Thứ tự"
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-4 font-bold outline-none"
                  />
                </div>

                <button
                  onClick={saveShippingPromotion}
                  className="mt-4 w-full rounded-2xl bg-[#00B14F] px-5 py-4 text-sm font-black text-white"
                >
                  {editingPromotion ? "Lưu sửa" : "Thêm khuyến mãi"}
                </button>
              </div>

              <div className="space-y-3">
                {shippingPromotions.map((promotion) => (
                  <div
                    key={promotion.id}
                    className="grid gap-3 rounded-[24px] border border-black/5 p-4 md:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-[#06113C]">
                          🎁 {promotion.name}
                        </p>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            promotion.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {promotion.is_active ? "Đang bật" : "Đang tắt"}
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-bold text-neutral-600">
                        Đơn từ{" "}
                        {promotion.min_order_value.toLocaleString("vi-VN")}đ ·
                        dưới {promotion.max_distance_km}km
                      </p>

                      <p className="mt-1 text-sm font-bold text-neutral-500">
                        Loại:{" "}
                        {promotion.promotion_type === "free_ship"
                          ? "Freeship"
                          : promotion.promotion_type === "half_ship"
                          ? `Giảm ${promotion.discount_value}% ship`
                          : `Giảm ${promotion.discount_value.toLocaleString(
                              "vi-VN"
                            )}đ ship`}
                      </p>
                    </div>

                    <div className="flex gap-2 md:flex-col">
                      <button
                        onClick={() => startEditPromotion(promotion)}
                        className="rounded-xl bg-[#06113C] px-4 py-3 text-xs font-black text-white"
                      >
                        Sửa
                      </button>

                      <button
                        onClick={() => toggleShippingPromotion(promotion)}
                        className="rounded-xl bg-[#E8FFF1] px-4 py-3 text-xs font-black text-[#00B14F]"
                      >
                        {promotion.is_active ? "Tắt" : "Bật"}
                      </button>

                      <button
                        onClick={() => deleteShippingPromotion(promotion)}
                        className="rounded-xl bg-red-50 px-4 py-3 text-xs font-black text-red-600"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}