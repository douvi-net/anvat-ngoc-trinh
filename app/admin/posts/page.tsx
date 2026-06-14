"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import PostEditor from "@/components/PostEditor";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  category: string | null;
  image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  focus_keyword: string | null;
  featured: boolean | null;
  status: string;
  is_active: boolean;
  sort_order: number | null;
  published_at: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type MediaItem = {
  name: string;
  url: string;
};

type PostForm = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  image_url: string;
  seo_title: string;
  seo_description: string;
  focus_keyword: string;
  featured: boolean;
  status: string;
  sort_order: number;
};

const POST_BUCKET = "post-images";

const emptyForm: PostForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "Ăn vặt Quận 6",
  image_url: "",
  seo_title: "",
  seo_description: "",
  focus_keyword: "",
  featured: false,
  status: "draft",
  sort_order: 99,
};

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

function getSeoScore(form: PostForm) {
  let score = 0;

  if (form.title.trim().length >= 20) score += 15;
  if (form.slug.trim()) score += 10;
  if (form.excerpt.trim().length >= 80) score += 10;
  if (form.content.trim().length >= 600) score += 20;
  if (form.image_url.trim()) score += 10;
  if (form.seo_title.trim().length >= 20 && form.seo_title.trim().length <= 65)
    score += 15;
  if (
    form.seo_description.trim().length >= 80 &&
    form.seo_description.trim().length <= 170
  )
    score += 15;
  if (form.focus_keyword.trim()) score += 5;

  return Math.min(score, 100);
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [form, setForm] = useState<PostForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`❌ Không tải được bài viết: ${error.message}`);
    } else {
      setPosts((data || []) as Post[]);
    }

    setLoading(false);
  }

  function startCreate() {
    setEditingPost(null);
    setForm(emptyForm);
    setMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function startEdit(post: Post) {
    setEditingPost(post);
    setMessage("");

    setForm({
      title: post.title || "",
      slug: post.slug || "",
      excerpt: post.excerpt || "",
      content: post.content || "",
      category: post.category || "Ăn vặt Quận 6",
      image_url: post.image_url || "",
      seo_title: post.seo_title || "",
      seo_description: post.seo_description || "",
      focus_keyword: post.focus_keyword || "",
      featured: Boolean(post.featured),
      status: post.status || "draft",
      sort_order: Number(post.sort_order || 99),
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function pingIndexNow(urls: string[]) {
    try {
      await fetch("/api/indexnow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ urls }),
      });
    } catch {
      // Không chặn luồng lưu bài nếu ping lỗi.
    }
  }

  async function fetchMediaLibrary() {
    setMediaOpen(true);
    setMediaLoading(true);

    const { data, error } = await supabase.storage.from(POST_BUCKET).list("posts", {
      limit: 100,
      sortBy: {
        column: "created_at",
        order: "desc",
      },
    });

    if (error) {
      setMessage(`❌ Không tải được thư viện ảnh: ${error.message}`);
      setMediaLoading(false);
      return;
    }

    const files =
      data
        ?.filter((file) => file.name && !file.name.startsWith("."))
        .map((file) => {
          const path = `posts/${file.name}`;
          const { data: publicUrl } = supabase.storage
            .from(POST_BUCKET)
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

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function uploadPostImage(file: File) {
    try {
      if (!file.type.startsWith("image/")) {
        setMessage("❌ Vui lòng chọn file hình ảnh.");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setMessage("❌ Ảnh không nên quá 5MB.");
        return;
      }

      setUploading(true);
      setMessage("");

      const safeName = file.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9.]+/g, "-");

      const ext = safeName.split(".").pop() || "jpg";
      const filePath = `posts/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      const { error } = await supabase.storage.from(POST_BUCKET).upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

      if (error) {
        setMessage(`❌ Upload ảnh thất bại: ${error.message}`);
        return;
      }

      const { data } = supabase.storage.from(POST_BUCKET).getPublicUrl(filePath);

      setForm((prev) => ({
        ...prev,
        image_url: data.publicUrl,
      }));

      setMessage("✅ Upload ảnh thành công");
    } catch (error) {
      setMessage(`❌ Upload ảnh thất bại: ${String(error)}`);
    } finally {
      setUploading(false);
    }
  }

  async function savePost() {
    if (!form.title.trim()) {
      setMessage("❌ Nhập tiêu đề bài viết.");
      return;
    }

    if (uploading) {
      setMessage("❌ Ảnh đang upload, đợi xong rồi lưu bài.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const slug = form.slug.trim() || makeSlug(form.title);

      const payload = {
        title: form.title.trim(),
        slug,
        excerpt: form.excerpt.trim(),
        content: form.content.trim(),
        category: form.category.trim(),
        image_url: form.image_url.trim(),
        seo_title: form.seo_title.trim(),
        seo_description: form.seo_description.trim(),
        focus_keyword: form.focus_keyword.trim(),
        featured: form.featured,
        status: form.status,
        is_active: form.status === "published",
        sort_order: Number(form.sort_order || 99),
        published_at:
          form.status === "published"
            ? editingPost?.published_at || new Date().toISOString()
            : null,
        updated_at: new Date().toISOString(),
      };

      if (editingPost) {
        const { error } = await supabase
          .from("posts")
          .update(payload)
          .eq("id", editingPost.id);

        if (error) {
          setMessage(`❌ Sửa bài viết thất bại: ${error.message}`);
          return;
        }
      } else {
        const { error } = await supabase.from("posts").insert(payload);

        if (error) {
          setMessage(`❌ Thêm bài viết thất bại: ${error.message}`);
          return;
        }
      }

      if (payload.status === "published") {
        await pingIndexNow([
          `https://anvatngoctrinh.vn/bai-viet/${slug}`,
          "https://anvatngoctrinh.vn/bai-viet",
        ]);
      }

      setMessage("✅ Đã lưu bài viết thành công");
      setEditingPost(null);
      setForm(emptyForm);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      fetchPosts();
    } finally {
      setSaving(false);
    }
  }

  async function togglePost(post: Post) {
    const nextStatus = post.status === "published" ? "draft" : "published";

    const { error } = await supabase
      .from("posts")
      .update({
        status: nextStatus,
        is_active: nextStatus === "published",
        published_at:
          nextStatus === "published"
            ? post.published_at || new Date().toISOString()
            : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", post.id);

    if (error) {
      setMessage(`❌ Không đổi được trạng thái bài viết: ${error.message}`);
      return;
    }

    if (nextStatus === "published") {
      await pingIndexNow([
        `https://anvatngoctrinh.vn/bai-viet/${post.slug}`,
        "https://anvatngoctrinh.vn/bai-viet",
      ]);
    }

    setMessage(
      nextStatus === "published"
        ? "✅ Đã đăng bài và ping IndexNow"
        : "✅ Đã chuyển bài về nháp"
    );

    fetchPosts();
  }

  async function deletePost(post: Post) {
    const ok = confirm(`Xóa bài "${post.title}"?`);
    if (!ok) return;

    const { error } = await supabase.from("posts").delete().eq("id", post.id);

    if (error) {
      setMessage(`❌ Không xóa được bài viết: ${error.message}`);
      return;
    }

    setMessage("✅ Đã xóa bài viết");
    fetchPosts();
  }

  const filteredPosts = posts.filter((post) =>
    `${post.title} ${post.category} ${post.slug} ${post.focus_keyword || ""}`
      .toLowerCase()
      .includes(keyword.toLowerCase())
  );

  const publishedCount = posts.filter((p) => p.status === "published").length;
  const draftCount = posts.filter((p) => p.status !== "published").length;
  const featuredCount = posts.filter((p) => p.featured).length;
  const seoScore = getSeoScore(form);

  return (
    <AdminLayout>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-black text-[#00B14F]">Admin/POS</p>

          <h1 className="mt-1 text-4xl font-black text-[#06113C]">
            Quản lý bài viết
          </h1>

          <p className="mt-2 text-sm font-semibold text-neutral-500">
            Viết bài SEO, quản lý meta, ảnh đại diện, trạng thái đăng và hiển
            thị ngoài trang /bai-viet.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/bai-viet"
            target="_blank"
            className="rounded-2xl bg-[#06113C] px-5 py-4 text-sm font-black text-white shadow-lg"
          >
            Xem blog
          </Link>

          <button
            type="button"
            onClick={startCreate}
            className="rounded-2xl bg-[#00B14F] px-5 py-4 text-sm font-black text-white shadow-lg shadow-[#00B14F]/25"
          >
            + Thêm bài viết
          </button>
        </div>
      </div>

      {message && (
        <div className="mt-6 rounded-[24px] bg-white p-4 text-sm font-black text-[#06113C] shadow-lg shadow-neutral-950/5">
          {message}
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {[
          { label: "Tổng bài", value: posts.length, note: "Tất cả bài viết" },
          { label: "Đã đăng", value: publishedCount, note: "Hiển thị ngoài web" },
          { label: "Bản nháp", value: draftCount, note: "Chưa hiển thị" },
          { label: "Nổi bật", value: featuredCount, note: "Ưu tiên danh sách" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5"
          >
            <p className="text-sm font-black text-neutral-400">{item.label}</p>

            <p className="mt-2 text-3xl font-black text-[#06113C]">
              {item.value}
            </p>

            <p className="mt-2 text-xs font-bold text-neutral-400">{item.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.2fr]">
        <section className="h-fit rounded-[32px] bg-white p-5 shadow-xl shadow-neutral-950/5 xl:sticky xl:top-8">
          <div className="flex items-center justify-between gap-3">
            <p className="font-black text-[#00B14F]">
              {editingPost ? "Sửa bài viết" : "Thêm bài viết"}
            </p>

            <span
              className={`rounded-full px-3 py-1 text-xs font-black ${
                seoScore >= 80
                  ? "bg-green-100 text-green-700"
                  : seoScore >= 50
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              SEO {seoScore}/100
            </span>
          </div>

          <div className="mt-6 space-y-4">
            <input
              value={form.title}
              onChange={(e) => {
                const title = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  title,
                  slug: editingPost ? prev.slug : makeSlug(title),
                }));
              }}
              placeholder="Tiêu đề bài viết"
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
            />

            <input
              value={form.slug}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, slug: makeSlug(e.target.value) }))
              }
              placeholder="slug-bai-viet"
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
            />

            <input
              value={form.category}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, category: e.target.value }))
              }
              placeholder="Chủ đề"
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
            />

            <textarea
              value={form.excerpt}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, excerpt: e.target.value }))
              }
              placeholder="Mô tả ngắn"
              rows={3}
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
            />

<PostEditor
  value={form.content}
  onChange={(content) =>
    setForm((prev) => ({
      ...prev,
      content,
    }))
  }
/>

            <div className="rounded-2xl border border-[#00B14F]/20 bg-[#F5FFF8] p-4">
              <p className="font-black text-[#00B14F]">SEO</p>

              <div className="mt-4 space-y-3">
                <input
                  value={form.seo_title}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      seo_title: e.target.value,
                    }))
                  }
                  placeholder="SEO Title"
                  className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
                />

                <textarea
                  value={form.seo_description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      seo_description: e.target.value,
                    }))
                  }
                  placeholder="Meta Description"
                  rows={3}
                  className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
                />

                <input
                  value={form.focus_keyword}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      focus_keyword: e.target.value,
                    }))
                  }
                  placeholder="Focus Keyword"
                  className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
                />

                <label className="flex items-center gap-3 font-bold text-[#06113C]">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        featured: e.target.checked,
                      }))
                    }
                  />
                  Bài viết nổi bật
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-[#00B14F]/40 bg-[#F5FFF8] p-4">
              <p className="font-black text-[#06113C]">Ảnh đại diện bài viết</p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadPostImage(file);
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
                      Ảnh đã sẵn sàng
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, image_url: "" }));
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600"
                    >
                      Xóa ảnh
                    </button>
                  </div>
                </div>
              )}
            </div>

            <select
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, status: e.target.value }))
              }
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
            >
              <option value="draft">Bản nháp</option>
              <option value="published">Đã đăng</option>
            </select>

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
              type="button"
              onClick={savePost}
              disabled={uploading || saving}
              className="rounded-2xl bg-[#00B14F] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
            >
              {saving
                ? "Đang lưu..."
                : uploading
                ? "Đang upload..."
                : editingPost
                ? "Lưu sửa"
                : "Thêm bài"}
            </button>

            <button
              type="button"
              onClick={startCreate}
              className="rounded-2xl bg-neutral-100 px-5 py-4 text-sm font-black text-[#06113C]"
            >
              Làm mới
            </button>
          </div>
        </section>

        <section className="rounded-[32px] bg-white p-4 shadow-xl shadow-neutral-950/5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-[#06113C]">
                Danh sách bài viết
              </h2>

              <p className="mt-1 text-sm font-semibold text-neutral-500">
                Tổng: {filteredPosts.length} bài
              </p>
            </div>

            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm bài viết..."
              className="rounded-2xl border border-black/10 px-4 py-3 text-sm font-bold outline-none md:w-72"
            />
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <p className="font-black text-[#06113C]">Đang tải...</p>
            ) : filteredPosts.length === 0 ? (
              <div className="rounded-[28px] bg-[#F5FFF8] p-6 text-sm font-bold text-neutral-500">
                Chưa có bài viết nào.
              </div>
            ) : (
              filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="grid gap-4 rounded-[28px] border border-black/5 p-4 md:grid-cols-[110px_1fr_auto]"
                >
                  <div className="h-24 w-28 overflow-hidden rounded-2xl bg-[#E8FFF1]">
                    {post.image_url ? (
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl">
                        📝
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-[#06113C]">
                      {post.title}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm font-semibold text-neutral-600">
                      {post.excerpt || "Chưa có mô tả ngắn."}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#E8FFF1] px-3 py-1 text-xs font-black text-[#00B14F]">
                        {post.category || "Ăn vặt"}
                      </span>

                      {post.featured && (
                        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
                          Nổi bật
                        </span>
                      )}

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          post.status === "published"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {post.status === "published" ? "Đã đăng" : "Bản nháp"}
                      </span>

                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-500">
                        /bai-viet/{post.slug}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-row flex-wrap gap-2 md:flex-col">
                    {post.status === "published" && (
                      <Link
                        href={`/bai-viet/${post.slug}`}
                        target="_blank"
                        className="rounded-xl bg-neutral-100 px-4 py-3 text-center text-xs font-black text-[#06113C]"
                      >
                        Xem
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => startEdit(post)}
                      className="rounded-xl bg-[#06113C] px-4 py-3 text-xs font-black text-white"
                    >
                      Sửa
                    </button>

                    <button
                      type="button"
                      onClick={() => togglePost(post)}
                      className="rounded-xl bg-[#E8FFF1] px-4 py-3 text-xs font-black text-[#00B14F]"
                    >
                      {post.status === "published" ? "Ẩn" : "Đăng"}
                    </button>

                    <button
                      type="button"
                      onClick={() => deletePost(post)}
                      className="rounded-xl bg-red-50 px-4 py-3 text-xs font-black text-red-600"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {mediaOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-5xl overflow-y-auto rounded-[32px] bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-black text-[#00B14F]">Media Library</p>

                <h2 className="mt-1 text-2xl font-black text-[#06113C]">
                  Chọn ảnh đã upload
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
                Chưa có ảnh nào trong thư viện.
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