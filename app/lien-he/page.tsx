import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Liên hệ",
  description:
    "Liên hệ Ăn Vặt Ngọc Trinh để đặt món, hỏi khu vực giao hàng, thời gian mở cửa và theo dõi các kênh mạng xã hội của quán.",
};

const phone = "0392496220";
const zaloLink = `https://zalo.me/${phone}`;

export default function LienHePage() {
  return (
    <main className="bg-white">
      <section className="relative overflow-hidden bg-[#00B14F] px-4 py-16 text-white md:px-8 md:py-20">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-white/10" />

        <div className="relative mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <p className="inline-flex rounded-full bg-white px-5 py-2 text-sm font-black text-[#00B14F]">
              Liên hệ Ăn Vặt Ngọc Trinh
            </p>

            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-tight md:text-7xl">
              Cần hỗ trợ đặt món?
            </h1>

            <p className="mt-5 max-w-2xl text-lg font-bold leading-8 text-white/90">
              Khách có thể gọi, nhắn Zalo hoặc đặt món trực tiếp trên website.
              Quán hỗ trợ bánh tráng, nước uống và ăn vặt khu vực Quận 6.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={`tel:${phone}`}
                className="rounded-2xl bg-white px-6 py-4 text-center text-sm font-black text-[#00B14F] shadow-xl shadow-black/10"
              >
                ☎️ Gọi ngay
              </a>

              <a
                href={zaloLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl bg-[#06113C] px-6 py-4 text-center text-sm font-black text-white shadow-xl shadow-black/10"
              >
                💬 Nhắn Zalo
              </a>

              <Link
                href="/dat-mon-nhanh"
                className="rounded-2xl bg-white/15 px-6 py-4 text-center text-sm font-black text-white ring-1 ring-white/30"
              >
                🛒 Đặt món
              </Link>
            </div>
          </div>

          <div className="rounded-[36px] bg-white p-6 text-[#06113C] shadow-2xl shadow-black/15">
            <p className="text-sm font-black text-[#00B14F]">Thông tin nhanh</p>

            <div className="mt-5 space-y-4">
              <div className="rounded-[28px] bg-[#F5FFF8] p-5">
                <p className="text-sm font-bold text-neutral-500">Hotline</p>
                <a
                  href={`tel:${phone}`}
                  className="mt-1 block text-3xl font-black text-[#06113C]"
                >
                  {phone}
                </a>
              </div>

              <div className="rounded-[28px] bg-[#F5FFF8] p-5">
                <p className="text-sm font-bold text-neutral-500">Khu vực phục vụ</p>
                <p className="mt-1 text-xl font-black text-[#06113C]">
                  Quận 6 và khu vực lân cận
                </p>
              </div>

              <div className="rounded-[28px] bg-[#F5FFF8] p-5">
                <p className="text-sm font-bold text-neutral-500">Hình thức</p>
                <p className="mt-1 text-xl font-black text-[#06113C]">
                  Đặt trước · Giao hàng · Ghé lấy
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          <a
            href={`tel:${phone}`}
            className="rounded-[32px] bg-[#E8FFF1] p-6 transition hover:-translate-y-1 hover:shadow-xl"
          >
            <p className="text-4xl">☎️</p>
            <h2 className="mt-4 text-xl font-black text-[#06113C]">Gọi quán</h2>
            <p className="mt-2 text-lg font-black text-[#00B14F]">{phone}</p>
            <p className="mt-2 text-sm font-bold leading-6 text-neutral-600">
              Phù hợp khi khách cần hỏi món, hỏi thời gian làm món hoặc đặt trước.
            </p>
          </a>

          <a
            href={zaloLink}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[32px] bg-[#E8FFF1] p-6 transition hover:-translate-y-1 hover:shadow-xl"
          >
            <p className="text-4xl">💬</p>
            <h2 className="mt-4 text-xl font-black text-[#06113C]">Nhắn Zalo</h2>
            <p className="mt-2 text-lg font-black text-[#00B14F]">Zalo quán</p>
            <p className="mt-2 text-sm font-bold leading-6 text-neutral-600">
              Gửi địa chỉ, hình món hoặc đặt món nhanh qua Zalo nếu cần hỗ trợ thêm.
            </p>
          </a>

          <Link
            href="/dat-mon-nhanh"
            className="rounded-[32px] bg-[#E8FFF1] p-6 transition hover:-translate-y-1 hover:shadow-xl"
          >
            <p className="text-4xl">🛒</p>
            <h2 className="mt-4 text-xl font-black text-[#06113C]">Đặt món online</h2>
            <p className="mt-2 text-lg font-black text-[#00B14F]">Menu trên web</p>
            <p className="mt-2 text-sm font-bold leading-6 text-neutral-600">
              Chọn món, topping, độ cay, áp dụng ưu đãi và theo dõi đơn trực tiếp.
            </p>
          </Link>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[40px] bg-[#06113C] p-8 text-white md:p-10">
            <p className="font-black text-[#00B14F]">Theo dõi quán</p>

            <h2 className="mt-3 text-4xl font-black leading-tight">
              Cập nhật món hot, video thật và ưu đãi mỗi ngày
            </h2>

            <p className="mt-4 text-sm font-medium leading-7 text-white/70">
              Ăn Vặt Ngọc Trinh thường xuyên cập nhật video món mới, POV làm món,
              feedback khách hàng và chương trình ưu đãi trên các nền tảng mạng xã hội.
            </p>

            <div className="mt-6 grid gap-3">
              <a
                href="https://www.facebook.com/anvatngoctrinhq1"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl bg-white/10 px-5 py-4 text-sm font-black text-white ring-1 ring-white/10"
              >
                Facebook Ăn Vặt Ngọc Trinh →
              </a>

              <a
                href="https://www.tiktok.com/@anvatngoctrinh"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl bg-white/10 px-5 py-4 text-sm font-black text-white ring-1 ring-white/10"
              >
                TikTok của quán →
              </a>

              <a
                href="https://www.youtube.com/@anvatngoctrinh"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl bg-white/10 px-5 py-4 text-sm font-black text-white ring-1 ring-white/10"
              >
                YouTube Shorts →
              </a>
            </div>
          </div>

          <div className="rounded-[40px] bg-[#F5FFF8] p-8 md:p-10">
            <p className="font-black text-[#00B14F]">Câu hỏi thường gặp</p>

            <div className="mt-6 space-y-4">
              <div className="rounded-[28px] bg-white p-5 shadow-sm">
                <h3 className="text-lg font-black text-[#06113C]">
                  Quán có nhận đặt trước không?
                </h3>
                <p className="mt-2 text-sm font-bold leading-6 text-neutral-600">
                  Có. Khách có thể đặt trước qua website, gọi hotline hoặc nhắn Zalo để quán chuẩn bị món.
                </p>
              </div>

              <div className="rounded-[28px] bg-white p-5 shadow-sm">
                <h3 className="text-lg font-black text-[#06113C]">
                  Có giao hàng khu vực nào?
                </h3>
                <p className="mt-2 text-sm font-bold leading-6 text-neutral-600">
                  Quán ưu tiên khu vực Quận 6 và lân cận. Phí ship sẽ được tính theo khoảng cách và ưu đãi hiện có.
                </p>
              </div>

              <div className="rounded-[28px] bg-white p-5 shadow-sm">
                <h3 className="text-lg font-black text-[#06113C]">
                  Có thể chọn topping và độ cay không?
                </h3>
                <p className="mt-2 text-sm font-bold leading-6 text-neutral-600">
                  Có. Khi đặt món trên website, khách có thể chọn topping, độ cay và ghi chú riêng cho từng món.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}