import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    message: "Đã đăng xuất.",
  });

  response.cookies.set("avnt_admin_auth", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}