"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";

type BranchOption = {
  id: string;
  code: string;
  shortName: string;
  name: string;
  address: string;
  isActive: boolean;
};

type MerchantAccount = {
  userId: string;
  email: string | null;
  displayName: string;
  role: "super_admin" | "branch_owner";
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  lastSignInAt: string | null;
  branch: BranchOption | null;
  activeMembershipCount: number;
  configurationWarning: string | null;
};

type Credentials = {
  email: string | null;
  temporaryPassword: string;
};

const emptyCreateForm = {
  displayName: "",
  email: "",
  branchId: "",
};

function formatDateTime(value: string | null) {
  if (!value) return "Chưa có";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminMerchantsPage() {
  const [accounts, setAccounts] = useState<MerchantAccount[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editing, setEditing] = useState<MerchantAccount | null>(null);
  const [editName, setEditName] = useState("");
  const [editBranchId, setEditBranchId] = useState("");
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [message, setMessage] = useState("");

  const activeBranches = useMemo(
    () => branches.filter((branch) => branch.isActive),
    [branches]
  );

  const ownerAccounts = useMemo(
    () => accounts.filter((account) => account.role === "branch_owner"),
    [accounts]
  );

  const activeOwnerCount = ownerAccounts.filter(
    (account) => account.isActive
  ).length;
  const lockedOwnerCount = ownerAccounts.length - activeOwnerCount;

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/merchant-accounts", {
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Không tải được tài khoản Merchant.");
      }

      setAccounts(payload.accounts || []);
      setBranches(payload.branches || []);

      setCreateForm((current) => ({
        ...current,
        branchId:
          current.branchId ||
          (payload.branches || []).find(
            (branch: BranchOption) => branch.isActive
          )?.id ||
          "",
      }));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Không tải được dữ liệu."
      );
    } finally {
      setLoading(false);
    }
  }

  async function createAccount(event: React.FormEvent) {
    event.preventDefault();

    if (!createForm.displayName.trim() || !createForm.email.trim()) {
      setMessage("Nhập đầy đủ tên và email Merchant.");
      return;
    }

    if (!createForm.branchId) {
      setMessage("Chọn chi nhánh cho tài khoản Merchant.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/merchant-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Không tạo được tài khoản.");
      }

      setCredentials(payload.credentials || null);
      setMessage("Đã tạo tài khoản branch_owner thành công.");
      setCreateForm({
        ...emptyCreateForm,
        branchId: activeBranches[0]?.id || "",
      });
      await loadAccounts();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Không tạo được tài khoản."
      );
    } finally {
      setSaving(false);
    }
  }

  function startEdit(account: MerchantAccount) {
    if (account.role !== "branch_owner") return;

    setEditing(account);
    setEditName(account.displayName);
    setEditBranchId(account.branch?.id || activeBranches[0]?.id || "");
    setMessage("");
  }

  async function saveEdit() {
    if (!editing) return;
    if (!editName.trim() || !editBranchId) {
      setMessage("Tên và chi nhánh không được để trống.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/merchant-accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editing.userId,
          action: "update",
          displayName: editName,
          branchId: editBranchId,
          isActive: editing.isActive,
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Không lưu được tài khoản.");
      }

      setEditing(null);
      setMessage("Đã cập nhật tài khoản Merchant.");
      await loadAccounts();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Không lưu được tài khoản."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleAccount(account: MerchantAccount) {
    if (account.role !== "branch_owner" || !account.branch) return;

    const nextActive = !account.isActive;
    const confirmed = window.confirm(
      nextActive
        ? `Mở lại tài khoản ${account.displayName}?`
        : `Khóa tài khoản ${account.displayName}? Người dùng sẽ không được vận hành Merchant App.`
    );

    if (!confirmed) return;

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/merchant-accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: account.userId,
          action: "update",
          displayName: account.displayName,
          branchId: account.branch.id,
          isActive: nextActive,
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Không đổi được trạng thái.");
      }

      setMessage(nextActive ? "Đã mở lại tài khoản." : "Đã khóa tài khoản.");
      await loadAccounts();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Không đổi được trạng thái."
      );
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword(account: MerchantAccount) {
    if (account.role !== "branch_owner") return;

    const confirmed = window.confirm(
      `Tạo mật khẩu tạm mới cho ${account.displayName}? Mật khẩu cũ sẽ không còn đăng nhập được.`
    );
    if (!confirmed) return;

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/merchant-accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: account.userId,
          action: "reset_password",
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Không đặt lại được mật khẩu.");
      }

      setCredentials(payload.credentials || null);
      setMessage("Đã tạo mật khẩu tạm mới.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Không đặt lại được mật khẩu."
      );
    } finally {
      setSaving(false);
    }
  }

  async function copyCredentials() {
    if (!credentials) return;

    await navigator.clipboard.writeText(
      `Email: ${credentials.email || ""}\nMật khẩu tạm: ${credentials.temporaryPassword}`
    );
    setMessage("Đã sao chép thông tin đăng nhập.");
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#00B14F]">
              Hệ thống Merchant
            </p>
            <h1 className="mt-2 text-3xl font-black text-[#06113C] md:text-4xl">
              Tài khoản Merchant
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-neutral-500">
              Tạo branch_owner, gán đúng một chi nhánh và khóa/mở tài khoản từ
              website quản trị.
            </p>
          </div>

          <button
            type="button"
            onClick={loadAccounts}
            disabled={loading || saving}
            className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-black text-[#06113C] shadow-sm disabled:opacity-50"
          >
            Tải lại dữ liệu
          </button>
        </div>

        {message ? (
          <div className="rounded-2xl border border-[#00B14F]/20 bg-[#EDFFF4] px-4 py-3 text-sm font-bold text-[#075B2B]">
            {message}
          </div>
        ) : null}

        {credentials ? (
          <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-amber-700">
                  Chỉ hiển thị lúc này
                </p>
                <h2 className="mt-1 text-xl font-black text-[#06113C]">
                  Thông tin đăng nhập Merchant
                </h2>
                <p className="mt-3 break-all text-sm font-bold text-neutral-700">
                  Email: {credentials.email || "Không có email"}
                </p>
                <p className="mt-1 break-all text-sm font-bold text-neutral-700">
                  Mật khẩu tạm: {credentials.temporaryPassword}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyCredentials}
                  className="rounded-2xl bg-[#06113C] px-4 py-3 text-sm font-black text-white"
                >
                  Sao chép
                </button>
                <button
                  type="button"
                  onClick={() => setCredentials(null)}
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-black text-neutral-700"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Branch owner" value={String(ownerAccounts.length)} />
          <StatCard label="Đang hoạt động" value={String(activeOwnerCount)} />
          <StatCard label="Đang khóa" value={String(lockedOwnerCount)} />
          <StatCard label="Chi nhánh active" value={String(activeBranches.length)} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <form
            onSubmit={createAccount}
            className="h-fit rounded-[30px] bg-white p-6 shadow-xl shadow-black/5"
          >
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#00B14F]">
                Thêm tài khoản
              </p>
              <h2 className="mt-1 text-2xl font-black text-[#06113C]">
                Branch owner mới
              </h2>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-black text-neutral-700">Tên hiển thị</span>
                <input
                  value={createForm.displayName}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      displayName: event.target.value,
                    }))
                  }
                  placeholder="Ví dụ: Chủ chi nhánh Quận 6"
                  className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 font-semibold outline-none focus:border-[#00B14F]"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-neutral-700">Email đăng nhập</span>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder="owner@anvatngoctrinh.vn"
                  className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 font-semibold outline-none focus:border-[#00B14F]"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-neutral-700">Quyền</span>
                <input
                  value="branch_owner"
                  disabled
                  className="mt-2 w-full rounded-2xl border border-black/5 bg-neutral-100 px-4 py-3 font-bold text-neutral-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-neutral-700">Chi nhánh</span>
                <select
                  value={createForm.branchId}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      branchId: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 font-bold outline-none focus:border-[#00B14F]"
                >
                  <option value="">Chọn chi nhánh</option>
                  {activeBranches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.shortName} — {branch.address}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-5 rounded-2xl bg-[#F5FFF8] p-4 text-xs font-semibold leading-5 text-neutral-600">
              Hệ thống sẽ tự tạo mật khẩu tạm mạnh. Mật khẩu chỉ được trả về một
              lần sau khi tạo tài khoản.
            </div>

            <button
              disabled={saving || loading || activeBranches.length === 0}
              className="mt-5 w-full rounded-2xl bg-[#00B14F] px-5 py-4 font-black text-white shadow-xl shadow-[#00B14F]/20 disabled:opacity-50"
            >
              {saving ? "Đang xử lý..." : "Tạo tài khoản Merchant"}
            </button>
          </form>

          <div className="rounded-[30px] bg-white p-4 shadow-xl shadow-black/5 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-neutral-400">
                  Danh sách
                </p>
                <h2 className="mt-1 text-2xl font-black text-[#06113C]">
                  Merchant hiện tại
                </h2>
              </div>
              <span className="rounded-full bg-neutral-100 px-3 py-2 text-xs font-black text-neutral-600">
                {accounts.length} tài khoản
              </span>
            </div>

            {loading ? (
              <div className="py-16 text-center text-sm font-bold text-neutral-400">
                Đang tải tài khoản...
              </div>
            ) : accounts.length === 0 ? (
              <div className="py-16 text-center text-sm font-bold text-neutral-400">
                Chưa có Merchant profile.
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {accounts.map((account) => (
                  <div
                    key={account.userId}
                    className="rounded-[24px] border border-black/5 bg-[#FAFCFB] p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-lg font-black text-[#06113C]">
                            {account.displayName}
                          </p>
                          <RoleBadge role={account.role} />
                          <StatusBadge active={account.isActive} />
                        </div>

                        <p className="mt-1 truncate text-sm font-semibold text-neutral-500">
                          {account.email || "Auth user không có email"}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs font-bold text-neutral-500">
                          <span>
                            Chi nhánh: {account.role === "super_admin"
                              ? "Toàn hệ thống"
                              : account.branch?.shortName || "Chưa gán"}
                          </span>
                          <span>Đăng nhập: {formatDateTime(account.lastSignInAt)}</span>
                        </div>

                        {account.configurationWarning ? (
                          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700">
                            Cấu hình cần kiểm tra: {account.configurationWarning}
                          </p>
                        ) : null}
                      </div>

                      {account.role === "branch_owner" ? (
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <button
                            type="button"
                            onClick={() => startEdit(account)}
                            disabled={saving}
                            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-black text-[#06113C] disabled:opacity-50"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => resetPassword(account)}
                            disabled={saving}
                            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-black text-[#06113C] disabled:opacity-50"
                          >
                            Mật khẩu mới
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleAccount(account)}
                            disabled={saving || !account.branch}
                            className={`rounded-xl px-3 py-2 text-xs font-black text-white disabled:opacity-50 ${
                              account.isActive ? "bg-red-500" : "bg-[#00B14F]"
                            }`}
                          >
                            {account.isActive ? "Khóa" : "Mở lại"}
                          </button>
                        </div>
                      ) : (
                        <span className="rounded-xl bg-[#06113C]/5 px-3 py-2 text-xs font-black text-[#06113C]">
                          Chỉ xem
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-lg rounded-[32px] bg-white p-6 shadow-2xl">
            <p className="text-xs font-black uppercase tracking-widest text-[#00B14F]">
              Cập nhật branch owner
            </p>
            <h2 className="mt-1 text-2xl font-black text-[#06113C]">
              {editing.displayName}
            </h2>
            <p className="mt-1 text-sm font-semibold text-neutral-500">
              {editing.email}
            </p>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-black text-neutral-700">Tên hiển thị</span>
                <input
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 font-semibold outline-none focus:border-[#00B14F]"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-neutral-700">Chi nhánh</span>
                <select
                  value={editBranchId}
                  onChange={(event) => setEditBranchId(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 font-bold outline-none focus:border-[#00B14F]"
                >
                  <option value="">Chọn chi nhánh</option>
                  {activeBranches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.shortName} — {branch.address}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                disabled={saving}
                className="rounded-2xl border border-black/10 px-4 py-3 text-sm font-black text-neutral-600 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={saving}
                className="rounded-2xl bg-[#00B14F] px-5 py-3 text-sm font-black text-white disabled:opacity-50"
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-white p-5 shadow-lg shadow-black/5">
      <p className="text-xs font-black uppercase tracking-widest text-neutral-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black text-[#06113C]">{value}</p>
    </div>
  );
}

function RoleBadge({ role }: { role: MerchantAccount["role"] }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
        role === "super_admin"
          ? "bg-[#06113C] text-white"
          : "bg-[#00B14F]/10 text-[#00863D]"
      }`}
    >
      {role}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
        active
          ? "bg-emerald-100 text-emerald-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {active ? "Đang hoạt động" : "Đã khóa"}
    </span>
  );
}
