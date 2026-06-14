import Link from "next/link";

const menuGroups = [
  {
    title: "DASHBOARD",
    items: [{ label: "Tổng quan", href: "/admin", icon: "📊" }],
  },
  {
    title: "BÁN HÀNG",
    items: [{ label: "Đơn hàng", href: "/admin/orders", icon: "📦" }],
  },
  {
    title: "KHÁCH HÀNG",
    items: [
      { label: "Khách hàng", href: "/admin/customers", icon: "👥" },
      { label: "Đổi quà", href: "/admin/rewards", icon: "🎁" },
      { label: "Mã giảm giá", href: "/admin/coupons", icon: "🎟️" },
    ],
  },
  {
    title: "MENU",
    items: [
      { label: "Sản phẩm", href: "/admin/products", icon: "🍽️" },
      { label: "Topping", href: "/admin/toppings", icon: "🧂" },
      { label: "Banner", href: "/admin/banners", icon: "🖼️" },
    ],
  },
  {
    title: "SEO & CONTENT",
    items: [
      { label: "Dashboard SEO", href: "/admin/seo", icon: "🚀" },
      { label: "Bài viết", href: "/admin/posts", icon: "📝" },
      { label: "AI Writer", href: "/admin/seo-ai", icon: "🤖" },
      { label: "Công cụ SEO", href: "/admin/tools", icon: "🧰" },
    ],
  },
  {
    title: "HỆ THỐNG",
    items: [{ label: "Cài đặt", href: "/admin/settings", icon: "⚙️" }],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#F5FFF8]">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="hidden overflow-y-auto bg-[#06113C] p-6 text-white lg:block">
          <div>
            <p className="text-2xl font-black">AVNT POS</p>
            <p className="mt-1 text-sm font-semibold text-white/60">
              Ăn Vặt Ngọc Trinh
            </p>
          </div>

          <nav className="mt-8 space-y-7">
            {menuGroups.map((group) => (
              <div key={group.title}>
                <p className="px-4 text-[11px] font-black uppercase tracking-widest text-white/35">
                  {group.title}
                </p>

                <div className="mt-2 space-y-1">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-white/70 transition hover:bg-white/10 hover:text-white"
                    >
                      <span className="w-5 text-center">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 p-4 md:p-8">{children}</section>
      </div>
    </main>
  );
}