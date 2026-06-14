import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";

const tools = [
  {
    title: "Tối ưu ảnh",
    description:
      "Nén ảnh, chuyển WebP và thêm watermark cho sản phẩm, banner, bài viết.",
    href: "/admin/tools/image-optimize",
    icon: "🖼️",
    tag: "Image SEO",
  },
  {
    title: "Cấu hình SEO & Analytics",
    description:
      "Quản lý GA4, Clarity, Google Search Console, Bing Webmaster và IndexNow.",
    href: "/admin/seo",
    icon: "📈",
    tag: "SEO Config",
  },
  {
    title: "Kiểm tra Sitemap",
    description: "Mở nhanh sitemap.xml để kiểm tra URL Google có thể crawl.",
    href: "https://anvatngoctrinh.vn/sitemap.xml",
    icon: "🗺️",
    tag: "Sitemap",
    external: true,
  },
  {
    title: "Kiểm tra robots.txt",
    description: "Mở nhanh robots.txt để kiểm tra rule cho bot Google/Bing.",
    href: "https://anvatngoctrinh.vn/robots.txt",
    icon: "🤖",
    tag: "Robots",
    external: true,
  },
  {
    title: "Rich Results Test",
    description:
      "Kiểm tra schema Restaurant, Article, FAQ có hợp lệ với Google không.",
    href: "https://search.google.com/test/rich-results?url=https://anvatngoctrinh.vn",
    icon: "🧩",
    tag: "Schema",
    external: true,
  },
];

export default function AdminToolsPage() {
  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <p className="text-sm font-black uppercase text-[#00B14F]">
            Hệ thống
          </p>

          <h1 className="mt-1 text-3xl font-black text-[#06113C]">
            Công cụ quản trị
          </h1>

          <p className="mt-2 text-sm font-semibold text-neutral-500">
            Gom các công cụ kỹ thuật, SEO, hình ảnh và kiểm tra website vào một
            nơi để dễ quản lý.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => {
            const className =
              "block rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5 transition hover:-translate-y-1 hover:shadow-xl";

            const content = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8FFF1] text-2xl">
                    {tool.icon}
                  </div>

                  <span className="rounded-full bg-[#F5FFF8] px-3 py-1 text-[11px] font-black text-[#00B14F]">
                    {tool.tag}
                  </span>
                </div>

                <h2 className="mt-4 text-xl font-black text-[#06113C]">
                  {tool.title}
                </h2>

                <p className="mt-2 text-sm font-semibold leading-6 text-neutral-500">
                  {tool.description}
                </p>

                <p className="mt-4 text-sm font-black text-[#00B14F]">
                  Mở công cụ →
                </p>
              </>
            );

            if (tool.external) {
              return (
                <a
                  key={tool.href}
                  href={tool.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                >
                  {content}
                </a>
              );
            }

            return (
              <Link key={tool.href} href={tool.href} className={className}>
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}