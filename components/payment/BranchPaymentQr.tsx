"use client";

import { useEffect, useMemo, useState } from "react";

type BranchPaymentData = {
  branch_id: string;
  branch_code: string;
  branch_name: string;
  payment_enabled: boolean;
  payment_qr_url: string | null;
  payment_bank_name: string | null;
  payment_account_name: string | null;
  payment_account_number: string | null;
  payment_note: string | null;
  configured: boolean;
};

type Props = {
  branchId?: string | null;
  orderId?: string | null;
  branchLabel?: string | null;
};

function text(value: string | null | undefined) {
  return String(value || "").trim();
}

export default function BranchPaymentQr({ branchId, orderId, branchLabel }: Props) {
  const [data, setData] = useState<BranchPaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (orderId) params.set("orderId", orderId);
    else if (branchId) params.set("branchId", branchId);
    return params.toString();
  }, [branchId, orderId]);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!query) {
        setData(null);
        setErrorMessage("Chưa xác định chi nhánh thanh toán.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(`/api/branch-payment?${query}`, {
          method: "GET",
          cache: "no-store",
        });
        const payload = await response.json();
        if (!active) return;

        if (!response.ok || !payload.ok) {
          throw new Error(payload.message || "Không tải được thông tin thanh toán.");
        }

        setData(payload.payment || null);
      } catch (error) {
        if (!active) return;
        setData(null);
        setErrorMessage(
          error instanceof Error ? error.message : "Không tải được thông tin thanh toán."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [query]);

  if (loading) {
    return (
      <div className="w-full max-w-[320px] rounded-3xl border border-black/10 bg-white p-5 text-center shadow-lg">
        <div className="mx-auto h-52 w-52 animate-pulse rounded-2xl bg-neutral-100" />
        <p className="mt-4 text-sm font-bold text-neutral-400">Đang tải QR thanh toán...</p>
      </div>
    );
  }

  if (errorMessage || !data || !data.payment_enabled || !data.configured || !data.payment_qr_url) {
    return (
      <div className="w-full max-w-[360px] rounded-3xl border border-amber-200 bg-amber-50 p-5 text-left">
        <p className="font-black text-amber-900">Chưa có QR chuyển khoản cho chi nhánh này</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-amber-800/80">
          {errorMessage || "Vui lòng chọn tiền mặt hoặc liên hệ quán để được hướng dẫn thanh toán."}
        </p>
      </div>
    );
  }

  const displayBranch = text(data.branch_name) || text(branchLabel) || text(data.branch_code) || "Chi nhánh";
  const bankName = text(data.payment_bank_name);
  const accountName = text(data.payment_account_name);
  const accountNumber = text(data.payment_account_number);

  return (
    <div className="w-full max-w-[360px] rounded-3xl border border-black/10 bg-white p-4 shadow-lg">
      <div className="rounded-2xl bg-[#F5FFF8] px-4 py-3 text-left">
        <p className="text-[11px] font-black uppercase tracking-widest text-[#00B14F]">Thanh toán cho</p>
        <p className="mt-1 text-lg font-black text-[#06113C]">{displayBranch}</p>

        {(bankName || accountNumber || accountName) && (
          <div className="mt-3 space-y-1 text-xs font-bold text-neutral-600">
            {bankName && <p>Ngân hàng: {bankName}</p>}
            {accountNumber && <p>Số tài khoản: {accountNumber}</p>}
            {accountName && <p>Chủ tài khoản: {accountName}</p>}
          </div>
        )}
      </div>

      <img
        src={data.payment_qr_url}
        alt={`QR thanh toán ${displayBranch}`}
        className="mx-auto mt-4 w-full max-w-[320px] rounded-2xl object-contain"
      />

      {data.payment_note && (
        <p className="mt-3 text-center text-xs font-semibold leading-5 text-neutral-500">
          {data.payment_note}
        </p>
      )}
    </div>
  );
}
