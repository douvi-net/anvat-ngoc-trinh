"use client";

type Props = {
  total: number;
  submitting: boolean;
  statusMessage: string;
  errorMessage: string;
  issues: string[];
  actionLabel: string;
  onSubmit: () => void | Promise<void>;
};

export default function StickyCheckoutBar({
  total,
  submitting,
  statusMessage,
  errorMessage,
  issues,
  actionLabel,
  onSubmit,
}: Props) {
  const firstIssue = issues[0] || "";
  const isReady = issues.length === 0;

  return (
    <>
      <div className="sticky bottom-0 z-[60] -mx-5 mt-6 border-t border-black/10 bg-white/95 px-5 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-12px_30px_rgba(6,17,60,0.10)] backdrop-blur-xl">
        {errorMessage && !submitting && (
          <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wider text-neutral-400">
              {submitting
                ? "Đang xử lý"
                : isReady
                ? "Sẵn sàng đặt món"
                : `Còn ${issues.length} bước để đặt`}
            </p>

            <p
              className={`mt-1 text-sm font-black ${
                submitting || isReady ? "text-[#00B14F]" : "text-amber-700"
              }`}
            >
              {submitting
                ? statusMessage || "Đang gửi đơn..."
                : isReady
                ? "Thông tin đã đầy đủ"
                : firstIssue}
            </p>

            {!submitting && issues.length > 1 && (
              <p className="mt-1 text-xs font-bold text-neutral-400">
                + {issues.length - 1} mục cần kiểm tra thêm
              </p>
            )}
          </div>

          <div className="shrink-0 text-right">
            <p className="text-xs font-bold text-neutral-400">Tổng cộng</p>
            <p className="text-xl font-black text-[#06113C]">
              {Number(total || 0).toLocaleString("vi-VN")}đ
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void onSubmit()}
          disabled={submitting}
          className={`touch-manipulation w-full rounded-2xl px-5 py-4 text-base font-black text-white shadow-lg transition active:scale-[0.99] disabled:cursor-wait disabled:opacity-90 ${
            isReady ? "bg-[#00B14F]" : "bg-[#06113C]"
          }`}
        >
          {submitting
            ? statusMessage || "Đang gửi đơn..."
            : isReady
            ? `${actionLabel} · ${Number(total || 0).toLocaleString("vi-VN")}đ`
            : `Tiếp tục · ${firstIssue}`}
        </button>

        <p className="mt-2 text-center text-[11px] font-bold text-neutral-400">
          Một lần bấm là đủ. Hệ thống tự kiểm tra để tránh tạo đơn trùng.
        </p>
      </div>

      {submitting && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-[#06113C]/65 px-5 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[30px] bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E8FFF1] text-2xl">
              ⏳
            </div>
            <h3 className="mt-4 text-xl font-black text-[#06113C]">
              Đang gửi đơn đến quán
            </h3>
            <p className="mt-2 text-sm font-bold leading-6 text-neutral-500">
              {statusMessage ||
                "Vui lòng giữ nguyên màn hình. Không cần bấm nút thêm lần nữa."}
            </p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-neutral-100">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-[#00B14F]" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
