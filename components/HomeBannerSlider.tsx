"use client";

type Banner = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  button_text: string | null;
  button_link: string | null;
};

export default function HomeBannerSlider({ banners }: { banners: Banner[] }) {
  if (!banners || banners.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 md:px-8">
      <div className="flex gap-4 overflow-x-auto pb-3">
        {banners.map((banner) => (
          <a
            key={banner.id}
            href={banner.button_link || "/dat-mon-nhanh"}
            className="min-w-[86%] overflow-hidden rounded-[32px] bg-[#06113C] shadow-xl shadow-neutral-950/10 md:min-w-[520px]"
          >
            <div className="grid md:grid-cols-[1fr_1fr]">
              <div className="p-5 text-white">
                <p className="text-xs font-black uppercase text-[#00B14F]">
                  Khuyến mãi
                </p>

                <h2 className="mt-2 text-2xl font-black leading-tight">
                  {banner.title}
                </h2>

                {banner.description && (
                  <p className="mt-3 text-sm font-semibold leading-6 text-white/70">
                    {banner.description}
                  </p>
                )}

                <div className="mt-5 inline-flex rounded-2xl bg-[#00B14F] px-5 py-3 text-sm font-black text-white">
                  {banner.button_text || "Xem ngay"}
                </div>
              </div>

              <div className="h-44 bg-[#E8FFF1] md:h-full">
                <img
                  src={banner.image_url || "/images/banner-checkin.jpg"}
                  alt={banner.title}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}