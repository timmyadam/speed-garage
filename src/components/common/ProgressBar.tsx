import type { ReactElement, ReactNode } from "react";
import { cn } from "./cn";

export type ProgressTone =
  | "accent"
  | "win"
  | "lose"
  | "caution"
  | "info"
  | "neutral";

export interface ProgressBarProps {
  value: number;
  max?: number;
  /** Etichetă vizibilă deasupra barei. Dacă lipsește, dă `ariaLabel`. */
  label?: ReactNode;
  /** Text la dreapta etichetei (ex: "1 240 / 2 000 XP"). */
  valueLabel?: ReactNode;
  tone?: ProgressTone;
  size?: "xs" | "sm" | "md";
  /** Segment fantomă peste valoarea curentă — previzualizare de upgrade. */
  ghostValue?: number;
  /** Obligatoriu când nu există `label` vizibil. */
  ariaLabel?: string;
  className?: string;
}

const TONE_FILL: Record<ProgressTone, string> = {
  accent: "bg-accent",
  win: "bg-win",
  lose: "bg-lose",
  caution: "bg-caution",
  info: "bg-info",
  neutral: "bg-fg-3",
};

const HEIGHT = {
  xs: "h-1",
  sm: "h-1.5",
  md: "h-2.5",
} as const;

function clampPercent(value: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.min(100, Math.max(0, (value / max) * 100));
}

/**
 * Bară de progres cu șină hașurată (zona neatinsă arată inertă, nu „goală").
 * Umplerea se animează pe `width` — 400ms — doar când valoarea chiar se schimbă.
 */
export function ProgressBar({
  value,
  max = 100,
  label,
  valueLabel,
  tone = "accent",
  size = "md",
  ghostValue,
  ariaLabel,
  className,
}: ProgressBarProps): ReactElement {
  const pct = clampPercent(value, max);
  const ghostPct =
    ghostValue === undefined ? null : clampPercent(ghostValue, max);

  return (
    <div className={cn("w-full", className)}>
      {(label || valueLabel) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          {label ? (
            <span className="min-w-0 truncate text-xs text-fg-3">{label}</span>
          ) : (
            <span />
          )}
          {valueLabel ? (
            <span className="shrink-0 font-display text-xs font-semibold text-fg tnum">
              {valueLabel}
            </span>
          ) : null}
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={ariaLabel}
        className={cn(
          "relative w-full overflow-hidden rounded-xs bg-track sg-hatch",
          HEIGHT[size],
        )}
      >
        {ghostPct !== null && ghostPct > pct ? (
          <div
            aria-hidden="true"
            className={cn(
              "absolute inset-y-0 left-0 opacity-35 transition-[width] duration-300 ease-out-quick",
              TONE_FILL[tone],
            )}
            style={{ width: `${ghostPct}%` }}
          />
        ) : null}
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-xs transition-[width] duration-400 ease-out-quick",
            TONE_FILL[tone],
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
