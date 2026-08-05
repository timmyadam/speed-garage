import type { ReactElement, ReactNode } from "react";
import { CaretUpIcon, CaretDownIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "./cn";

export interface StatBarProps {
  /** Ex: "Viteză maximă". */
  label: string;
  /** Valoarea normalizată pentru bară (0…`max`). */
  value: number;
  max?: number;
  /**
   * Ce se afișează ca număr. Când statul are unitate reală (320 km/h) trimite
   * `displayValue={320}` + `unit="km/h"`, iar `value` rămâne normalizat.
   */
  displayValue?: number | string;
  unit?: string;
  /** Iconiță Phosphor, decorativă — eticheta poartă sensul. */
  icon?: ReactNode;
  /**
   * Previzualizare de upgrade, în aceleași unități ca `value`.
   * Pozitiv = îmbunătățire; se desenează ca segment fantomă + delta numeric.
   */
  delta?: number;
  /** Ce delta afișăm ca text, dacă diferă de `delta` (ex: +12 CP). */
  displayDelta?: number | string;
  size?: "sm" | "md";
  className?: string;
}

function clampPercent(value: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.min(100, Math.max(0, (value / max) * 100));
}

/**
 * Rândul canonic de statistică a unei mașini: etichetă · bară · număr.
 * Numărul e aliniat la dreapta cu cifre tabulare, ca să se poată compara
 * pe verticală între mașini fără ca ochiul să sară.
 */
export function StatBar({
  label,
  value,
  max = 100,
  displayValue,
  unit,
  icon,
  delta,
  displayDelta,
  size = "md",
  className,
}: StatBarProps): ReactElement {
  const pct = clampPercent(value, max);
  const hasDelta = typeof delta === "number" && delta !== 0;
  const improved = hasDelta && delta > 0;
  const ghostPct = hasDelta ? clampPercent(value + delta, max) : 0;

  const numberText = displayValue ?? Math.round(value);
  const deltaText = displayDelta ?? (hasDelta ? Math.abs(delta) : "");

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        className={cn(
          "flex min-w-0 shrink-0 items-center gap-1.5 text-fg-3",
          size === "sm" ? "w-20 text-[11px]" : "w-28 text-xs",
        )}
      >
        {icon ? (
          <span aria-hidden="true" className="shrink-0 text-fg-3">
            {icon}
          </span>
        ) : null}
        <span className="truncate">{label}</span>
      </span>

      <div
        className={cn(
          "relative min-w-0 flex-1 overflow-hidden rounded-xs bg-track sg-hatch",
          size === "sm" ? "h-1.5" : "h-2",
        )}
        role="meter"
        aria-label={label}
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        {hasDelta ? (
          <div
            aria-hidden="true"
            className={cn(
              "absolute inset-y-0 left-0 rounded-xs opacity-40",
              improved ? "bg-win" : "bg-lose",
            )}
            style={{ width: `${improved ? ghostPct : pct}%` }}
          />
        ) : null}
        <div
          className="absolute inset-y-0 left-0 rounded-xs bg-accent transition-[width] duration-400 ease-out-quick"
          style={{ width: `${improved ? pct : hasDelta ? ghostPct : pct}%` }}
        />
      </div>

      <span
        className={cn(
          "shrink-0 text-right font-display font-semibold text-fg tnum",
          size === "sm" ? "w-14 text-xs" : "w-20 text-sm",
        )}
      >
        {numberText}
        {unit ? (
          <span className="ml-0.5 text-[0.75em] font-medium text-fg-3">
            {unit}
          </span>
        ) : null}
      </span>

      {hasDelta ? (
        <span
          className={cn(
            "flex shrink-0 items-center gap-0.5 font-display text-xs font-semibold tnum",
            improved ? "text-win" : "text-lose",
          )}
        >
          {improved ? (
            <CaretUpIcon weight="fill" className="size-3" aria-hidden="true" />
          ) : (
            <CaretDownIcon weight="fill" className="size-3" aria-hidden="true" />
          )}
          <span className="sr-only">
            {improved ? "creștere de" : "scădere de"}
          </span>
          {deltaText}
        </span>
      ) : null}
    </div>
  );
}

export default StatBar;
