"use client";

import { useEffect } from "react";

export default function CopyProtection() {
  useEffect(() => {
    const isProtectedPath = () => {
      const path = window.location.pathname;

      return (
        path.startsWith("/dat-mon-nhanh") ||
        path.startsWith("/tra-cuu-don")
      );
    };

    const blockEvent = (event: Event) => {
      if (!isProtectedPath()) return;
      event.preventDefault();
    };

    const blockKey = (event: KeyboardEvent) => {
      if (!isProtectedPath()) return;

      const key = event.key.toLowerCase();

      if (
        (event.ctrlKey || event.metaKey) &&
        ["c", "x", "s", "u", "p"].includes(key)
      ) {
        event.preventDefault();
      }
    };

    document.addEventListener("contextmenu", blockEvent);
    document.addEventListener("copy", blockEvent);
    document.addEventListener("cut", blockEvent);
    document.addEventListener("dragstart", blockEvent);
    document.addEventListener("selectstart", blockEvent);
    document.addEventListener("keydown", blockKey);

    return () => {
      document.removeEventListener("contextmenu", blockEvent);
      document.removeEventListener("copy", blockEvent);
      document.removeEventListener("cut", blockEvent);
      document.removeEventListener("dragstart", blockEvent);
      document.removeEventListener("selectstart", blockEvent);
      document.removeEventListener("keydown", blockKey);
    };
  }, []);

  return null;
}