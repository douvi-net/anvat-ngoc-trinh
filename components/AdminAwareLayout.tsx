"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomBar from "@/components/MobileBottomBar";
import FloatingOrderButton from "@/components/FloatingOrderButton";
import LiveOrder from "@/components/LiveOrder";
import HideOnOrderMobile from "@/components/HideOnOrderMobile";

export default function AdminAwareLayout() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <HideOnOrderMobile>
        <Header />
      </HideOnOrderMobile>

      <LiveOrder />

      <HideOnOrderMobile>
        <Footer />
      </HideOnOrderMobile>

      <MobileBottomBar />
      <FloatingOrderButton />
    </>
  );
}