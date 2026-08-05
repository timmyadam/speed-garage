"use client";

import { useEffect, type ReactElement, type ReactNode } from "react";
import { MedalIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "./cn";
import { formatCoins } from "./CoinCounter";

export interface AchievementToastProps {
  open: boolean;
  title: string;
  description?: string;
  /** Iconiță Phosphor specifică realizării; implicit o medalie. */
  icon?: ReactNode;
  reward?: { coins?: number; xp?: number };
  onDismiss: () => void;
  /** Auto-închidere. `0` dezactivează. Implicit 6000ms. */
  autoHideMs?: number;
  className?: string;
}

/**
 * Toast de realizare. Deasupra bottom-nav-ului pe mobil, colț dreapta-jos
 * pe desktop. `role="status"` — anunțat de cititorul de ecran fără să fure focus.
 * Are întotdeauna buton de închidere: nu depinde de temporizator.
 */
export function AchievementToast({
  open,
  title,
  description,
  icon,
  reward,
  onDismiss,
  autoHideMs = 6000,
  className,
}: AchievementToastProps): ReactElement | null {
  useEffect(() => {
    if (!open || autoHideMs <= 0) return;
    const timer = window.setTimeout(onDismiss, autoHideMs);
    return () => window.clearTimeout(timer);
  }, [open, autoHideMs, onDismiss]);

  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom)+0.75rem)] left-4 z-90",
        "sm:left-auto sm:w-88 lg:bottom-6",
        "flex items-start gap-3 border border-legendary/35 bg-surface-3 p-3.5 pr-2 shadow-[0_16px_40px_-12px_rgb(0_0_0/0.8)] sg-chamfer-sm",
        "animate-sg-toast-in",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-sm border border-legendary/30 bg-legendary-wash text-legendary"
      >
        {icon ?? <MedalIcon weight="duotone" className="size-5" />}
      </span>

      <div className="min-w-0 flex-1 pt-0.5">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-legendary">
          Realizare deblocată
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold text-fg">{title}</p>
        {description ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-fg-3">{description}</p>
        ) : null}

        {reward && (reward.coins || reward.xp) ? (
          <p className="mt-2 flex items-center gap-3 font-display text-xs font-semibold tnum">
            {reward.coins ? (
              <span className="text-legendary">
                +{formatCoins(reward.coins)} monede
              </span>
            ) : null}
            {reward.xp ? (
              <span className="text-accent">+{formatCoins(reward.xp)} XP</span>
            ) : null}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Închide notificarea"
        className="flex size-11 shrink-0 items-center justify-center rounded-md text-fg-3 transition-colors duration-150 hover:bg-surface-2 hover:text-fg"
      >
        <XIcon weight="bold" className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export default AchievementToast;
