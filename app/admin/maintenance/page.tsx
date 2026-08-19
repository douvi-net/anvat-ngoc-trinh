"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";

type MaintenanceSettings = {
  maintenance_enabled: boolean;
  maintenance_disable_checkout: boolean;
  maintenance_title: string;
  maintenance_message: string;
  maintenance_zalo_q1: string;
  maintenance_zalo_q6: string;
  updated_at: string | null;
};

const defaults: MaintenanceSettings = {
  maintenance_enabled: false,
  maintenance_disable_checkout: false,
  maintenance_title: "Website đang được cập nhật",
  maintenance_message:
    "Hệ thống đặt món trực tuyến đang được bảo trì để nâng cấp trải nghiệm. Trong thời gian này, bạn có thể đặt món nhanh qua Zalo của từng chi nhánh.",
  maintenance_zalo_q1: "0392968034",
  maintenance_zalo_q6: "0392496220",
  updated_at: null,
};

export default function AdminMaintenancePage() {
  const [settings, setSettings] =
    useState<MaintenanceSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/maintenance", {
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.message || "Không tải được cấu hình bảo trì."
        );
      }

      setSettings({
        ...defaults,
        ...(payload.settings || {}),
      });
    } catch (error) {
      console.error(error);
      alert("Không tải được cấu hình bảo trì.");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);

    try {
      const response = await fetch("/api/admin/maintenance", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.message || "Không lưu được chế độ bảo trì."
        );
      }

      setSettings({
        ...defaults,
        ...(payload.settings || {}),
      });

      alert(payload.message || "Đã lưu chế độ bảo trì.");
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Không lưu được chế độ bảo trì."
      );
    } finally {
      setSaving(false);
    }
  }

  function update<K extends keyof MaintenanceSettings>(
    key: K,
    value: MaintenanceSettings[K]
  ) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <AdminLayout>
      <div>
        <p className="font-black text-[#00B14F]">HỆ THỐNG</p>
        <h1 className="mt-1 text-4xl font-black text-[#06113C]">
          Bảo trì website
        </h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-neutral-500">
          Bật popup thông báo cho khách trong lúc nâng cấp website và chuyển
          khách sang đặt món qua Zalo của từng chi nhánh.
        </p>
      </div>

      {loading ? (
        <div className="mt-8 rounded-[28px] bg-white p-6 font-black text-[#06113C] shadow-xl shadow-black/5">
          Đang tải cấu hình...
        </div>
      ) : (
        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.75fr]">
          <div className="rounded-[32px] bg-white p-6 shadow-xl shadow-black/5">
            <div className="space-y-4">
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-black/10 p-4">
                <span>
                  <span className="block font-black text-[#06113C]">
                    Chế độ bảo trì
                  </span>
                  <span className="mt-1 block text-xs font-semibold text-neutral-500">
                    Hiển thị popup và thanh thông báo nhỏ trên website.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.maintenance_enabled}
                  onChange={(event) =>
                    update(
                      "maintenance_enabled",
                      event.target.checked
                    )
                  }
                  className="h-6 w-6 accent-[#00B14F]"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <span>
                  <span className="block font-black text-amber-900">
                    Tạm khóa đặt món trên website
                  </span>
                  <span className="mt-1 block text-xs font-semibold leading-5 text-amber-800/75">
                    Khi bật, khách vẫn xem website/menu nhưng lúc xác nhận đơn
                    sẽ được đưa về popup Zalo.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.maintenance_disable_checkout}
                  onChange={(event) =>
                    update(
                      "maintenance_disable_checkout",
                      event.target.checked
                    )
                  }
                  className="h-6 w-6 accent-amber-600"
                />
              </label>
            </div>

            <div className="mt-7 grid gap-5">
              <div>
                <label className="text-sm font-black text-neutral-500">
                  Tiêu đề popup
                </label>
                <input
                  value={settings.maintenance_title}
                  onChange={(event) =>
                    update("maintenance_title", event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
                />
              </div>

              <div>
                <label className="text-sm font-black text-neutral-500">
                  Nội dung thông báo
                </label>
                <textarea
                  value={settings.maintenance_message}
                  onChange={(event) =>
                    update("maintenance_message", event.target.value)
                  }
                  rows={5}
                  className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-4 font-bold leading-6 outline-none focus:border-[#00B14F]"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-black text-neutral-500">
                    Zalo Quận 1
                  </label>
                  <input
                    value={settings.maintenance_zalo_q1}
                    onChange={(event) =>
                      update(
                        "maintenance_zalo_q1",
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
                  />
                </div>

                <div>
                  <label className="text-sm font-black text-neutral-500">
                    Zalo Quận 6
                  </label>
                  <input
                    value={settings.maintenance_zalo_q6}
                    onChange={(event) =>
                      update(
                        "maintenance_zalo_q6",
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
                  />
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="rounded-2xl bg-[#00B14F] px-6 py-4 font-black text-white shadow-lg shadow-[#00B14F]/20 disabled:opacity-60"
              >
                {saving ? "Đang lưu..." : "Lưu chế độ bảo trì"}
              </button>

              <button
                type="button"
                onClick={() =>
                  setSettings((current) => ({
                    ...current,
                    maintenance_enabled: true,
                    maintenance_disable_checkout: true,
                  }))
                }
                className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 font-black text-amber-800"
              >
                Chuẩn bị bật bảo trì
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div
              className={`rounded-[32px] p-6 shadow-xl shadow-black/5 ${
                settings.maintenance_enabled
                  ? "bg-[#06113C] text-white"
                  : "bg-white text-[#06113C]"
              }`}
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00B14F]">
                Trạng thái hiện tại
              </p>
              <h2 className="mt-3 text-3xl font-black">
                {settings.maintenance_enabled
                  ? "Đang bảo trì"
                  : "Website hoạt động bình thường"}
              </h2>

              <p className="mt-4 text-sm font-semibold leading-6 opacity-70">
                {settings.maintenance_enabled
                  ? settings.maintenance_disable_checkout
                    ? "Popup đang bật và checkout website đang bị khóa."
                    : "Popup đang bật nhưng khách vẫn có thể đặt đơn trên website."
                  : "Khách không thấy thông báo bảo trì."}
              </p>

              {settings.updated_at && (
                <p className="mt-4 text-xs font-bold opacity-50">
                  Cập nhật:{" "}
                  {new Date(settings.updated_at).toLocaleString(
                    "vi-VN"
                  )}
                </p>
              )}
            </div>

            <div className="rounded-[32px] border border-blue-100 bg-blue-50 p-6">
              <p className="font-black text-[#06113C]">
                Kênh đặt món trong lúc bảo trì
              </p>

              <div className="mt-4 space-y-3 text-sm font-bold text-neutral-700">
                <p>Quận 1 · {settings.maintenance_zalo_q1}</p>
                <p>Quận 6 · {settings.maintenance_zalo_q6}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
