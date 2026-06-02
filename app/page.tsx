/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { Metadata } from "next";
import { products } from "@/data/products";
import SocialVideoSection from "@/components/SocialVideoSection";

export const metadata: Metadata = {
  title: "Ăn Vặt Ngọc Trinh - Bánh tráng, ăn vặt Quận 6 giao nhanh",
  description:
    "Đặt bánh tráng trộn, cuốn đỏ sốt me, bánh tráng cuốn và nước uống tại Ăn Vặt Ngọc Trinh. Giao nhanh khu vực Quận 6 và lân cận.",
};

const areas = ["Quận 6", "Quận 5", "Quận 8", "Quận 11", "Bình Tân"];

const benefits = [
  "Xem giá rõ",
  "Chọn topping",
  "Tự tính phí ship",
  "Ưu đãi tự động",
];

export default function HomePage() {
  const hotProducts = products.slice(0, 6);

  return (
    <main className="overflow-hidden bg-[#FFFDF7]">
      <section className="bg-[#00B14F] px-4 py-6 md:py-8">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 md:items-center">
          <div>
            <div className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-black text-[#00B14F] shadow">
              🔥 Ăn vặt Quận 6 đang nhận đơn
            </div>

            <h1 className="mt-4 text-4xl font-black leading-tight text-white md:text-6xl">
              Đang thèm!
              <br />
              Đặt món liền.
            </h1>

            <p className="mt-4 max-w-xl text-base font-bold leading-7 text-white/90">
              Bánh tráng trộn, bánh tráng cuốn, cuốn đỏ chấm sốt me và nước
              uống được làm mới mỗi ngày. Xem món, chọn topping, biết phí ship
              và đặt trực tiếp trên website.
            </p>

            <div className="mt-5 flex gap-3">
              <Link
                href="/dat-mon-nhanh"
                className="rounded-2xl bg-[#06113C] px-5 py-3 text-sm font-black text-white shadow-xl"
              >
                ĐẶT MÓN NGAY
              </Link>

              <Link
                href="#menu"
                className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#06113C] shadow-xl"
              >
                XEM MENU
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 text-sm font-black text-white md:grid-cols-4">
              <div className="rounded-2xl bg-white/15 p-3">✓ Món làm mới</div>
              <div className="rounded-2xl bg-white/15 p-3">✓ Rõ giá</div>
              <div className="rounded-2xl bg-white/15 p-3">✓ Rõ phí ship</div>
              <div className="rounded-2xl bg-white/15 p-3">✓ Đặt nhanh</div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[28px] bg-white p-3 shadow-2xl">
              <div className="aspect-square overflow-hidden rounded-[22px] bg-[#E8FFF1]">
                <img
                  src="/images/hero.png"
                  alt="Bánh tráng Ăn Vặt Ngọc Trinh"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="mt-3 flex items-center justify-between rounded-2xl bg-[#FFF7E8] p-3">
                <div>
                  <p className="text-xs font-black text-neutral-500">
                    Món khách hay đặt
                  </p>
                  <p className="text-lg font-black text-[#06113C]">
                    Cuốn đỏ sốt me
                  </p>
                </div>

                <Link
                  href="/dat-mon-nhanh"
                  className="rounded-xl bg-[#00B14F] px-4 py-2 text-xs font-black text-white"
                >
                  Đặt
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="menu" className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-[#00B14F]">
              Menu nổi bật
            </p>
            <h2 className="mt-1 text-3xl font-black text-[#06113C]">
              Món bán chạy hôm nay
            </h2>
          </div>

          <Link
            href="/dat-mon-nhanh"
            className="rounded-full bg-[#00B14F] px-4 py-2 text-xs font-black text-white"
          >
            Xem tất cả
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {hotProducts.map((item) => (
            <div
              key={item.name}
              className="rounded-3xl bg-white p-3 shadow-lg shadow-neutral-950/5"
            >
              <div className="overflow-hidden rounded-2xl bg-[#E8FFF1]">
                <img
                  src={item.image || "/images/hero.jpg"}
                  alt={item.name}
                  className="h-32 w-full object-cover md:h-44"
                />
              </div>

              <h3 className="mt-3 line-clamp-2 text-sm font-black leading-5 text-[#06113C] md:text-base">
                {item.name}
              </h3>

              <p className="mt-1 text-base font-black text-[#00B14F]">
                {item.price.toLocaleString("vi-VN")}đ
              </p>

              <Link
                href="/dat-mon-nhanh"
                className="mt-3 block rounded-2xl bg-[#06113C] px-3 py-2 text-center text-xs font-black text-white"
              >
                Đặt món
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5">
          <p className="text-xs font-black uppercase text-[#00B14F]">
            Đặt món dễ hơn
          </p>

          <h2 className="mt-1 text-3xl font-black leading-tight text-[#06113C]">
            Đặt nhanh như app giao đồ ăn
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {benefits.map((item) => (
              <div
                key={item}
                className="rounded-2xl bg-[#E8FFF1] p-4 text-sm font-black text-[#06113C]"
              >
                ✓ {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="video" className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-4">
          <p className="text-xs font-black uppercase text-[#00B14F]">
            Video thực tế
          </p>

          <h2 className="mt-1 text-3xl font-black text-[#06113C]">
            Xem quán làm món trước khi đặt
          </h2>

          <p className="mt-2 text-sm font-semibold leading-6 text-neutral-600">
            Video thật giúp khách dễ chọn món và yên tâm hơn khi đặt.
          </p>
        </div>

        <SocialVideoSection />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="rounded-[28px] bg-[#E8FFF1] p-5">
          <p className="text-xs font-black uppercase text-[#00B14F]">
            Khu vực giao hàng
          </p>

          <h2 className="mt-1 text-2xl font-black text-[#06113C]">
            Giao gần khu vực Quận 6 và lân cận
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            {areas.map((area) => (
              <span
                key={area}
                className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#00B14F]"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-[28px] bg-[#00B14F] p-6 text-center text-white">
          <p className="text-xs font-black uppercase text-white/80">
            Đang thèm thì đặt liền
          </p>

          <h2 className="mt-2 text-3xl font-black leading-tight">
            Đặt một phần trước đã 😋
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm font-bold leading-6 text-white/85">
            Xem menu, chọn món và gửi đơn ngay trên website. Ưu đãi được tự
            động áp dụng khi đủ điều kiện.
          </p>

          <Link
            href="/dat-mon-nhanh"
            className="mt-5 inline-flex rounded-2xl bg-[#06113C] px-6 py-3 text-sm font-black text-white"
          >
            ĐẶT MÓN NGAY
          </Link>
        </div>
      </section>
    </main>
  );
}