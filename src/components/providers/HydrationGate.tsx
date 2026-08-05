"use client";

import type { ReactElement, ReactNode } from "react";
import { Skeleton } from "@/components/common";
import { selectIsHydrated, useGameStore } from "@/store";

export interface HydrationGateProps {
  children: ReactNode;
  /** Schelet care rezervă exact spațiul conținutului real (zero CLS). */
  fallback?: ReactNode;
}

/**
 * Randează copiii doar după ce profilul a fost citit din `localStorage`.
 * Pe server și la prima randare pe client rezultatul e identic (fallback),
 * deci Next.js nu are ce să raporteze ca mismatch.
 */
export function HydrationGate({
  children,
  fallback,
}: HydrationGateProps): ReactElement {
  const isHydrated = useGameStore(selectIsHydrated);

  if (!isHydrated) {
    return (
      <div aria-busy="true" aria-live="polite">
        <span className="sr-only">Se încarcă profilul…</span>
        {fallback ?? (
          <div className="flex flex-col gap-4">
            <Skeleton height={120} />
            <Skeleton height={220} />
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}

export default HydrationGate;
