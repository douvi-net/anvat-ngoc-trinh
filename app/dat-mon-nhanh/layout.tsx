import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đặt món trực tiếp | Ăn Vặt Ngọc Trinh",
  description:
    "Đặt bánh tráng & ăn vặt trực tiếp tại Ăn Vặt Ngọc Trinh. Tích xu đổi quà, ưu đãi tự động, giao nhanh khu vực Quận 6 và lân cận.",
  alternates: {
    canonical: "https://anvatngoctrinh.vn/dat-mon-nhanh",
  },
  openGraph: {
    title: "🛵 Đặt món trực tiếp | Ăn Vặt Ngọc Trinh",
    description:
      "Đặt trực tiếp trên website để tích xu đổi quà, nhận ưu đãi tự động và không cần chờ quán xác nhận qua Zalo.",
    url: "https://anvatngoctrinh.vn/dat-mon-nhanh",
    siteName: "Ăn Vặt Ngọc Trinh",
    images: [
      {
        url: "/images/og-dat-mon.jpg",
        width: 1200,
        height: 630,
        alt: "Đặt món trực tiếp Ăn Vặt Ngọc Trinh",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "🛵 Đặt món trực tiếp | Ăn Vặt Ngọc Trinh",
    description:
      "Tích xu đổi quà, ưu đãi tự động, đặt món nhanh trên website.",
    images: ["/images/og-dat-mon.png"],
  },
};

export default function DatMonNhanhLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}