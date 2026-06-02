"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export default function PushNotificationSetup() {
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);

  async function enablePush() {
    try {
      setLoading(true);

      if (!("serviceWorker" in navigator)) {
        alert("Trình duyệt không hỗ trợ Service Worker.");
        return;
      }

      if (!("PushManager" in window)) {
        alert("Trình duyệt không hỗ trợ Push Notification.");
        return;
      }

      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        alert("Anh cần cho phép thông báo để nhận đơn mới.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/push-sw.js");

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        alert("Thiếu NEXT_PUBLIC_VAPID_PUBLIC_KEY.");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const json = subscription.toJSON();

      const endpoint = json.endpoint;
      const p256dh = json.keys?.p256dh;
      const auth = json.keys?.auth;

      if (!endpoint || !p256dh || !auth) {
        alert("Không lấy được thông tin thiết bị.");
        return;
      }

      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          endpoint,
          p256dh,
          auth,
          user_agent: navigator.userAgent,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "endpoint",
        }
      );

      if (error) {
        console.error(error);
        alert("Không lưu được thiết bị nhận thông báo.");
        return;
      }

      setEnabled(true);
      alert("Đã bật thông báo đơn mới.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={enablePush}
      disabled={loading || enabled}
      className={`rounded-2xl px-5 py-3 text-sm font-black text-white ${
        enabled ? "bg-[#00B14F]" : "bg-[#06113C]"
      }`}
    >
      {loading
        ? "Đang bật..."
        : enabled
        ? "Đã bật thông báo"
        : "🔔 Bật thông báo đơn mới"}
    </button>
  );
}