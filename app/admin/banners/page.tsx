"use client";

import { useEffect, useRef, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";

type Banner = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  button_text: string | null;
  button_link: string | null;
  is_active: boolean;
  sort_order: number;
};

const emptyForm = {
  title: "",
  description: "",
  image_url: "/images/banner-checkin.jpg",
  button_text: "Đặt món ngay",
  button_link: "/dat-mon-nhanh",
  sort_order: 99,
};

const BANNER_BUCKET = "banner-images";

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  async function fetchBanners() {
    setLoading(true);

    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      alert("Không tải được banner.");
      console.error(error);
    } else {
      setBanners((data || []) as Banner[]);
    }

    setLoading(false);
  }

  function startCreate() {
    setEditingBanner(null);
    setForm(emptyForm);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function startEdit(banner: Banner) {
    setEditingBanner(banner);
    setForm({
      title: banner.title,
      description: banner.description || "",
      image_url: banner.image_url || "/images/banner-checkin.jpg",
      button_text: banner.button_text || "Đặt món ngay",
      button_link: banner.button_link || "/dat-mon-nhanh",
      sort_order: Number(banner.sort_order || 99),
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function uploadBannerImage(file: File) {
    try {
      if (!file.type.startsWith("image/")) {
        alert("Vui lòng chọn đúng file hình ảnh.");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("Ảnh không nên quá 5MB.");
        return;
      }

      setUploading(true);

      const safeName = file.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9.]+/g, "-");

      const ext = safeName.split(".").pop() || "jpg";
      const filePath = `banners/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from(BANNER_BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (error) {
        console.error("UPLOAD BANNER ERROR:", error);
        alert(JSON.stringify(error, null, 2));
        return;
      }

      const { data } = supabase.storage
        .from(BANNER_BUCKET)
        .getPublicUrl(filePath);

      setForm((prev) => ({
        ...prev,
        image_url: data.publicUrl,
      }));
    } catch (error) {
      console.error(error);
      alert("Upload banner thất bại.");
    } finally {
      setUploading(false);
    }
  }

  async function saveBanner() {
    if (!form.title.trim()) {
      alert("Nhập tiêu đề banner trước nha.");
      return;
    }

    if (uploading) {
      alert("Banner đang upload, đợi xong rồi lưu nha.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      image_url: form.image_url.trim() || "/images/banner-checkin.jpg",
      button_text: form.button_text.trim() || "Xem ngay",
      button_link: form.button_link.trim() || "/dat-mon-nhanh",
      sort_order: Number(form.sort_order || 99),
    };

    if (editingBanner) {
      const { error } = await supabase
        .from("banners")
        .update(payload)
        .eq("id", editingBanner.id);

      if (error) {
        alert("Sửa banner thất bại.");
        console.error(error);
        return;
      }
    } else {
      const { error } = await supabase.from("banners").insert({
        ...payload,
        is_active: true,
      });

      if (error) {
        alert("Thêm banner thất bại.");
        console.error(error);
        return;
      }
    }

    setEditingBanner(null);
    setForm(emptyForm);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    fetchBanners();
  }

  async function toggleBanner(banner: Banner) {
    const { error } = await supabase
      .from("banners")
      .update({
        is_active: !banner.is_active,
      })
      .eq("id", banner.id);

    if (error) {
      alert("Không đổi được trạng thái banner.");
      console.error(error);
      return;
    }

    fetchBanners();
  }

  async function deleteBanner(banner: Banner) {
    const ok = confirm(`Xóa banner "${banner.title}"?`);
    if (!ok) return;

    const { error } = await supabase
      .from("banners")
      .delete()
      .eq("id", banner.id);

    if (error) {
      alert("Không xóa được banner.");
      console.error(error);
      return;
    }

    fetchBanners();
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-black text-[#00B14F]">Admin/POS</p>
          <h1 className="mt-1 text-4xl font-black text-[#06113C]">
            Banner khuyến mãi
          </h1>
          <p className="mt-2 text-sm font-semibold text-neutral-500">
            Quản lý banner hiển thị trên trang chủ và khu vực đặt món.
          </p>
        </div>

        <button
          onClick={startCreate}
          className="rounded-2xl bg-[#00B14F] px-5 py-4 text-sm font-black text-white shadow-lg shadow-[#00B14F]/25"
        >
          + Thêm banner
        </button>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="h-fit rounded-[32px] bg-white p-5 shadow-xl shadow-neutral-950/5 xl:sticky xl:top-8">
          <p className="font-black text-[#00B14F]">
            {editingBanner ? "Sửa banner" : "Thêm banner"}
          </p>

          <div className="mt-6 space-y-4">
            <input
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Tiêu đề banner"
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
            />

            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Mô tả ngắn"
              rows={3}
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
            />

            <div className="rounded-2xl border border-dashed border-[#00B14F]/40 bg-[#F5FFF8] p-4">
              <p className="font-black text-[#06113C]">Hình ảnh banner</p>

              <p className="mt-1 text-xs font-bold text-neutral-500">
                Chọn ảnh từ máy, hệ thống sẽ tự upload và lưu link banner.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadBannerImage(file);
                }}
                className="mt-4 w-full cursor-pointer rounded-2xl bg-white p-3 text-sm font-bold text-[#06113C]"
              />

              {uploading && (
                <p className="mt-3 text-sm font-black text-[#00B14F]">
                  Đang upload banner...
                </p>
              )}

              {form.image_url && (
                <div className="mt-4 overflow-hidden rounded-[24px] border border-black/10 bg-white">
                  <img
                    src={form.image_url}
                    alt="Banner Preview"
                    className="h-52 w-full object-cover"
                  />

                  <div className="flex items-center justify-between gap-3 p-3">
                    <p className="line-clamp-1 text-xs font-bold text-neutral-500">
                      Banner đã sẵn sàng
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          image_url: "",
                        }));

                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600"
                    >
                      Xóa ảnh
                    </button>
                  </div>
                </div>
              )}
            </div>

            <input
              value={form.button_text}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  button_text: e.target.value,
                }))
              }
              placeholder="Chữ nút"
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
            />

            <input
              value={form.button_link}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  button_link: e.target.value,
                }))
              }
              placeholder="/dat-mon-nhanh"
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
            />

            <input
              type="number"
              value={form.sort_order}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  sort_order: Number(e.target.value),
                }))
              }
              placeholder="Thứ tự"
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={saveBanner}
              disabled={uploading}
              className="rounded-2xl bg-[#00B14F] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
            >
              {uploading
                ? "Đang upload..."
                : editingBanner
                ? "Lưu sửa"
                : "Thêm banner"}
            </button>

            <button
              onClick={startCreate}
              className="rounded-2xl bg-neutral-100 px-5 py-4 text-sm font-black text-[#06113C]"
            >
              Làm mới
            </button>
          </div>
        </div>

        <div className="rounded-[32px] bg-white p-4 shadow-xl shadow-neutral-950/5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-[#06113C]">
                Danh sách banner
              </h2>
              <p className="mt-1 text-sm font-semibold text-neutral-500">
                Tổng: {banners.length} banner
              </p>
            </div>

            <button
              onClick={fetchBanners}
              className="rounded-2xl bg-[#06113C] px-5 py-3 text-sm font-black text-white"
            >
              Làm mới
            </button>
          </div>

          {loading ? (
            <p className="mt-8 font-black text-[#06113C]">Đang tải...</p>
          ) : (
            <div className="mt-6 space-y-4">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="grid gap-4 rounded-[28px] border border-black/5 p-4 md:grid-cols-[140px_1fr_auto]"
                >
                  <div className="h-24 overflow-hidden rounded-2xl bg-[#E8FFF1]">
                    <img
                      src={banner.image_url || "/images/banner-checkin.jpg"}
                      alt={banner.title}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-[#06113C]">
                        {banner.title}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-black ${
                          banner.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {banner.is_active ? "Đang bật" : "Đang tắt"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-neutral-600">
                      {banner.description}
                    </p>

                    <p className="mt-2 text-xs font-bold text-neutral-400">
                      Link: {banner.button_link} · Thứ tự: {banner.sort_order}
                    </p>
                  </div>

                  <div className="flex flex-row flex-wrap gap-2 md:flex-col">
                    <button
                      onClick={() => startEdit(banner)}
                      className="rounded-xl bg-[#06113C] px-4 py-3 text-xs font-black text-white"
                    >
                      Sửa
                    </button>

                    <button
                      onClick={() => toggleBanner(banner)}
                      className="rounded-xl bg-[#E8FFF1] px-4 py-3 text-xs font-black text-[#00B14F]"
                    >
                      {banner.is_active ? "Tắt" : "Bật"}
                    </button>

                    <button
                      onClick={() => deleteBanner(banner)}
                      className="rounded-xl bg-red-50 px-4 py-3 text-xs font-black text-red-600"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}