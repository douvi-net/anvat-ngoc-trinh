import Link from "next/link";

const sections = [
  {
    title: "1. Thông tin đặt hàng",
    items: [
      "Khách hàng cần cung cấp đúng họ tên, số điện thoại và địa chỉ nhận món.",
      "Số điện thoại dùng để tra cứu đơn, tích xu, đổi quà và hỗ trợ khi cần xác nhận đơn.",
      "Nếu thông tin không rõ ràng, quán có thể liên hệ lại trước khi làm món.",
    ],
  },
  {
    title: "2. Xác nhận và xử lý đơn",
    items: [
      "Đơn COD sẽ được tiếp nhận khi thông tin khách hàng và địa chỉ giao hàng hợp lệ.",
      "Đơn thanh toán Momo/chuyển khoản sẽ được xử lý sau khi quán kiểm tra thanh toán.",
      "Trong giờ cao điểm, thời gian làm món và giao hàng có thể lâu hơn dự kiến.",
    ],
  },
  {
    title: "3. Phí giao hàng",
    items: [
      "Phí giao hàng được tính theo khoảng cách, khu vực giao hàng hoặc theo xác nhận của quán.",
      "Một số địa chỉ ngoài khu vực giao tự động có thể cần quán xác nhận lại phí ship.",
      "Thời gian nhận món hiển thị trên website chỉ là thời gian dự kiến.",
    ],
  },
  {
    title: "4. Huỷ đơn và thay đổi đơn",
    items: [
      "Khách có thể liên hệ quán để điều chỉnh hoặc huỷ đơn khi quán chưa bắt đầu làm món.",
      "Khi món đã được chuẩn bị, quán có thể không hỗ trợ huỷ đơn.",
      "Đơn đặt sai thông tin, không liên hệ được hoặc không nhận hàng có thể bị ghi nhận vào danh sách cần xác nhận trước.",
    ],
  },
  {
    title: "5. Quyền từ chối đơn hàng",
    items: [
      "Quán có quyền từ chối đơn nghi ngờ đặt ảo, spam, sai số điện thoại, địa chỉ không rõ hoặc có dấu hiệu gian lận.",
      "Quán có thể yêu cầu xác nhận trước với khách từng huỷ nhiều đơn, boom hàng hoặc có lịch sử đặt hàng bất thường.",
    ],
  },
];

export default function ChinhSachDatHangPage() {
  return (
    <main className="min-h-screen bg-[#F5FFF8] px-4 py-10">
      <section className="mx-auto max-w-4xl">
        <Link href="/dat-mon-nhanh" className="font-black text-[#00B14F]">
          ← Quay lại đặt món
        </Link>

        <div className="mt-6 rounded-[36px] bg-white p-6 shadow-2xl shadow-neutral-950/10 md:p-10">
          <p className="text-sm font-black uppercase tracking-wide text-[#00B14F]">
            Ăn Vặt Ngọc Trinh
          </p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-[#06113C] md:text-5xl">
            Chính sách đặt hàng
          </h1>
          <p className="mt-4 text-base font-semibold leading-7 text-neutral-600">
            Chính sách này giúp đơn hàng được xử lý rõ ràng, hạn chế đặt ảo, sai thông tin và bảo vệ quyền lợi của khách hàng lẫn quán.
          </p>

          <div className="mt-8 space-y-5">
            {sections.map((section) => (
              <div key={section.title} className="rounded-[28px] bg-[#F5FFF8] p-5">
                <h2 className="text-xl font-black text-[#06113C]">{section.title}</h2>
                <ul className="mt-3 space-y-2">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm font-bold leading-6 text-neutral-600">
                      <span className="mt-1 text-[#00B14F]">●</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[28px] bg-[#06113C] p-5 text-white">
            <p className="text-lg font-black">Lưu ý</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/75">
              Khi đặt hàng trên website, khách hàng được xem là đã đồng ý với chính sách đặt hàng của Ăn Vặt Ngọc Trinh.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
