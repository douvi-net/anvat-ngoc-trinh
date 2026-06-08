import Link from "next/link";

const navItems = [
  { label: "Trang chủ", href: "/" },
  { label: "Giới thiệu", href: "/gioi-thieu" },
  { label: "Bài viết", href: "/bai-viet" },
  { label: "Tuyển dụng", href: "/tuyen-dung" },
  { label: "Liên hệ", href: "/lien-he" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:h-16 md:px-8">
        <Link href="/" className="leading-tight">
        <p className="text-[17px] font-black tracking-tight text-[#00B14F] md:text-[20px]">
  Ăn Vặt Ngọc Trinh
</p>

<p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500 md:text-[11px]">
  Bánh Tráng • Ăn Vặt • Quận 6
</p>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-black text-[#06113C] md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-[#00B14F]">
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/tra-cuu-don"
          className="hidden rounded-2xl bg-[#E8FFF1] px-4 py-2 text-sm font-black text-[#00B14F] md:block"
        >
          📦 Tra cứu đơn
        </Link>

        <Link
          href="/dat-mon-nhanh"
          className="rounded-2xl bg-[#00B14F] px-4 py-2 text-sm font-black text-white shadow-lg shadow-[#00B14F]/25 md:px-5 md:py-3"
        >
          Đặt món ngay
        </Link>
      </div>
    </header>
  );
}