import Link from "next/link";

const androidSteps = [
  "Mở website Ăn Vặt Ngọc Trinh bằng trình duyệt Chrome trên Android.",
  "Bấm nút ⋮ ở góc phải phía trên màn hình.",
  "Chọn Thêm vào màn hình chính hoặc Cài đặt ứng dụng.",
  "Bấm Thêm/Cài đặt để hoàn tất.",
];

const iosSteps = [
  "Mở website Ăn Vặt Ngọc Trinh bằng Safari trên iPhone.",
  "Bấm nút Chia sẻ ở thanh công cụ Safari.",
  "Kéo xuống và chọn Thêm vào Màn hình chính.",
  "Bấm Thêm để đưa biểu tượng ra màn hình chính.",
];

function StepCard({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex gap-4 rounded-3xl bg-white p-4 shadow-lg shadow-neutral-950/5 ring-1 ring-black/5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#00B14F] text-lg font-black text-white">
        {number}
      </div>
      <p className="text-sm font-bold leading-6 text-neutral-600">{text}</p>
    </div>
  );
}

export default function HuongDanCaiAppPage() {
  return (
    <main className="min-h-screen bg-[#F5FFF8] px-4 py-10">
      <section className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-black text-[#06113C] shadow-sm ring-1 ring-black/5"
        >
          ← Về trang chủ
        </Link>

        <div className="mt-6 overflow-hidden rounded-[36px] bg-[#06113C] p-6 text-white shadow-2xl shadow-neutral-950/20 md:p-10">
          <p className="text-sm font-black text-[#00B14F]">HƯỚNG DẪN NHANH</p>
          <h1 className="mt-3 text-3xl font-black leading-tight md:text-5xl">
            Cài Ăn Vặt Ngọc Trinh ra màn hình như app
          </h1>
          <p className="mt-4 max-w-2xl text-sm font-bold leading-7 text-white/70 md:text-base">
            Không cần tải trên App Store hay CH Play. Chỉ cần thêm website vào màn hình chính là có thể đặt món, tra cứu đơn, tích xu và đổi quà nhanh hơn.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dat-mon-nhanh"
              className="rounded-2xl bg-[#00B14F] px-5 py-3 text-sm font-black text-white"
            >
              Đặt món ngay
            </Link>
            <Link
              href="/tra-cuu-don"
              className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white ring-1 ring-white/10"
            >
              Tra cứu đơn
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            "Đặt món nhanh hơn",
            "Theo dõi đơn tiện hơn",
            "Tích xu và đổi quà dễ hơn",
          ].map((item) => (
            <div key={item} className="rounded-3xl bg-white p-5 shadow-lg shadow-neutral-950/5 ring-1 ring-black/5">
              <p className="text-2xl">✅</p>
              <p className="mt-2 font-black text-[#06113C]">{item}</p>
            </div>
          ))}
        </div>

        <section className="mt-8 rounded-[32px] bg-white/70 p-5 ring-1 ring-black/5 md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8FFF1] text-2xl">
              🤖
            </div>
            <div>
              <p className="text-sm font-black text-[#00B14F]">ANDROID</p>
              <h2 className="text-2xl font-black text-[#06113C]">Cài bằng Chrome</h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {androidSteps.map((step, index) => (
              <StepCard key={step} number={index + 1} text={step} />
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[32px] bg-white/70 p-5 ring-1 ring-black/5 md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8FFF1] text-2xl">
              🍎
            </div>
            <div>
              <p className="text-sm font-black text-[#00B14F]">IPHONE / IOS</p>
              <h2 className="text-2xl font-black text-[#06113C]">Cài bằng Safari</h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {iosSteps.map((step, index) => (
              <StepCard key={step} number={index + 1} text={step} />
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[32px] bg-[#E8FFF1] p-5 ring-1 ring-[#00B14F]/20 md:p-6">
          <h2 className="text-2xl font-black text-[#06113C]">Lưu ý</h2>
          <div className="mt-4 space-y-3 text-sm font-bold leading-7 text-neutral-700">
            <p>• Trên iPhone nên mở bằng Safari để thấy mục “Thêm vào Màn hình chính”.</p>
            <p>• Trên Android nên mở bằng Chrome để cài app nhanh nhất.</p>
            <p>• Đây là ứng dụng web của Ăn Vặt Ngọc Trinh, giúp đặt món nhanh mà không cần tải app từ cửa hàng.</p>
          </div>
        </section>
      </section>
    </main>
  );
}
