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

  const connectedCount = [
    settings.ga_id,
    settings.clarity_id,
    settings.google_verification,
    settings.bing_verification,
    settings.indexnow_key,
  ].filter(Boolean).length;

  return (
    <AdminLayout>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-black text-[#00B14F]">Admin/POS</p>

          <h1 className="mt-1 text-4xl font-black text-[#06113C]">
            Dashboard SEO
          </h1>

          <p className="mt-2 text-sm font-semibold text-neutral-500">
            Quản lý nền tảng SEO, Analytics, Sitemap, robots.txt, Schema và
            IndexNow cho website.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href="https://anvatngoctrinh.vn/sitemap.xml"
            target="_blank"
            className="rounded-2xl bg-[#06113C] px-5 py-4 text-sm font-black text-white shadow-lg"
          >
            Xem sitemap
          </a>

          <button
            type="button"
            onClick={loadSettings}
            className="rounded-2xl bg-[#00B14F] px-5 py-4 text-sm font-black text-white shadow-lg shadow-[#00B14F]/25"
          >
            Làm mới
          </button>
        </div>
      </div>

      {message && (
        <div className="mt-6 rounded-[24px] bg-white p-4 text-sm font-black text-[#06113C] shadow-lg shadow-neutral-950/5">
          {message}
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {[
          {
            label: "Kết nối SEO",
            value: `${connectedCount}/5`,
            note: "GA4, Clarity, Google, Bing, IndexNow",
          },
          {
            label: "Sitemap",
            value: "OK",
            note: "Đã có sitemap.xml",
          },
          {
            label: "robots.txt",
            value: "OK",
            note: "Đã khai báo sitemap",
          },
          {
            label: "Schema",
            value: "OK",
            note: "Restaurant / LocalBusiness",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[28px] bg-white p-5 shadow-lg shadow-neutral-950/5"
          >
            <p className="text-sm font-black text-neutral-400">{item.label}</p>

            <p className="mt-2 text-3xl font-black text-[#06113C]">
              {item.value}
            </p>

            <p className="mt-2 text-xs font-bold text-neutral-400">
              {item.note}
            </p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="mt-8 rounded-[32px] bg-white p-6 font-black text-[#06113C] shadow-xl shadow-neutral-950/5">
          Đang tải cấu hình SEO...
        </div>
      ) : (
        <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.2fr]">
          <div className="h-fit rounded-[32px] bg-white p-5 shadow-xl shadow-neutral-950/5 xl:sticky xl:top-8">
            <p className="font-black text-[#00B14F]">
              Cấu hình SEO & Analytics
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-black text-[#06113C]">
                  GA4 Measurement ID
                </label>

                <input
                  value={settings.ga_id}
                  onChange={(e) => updateField("ga_id", e.target.value)}
                  placeholder="VD: G-4XNNYW5LTN"
                  className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
                />
              </div>

              <div>
                <label className="text-sm font-black text-[#06113C]">
                  Microsoft Clarity ID
                </label>

                <input
                  value={settings.clarity_id}
                  onChange={(e) => updateField("clarity_id", e.target.value)}
                  placeholder="VD: x6iivrmfaw"
                  className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
                />
              </div>

              <div>
                <label className="text-sm font-black text-[#06113C]">
                  Google Verification Code
                </label>

                <input
                  value={settings.google_verification}
                  onChange={(e) =>
                    updateField("google_verification", e.target.value)
                  }
                  placeholder="VD: google-site-verification=..."
                  className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
                />
              </div>

              <div>
                <label className="text-sm font-black text-[#06113C]">
                  Bing Verification Code
                </label>

                <input
                  value={settings.bing_verification}
                  onChange={(e) =>
                    updateField("bing_verification", e.target.value)
                  }
                  placeholder="VD: mã xác minh Bing"
                  className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
                />
              </div>

              <div>
                <label className="text-sm font-black text-[#06113C]">
                  IndexNow Key
                </label>

                <input
                  value={settings.indexnow_key}
                  onChange={(e) => updateField("indexnow_key", e.target.value)}
                  placeholder="VD: key IndexNow"
                  className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-4 font-bold outline-none focus:border-[#00B14F]"
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={saveSettings}
                disabled={saving}
                className="rounded-2xl bg-[#00B14F] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
              >
                {saving ? "Đang lưu..." : "Lưu cấu hình"}
              </button>

              <button
                type="button"
                onClick={loadSettings}
                className="rounded-2xl bg-neutral-100 px-5 py-4 text-sm font-black text-[#06113C]"
              >
                Làm mới
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] bg-white p-5 shadow-xl shadow-neutral-950/5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-[#06113C]">
                    Tình trạng SEO kỹ thuật
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-neutral-500">
                    Kiểm tra nhanh các nền tảng SEO quan trọng.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={pingIndexNow}
                  className="rounded-2xl bg-[#06113C] px-5 py-3 text-sm font-black text-white"
                >
                  Ping IndexNow
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  {
                    title: "Google Analytics 4",
                    desc: settings.ga_id
                      ? `Đã nhập mã ${settings.ga_id}`
                      : "Chưa nhập GA4 Measurement ID",
                    ok: Boolean(settings.ga_id),
                  },
                  {
                    title: "Microsoft Clarity",
                    desc: settings.clarity_id
                      ? `Đã nhập mã ${settings.clarity_id}`
                      : "Chưa nhập Clarity ID",
                    ok: Boolean(settings.clarity_id),
                  },
                  {
                    title: "Google Search Console",
                    desc: settings.google_verification
                      ? "Đã lưu mã xác minh Google"
                      : "Chưa lưu mã xác minh Google",
                    ok: Boolean(settings.google_verification),
                  },
                  {
                    title: "Bing Webmaster",
                    desc: settings.bing_verification
                      ? "Đã lưu mã xác minh Bing"
                      : "Chưa lưu mã xác minh Bing",
                    ok: Boolean(settings.bing_verification),
                  },
                  {
                    title: "IndexNow",
                    desc: settings.indexnow_key
                      ? "Đã lưu IndexNow key"
                      : "Chưa nhập IndexNow key",
                    ok: Boolean(settings.indexnow_key),
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center justify-between gap-4 rounded-[24px] bg-[#F5FFF8] p-4"
                  >
                    <div>
                      <p className="font-black text-[#06113C]">{item.title}</p>
                      <p className="mt-1 text-sm font-semibold text-neutral-500">
                        {item.desc}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        item.ok
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {item.ok ? "Đã cấu hình" : "Chưa xong"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] bg-white p-5 shadow-xl shadow-neutral-950/5">
              <h2 className="text-2xl font-black text-[#06113C]">
                Công cụ kiểm tra nhanh
              </h2>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <a
                  href="https://anvatngoctrinh.vn/sitemap.xml"
                  target="_blank"
                  className="rounded-2xl bg-[#E8FFF1] px-5 py-4 text-sm font-black text-[#00B14F]"
                >
                  🗺️ Xem sitemap.xml
                </a>

                <a
                  href="https://anvatngoctrinh.vn/robots.txt"
                  target="_blank"
                  className="rounded-2xl bg-[#E8FFF1] px-5 py-4 text-sm font-black text-[#00B14F]"
                >
                  🤖 Xem robots.txt
                </a>

                <a
                  href="https://search.google.com/test/rich-results?url=https://anvatngoctrinh.vn"
                  target="_blank"
                  className="rounded-2xl bg-[#E8FFF1] px-5 py-4 text-sm font-black text-[#00B14F]"
                >
                  🧩 Test Schema
                </a>

                <a
                  href="https://analytics.google.com"
                  target="_blank"
                  className="rounded-2xl bg-[#E8FFF1] px-5 py-4 text-sm font-black text-[#00B14F]"
                >
                  📈 Mở GA4
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}