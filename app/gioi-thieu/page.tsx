
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Giới thiệu",
  description:
    "Tìm hiểu về Ăn Vặt Ngọc Trinh - quán ăn vặt chuyên bánh tráng, cuốn, đồ ăn vặt và nước uống tại Quận 6.",
};

const values = [
  "Làm món mới ngay sau khi khách đặt",
  "Nguyên liệu được chuẩn bị mỗi ngày",
  "Tập trung vào các món bánh tráng và ăn vặt được yêu thích",
  "Đặt món nhanh trên website, Zalo và các nền tảng giao hàng",
  "Liên tục cập nhật món mới và ưu đãi cho khách hàng",
  "Lấy trải nghiệm khách hàng làm ưu tiên hàng đầu",
];

const stats = [
  {
    number: "1000+",
    label: "Đơn hàng phục vụ",
  },
  {
    number: "4.8★",
    label: "Đánh giá khách hàng",
  },
  {
    number: "Quận 6",
    label: "Khu vực hoạt động",
  },
];

export default function GioiThieuPage() {
  return (
    <main className="bg-white">
      <section className="relative overflow-hidden bg-[#00B14F] px-4 py-16 text-white md:px-8 md:py-20">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-white/10" />

        <div className="relative mx-auto max-w-7xl">
          <p className="inline-flex rounded-full bg-white px-5 py-2 text-sm font-black text-[#00B14F]">
            Về Ăn Vặt Ngọc Trinh
          </p>

          <h1 className="mt-6 max-w-4xl text-5xl font-black leading-tight md:text-7xl">
            Ăn Vặt Ngọc Trinh
          </h1>

          <p className="mt-5 max-w-3xl text-lg font-bold leading-8 text-white/90">
            Quán ăn vặt chuyên bánh tráng cuốn, bánh tráng trộn, bánh tráng chấm,
            nước uống và các món ăn vặt được nhiều khách hàng yêu thích tại khu
            vực Quận 6.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dat-mon-nhanh"
              className="rounded-2xl bg-white px-6 py-4 text-sm font-black text-[#00B14F]"
            >
              🛒 Đặt món ngay
            </Link>

            <Link
              href="/lien-he"
              className="rounded-2xl bg-white/10 px-6 py-4 text-sm font-black text-white ring-1 ring-white/20"
            >
              📞 Liên hệ quán
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-8">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div className="rounded-[40px] bg-[#E8FFF1] p-8">
            <div className="flex aspect-square items-center justify-center rounded-[32px] bg-white text-8xl">
              🥢
            </div>
          </div>

          <div>
            <p className="font-black text-[#00B14F]">Câu chuyện của quán</p>

            <h2 className="mt-3 text-4xl font-black leading-tight text-[#06113C]">
              Từ quán ăn vặt địa phương đến hệ thống đặt món trực tuyến
            </h2>

            <p className="mt-5 text-base font-semibold leading-8 text-neutral-600">
              Ăn Vặt Ngọc Trinh được xây dựng với mong muốn mang đến những món ăn
              vặt quen thuộc nhưng chất lượng, được làm mới ngay sau khi khách đặt.
              Bên cạnh việc phục vụ trực tiếp tại quán, chúng tôi còn phát triển
              website đặt món riêng để khách hàng có thể xem menu, theo dõi món
              mới, đặt hàng nhanh chóng và thuận tiện hơn.
            </p>

            <p className="mt-5 text-base font-semibold leading-8 text-neutral-600">
              Mỗi món ăn đều được chuẩn bị với tiêu chí ngon miệng, sạch sẽ và phù
              hợp với khẩu vị của nhiều khách hàng. Đội ngũ luôn lắng nghe phản hồi
              để không ngừng cải thiện chất lượng sản phẩm và dịch vụ.
            </p>

            <div className="mt-8 grid gap-3">
              {values.map((item) => (
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

      <section className="bg-[#F5FFF8] py-14">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="text-center">
            <p className="font-black text-[#00B14F]">Những con số nổi bật</p>

            <h2 className="mt-3 text-4xl font-black text-[#06113C]">
              Sự tin tưởng từ khách hàng
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {stats.map((item) => (
              <div
                key={item.label}
                className="rounded-[32px] bg-white p-8 text-center shadow-lg shadow-neutral-950/5"
              >
                <p className="text-4xl font-black text-[#00B14F]">
                  {item.number}
                </p>

                <p className="mt-3 text-sm font-bold text-neutral-500">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-8">
        <div className="rounded-[40px] bg-[#06113C] p-8 text-white md:p-12">
          <p className="font-black text-[#00B14F]">
            Đồng hành cùng khách hàng mỗi ngày
          </p>

          <h2 className="mt-3 text-4xl font-black leading-tight">
            Không chỉ là một quán ăn vặt
          </h2>

          <p className="mt-5 max-w-3xl text-sm font-medium leading-8 text-white/70">
            Ăn Vặt Ngọc Trinh hướng đến việc xây dựng một hệ sinh thái bán hàng
            hiện đại với website đặt món riêng, nội dung video thực tế trên mạng xã
            hội và trải nghiệm đặt hàng đơn giản như các ứng dụng giao đồ ăn lớn.
            Chúng tôi mong muốn mang đến cho khách hàng những món ăn ngon cùng trải
            nghiệm tiện lợi và nhanh chóng.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dat-mon-nhanh"
              className="rounded-2xl bg-[#00B14F] px-6 py-4 text-sm font-black text-white"
            >
              Đặt món ngay
            </Link>

            <Link
              href="/lien-he"
              className="rounded-2xl bg-white/10 px-6 py-4 text-sm font-black text-white ring-1 ring-white/10"
            >
              Liên hệ tư vấn
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

