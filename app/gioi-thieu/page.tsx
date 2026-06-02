const values = [
    "Làm món mới sau khi khách đặt",
    "Tập trung vào bánh tráng & ăn vặt dễ ghiền",
    "Giao diện web đơn giản để khách đặt nhanh",
    "Kết nối video TikTok/Facebook/YouTube của quán",
  ];
  
  export default function GioiThieuPage() {
    return (
      <main className="bg-white">
        <section className="bg-[#00B14F] px-4 py-16 text-white md:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="inline-flex rounded-full bg-white px-5 py-2 text-sm font-black text-[#00B14F]">
              Về quán
            </p>
            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-tight md:text-7xl">
              Ăn Vặt Ngọc Trinh
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-bold leading-8 text-white/90">
              Quán ăn vặt chuyên bánh tráng cuốn, bánh tráng trộn, bánh tráng chấm và nước uống tại khu vực Quận 6.
            </p>
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
              <p className="font-black text-[#00B14F]">Câu chuyện nhỏ</p>
              <h2 className="mt-3 text-4xl font-black leading-tight text-[#06113C]">
                Từ quán ăn vặt địa phương đến website đặt món riêng
              </h2>
              <p className="mt-5 text-base font-semibold leading-8 text-neutral-600">
                Website được xây dựng để khách xem món nhanh hơn, theo dõi video thực tế từ quán và chuẩn bị cho hệ thống đặt món trực tiếp trên web.
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
      </main>
    );
  }