import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  const username = body.username;
  const password = body.password;

  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return NextResponse.json(
      { message: "Sai tài khoản hoặc mật khẩu." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({
    message: "Đăng nhập thành công.",
  });

  response.cookies.set("avnt_admin_auth", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}