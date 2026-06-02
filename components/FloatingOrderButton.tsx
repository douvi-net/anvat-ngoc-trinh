import Link from "next/link";

export default function FloatingOrderButton() {
  return (
    <Link
      href="/dat-mon-nhanh"
      className="fixed bottom-6 right-6 z-50 hidden rounded-2xl bg-[#00B14F] px-6 py-4 text-sm font-black text-white shadow-2xl shadow-[#00B14F]/30 md:block"
    >
      🍽️ Đặt hàng
    </Link>
  );
}