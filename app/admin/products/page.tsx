"use client";

import { useEffect, useRef, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string | null;
  badge: string | null;
  is_active: boolean;
  is_sold_out: boolean;
  sort_order: number;
  category: string | null;
};

type ProductForm = {
  name: string;
  slug: string;
  description: string;
  price: number;
  image_url: string;
  badge: string;
  sort_order: number;
  category: string;
};

type MediaItem = {
  name: string;
  url: string;
};

const emptyForm: ProductForm = {
  name: "",
  slug: "",
  description: "",
  price: 0,
  image_url: "",
  badge: "MÓN NGON",
  sort_order: 99,
  category: "Món ngon",
};

const BUCKET_NAME = "product-images";
const PRODUCT_FOLDER = "products";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  function makeSlug(text: string) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  async function fetchProducts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select(
        "id,name,slug,description,price,image_url,badge,category,is_active,is_sold_out,sort_order"
      )
      .order("sort_order", { ascending: true });

    if (error) {
      alert("Không tải được sản phẩm.");
      console.error(error);
    } else {
      setProducts((data || []) as Product[]);
    }

    setLoading(false);
  }

  function resetFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function startCreate() {
    setEditingProduct(null);
    setForm(emptyForm);
    resetFileInput();
  }

  function startEdit(product: Product) {
    setEditingProduct(product);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      price: Number(product.price),
      image_url: product.image_url || "",
      badge: product.badge || "MÓN NGON",
      sort_order: Number(product.sort_order || 99),
      category: product.category || "Món ngon",
    });

    resetFileInput();
  }

  async function uploadImage(file: File) {
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
      const filePath = `${PRODUCT_FOLDER}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (error) {
        console.error("UPLOAD PRODUCT IMAGE ERROR:", error);
        alert(JSON.stringify(error, null, 2));
        return;
      }

      const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      setForm((prev) => ({
        ...prev,
        image_url: data.publicUrl,
      }));
    } catch (error) {
      console.error(error);
      alert("Upload ảnh thất bại.");
    } finally {
      setUploading(false);
    }
  }

  async function fetchMediaLibrary() {
    setMediaOpen(true);
    setMediaLoading(true);

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(PRODUCT_FOLDER, {
        limit: 100,
        sortBy: {
          column: "created_at",
          order: "desc",
        },
      });

    if (error) {
      console.error("LOAD PRODUCT MEDIA ERROR:", error);
      alert("Không tải được thư viện ảnh sản phẩm.");
      setMediaLoading(false);
      return;
    }

    const files =
      data
        ?.filter((file) => file.name && !file.name.startsWith("."))
        .map((file) => {
          const path = `${PRODUCT_FOLDER}/${file.name}`;

          const { data: publicUrl } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(path);

          return {
            name: file.name,
            url: publicUrl.publicUrl,
          };
        }) || [];

    setMediaItems(files);
    setMediaLoading(false);
  }

  function selectMediaImage(url: string) {
    setForm((prev) => ({
      ...prev,
      image_url: url,
    }));

    setMediaOpen(false);
    resetFileInput();
  }

  async function saveProduct() {
    if (!form.name.trim()) {
      alert("Nhập tên món trước nha.");
      return;
    }

    if (!form.price || Number(form.price) <= 0) {
      alert("Nhập giá món hợp lệ nha.");
      return;
    }

    if (uploading) {
      alert("Ảnh đang tải lên, đợi xong rồi lưu món nha.");
      return;
    }

    setSaving(true);

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || makeSlug(form.name),
      description: form.description.trim(),
      price: Number(form.price),
      image_url: form.image_url.trim() || "/images/hero.jpg",
      badge: form.badge.trim() || "MÓN NGON",
      sort_order: Number(form.sort_order || 99),
      updated_at: new Date().toISOString(),
      category: form.category.trim() || "Món ngon",
    };

    if (editingProduct) {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingProduct.id);

      setSaving(false);

      if (error) {
        alert("Sửa sản phẩm thất bại. Có thể slug bị trùng.");
        console.error(error);
        return;
      }

      alert("Đã sửa sản phẩm.");
      setEditingProduct(null);
      setForm(emptyForm);
      resetFileInput();
      fetchProducts();
      return;
    }

    const { error } = await supabase.from("products").insert({
      ...payload,
      is_active: true,
      is_sold_out: false,
    });

    setSaving(false);

    if (error) {
      alert("Thêm sản phẩm thất bại. Có thể slug bị trùng.");
      console.error(error);
      return;
    }

    alert("Đã thêm sản phẩm.");
    setForm(emptyForm);
    resetFileInput();
    fetchProducts();
  }

  async function toggleProduct(product: Product) {
    const { error } = await supabase
      .from("products")
      .update({
        is_active: !product.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id);

    if (error) {
      alert("Không đổi được trạng thái món.");
      console.error(error);
      return;
    }

    fetchProducts();
  }

  async function toggleSoldOut(product: Product) {
    const { error } = await supabase
      .from("products")
      .update({
        is_sold_out: !product.is_sold_out,
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id);

    if (error) {
      alert("Không đổi được trạng thái hết món.");
      console.error(error);
      return;
    }

    fetchProducts();
  }

  async function deleteProduct(product: Product) {
    const ok = confirm(
      `Xóa món "${product.name}"?\n\nNếu món đã từng có trong đơn, nên ẩn món thay vì xóa.`
    );

    if (!ok) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (error) {
      alert("Không xóa được món. Nên ẩn món nếu đã từng bán.");
      console.error(error);
      return;
    }

    fetchProducts();
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-black text-[#00B14F]">Admin/POS</p>

          <h1 className="mt-1 text-4xl font-black text-[#06113C]">
            Quản lý sản phẩm
          </h1>

          <p className="mt-2 text-sm font-semibold text-neutral-500">
            Thêm món, sửa giá, upload ảnh, chọn ảnh cũ, ẩn/hiện món và đánh dấu
            tạm hết.
          </p>
        </div>

        <button
          onClick={startCreate}
          className="rounded-2xl bg-[#00B14F] px-5 py-4 text-sm font-black text-white shadow-lg shadow-[#00B14F]/25"
        >
          + Thêm sản phẩm
        </button>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.2fr]">
        <div className="h-fit rounded-[32px] bg-white p-5 shadow-xl shadow-neutral-950/5 xl:sticky xl:top-8">
          <p className="font-black text-[#00B14F]">
            {editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm"}
          </p>

          <h2 className="mt-2 text-2xl font-black text-[#06113C]">
            Thông tin món
          </h2>

          <div className="mt-6 space-y-4">
            <input
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;

                setForm((prev) => ({
                  ...prev,
                  name,
                  slug: editingProduct ? prev.slug : makeSlug(name),
                }));
              }}
              placeholder="Tên món"
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
            />

            <input
              value={form.slug}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  slug: e.target.value,
                }))
              }
              placeholder="Slug"
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
              placeholder="Mô tả món"
              rows={3}
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
            />

            <input
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  price: Number(e.target.value),
                }))
              }
              placeholder="Giá"
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
            />

            <div className="rounded-2xl border border-dashed border-[#00B14F]/40 bg-[#F5FFF8] p-4">
              <p className="text-sm font-black text-[#06113C]">
                Hình ảnh sản phẩm
              </p>

              <p className="mt-1 text-xs font-bold text-neutral-500">
                Upload ảnh mới hoặc chọn ảnh đã upload trước đó.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadImage(file);
                }}
                className="mt-4 w-full cursor-pointer rounded-2xl bg-white p-3 text-sm font-bold text-[#06113C]"
              />

              <button
                type="button"
                onClick={fetchMediaLibrary}
                className="mt-3 w-full rounded-2xl bg-[#06113C] px-4 py-3 text-sm font-black text-white"
              >
                Chọn ảnh đã upload
              </button>

              {uploading && (
                <p className="mt-3 text-sm font-black text-[#00B14F]">
                  Đang upload ảnh...
                </p>
              )}

              {form.image_url && (
                <div className="mt-4 overflow-hidden rounded-[24px] border border-black/10 bg-white">
                  <img
                    src={form.image_url}
                    alt="Preview"
                    className="h-44 w-full object-cover"
                  />

                  <div className="flex items-center justify-between gap-3 p-3">
                    <p className="line-clamp-1 text-xs font-bold text-neutral-500">
                      Ảnh sản phẩm đã sẵn sàng
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          image_url: "",
                        }));
                        resetFileInput();
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
              value={form.badge}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  badge: e.target.value,
                }))
              }
              placeholder="Badge: HOT, BEST SELLER..."
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
            />
<input
  value={form.category}
  onChange={(e) =>
    setForm((prev) => ({
      ...prev,
      category: e.target.value,
    }))
  }
  placeholder="Danh mục: Bánh tráng, Trà sữa, Món hot..."
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
              placeholder="Thứ tự hiển thị"
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={saveProduct}
              disabled={saving || uploading}
              className="rounded-2xl bg-[#00B14F] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
            >
              {uploading
                ? "Đang upload..."
                : saving
                ? "Đang lưu..."
                : editingProduct
                ? "Lưu sửa"
                : "Thêm món"}
            </button>

            <button
              onClick={startCreate}
              className="rounded-2xl bg-neutral-100 px-5 py-4 text-sm font-black text-[#06113C]"
            >
              Làm mới
            </button>
          </div>

          {editingProduct && (
            <div className="mt-4 rounded-[24px] bg-[#F5FFF8] p-4 text-sm font-bold text-neutral-500">
              Đang sửa:{" "}
              <span className="font-black text-[#06113C]">
                {editingProduct.name}
              </span>
            </div>
          )}
        </div>

        <div className="rounded-[32px] bg-white p-4 shadow-xl shadow-neutral-950/5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-[#06113C]">
                Danh sách món
              </h2>

              <p className="mt-1 text-sm font-semibold text-neutral-500">
                Tổng: {products.length} món
              </p>
            </div>

            <button
              onClick={fetchProducts}
              className="rounded-2xl bg-[#06113C] px-5 py-3 text-sm font-black text-white"
            >
              Làm mới
            </button>
          </div>

          {loading ? (
            <p className="mt-8 font-black text-[#06113C]">Đang tải...</p>
          ) : (
            <div className="mt-6 space-y-4">
              {products.length === 0 ? (
                <div className="rounded-[28px] bg-[#F5FFF8] p-6 text-sm font-bold text-neutral-500">
                  Chưa có sản phẩm nào.
                </div>
              ) : (
                products.map((product) => (
                  <div
                    key={product.id}
                    className={`grid gap-4 rounded-[28px] border border-black/5 p-4 md:grid-cols-[90px_1fr_auto] ${
                      !product.is_active
                        ? "bg-neutral-50 opacity-70"
                        : product.is_sold_out
                        ? "bg-orange-50"
                        : "bg-white"
                    }`}
                  >
                    <div className="h-24 w-24 overflow-hidden rounded-2xl bg-[#E8FFF1]">
                      <img
                        src={product.image_url || "/images/hero.jpg"}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black text-[#06113C]">
                          {product.name}
                        </h3>

                        <span className="rounded-full bg-[#E8FFF1] px-3 py-1 text-[11px] font-black text-[#00B14F]">
                          {product.badge || "MÓN NGON"}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-black ${
                            product.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {product.is_active ? "Đang bán" : "Đang ẩn"}
                        </span>

                        {product.is_sold_out && (
                          <span className="rounded-full bg-orange-100 px-3 py-1 text-[11px] font-black text-orange-700">
                            Tạm hết
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm font-semibold leading-6 text-neutral-600">
                        {product.description}
                      </p>

                      <p className="mt-2 text-xl font-black text-[#00B14F]">
                        {product.price.toLocaleString("vi-VN")}đ
                      </p>

                      <p className="mt-1 text-xs font-bold text-neutral-400">
                        Slug: {product.slug} · Thứ tự: {product.sort_order}
                      </p>
                    </div>

                    <div className="flex flex-row flex-wrap gap-2 md:flex-col md:flex-nowrap">
                      <button
                        onClick={() => startEdit(product)}
                        className="rounded-xl bg-[#06113C] px-4 py-3 text-xs font-black text-white"
                      >
                        Sửa
                      </button>

                      <button
                        onClick={() => toggleSoldOut(product)}
                        className="rounded-xl bg-orange-50 px-4 py-3 text-xs font-black text-orange-700"
                      >
                        {product.is_sold_out ? "Còn món" : "Hết món"}
                      </button>

                      <button
                        onClick={() => toggleProduct(product)}
                        className="rounded-xl bg-[#E8FFF1] px-4 py-3 text-xs font-black text-[#00B14F]"
                      >
                        {product.is_active ? "Ẩn món" : "Hiện lại"}
                      </button>

                      <button
                        onClick={() => deleteProduct(product)}
                        className="rounded-xl bg-red-50 px-4 py-3 text-xs font-black text-red-600"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {mediaOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-5xl overflow-y-auto rounded-[32px] bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-black text-[#00B14F]">Media Library</p>
                <h2 className="mt-1 text-2xl font-black text-[#06113C]">
                  Chọn ảnh sản phẩm
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setMediaOpen(false)}
                className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-600"
              >
                Đóng
              </button>
            </div>

            {mediaLoading ? (
              <p className="mt-6 font-black text-[#06113C]">Đang tải ảnh...</p>
            ) : mediaItems.length === 0 ? (
              <div className="mt-6 rounded-[24px] bg-[#F5FFF8] p-6 text-sm font-bold text-neutral-500">
                Chưa có ảnh sản phẩm nào trong thư viện.
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                {mediaItems.map((item) => (
                  <button
                    key={item.url}
                    type="button"
                    onClick={() => selectMediaImage(item.url)}
                    className="overflow-hidden rounded-[24px] border border-black/10 bg-white text-left shadow-lg shadow-neutral-950/5 transition hover:scale-[1.02]"
                  >
                    <img
                      src={item.url}
                      alt={item.name}
                      className="h-36 w-full object-cover"
                    />

                    <div className="p-3">
                      <p className="line-clamp-1 text-xs font-bold text-neutral-500">
                        {item.name}
                      </p>

                      <p className="mt-1 text-xs font-black text-[#00B14F]">
                        Chọn ảnh này
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}