"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";
import { cn } from "../common/cn";
import { CoinCounter } from "../common/CoinCounter";
import { XpBar } from "../common/XpBar";
import { Logo } from "./Logo";
import { SECONDARY_ROUTES, isRouteActive } from "./routes";

export interface NavbarProps {
  coins: number;
  xp: number;
  level: number;
  xpForNextLevel: number;
  /** Delta de monede, afișat temporar după o tranzacție. */
  coinsDelta?: number;
  className?: string;
}

/**
 * Bara de sus: identitate + economie. Navigarea propriu-zisă e în Sidebar
 * (desktop) / BottomNav (mobil), ca să nu existe două surse de adevăr.
 * Monedele și nivelul sunt permanent vizibile — sunt moneda tuturor deciziilor.
 */
export function Navbar({
  coins,
  xp,
  level,
  xpForNextLevel,
  coinsDelta,
  className,
}: NavbarProps): ReactElement {
  const pathname = usePathname();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-line bg-bg/88 backdrop-blur-md",
        className,
      )}
    >
      <div className="flex h-14 items-center gap-3 px-4 lg:h-16 lg:px-6">
        <Link
          href="/"
          className="shrink-0 rounded-sm"
          aria-label="Speed Garage — pagina principală"
        >
          <Logo />
        </Link>

        <div className="ml-auto flex items-center gap-2 lg:gap-4">
          {/* Desktop: bara de XP completă. Mobil: doar placa de nivel. */}
          <div className="hidden lg:block">
            <XpBar
              level={level}
              xp={xp}
              xpForNextLevel={xpForNextLevel}
              compact
            />
          </div>
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-accent-line bg-accent-wash font-display text-sm font-bold text-accent tnum lg:hidden"
            aria-label={`Nivel ${level}`}
          >
            {level}
          </span>

          <CoinCounter coins={coins} delta={coinsDelta} size="md" />

          {/* Rute secundare: rare, deci iconițe — dar cu etichetă accesibilă. */}
          <nav aria-label="Navigare secundară" className="flex items-center">
            {SECONDARY_ROUTES.map((route) => {
              const active = isRouteActive(pathname, route.href);
              const RouteIcon = route.icon;
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  aria-label={route.label}
                  title={route.label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex size-11 items-center justify-center rounded-md transition-colors duration-150",
                    active
                      ? "bg-surface-2 text-accent"
                      : "text-fg-3 hover:bg-surface-2 hover:text-fg",
                  )}
                >
                  <RouteIcon
                    weight={active ? "fill" : "regular"}
                    className="size-5"
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
