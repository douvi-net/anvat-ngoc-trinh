import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SITE_URL = "https://anvatngoctrinh.vn";
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

function buildPrompt(keyword: string) {
  return `
Bạn là chuyên gia SEO Local + Copywriter ngành F&B tại Việt Nam.

Website: ${SITE_URL}
Thương hiệu: Ăn Vặt Ngọc Trinh
Khu vực chính: Quận 6, TP.HCM
Trang đặt món: ${SITE_URL}/dat-mon-nhanh

Từ khóa chính: "${keyword}"

Yêu cầu:
- Bài dài 1200–1600 từ.
- Viết tự nhiên, giống người thật, không văn AI.
- Không nói quá: "số 1", "ngon nhất", "rẻ nhất".
- Tối ưu SEO Local: Quận 6, TP.HCM, đặt món online, giao tận nơi.
- Có h2, h3, p, ul, li, strong, a.
- Không dùng h1 trong content.
- Chèn đúng 3 placeholder:
  {{IMAGE_1}} sau H2 đầu tiên.
  {{IMAGE_2}} khoảng giữa bài.
  {{IMAGE_3}} gần CTA cuối bài.
- Có CTA giữa bài và CTA cuối bài.
- Có FAQ 5 câu hỏi cuối bài.

Tạo 4 prompt ảnh:
1. featured_image_prompt: ảnh đại diện món/chủ đề chính.
2. inline_image_1_prompt: cận cảnh món/nguyên liệu/quy trình.
3. inline_image_2_prompt: bối cảnh ăn vặt/takeaway.
4. cta_image_prompt: đặt món/giao hàng/takeaway.

Ảnh phải đúng món ăn vặt Việt Nam, realistic food photography, không chữ, không watermark, không logo giả.

Trả JSON hợp lệ:
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

export async function POST(req: NextRequest) {
  try {
    const { keyword } = await req.json();

    if (!keyword || typeof keyword !== "string") {
      return NextResponse.json({ error: "Thiếu từ khóa" }, { status: 400 });
    }

    if (!openAiKey) {
      return NextResponse.json(
        { error: "Thiếu OPENAI_API_KEY" },
        { status: 500 }
      );
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
            content: buildPrompt(keyword.trim()),
          },
        ],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: "Lỗi OpenAI", detail: data },
        { status: 500 }
      );
    }

    const raw = data.choices?.[0]?.message?.content;

    if (!raw) {
      return NextResponse.json(
        { error: "AI không trả nội dung" },
        { status: 500 }
      );
    }

    const article = JSON.parse(raw);

    article.slug = article.slug
      ? makeSlug(article.slug)
      : makeSlug(article.title || keyword);

    article.focus_keyword = article.focus_keyword || keyword;
    article.category = article.category || "Ăn vặt Quận 6";

    return NextResponse.json({ article });
  } catch (error) {
    return NextResponse.json(
      { error: "Tạo bài viết thất bại", detail: String(error) },
      { status: 500 }
    );
  }
}