import Link from "next/link";

const navItems = [
  { label: "Trang chủ", href: "/" },
  { label: "Bài viết", href: "/bai-viet" },
  { label: "Giới thiệu", href: "/gioi-thieu" },
  { label: "Liên hệ", href: "/lien-he" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="leading-tight">
          <p className="text-[18px] font-black tracking-tight text-[#00B14F]">
            Ăn Vặt Ngọc Trinh
          </p>
          <p className="text-[11px] font-bold text-neutral-500">
            Bánh tráng & ăn vặt Quận 6
          </p>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-black text-[#06113C] md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-[#00B14F]">
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/dat-mon-nhanh"
          className="rounded-2xl bg-[#00B14F] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#00B14F]/25"
        >
          Đặt hàng
        </Link>
      </div>
    </header>
  );
}