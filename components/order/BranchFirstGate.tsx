"use client";

import { useEffect, useMemo, useState } from "react";
import type { PreviewSelectedBranch } from "@/lib/mapsPreviewNearestBranch";

export type BranchAddressSuggestion = {
  placeId: string;
  text: string;
  mainText: string;
  secondaryText: string;
};

interface BranchFirstGateProps {
  phone: string;
  phoneChecked: boolean;
  customerName: string | null;
  customerAddress: string | null;
  customerAddressDetail: string | null;
  selectedBranch: PreviewSelectedBranch | null;
  checkingCustomer: boolean;
  addressLoading: boolean;
  routeLoading: boolean;
  branchMenuLoading: boolean;
  addressSelected: boolean;
  addressSuggestions: BranchAddressSuggestion[];
  addressSearchMessage: string | null;
  statusMessage: string | null;
  routeMessage: string | null;
  onPhoneChange: (phone: string) => void;
  onConfirmSavedAddress: () => void;
  onChooseAddress: () => void;
  onChangePhone: () => void;
  onAddressChange: (address: string) => void;
  onAddressDetailChange: (detail: string) => void;
  onSelectAddressSuggestion: (
    suggestion: BranchAddressSuggestion
  ) => void | Promise<void>;
  availableBranches: PreviewSelectedBranch[];
  branchSelectorOpen: boolean;
  onOpenBranchSelector: () => void;
  onCloseBranchSelector: () => void;
  onSelectBranch: (
    branch: PreviewSelectedBranch
  ) => void | Promise<void>;
}

function normalizePhoneInput(value: string) {
  let normalized = value.replace(/\D/g, "");

  if (normalized.startsWith("84") && normalized.length >= 11) {
    normalized = `0${normalized.slice(2)}`;
  }

  return normalized.slice(0, 10);
}

function isValidVietnamPhone(value: string) {
  return /^0(3|5|7|8|9)\d{8}$/.test(value);
}

export function BranchFirstGate({
  phone,
  phoneChecked,
  customerName,
  customerAddress,
  customerAddressDetail,
  selectedBranch,
  checkingCustomer,
  addressLoading,
  routeLoading,
  branchMenuLoading,
  addressSelected,
  addressSuggestions,
  addressSearchMessage,
  statusMessage,
  routeMessage,
  onPhoneChange,
  onConfirmSavedAddress,
  onChooseAddress,
  onChangePhone,
  onAddressChange,
  onAddressDetailChange,
  onSelectAddressSuggestion,
  availableBranches,
  branchSelectorOpen,
  onOpenBranchSelector,
  onCloseBranchSelector,
  onSelectBranch,
}: BranchFirstGateProps) {
  const [localPhone, setLocalPhone] = useState(normalizePhoneInput(phone));
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setLocalPhone(normalizePhoneInput(phone));
  }, [phone]);

  const normalizedPhone = normalizePhoneInput(localPhone);
  const isLocalPhoneValid = isValidVietnamPhone(normalizedPhone);
  const isSubmittedPhoneValid = isValidVietnamPhone(
    normalizePhoneInput(phone)
  );

  const isLookupLoading =
    isSubmittedPhoneValid && (checkingCustomer || !phoneChecked);

  const hasResolvedAddress =
    Boolean(customerAddress?.trim()) &&
    Boolean(selectedBranch) &&
    addressSelected;

  const canContinueWithAddress =
    Boolean(customerAddress?.trim()) &&
    Boolean(selectedBranch) &&
    addressSelected &&
    !addressLoading &&
    !routeLoading &&
    !branchMenuLoading;

  const selectedBranchLabel = useMemo(() => {
    if (!selectedBranch) return "";

    return (
      selectedBranch.short_name ||
      selectedBranch.code ||
      "Chi nhánh gần nhất"
    );
  }, [selectedBranch]);

  const handlePhoneSubmit = () => {
    if (!isLocalPhoneValid) {
      setValidationError(
        "Vui lòng nhập số điện thoại hợp lệ gồm 10 chữ số và bắt đầu bằng số 0."
      );
      return;
    }

    setValidationError(null);
    onPhoneChange(normalizedPhone);
  };

  const handlePhoneInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setLocalPhone(normalizePhoneInput(event.target.value));
    setValidationError(null);
  };

  const handlePhoneKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter" && !checkingCustomer) {
      handlePhoneSubmit();
    }
  };

  if (!isSubmittedPhoneValid) {
    return (
      <GateLayout>
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#00B14F]">
            Ăn Vặt Ngọc Trinh
          </p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-[#06113C]">
            Bắt đầu đặt món
          </h1>
          <p className="mt-3 text-sm font-bold leading-6 text-neutral-500">
            Nhập số điện thoại để quán tìm địa chỉ cũ, xu tích lũy và chi nhánh
            giao nhanh nhất.
          </p>
        </div>

        <div className="mt-7">
          <label
            htmlFor="branch-gate-phone"
            className="mb-2 block text-sm font-black text-[#06113C]"
          >
            Số điện thoại
          </label>

          <input
            id="branch-gate-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="0912345678"
            value={localPhone}
            onChange={handlePhoneInputChange}
            onKeyDown={handlePhoneKeyDown}
            disabled={checkingCustomer}
            className="h-14 w-full rounded-2xl border-2 border-black/10 bg-white px-4 text-base font-black text-[#06113C] outline-none transition focus:border-[#00B14F] focus:ring-4 focus:ring-[#00B14F]/10 disabled:cursor-not-allowed disabled:bg-neutral-100"
          />

          {validationError && (
            <p className="mt-2 text-sm font-bold text-red-600">
              {validationError}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handlePhoneSubmit}
          disabled={!isLocalPhoneValid || checkingCustomer}
          className="mt-5 h-14 w-full rounded-2xl bg-[#00B14F] px-5 text-base font-black text-white shadow-lg shadow-[#00B14F]/20 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:shadow-none"
        >
          {checkingCustomer ? "Đang kiểm tra..." : "Tiếp tục"}
        </button>

        <p className="mt-4 text-center text-xs font-bold leading-5 text-neutral-400">
          Quán chỉ dùng số điện thoại để phục vụ đơn hàng và lưu quyền lợi khách
          hàng.
        </p>
      </GateLayout>
    );
  }

  if (isLookupLoading) {
    return (
      <GateLayout>
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E8FFF1] text-3xl">
            🔎
          </div>
          <h1 className="mt-5 text-2xl font-black text-[#06113C]">
            Đang kiểm tra thông tin
          </h1>
          <p className="mt-3 text-sm font-bold leading-6 text-neutral-500">
            Quán đang tìm địa chỉ đã lưu và xác định chi nhánh phù hợp cho số{" "}
            <span className="text-[#06113C]">{phone}</span>.
          </p>
        </div>

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-neutral-100">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-[#00B14F]" />
        </div>

        <button
          type="button"
          onClick={onChangePhone}
          className="mt-6 w-full text-center text-sm font-black text-neutral-500 transition hover:text-[#00B14F]"
        >
          Dùng số điện thoại khác
        </button>
      </GateLayout>
    );
  }

  if (hasResolvedAddress) {
    const distanceText = selectedBranch?.distance_text
      ? ` · ${selectedBranch.distance_text}`
      : "";
    const durationText = selectedBranch?.duration_text
      ? ` · ${selectedBranch.duration_text}`
      : "";

    return (
      <GateLayout>
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#00B14F]">
            Địa chỉ đã lưu
          </p>
          <h1 className="mt-3 text-2xl font-black leading-tight text-[#06113C]">
            {customerName?.trim()
              ? `Chào ${customerName.trim()}`
              : "Giao đến địa chỉ này?"}
          </h1>
          <p className="mt-2 text-sm font-bold text-neutral-500">
            Kiểm tra lại địa chỉ trước khi xem menu của chi nhánh.
          </p>
        </div>

        <div className="mt-6 rounded-[24px] border border-[#00B14F]/20 bg-[#F5FFF8] p-4">
          <p className="text-xs font-black uppercase tracking-wide text-neutral-400">
            Giao đến
          </p>
          <p className="mt-2 font-black leading-6 text-[#06113C]">
            {customerAddress}
          </p>

          {customerAddressDetail && (
            <p className="mt-2 text-sm font-bold leading-5 text-neutral-500">
              {customerAddressDetail}
            </p>
          )}

          <div className="mt-4 rounded-2xl bg-white px-4 py-3 ring-1 ring-black/5">
            <p className="text-xs font-black text-[#00B14F]">
              📍 Chi nhánh phục vụ
            </p>
            <p className="mt-1 text-sm font-black text-[#06113C]">
              Ăn Vặt Ngọc Trinh - {selectedBranchLabel}
            </p>
            {(distanceText || durationText) && (
              <p className="mt-1 text-xs font-bold text-neutral-500">
                {`${distanceText}${durationText}`.replace(/^ · /, "")}
              </p>
            )}
            <button
  type="button"
  onClick={onOpenBranchSelector}
  className="mt-3 w-full rounded-xl border border-[#00B14F]/30 bg-[#F5FFF8] px-4 py-3 text-sm font-black text-[#00B14F] transition active:scale-[0.98]"
>
  Đổi menu chi nhánh
</button>
          </div>
        </div>

        <button
          type="button"
          onClick={onConfirmSavedAddress}
          className="mt-5 h-14 w-full rounded-2xl bg-[#00B14F] px-5 text-base font-black text-white shadow-lg shadow-[#00B14F]/20 transition active:scale-[0.98]"
        >
          Xem menu chi nhánh này
        </button>

        <button
          type="button"
          onClick={onChooseAddress}
          className="mt-3 h-12 w-full rounded-2xl border-2 border-black/10 bg-white px-5 text-sm font-black text-[#06113C] transition active:scale-[0.98]"
        >
          Đổi địa chỉ giao hàng
        </button>

        <button
          type="button"
          onClick={onChangePhone}
          className="mt-4 w-full text-center text-sm font-black text-neutral-500 transition hover:text-[#00B14F]"
        >
          Dùng số điện thoại khác
        </button>
        <BranchSelectorModal
          open={branchSelectorOpen}
          branches={availableBranches}
          selectedBranch={selectedBranch}
          onClose={onCloseBranchSelector}
          onSelect={onSelectBranch}
        />
      </GateLayout>
    );
  }

  return (
    <GateLayout>
      <div className="text-center">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#00B14F]">
          Chọn nơi giao hàng
        </p>
        <h1 className="mt-3 text-2xl font-black leading-tight text-[#06113C]">
          Nhập địa chỉ trước khi xem menu
        </h1>
        <p className="mt-3 text-sm font-bold leading-6 text-neutral-500">
          Menu, giá món và tình trạng còn món có thể khác theo từng chi nhánh.
          Quán cần địa chỉ để chọn đúng nơi phục vụ bạn.
        </p>
      </div>

      {statusMessage && (
        <div className="mt-5 rounded-2xl bg-[#E8FFF1] px-4 py-3 text-sm font-bold leading-5 text-[#007A38]">
          {statusMessage}
        </div>
      )}

      <div className="relative mt-5">
        <label
          htmlFor="branch-gate-address"
          className="mb-2 block text-sm font-black text-[#06113C]"
        >
          Địa chỉ giao hàng
        </label>

        <input
          id="branch-gate-address"
          value={customerAddress || ""}
          onChange={(event) => onAddressChange(event.target.value)}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls="branch-gate-address-suggestions"
          placeholder="Ví dụ: 178 Cô Giang, Quận 1"
          className="h-14 w-full rounded-2xl border-2 border-black/10 bg-white px-4 text-sm font-black text-[#06113C] outline-none transition focus:border-[#00B14F] focus:ring-4 focus:ring-[#00B14F]/10"
        />

        <p className="mt-2 text-xs font-bold leading-5 text-neutral-400">
          Nhập ít nhất số nhà và tên đường. Danh sách Google Maps sẽ hiện sau
          khi bạn ngừng gõ trong giây lát.
        </p>

        {addressLoading && (
          <p className="mt-2 rounded-2xl bg-neutral-50 px-4 py-3 text-xs font-black text-neutral-500">
            Đang tìm địa chỉ...
          </p>
        )}

        {addressSuggestions.length > 0 && (
         <div
  id="branch-gate-address-suggestions"
  role="listbox"
  className="relative z-[2000] mt-2 max-h-72 overflow-y-auto rounded-2xl border border-black/10 bg-white shadow-2xl"
>
            {addressSuggestions.map((suggestion) => (
              <button
                key={suggestion.placeId}
                type="button"
                role="option"
                onClick={() => onSelectAddressSuggestion(suggestion)}
                className="block w-full border-b border-black/5 px-4 py-3 text-left transition last:border-b-0 hover:bg-[#F5FFF8]"
              >
                <p className="text-sm font-black text-[#06113C]">
                  {suggestion.mainText || suggestion.text}
                </p>

                {suggestion.secondaryText && (
                  <p className="mt-1 text-xs font-bold leading-5 text-neutral-500">
                    {suggestion.secondaryText}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}

        {!addressLoading && addressSearchMessage && (
          <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-700">
            {addressSearchMessage}
          </div>
        )}
      </div>

      <textarea
        value={customerAddressDetail || ""}
        onChange={(event) => onAddressDetailChange(event.target.value)}
        placeholder="Chi tiết: số phòng, tầng, hẻm, tên khách sạn..."
        rows={2}
        className="mt-3 w-full rounded-2xl border-2 border-black/10 bg-white px-4 py-3 text-sm font-bold text-[#06113C] outline-none transition focus:border-[#00B14F] focus:ring-4 focus:ring-[#00B14F]/10"
      />

      {routeLoading && (
        <div className="mt-4 rounded-2xl bg-[#FFF7E8] px-4 py-3 text-sm font-bold text-[#B45309]">
          Đang tính quãng đường và chọn chi nhánh gần nhất...
        </div>
      )}

      {!routeLoading && branchMenuLoading && (
        <div className="mt-4 rounded-2xl bg-[#E8FFF1] px-4 py-3 text-sm font-bold text-[#007A38]">
          Đã chọn chi nhánh. Hệ thống đang tải menu, giá và tình trạng món của
          chi nhánh này...
        </div>
      )}

      {addressSelected && selectedBranch && (
        <div className="mt-4 rounded-[24px] border border-[#00B14F]/20 bg-[#E8FFF1] p-4">
          <p className="text-xs font-black text-[#00B14F]">
            ✅ Đã xác định chi nhánh phục vụ
          </p>
          <p className="mt-2 font-black text-[#06113C]">
            Ăn Vặt Ngọc Trinh - {selectedBranchLabel}
          </p>
          {routeMessage && (
            <p className="mt-2 text-xs font-bold leading-5 text-neutral-600">
              {routeMessage}
              <button
  type="button"
  onClick={onOpenBranchSelector}
  className="mt-3 w-full rounded-xl border border-[#00B14F]/30 bg-white px-4 py-3 text-sm font-black text-[#00B14F] transition active:scale-[0.98]"
>
  Đổi menu chi nhánh
</button>
            </p>
            
          )}
        </div>
      )}

      {!routeLoading &&
        Boolean(customerAddress?.trim()) &&
        !addressSelected &&
        addressSuggestions.length === 0 &&
        !addressSearchMessage && (
          <p className="mt-3 text-xs font-bold leading-5 text-[#B45309]">
            Hãy chọn một địa chỉ trong danh sách gợi ý Google để hệ thống lấy
            đúng tọa độ.
          </p>
        )}

      {!routeLoading && addressSelected && !selectedBranch && (
        <div className="mt-3 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-xs font-bold leading-5 text-yellow-700">
          Chưa xác định được chi nhánh phục vụ. Hãy sửa địa chỉ phía trên và
          chọn lại một kết quả trong danh sách Google.
          {routeMessage && <p className="mt-1">{routeMessage}</p>}
        </div>
      )}

      <button
        type="button"
        onClick={onConfirmSavedAddress}
        disabled={!canContinueWithAddress}
        className="mt-5 h-14 w-full rounded-2xl bg-[#00B14F] px-5 text-base font-black text-white shadow-lg shadow-[#00B14F]/20 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:shadow-none"
      >
        {routeLoading
          ? "Đang chọn chi nhánh..."
          : branchMenuLoading
          ? "Đang tải menu chi nhánh..."
          : selectedBranch
          ? "Xem menu đúng chi nhánh"
          : "Chọn địa chỉ từ gợi ý"}
      </button>

      <button
        type="button"
        onClick={onChangePhone}
        className="mt-4 w-full text-center text-sm font-black text-neutral-500 transition hover:text-[#00B14F]"
      >
        Dùng số điện thoại khác
      </button>
      <BranchSelectorModal
        open={branchSelectorOpen}
        branches={availableBranches}
        selectedBranch={selectedBranch}
        onClose={onCloseBranchSelector}
        onSelect={onSelectBranch}
      />
    </GateLayout>
  );
}


export function BranchSelectorModal({
  open,
  branches,
  selectedBranch,
  onClose,
  onSelect,
}: {
  open: boolean;
  branches: PreviewSelectedBranch[];
  selectedBranch: PreviewSelectedBranch | null;
  onClose: () => void;
  onSelect: (
    branch: PreviewSelectedBranch
  ) => void | Promise<void>;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-end bg-black/50 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Chọn menu chi nhánh"
    >
      <div className="max-h-[85vh] w-full overflow-y-auto rounded-t-[32px] bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-[32px]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black text-[#00B14F]">
              Menu chi nhánh
            </p>
            <h2 className="mt-1 text-2xl font-black text-[#06113C]">
              Chọn chi nhánh bạn muốn
            </h2>
            <p className="mt-2 text-sm font-bold leading-5 text-neutral-500">
              Menu, giá và tình trạng món có thể khác nhau giữa các chi nhánh.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full bg-neutral-100 px-4 py-2 font-black text-[#06113C]"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {branches.length === 0 ? (
            <div className="rounded-2xl bg-neutral-50 px-4 py-4 text-sm font-bold text-neutral-500">
              Chưa tải được danh sách chi nhánh đang hoạt động.
            </div>
          ) : (
            branches.map((branch) => {
              const active = branch.id === selectedBranch?.id;
              const branchAddress =
                "address" in branch
                  ? String(
                      (branch as PreviewSelectedBranch & {
                        address?: string | null;
                      }).address || ""
                    )
                  : "";

              return (
                <button
                  key={branch.id || branch.code}
                  type="button"
                  onClick={() => onSelect(branch)}
                  className={`w-full rounded-2xl border p-4 text-left transition active:scale-[0.99] ${
                    active
                      ? "border-[#00B14F] bg-[#E8FFF1]"
                      : "border-black/10 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-black text-[#06113C]">
                        Ăn Vặt Ngọc Trinh -{" "}
                        {branch.short_name || branch.code || "Chi nhánh"}
                      </p>

                      {branchAddress && (
                        <p className="mt-2 text-xs font-bold leading-5 text-neutral-500">
                          {branchAddress}
                        </p>
                      )}

                      {(branch.distance_text || branch.duration_text) && (
                        <p className="mt-2 text-xs font-bold text-neutral-500">
                          {[branch.distance_text, branch.duration_text]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </div>

                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-black ${
                        active
                          ? "border-[#00B14F] bg-[#00B14F] text-white"
                          : "border-neutral-300 text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </div>

                  {active && (
                    <p className="mt-3 text-xs font-black text-[#00B14F]">
                      Menu đang được chọn
                    </p>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function GateLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#F5FFF8] to-white px-4 py-8">
      <section className="relative w-full max-w-md overflow-visible rounded-[32px] bg-white p-5 shadow-2xl shadow-black/10 sm:p-7">
        {children}
      </section>
    </main>
  );
}
