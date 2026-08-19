"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type MaintenanceSettings = {
  maintenance_enabled: boolean;
  maintenance_disable_checkout: boolean;
  maintenance_title: string;
  maintenance_message: string;
  maintenance_zalo_q1: string;
  maintenance_zalo_q6: string;
  updated_at: string | null;
};

type MaintenanceResponse = {
  ok: boolean;
  settings?: MaintenanceSettings;
};

const DEFAULT_SETTINGS: MaintenanceSettings = {
  maintenance_enabled: false,
  maintenance_disable_checkout: false,
  maintenance_title: "Website đang được cập nhật",
  maintenance_message:
    "Hệ thống đặt món trực tuyến đang được bảo trì để nâng cấp trải nghiệm. Trong thời gian này, bạn có thể đặt món nhanh qua Zalo của từng chi nhánh.",
  maintenance_zalo_q1: "0392968034",
  maintenance_zalo_q6: "0392496220",
  updated_at: null,
};

function digitsOnly(value: string) {
  return String(value || "").replace(/\D/g, "");
}

function formatPhone(value: string) {
  const digits = digitsOnly(value);
  if (digits.length === 10) {
    return `${digits.slice(0, 4)}.${digits.slice(4, 7)}.${digits.slice(7)}`;
  }
  return value;
}

export default function MaintenanceNotice() {
  const pathname = usePathname();
  const [settings, setSettings] =
    useState<MaintenanceSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const isAdmin = pathname?.startsWith("/admin");

  const dismissalKey = useMemo(() => {
    const version = settings.updated_at || "default";
    return `avnt-maintenance-dismissed:${version}`;
  }, [settings.updated_at]);

  useEffect(() => {
    if (isAdmin) {
      setLoaded(true);
      return;
    }

    let active = true;

    async function loadMaintenance() {
      try {
        const response = await fetch("/api/maintenance", {
          method: "GET",
          cache: "no-store",
        });

        const payload = (await response.json()) as MaintenanceResponse;

        if (!active) return;

        if (response.ok && payload.ok && payload.settings) {
          setSettings(payload.settings);

          if (payload.settings.maintenance_enabled) {
            const version =
              payload.settings.updated_at || "default";
            const key = `avnt-maintenance-dismissed:${version}`;
            const dismissed =
              typeof window !== "undefined"
                ? window.sessionStorage.getItem(key) === "1"
                : false;

            setModalOpen(!dismissed);
          }
        }
      } catch (error) {
        console.warn("MAINTENANCE NOTICE LOAD ERROR:", error);
      } finally {
        if (active) setLoaded(true);
      }
    }

    void loadMaintenance();

    return () => {
      active = false;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) return;

    function reopen() {
      if (settings.maintenance_enabled) {
        setModalOpen(true);
      }
    }

    window.addEventListener("avnt:maintenance-open", reopen);

    return () => {
      window.removeEventListener("avnt:maintenance-open", reopen);
    };
  }, [isAdmin, settings.maintenance_enabled]);

  function dismiss() {
    try {
      window.sessionStorage.setItem(dismissalKey, "1");
    } catch {
      // sessionStorage có thể bị chặn ở một số trình duyệt riêng tư.
    }
    setModalOpen(false);
  }

  if (isAdmin || !loaded || !settings.maintenance_enabled) {
    return null;
  }

  const q1Phone = digitsOnly(settings.maintenance_zalo_q1);
  const q6Phone = digitsOnly(settings.maintenance_zalo_q6);

  return (
    <>
      {!modalOpen && (
        <div className="fixed left-1/2 top-3 z-[4500] w-[94%] max-w-xl -translate-x-1/2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 shadow-xl shadow-black/10">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="min-w-0 flex-1 text-left"
            >
              <p className="truncate text-xs font-black text-amber-800">
                🛠 Website đang bảo trì
              </p>
              <p className="mt-0.5 truncate text-[11px] font-bold text-amber-700/80">
                Đặt món nhanh qua Zalo Q1 hoặc Q6
              </p>
            </button>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-black text-[#06113C] ring-1 ring-black/5"
            >
              Xem
            </button>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-[#06113C]/65 px-4 py-6 backdrop-blur-[3px]">
          <div className="relative w-full max-w-md overflow-hidden rounded-[32px] bg-white shadow-2xl">
            <button
              type="button"
              onClick={dismiss}
              aria-label="Đóng thông báo"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-xl font-black text-[#06113C] transition hover:bg-black/10"
            >
              ×
            </button>

            <div className="bg-[#00B14F] px-6 pb-8 pt-7 text-white">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl">
                🛠
              </div>

              <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-white/75">
                Thông báo
              </p>

              <h2 className="mt-2 pr-10 text-3xl font-black leading-tight">
                {settings.maintenance_title}
              </h2>
            </div>

            <div className="p-6">
              <p className="text-sm font-semibold leading-7 text-neutral-600">
                {settings.maintenance_message}
              </p>

              {settings.maintenance_disable_checkout && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-800">
                  Đặt món trực tiếp trên website đang tạm ngưng. Quán vẫn nhận
                  đơn bình thường qua Zalo.
                </div>
              )}

              <div className="mt-6 grid gap-3">
                <a
                  href={`https://zalo.me/${q1Phone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-2xl bg-[#0068FF] px-5 py-4 text-white shadow-lg shadow-blue-600/15 transition hover:-translate-y-0.5"
                >
                  <span>
                    <span className="block text-xs font-bold text-white/75">
                      Đặt qua Zalo
                    </span>
                    <span className="mt-1 block text-lg font-black">
                      Quận 1
                    </span>
                  </span>
                  <span className="text-sm font-black">
                    {formatPhone(settings.maintenance_zalo_q1)}
                  </span>
                </a>

                <a
                  href={`https://zalo.me/${q6Phone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-2xl bg-[#0068FF] px-5 py-4 text-white shadow-lg shadow-blue-600/15 transition hover:-translate-y-0.5"
                >
                  <span>
                    <span className="block text-xs font-bold text-white/75">
                      Đặt qua Zalo
                    </span>
                    <span className="mt-1 block text-lg font-black">
                      Quận 6
                    </span>
                  </span>
                  <span className="text-sm font-black">
                    {formatPhone(settings.maintenance_zalo_q6)}
                  </span>
                </a>
              </div>

              <button
                type="button"
                onClick={dismiss}
                className="mt-4 w-full rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm font-black text-[#06113C] transition hover:bg-neutral-50"
              >
                Tiếp tục xem website
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
