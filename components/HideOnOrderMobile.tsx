"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

export default function HideOnOrderMobile({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  const shouldHide =
    pathname === "/dat-mon-nhanh" || pathname.startsWith("/dat-mon-nhanh/");

  return (
    <div className={shouldHide ? "hidden md:block" : ""}>
      {children}
    </div>
  );
}