import Link from "next/link";

const phone = "0392496220";

const quickLinks = [
  { label: "Trang chủ", href: "/" },
  { label: "Giới thiệu", href: "/gioi-thieu" },
  { label: "Đặt món", href: "/dat-mon-nhanh" },
  { label: "Tra cứu đơn", href: "/tra-cuu-don" },
  { label: "Bài viết", href: "/bai-viet" },
  { label: "Tuyển dụng", href: "/tuyen-dung" },
  { label: "Liên hệ", href: "/lien-he" },
];

export default function Footer() {
  return (
    <footer className="mt-10 bg-[#06113C] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          <div>
            <p className="text-2xl font-black text-white">
              Ăn Vặt Ngọc Trinh
            </p>

            <p className="mt-3 max-w-sm text-sm font-medium leading-7 text-white/70">
              Quán ăn vặt chuyên bánh tráng, cuốn, nước uống và các món ăn vặt
              dễ ghiền tại khu vực Quận 6. Khách có thể xem menu, đặt món và
              tra cứu đơn trực tiếp trên website.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/dat-mon-nhanh"
                className="rounded-2xl bg-[#00B14F] px-5 py-3 text-sm font-black text-white"
              >
                🛒 Đặt món
              </Link>

              <a
                href={`tel:${phone}`}
                className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white ring-1 ring-white/10"
              >
                ☎️ Gọi quán
              </a>
            </div>
          </div>

          <div>
            <p className="font-black text-[#00B14F]">Menu</p>

            <div className="mt-4 grid gap-3">
              {quickLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-bold text-white/70 transition hover:text-[#00B14F]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="font-black text-[#00B14F]">Liên hệ</p>

            <div className="mt-4 space-y-3 text-sm font-bold leading-6 text-white/70">
              <p>
                Hotline:{" "}
                <a href={`tel:${phone}`} className="text-white hover:text-[#00B14F]">
                  {phone}
                </a>
              </p>

              <p>Khu vực: Quận 6 và lân cận</p>

              <p>Hình thức: Đặt online, giao hàng, ghé lấy</p>

              <a
                href={`https://zalo.me/${phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white ring-1 ring-white/10"
              >
                💬 Nhắn Zalo
              </a>
            </div>
          </div>

          <div>
            <p className="font-black text-[#00B14F]">Theo dõi quán</p>

            <p className="mt-4 text-sm font-medium leading-7 text-white/70">
              Cập nhật món mới, video làm món, feedback khách hàng và ưu đãi
              mới nhất từ Ăn Vặt Ngọc Trinh.
            </p>

            <div className="mt-5 grid gap-3">
              <a
                href="https://www.facebook.com/anvatngoctrinhq1"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white ring-1 ring-white/10 transition hover:bg-white/15"
              >
                Facebook →
              </a>

              <a
                href="https://www.tiktok.com/@anvatngoctrinh"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white ring-1 ring-white/10 transition hover:bg-white/15"
              >
                TikTok →
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs font-bold text-white/50 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Ăn Vặt Ngọc Trinh. All rights reserved.</p>

          <p>Website đặt món chính thức của Ăn Vặt Ngọc Trinh.</p>
        </div>
      </div>
    </footer>
  );
}