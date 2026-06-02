import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Bài viết ăn vặt Quận 6 | Ăn Vặt Ngọc Trinh",
  description:
    "Tổng hợp bài viết về món ngon, bánh tráng, đồ ăn vặt và các món hot tại Ăn Vặt Ngọc Trinh Quận 6.",
  openGraph: {
    title: "Bài viết ăn vặt Quận 6 | Ăn Vặt Ngọc Trinh",
    description:
      "Khám phá các món bánh tráng, đồ ăn vặt và món hot tại Ăn Vặt Ngọc Trinh Quận 6.",
    type: "website",
  },
};

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string | null;
  image_url: string | null;
  published_at: string | null;
  featured: boolean | null;
};

export default async function BaiVietPage() {
  const { data: posts } = await supabase
    .from("posts")
    .select("id,title,slug,excerpt,category,image_url,published_at,featured")
    .eq("status", "published")
    .eq("is_active", true)
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("published_at", { ascending: false });

  return (
    <main className="bg-white">
      <section className="bg-[#00B14F] px-4 py-16 text-white md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="inline-flex rounded-full bg-white px-5 py-2 text-sm font-black text-[#00B14F]">
            Blog Ăn Vặt Ngọc Trinh
          </p>

          <h1 className="mt-6 max-w-3xl text-5xl font-black leading-tight md:text-7xl">
            Bài viết món ngon & ăn vặt Quận 6
          </h1>

          <p className="mt-5 max-w-2xl text-lg font-bold leading-8 text-white/90">
            Chia sẻ món hot, bánh tráng ngon, đồ ăn vặt dễ ghiền và gợi ý đặt
            món tại Quận 6.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-8">
        {!posts || posts.length === 0 ? (
          <div className="rounded-[32px] bg-[#F5FFF8] p-8 text-center">
            <p className="text-xl font-black text-[#06113C]">
              Chưa có bài viết nào.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {posts.map((post: Post) => (
              <article
                key={post.id}
                className="overflow-hidden rounded-[32px] border border-black/5 bg-white shadow-xl shadow-neutral-950/5"
              >
                <div className="h-52 bg-[#E8FFF1]">
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-6xl">
                      📝
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap gap-2">
                    <p className="w-fit rounded-full bg-[#E8FFF1] px-4 py-2 text-xs font-black text-[#00B14F]">
                      {post.category || "Ăn vặt"}
                    </p>

                    {post.featured && (
                      <p className="w-fit rounded-full bg-orange-100 px-4 py-2 text-xs font-black text-orange-700">
                        Nổi bật
                      </p>
                    )}
                  </div>

                  <h2 className="mt-4 text-xl font-black leading-tight text-[#06113C]">
                    <Link href={`/bai-viet/${post.slug}`}>{post.title}</Link>
                  </h2>

                  <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-neutral-600">
                    {post.excerpt}
                  </p>

                  <Link
                    href={`/bai-viet/${post.slug}`}
                    className="mt-5 inline-flex rounded-2xl bg-[#06113C] px-5 py-3 text-sm font-black text-white"
                  >
                    Đọc bài viết
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}