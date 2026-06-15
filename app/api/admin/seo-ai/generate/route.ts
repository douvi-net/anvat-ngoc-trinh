import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const SITE_URL = "https://anvatngoctrinh.vn";
const POST_BUCKET = "post-images";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openAiKey = process.env.OPENAI_API_KEY;

type UploadedImage = {
  url: string;
  alt: string;
  caption: string;
};

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

function imageFigure(image: UploadedImage) {
  return `
<figure>
  <img src="${image.url}" alt="${image.alt}" loading="lazy" width="1200" height="800" />
  <figcaption>${image.caption}</figcaption>
</figure>
`;
}

function insertImagesIntoContent(content: string, images: UploadedImage[]) {
  let html = content;

  if (images[1]) html = html.replace("{{IMAGE_1}}", imageFigure(images[1]));
  if (images[2]) html = html.replace("{{IMAGE_2}}", imageFigure(images[2]));
  if (images[3]) html = html.replace("{{IMAGE_3}}", imageFigure(images[3]));

  return html
    .replaceAll("{{IMAGE_1}}", "")
    .replaceAll("{{IMAGE_2}}", "")
    .replaceAll("{{IMAGE_3}}", "");
}

function buildPrompt(keyword: string) {
  return `
Bạn là chuyên gia SEO Local + Copywriter ngành F&B tại Việt Nam.

Bạn đang viết bài cho:
- Website: ${SITE_URL}
- Thương hiệu: Ăn Vặt Ngọc Trinh
- Khu vực chính: Quận 6, TP.HCM
- Trang đặt món: ${SITE_URL}/dat-mon-nhanh

Từ khóa chính: "${keyword}"

Mục tiêu bài viết:
- Kéo traffic Google từ khách có nhu cầu ăn vặt tại Quận 6.
- Làm người đọc muốn bấm đặt món.
- Nội dung phải giống người thật viết, không sáo rỗng, không văn AI.
- Không khẳng định "ngon nhất", "số 1", "rẻ nhất" nếu không có bằng chứng.

Yêu cầu SEO:
- Bài dài 1200–1600 từ.
- SEO title tối đa 60 ký tự.
- Meta description tối đa 155 ký tự.
- Slug tiếng Việt không dấu.
- Focus keyword xuất hiện tự nhiên trong title, meta, đoạn mở đầu, ít nhất 1 H2.
- Có 5–8 từ khóa liên quan rải tự nhiên: ăn vặt Quận 6, giao tận nơi, đặt món online, bánh tráng, trà sữa, trà trái cây, TP.HCM.
- Có internal link về /dat-mon-nhanh và /bai-viet.
- Có CTA mềm giữa bài và CTA mạnh cuối bài.

Cấu trúc HTML bắt buộc:
- Không dùng markdown.
- Chỉ dùng HTML hợp lệ: h2, h3, p, ul, li, strong, a.
- Không dùng h1 trong content.
- Đoạn văn ngắn, dễ đọc trên mobile.
- Chèn đúng 3 placeholder ảnh trong content:
  {{IMAGE_1}} sau H2 đầu tiên.
  {{IMAGE_2}} khoảng giữa bài.
  {{IMAGE_3}} gần CTA cuối bài.
- Có mục FAQ cuối bài với 5 câu hỏi, dùng h2 và h3.

Yêu cầu hình ảnh:
Tạo 4 prompt ảnh AI đúng với món/ngữ cảnh của từ khóa:
1. featured_image_prompt: ảnh đại diện, tập trung vào món chính hoặc chủ đề chính.
2. inline_image_1_prompt: cận cảnh món/nguyên liệu/quy trình làm món.
3. inline_image_2_prompt: bối cảnh ăn vặt/quán/takeaway phù hợp bài.
4. cta_image_prompt: ảnh đặt món/giao hàng/takeaway gần cuối bài.

Ảnh phải:
- Đúng món ăn vặt Việt Nam theo từ khóa.
- Realistic food photography.
- Ánh sáng tự nhiên hoặc commercial food photography.
- Không chữ, không watermark, không logo giả, không người nổi tiếng.
- Không tạo món Tây nếu từ khóa là món Việt.
- Nếu từ khóa là trà/trà sữa thì ảnh phải là ly nước rõ topping, đá, trái cây phù hợp.
- Nếu từ khóa là bánh tráng/cuốn thì ảnh phải là bánh tráng Việt Nam, topping Việt Nam, nước chấm phù hợp.

Trả về JSON hợp lệ, không markdown:
{
  "title": "",
  "slug": "",
  "excerpt": "",
  "seo_title": "",
  "seo_description": "",
  "focus_keyword": "",
  "related_keywords": [],
  "category": "",
  "content": "",
  "featured_alt": "",
  "featured_caption": "",
  "inline_image_1_alt": "",
  "inline_image_1_caption": "",
  "inline_image_2_alt": "",
  "inline_image_2_caption": "",
  "cta_image_alt": "",
  "cta_image_caption": "",
  "featured_image_prompt": "",
  "inline_image_1_prompt": "",
  "inline_image_2_prompt": "",
  "cta_image_prompt": ""
}
`;
}

async function createArticle(keyword: string) {
  if (!openAiKey) {
    throw new Error("Thiếu OPENAI_API_KEY");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.55,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Bạn chỉ trả JSON hợp lệ. Không markdown. Không giải thích thêm.",
        },
        {
          role: "user",
          content: buildPrompt(keyword),
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

  const safePrompt = `
${prompt}

Style requirements:
realistic Vietnamese food photography, natural lighting, appetizing, high detail,
no text, no watermark, no fake logo, no distorted hands, no extra labels.
`;

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: safePrompt,
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
      {
        name: "cta",
        prompt: article.cta_image_prompt,
        alt: article.cta_image_alt || article.title,
        caption: article.cta_image_caption || "",
      },
    ];

    const uploadedImages: UploadedImage[] = [];

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
        related_keywords: article.related_keywords || [],
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