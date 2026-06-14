import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function makeSlug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const { keyword } = await req.json();

    if (!keyword) {
      return NextResponse.json({ error: "Thiếu từ khóa" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Thiếu OPENAI_API_KEY trong .env.local" },
        { status: 500 }
      );
    }

    const prompt = `
Viết bài SEO tiếng Việt cho website Ăn Vặt Ngọc Trinh.

Từ khóa chính: ${keyword}

Yêu cầu:
- Title dưới 65 ký tự
- Meta description dưới 160 ký tự
- Nội dung HTML có h2, h3, p, ul/li
- Có CTA đặt món về /dat-mon-nhanh
- Không nói quá kiểu "số 1", "ngon nhất"
- Chỉ trả JSON hợp lệ

Format:
{
  "title": "",
  "slug": "",
  "excerpt": "",
  "seo_title": "",
  "seo_description": "",
  "focus_keyword": "",
  "category": "",
  "content": ""
}
`;

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: "Bạn chỉ trả JSON hợp lệ, không markdown.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: {
          type: "json_object",
        },
      }),
    });

    const aiData = await aiRes.json();

    if (!aiRes.ok) {
      return NextResponse.json(
        { error: "Lỗi gọi OpenAI", detail: aiData },
        { status: 500 }
      );
    }

    const raw = aiData.choices?.[0]?.message?.content;

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
      { error: "Lỗi server", detail: String(error) },
      { status: 500 }
    );
  }
}