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
        { error: "Thiếu OPENAI_API_KEY trong .env" },
        { status: 500 }
      );
    }

    const prompt = `
Viết bài SEO tiếng Việt cho website Ăn Vặt Ngọc Trinh.

Thông tin:
- Website: https://anvatngoctrinh.vn
- Khu vực chính: Quận 6, TP.HCM
- Trang đặt món: https://anvatngoctrinh.vn/dat-mon-nhanh
- Từ khóa chính: ${keyword}

Yêu cầu:
- Title hấp dẫn dưới 65 ký tự
- Meta description dưới 160 ký tự
- Slug tiếng Việt không dấu
- Nội dung HTML chuẩn SEO
- Có h2, h3, p, ul/li
- Giọng văn tự nhiên, gần gũi
- Không nói quá kiểu "ngon nhất", "số 1"
- Cuối bài có CTA đặt món
- Trả về JSON hợp lệ, không markdown

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
            content: "Bạn chỉ trả về JSON hợp lệ, không giải thích thêm.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const aiData = await aiRes.json();

    if (!aiRes.ok) {
      return NextResponse.json(
        { error: "Lỗi gọi AI", detail: aiData },
        { status: 500 }
      );
    }

    const raw = aiData.choices?.[0]?.message?.content || "";

    let article;

    try {
      article = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "AI trả về JSON lỗi", raw },
        { status: 500 }
      );
    }

    article.slug = article.slug ? makeSlug(article.slug) : makeSlug(article.title);

    return NextResponse.json({ article });
  } catch (error) {
    return NextResponse.json(
      { error: "Lỗi server", detail: String(error) },
      { status: 500 }
    );
  }
}