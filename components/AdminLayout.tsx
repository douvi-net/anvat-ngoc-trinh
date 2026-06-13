import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#F5FFF8]">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden bg-[#06113C] p-6 text-white lg:block">
          <p className="text-2xl font-black">AVNT POS</p>
          <p className="mt-1 text-sm font-semibold text-white/60">
            Ăn Vặt Ngọc Trinh
          </p>

          <nav className="mt-10 space-y-3 text-sm font-black">
            <Link href="/admin" className="block rounded-2xl px-4 py-3 text-white/70">
              📊 Tổng quan
            </Link>
            <Link href="/admin/orders" className="block rounded-2xl px-4 py-3 text-white/70">
              📦 Đơn hàng
            </Link>
            <Link href="/admin/products" className="block rounded-2xl px-4 py-3 text-white/70">
              🍽️ Sản phẩm
            </Link>
            <Link href="/admin/toppings" className="block rounded-2xl px-4 py-3 text-white/70">
  🧂 Topping
</Link>
<Link href="/admin/customers" className="block rounded-2xl px-4 py-3 text-white/70">
  👥 Khách hàng
</Link>
<Link href="/admin/coupons" className="block rounded-2xl px-4 py-3 text-white/70">
  🎟️ Mã giảm giá
</Link>
            <Link href="/admin/posts" className="block rounded-2xl px-4 py-3 text-white/70">
              📝 Bài viết
            </Link>
            <Link href="/admin/seo" className="block rounded-2xl px-4 py-3 text-white/70">
  SEO & Analytics
</Link>
            <Link href="/admin/banners" className="block rounded-2xl px-4 py-3 text-white/70">
  🖼️ Banner
</Link>
            <Link href="/admin/settings" className="block rounded-2xl px-4 py-3 text-white/70">
              ⚙️ Cài đặt
            </Link>
          </nav>
        </aside>

        <section className="p-4 md:p-8">{children}</section>
      </div>
    </main>
  );
}