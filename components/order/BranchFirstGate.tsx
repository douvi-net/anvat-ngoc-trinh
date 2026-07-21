"use client";

import { useState } from "react";
import type { PreviewSelectedBranch } from "@/lib/mapsPreviewNearestBranch";

interface BranchFirstGateProps {
  phone: string;
  customerName: string | null;
  customerAddress: string | null;
  customerAddressDetail: string | null;
  selectedBranch: PreviewSelectedBranch | null;
  checkingCustomer: boolean;
  errorMessage: string | null;
  onPhoneChange: (phone: string) => void;
  onConfirmSavedAddress: () => void;
  onChooseAddress: () => void;
  onChangePhone: () => void;
}

export function BranchFirstGate({
  phone,
  customerName,
  customerAddress,
  customerAddressDetail,
  selectedBranch,
  checkingCustomer,
  errorMessage,
  onPhoneChange,
  onConfirmSavedAddress,
  onChooseAddress,
  onChangePhone,
}: BranchFirstGateProps) {
  const [localPhone, setLocalPhone] = useState(phone);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isValidPhone = /^0(3|5|7|8|9)\d{8}$/.test(localPhone);
  const hasAddress = !!customerAddress && !!selectedBranch;
  const isLoading = checkingCustomer;

  const handlePhoneSubmit = () => {
    if (!isValidPhone) {
      setValidationError("Vui lòng nhập số điện thoại hợp lệ (10 chữ số, bắt đầu 0)");
      return;
    }
    setValidationError(null);
    onPhoneChange(localPhone);
  };

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setLocalPhone(value);
    setValidationError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      handlePhoneSubmit();
    }
  };

  // State A: No valid phone
  if (!phone || !isValidPhone) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                Ăn Vặt Ngọc Trinh
              </h1>
              <p className="text-base text-slate-600 leading-relaxed">
                Nhập số điện thoại để quán tìm địa chỉ cũ và chọn chi nhánh giao nhanh nhất
              </p>
            </div>

            {/* Phone Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Số điện thoại
              </label>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="0912345678"
                value={localPhone}
                onChange={handlePhoneInputChange}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="w-full px-4 py-3 text-base border-2 border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
              {(validationError || errorMessage) && (
                <p className="mt-2 text-sm text-red-600">
                  {validationError || errorMessage}
                </p>
              )}
            </div>

            {/* Continue Button */}
            <button
              onClick={handlePhoneSubmit}
              disabled={!isValidPhone || isLoading}
              className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors mb-4"
            >
              {isLoading ? "Đang kiểm tra..." : "Tiếp tục"}
            </button>

            {/* Info Text */}
            <p className="text-center text-xs text-slate-500">
              Số điện thoại giúp quán tìm lại địa chỉ, xu tích lũy và ưu đãi của bạn
            </p>
          </div>
        </div>
      </div>
    );
  }

  // State B: Old customer with address and selected branch
  if (hasAddress && !isLoading) {
    const distanceText = selectedBranch?.distance_text
      ? ` (${selectedBranch.distance_text})`
      : "";
    const durationText = selectedBranch?.duration_text
      ? ` - ${selectedBranch.duration_text}`
      : "";

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Giao đến
              </h1>
              <p className="text-sm text-slate-500">
                Địa chỉ của bạn
              </p>
            </div>

            {/* Address Card */}
            <div className="bg-slate-50 rounded-lg p-4 mb-6 border-2 border-slate-200">
              <p className="font-semibold text-slate-900 mb-1">
                {customerAddress}
              </p>
              {customerAddressDetail && (
                <p className="text-sm text-slate-600 mb-3">
                  {customerAddressDetail}
                </p>
              )}
              <p className="text-xs font-medium text-orange-600">
                Chi nhánh phục vụ: {selectedBranch?.code}
                {distanceText}
                {durationText}
              </p>
            </div>

            {/* Main Button */}
            <button
              onClick={onConfirmSavedAddress}
              className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors mb-3"
            >
              Giao đến địa chỉ này
            </button>

            {/* Secondary Button */}
            <button
              onClick={onChooseAddress}
              className="w-full py-3 px-4 bg-white border-2 border-slate-300 hover:border-slate-400 text-slate-900 font-semibold rounded-lg transition-colors mb-3"
            >
              Đổi địa chỉ
            </button>

            {/* Change Phone Link */}
            <button
              onClick={onChangePhone}
              className="w-full text-center text-sm text-slate-600 hover:text-orange-600 font-medium transition-colors"
            >
              Dùng số điện thoại khác
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State C: New customer or missing address/coords
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              Ăn Vặt Ngọc Trinh
            </h1>
            <p className="text-base text-slate-600">
              Chưa có địa chỉ giao hàng
            </p>
          </div>

          {/* Choose Address Button */}
          <button
            onClick={onChooseAddress}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors mb-4"
          >
            {isLoading ? "Đang tải..." : "Chọn địa chỉ giao hàng"}
          </button>

          {/* Change Phone Link */}
          <button
            onClick={onChangePhone}
            className="w-full text-center text-sm text-slate-600 hover:text-orange-600 font-medium transition-colors"
          >
            Dùng số điện thoại khác
          </button>

          {/* Info Text */}
          {errorMessage && (
            <p className="mt-4 text-center text-sm text-red-600">
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
