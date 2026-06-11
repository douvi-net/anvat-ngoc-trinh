import Link from "next/link";

const rules = [
  "Xu Ăn Vặt được tích theo số điện thoại đặt hàng.",
  "Mỗi 10.000đ giá trị đơn hàng hợp lệ sẽ được tính 1 xu.",
  "Xu chỉ được cộng sau khi đơn hàng hoàn thành.",
  "Đơn bị huỷ, không nhận hàng, đặt sai thông tin hoặc có dấu hiệu gian lận sẽ không được cộng xu.",
  "Xu không có giá trị quy đổi thành tiền mặt và không thể chuyển cho số điện thoại khác.",
  "Quán có quyền điều chỉnh hoặc thu hồi xu nếu phát hiện lỗi hệ thống, đặt ảo, spam đơn hoặc gian lận.",
];

const examples = [
  { order: "Đơn 50.000đ", point: "+5 xu" },
  { order: "Đơn 120.000đ", point: "+12 xu" },
  { order: "Đơn huỷ/không nhận", point: "Không cộng xu" },
];

export default function ChinhSachTichXuPage() {
  return (
    <main className="min-h-screen bg-[#F5FFF8] px-4 py-10">
      <section className="mx-auto max-w-4xl">
        <Link href="/tra-cuu-don" className="font-black text-[#00B14F]">
          ← Tra cứu xu
        </Link>

        <div className="mt-6 rounded-[36px] bg-white p-6 shadow-2xl shadow-neutral-950/10 md:p-10">
          <p className="text-sm font-black uppercase tracking-wide text-[#00B14F]">
            Xu Ăn Vặt
          </p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-[#06113C] md:text-5xl">
            Chính sách tích xu
          </h1>
          <p className="mt-4 text-base font-semibold leading-7 text-neutral-600">
            Chương trình tích xu giúp khách hàng quen nhận thêm ưu đãi khi đặt món tại Ăn Vặt Ngọc Trinh.
          </p>

          <div className="mt-8 rounded-[28px] bg-[#E8FFF1] p-5">
            <p className="text-2xl font-black text-[#06113C]">10.000đ = 1 xu</p>
            <p className="mt-2 text-sm font-bold text-neutral-600">
              Xu được cộng khi đơn chuyển sang trạng thái hoàn thành.
            </p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {examples.map((example) => (
              <div key={example.order} className="rounded-[24px] bg-[#F5FFF8] p-4">
                <p className="text-sm font-black text-neutral-500">{example.order}</p>
                <p className="mt-2 text-xl font-black text-[#00B14F]">{example.point}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[28px] bg-[#F5FFF8] p-5">
            <h2 className="text-xl font-black text-[#06113C]">Quy định tích xu</h2>
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
            <p className="text-lg font-black">Chống gian lận</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/75">
              Các hành vi đặt đơn ảo, tạo nhiều đơn để lấy xu, đánh giá spam hoặc lợi dụng lỗi hệ thống có thể bị khoá quyền tích xu/đổi quà.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
