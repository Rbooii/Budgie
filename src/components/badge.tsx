import type { ReactNode } from "react";

type Variant = "default" | "success" | "soft";

const VARIANT_CLASS: Record<Variant, string> = {
  default: "bg-card text-ink",
  success: "bg-brand text-white",
  soft: "bg-income-tint text-income",
};

interface BadgeProps {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={`w-fit px-2 py-0.5 text-xs font-semibold rounded-[24px] ${VARIANT_CLASS[variant]} ${className ?? ""}`}
    >
      {children}
    </span>
  );
}