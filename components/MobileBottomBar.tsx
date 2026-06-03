"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "Trang chủ",
    href: "/",
    icon: "🏠",
  },
  {
    label: "Đặt món",
    href: "/dat-mon-nhanh",
    icon: "🍽️",
  },
  {
    label: "Đơn hàng",
    href: "/tra-cuu-don",
    icon: "📦",
  },
  {
    label: "Liên hệ",
    href: "/lien-he",
    icon: "📍",
  },
];

export default function MobileBottomBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/5 bg-white/95 px-2 py-2 shadow-2xl backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-black">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-2xl px-1 py-2 transition ${
                isActive
                  ? "bg-[#00B14F] text-white"
                  : "text-[#06113C]"
              }`}
            >
              <div className="text-xl">{item.icon}</div>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}