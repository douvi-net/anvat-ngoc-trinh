"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const DISMISS_KEY = "avnt_install_prompt_dismissed_at";
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

function isStandaloneMode() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

export default function InstallAppPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandaloneMode()) return;

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    const canShowAgain = !dismissedAt || Date.now() - dismissedAt > SEVEN_DAYS;

    if (!canShowAgain) return;

    const timer = window.setTimeout(() => {
      setVisible(true);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-[86px] z-[1200] px-4 md:bottom-6">
      <div className="mx-auto max-w-md rounded-[28px] border border-[#00B14F]/20 bg-white p-4 shadow-2xl shadow-black/20">
        <div className="flex gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8FFF1] text-2xl">
            📲
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-black text-[#06113C]">
              Cài app Ăn Vặt Ngọc Trinh
            </p>

            <p className="mt-1 text-sm font-bold leading-6 text-neutral-500">
              Thêm website vào màn hình chính để đặt món nhanh hơn, theo dõi đơn
              và tích xu đổi quà tiện hơn.
            </p>

            <div className="mt-4 flex gap-2">
              <Link
                href="/huong-dan-cai-app"
                onClick={dismiss}
                className="flex-1 rounded-2xl bg-[#00B14F] px-4 py-3 text-center text-sm font-black text-white"
              >
                Cài ngay
              </Link>

              <button
                type="button"
                onClick={dismiss}
                className="rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-black text-[#06113C]"
              >
                Để sau
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}