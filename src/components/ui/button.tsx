"use client";

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const variants: Record<Variant, string> = {
  primary: "bg-purple text-white hover:bg-purple-pressed",
  secondary: "bg-purple-tint text-purple hover:bg-border",
  danger: "bg-danger text-white hover:opacity-90",
  ghost: "bg-transparent text-ink-muted hover:bg-surface-muted",
};

export default function Button({ variant = "primary", className = "", children, ...props }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center h-12 px-4 rounded-2px font-semibold text-[17px] min-w-[48px] transition-colors disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
