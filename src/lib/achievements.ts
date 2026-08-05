/**
 * Evaluatorul de achievements — pur, fără efecte secundare.
 * Se apelează după FIECARE mutație de profil (cursă, duel, quiz, cumpărare)
 * și întoarce doar id-urile nou deblocate, ca store-ul să poată afișa toast-uri
 * și să acorde recompensele o singură dată.
 */

import { ACHIEVEMENTS, ACHIEVEMENT_INDEX } from "@/data/achievements.mock";
import { CAR_INDEX } from "@/data/cars.mock";
import type {
  Achievement,
  AchievementCondition,
  PlayerProfile,
} from "@/types/player";

/** Valoarea curentă a jucătorului pentru un anumit tip de condiție. */
export function getConditionValue(
  profile: PlayerProfile,
  condition: AchievementCondition,
): number {
  const stats = profile.stats;
  switch (condition.type) {
    case "racesWon":
      return stats.racesWon;
    case "duelsWon":
      return stats.duelsWon;
    case "carsOwned":
      return profile.ownedCars.length;
    case "quizStreak":
      return stats.quizBestStreak;
    case "playerLevel":
      return profile.level;
    case "coinsEarned":
      return stats.coinsEarned;
    case "perfectShifts":
      return stats.perfectShifts;
    case "upgradesPurchased":
      return stats.upgradesPurchased;
    case "legendaryOwned":
      return profile.ownedCars.filter(
        (owned) => CAR_INDEX.get(owned.carId)?.rarity === "legendary",
      ).length;
    case "quarterMileUnder":
      // Aici „mai bine” înseamnă „mai mic”; Infinity = n-a curs încă niciodată.
      return stats.bestQuarterMile ?? Number.POSITIVE_INFINITY;
  }
}

/** Este condiția îndeplinită? `quarterMileUnder` compară invers. */
export function isConditionMet(
  profile: PlayerProfile,
  condition: AchievementCondition,
): boolean {
  const value = getConditionValue(profile, condition);
  if (condition.type === "quarterMileUnder") {
    return Number.isFinite(value) && value <= condition.threshold;
  }
  return value >= condition.threshold;
}

/** Progres 0-1 pentru bara din ecranul de profil. */
export function getAchievementProgress(
  profile: PlayerProfile,
  achievement: Achievement,
): { current: number; target: number; ratio: number; unlocked: boolean } {
  const unlocked = profile.achievements.some((a) => a.id === achievement.id);
  const target = achievement.condition.threshold;
  const raw = getConditionValue(profile, achievement.condition);

  if (achievement.condition.type === "quarterMileUnder") {
    // Progres invers: cu cât timpul e mai aproape de prag, cu atât mai plin.
    if (!Number.isFinite(raw)) {
      return { current: 0, target, ratio: 0, unlocked };
    }
    // Pornim de la 20 s (timp de începător) și ne apropiem de prag.
    const ratio = Math.min(1, Math.max(0, (20 - raw) / (20 - target)));
    return { current: raw, target, ratio, unlocked };
  }

  return {
    current: raw,
    target,
    ratio: target > 0 ? Math.min(1, raw / target) : 0,
    unlocked,
  };
}

/**
 * Întoarce id-urile achievements-urilor pe care profilul tocmai le-a îndeplinit
 * și care NU sunt deja marcate ca deblocate.
 */
export function checkAchievements(profile: PlayerProfile): string[] {
  const already = new Set(profile.achievements.map((a) => a.id));
  return ACHIEVEMENTS.filter(
    (achievement) =>
      !already.has(achievement.id) &&
      isConditionMet(profile, achievement.condition),
  ).map((achievement) => achievement.id);
}

/** Suma recompenselor pentru o listă de id-uri deblocate. */
export function sumAchievementRewards(ids: readonly string[]): {
  coins: number;
  xp: number;
} {
  return ids.reduce(
    (acc, id) => {
      const achievement = ACHIEVEMENT_INDEX.get(id);
      if (achievement === undefined) return acc;
      return {
        coins: acc.coins + achievement.reward.coins,
        xp: acc.xp + achievement.reward.xp,
      };
    },
    { coins: 0, xp: 0 },
  );
}
