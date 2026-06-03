import Link from "next/link";

export default function MobileBottomBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/5 bg-white/95 px-2 py-2 shadow-2xl backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-black text-[#06113C]">
        <Link href="/" className="rounded-2xl px-1 py-2">
          <div className="text-xl">🏠</div>
          Trang chủ
        </Link>

        <Link
          href="/dat-mon-nhanh"
          className="rounded-2xl bg-[#00B14F] px-1 py-2 text-white"
        >
          <div className="text-xl">🍽️</div>
          Đặt món
        </Link>

        <Link href="/tra-cuu-don" className="rounded-2xl px-1 py-2">
          <div className="text-xl">📦</div>
          Tra cứu
        </Link>

        <Link href="/lien-he" className="rounded-2xl px-1 py-2">
          <div className="text-xl">📍</div>
          Bài viết
        </Link>
      </div>
    </nav>
  );
}