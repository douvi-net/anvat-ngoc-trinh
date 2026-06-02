"use client";

import { useEffect, useState } from "react";

export default function PromotionPopup({
  promotion,
}: {
  promotion: any;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const shown = localStorage.getItem("popup_today");

    const today = new Date().toDateString();

    if (shown !== today) {
      setOpen(true);
      localStorage.setItem("popup_today", today);
    }
  }, []);

  if (!open || !promotion) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4">
      <div className="max-w-md overflow-hidden rounded-[32px] bg-white">
        <img
          src={promotion.image_url}
          alt=""
          className="h-56 w-full object-cover"
        />

        <div className="p-5">
          <h2 className="text-2xl font-black">
            {promotion.title}
          </h2>

          <p className="mt-3 text-sm text-neutral-600">
            {promotion.description}
          </p>

          <a
            href={promotion.button_link}
            className="mt-5 block rounded-2xl bg-[#00B14F] px-5 py-4 text-center font-black text-white"
          >
            {promotion.button_text}
          </a>

          <button
            onClick={() => setOpen(false)}
            className="mt-3 w-full rounded-2xl bg-neutral-100 py-4 font-black"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}