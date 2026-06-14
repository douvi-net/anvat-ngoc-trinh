import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Bài viết ăn vặt Quận 6 | Ăn Vặt Ngọc Trinh",
  description:
    "Tổng hợp bài viết về bánh tráng, đồ ăn vặt, trà sữa, trà trái cây và gợi ý đặt món tại Ăn Vặt Ngọc Trinh Quận 6.",
  alternates: {
    canonical: "https://anvatngoctrinh.vn/bai-viet",
  },
  openGraph: {
    title: "Bài viết ăn vặt Quận 6 | Ăn Vặt Ngọc Trinh",
    description:
      "Khám phá các món bánh tráng, đồ ăn vặt và món hot tại Ăn Vặt Ngọc Trinh Quận 6.",
    url: "https://anvatngoctrinh.vn/bai-viet",
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
  focus_keyword: string | null;
};

export default async function BaiVietPage() {
  const { data: posts } = await supabase
    .from("posts")
    .select(
      "id,title,slug,excerpt,category,image_url,published_at,featured,focus_keyword"
    )
    .eq("status", "published")
    .eq("is_active", true)
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("published_at", { ascending: false });

  const featuredPost = posts?.find((post) => post.featured) || posts?.[0];
  const normalPosts =
    posts?.filter((post) => post.id !== featuredPost?.id) || [];

  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": "https://anvatngoctrinh.vn/bai-viet#blog",
    name: "Blog Ăn Vặt Ngọc Trinh",
    description:
      "Bài viết về bánh tráng, ăn vặt, trà sữa và các món ngon tại Quận 6.",
    url: "https://anvatngoctrinh.vn/bai-viet",
    publisher: {
      "@type": "Organization",
      name: "Ăn Vặt Ngọc Trinh",
      url: "https://anvatngoctrinh.vn",
    },
  };

  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(blogSchema),
        }}
      />

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

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dat-mon-nhanh"
              className="rounded-2xl bg-[#06113C] px-6 py-4 text-sm font-black text-white shadow-xl"
            >
              Đặt món ngay
            </Link>

            <Link
              href="/"
              className="rounded-2xl bg-white px-6 py-4 text-sm font-black text-[#06113C] shadow-xl"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        {!posts || posts.length === 0 ? (
          <div className="rounded-[32px] bg-[#F5FFF8] p-8 text-center">
            <p className="text-xl font-black text-[#06113C]">
              Chưa có bài viết nào.
            </p>

            <p className="mt-2 text-sm font-semibold text-neutral-500">
              Quán sẽ sớm cập nhật các bài viết về món ngon và ưu đãi mới.
            </p>

            <Link
              href="/dat-mon-nhanh"
              className="mt-5 inline-flex rounded-2xl bg-[#00B14F] px-6 py-4 text-sm font-black text-white"
            >
              Xem menu đặt món
            </Link>
          </div>
        ) : (
          <>
            {featuredPost && (
              <Link
                href={`/bai-viet/${featuredPost.slug}`}
                className="grid overflow-hidden rounded-[36px] bg-[#F5FFF8] shadow-xl shadow-neutral-950/5 md:grid-cols-[1.1fr_0.9fr]"
              >
                <div className="p-6 md:p-8">
                  <div className="flex flex-wrap gap-2">
                    <span className="w-fit rounded-full bg-[#00B14F] px-4 py-2 text-xs font-black text-white">
                      Bài nổi bật
                    </span>

                    <span className="w-fit rounded-full bg-white px-4 py-2 text-xs font-black text-[#00B14F]">
                      {featuredPost.category || "Ăn vặt"}
                    </span>
                  </div>

                  <h2 className="mt-5 max-w-2xl text-3xl font-black leading-tight text-[#06113C] md:text-5xl">
                    {featuredPost.title}
                  </h2>

                  {featuredPost.excerpt && (
                    <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-neutral-600">
                      {featuredPost.excerpt}
                    </p>
                  )}

                  <p className="mt-6 inline-flex rounded-2xl bg-[#06113C] px-5 py-3 text-sm font-black text-white">
                    Đọc bài viết →
                  </p>
                </div>

                <div className="min-h-[280px] bg-[#E8FFF1]">
                  {featuredPost.image_url ? (
                    <img
                      src={featuredPost.image_url}
                      alt={featuredPost.focus_keyword || featuredPost.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full min-h-[280px] items-center justify-center text-7xl">
                      📝
                    </div>
                  )}
                </div>
              </Link>
            )}

            {normalPosts.length > 0 && (
              <div className="mt-10">
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase text-[#00B14F]">
                      Tất cả bài viết
                    </p>

                    <h2 className="mt-1 text-3xl font-black text-[#06113C]">
                      Khám phá thêm món ngon
                    </h2>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                  {normalPosts.map((post: Post) => (
                    <article
                      key={post.id}
                      className="overflow-hidden rounded-[32px] border border-black/5 bg-white shadow-xl shadow-neutral-950/5"
                    >
                      <Link href={`/bai-viet/${post.slug}`}>
                        <div className="h-52 bg-[#E8FFF1]">
                          {post.image_url ? (
                            <img
                              src={post.image_url}
                              alt={post.focus_keyword || post.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-6xl">
                              📝
                            </div>
                          )}
                        </div>
                      </Link>

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

                        <h3 className="mt-4 text-xl font-black leading-tight text-[#06113C]">
                          <Link href={`/bai-viet/${post.slug}`}>
                            {post.title}
                          </Link>
                        </h3>

                        <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-neutral-600">
                          {post.excerpt || "Đang cập nhật mô tả bài viết."}
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
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}