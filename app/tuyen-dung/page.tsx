import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tuyển dụng nhân viên quận 6 | Ăn Vặt Ngọc Trinh",
  description:
    "Tuyển nhân viên làm món, order và đóng gói tại Quận 6. Thu nhập hấp dẫn, môi trường trẻ trung, hỗ trợ đào tạo.",
};

const positions = [
  {
    title: "Nhân viên làm món",
    salary: "25.000đ - 30.000đ/giờ",
    shifts: [
      "Ca 8 tiếng: 14h - 22h",
      "Hỗ trợ 50.000đ/ngày",
      "Ca 6 tiếng: 16h - 22h",
      "Không hỗ trợ",
    ],
  },
  {
    title: "Nhân viên Order & Đóng Gói",
    salary: "22.000đ/giờ",
    shifts: [
      "Ca 8 tiếng: 14h - 22h",
      "Ca 4 tiếng: 14h - 18h",
      "Ca 4 tiếng: 18h - 22h",
    ],
  },
];

const benefits = [
  "Hỗ trợ đào tạo",
  "Thử việc có lương",
  "Môi trường trẻ trung",
  "Off 1 ngày/tuần",
  "Có cơ hội tăng thu nhập",
  "Làm việc lâu dài",
];

const requirements = [
  "Tuổi từ 18 - 30",
  "Siêng năng",
  "Trung thực",
  "Có trách nhiệm",
  "Đúng giờ",
  "Chịu được áp lực giờ cao điểm",
];

export default function TuyenDungPage() {
  return (
    <main className="bg-white">
      {/* HERO */}
      <section className="bg-[#00B14F] px-4 py-16 text-white md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="inline-flex rounded-full bg-white px-5 py-2 text-sm font-black text-[#00B14F]">
            TUYỂN DỤNG
          </p>

          <h1 className="mt-6 text-5xl font-black leading-tight md:text-7xl">
            Gia nhập
            <br />
            Ăn Vặt Ngọc Trinh
          </h1>

          <p className="mt-6 max-w-3xl text-lg font-bold leading-8 text-white/90">
            Môi trường trẻ trung, công việc ổn định, thu nhập rõ ràng.
            Chúng tôi đang tìm kiếm những bạn năng động để đồng hành cùng quán.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="https://zalo.me/0392496220"
              target="_blank"
              className="rounded-2xl bg-white px-6 py-4 font-black text-[#00B14F]"
            >
              💬 Nhắn Zalo ứng tuyển
            </a>

            <a
              href="tel:0392496220"
              className="rounded-2xl bg-[#06113C] px-6 py-4 font-black text-white"
            >
              ☎️ Gọi ngay
            </a>
          </div>
        </div>
      </section>

      {/* VỊ TRÍ */}
      <section className="mx-auto max-w-7xl px-4 py-14 md:px-8">
        <div className="text-center">
          <p className="font-black text-[#00B14F]">VỊ TRÍ ĐANG TUYỂN</p>

          <h2 className="mt-3 text-4xl font-black text-[#06113C]">
            Chọn vị trí phù hợp với bạn
          </h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {positions.map((position) => (
            <div
              key={position.title}
              className="rounded-[32px] border border-[#E8FFF1] bg-white p-8 shadow-lg shadow-black/5"
            >
              <h3 className="text-2xl font-black text-[#06113C]">
                {position.title}
              </h3>

              <p className="mt-4 text-3xl font-black text-[#00B14F]">
                {position.salary}
              </p>

              <div className="mt-6 space-y-3">
                {position.shifts.map((shift) => (
                  <div
                    key={shift}
                    className="rounded-2xl bg-[#F5FFF8] px-4 py-3 font-bold text-[#06113C]"
                  >
                    ✓ {shift}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MÔ TẢ */}
      <section className="bg-[#F5FFF8] py-14">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[32px] bg-white p-8">
              <h3 className="text-2xl font-black text-[#06113C]">
                🍳 Nhân viên làm món
              </h3>

              <ul className="mt-5 space-y-3 text-sm font-semibold leading-7 text-neutral-600">
                <li>• Chuẩn bị nguyên liệu</li>
                <li>• Làm món theo quy trình của quán</li>
                <li>• Giữ vệ sinh khu vực làm việc</li>
                <li>• Hỗ trợ đóng gói khi đông khách</li>
              </ul>
            </div>

            <div className="rounded-[32px] bg-white p-8">
              <h3 className="text-2xl font-black text-[#06113C]">
                📦 Nhân viên Order & Đóng Gói
              </h3>

              <ul className="mt-5 space-y-3 text-sm font-semibold leading-7 text-neutral-600">
                <li>• Nhận đơn khách</li>
                <li>• In bill và đóng gói</li>
                <li>• Bàn giao đơn cho shipper</li>
                <li>• Hỗ trợ khách hàng tại quán</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* QUYỀN LỢI + YÊU CẦU */}
      <section className="mx-auto max-w-7xl px-4 py-14 md:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-black text-[#06113C]">
              🎁 Quyền lợi
            </h2>

            <div className="mt-6 grid gap-3">
              {benefits.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl bg-[#F5FFF8] px-5 py-4 font-black text-[#06113C]"
                >
                  ✓ {item}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-black text-[#06113C]">
              ✅ Yêu cầu
            </h2>

            <div className="mt-6 grid gap-3">
              {requirements.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl bg-[#F5FFF8] px-5 py-4 font-black text-[#06113C]"
                >
                  ✓ {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#06113C] px-4 py-16 text-white md:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <p className="font-black text-[#00B14F]">
            Ứng tuyển ngay hôm nay
          </p>

          <h2 className="mt-4 text-4xl font-black md:text-5xl">
            Chúng tôi đang chờ bạn
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm font-medium leading-8 text-white/70">
            Chỉ cần nhắn Zalo hoặc gọi trực tiếp, quán sẽ liên hệ trao đổi công việc
            và sắp xếp lịch phỏng vấn trong thời gian sớm nhất.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="https://zalo.me/0392496220"
              target="_blank"
              className="rounded-2xl bg-[#00B14F] px-8 py-4 font-black text-white"
            >
              💬 Nhắn Zalo ứng tuyển
            </a>

            <a
              href="tel:0392496220"
              className="rounded-2xl bg-white px-8 py-4 font-black text-[#06113C]"
            >
              ☎️ 0392 496 220
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}