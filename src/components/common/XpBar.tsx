import type { ReactElement } from "react";
import { cn } from "./cn";

export interface XpBarProps {
  level: number;
  /** XP acumulat în nivelul curent. */
  xp: number;
  /** XP necesar pentru a trece la nivelul următor. */
  xpForNextLevel: number;
  /** Variantă îngustă pentru navbar; ascunde textul numeric. */
  compact?: boolean;
  className?: string;
}

/**
 * Nivelul e afișat ca „placă de curse" pătrată — un obiect, nu o etichetă,
 * ca să fie recunoscut instant în navbar la orice dimensiune.
 */
export function XpBar({
  level,
  xp,
  xpForNextLevel,
  compact = false,
  className,
}: XpBarProps): ReactElement {
  const safeMax = xpForNextLevel > 0 ? xpForNextLevel : 1;
  const pct = Math.min(100, Math.max(0, (xp / safeMax) * 100));
  const remaining = Math.max(0, Math.round(safeMax - xp));

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-sm border border-accent-line bg-accent-wash font-display font-bold text-accent tnum",
          compact ? "size-8 text-sm" : "size-10 text-base",
        )}
        aria-hidden="true"
      >
        {level}
      </span>

      <div className={cn("min-w-0 flex-1", compact ? "w-24" : "w-full")}>
        {!compact ? (
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-fg-2">
              Nivel {level}
            </span>
            <span className="font-display text-xs font-semibold text-fg-3 tnum">
              încă {new Intl.NumberFormat("ro-RO").format(remaining)} XP
            </span>
          </div>
        ) : null}

        <div
          role="progressbar"
          aria-valuenow={Math.round(xp)}
          aria-valuemin={0}
          aria-valuemax={Math.round(safeMax)}
          aria-label={`Nivel ${level}, ${Math.round(xp)} din ${Math.round(safeMax)} XP către nivelul ${level + 1}`}
          className={cn(
            "relative w-full overflow-hidden rounded-xs bg-track sg-hatch",
            compact ? "h-1.5" : "h-2",
          )}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-xs bg-accent transition-[width] duration-400 ease-out-quick"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default XpBar;
