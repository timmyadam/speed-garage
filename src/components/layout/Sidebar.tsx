"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";
import { cn } from "../common/cn";
import {
  PRIMARY_ROUTES,
  SECONDARY_ROUTES,
  isRouteActive,
  type NavRoute,
} from "./routes";

export interface SidebarProps {
  className?: string;
}

function NavItem({ route, active }: { route: NavRoute; active: boolean }) {
  const RouteIcon = route.icon;
  return (
    <li>
      <Link
        href={route.href}
        aria-current={active ? "page" : undefined}
        title={route.hint}
        className={cn(
          "group relative flex h-11 items-center gap-3 rounded-md pr-3 pl-4 text-sm font-medium transition-colors duration-150",
          active
            ? "bg-surface-2 text-fg"
            : "text-fg-3 hover:bg-surface hover:text-fg",
        )}
      >
        {/* Starea activă = muchie de accent, nu pastilă plină.
            Accentul plin rămâne rezervat butonului primar al ecranului. */}
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-2 bottom-2 left-0 w-0.5 rounded-full transition-colors duration-150",
            active ? "bg-accent" : "bg-transparent",
          )}
        />
        <RouteIcon
          weight={active ? "fill" : "regular"}
          className={cn("size-5 shrink-0", active && "text-accent")}
          aria-hidden="true"
        />
        <span className="truncate">{route.label}</span>
      </Link>
    </li>
  );
}

/**
 * Sidebar de desktop. Două grupuri: ce joci zilnic, apoi ce consulți rar.
 * Nimic altceva — fără „setări", „ajutor", „despre" care umflă lista.
 */
export function Sidebar({ className }: SidebarProps): ReactElement {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "sticky top-16 h-[calc(100dvh-4rem)] shrink-0 border-r border-line px-3 py-5",
        className,
      )}
    >
      <nav aria-label="Navigare principală">
        <p className="mb-2 px-4 font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-disabled">
          Joacă
        </p>
        <ul className="flex flex-col gap-0.5">
          {PRIMARY_ROUTES.map((route) => (
            <NavItem
              key={route.href}
              route={route}
              active={isRouteActive(pathname, route.href)}
            />
          ))}
        </ul>

        <hr className="my-4 border-line" />

        <p className="mb-2 px-4 font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-disabled">
          Progres
        </p>
        <ul className="flex flex-col gap-0.5">
          {SECONDARY_ROUTES.map((route) => (
            <NavItem
              key={route.href}
              route={route}
              active={isRouteActive(pathname, route.href)}
            />
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
