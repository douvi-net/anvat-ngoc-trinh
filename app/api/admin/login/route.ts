import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  SESSION_TTL_SECONDS,
} from "@/lib/adminSession";

export async function POST(request: Request) {
  const body = await request.json();

  const username = String(body.username || "");
  const password = String(body.password || "");

  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return NextResponse.json(
      { message: "Sai tài khoản hoặc mật khẩu." },
      { status: 401 }
    );
  }

  const token = await createAdminSessionToken();
  const response = NextResponse.json({
    message: "Đăng nhập thành công.",
  });

  response.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  return response;
}
