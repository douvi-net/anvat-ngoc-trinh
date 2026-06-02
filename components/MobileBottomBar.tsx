import Link from "next/link";

export default function MobileBottomBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/5 bg-white/95 px-3 py-2 shadow-2xl backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-black text-[#06113C]">
        <Link href="/" className="rounded-2xl px-2 py-2">
          <div className="text-xl">🏠</div>
          Trang chủ
        </Link>

        <Link href="/bai-viet" className="rounded-2xl px-2 py-2">
          <div className="text-xl">📝</div>
          Bài viết
        </Link>

        <Link
          href="/dat-mon-nhanh"
          className="rounded-2xl bg-[#00B14F] px-2 py-2 text-white"
        >
          <div className="text-xl">🍽️</div>
          Đặt món
        </Link>

        <Link href="/lien-he" className="rounded-2xl px-2 py-2">
          <div className="text-xl">☎️</div>
          Liên hệ
        </Link>
      </div>
    </nav>
  );
}