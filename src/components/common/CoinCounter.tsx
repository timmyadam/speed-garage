import type { ReactElement } from "react";
import { CoinsIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "./cn";

export interface CoinCounterProps {
  coins: number;
  size?: "sm" | "md" | "lg";
  /**
   * Diferență afișată lângă total (ex: `-4500` la cumpărare, `+320` la câștig).
   * Numărul singur nu spune nimic; delta îi dă context.
   */
  delta?: number;
  /** Cadru + fundal. Dezactivează-l când e deja într-un card. */
  framed?: boolean;
  className?: string;
}

const SIZE = {
  sm: { box: "h-8 px-2 gap-1.5", text: "text-xs", icon: "size-3.5" },
  md: { box: "h-10 px-3 gap-2", text: "text-sm", icon: "size-4" },
  lg: { box: "h-12 px-4 gap-2.5", text: "text-lg", icon: "size-5" },
} as const;

/** Grupare pe mii cu spațiu îngust — convenția românească, ușor de scanat. */
export function formatCoins(value: number): string {
  return new Intl.NumberFormat("ro-RO").format(Math.round(value));
}

export function CoinCounter({
  coins,
  size = "md",
  delta,
  framed = true,
  className,
}: CoinCounterProps): ReactElement {
  const s = SIZE[size];
  const hasDelta = typeof delta === "number" && delta !== 0;

  return (
    <div
      className={cn(
        "inline-flex items-center",
        s.box,
        framed && "rounded-md border border-line bg-surface-2",
        className,
      )}
    >
      <CoinsIcon
        weight="fill"
        className={cn("shrink-0 text-legendary", s.icon)}
        aria-hidden="true"
      />
      <span
        className={cn("font-display font-semibold text-fg tnum", s.text)}
        aria-label={`${formatCoins(coins)} monede`}
      >
        {formatCoins(coins)}
      </span>
      {hasDelta ? (
        <span
          className={cn(
            "font-display font-semibold tnum",
            s.text,
            delta > 0 ? "text-win" : "text-lose",
          )}
        >
          {delta > 0 ? "+" : "−"}
          {formatCoins(Math.abs(delta))}
        </span>
      ) : null}
    </div>
  );
}

export default CoinCounter;
