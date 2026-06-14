"use client";

import { useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import PostEditor from "@/components/PostEditor";

type Article = {
  title: string;
  slug: string;
  excerpt: string;
  seo_title: string;
  seo_description: string;
  focus_keyword: string;
  category: string;
  content: string;
};

const emptyArticle: Article = {
  title: "",
  slug: "",
  excerpt: "",
  seo_title: "",
  seo_description: "",
  focus_keyword: "",
  category: "Ăn vặt Quận 6",
  content: "",
};

export default function SeoAiPage() {
  const [keyword, setKeyword] = useState("");
  const [article, setArticle] = useState<Article>(emptyArticle);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function generateArticle() {
    if (!keyword.trim()) {
      setMessage("❌ Nhập từ khóa trước.");
      return;
    }

    try {
      setGenerating(true);
      setMessage("");

      const res = await fetch("/api/admin/seo-ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keyword: keyword.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.error || "Tạo bài viết thất bại");
      }

      setArticle({
        ...emptyArticle,
        ...data.article,
      });

      setMessage("✅ AI đã tạo bài viết. Kiểm tra lại rồi lưu nháp.");
    } catch (error) {
      setMessage(`❌ ${String(error)}`);
    } finally {
      setGenerating(false);
    }
  }

  async function saveDraft() {
    if (!article.title.trim()) {
      setMessage("❌ Chưa có tiêu đề bài viết.");
      return;
    }

    if (!article.content.trim()) {
      setMessage("❌ Chưa có nội dung bài viết.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const { error } = await supabase.from("posts").insert({
        title: article.title.trim(),
        slug: article.slug.trim(),
        excerpt: article.excerpt.trim(),
        content: article.content.trim(),
        category: article.category.trim(),
        seo_title: article.seo_title.trim(),
        seo_description: article.seo_description.trim(),
        focus_keyword: article.focus_keyword.trim(),
        featured: false,
        status: "draft",
        is_active: false,
        sort_order: 99,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        throw new Error(error.message);
      }

      setMessage("✅ Đã lưu bài viết vào bản nháp.");
    } catch (error) {
      setMessage(`❌ ${String(error)}`);
    } finally {
      setSaving(false);
    }
  }

  function updateField(key: keyof Article, value: string) {
    setArticle((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-black text-[#00B14F]">SEO & CONTENT</p>

          <h1 className="mt-1 text-4xl font-black text-[#06113C]">
            AI Writer
          </h1>

          <p className="mt-2 text-sm font-semibold text-neutral-500">
            Tạo bài viết SEO bằng AI, chỉnh sửa lại nội dung rồi lưu vào bản
            nháp để đăng sau.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/posts"
            className="rounded-2xl bg-[#06113C] px-5 py-4 text-sm font-black text-white shadow-lg"
          >
            Quản lý bài viết
          </Link>

          <Link
            href="/bai-viet"
            target="_blank"
            className="rounded-2xl bg-[#00B14F] px-5 py-4 text-sm font-black text-white shadow-lg shadow-[#00B14F]/25"
          >
            Xem blog
          </Link>
        </div>
      </div>

      {message && (
        <div className="mt-6 rounded-[24px] bg-white p-4 text-sm font-black text-[#06113C] shadow-lg shadow-neutral-950/5">
          {message}
        </div>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="h-fit rounded-[32px] bg-white p-5 shadow-xl shadow-neutral-950/5 xl:sticky xl:top-8">
          <p className="font-black text-[#00B14F]">Tạo bài mới</p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-black text-[#06113C]">
                Từ khóa chính
              </label>

              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="VD: bánh tráng trộn quận 6"
                className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
              />
            </div>

            <button
              type="button"
              onClick={generateArticle}
              disabled={generating}
              className="w-full rounded-2xl bg-[#00B14F] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
            >
              {generating ? "AI đang viết..." : "Tạo bài viết bằng AI"}
            </button>
          </div>

          <div className="mt-6 rounded-[24px] bg-[#F5FFF8] p-4">
            <p className="font-black text-[#06113C]">Gợi ý từ khóa</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {[
                "ăn vặt quận 6",
                "bánh tráng trộn quận 6",
                "cuốn đỏ chấm me",
                "bánh tráng giao tận nơi quận 6",
                "trà đào quận 6",
              ].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setKeyword(item)}
                  className="rounded-full bg-white px-3 py-2 text-xs font-black text-[#00B14F]"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[32px] bg-white p-5 shadow-xl shadow-neutral-950/5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-black text-[#00B14F]">Bài viết nháp</p>

              <h2 className="mt-1 text-2xl font-black text-[#06113C]">
                Nội dung AI tạo
              </h2>
            </div>

            <button
              type="button"
              onClick={saveDraft}
              disabled={saving || !article.title}
              className="rounded-2xl bg-[#06113C] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : "Lưu vào bài viết nháp"}
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <input
              value={article.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Tiêu đề bài viết"
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
            />

            <input
              value={article.slug}
              onChange={(e) => updateField("slug", e.target.value)}
              placeholder="slug-bai-viet"
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
            />

            <input
              value={article.category}
              onChange={(e) => updateField("category", e.target.value)}
              placeholder="Danh mục"
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
            />

            <textarea
              value={article.excerpt}
              onChange={(e) => updateField("excerpt", e.target.value)}
              placeholder="Mô tả ngắn"
              rows={3}
              className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
            />

            <div className="rounded-2xl border border-[#00B14F]/20 bg-[#F5FFF8] p-4">
              <p className="font-black text-[#00B14F]">SEO</p>

              <div className="mt-4 space-y-3">
                <input
                  value={article.seo_title}
                  onChange={(e) => updateField("seo_title", e.target.value)}
                  placeholder="SEO Title"
                  className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
                />

                <textarea
                  value={article.seo_description}
                  onChange={(e) =>
                    updateField("seo_description", e.target.value)
                  }
                  placeholder="Meta Description"
                  rows={3}
                  className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
                />

                <input
                  value={article.focus_keyword}
                  onChange={(e) => updateField("focus_keyword", e.target.value)}
                  placeholder="Focus Keyword"
                  className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
                />
              </div>
            </div>

            <PostEditor
              value={article.content}
              onChange={(content) => updateField("content", content)}
            />
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}