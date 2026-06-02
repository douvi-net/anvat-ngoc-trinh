import Link from "next/link";
import type { Metadata } from "next";
import { products } from "@/data/products";
import SocialVideoSection from "@/components/SocialVideoSection";
import FadeUp from "@/components/FadeUp";
import HomeBannerSlider from "@/components/HomeBannerSlider";
import { supabase } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Ăn Vặt Ngọc Trinh - Đặt đồ ăn vặt Quận 6",
  description:
    "Đặt bánh tráng, ăn vặt và nước uống tại Ăn Vặt Ngọc Trinh. Giao nhanh khu vực Quận 6 và lân cận.",
};

const features = [
  "Làm món sau khi khách đặt",
  "Nhiều topping dễ chọn",
  "Giao nhanh khu vực Quận 6",
  "Món hot cập nhật mỗi ngày",
];

const areas = ["Quận 6", "Quận 5", "Quận 8", "Quận 11", "Bình Tân"];

const orderSteps = [
  {
    title: "Chọn món",
    desc: "Khách xem menu, chọn món hot hoặc món đang thèm.",
    icon: "🍽️",
  },
  {
    title: "Nhập địa chỉ",
    desc: "Điền số điện thoại, địa chỉ và ghi chú món ăn.",
    icon: "📍",
  },
  {
    title: "Quán nhận đơn",
    desc: "Điện thoại quán báo có đơn mới từ website.",
    icon: "🔔",
  },
];

const benefits = [
  "Không cần tìm quán trên app giao đồ ăn",
  "Xem món nhanh ngay trên website",
  "Theo dõi video thật từ TikTok/Facebook",
  "Chuẩn bị nâng cấp tính ship như app Be",
];

export default async function HomePage() {
  const { data: banners } = await supabase
    .from("banners")
    .select("id,title,description,image_url,button_text,button_link")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <main className="bg-white">
      <FadeUp>
        <section className="relative overflow-hidden bg-[#00B14F]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_35%)]" />

          <div className="mx-auto grid min-h-[720px] max-w-7xl gap-12 px-4 py-10 md:grid-cols-2 md:items-center md:px-8 md:py-16">
            <div className="relative z-10">
              <div className="inline-flex rounded-full bg-white px-5 py-2 text-sm font-black text-[#00B14F] shadow-xl">
                Ăn vặt Quận 6 giao nhanh
              </div>

              <h1 className="mt-6 max-w-2xl text-5xl font-black leading-[1.02] tracking-tight text-white md:text-7xl">
                Đặt đồ ăn vặt ngay trên web
              </h1>

              <p className="mt-6 max-w-xl text-lg font-bold leading-8 text-white/90">
                Bánh tráng cuốn, bánh tráng trộn, bánh tráng chấm và nước uống.
                Giao diện đặt món nhanh như app food delivery.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/dat-mon-nhanh"
                  className="rounded-2xl bg-[#06113C] px-7 py-4 text-base font-black text-white shadow-2xl shadow-[#06113C]/30"
                >
                  ĐẶT MÓN NGAY
                </Link>

                <Link
                  href="#video"
                  className="rounded-2xl bg-white px-7 py-4 text-base font-black text-[#06113C] shadow-2xl shadow-black/10"
                >
                  XEM VIDEO QUÁN
                </Link>
              </div>

              <div className="mt-10 grid max-w-xl grid-cols-2 gap-3">
                {features.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl bg-white/15 px-4 py-4 text-sm font-black text-white backdrop-blur"
                  >
                    ✓ {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10">
              <div className="relative mx-auto max-w-[560px]">
                <div className="absolute -left-4 top-10 rotate-[-10deg] rounded-[28px] bg-white p-3 shadow-2xl">
                  <div className="flex h-28 w-28 items-center justify-center rounded-[22px] bg-green-100 text-5xl">
                    🌶️
                  </div>
                </div>

                <div className="absolute right-0 top-0 rotate-[10deg] rounded-[28px] bg-white p-3 shadow-2xl">
                  <div className="flex h-28 w-28 items-center justify-center rounded-[22px] bg-yellow-100 text-5xl">
                    🧋
                  </div>
                </div>

                <div className="absolute bottom-0 left-10 rotate-[8deg] rounded-[28px] bg-white p-3 shadow-2xl">
                  <div className="flex h-28 w-28 items-center justify-center rounded-[22px] bg-orange-100 text-5xl">
                    🍟
                  </div>
                </div>

                <div className="rounded-[44px] bg-white p-5 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
                  <div className="aspect-square overflow-hidden rounded-[36px] bg-[#E8FFF1]">
                    <img
                      src="/images/hero.jpg"
                      alt="Ăn Vặt Ngọc Trinh"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <p className="mt-5 text-center text-2xl font-black text-[#06113C]">
                    Ăn Vặt Ngọc Trinh
                  </p>

                  <p className="mt-2 text-center text-sm font-bold text-neutral-500">
                    Món thật · Video thật · Đặt món nhanh
                  </p>
                </div>

                <div className="absolute bottom-10 right-4 rounded-2xl bg-[#06113C] px-5 py-3 text-sm font-black text-white shadow-2xl">
                  Đang nhận đơn 🔥
                </div>
              </div>
            </div>
          </div>
        </section>
      </FadeUp>

      <section className="relative z-20 mx-auto -mt-10 max-w-7xl px-4 md:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[28px] bg-white p-5 shadow-2xl shadow-neutral-950/10">
            <p className="text-sm font-black text-[#00B14F]">
              🔥 Quán đang nhận đơn
            </p>
            <p className="mt-2 text-3xl font-black text-[#06113C]">18 đơn</p>
            <p className="mt-2 text-sm font-semibold text-neutral-500">
              Đang xử lý realtime
            </p>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-2xl shadow-neutral-950/10">
            <p className="text-sm font-black text-[#00B14F]">
              ⏱️ Thời gian dự kiến
            </p>
            <p className="mt-2 text-3xl font-black text-[#06113C]">
              20-25 phút
            </p>
            <p className="mt-2 text-sm font-semibold text-neutral-500">
              Tùy khu vực giao hàng
            </p>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-2xl shadow-neutral-950/10">
            <p className="text-sm font-black text-[#00B14F]">
              ⭐ Đánh giá khách
            </p>
            <p className="mt-2 text-3xl font-black text-[#06113C]">4.9/5</p>
            <p className="mt-2 text-sm font-semibold text-neutral-500">
              Từ khách hàng gần khu vực
            </p>
          </div>
        </div>
      </section>

      <HomeBannerSlider banners={banners || []} />

      <section id="menu" className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-[#00B14F]">
              Menu nổi bật
            </p>

            <h2 className="mt-2 text-4xl font-black tracking-tight text-[#06113C]">
              Món bán chạy
            </h2>
          </div>

          <Link
            href="/dat-mon-nhanh"
            className="hidden rounded-full bg-[#00B14F] px-5 py-3 text-sm font-black text-white md:block"
          >
            Xem tất cả
          </Link>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((item) => (
            <div
              key={item.name}
              className="group rounded-[32px] border border-black/5 bg-white p-4 shadow-xl shadow-neutral-950/5 transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="overflow-hidden rounded-[26px] bg-[#E8FFF1]">
                <img
                  src={item.image || "/images/hero.jpg"}
                  alt={item.name}
                  className="h-44 w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="rounded-full bg-[#E8FFF1] px-3 py-1 text-[11px] font-black text-[#00B14F]">
                  {item.badge}
                </span>
              </div>

              <h3 className="mt-4 text-lg font-black tracking-tight text-[#06113C]">
                {item.name}
              </h3>

              <p className="mt-1 text-xl font-black text-[#00B14F]">
                {item.price.toLocaleString("vi-VN")}đ
              </p>

              <p className="mt-2 min-h-12 text-sm font-semibold leading-6 text-neutral-600">
                {item.description}
              </p>

              <Link
                href="/dat-mon-nhanh"
                className="mt-4 block w-full rounded-2xl bg-[#06113C] px-4 py-3 text-center text-sm font-black text-white transition hover:bg-[#0d1c57]"
              >
                Đặt món
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="font-black text-[#00B14F]">Quy trình đặt món</p>

            <h2 className="mt-3 text-4xl font-black leading-tight text-[#06113C]">
              Đặt món nhanh như app, nhưng là web riêng của quán
            </h2>

            <p className="mt-4 text-sm font-semibold leading-7 text-neutral-600">
              Khách chọn món trên website, quán nhận đơn realtime trong Admin
              POS.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {orderSteps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-[32px] bg-[#F5FFF8] p-5 shadow-xl shadow-neutral-950/5"
              >
                <div className="text-5xl">{step.icon}</div>

                <p className="mt-5 text-sm font-black text-[#00B14F]">
                  Bước 0{index + 1}
                </p>

                <h3 className="mt-2 text-xl font-black text-[#06113C]">
                  {step.title}
                </h3>

                <p className="mt-2 text-sm font-semibold leading-6 text-neutral-600">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="rounded-[40px] bg-[#E8FFF1] p-8 md:p-12">
          <p className="font-black text-[#00B14F]">Điểm mạnh của website</p>

          <h2 className="mt-3 text-4xl font-black text-[#06113C]">
            Biến traffic TikTok/Facebook thành đơn hàng riêng
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {benefits.map((item) => (
              <div
                key={item}
                className="rounded-[28px] bg-white p-5 font-black leading-7 text-[#06113C] shadow-lg shadow-neutral-950/5"
              >
                ✓ {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div id="video">
        <SocialVideoSection />
      </div>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="rounded-[40px] bg-[#06113C] p-8 text-white md:p-12">
          <p className="font-black text-[#00B14F]">Vì sao khách thích?</p>

          <h2 className="mt-3 text-4xl font-black leading-tight">
            Quán làm món liên tục mỗi ngày 😭
          </h2>

          <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-white/70">
            Video thật, món thật, quy trình thật. Website được thiết kế để khách
            xem món nhanh hơn và đặt món dễ hơn.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {features.map((item) => (
              <div
                key={item}
                className="rounded-[28px] bg-white/10 p-5 font-black backdrop-blur"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-black text-[#00B14F]">Khu vực giao hàng</p>

            <h2 className="mt-2 text-4xl font-black text-[#06113C]">
              Giao gần khu vực
            </h2>
          </div>

          <div className="flex flex-wrap gap-3">
            {areas.map((area) => (
              <div
                key={area}
                className="rounded-full bg-[#E8FFF1] px-5 py-3 text-sm font-black text-[#00B14F]"
              >
                {area}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="overflow-hidden rounded-[40px] bg-[#00B14F] p-8 text-white">
            <p className="font-black">Combo hot</p>

            <h2 className="mt-3 text-4xl font-black">Combo ăn vặt 😭</h2>

            <p className="mt-4 max-w-md text-sm font-bold leading-7 text-white/90">
              Bánh tráng + nước uống + topping.
            </p>

            <Link
              href="/dat-mon-nhanh"
              className="mt-6 inline-flex rounded-2xl bg-[#06113C] px-6 py-4 font-black text-white"
            >
              Xem combo
            </Link>
          </div>

          <div className="overflow-hidden rounded-[40px] bg-[#06113C] p-8 text-white">
            <p className="font-black text-[#00B14F]">Món mới</p>

            <h2 className="mt-3 text-4xl font-black">
              Cuốn đỏ chấm me 🔥
            </h2>

            <p className="mt-4 max-w-md text-sm font-bold leading-7 text-white/70">
              Món khách hỏi nhiều nhất gần đây.
            </p>

            <Link
              href="/dat-mon-nhanh"
              className="mt-6 inline-flex rounded-2xl bg-white px-6 py-4 font-black text-[#06113C]"
            >
              Xem món
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-8">
        <div className="overflow-hidden rounded-[40px] bg-[#00B14F] p-8 text-white md:p-14">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <p className="font-black text-[#06113C]">Website đặt món riêng</p>

              <h2 className="mt-3 text-4xl font-black leading-tight">
                Đặt món trực tiếp tại web 😭
              </h2>

              <p className="mt-4 max-w-xl text-sm font-bold leading-7 text-white/90">
                Không cần nhắn Zalo. Khách chọn món trực tiếp trên website,
                quán nhận thông báo đơn hàng ngay trên điện thoại.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 md:justify-end">
              <Link
                href="/dat-mon-nhanh"
                className="rounded-2xl bg-[#06113C] px-7 py-4 font-black text-white shadow-2xl"
              >
                ĐẶT HÀNG NGAY
              </Link>

              <Link
                href="/dat-mon-nhanh"
                className="rounded-2xl bg-white px-7 py-4 font-black text-[#06113C]"
              >
                XEM MENU
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}