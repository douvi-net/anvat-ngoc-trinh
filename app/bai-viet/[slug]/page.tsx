import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  category: string | null;
  image_url: string | null;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  focus_keyword: string | null;
};

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function getPost(slug: string) {
  const { data } = await supabase
    .from("posts")
    .select(
      "id,title,slug,excerpt,content,category,image_url,published_at,seo_title,seo_description,focus_keyword"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .eq("is_active", true)
    .single<Post>();

  return data;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: "Không tìm thấy bài viết | Ăn Vặt Ngọc Trinh",
    };
  }

  const title = post.seo_title || `${post.title} | Ăn Vặt Ngọc Trinh`;
  const description =
    post.seo_description ||
    post.excerpt ||
    "Bài viết món ngon, bánh tráng và ăn vặt Quận 6 từ Ăn Vặt Ngọc Trinh.";

  return {
    title,
    description,
    keywords: post.focus_keyword ? [post.focus_keyword] : undefined,
    openGraph: {
      title,
      description,
      type: "article",
      images: post.image_url ? [{ url: post.image_url }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.image_url ? [post.image_url] : [],
    },
  };
}

export default async function PostDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const paragraphs = (post.content || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  const { data: relatedPosts } = await supabase
    .from("posts")
    .select("id,title,slug,excerpt,image_url,category")
    .eq("status", "published")
    .eq("is_active", true)
    .neq("id", post.id)
    .eq("category", post.category || "")
    .limit(3);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.seo_title || post.title,
    description: post.seo_description || post.excerpt,
    image: post.image_url,
    datePublished: post.published_at,
    author: {
      "@type": "Organization",
      name: "Ăn Vặt Ngọc Trinh",
    },
    publisher: {
      "@type": "Organization",
      name: "Ăn Vặt Ngọc Trinh",
    },
  };

  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema),
        }}
      />

      <section className="bg-[#00B14F] px-4 py-14 text-white md:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 text-sm font-black">
            <Link href="/" className="rounded-full bg-white/20 px-4 py-2">
              Trang chủ
            </Link>
            <span>/</span>
            <Link href="/bai-viet" className="rounded-full bg-white/20 px-4 py-2">
              Bài viết
            </Link>
          </div>

          <p className="mt-8 w-fit rounded-full bg-white/20 px-4 py-2 text-xs font-black">
            {post.category || "Ăn vặt"}
          </p>

          <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-5 text-lg font-bold leading-8 text-white/90">
              {post.excerpt}
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10 md:px-8">
        {post.image_url && (
          <div className="mb-8 overflow-hidden rounded-[32px] bg-[#E8FFF1]">
            <img
              src={post.image_url}
              alt={post.focus_keyword || post.title}
              className="h-auto w-full object-cover"
            />
          </div>
        )}

        <article className="max-w-none">
          {paragraphs.length === 0 ? (
            <p className="text-lg font-semibold leading-9 text-neutral-700">
              Đang cập nhật nội dung.
            </p>
          ) : (
            paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className="mb-5 text-lg font-semibold leading-9 text-neutral-700"
              >
                {paragraph}
              </p>
            ))
          )}
        </article>

        <div className="mt-10 rounded-[32px] bg-[#F5FFF8] p-6">
          <p className="text-xl font-black text-[#06113C]">
            Muốn đặt món ăn vặt ngay?
          </p>

          <p className="mt-2 font-semibold text-neutral-600">
            Ghé Ăn Vặt Ngọc Trinh để đặt bánh tráng, nước uống và món hot trong ngày.
          </p>

          <Link
            href="/dat-mon-nhanh"
            className="mt-5 inline-flex rounded-2xl bg-[#00B14F] px-6 py-4 text-sm font-black text-white"
          >
            Đặt món ngay
          </Link>
        </div>

        {relatedPosts && relatedPosts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-3xl font-black text-[#06113C]">
              Bài viết liên quan
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {relatedPosts.map((item) => (
                <Link
                  key={item.id}
                  href={`/bai-viet/${item.slug}`}
                  className="rounded-[28px] border border-black/5 bg-white p-4 shadow-lg shadow-neutral-950/5"
                >
                  <div className="h-32 overflow-hidden rounded-2xl bg-[#E8FFF1]">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl">
                        📝
                      </div>
                    )}
                  </div>

                  <p className="mt-3 text-sm font-black text-[#00B14F]">
                    {item.category}
                  </p>

                  <h3 className="mt-2 font-black leading-6 text-[#06113C]">
                    {item.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}