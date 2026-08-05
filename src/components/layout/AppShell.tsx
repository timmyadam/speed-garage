import type { ReactElement, ReactNode } from "react";
import { cn } from "../common/cn";
import { BottomNav } from "./BottomNav";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

export interface AppShellProps {
  coins: number;
  xp: number;
  level: number;
  xpForNextLevel: number;
  coinsDelta?: number;
  children: ReactNode;
  /** Lățime maximă a coloanei de conținut. Implicit `default` (72rem). */
  width?: "default" | "wide" | "narrow";
  className?: string;
}

const WIDTH = {
  narrow: "max-w-3xl",
  default: "max-w-6xl",
  wide: "max-w-full",
} as const;

/**
 * Schelet responsive.
 *  < lg : navbar sus + bottom nav (padding-bottom rezervă înălțimea barei,
 *         ca ultimul element să nu ajungă niciodată sub ea)
 *  ≥ lg : navbar sus + sidebar fix la stânga, fără bottom nav
 */
export function AppShell({
  coins,
  xp,
  level,
  xpForNextLevel,
  coinsDelta,
  children,
  width = "default",
  className,
}: AppShellProps): ReactElement {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar
        coins={coins}
        xp={xp}
        level={level}
        xpForNextLevel={xpForNextLevel}
        coinsDelta={coinsDelta}
      />

      <div className="flex flex-1">
        <Sidebar className="hidden w-60 lg:block" />

        <main
          className={cn(
            "min-w-0 flex-1 px-4 pt-5 pb-[calc(4rem+env(safe-area-inset-bottom)+1.5rem)] lg:px-8 lg:pt-8 lg:pb-12",
            className,
          )}
        >
          <div className={cn("mx-auto w-full", WIDTH[width])}>{children}</div>
        </main>
      </div>

      <BottomNav className="lg:hidden" />
    </div>
  );
}

export default AppShell;
