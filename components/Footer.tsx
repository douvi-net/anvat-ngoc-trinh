export default function Footer() {
    return (
      <footer className="mt-10 bg-[#06113C] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-3 md:px-8">
          <div>
            <p className="text-xl font-black">Ăn Vặt Ngọc Trinh</p>
            <p className="mt-3 text-sm font-medium leading-7 text-white/70">
              Website đặt món riêng cho quán ăn vặt, bánh tráng và nước uống khu
              vực Quận 6.
            </p>
          </div>
  
          <div>
            <p className="font-black text-[#00B14F]">Liên hệ</p>
            <p className="mt-3 text-sm text-white/70">Hotline: 0392496220</p>
            <p className="mt-2 text-sm text-white/70">Khu vực: Quận 6</p>
          </div>
  
          <div>
            <p className="font-black text-[#00B14F]">Đặt hàng</p>
            <p className="mt-3 text-sm leading-7 text-white/70">
              Khách chọn món trên website. Quán nhận đơn và xử lý trực tiếp.
            </p>
          </div>
        </div>
      </footer>
    );
  }