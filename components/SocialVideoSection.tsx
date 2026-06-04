import Link from "next/link";

type VideoItem = {
  title: string;
  description: string;
  youtubeId: string;
  badge: string;
};

const videos: VideoItem[] = [
  {
    title: "POV: Em hỏi áo trắng hay áo đen",
    description: "Một góc vui về tuyển dụng và không khí thật tại quán.",
    youtubeId: "5zKY0V9GmYw",
    badge: "POV quán",
  },
  {
    title: "Bánh tráng núp hẻm Quận 6",
    description: "Những món best seller được khách hỏi nhiều tại quán.",
    youtubeId: "xI-FEMx3YTw",
    badge: "Best seller",
  },
  {
    title: "Cuốn đỏ chấm sốt me khách hỏi mỗi ngày",
    description: "Món cuốn đỏ chấm sốt, cay nhẹ, ăn là dễ ghiền.",
    youtubeId: "k2hlvSVa-WY",
    badge: "Món hot",
  },
];

export default function SocialVideoSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <div className="overflow-hidden rounded-[32px] bg-[#E8FFF1] p-5 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-[#00B14F] shadow-sm">
            🔥 Video món thật mỗi ngày
            </div>

            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-[#06113C] md:text-4xl">
            🎥 Xem quán làm món mỗi ngày
            </h2>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-neutral-600">
            Xem cách quán làm món, đóng đơn và những món đang được khách yêu thích nhất trước khi đặt hàng.
            </p>
          </div>

          <Link
            href="/dat-mon-nhanh"
            className="inline-flex w-fit items-center justify-center rounded-2xl bg-[#00B14F] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#00B14F]/20 transition hover:-translate-y-0.5"
          >
            Đặt món ngay
          </Link>
        </div>

        <div className="mt-6 flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible">
          {videos.map((video, index) => (
            <article
              key={video.youtubeId}
              className="min-w-[280px] overflow-hidden rounded-[28px] bg-white text-[#06113C] shadow-xl shadow-neutral-950/5 md:min-w-0"
            >
              <div className="relative aspect-[9/16] overflow-hidden bg-black">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${video.youtubeId}?rel=0&modestbranding=1&playsinline=1`}
                  title={video.title}
                  loading={index === 0 ? "eager" : "lazy"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />

                <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-[11px] font-black text-white backdrop-blur">
                  {video.badge}
                </div>
              </div>

              <div className="p-4">
                <h3 className="line-clamp-2 text-base font-black leading-6">
                  {video.title}
                </h3>

                <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-neutral-500">
                  {video.description}
                </p>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <a
                    href={`https://youtube.com/shorts/${video.youtubeId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-black text-[#00B14F]"
                  >
                    Xem trên YouTube →
                  </a>

                  <span className="rounded-full bg-[#E8FFF1] px-3 py-1 text-[11px] font-black text-[#00B14F]">
                    Shorts
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-5 rounded-2xl bg-white/70 px-4 py-3 text-xs font-bold leading-5 text-neutral-600">
        ⭐ Video được quay trực tiếp tại quán, món ăn và hình ảnh giống thực tế khi nhận hàng.
        </div>
      </div>
    </section>
  );
}