import type { ReactNode } from "react";

type Variant = "default" | "success" | "soft";

const VARIANT_CLASS: Record<Variant, string> = {
  default: "bg-white text-black",
  success: "bg-[#00C610] text-white",
  soft: "bg-[#A0FFA8] text-[#1F9B29]",
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