"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "dark" | "light" | "danger";
};

export default function AppButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: AppButtonProps) {
  const variants = {
    primary:
      "bg-[#00B14F] text-white shadow-xl shadow-[#00B14F]/25 hover:bg-[#009944]",
    dark:
      "bg-[#06113C] text-white shadow-xl shadow-[#06113C]/20 hover:bg-[#0d1c57]",
    light:
      "bg-white text-[#06113C] shadow-lg shadow-neutral-950/5 hover:bg-[#F5FFF8]",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
  };

  return (
    <button
      {...props}
      className={`
        relative overflow-hidden rounded-2xl px-5 py-3 font-black
        transition-all duration-200 active:scale-95 disabled:opacity-60
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}