import { NextRequest, NextResponse } from "next/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://anvatngoctrinh.vn";
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "";

export async function POST(req: NextRequest) {
  try {
    if (!INDEXNOW_KEY) {
      return NextResponse.json(
        { error: "Thiếu INDEXNOW_KEY trong .env" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const urls: string[] = body.urls || [];

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "Thiếu danh sách URL cần ping" },
        { status: 400 }
      );
    }

    const cleanUrls = urls
      .filter((url) => typeof url === "string")
      .filter((url) => url.startsWith(SITE_URL));

    if (cleanUrls.length === 0) {
      return NextResponse.json(
        { error: "Không có URL hợp lệ" },
        { status: 400 }
      );
    }

    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        host: "anvatngoctrinh.vn",
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: cleanUrls,
      }),
    });

    return NextResponse.json({
      success: res.ok,
      status: res.status,
      urls: cleanUrls,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Lỗi ping IndexNow", detail: String(error) },
      { status: 500 }
    );
  }
}