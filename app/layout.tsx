import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomBar from "@/components/MobileBottomBar";
import FloatingOrderButton from "@/components/FloatingOrderButton";
import LiveOrder from "@/components/LiveOrder";
import HideOnOrderMobile from "@/components/HideOnOrderMobile";
import CopyProtection from "@/components/CopyProtection";
import InstallAppPrompt from "@/components/InstallAppPrompt";
import CustomerPushPrompt from "@/components/CustomerPushPrompt";
import Script from "next/script";
const beVietnam = Be_Vietnam_Pro({
  subsets: ["vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://anvatngoctrinh.vn"),
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  title: {
    default: "Ăn Vặt Ngọc Trinh - Bánh tráng & ăn vặt Quận 6",
    template: "%s | Ăn Vặt Ngọc Trinh",
  },
  description:
    "Ăn Vặt Ngọc Trinh chuyên bánh tráng cuốn, bánh tráng trộn, bánh tráng chấm và nước uống tại Quận 6. Xem menu và đặt món trực tiếp trên website.",
  keywords: [
    "ăn vặt quận 6",
    "bánh tráng quận 6",
    "bánh tráng trộn quận 6",
    "cuốn đỏ mỡ hành",
    "ăn vặt ngọc trinh",
  ],
  openGraph: {
    title: "Ăn Vặt Ngọc Trinh - Bánh tráng & ăn vặt Quận 6",
    description:
      "Xem menu, video món thật và đặt món trực tiếp trên website Ăn Vặt Ngọc Trinh.",
    url: "https://anvatngoctrinh.vn",
    siteName: "Ăn Vặt Ngọc Trinh",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Ăn Vặt Ngọc Trinh",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: "#00B14F",
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: "#00B14F",
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
  <body className={beVietnam.className}>
  <Script
  async
  src="https://www.googletagmanager.com/gtag/js?id=G-4XNNYW5LTN"
/>

<Script id="google-analytics">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', 'G-4XNNYW5LTN');
  `}
</Script>
  <CustomerPushPrompt />
  <InstallAppPrompt />
  <CopyProtection />
  <HideOnOrderMobile>
  <Header />
</HideOnOrderMobile>

{children}

<HideOnOrderMobile>
  <Footer />
</HideOnOrderMobile>
  <LiveOrder />
  <MobileBottomBar />
  <FloatingOrderButton />
</body>
    </html>
  );
}