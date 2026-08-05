import Link from "next/link";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/components/common";
import type { ButtonSize, ButtonVariant } from "@/components/common";

export interface LinkButtonProps {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  className?: string;
}

/**
 * Aceleași clase ca `Button`, dar pe un `<Link>`: navigarea trebuie să rămână
 * un `<a>` real (deschidere în tab nou, focus, cititoare de ecran), nu un
 * `<button>` cu `router.push`.
 */
const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-fg border-accent hover:bg-accent-strong hover:border-accent-strong active:bg-accent-press shadow-[0_1px_0_0_rgb(255_255_255/0.18)_inset]",
  secondary:
    "bg-surface-2 text-fg border-line-strong hover:bg-surface-3 hover:border-fg-3 active:bg-surface-2",
  ghost:
    "bg-transparent text-fg-2 border-transparent hover:bg-surface-2 hover:text-fg active:bg-surface",
  danger:
    "bg-lose-wash text-lose border-lose/45 hover:bg-lose hover:text-bg hover:border-lose",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs gap-1.5",
  md: "h-11 px-4 text-sm gap-2",
  lg: "h-13 px-6 text-base gap-2.5",
};

export function LinkButton({
  href,
  children,
  variant = "secondary",
  size = "md",
  icon,
  iconRight,
  fullWidth = false,
  className,
}: LinkButtonProps): ReactElement {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex select-none items-center justify-center rounded-md border",
        "font-display font-semibold uppercase tracking-[0.06em]",
        "transition-[background-color,border-color,color,transform] duration-150 ease-out-quick",
        "active:translate-y-px",
        VARIANT[variant],
        SIZE[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {icon}
      <span className="truncate">{children}</span>
      {iconRight}
    </Link>
  );
}

export default LinkButton;
