import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tuyển dụng nhân viên Quận 6 | Ăn Vặt Ngọc Trinh",
  description:
    "Ăn Vặt Ngọc Trinh tuyển nhân viên làm món, order và đóng gói tại Quận 6. Lương theo giờ, được hướng dẫn từ đầu, thử việc có lương.",
};

const phone = "0392496220";

const jobs = [
  {
    title: "Nhân viên làm món",
    salary: "25.500 - 30.000đ/giờ",
    icon: "🥢",
    description:
      "Phù hợp với bạn nhanh nhẹn, sạch sẽ, chịu được môi trường bếp hơi nóng và muốn làm việc lâu dài.",
    works: [
      "Cuốn bánh tráng theo đơn khách",
      "Trộn món theo quy trình của quán",
      "Làm nước theo đơn",
      "Chuẩn bị nguyên liệu trong ca",
      "Giữ vệ sinh khu vực làm món",
    ],
  },
  {
    title: "Nhân viên Order & Đóng gói",
    salary: "22.000đ/giờ",
    icon: "📦",
    description:
      "Phù hợp với bạn cẩn thận, giao tiếp ổn, biết sắp xếp đơn hàng và làm việc đúng giờ.",
    works: [
      "Nhận đơn tại quầy và trên hệ thống",
      "Kiểm tra món theo bill",
      "Đóng gói đơn hàng gọn gàng",
      "Bàn giao đơn cho shipper",
      "Hỗ trợ khách hàng khi cần",
    ],
  },
];

const shifts = [
  {
    title: "Full-time",
    time: "11h - 22h",
    note: "Thu nhập khoảng 9 - 10 triệu/tháng",
  },
  {
    title: "Ca 8 tiếng",
    time: "14h - 22h",
    note: "Thu nhập khoảng 7 - 8 triệu/tháng",
  },
  {
    title: "Ca linh hoạt",
    time: "Trao đổi thêm",
    note: "Tùy theo nhu cầu thực tế của quán",
  },
];

const requirements = [
  "Từ 18 - 30 tuổi",
  "Siêng năng, sạch sẽ, gọn gàng",
  "Nhanh nhẹn, chủ động trong công việc",
  "Đi làm đúng giờ, có trách nhiệm",
  "Chịu được môi trường bếp hơi nóng",
  "Ưu tiên bạn có thể làm lâu dài",
];

const benefits = [
  "Chưa có kinh nghiệm vẫn được hướng dẫn từ đầu",
  "Thử việc 7 ngày vẫn tính lương",
  "Off 1 ngày/tuần",
  "Công việc rõ ràng, làm theo đơn khách",
  "Đúng giờ xong việc là về, không thích tăng ca",
  "Quán nhỏ, dễ trao đổi công việc trực tiếp",
];

export default function TuyenDungPage() {
  return (
    <main className="bg-white">
      <section className="relative overflow-hidden bg-[#00B14F] px-4 py-16 text-white md:px-8 md:py-20">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-white/10" />

        <div className="relative mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.05fr_0.95fr] md:items-center">
          <div>
            <p className="inline-flex rounded-full bg-white px-5 py-2 text-sm font-black text-[#00B14F]">
              Tuyển dụng Quận 6
            </p>

            <h1 className="mt-6 max-w-4xl text-5xl font-black leading-tight md:text-7xl">
              Tuyển nhân viên quán ăn vặt
            </h1>

            <p className="mt-5 max-w-3xl text-lg font-bold leading-8 text-white/90">
              Ăn Vặt Ngọc Trinh cần tuyển nhân viên làm món, order và đóng gói.
              Công việc rõ ràng, được hướng dẫn từ đầu, phù hợp với bạn siêng
              năng và muốn làm việc ổn định.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={`https://zalo.me/${phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl bg-white px-6 py-4 text-center text-sm font-black text-[#00B14F] shadow-xl shadow-black/10"
              >
                💬 Nhắn Zalo ứng tuyển
              </a>

              <a
                href={`tel:${phone}`}
                className="rounded-2xl bg-[#06113C] px-6 py-4 text-center text-sm font-black text-white shadow-xl shadow-black/10"
              >
                ☎️ Gọi ngay
              </a>
            </div>
          </div>

          
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-8">
        <div className="text-center">
          <p className="font-black text-[#00B14F]">Vị trí đang tuyển</p>

          <h2 className="mt-3 text-4xl font-black text-[#06113C]">
            Bạn phù hợp vị trí nào?
          </h2>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {jobs.map((job) => (
            <div
              key={job.title}
              className="rounded-[40px] border border-black/5 bg-white p-8 shadow-xl shadow-neutral-950/5"
            >
              <div className="flex items-start gap-4">
                <div className="text-5xl">{job.icon}</div>

                <div>
                  <h3 className="text-2xl font-black text-[#06113C]">
                    {job.title}
                  </h3>

                  <p className="mt-2 text-2xl font-black text-[#00B14F]">
                    {job.salary}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm font-bold leading-7 text-neutral-600">
                {job.description}
              </p>

              <div className="mt-6 space-y-3">
                {job.works.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl bg-[#F5FFF8] px-5 py-4 text-sm font-black text-[#06113C]"
                  >
                    ✓ {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#F5FFF8] py-14">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="text-center">
            <p className="font-black text-[#00B14F]">Ca làm & thu nhập</p>

            <h2 className="mt-3 text-4xl font-black text-[#06113C]">
              Rõ ràng trước khi nhận việc
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {shifts.map((shift) => (
              <div
                key={shift.title}
                className="rounded-[32px] bg-white p-7 shadow-lg shadow-neutral-950/5"
              >
                <p className="text-sm font-black text-[#00B14F]">
                  {shift.title}
                </p>

                <p className="mt-3 text-3xl font-black text-[#06113C]">
                  {shift.time}
                </p>

                <p className="mt-3 text-sm font-bold leading-6 text-neutral-500">
                  {shift.note}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[32px] bg-white p-6 text-sm font-bold leading-7 text-neutral-600 shadow-lg shadow-neutral-950/5">
            <p>
              Lương thử việc 7 ngày:{" "}
              <span className="font-black text-[#06113C]">23.000đ/giờ</span>.
              Sau thử việc sẽ trao đổi mức lương chính thức theo vị trí và khả
              năng làm việc thực tế.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-[40px] bg-[#F5FFF8] p-8">
            <h2 className="text-3xl font-black text-[#06113C]">✅ Yêu cầu</h2>

            <div className="mt-6 space-y-3">
              {requirements.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#06113C]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[40px] bg-[#06113C] p-8 text-white">
            <h2 className="text-3xl font-black">🎁 Quyền lợi</h2>

            <div className="mt-6 space-y-3">
              {benefits.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl bg-white/10 px-5 py-4 text-sm font-black text-white ring-1 ring-white/10"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 md:px-8">
        <div className="rounded-[40px] bg-[#F5FFF8] p-8 md:p-10">
          <p className="font-black text-[#00B14F]">Lưu ý trước khi ứng tuyển</p>

          <h2 className="mt-3 text-4xl font-black text-[#06113C]">
            Quán nói thật để bạn dễ quyết định
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[28px] bg-white p-6">
              <p className="text-xl font-black text-[#06113C]">
                Giờ cao điểm sẽ khá bận
              </p>

              <p className="mt-3 text-sm font-bold leading-7 text-neutral-600">
                Công việc chủ yếu làm theo đơn khách. Khi đông đơn, bạn cần làm
                nhanh, gọn và đúng quy trình.
              </p>
            </div>

            <div className="rounded-[28px] bg-white p-6">
              <p className="text-xl font-black text-[#06113C]">
                Môi trường bếp hơi nóng
              </p>

              <p className="mt-3 text-sm font-bold leading-7 text-neutral-600">
                Công việc không phù hợp nếu bạn chỉ muốn ngồi máy lạnh hoặc không
                quen môi trường bếp.
              </p>
            </div>

            <div className="rounded-[28px] bg-white p-6">
              <p className="text-xl font-black text-[#06113C]">
                Không yêu cầu kinh nghiệm
              </p>

              <p className="mt-3 text-sm font-bold leading-7 text-neutral-600">
                Chưa biết làm vẫn được hướng dẫn từ đầu, quan trọng là siêng,
                sạch sẽ và có trách nhiệm.
              </p>
            </div>

            <div className="rounded-[28px] bg-white p-6">
              <p className="text-xl font-black text-[#06113C]">
                Không thích tăng ca
              </p>

              <p className="mt-3 text-sm font-bold leading-7 text-neutral-600">
                Quán ưu tiên làm việc đúng giờ. Xong việc đúng ca thì về, không
                kéo dài thời gian nếu không cần thiết.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#00B14F] px-4 py-16 text-white md:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-black text-white/80">Ứng tuyển ngay hôm nay</p>

          <h2 className="mt-4 text-4xl font-black md:text-5xl">
            Nhắn Zalo để trao đổi công việc
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base font-bold leading-8 text-white/90">
            Bạn chỉ cần gửi họ tên, tuổi, khu vực đang ở và ca có thể làm. Quán
            sẽ phản hồi để trao đổi công việc cụ thể.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={`https://zalo.me/${phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl bg-white px-8 py-4 text-lg font-black text-[#00B14F]"
            >
              💬 Zalo: 0392 496 220
            </a>

            <a
              href={`tel:${phone}`}
              className="rounded-2xl bg-[#06113C] px-8 py-4 text-lg font-black text-white"
            >
              ☎️ Gọi ngay
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}