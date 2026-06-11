import Link from "next/link";

const rules = [
  "Mỗi đơn hàng chỉ được đổi tối đa 1 quà bằng xu.",
  "Quà đổi xu được chọn trực tiếp trong phần thanh toán khi khách đủ điều kiện.",
  "Quà đổi xu sẽ được làm và giao chung với đơn hàng.",
  "Quà không có giá trị quy đổi thành tiền mặt, không hoàn tiền và không chuyển nhượng.",
  "Số xu dùng đổi quà sẽ được xử lý khi đơn hàng hoàn thành.",
  "Nếu đơn bị huỷ hoặc khách không nhận hàng, quà đổi xu sẽ không còn hiệu lực.",
  "Danh sách quà có thể thay đổi theo tình trạng nguyên liệu và chương trình ưu đãi của quán.",
  "Quán có quyền từ chối đổi quà nếu phát hiện gian lận xu, đặt ảo hoặc lợi dụng lỗi hệ thống.",
];

const giftExamples = [
  { points: "50 xu", gift: "Bất kỳ topping" },
  { points: "100 xu", gift: "Nui rim sấy" },
  { points: "150 xu", gift: "Hồng trà nguyên vị" },
  { points: "200 xu", gift: "Bánh que chấm kem" },
];

export default function ChinhSachDoiQuaPage() {
  return (
    <main className="min-h-screen bg-[#F5FFF8] px-4 py-10">
      <section className="mx-auto max-w-4xl">
        <Link href="/dat-mon-nhanh" className="font-black text-[#00B14F]">
          ← Đặt món để đổi quà
        </Link>

        <div className="mt-6 rounded-[36px] bg-white p-6 shadow-2xl shadow-neutral-950/10 md:p-10">
          <p className="text-sm font-black uppercase tracking-wide text-[#00B14F]">
            Quà đổi xu
          </p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-[#06113C] md:text-5xl">
            Chính sách đổi quà
          </h1>
          <p className="mt-4 text-base font-semibold leading-7 text-neutral-600">
            Khách hàng có thể dùng Xu Ăn Vặt để đổi quà trực tiếp khi đặt đơn mới tại Ăn Vặt Ngọc Trinh.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {giftExamples.map((item) => (
              <div key={item.points} className="rounded-[24px] bg-[#E8FFF1] p-4">
                <p className="text-sm font-black text-[#00B14F]">{item.points}</p>
                <p className="mt-1 text-xl font-black text-[#06113C]">{item.gift}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[28px] bg-[#F5FFF8] p-5">
            <h2 className="text-xl font-black text-[#06113C]">Quy định đổi quà</h2>
            <ul className="mt-4 space-y-3">
              {rules.map((rule) => (
                <li key={rule} className="flex gap-2 text-sm font-bold leading-6 text-neutral-600">
                  <span className="mt-1 text-[#00B14F]">●</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 rounded-[28px] bg-[#06113C] p-5 text-white">
            <p className="text-lg font-black">Cách đổi quà</p>
            <div className="mt-3 grid gap-3 text-sm font-semibold text-white/80 md:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-4">1. Chọn món và nhập số điện thoại</div>
              <div className="rounded-2xl bg-white/10 p-4">2. Chọn quà đủ xu trong giỏ hàng</div>
              <div className="rounded-2xl bg-white/10 p-4">3. Quán làm quà chung với đơn</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
