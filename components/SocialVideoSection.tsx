import Link from "next/link";

const videos = [
  {
    title: "POV: khách thấy 1 món, tụi mình thấy 20 bill 😵",
    platform: "TikTok",
    url: "https://www.tiktok.com/@trungvts",
  },
  {
    title: "Một ngày làm bánh tráng ở quán ăn vặt Quận 6",
    platform: "Facebook",
    url: "https://www.facebook.com/",
  },
  {
    title: "Cuốn đỏ mỡ hành khách hỏi mỗi ngày",
    platform: "YouTube",
    url: "https://www.youtube.com/",
  },
];

export default function SocialVideoSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <div className="rounded-[40px] bg-[#E8FFF1] p-5 md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-[#00B14F]">
              Video thật từ quán
            </p>
            <h2 className="mt-2 text-4xl font-black tracking-tight text-[#06113C]">
              Xem quán làm món mỗi ngày
            </h2>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-neutral-600">
              TikTok, Facebook và YouTube là nơi quán đăng video POV làm món,
              bill nổ đơn và các món đang được khách hỏi nhiều.
            </p>
          </div>

          <Link
            href="/dat-mon-nhanh"
            className="w-fit rounded-2xl bg-[#00B14F] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#00B14F]/20"
          >
            Đặt hàng trên web
          </Link>
        </div>

        <div className="mt-7 flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible">
          {videos.map((video) => (
            <a
              key={video.title}
              href={video.url}
              target="_blank"
              rel="noreferrer"
              className="min-w-[260px] rounded-[32px] bg-white p-3 text-[#06113C] shadow-xl shadow-neutral-950/5 md:min-w-0"
            >
              <div className="flex aspect-[9/16] items-center justify-center rounded-[26px] bg-gradient-to-br from-[#00B14F] to-[#E8FFF1] text-center">
                <div className="px-4">
                  <p className="text-6xl">▶️</p>
                  <p className="mt-4 text-sm font-black text-white">
                    {video.platform}
                  </p>
                  <p className="mt-2 text-xs font-bold text-white/80">
                    Thêm link video thật tại đây
                  </p>
                </div>
              </div>

              <h3 className="mt-4 line-clamp-2 text-base font-black leading-6">
                {video.title}
              </h3>

              <p className="mt-2 text-sm font-black text-[#00B14F]">
                Xem video →
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}