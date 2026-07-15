import type { ComponentProps, ReactNode } from "react";
import { Loader2 } from "lucide-react";

export type Variant = "primary" | "outline" | "icon" | "success" | "soft" | "softred";
export type Size = "lg" | "md";

interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    "bg-[#000000] text-white hover:bg-black/85 active:scale-[0.98]",
  outline:
    "bg-[#FFFFFF] text-black border border-black/10 hover:bg-[#F2F2F2] active:scale-[0.98]",
  icon: "bg-[#FFFFFF] text-black hover:bg-[#F2F2F2] active:scale-95",
  success:
    "bg-[#00C610] text-white hover:bg-[#00B609] active:scale-[0.98]",
  soft:
    "bg-[#A0FFA8] text-[#1F9B29] hover:bg-[#8EED96] active:scale-[0.98]",
  softred:
    "bg-[#FFBABA] text-[#D8000C] hover:bg-[#FF9A9A] active:scale-[0.98]",
};

const SIZE_CLASS: Record<Size, string> = {
  lg: "h-11 text-lg font-semibold px-[20px] py-[6px] rounded-[35px]",
  md: "text-sm font-semibold py-[10px] px-[20px] rounded-[35px]",
};

export function Button({
  variant = "primary",
  size = "lg",
  loading = false,
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const isIcon = variant === "icon";

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 transition transform duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${
        VARIANT_CLASS[variant]
      } ${isIcon ? "" : SIZE_CLASS[size]} ${
        fullWidth && !isIcon ? "w-full" : ""
      } ${className ?? ""}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-[18px] h-[18px] animate-spin" />
      ) : (
        leadingIcon
      )}
      {children}
      {trailingIcon}
    </button>
  );
}