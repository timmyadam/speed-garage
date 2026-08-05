import type { Icon } from "@phosphor-icons/react";
import {
  CardsIcon,
  FlagCheckeredIcon,
  GarageIcon,
  HouseIcon,
  QuestionIcon,
  RankingIcon,
  UserCircleIcon,
} from "@phosphor-icons/react/dist/ssr";

export interface NavRoute {
  href: string;
  label: string;
  icon: Icon;
  /** Descriere scurtă, folosită ca `title` pe desktop. */
  hint: string;
}

/**
 * Rute pe care jucătorul le atinge la fiecare sesiune. Ele — și numai ele —
 * ajung în bottom nav pe mobil (5 slot-uri, zona degetului mare).
 */
export const PRIMARY_ROUTES: readonly NavRoute[] = [
  { href: "/", label: "Acasă", icon: HouseIcon, hint: "Rezumat și acces rapid" },
  {
    href: "/garage",
    label: "Garaj",
    icon: GarageIcon,
    hint: "Colecția ta și magazinul",
  },
  {
    href: "/race",
    label: "Cursă",
    icon: FlagCheckeredIcon,
    hint: "Drag race pe 400 m",
  },
  {
    href: "/duel",
    label: "Duel",
    icon: CardsIcon,
    hint: "Duel de statistici, 5 runde",
  },
  {
    href: "/quiz",
    label: "Quiz",
    icon: QuestionIcon,
    hint: "Întrebări auto contra cronometru",
  },
] as const;

/**
 * Rute de consultare, nu de joc: se vizitează rar. Pe desktop stau într-un
 * grup separat în sidebar, pe mobil în bara de sus.
 */
export const SECONDARY_ROUTES: readonly NavRoute[] = [
  {
    href: "/leaderboard",
    label: "Clasament",
    icon: RankingIcon,
    hint: "Unde ești față de ceilalți",
  },
  {
    href: "/profile",
    label: "Profil",
    icon: UserCircleIcon,
    hint: "Realizări și istoric",
  },
] as const;

export const ALL_ROUTES: readonly NavRoute[] = [
  ...PRIMARY_ROUTES,
  ...SECONDARY_ROUTES,
] as const;

/** `/` e activ doar exact; restul și pe sub-rute (ex: /garage/[carId]). */
export function isRouteActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
