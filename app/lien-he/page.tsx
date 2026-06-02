import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Liên hệ",
  description:
    "Liên hệ Ăn Vặt Ngọc Trinh để hỏi món, khu vực giao hàng và thông tin đặt món.",
};
export default function LienHePage() {
    return (
      <main className="bg-white">
        <section className="bg-[#00B14F] px-4 py-16 text-white md:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="inline-flex rounded-full bg-white px-5 py-2 text-sm font-black text-[#00B14F]">
              Liên hệ quán
            </p>
            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-tight md:text-7xl">
              Cần hỗ trợ đặt món?
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-bold leading-8 text-white/90">
              Khách có thể liên hệ quán để hỏi món, khu vực giao hàng hoặc theo dõi các kênh video của Ăn Vặt Ngọc Trinh.
            </p>
          </div>
        </section>
  
        <section className="mx-auto max-w-7xl px-4 py-14 md:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-[32px] bg-[#E8FFF1] p-6">
              <p className="text-4xl">☎️</p>
              <h2 className="mt-4 text-xl font-black text-[#06113C]">Hotline</h2>
              <p className="mt-2 text-lg font-black text-[#00B14F]">0392496220</p>
            </div>
  
            <div className="rounded-[32px] bg-[#E8FFF1] p-6">
              <p className="text-4xl">📍</p>
              <h2 className="mt-4 text-xl font-black text-[#06113C]">Khu vực</h2>
              <p className="mt-2 font-bold text-neutral-600">Quận 6 và lân cận</p>
            </div>
  
            <div className="rounded-[32px] bg-[#E8FFF1] p-6">
              <p className="text-4xl">🍽️</p>
              <h2 className="mt-4 text-xl font-black text-[#06113C]">Đặt món</h2>
              <p className="mt-2 font-bold text-neutral-600">
                Hiện là giao diện demo, sau này đặt trực tiếp trên web.
              </p>
            </div>
          </div>
  
          <div className="mt-8 rounded-[40px] bg-[#06113C] p-8 text-white md:p-12">
            <p className="font-black text-[#00B14F]">Theo dõi quán</p>
            <h2 className="mt-3 text-4xl font-black">TikTok, Facebook, YouTube</h2>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-white/70">
              Quán sẽ cập nhật video món mới, POV làm món và các chương trình mới trên các nền tảng mạng xã hội.
            </p>
          </div>
        </section>
      </main>
    );
  }