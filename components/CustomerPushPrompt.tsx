"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "avnt_customer_push_dismissed_at";
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function isStandaloneMode() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

export default function CustomerPushPrompt() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (!("PushManager" in window)) return;
    if (!("Notification" in window)) return;
    if (isStandaloneMode() && Notification.permission === "granted") return;
    if (Notification.permission === "granted") return;

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);

    if (dismissedAt && Date.now() - dismissedAt < SEVEN_DAYS) return;

    const timer = window.setTimeout(() => {
      setVisible(true);
    }, 4500);

    return () => window.clearTimeout(timer);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  async function enablePush() {
    try {
      setLoading(true);

      const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY || "";

      if (!publicKey) {
        alert("Website chưa cấu hình WEB PUSH PUBLIC KEY.");
        return;
      }

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        alert("Trình duyệt này chưa hỗ trợ thông báo.");
        dismiss();
        return;
      }

      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        dismiss();
        return;
      }

      const registration = await navigator.serviceWorker.register(
        "/customer-push-sw.js"
      );

      await navigator.serviceWorker.ready;

      const existingSubscription =
        await registration.pushManager.getSubscription();

      const subscription =
        existingSubscription ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      const subscriptionJson = subscription.toJSON();
      const customerPhone = localStorage.getItem("avnt_customer_phone") || "";

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerPhone,
          subscription: subscriptionJson,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Không lưu được thiết bị.");
      }

      setVisible(false);
      localStorage.removeItem(DISMISS_KEY);
      alert("Đã bật thông báo đơn hàng cho thiết bị này.");
    } catch (error: any) {
      console.error("ENABLE PUSH ERROR:", error);
      alert(error?.message || "Không bật được thông báo.");
    } finally {
      setLoading(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-[86px] z-[1300] px-4 md:bottom-6">
      <div className="mx-auto max-w-md rounded-[28px] border border-[#00B14F]/20 bg-white p-4 shadow-2xl shadow-black/20">
        <div className="flex gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8FFF1] text-2xl">
            🔔
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-black text-[#06113C]">
              Nhận thông báo đơn hàng
            </p>

            <p className="mt-1 text-sm font-bold leading-6 text-neutral-500">
              Bật thông báo để biết khi đơn được xác nhận, đang làm hoặc đã hoàn
              thành.
            </p>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={enablePush}
                disabled={loading}
                className="flex-1 rounded-2xl bg-[#00B14F] px-4 py-3 text-center text-sm font-black text-white disabled:opacity-60"
              >
                {loading ? "Đang bật..." : "Bật thông báo"}
              </button>

              <button
                type="button"
                onClick={dismiss}
                className="rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-black text-[#06113C]"
              >
                Để sau
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}