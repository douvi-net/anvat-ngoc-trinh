"use client";

import { useEffect, useState } from "react";

const orders = [
  "🛵 Khách ở Quận 6 vừa đặt Cuốn đỏ mỡ hành",
  "🔥 Khách vừa đặt Bánh tráng trộn",
  "🥤 Đơn Trà sữa vừa được xác nhận",
  "🌶️ Khách vừa thêm topping mỡ hành",
];

export default function LiveOrder() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % orders.length);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-24 left-4 z-50 hidden rounded-2xl bg-white px-5 py-4 shadow-2xl shadow-black/10 md:block">
      <p className="text-sm font-black text-[#06113C]">
        {orders[current]}
      </p>
    </div>
  );
}