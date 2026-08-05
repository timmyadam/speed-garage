"use client";

import { useEffect } from "react";
import { useGameStore } from "@/store";

/**
 * Singurul loc din aplicație care apelează `hydrate()`.
 * Montat o singură dată, în `app/layout.tsx`. Nu randează nimic: hidratarea
 * e un efect secundar, iar UI-ul reacționează prin `isHydrated`.
 */
export function StoreHydrator(): null {
  const hydrate = useGameStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return null;
}

export default StoreHydrator;
