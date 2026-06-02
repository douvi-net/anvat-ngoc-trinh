"use client";

import { useEffect, useState } from "react";

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  async function install() {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    await deferredPrompt.userChoice;

    setDeferredPrompt(null);
  }

  if (!deferredPrompt) return null;

  return (
    <button
      onClick={install}
      className="rounded-2xl bg-[#00B14F] px-4 py-3 text-sm font-black text-white shadow-lg"
    >
      📱 Cài ứng dụng
    </button>
  );
}