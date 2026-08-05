import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";
import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Blochează butonul, arată spinner și anunță `aria-busy`. */
  loading?: boolean;
  /** Text afișat cât timp `loading` e activ (ex: "Se cumpără…"). */
  loadingLabel?: string;
  /** Iconiță Phosphor înaintea textului. Decorativă — textul poartă sensul. */
  icon?: ReactNode;
  /** Iconiță după text (ex: săgeată care indică înainte). */
  iconRight?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
}

/**
 * Ierarhia e strictă: un singur `primary` vizibil odată pe ecran.
 * `secondary` = acțiune alternativă, `ghost` = terțiară, `danger` = distructivă.
 */
const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-fg border-accent hover:bg-accent-strong hover:border-accent-strong active:bg-accent-press shadow-[0_1px_0_0_rgb(255_255_255/0.18)_inset]",
  secondary:
    "bg-surface-2 text-fg border-line-strong hover:bg-surface-3 hover:border-fg-3 active:bg-surface-2",
  ghost:
    "bg-transparent text-fg-2 border-transparent hover:bg-surface-2 hover:text-fg active:bg-surface",
  danger:
    "bg-lose-wash text-lose border-lose/45 hover:bg-lose hover:text-bg hover:border-lose active:brightness-90",
};

/** Toate variantele ≥ 44px înălțime efectivă la `md`/`lg` (touch target). */
const SIZE: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs gap-1.5",
  md: "h-11 px-4 text-sm gap-2",
  lg: "h-13 px-6 text-base gap-2.5",
};

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  loadingLabel,
  icon,
  iconRight,
  fullWidth = false,
  className,
  disabled,
  type = "button",
  children,
  ...rest
}: ButtonProps): ReactElement {
  const isInert = Boolean(disabled) || loading;

  return (
    <button
      {...rest}
      type={type}
      disabled={isInert}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex select-none items-center justify-center rounded-md border",
        "font-display font-semibold uppercase tracking-[0.06em]",
        "transition-[background-color,border-color,color,transform] duration-150 ease-out-quick",
        "active:translate-y-px",
        "disabled:pointer-events-none disabled:border-line disabled:bg-surface disabled:text-fg-disabled disabled:shadow-none",
        VARIANT[variant],
        SIZE[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {loading ? (
        <CircleNotchIcon
          weight="bold"
          className="size-4 shrink-0 animate-sg-spin"
          aria-hidden="true"
        />
      ) : (
        icon
      )}
      <span className="truncate">
        {loading && loadingLabel ? loadingLabel : children}
      </span>
      {!loading && iconRight}
    </button>
  );
}

export default Button;
