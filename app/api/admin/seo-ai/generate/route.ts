import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SITE_URL = "https://anvatngoctrinh.vn";
const POST_BUCKET = "post-images";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openAiKey = process.env.OPENAI_API_KEY;

function makeSlug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Thiếu Supabase env");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

function imageFigure(image: {
  url: string;
  alt: string;
  caption: string;
}) {
  return `
<figure>
  <img src="${image.url}" alt="${image.alt}" loading="lazy" width="1200" height="800" />
  <figcaption>${image.caption}</figcaption>
</figure>
`;
}

function insertImagesIntoContent(
  content: string,
  images: {
    url: string;
    alt: string;
    caption: string;
  }[]
) {
  let html = content;

  if (images[1]) {
    html = html.replace("{{IMAGE_1}}", imageFigure(images[1]));
  }

  if (images[2]) {
    html = html.replace("{{IMAGE_2}}", imageFigure(images[2]));
  }

  html = html.replaceAll("{{IMAGE_1}}", "");
  html = html.replaceAll("{{IMAGE_2}}", "");

  return html;
}

async function createArticle(keyword: string) {
  if (!openAiKey) {
    throw new Error("Thiếu OPENAI_API_KEY trong .env.local");
  }

  const prompt = `
Bạn là chuyên gia SEO Local cho quán ăn vặt.

Website: ${SITE_URL}
Thương hiệu: Ăn Vặt Ngọc Trinh
Khu vực chính: Quận 6, TP.HCM
Trang đặt món: ${SITE_URL}/dat-mon-nhanh

Từ khóa chính: ${keyword}

Yêu cầu bài viết:
- Bài dài 1200-1800 từ.
- Viết tự nhiên, không văn AI, không nói quá "số 1", "ngon nhất".
- SEO Local: nhắc Quận 6, TP.HCM, đặt món online, giao tận nơi.
- Có H2, H3, p, ul/li.
- Có CTA mềm giữa bài và CTA mạnh cuối bài.
- Chèn đúng 2 placeholder ảnh trong content:
  {{IMAGE_1}} sau H2 đầu tiên.
  {{IMAGE_2}} ở khoảng 70% bài viết.
- Không dùng markdown.
- Content phải là HTML hợp lệ.

Tạo 3 prompt ảnh AI:
1. featured_image_prompt: ảnh đại diện 1200x630.
2. inline_image_1_prompt: ảnh chèn trong bài sau H2 đầu.
3. inline_image_2_prompt: ảnh chèn gần cuối bài.

Ảnh phải theo phong cách food photography chân thực, ánh sáng đẹp, không chữ, không watermark, không logo giả.

Trả JSON hợp lệ:
{
  "title": "",
  "slug": "",
  "excerpt": "",
  "seo_title": "",
  "seo_description": "",
  "focus_keyword": "",
  "category": "",
  "content": "",
  "featured_alt": "",
  "featured_caption": "",
  "inline_image_1_alt": "",
  "inline_image_1_caption": "",
  "inline_image_2_alt": "",
  "inline_image_2_caption": "",
  "featured_image_prompt": "",
  "inline_image_1_prompt": "",
  "inline_image_2_prompt": ""
}
`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.65,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content:
            "Bạn chỉ trả JSON hợp lệ. Không markdown. Không giải thích thêm.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(JSON.stringify(data));
  }

  const raw = data.choices?.[0]?.message?.content;

  if (!raw) {
    throw new Error("AI không trả nội dung bài viết");
  }

  const article = JSON.parse(raw);

  article.slug = article.slug
    ? makeSlug(article.slug)
    : makeSlug(article.title || keyword);

  article.focus_keyword = article.focus_keyword || keyword;
  article.category = article.category || "Ăn vặt Quận 6";

  return article;
}

async function generateImageBase64(prompt: string) {
  if (!openAiKey) {
    throw new Error("Thiếu OPENAI_API_KEY");
  }

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size: "1536x1024",
      quality: "medium",
      n: 1,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(JSON.stringify(data));
  }

  const b64 = data.data?.[0]?.b64_json;

  if (!b64) {
    throw new Error("OpenAI không trả ảnh base64");
  }

  return b64;
}

async function uploadImageToSupabase(params: {
  slug: string;
  name: string;
  base64: string;
}) {
  const supabase = getSupabaseAdmin();
  const buffer = Buffer.from(params.base64, "base64");
  const filePath = `posts/${params.slug}-${params.name}.png`;

  const { error } = await supabase.storage
    .from(POST_BUCKET)
    .upload(filePath, buffer, {
      contentType: "image/png",
      cacheControl: "31536000",
      upsert: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(POST_BUCKET).getPublicUrl(filePath);

  return data.publicUrl;
}

export async function POST(req: NextRequest) {
  try {
    const { keyword } = await req.json();

    if (!keyword || typeof keyword !== "string") {
      return NextResponse.json({ error: "Thiếu từ khóa" }, { status: 400 });
    }

    const article = await createArticle(keyword.trim());

    const imagePrompts = [
      {
        name: "featured",
        prompt: article.featured_image_prompt,
        alt: article.featured_alt || article.title,
        caption: article.featured_caption || article.excerpt,
      },
      {
        name: "inline-1",
        prompt: article.inline_image_1_prompt,
        alt: article.inline_image_1_alt || article.title,
        caption: article.inline_image_1_caption || "",
      },
      {
        name: "inline-2",
        prompt: article.inline_image_2_prompt,
        alt: article.inline_image_2_alt || article.title,
        caption: article.inline_image_2_caption || "",
      },
    ];

    const uploadedImages = [];

    for (const item of imagePrompts) {
      const base64 = await generateImageBase64(item.prompt);
      const url = await uploadImageToSupabase({
        slug: article.slug,
        name: item.name,
        base64,
      });

      uploadedImages.push({
        url,
        alt: item.alt,
        caption: item.caption,
      });
    }

    const finalContent = insertImagesIntoContent(
      article.content,
      uploadedImages
    );

    return NextResponse.json({
      article: {
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        seo_title: article.seo_title,
        seo_description: article.seo_description,
        focus_keyword: article.focus_keyword,
        category: article.category,
        content: finalContent,
        image_url: uploadedImages[0]?.url || "",
        images: uploadedImages,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Tạo bài viết AI thất bại",
        detail: String(error),
      },
      { status: 500 }
    );
  }
}