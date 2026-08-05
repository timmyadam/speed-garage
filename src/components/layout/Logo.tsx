import type { ReactElement } from "react";
import { cn } from "../common/cn";

export interface LogoProps {
  /** `compact` ascunde cuvântul „GARAGE" — pentru bare foarte înguste. */
  compact?: boolean;
  className?: string;
}

/**
 * Wordmark 100% CSS: o placă teșită cu o tăietură diagonală (panou de
 * caroserie) + numele în fața condensată. Fără imagine, fără SVG extern.
 */
export function Logo({ compact = false, className }: LogoProps): ReactElement {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        aria-hidden="true"
        className="relative block size-8 shrink-0 overflow-hidden bg-accent sg-chamfer-sm"
      >
        <span className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 -skew-x-[22deg] bg-accent-fg/85" />
        <span className="absolute inset-y-0 left-[26%] w-0.5 -skew-x-[22deg] bg-accent-fg/35" />
      </span>

      <span className="flex flex-col justify-center leading-none">
        <span className="font-display text-lg font-bold tracking-[-0.01em] text-fg uppercase">
          Speed
        </span>
        {!compact ? (
          <span className="font-display text-[10px] font-semibold uppercase tracking-[0.34em] text-accent">
            Garage
          </span>
        ) : null}
      </span>
    </span>
  );
}

export default Logo;
