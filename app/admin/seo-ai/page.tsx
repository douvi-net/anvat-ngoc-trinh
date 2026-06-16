"use client";

import { useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import PostEditor from "@/components/PostEditor";

type GeneratedImage = {
  url: string;
  alt: string;
  caption: string;
};

type Article = {
  title: string;
  slug: string;
  excerpt: string;
  seo_title: string;
  seo_description: string;
  focus_keyword: string;
  category: string;
  content: string;
  image_url: string;
  images: GeneratedImage[];
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
  image_url: "",
  images: [],
};

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function getWordCount(content: string) {
  const text = stripHtml(content);
  if (!text) return 0;
  return text.split(/\s+/).length;
}

function getSeoChecks(article: Article) {
  const keyword = article.focus_keyword.trim().toLowerCase();

  const checks = [
    { label: "Có tiêu đề bài viết", ok: article.title.trim().length >= 20, point: 10 },
    { label: "Có slug URL", ok: Boolean(article.slug.trim()), point: 8 },
    {
      label: "SEO title 20–60 ký tự",
      ok: article.seo_title.trim().length >= 20 && article.seo_title.trim().length <= 60,
      point: 12,
    },
    {
      label: "Meta description 80–155 ký tự",
      ok:
        article.seo_description.trim().length >= 80 &&
        article.seo_description.trim().length <= 155,
      point: 12,
    },
    { label: "Có focus keyword", ok: Boolean(keyword), point: 8 },
    {
      label: "Keyword có trong tiêu đề",
      ok: keyword ? article.title.toLowerCase().includes(keyword) : false,
      point: 8,
    },
    {
      label: "Keyword có trong meta",
      ok: keyword ? article.seo_description.toLowerCase().includes(keyword) : false,
      point: 8,
    },
    { label: "Bài viết trên 900 từ", ok: getWordCount(article.content) >= 900, point: 10 },
    {
      label: "Có ít nhất 2 thẻ H2",
      ok: (article.content.match(/<h2/gi) || []).length >= 2,
      point: 8,
    },
    {
      label: "Có FAQ cuối bài",
      ok:
        article.content.toLowerCase().includes("câu hỏi thường gặp") ||
        article.content.toLowerCase().includes("faq"),
      point: 6,
    },
    {
      label: "Có link đặt món",
      ok: article.content.includes("/dat-mon-nhanh"),
      point: 5,
    },
    {
      label: "Có đủ 3 ảnh",
      ok: article.images.length >= 3,
      point: 5,
    },
  ];

  const score = checks.reduce((total, item) => total + (item.ok ? item.point : 0), 0);

  return {
    score: Math.min(score, 100),
    checks,
  };
}

function imageFigure(image: GeneratedImage) {
  return `
<figure>
  <img src="${image.url}" alt="${image.alt}" loading="lazy" width="1200" height="800" />
  <figcaption>${image.caption}</figcaption>
</figure>
`;
}

function insertImagesIntoContent(content: string, images: GeneratedImage[]) {
  let html = content;

  if (images[1]) html = html.replace("{{IMAGE_1}}", imageFigure(images[1]));
  if (images[2]) html = html.replace("{{IMAGE_2}}", imageFigure(images[2]));

  return html.replaceAll("{{IMAGE_1}}", "").replaceAll("{{IMAGE_2}}", "");
}

export default function SeoAiPage() {
  const [keyword, setKeyword] = useState("");
  const [article, setArticle] = useState<Article>(emptyArticle);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const seoResult = getSeoChecks(article);

  async function generateOneImage(payload: {
    slug: string;
    name: string;
    prompt: string;
    alt: string;
    caption: string;
  }) {
    const res = await fetch("/api/admin/seo-ai/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(text || "API tạo ảnh không trả JSON");
    }

    if (!res.ok) {
      throw new Error(data.detail || data.error || "Tạo ảnh thất bại");
    }

    return data.image as GeneratedImage;
  }

  async function generateArticle() {
    if (!keyword.trim()) {
      setMessage("❌ Nhập từ khóa trước.");
      return;
    }

    try {
      setGenerating(true);
      setMessage("Đang tạo nội dung bài viết...");

      const res = await fetch("/api/admin/seo-ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keyword: keyword.trim(),
        }),
      });

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || "API không trả JSON");
      }

      if (!res.ok) {
        throw new Error(data.detail || data.error || "Tạo bài viết thất bại");
      }

      const aiArticle: Article = {
        ...emptyArticle,
        ...data.article,
        images: [],
        image_url: "",
      };

      setArticle(aiArticle);
      setMessage("Đang tạo 3 ảnh AI cho bài viết...");

      const imagePayloads = [
        {
          name: "featured",
          prompt: data.article.featured_image_prompt,
          alt: data.article.featured_alt || data.article.title,
          caption: data.article.featured_caption || data.article.excerpt,
        },
        {
          name: "inline-1",
          prompt: data.article.inline_image_1_prompt,
          alt: data.article.inline_image_1_alt || data.article.title,
          caption: data.article.inline_image_1_caption || "",
        },
        {
          name: "cta",
          prompt: data.article.cta_image_prompt,
          alt: data.article.cta_image_alt || data.article.title,
          caption: data.article.cta_image_caption || "",
        },
      ];

      const images: GeneratedImage[] = [];

      for (let i = 0; i < imagePayloads.length; i++) {
        setMessage(`Đang tạo ảnh ${i + 1}/3...`);

        const image = await generateOneImage({
          slug: data.article.slug,
          ...imagePayloads[i],
        });

        images.push(image);

        setArticle((prev) => ({
          ...prev,
          images: [...images],
          image_url: images[0]?.url || "",
        }));
      }

      const finalContent = insertImagesIntoContent(data.article.content, images);

      setArticle({
        ...aiArticle,
        content: finalContent,
        image_url: images[0]?.url || "",
        images,
      });

      setMessage("✅ AI đã tạo bài viết + 3 ảnh. Kiểm tra lại rồi lưu nháp.");
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
        image_url: article.image_url.trim(),
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
            Tạo bài viết SEO bằng AI, tạo 3 ảnh tự động rồi lưu vào bản nháp.
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

      {article.title && (
        <div className="mt-6 grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5">
            <p className="font-black text-[#00B14F]">SEO Score</p>

            <p
              className={`mt-2 text-5xl font-black ${
                seoResult.score >= 80
                  ? "text-green-600"
                  : seoResult.score >= 50
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {seoResult.score}/100
            </p>

            <div className="mt-4 space-y-2">
              {seoResult.checks.map((check) => (
                <div
                  key={check.label}
                  className="flex items-start gap-2 text-sm font-bold"
                >
                  <span>{check.ok ? "✅" : "⚠️"}</span>
                  <span className={check.ok ? "text-[#06113C]" : "text-neutral-500"}>
                    {check.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5">
            <p className="font-black text-[#00B14F]">Google Snippet Preview</p>

            <div className="mt-4 rounded-2xl border border-black/10 bg-white p-4">
              <p className="text-lg font-semibold text-[#1a0dab]">
                {article.seo_title || article.title || "SEO title"}
              </p>

              <p className="mt-1 text-sm text-[#006621]">
                anvatngoctrinh.vn › bai-viet › {article.slug || "slug-bai-viet"}
              </p>

              <p className="mt-2 text-sm leading-6 text-neutral-600">
                {article.seo_description ||
                  article.excerpt ||
                  "Meta description sẽ hiển thị tại đây."}
              </p>
            </div>
          </div>
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

            {article.images.length > 0 && (
              <div className="rounded-[28px] bg-[#F5FFF8] p-4">
                <p className="font-black text-[#00B14F]">
                  Ảnh AI đã tạo ({article.images.length}/3)
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {article.images.map((image, index) => (
                    <div
                      key={image.url}
                      className="overflow-hidden rounded-[24px] bg-white shadow-lg shadow-neutral-950/5"
                    >
                      <img
                        src={image.url}
                        alt={image.alt}
                        className="h-40 w-full object-cover"
                      />

                      <div className="p-3">
                        <p className="text-xs font-black text-[#06113C]">
                          {index === 0
                            ? "Ảnh đại diện"
                            : index === 2
                            ? "Ảnh CTA"
                            : "Ảnh trong bài"}
                        </p>

                        <p className="mt-1 line-clamp-2 text-xs font-semibold text-neutral-500">
                          {image.alt}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}