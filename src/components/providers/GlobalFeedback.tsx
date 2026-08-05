"use client";

import { useCallback, useEffect, useState, type ReactElement } from "react";
import { ArrowFatLineUpIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { AchievementToast } from "@/components/common";
import {
  AchievementIcon,
  getAchievement,
} from "@/components/dashboard/achievementMeta";
import {
  selectLastLevelUp,
  selectPendingAchievements,
  useGameStore,
} from "@/store";

/**
 * Cozile de feedback global: realizări deblocate și level-up.
 *
 * `pendingAchievements` se golește dintr-o singură mișcare
 * (`acknowledgeAchievements`), așa că îl mutăm imediat într-o coadă locală și
 * afișăm toast-urile pe rând — altfel două realizări câștigate în aceeași
 * cursă s-ar suprapune.
 */
export function GlobalFeedback(): ReactElement | null {
  const pending = useGameStore(selectPendingAchievements);
  const acknowledgeAchievements = useGameStore(
    (state) => state.acknowledgeAchievements,
  );
  const lastLevelUp = useGameStore(selectLastLevelUp);
  const acknowledgeLevelUp = useGameStore((state) => state.acknowledgeLevelUp);

  /**
   * `acknowledgeAchievements()` golește toată coada dintr-o mișcare, așa că
   * ținem local doar indexul toast-ului afișat și confirmăm abia după ultimul —
   * altfel două realizări câștigate în aceeași cursă s-ar suprapune.
   * Indexul e derivat la randare (fără efect care setează state).
   */
  const [shown, setShown] = useState(0);
  const cursor = shown < pending.length ? shown : 0;

  const dismissCurrent = useCallback(() => {
    if (cursor + 1 < pending.length) {
      setShown(cursor + 1);
      return;
    }
    setShown(0);
    acknowledgeAchievements();
  }, [cursor, pending.length, acknowledgeAchievements]);

  useEffect(() => {
    if (lastLevelUp === null) return;
    const timer = window.setTimeout(acknowledgeLevelUp, 5000);
    return () => window.clearTimeout(timer);
  }, [lastLevelUp, acknowledgeLevelUp]);

  const currentId = pending[cursor];
  const achievement = currentId === undefined ? null : getAchievement(currentId);

  return (
    <>
      {lastLevelUp !== null ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-auto fixed inset-x-4 top-[4.5rem] z-90 flex items-center gap-3 border border-accent-line bg-surface-3 p-3.5 pr-2 shadow-[0_16px_40px_-12px_rgb(0_0_0/0.8)] sg-chamfer-sm animate-sg-toast-in sm:left-auto sm:w-80 lg:top-24"
        >
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-sm border border-accent-line bg-accent-wash text-accent"
          >
            <ArrowFatLineUpIcon weight="duotone" className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
              Nivel nou
            </p>
            <p className="mt-0.5 text-sm font-semibold text-fg">
              Ai ajuns la nivelul {lastLevelUp}
            </p>
          </div>
          <button
            type="button"
            onClick={acknowledgeLevelUp}
            aria-label="Închide notificarea de nivel"
            className="flex size-11 shrink-0 items-center justify-center rounded-md text-fg-3 transition-colors duration-150 hover:bg-surface-2 hover:text-fg"
          >
            <XIcon weight="bold" className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {achievement !== null ? (
        <AchievementToast
          key={achievement.id}
          open
          title={achievement.name}
          description={achievement.description}
          icon={<AchievementIcon name={achievement.icon} className="size-5" />}
          reward={achievement.reward}
          onDismiss={dismissCurrent}
        />
      ) : null}
    </>
  );
}

export default GlobalFeedback;
