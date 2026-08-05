"use client";

import type { ReactElement, ReactNode } from "react";
import { AppShell } from "@/components/layout";
import { getLevelProgress } from "@/lib/economy";
import { selectProfile, useGameStore } from "@/store";

/**
 * Leagă `AppShell` (pur prezentațional) de store.
 *
 * Valorile citite aici sunt identice pe server și la prima randare pe client
 * (profilul implicit din slice), deci nu produc hydration mismatch; conținutul
 * real apare după `hydrate()`, iar paginile își gestionează singure skeleton-ul
 * prin `HydrationGate`.
 */
export function AppFrame({ children }: { children: ReactNode }): ReactElement {
  const profile = useGameStore(selectProfile);
  const progress = getLevelProgress(profile);

  return (
    <AppShell
      coins={profile.coins}
      xp={progress.xp}
      level={progress.level}
      xpForNextLevel={progress.xpToNextLevel}
    >
      {children}
    </AppShell>
  );
}

export default AppFrame;
