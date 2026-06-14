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
  updated_at: string | null;
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
      "id,title,slug,excerpt,content,category,image_url,published_at,updated_at,seo_title,seo_description,focus_keyword"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .eq("is_active", true)
    .single<Post>();

  return data;
}

function isHtml(content: string) {
  return /<\/?[a-z][\s\S]*>/i.test(content);
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
    alternates: {
      canonical: `https://anvatngoctrinh.vn/bai-viet/${post.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://anvatngoctrinh.vn/bai-viet/${post.slug}`,
      type: "article",
      images: post.image_url
        ? [
            {
              url: post.image_url,
              width: 1200,
              height: 630,
              alt: post.title,
            },
          ]
        : [],
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

  const content = post.content || "";
  const contentIsHtml = isHtml(content);

  const paragraphs = content
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  const { data: relatedPosts } = await supabase
    .from("posts")
    .select("id,title,slug,excerpt,image_url,category")
    .eq("status", "published")
    .eq("is_active", true)
    .neq("id", post.id)
    .limit(3);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `https://anvatngoctrinh.vn/bai-viet/${post.slug}#article`,
    headline: post.seo_title || post.title,
    description: post.seo_description || post.excerpt,
    image: post.image_url ? [post.image_url] : undefined,
    datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://anvatngoctrinh.vn/bai-viet/${post.slug}`,
    },
    author: {
      "@type": "Organization",
      name: "Ăn Vặt Ngọc Trinh",
      url: "https://anvatngoctrinh.vn",
    },
    publisher: {
      "@type": "Organization",
      name: "Ăn Vặt Ngọc Trinh",
      logo: {
        "@type": "ImageObject",
        url: "https://anvatngoctrinh.vn/icon.png",
      },
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Trang chủ",
        item: "https://anvatngoctrinh.vn",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Bài viết",
        item: "https://anvatngoctrinh.vn/bai-viet",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `https://anvatngoctrinh.vn/bai-viet/${post.slug}`,
      },
    ],
  };

  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
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

        <article className="article-content max-w-none">
          {!content ? (
            <p className="text-lg font-semibold leading-9 text-neutral-700">
              Đang cập nhật nội dung.
            </p>
          ) : contentIsHtml ? (
            <div
              className="space-y-5 text-lg font-semibold leading-9 text-neutral-700 [&_a]:font-black [&_a]:text-[#00B14F] [&_h2]:mt-10 [&_h2]:text-3xl [&_h2]:font-black [&_h2]:leading-tight [&_h2]:text-[#06113C] [&_h3]:mt-7 [&_h3]:text-2xl [&_h3]:font-black [&_h3]:text-[#06113C] [&_li]:ml-6 [&_li]:list-disc [&_p]:mb-5 [&_strong]:font-black [&_strong]:text-[#06113C] [&_ul]:space-y-2"
              dangerouslySetInnerHTML={{ __html: content }}
            />
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
            Ghé Ăn Vặt Ngọc Trinh để đặt bánh tráng, nước uống và món hot trong
            ngày.
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
                    {item.category || "Ăn vặt"}
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