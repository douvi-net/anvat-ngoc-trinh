import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đặt món trực tiếp | Ăn Vặt Ngọc Trinh",
  description:
    "Đặt trực tiếp trên website để tích xu đổi quà, nhận ưu đãi tự động và không cần chờ quán xác nhận qua Zalo.",

  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },

  openGraph: {
    title: "🛵 Đặt món trực tiếp | Ăn Vặt Ngọc Trinh",
    description:
      "Đặt trực tiếp trên website để tích xu đổi quà, nhận ưu đãi tự động và không cần chờ quán xác nhận qua Zalo.",
    url: "https://anvatngoctrinh.vn/dat-mon-nhanh",
    siteName: "Ăn Vặt Ngọc Trinh",

    images: [
      {
        url: "/images/og-dat-mon.png",
        width: 1200,
        height: 630,
        alt: "Ăn Vặt Ngọc Trinh",
      },
    ],

    locale: "vi_VN",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Đặt món trực tiếp | Ăn Vặt Ngọc Trinh",
    description:
      "Đặt trực tiếp trên website để tích xu đổi quà, ưu đãi tự động.",
    images: ["/images/og-dat-mon.png"],
  },
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}