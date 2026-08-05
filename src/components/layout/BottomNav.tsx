"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";
import { cn } from "../common/cn";
import { PRIMARY_ROUTES, isRouteActive } from "./routes";

export interface BottomNavProps {
  className?: string;
}

/**
 * Bară de jos pentru mobil: exact cele 5 moduri jucabile, în zona degetului
 * mare. Clasamentul și profilul stau în bara de sus — se vizitează rar.
 * Fiecare țintă are ≥ 44px pe verticală și etichetă text permanentă
 * (iconița singură cere ghicit).
 */
export function BottomNav({ className }: BottomNavProps): ReactElement {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigare principală"
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md",
        className,
      )}
    >
      <ul className="mx-auto flex max-w-md items-stretch">
        {PRIMARY_ROUTES.map((route) => {
          const active = isRouteActive(pathname, route.href);
          const RouteIcon = route.icon;
          return (
            <li key={route.href} className="flex-1">
              <Link
                href={route.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 transition-colors duration-150",
                  active ? "text-accent" : "text-fg-3 active:text-fg",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-4 top-0 h-0.5 rounded-full transition-colors duration-150",
                    active ? "bg-accent" : "bg-transparent",
                  )}
                />
                <RouteIcon
                  weight={active ? "fill" : "regular"}
                  className="size-6"
                  aria-hidden="true"
                />
                <span className="text-[11px] leading-none font-medium">
                  {route.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default BottomNav;
