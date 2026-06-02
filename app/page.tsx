/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { Metadata } from "next";
import { products } from "@/data/products";
import SocialVideoSection from "@/components/SocialVideoSection";
import FadeUp from "@/components/FadeUp";
import HomeBannerSlider from "@/components/HomeBannerSlider";
import { supabase } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Ăn Vặt Ngọc Trinh - Đặt bánh tráng, ăn vặt Quận 6",
  description:
    "Đặt bánh tráng cuốn, bánh tráng trộn, cuốn đỏ sốt me và nước uống tại Ăn Vặt Ngọc Trinh. Giao nhanh khu vực Quận 6 và lân cận.",
};

const features = [
  "Món làm sau khi khách đặt",
  "Xem phí ship rõ trước khi đặt",
  "Ưu đãi tự động như app giao đồ ăn",
  "Quán nhận đơn trực tiếp trên hệ thống",
];

const areas = ["Quận 6", "Quận 5", "Quận 8", "Quận 11", "Bình Tân"];

const orderSteps = [
  {
    title: "Chọn món đang thèm",
    desc: "Xem menu, hình món, giá và thêm topping nếu muốn.",
    icon: "🍽️",
  },
  {
    title: "Nhập địa chỉ giao",
    desc: "Điền số điện thoại, địa chỉ, độ cay và ghi chú riêng.",
    icon: "📍",
  },
  {
    title: "Quán nhận đơn liền",
    desc: "Đơn được gửi về hệ thống để quán chuẩn bị nhanh hơn.",
    icon: "🔔",
  },
];

const trustItems = [
  "Hình thật, món thật từ quán",
  "Có video món ăn để khách xem trước",
  "Không cần nhắn tin hỏi giá từng món",
  "Đặt món trực tiếp trên website",
];

const hotTags = [
  "Bánh tráng trộn",
  "Cuốn đỏ sốt me",
  "Bánh tráng chấm",
  "Trà sữa",
  "Ăn vặt Quận 6",
  "Giao món gần đây",
];

export default async function HomePage() {
  const { data: banners } = await supabase
    .from("banners")
    .select("id,title,description,image_url,button_text,button_link")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const hotProducts = products.slice(0, 8);

  return (
    <main className="overflow-hidden bg-[#FFFDF7]">
      <FadeUp>
        <section className="relative overflow-hidden bg-[#00B14F]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_35%)]" />
          <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

          <div className="relative mx-auto grid min-h-[740px] max-w-7xl gap-12 px-4 py-10 md:grid-cols-2 md:items-center md:px-8 md:py-16">
            <div>
              <div className="inline-flex rounded-full bg-white px-5 py-2 text-sm font-black text-[#00B14F] shadow-xl">
                🔥 Ăn vặt Quận 6 đang nhận đơn
              </div>

              <h1 className="mt-6 max-w-2xl text-5xl font-black leading-[1.03] tracking-tight text-white md:text-7xl">
                Đang thèm bánh tráng?
                <br />
                Đặt liền cho nóng.
              </h1>

              <p className="mt-6 max-w-xl text-lg font-bold leading-8 text-white/90">
                Bánh tráng cuốn, cuốn đỏ chấm sốt me, bánh tráng trộn và nước
                uống được làm mới sau khi khách đặt. Xem món, chọn topping, biết
                phí ship và đặt trực tiếp trên website.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/dat-mon-nhanh"
                  className="rounded-2xl bg-[#06113C] px-7 py-4 text-base font-black text-white shadow-2xl shadow-[#06113C]/30 transition hover:-translate-y-1"
                >
                  ĐẶT MÓN NGAY
                </Link>

                <Link
                  href="#menu"
                  className="rounded-2xl bg-white px-7 py-4 text-base font-black text-[#06113C] shadow-2xl shadow-black/10 transition hover:-translate-y-1"
                >
                  XEM MÓN HOT
                </Link>
              </div>

              <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/15 p-4 text-white backdrop-blur">
                  <p className="text-2xl font-black">4.9/5</p>
                  <p className="mt-1 text-xs font-bold text-white/80">
                    Khách đánh giá
                  </p>
                </div>

                <div className="rounded-2xl bg-white/15 p-4 text-white backdrop-blur">
                  <p className="text-2xl font-black">20-25p</p>
                  <p className="mt-1 text-xs font-bold text-white/80">
                    Dự kiến giao gần
                  </p>
                </div>

                <div className="rounded-2xl bg-white/15 p-4 text-white backdrop-blur">
                  <p className="text-2xl font-black">11h-22h</p>
                  <p className="mt-1 text-xs font-bold text-white/80">
                    Thời gian nhận đơn
                  </p>
                </div>
              </div>

              <div className="mt-6 grid max-w-xl grid-cols-2 gap-3">
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

            <div className="relative">
              <div className="absolute -left-4 top-12 rotate-[-10deg] rounded-[28px] bg-white p-3 shadow-2xl">
                <div className="flex h-24 w-24 items-center justify-center rounded-[22px] bg-orange-100 text-5xl">
                  🌶️
                </div>
              </div>

              <div className="absolute right-0 top-0 rotate-[10deg] rounded-[28px] bg-white p-3 shadow-2xl">
                <div className="flex h-24 w-24 items-center justify-center rounded-[22px] bg-yellow-100 text-5xl">
                  🧋
                </div>
              </div>

              <div className="rounded-[44px] bg-white p-5 shadow-[0_30px_100px_rgba(0,0,0,0.28)]">
                <div className="aspect-square overflow-hidden rounded-[36px] bg-[#E8FFF1]">
                  <img
                    src="/images/hero.jpg"
                    alt="Ăn Vặt Ngọc Trinh"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="mt-5 flex items-center justify-between rounded-3xl bg-[#FFF7E8] p-4">
                  <div>
                    <p className="text-sm font-black text-neutral-500">
                      Món khách hay đặt
                    </p>
                    <p className="text-2xl font-black text-[#06113C]">
                      Cuốn đỏ sốt me
                    </p>
                  </div>

                  <Link
                    href="/dat-mon-nhanh"
                    className="rounded-2xl bg-[#00B14F] px-5 py-3 text-sm font-black text-white"
                  >
                    Đặt
                  </Link>
                </div>
              </div>

              <div className="absolute bottom-8 right-4 rounded-2xl bg-[#06113C] px-5 py-3 text-sm font-black text-white shadow-2xl">
                Vừa có khách đặt 🔥
              </div>
            </div>
          </div>
        </section>
      </FadeUp>

      <section className="relative z-20 mx-auto -mt-12 max-w-7xl px-4 md:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[28px] bg-white p-6 shadow-2xl shadow-neutral-950/10">
            <p className="text-sm font-black text-[#00B14F]">
              🔥 Món đang được hỏi nhiều
            </p>
            <p className="mt-2 text-3xl font-black text-[#06113C]">
              Cuốn đỏ sốt me
            </p>
            <p className="mt-2 text-sm font-semibold text-neutral-500">
              Chấm sốt me, cay nhẹ, ăn rất cuốn.
            </p>
          </div>

          <div className="rounded-[28px] bg-white p-6 shadow-2xl shadow-neutral-950/10">
            <p className="text-sm font-black text-[#00B14F]">
              🎁 Ưu đãi tự động
            </p>
            <p className="mt-2 text-3xl font-black text-[#06113C]">
              Tự áp dụng
            </p>
            <p className="mt-2 text-sm font-semibold text-neutral-500">
              Đủ điều kiện là hệ thống tự giảm.
            </p>
          </div>

          <div className="rounded-[28px] bg-white p-6 shadow-2xl shadow-neutral-950/10">
            <p className="text-sm font-black text-[#00B14F]">
              🛵 Khu vực giao
            </p>
            <p className="mt-2 text-3xl font-black text-[#06113C]">
              Quận 6+
            </p>
            <p className="mt-2 text-sm font-semibold text-neutral-500">
              Hỗ trợ các khu vực lân cận.
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
              Món khách hay gọi nhất hôm nay
            </h2>

            <p className="mt-3 max-w-2xl font-semibold leading-7 text-neutral-600">
              Không biết ăn gì thì chọn mấy món này trước. Đây là nhóm món dễ
              gọi, dễ ăn và khách quay lại mua nhiều.
            </p>
          </div>

          <Link
            href="/dat-mon-nhanh"
            className="hidden rounded-full bg-[#00B14F] px-5 py-3 text-sm font-black text-white md:block"
          >
            Xem tất cả món
          </Link>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {hotProducts.map((item) => (
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

              <div className="mt-4">
                <span className="rounded-full bg-[#E8FFF1] px-3 py-1 text-[11px] font-black text-[#00B14F]">
                  {item.badge || "Món hot"}
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
                className="mt-5 block rounded-2xl bg-[#06113C] px-4 py-3 text-center text-sm font-black text-white transition hover:bg-[#0d1c57]"
              >
                Thêm vào đơn
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-[#00B14F]">
                Vì sao nên đặt trên website?
              </p>

              <h2 className="mt-2 text-4xl font-black tracking-tight text-[#06113C]">
                Không cần nhắn tin hỏi giá, không cần chờ quán trả lời
              </h2>

              <p className="mt-4 font-semibold leading-8 text-neutral-600">
                Khách tự xem món, tự thêm topping, tự nhập địa chỉ và gửi đơn.
                Quán nhận thông báo đơn hàng để chuẩn bị nhanh hơn, hạn chế
                thiếu món hoặc ghi chú bị trôi tin nhắn.
              </p>

              <div className="mt-8 grid gap-4">
                {orderSteps.map((step, index) => (
                  <div
                    key={step.title}
                    className="rounded-[28px] border border-black/5 bg-[#FFFDF7] p-5"
                  >
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#00B14F] text-2xl">
                        {step.icon}
                      </div>

                      <div>
                        <p className="text-xs font-black uppercase text-[#00B14F]">
                          Bước 0{index + 1}
                        </p>
                        <h3 className="mt-1 text-lg font-black text-[#06113C]">
                          {step.title}
                        </h3>
                        <p className="mt-1 text-sm font-semibold leading-6 text-neutral-600">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[44px] bg-[#06113C] p-6 text-white shadow-2xl">
              <p className="text-sm font-black text-[#00B14F]">
                Gợi ý hôm nay
              </p>

              <h3 className="mt-3 text-4xl font-black">
                Đi một mình đặt 1 phần, đi chung đặt combo cho đã
              </h3>

              <p className="mt-4 font-semibold leading-8 text-white/75">
                Một phần bánh tráng cuốn thêm sốt me, thêm topping, thêm nước
                uống là đủ giải quyết cơn thèm ăn vặt trong ngày.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {hotTags.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-white/10 px-4 py-2 text-sm font-black"
                  >
                    #{item}
                  </span>
                ))}
              </div>

              <Link
                href="/dat-mon-nhanh"
                className="mt-8 inline-flex rounded-2xl bg-[#00B14F] px-7 py-4 font-black text-white"
              >
                Xem menu ngay
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="rounded-[44px] bg-[#E8FFF1] p-8 md:p-12">
          <p className="text-sm font-black uppercase tracking-wide text-[#00B14F]">
            Tạo cảm giác tin trước khi đặt
          </p>

          <h2 className="mt-3 text-4xl font-black tracking-tight text-[#06113C]">
            Khách ở lại lâu hơn khi thấy món thật, video thật và đơn thật
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {trustItems.map((item) => (
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

      <section id="video" className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="mb-8">
          <p className="text-sm font-black uppercase tracking-wide text-[#00B14F]">
            Video thật từ quán
          </p>

          <h2 className="mt-2 text-4xl font-black tracking-tight text-[#06113C]">
            Xem quán làm món trước khi đặt
          </h2>

          <p className="mt-3 max-w-2xl font-semibold leading-7 text-neutral-600">
            Video giúp khách biết món trông như thế nào, cách quán làm ra sao
            và dễ quyết định đặt hơn.
          </p>
        </div>

        <SocialVideoSection />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="overflow-hidden rounded-[40px] bg-[#00B14F] p-8 text-white">
            <p className="font-black text-[#06113C]">Đang không biết ăn gì?</p>

            <h2 className="mt-3 text-4xl font-black">
              Thử cuốn đỏ chấm sốt me
            </h2>

            <p className="mt-4 max-w-md text-sm font-bold leading-7 text-white/90">
              Vị chua ngọt, cay nhẹ, ăn cuốn. Món này hợp để ăn xế, ăn tối hoặc
              đặt chung với bạn bè.
            </p>

            <Link
              href="/dat-mon-nhanh"
              className="mt-6 inline-flex rounded-2xl bg-[#06113C] px-6 py-4 font-black text-white"
            >
              Đặt thử món này
            </Link>
          </div>

          <div className="overflow-hidden rounded-[40px] bg-[#06113C] p-8 text-white">
            <p className="font-black text-[#00B14F]">Mua cho nhóm</p>

            <h2 className="mt-3 text-4xl font-black">
              Chọn nhiều món ăn cho đã
            </h2>

            <p className="mt-4 max-w-md text-sm font-bold leading-7 text-white/70">
              Bánh tráng, nước uống, topping và ghi chú riêng từng món. Khách
              đặt rõ, quán làm dễ hơn.
            </p>

            <Link
              href="/dat-mon-nhanh"
              className="mt-6 inline-flex rounded-2xl bg-white px-6 py-4 font-black text-[#06113C]"
            >
              Xem menu đầy đủ
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-black text-[#00B14F]">Khu vực giao hàng</p>

            <h2 className="mt-2 text-4xl font-black text-[#06113C]">
              Giao gần khu vực Quận 6 và lân cận
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

      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-8">
        <div className="overflow-hidden rounded-[44px] bg-[#00B14F] p-8 text-center text-white shadow-2xl md:p-14">
          <p className="text-sm font-black uppercase tracking-wide text-white/80">
            Đang thèm thì đặt liền
          </p>

          <h2 className="mx-auto mt-3 max-w-3xl text-4xl font-black tracking-tight md:text-5xl">
            Đừng chỉ xem hình. Đặt một phần trước đã.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl font-semibold leading-8 text-white/85">
            Nếu hợp vị thì mai ghé tiếp. Website nhận đơn trực tiếp, xem phí
            ship rõ ràng và tự áp dụng ưu đãi khi đủ điều kiện.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/dat-mon-nhanh"
              className="rounded-2xl bg-[#06113C] px-8 py-4 text-base font-black text-white shadow-xl"
            >
              ĐẶT MÓN NGAY
            </Link>

            <Link
              href="#menu"
              className="rounded-2xl bg-white px-8 py-4 text-base font-black text-[#06113C] shadow-xl"
            >
              XEM MÓN HOT
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}