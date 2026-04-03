import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "../lib/utils";

type Props = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition duration-300 ease-out will-change-transform",
        variant === "primary" &&
          "bg-ink text-white shadow-soft hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(15,23,42,0.16)]",
        variant === "secondary" &&
          "bg-white text-ink ring-1 ring-slate-200 hover:-translate-y-1 hover:bg-slate-50 hover:shadow-[0_18px_35px_rgba(148,163,184,0.14)]",
        variant === "ghost" && "text-slate-600 hover:-translate-y-0.5 hover:bg-white/70",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
