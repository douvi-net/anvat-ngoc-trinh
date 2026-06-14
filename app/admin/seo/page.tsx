"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
type SeoSettings = {
  ga_id: string;
  clarity_id: string;
  google_verification: string;
  bing_verification: string;
  indexnow_key: string;
};

const defaultSettings: SeoSettings = {
  ga_id: "",
  clarity_id: "",
  google_verification: "",
  bing_verification: "",
  indexnow_key: "",
};

export default function AdminSeoPage() {
  const [settings, setSettings] = useState<SeoSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadSettings() {
    try {
      setLoading(true);
      setMessage("");

      const res = await fetch("/api/admin/seo-settings", {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.error || "Không thể tải cấu hình SEO");
      }

      setSettings({
        ...defaultSettings,
        ...data.settings,
      });
    } catch (error) {
      setMessage(`❌ ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    try {
      setSaving(true);
      setMessage("");

      const res = await fetch("/api/admin/seo-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.error || "Không thể lưu cấu hình SEO");
      }

      setMessage("✅ Đã lưu cấu hình SEO & Analytics");
    } catch (error) {
      setMessage(`❌ ${String(error)}`);
    } finally {
      setSaving(false);
    }
  }

  async function pingIndexNow() {
    try {
      setMessage("");

      const res = await fetch("/api/indexnow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          urls: [
            "https://anvatngoctrinh.vn/",
            "https://anvatngoctrinh.vn/dat-mon-nhanh",
            "https://anvatngoctrinh.vn/bai-viet",
          ],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.error || "Ping IndexNow thất bại");
      }

      setMessage(`✅ Ping IndexNow thành công. Status: ${data.status}`);
    } catch (error) {
      setMessage(`❌ ${String(error)}`);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  function updateField(key: keyof SeoSettings, value: string) {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  return (
    <AdminLayout>
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <p className="text-sm font-black uppercase text-[#00B14F]">
          SEO & CONTENT
        </p>

        <h1 className="mt-1 text-3xl font-black text-[#06113C]">
          Cấu hình SEO & Analytics
        </h1>

        <p className="mt-2 text-sm font-semibold text-neutral-500">
          Quản lý GA4, Clarity, Google Search Console, Bing và IndexNow.
        </p>
      </div>

      {message && (
        <div className="mb-5 rounded-2xl bg-white p-4 text-sm font-black text-[#06113C] shadow">
          {message}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl bg-white p-6 font-bold text-neutral-500 shadow">
          Đang tải cấu hình...
        </div>
      ) : (
        <div className="grid gap-5">
          <section className="rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5">
            <h2 className="text-xl font-black text-[#06113C]">Analytics</h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-black text-neutral-700">
                  GA4 Measurement ID
                </label>
                <input
                  value={settings.ga_id}
                  onChange={(e) => updateField("ga_id", e.target.value)}
                  placeholder="VD: G-4XNNYW5LTN"
                  className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-bold outline-none focus:border-[#00B14F]"
                />
              </div>

              <div>
                <label className="text-sm font-black text-neutral-700">
                  Microsoft Clarity ID
                </label>
                <input
                  value={settings.clarity_id}
                  onChange={(e) => updateField("clarity_id", e.target.value)}
                  placeholder="VD: x6iivrmfaw"
                  className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-bold outline-none focus:border-[#00B14F]"
                />
              </div>
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5">
            <h2 className="text-xl font-black text-[#06113C]">
              Search Engine Verification
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-black text-neutral-700">
                  Google Verification Code
                </label>
                <input
                  value={settings.google_verification}
                  onChange={(e) =>
                    updateField("google_verification", e.target.value)
                  }
                  placeholder="VD: google-site-verification=..."
                  className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-bold outline-none focus:border-[#00B14F]"
                />
              </div>

              <div>
                <label className="text-sm font-black text-neutral-700">
                  Bing Verification Code
                </label>
                <input
                  value={settings.bing_verification}
                  onChange={(e) =>
                    updateField("bing_verification", e.target.value)
                  }
                  placeholder="VD: mã xác minh Bing"
                  className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-bold outline-none focus:border-[#00B14F]"
                />
              </div>
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5">
            <h2 className="text-xl font-black text-[#06113C]">IndexNow</h2>

            <div className="mt-4">
              <label className="text-sm font-black text-neutral-700">
                IndexNow Key
              </label>
              <input
                value={settings.indexnow_key}
                onChange={(e) => updateField("indexnow_key", e.target.value)}
                placeholder="VD: key IndexNow"
                className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-bold outline-none focus:border-[#00B14F]"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={pingIndexNow}
                className="rounded-2xl bg-[#06113C] px-5 py-3 text-sm font-black text-white"
              >
                Ping IndexNow
              </button>

              <a
                href="https://anvatngoctrinh.vn/sitemap.xml"
                target="_blank"
                className="rounded-2xl bg-[#E8FFF1] px-5 py-3 text-sm font-black text-[#00B14F]"
              >
                Xem sitemap
              </a>

              <a
                href="https://anvatngoctrinh.vn/robots.txt"
                target="_blank"
                className="rounded-2xl bg-[#E8FFF1] px-5 py-3 text-sm font-black text-[#00B14F]"
              >
                Xem robots.txt
              </a>
            </div>
          </section>

          <div className="sticky bottom-4 rounded-[24px] bg-white p-4 shadow-2xl shadow-neutral-950/10">
            <button
              type="button"
              onClick={saveSettings}
              disabled={saving}
              className="w-full rounded-2xl bg-[#00B14F] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : "Lưu cấu hình SEO"}
            </button>
          </div>
        </div>
      )}
    </div>
    </AdminLayout>
  );
}