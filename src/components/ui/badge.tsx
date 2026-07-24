import type { ReactNode } from "react";

type Variant = "default" | "success" | "danger";

type Props = {
  children: ReactNode;
  variant?: Variant;
};

const variants: Record<Variant, string> = {
  default: "bg-purple-tint text-purple",
  success: "bg-[#E6F4EC] text-success",
  danger: "bg-[#FCE4E4] text-danger",
};

export default function Badge({ children, variant = "default" }: Props) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-2px text-sm font-semibold ${variants[variant]}`}>
      {children}
    </span>
  );
}
