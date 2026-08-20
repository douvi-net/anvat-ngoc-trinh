"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";

type Branch = { id: string; code: string; short_name: string; address: string | null };
type PaymentSettings = {
  branch_id: string;
  payment_enabled: boolean;
  payment_qr_url: string | null;
  payment_bank_name: string | null;
  payment_account_name: string | null;
  payment_account_number: string | null;
  payment_note: string | null;
  updated_at: string | null;
};

const emptyPayment = (branchId: string): PaymentSettings => ({
  branch_id: branchId,
  payment_enabled: true,
  payment_qr_url: null,
  payment_bank_name: null,
  payment_account_name: null,
  payment_account_number: null,
  payment_note: null,
  updated_at: null,
});

export default function AdminBranchPaymentsPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [settingsByBranch, setSettingsByBranch] = useState<Record<string, PaymentSettings>>({});
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [form, setForm] = useState<PaymentSettings>(emptyPayment(""));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const selectedBranch = useMemo(
    () => branches.find((item) => item.id === selectedBranchId) || null,
    [branches, selectedBranchId]
  );

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    if (!selectedBranchId) return;
    setForm(settingsByBranch[selectedBranchId] || emptyPayment(selectedBranchId));
  }, [selectedBranchId, settingsByBranch]);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/branch-payments", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.message || "Không tải được thanh toán chi nhánh.");

      const nextBranches = (payload.branches || []) as Branch[];
      const nextSettings = (payload.settings || []) as PaymentSettings[];
      const map: Record<string, PaymentSettings> = {};
      nextSettings.forEach((item) => { map[item.branch_id] = item; });

      setBranches(nextBranches);
      setSettingsByBranch(map);
      const nextSelected = selectedBranchId || nextBranches[0]?.id || "";
      setSelectedBranchId(nextSelected);
      if (nextSelected) setForm(map[nextSelected] || emptyPayment(nextSelected));
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Không tải được thanh toán chi nhánh.");
    } finally {
      setLoading(false);
    }
  }

  function update<K extends keyof PaymentSettings>(key: K, value: PaymentSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function uploadQr(file: File | null) {
    if (!file || !selectedBranchId) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.set("branch_id", selectedBranchId);
      body.set("file", file);
      const response = await fetch("/api/admin/branch-payments", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.message || "Không upload được QR.");
      update("payment_qr_url", payload.payment_qr_url || null);
      alert("Đã upload QR. Bấm Lưu để áp dụng.");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Không upload được QR.");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!selectedBranchId) return;
    setSaving(true);
    try {
      const response = await fetch("/api/admin/branch-payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, branch_id: selectedBranchId }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.message || "Không lưu được thanh toán.");
      const saved = payload.settings as PaymentSettings;
      setSettingsByBranch((current) => ({ ...current, [selectedBranchId]: saved }));
      setForm(saved);
      alert(`Đã lưu thanh toán cho ${selectedBranch?.short_name || "chi nhánh"}.`);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Không lưu được thanh toán.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div>
        <p className="font-black text-[#00B14F]">HỆ THỐNG THANH TOÁN</p>
        <h1 className="mt-1 text-4xl font-black text-[#06113C]">Thanh toán theo chi nhánh</h1>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-neutral-500">
          Mỗi chi nhánh dùng QR và tài khoản riêng. Thêm chi nhánh mới chỉ cần cấu hình tại đây.
        </p>
      </div>

      {loading ? (
        <div className="mt-8 rounded-[28px] bg-white p-6 font-black text-[#06113C] shadow-xl shadow-black/5">Đang tải...</div>
      ) : (
        <div className="mt-8 grid gap-6 xl:grid-cols-[0.65fr_1fr]">
          <div className="space-y-4">
            <div className="rounded-[28px] bg-white p-5 shadow-xl shadow-black/5">
              <label className="text-xs font-black uppercase tracking-wider text-neutral-400">Chi nhánh</label>
              <select
                value={selectedBranchId}
                onChange={(event) => setSelectedBranchId(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-4 font-black text-[#06113C] outline-none focus:border-[#00B14F]"
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.short_name} · {branch.code}</option>
                ))}
              </select>
              {selectedBranch?.address && <p className="mt-3 text-xs font-semibold leading-5 text-neutral-500">{selectedBranch.address}</p>}
            </div>

            <div className="rounded-[28px] bg-[#06113C] p-5 text-white shadow-xl shadow-black/5">
              <p className="text-xs font-black uppercase tracking-wider text-[#00B14F]">Trạng thái</p>
              <h2 className="mt-2 text-2xl font-black">
                {form.payment_enabled ? (form.payment_qr_url ? "Sẵn sàng nhận chuyển khoản" : "Thiếu ảnh QR") : "Đã tắt chuyển khoản"}
              </h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-white/60">
                Website không tự dùng QR của chi nhánh khác khi QR hiện tại chưa được cấu hình.
              </p>
            </div>
          </div>

          <div className="rounded-[32px] bg-white p-6 shadow-xl shadow-black/5">
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-black/10 p-4">
              <span>
                <span className="block font-black text-[#06113C]">Cho phép chuyển khoản</span>
                <span className="mt-1 block text-xs font-semibold text-neutral-500">Tắt nếu chi nhánh tạm thời chỉ nhận tiền mặt.</span>
              </span>
              <input type="checkbox" checked={form.payment_enabled} onChange={(e) => update("payment_enabled", e.target.checked)} className="h-6 w-6 accent-[#00B14F]" />
            </label>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-black text-neutral-500">Ảnh QR thanh toán</label>
                <div className="mt-2 grid gap-4 rounded-3xl border border-dashed border-black/15 bg-neutral-50 p-5 md:grid-cols-[220px_1fr]">
                  <div className="flex min-h-[220px] items-center justify-center rounded-2xl bg-white">
                    {form.payment_qr_url ? (
                      <img src={form.payment_qr_url} alt="QR chi nhánh" className="max-h-[220px] max-w-full rounded-xl object-contain" />
                    ) : (
                      <p className="px-4 text-center text-sm font-bold text-neutral-400">Chưa có QR</p>
                    )}
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-sm font-bold leading-6 text-neutral-600">PNG/JPG/WebP, tối đa 5MB. Ảnh lưu trong Supabase Storage theo chi nhánh.</p>
                    <label className="mt-4 inline-flex w-fit cursor-pointer rounded-2xl bg-[#00B14F] px-5 py-4 font-black text-white">
                      {uploading ? "Đang upload..." : "Chọn ảnh QR mới"}
                      <input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading} onChange={(e) => void uploadQr(e.target.files?.[0] || null)} className="hidden" />
                    </label>
                    {form.payment_qr_url && <button type="button" onClick={() => update("payment_qr_url", null)} className="mt-3 w-fit text-sm font-black text-red-600">Gỡ QR khỏi chi nhánh</button>}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-black text-neutral-500">Ngân hàng</label>
                <input value={form.payment_bank_name || ""} onChange={(e) => update("payment_bank_name", e.target.value)} placeholder="Ví dụ: MB Bank" className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]" />
              </div>
              <div>
                <label className="text-sm font-black text-neutral-500">Số tài khoản</label>
                <input value={form.payment_account_number || ""} onChange={(e) => update("payment_account_number", e.target.value)} className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-black text-neutral-500">Tên chủ tài khoản</label>
                <input value={form.payment_account_name || ""} onChange={(e) => update("payment_account_name", e.target.value)} className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-4 font-bold uppercase outline-none focus:border-[#00B14F]" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-black text-neutral-500">Ghi chú dưới QR</label>
                <textarea value={form.payment_note || ""} onChange={(e) => update("payment_note", e.target.value)} rows={3} placeholder="Ví dụ: Nội dung chuyển khoản: mã đơn hàng" className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-4 font-bold leading-6 outline-none focus:border-[#00B14F]" />
              </div>
            </div>

            <button type="button" onClick={save} disabled={saving || !selectedBranchId} className="mt-6 rounded-2xl bg-[#00B14F] px-6 py-4 font-black text-white shadow-lg shadow-[#00B14F]/20 disabled:opacity-50">
              {saving ? "Đang lưu..." : `Lưu cho ${selectedBranch?.short_name || "chi nhánh"}`}
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
