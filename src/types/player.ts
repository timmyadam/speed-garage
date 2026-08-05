/** Modele de date pentru profilul jucătorului, achievements și leaderboard. */

import type { CarUpgrades } from "./car";
import type { DuelResult, RaceResult } from "./race";
import type { QuizResult } from "./quiz";

/** Cum a intrat mașina în garaj. */
export type OwnedCarSource = "starter" | "purchase" | "drop";

/** O mașină deținută de jucător (instanță, nu definiție de catalog). */
export interface OwnedCar {
  carId: string;
  upgrades: CarUpgrades;
  acquiredAt: number;
  source: OwnedCarSource;
  racesTotal: number;
  racesWon: number;
  /** Cel mai bun timp pe 400 m cu mașina asta (secunde), null dacă n-a curs. */
  bestQuarterMile: number | null;
}

/** Contoare agregate — sursa de adevăr pentru evaluarea achievements. */
export interface PlayerStats {
  racesPlayed: number;
  racesWon: number;
  duelsPlayed: number;
  duelsWon: number;
  quizzesPlayed: number;
  quizQuestionsAnswered: number;
  quizCorrectAnswers: number;
  /** Cel mai lung streak de răspunsuri corecte din toate sesiunile. */
  quizBestStreak: number;
  perfectShifts: number;
  coinsEarned: number;
  coinsSpent: number;
  upgradesPurchased: number;
  carsPurchased: number;
  /** Cel mai bun timp absolut pe 400 m, null dacă n-a curs niciodată. */
  bestQuarterMile: number | null;
}

/** Un achievement deblocat, cu momentul deblocării. */
export interface UnlockedAchievement {
  id: string;
  unlockedAt: number;
}

/** Tipurile de condiții pe care le poate avea un achievement. */
export type AchievementConditionType =
  | "racesWon"
  | "duelsWon"
  | "carsOwned"
  | "quizStreak"
  | "playerLevel"
  | "coinsEarned"
  | "perfectShifts"
  | "upgradesPurchased"
  | "legendaryOwned"
  | "quarterMileUnder";

/** Condiția de deblocare, evaluată de `checkAchievements`. */
export interface AchievementCondition {
  type: AchievementConditionType;
  /**
   * Pragul de atins. Pentru `quarterMileUnder` este un timp în secunde,
   * iar comparația este „mai mic sau egal", nu „mai mare sau egal".
   */
  threshold: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  /** Numele iconiței Phosphor, ex: "Trophy". UI-ul o mapează la componentă. */
  icon: string;
  condition: AchievementCondition;
  reward: {
    coins: number;
    xp: number;
  };
  /** Ordinea de afișare în profil. */
  order: number;
}

/** Profilul complet al jucătorului — exact ce se serializează în localStorage. */
export interface PlayerProfile {
  id: string;
  name: string;
  coins: number;
  /** XP acumulat în nivelul curent. */
  xp: number;
  /** XP total acumulat vreodată (folosit pentru leaderboard). */
  totalXp: number;
  level: number;
  ownedCars: OwnedCar[];
  /** Mașina activă; null doar teoretic (profilul nou pornește cu 2 mașini). */
  selectedCarId: string | null;
  achievements: UnlockedAchievement[];
  /** Ultimele curse, cele mai recente primele. Limitat la MAX_HISTORY. */
  raceHistory: RaceResult[];
  duelHistory: DuelResult[];
  quizHistory: QuizResult[];
  stats: PlayerStats;
  createdAt: number;
  updatedAt: number;
}

/** O intrare în clasament (rivali simulați + jucătorul). */
export interface LeaderboardEntry {
  id: string;
  name: string;
  level: number;
  totalXp: number;
  racesWon: number;
  /** Numele mașinii de prezentare a rivalului. */
  favoriteCarId: string;
  /** true doar pentru rândul jucătorului curent. */
  isPlayer: boolean;
}

/** Rezultatul unei operații de nivel (folosit de addXp). */
export interface LevelProgress {
  level: number;
  xp: number;
  totalXp: number;
  /** XP necesar pentru a trece de la `level` la `level + 1`. */
  xpToNextLevel: number;
  /** 0-1, pentru bara de progres. */
  progress: number;
  /** Niveluri câștigate în operația curentă (0 dacă n-a fost level-up). */
  levelsGained: number;
}
