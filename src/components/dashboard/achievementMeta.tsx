import type { ReactElement } from "react";
import {
  BrainIcon,
  CarIcon,
  CoinsIcon,
  CrownIcon,
  FlagCheckeredIcon,
  GaugeIcon,
  LightningIcon,
  MedalIcon,
  StarIcon,
  TrophyIcon,
  WrenchIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { ACHIEVEMENTS, ACHIEVEMENT_INDEX } from "@/data/achievements.mock";
import type { Achievement } from "@/types/player";

/**
 * Metadatele realizărilor sunt date statice, fără logică — se citesc direct
 * din catalogul mock (nu există serviciu dedicat pentru ele).
 * Aici se face singura traducere de care are nevoie UI-ul: numele iconiței
 * Phosphor din date -> componenta React.
 */
const ICONS: Record<string, Icon> = {
  FlagCheckered: FlagCheckeredIcon,
  Medal: MedalIcon,
  Car: CarIcon,
  Brain: BrainIcon,
  Star: StarIcon,
  Coins: CoinsIcon,
  Gauge: GaugeIcon,
  Wrench: WrenchIcon,
  Crown: CrownIcon,
  Lightning: LightningIcon,
};

/** Toate realizările, în ordinea de afișare din profil. */
export const ACHIEVEMENT_LIST: readonly Achievement[] = [...ACHIEVEMENTS].sort(
  (a, b) => a.order - b.order,
);

export function getAchievement(id: string): Achievement | null {
  return ACHIEVEMENT_INDEX.get(id) ?? null;
}

export function AchievementIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}): ReactElement {
  const Component = ICONS[name] ?? TrophyIcon;
  return <Component weight="duotone" className={className} aria-hidden="true" />;
}
