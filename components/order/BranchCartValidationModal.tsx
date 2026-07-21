"use client";

import type { BranchCartValidationResult } from "@/lib/validateBranchCart";

type Props = {
  open: boolean;
  result: BranchCartValidationResult;
  branchName: string;
  onApply: () => void;
  onCancel: () => void;
};

function formatPrice(p: number) {
  return p.toLocaleString("vi-VN") + "đ";
}

export function BranchCartValidationModal({
  open,
  result,
  branchName,
  onApply,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-white px-5 pb-8 pt-6 shadow-2xl sm:rounded-3xl">
        <h2 className="text-lg font-black text-[#06113C]">
          ⚠️ Giỏ hàng cần cập nhật
        </h2>
        <p className="mt-1 text-sm font-bold text-neutral-500">
          Chi nhánh{" "}
          <span className="font-black text-[#06113C]">{branchName}</span> có
          thay đổi so với giỏ hiện tại.
        </p>

        {/* Removed items */}
        {result.removedItems.length > 0 && (
          <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3">
            <p className="text-sm font-black text-red-600">
              Không có tại chi nhánh này ({result.removedItems.length} món):
            </p>
            <ul className="mt-2 space-y-1">
              {result.removedItems.map((item) => (
                <li
                  key={item.cartKey}
                  className="flex items-center gap-2 text-sm font-bold text-red-500"
                >
                  <span className="shrink-0 text-xs">✕</span>
                  <span>
                    {item.productName} × {item.quantity}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Unavailable / sold out items */}
        {result.unavailableItems.length > 0 && (
          <div className="mt-3 rounded-2xl bg-orange-50 px-4 py-3">
            <p className="text-sm font-black text-orange-600">
              Tạm hết tại chi nhánh này ({result.unavailableItems.length} món):
            </p>
            <ul className="mt-2 space-y-1">
              {result.unavailableItems.map((item) => (
                <li
                  key={item.cartKey}
                  className="flex items-center gap-2 text-sm font-bold text-orange-500"
                >
                  <span className="shrink-0 text-xs">◯</span>
                  <span>
                    {item.productName} × {item.quantity}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Price updates */}
        {result.updatedPrices.length > 0 && (
          <div className="mt-3 rounded-2xl bg-blue-50 px-4 py-3">
            <p className="text-sm font-black text-blue-600">
              Giá thay đổi ({result.updatedPrices.length} món):
            </p>
            <ul className="mt-2 space-y-1">
              {result.updatedPrices.map((item) => (
                <li key={item.cartKey} className="text-sm font-bold text-blue-500">
                  {item.productName}:{" "}
                  <span className="text-neutral-400 line-through">
                    {formatPrice(item.oldPrice)}
                  </span>{" "}
                  →{" "}
                  <span className="font-black text-[#06113C]">
                    {formatPrice(item.newPrice)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-black/10 bg-neutral-100 px-4 py-4 text-sm font-black text-[#06113C]"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={onApply}
            className="flex-1 rounded-2xl bg-[#06113C] px-4 py-4 text-sm font-black text-white"
          >
            Cập nhật giỏ
          </button>
        </div>
      </div>
    </div>
  );
}
