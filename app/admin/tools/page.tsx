import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";

type ToolItem = {
  title: string;
  description: string;
  href: string;
  icon: string;
  tag: string;
  group: string;
  external?: boolean;
};

const tools: ToolItem[] = [
  {
    title: "Tối ưu ảnh",
    description:
      "Nén ảnh, chuyển WebP và thêm watermark cho sản phẩm, banner, bài viết.",
    href: "/admin/tools/image-optimize",
    icon: "🖼️",
    tag: "Image SEO",
    group: "Hình ảnh",
  },
  {
    title: "Cấu hình SEO & Analytics",
    description:
      "Quản lý GA4, Clarity, Google Search Console, Bing Webmaster và IndexNow.",
    href: "/admin/seo",
    icon: "📈",
    tag: "SEO Config",
    group: "SEO",
  },
  {
    title: "Kiểm tra Sitemap",
    description: "Mở nhanh sitemap.xml để kiểm tra URL Google có thể crawl.",
    href: "https://anvatngoctrinh.vn/sitemap.xml",
    icon: "🗺️",
    tag: "Sitemap",
    group: "Kiểm tra",
    external: true,
  },
  {
    title: "Kiểm tra robots.txt",
    description: "Mở nhanh robots.txt để kiểm tra rule cho bot Google/Bing.",
    href: "https://anvatngoctrinh.vn/robots.txt",
    icon: "🤖",
    tag: "Robots",
    group: "Kiểm tra",
    external: true,
  },
  {
    title: "Rich Results Test",
    description:
      "Kiểm tra schema Restaurant, Article, FAQ có hợp lệ với Google không.",
    href: "https://search.google.com/test/rich-results?url=https://anvatngoctrinh.vn",
    icon: "🧩",
    tag: "Schema",
    group: "Kiểm tra",
    external: true,
  },
];

const stats = [
  {
    label: "Tổng công cụ",
    value: tools.length,
    note: "SEO, hình ảnh, kiểm tra website",
  },
  {
    label: "Công cụ nội bộ",
    value: tools.filter((item) => !item.external).length,
    note: "Chạy trực tiếp trong admin",
  },
  {
    label: "Công cụ kiểm tra",
    value: tools.filter((item) => item.external).length,
    note: "Mở dịch vụ kiểm tra bên ngoài",
  },
  {
    label: "SEO Tools",
    value: tools.filter((item) => item.group === "SEO").length,
    note: "Phục vụ SEO & Analytics",
  },
];

function ToolCard({ tool }: { tool: ToolItem }) {
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

      <h2 className="mt-4 text-xl font-black text-[#06113C]">{tool.title}</h2>

      <p className="mt-2 min-h-[72px] text-sm font-semibold leading-6 text-neutral-500">
        {tool.description}
      </p>

      <div className="mt-4 flex items-center justify-between">
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-black text-neutral-500">
          {tool.group}
        </span>

        <span className="text-sm font-black text-[#00B14F]">
          {tool.external ? "Mở kiểm tra →" : "Mở công cụ →"}
        </span>
      </div>
    </>
  );

  if (tool.external) {
    return (
      <a
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
    <Link href={tool.href} className={className}>
      {content}
    </Link>
  );
}

export default function AdminToolsPage() {
  return (
    <AdminLayout>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-black text-[#00B14F]">Admin/POS</p>

          <h1 className="mt-1 text-4xl font-black text-[#06113C]">
            Công cụ quản trị
          </h1>

          <p className="mt-2 text-sm font-semibold text-neutral-500">
            Gom các công cụ kỹ thuật, SEO, hình ảnh và kiểm tra website vào một
            nơi để dễ quản lý.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/seo"
            className="rounded-2xl bg-[#06113C] px-5 py-4 text-sm font-black text-white shadow-lg"
          >
            Dashboard SEO
          </Link>

          <Link
            href="/admin/tools/image-optimize"
            className="rounded-2xl bg-[#00B14F] px-5 py-4 text-sm font-black text-white shadow-lg shadow-[#00B14F]/25"
          >
            Tối ưu ảnh
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.label}
            className="rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5"
          >
            <p className="text-sm font-black text-neutral-400">{item.label}</p>

            <p className="mt-2 text-3xl font-black text-[#06113C]">
              {item.value}
            </p>

            <p className="mt-2 text-xs font-bold text-neutral-400">
              {item.note}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard key={tool.href} tool={tool} />
        ))}
      </div>

      <div className="mt-8 rounded-[32px] bg-white p-5 shadow-xl shadow-neutral-950/5">
        <h2 className="text-2xl font-black text-[#06113C]">
          Gợi ý sử dụng
        </h2>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-[#F5FFF8] p-4">
            <p className="font-black text-[#06113C]">1. Kiểm tra SEO</p>
            <p className="mt-1 text-sm font-semibold text-neutral-500">
              Vào Dashboard SEO để kiểm tra GA4, Clarity, Sitemap, robots và
              IndexNow.
            </p>
          </div>

          <div className="rounded-2xl bg-[#F5FFF8] p-4">
            <p className="font-black text-[#06113C]">2. Tối ưu ảnh</p>
            <p className="mt-1 text-sm font-semibold text-neutral-500">
              Chạy công cụ ảnh khi đã upload nhiều sản phẩm hoặc banner mới.
            </p>
          </div>

          <div className="rounded-2xl bg-[#F5FFF8] p-4">
            <p className="font-black text-[#06113C]">3. Kiểm tra Schema</p>
            <p className="mt-1 text-sm font-semibold text-neutral-500">
              Sau khi sửa trang chủ hoặc bài viết, chạy Rich Results Test để
              kiểm tra dữ liệu có cấu trúc.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}