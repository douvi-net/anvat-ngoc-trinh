"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      alert("Sai tài khoản hoặc mật khẩu.");
      return;
    }

    window.location.href = "/admin";
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5FFF8] px-4">
      <div className="w-full max-w-md rounded-[36px] bg-white p-8 shadow-2xl shadow-black/10">
        <div className="text-center">
          <p className="text-sm font-black uppercase text-[#00B14F]">
            Ăn Vặt Ngọc Trinh
          </p>

          <h1 className="mt-2 text-4xl font-black text-[#06113C]">
            Đăng nhập POS
          </h1>

          <p className="mt-3 text-sm font-semibold text-neutral-500">
            Chỉ nhân viên/quản lý quán mới được truy cập khu vực này.
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Tài khoản"
            className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Mật khẩu"
            className="w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
          />

          <button
            disabled={loading}
            className="w-full rounded-2xl bg-[#00B14F] px-5 py-4 font-black text-white shadow-xl shadow-[#00B14F]/25 disabled:opacity-60"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </main>
  );
}