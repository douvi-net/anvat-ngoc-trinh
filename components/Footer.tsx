import Link from "next/link";

const phone = "0392496220";

const quickLinks = [
  { label: "Trang chủ", href: "/" },
  { label: "Giới thiệu", href: "/gioi-thieu" },
  { label: "Đặt món nhanh", href: "/dat-mon-nhanh" },
  { label: "Tra cứu đơn", href: "/tra-cuu-don" },
  { label: "Bài viết", href: "/bai-viet" },
  { label: "Tuyển dụng", href: "/tuyen-dung" },
  { label: "Liên hệ", href: "/lien-he" },
];

const supportLinks = [
  { label: "📲 Hướng dẫn cài app", href: "/huong-dan-cai-app" },
  { label: "📦 Chính sách đặt hàng", href: "/chinh-sach-dat-hang" },
  { label: "🪙 Chính sách tích xu", href: "/chinh-sach-tich-xu" },
  { label: "🎁 Chính sách đổi quà", href: "/chinh-sach-doi-qua" },
];

export default function Footer() {
  return (
    <footer className="mt-10 bg-[#06113C] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_1fr_1fr_1fr]">
          <div>
            <p className="text-2xl font-black">Ăn Vặt Ngọc Trinh</p>

            <p className="mt-3 max-w-sm text-sm font-medium leading-7 text-white/70">
              Bánh tráng, cuốn, nước uống và các món ăn vặt dễ ghiền. Khách có
              thể đặt món nhanh, tích xu đổi quà và theo dõi đơn hàng trực tiếp
              trên website.
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

            <Link
              href="/huong-dan-cai-app"
              className="mt-4 inline-flex rounded-2xl bg-[#E8FFF1] px-5 py-3 text-sm font-black text-[#00B14F]"
            >
              📲 Cài app vào màn hình chính
            </Link>
          </div>

          <div>
            <p className="font-black text-[#00B14F]">Khám phá</p>

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
            <p className="font-black text-[#00B14F]">Hỗ trợ & chính sách</p>

            <div className="mt-4 grid gap-3">
              {supportLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-bold text-white/70 transition hover:text-[#00B14F]"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <p className="mt-4 rounded-2xl bg-white/10 p-3 text-xs font-bold leading-6 text-white/60">
              Quà đổi xu không quy đổi thành tiền mặt. Quán có quyền từ chối
              đơn hàng có dấu hiệu gian lận, spam hoặc thông tin không chính xác.
            </p>
          </div>

          <div>
            <p className="font-black text-[#00B14F]">Địa chỉ quán</p>

            <div className="mt-4 space-y-4 text-sm font-bold leading-6 text-white/70">
              <div>
                <p className="text-white">📍 Chi nhánh CN2</p>
                <p>240/127/22C Nguyễn Văn Luông, Phường Bình Phú (Q6 cũ), TP.HCM</p>
                <p className="mt-1 text-[#00B14F]">11:00 - 22:00 mỗi ngày</p>
              </div>

              <div>
                <p className="text-white">📍 Chi nhánh CN1</p>
                <p>178/4A Cô Giang, Phường Cầu Ông Lãnh (Q1 cũ), TP.HCM</p>
                <p className="mt-1 text-[#00B14F]">
                  Tạm đóng
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="font-black text-[#00B14F]">Liên hệ quán</p>

            <div className="mt-4 space-y-3 text-sm font-bold leading-6 text-white/70">
              <p>
                Hotline:{" "}
                <a href={`tel:${phone}`} className="text-white hover:text-[#00B14F]">
                  0392 496 220
                </a>
              </p>

              <p>Phục vụ: giao tận nơi, đặt trước ghé lấy, đặt online.</p>

              <a
                href={`https://zalo.me/${phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white ring-1 ring-white/10"
              >
                💬 Nhắn Zalo
              </a>
            </div>

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

        <div className="mt-10 rounded-[28px] bg-white/10 p-5">
          <p className="text-sm font-black text-white">
            📲 Mẹo nhỏ: Thêm website Ăn Vặt Ngọc Trinh vào màn hình chính để đặt
            món nhanh như app.
          </p>

          <Link
            href="/huong-dan-cai-app"
            className="mt-3 inline-flex text-sm font-black text-[#00B14F]"
          >
            Xem hướng dẫn cài app →
          </Link>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs font-bold text-white/50 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Ăn Vặt Ngọc Trinh. All rights reserved.</p>
          <p>Website đặt món chính thức của Ăn Vặt Ngọc Trinh.</p>
        </div>
      </div>
    </footer>
  );
}