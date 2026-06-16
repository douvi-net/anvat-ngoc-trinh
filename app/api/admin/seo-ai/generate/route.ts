import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SITE_URL = "https://anvatngoctrinh.vn";
const openAiKey = process.env.OPENAI_API_KEY;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey);
}

async function getMenuContext() {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return "";

    const { data, error } = await supabase
      .from("products")
      .select("name,price")
      .eq("is_active", true)
      .limit(40);

    if (error || !data) return "";

    return data
      .map((item) => {
        const price =
          typeof item.price === "number"
            ? `${item.price.toLocaleString("vi-VN")}đ`
            : "";
        return `- ${item.name}${price ? `: ${price}` : ""}`;
      })
      .join("\n");
  } catch {
    return "";
  }
}

function buildPrompt(keyword: string, menuContext: string) {
  return `
Bạn là chuyên gia SEO Local + Copywriter ngành F&B tại Việt Nam.

Website: ${SITE_URL}
Thương hiệu: Ăn Vặt Ngọc Trinh
Khu vực chính: Quận 6, TP.HCM
Trang đặt món: ${SITE_URL}/dat-mon-nhanh
Trang bài viết: ${SITE_URL}/bai-viet

Từ khóa chính: "${keyword}"

Menu thật của quán, ưu tiên dùng nếu liên quan:
${menuContext || "- Chưa có dữ liệu menu."}

Mục tiêu:
- Viết bài SEO Local để kéo khách ở Quận 6.
- Đọc xong muốn bấm đặt món.
- Nội dung tự nhiên, không văn AI.
- Không nói quá: "số 1", "ngon nhất", "rẻ nhất".

Yêu cầu SEO:
- Bài dài 1200–1600 từ.
- SEO title tối đa 60 ký tự.
- Meta description tối đa 155 ký tự.
- Slug tiếng Việt không dấu.
- Focus keyword xuất hiện tự nhiên trong title, meta, đoạn mở đầu, ít nhất 1 H2.
- Có từ khóa liên quan: ăn vặt Quận 6, giao tận nơi, đặt món online, bánh tráng, trà sữa, trà trái cây, TP.HCM.
- Có link nội bộ:
  <a href="/dat-mon-nhanh">đặt món online</a>
  <a href="/bai-viet">bài viết ăn vặt</a>

Cấu trúc HTML:
- Không dùng markdown.
- Chỉ dùng HTML hợp lệ: h2, h3, p, ul, li, strong, a.
- Không dùng h1 trong content.
- Đoạn văn ngắn, dễ đọc trên mobile.
- Chèn đúng 2 placeholder ảnh trong content:
  {{IMAGE_1}} sau H2 đầu tiên.
  {{IMAGE_2}} gần CTA cuối bài.
- Có CTA giữa bài.
- Có CTA cuối bài dẫn về /dat-mon-nhanh.
- Cuối bài có FAQ 5 câu hỏi, dùng:
  <h2>Câu hỏi thường gặp</h2>
  <h3>Câu hỏi...</h3>
  <p>Trả lời...</p>

Ảnh AI mặc định 3 ảnh/bài:
1. featured_image_prompt: ảnh đại diện món/chủ đề chính.
2. inline_image_1_prompt: cận cảnh món/nguyên liệu/quy trình.
3. cta_image_prompt: ảnh đặt món/giao hàng/takeaway gần cuối bài.

Ảnh phải:
- Đúng món ăn vặt Việt Nam theo từ khóa.
- Realistic Vietnamese food photography.
- Không chữ, không watermark, không logo giả.
- Nếu từ khóa là trà/trà sữa thì ảnh là ly nước đúng topping/trái cây.
- Nếu từ khóa là bánh tráng/cuốn thì ảnh là bánh tráng Việt Nam, topping Việt Nam, nước chấm phù hợp.

Trả JSON hợp lệ, không markdown:
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
  "faq": [
    {"question": "", "answer": ""}
  ],
  "internal_links": [
    {"label": "Đặt món online", "url": "/dat-mon-nhanh"},
    {"label": "Bài viết ăn vặt", "url": "/bai-viet"}
  ],
  "featured_alt": "",
  "featured_caption": "",
  "inline_image_1_alt": "",
  "inline_image_1_caption": "",
  "cta_image_alt": "",
  "cta_image_caption": "",
  "featured_image_prompt": "",
  "inline_image_1_prompt": "",
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

    const menuContext = await getMenuContext();

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
            content: buildPrompt(keyword.trim(), menuContext),
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
    article.faq = Array.isArray(article.faq) ? article.faq.slice(0, 5) : [];
    article.internal_links = Array.isArray(article.internal_links)
      ? article.internal_links
      : [
          { label: "Đặt món online", url: "/dat-mon-nhanh" },
          { label: "Bài viết ăn vặt", url: "/bai-viet" },
        ];

    return NextResponse.json({ article });
  } catch (error) {
    return NextResponse.json(
      { error: "Tạo bài viết thất bại", detail: String(error) },
      { status: 500 }
    );
  }
}