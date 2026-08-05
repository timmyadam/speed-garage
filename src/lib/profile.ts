/**
 * Fabrica de profil + normalizarea profilurilor citite din localStorage.
 * Trăiește în `lib` (nu în `services`) ca să poată fi folosită atât de
 * `storageService` (la migrare), cât și de `playerService`, fără import ciclic.
 */

import { STARTER_CAR_IDS } from "@/data/cars.mock";
import type { CarUpgrades, UpgradeLevel } from "@/types/car";
import type { OwnedCar, PlayerProfile, PlayerStats } from "@/types/player";
import { clamp, STARTING_COINS, STOCK_UPGRADES } from "./economy";

/** Câte rezultate păstrăm în istoric per mod de joc. */
export const MAX_HISTORY_ENTRIES = 25;

/** Id scurt, unic, fără dependențe externe. */
export function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

export function createEmptyStats(): PlayerStats {
  return {
    racesPlayed: 0,
    racesWon: 0,
    duelsPlayed: 0,
    duelsWon: 0,
    quizzesPlayed: 0,
    quizQuestionsAnswered: 0,
    quizCorrectAnswers: 0,
    quizBestStreak: 0,
    perfectShifts: 0,
    coinsEarned: 0,
    coinsSpent: 0,
    upgradesPurchased: 0,
    carsPurchased: 0,
    bestQuarterMile: null,
  };
}

export function createOwnedCar(
  carId: string,
  source: OwnedCar["source"],
): OwnedCar {
  return {
    carId,
    upgrades: { ...STOCK_UPGRADES },
    acquiredAt: Date.now(),
    source,
    racesTotal: 0,
    racesWon: 0,
    bestQuarterMile: null,
  };
}

/** Profil nou: 2 mașini de start + bugetul inițial de monede. */
export function createNewProfile(name = "Pilot"): PlayerProfile {
  const now = Date.now();
  const ownedCars = STARTER_CAR_IDS.map((id) => createOwnedCar(id, "starter"));
  return {
    id: createId("player"),
    name,
    coins: STARTING_COINS,
    xp: 0,
    totalXp: 0,
    level: 1,
    ownedCars,
    selectedCarId: ownedCars[0]?.carId ?? null,
    achievements: [],
    raceHistory: [],
    duelHistory: [],
    quizHistory: [],
    stats: createEmptyStats(),
    createdAt: now,
    updatedAt: now,
  };
}

/* ------------------------------------------------------------------ */
/* NORMALIZARE (defensivă față de date vechi / corupte)                */
/* ------------------------------------------------------------------ */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function str(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function upgradeLevel(value: unknown): UpgradeLevel {
  const level = Math.round(clamp(num(value, 0), 0, 5));
  return level as UpgradeLevel;
}

function normalizeUpgrades(value: unknown): CarUpgrades {
  if (!isRecord(value)) return { ...STOCK_UPGRADES };
  return {
    engine: upgradeLevel(value.engine),
    turbo: upgradeLevel(value.turbo),
    tires: upgradeLevel(value.tires),
    weight: upgradeLevel(value.weight),
  };
}

function normalizeOwnedCar(value: unknown): OwnedCar | null {
  if (!isRecord(value)) return null;
  const carId = str(value.carId, "");
  if (carId === "") return null;
  const best = value.bestQuarterMile;
  return {
    carId,
    upgrades: normalizeUpgrades(value.upgrades),
    acquiredAt: num(value.acquiredAt, Date.now()),
    source:
      value.source === "purchase" || value.source === "drop"
        ? value.source
        : "starter",
    racesTotal: Math.max(0, Math.round(num(value.racesTotal, 0))),
    racesWon: Math.max(0, Math.round(num(value.racesWon, 0))),
    bestQuarterMile:
      typeof best === "number" && Number.isFinite(best) ? best : null,
  };
}

function normalizeStats(value: unknown): PlayerStats {
  const base = createEmptyStats();
  if (!isRecord(value)) return base;
  const best = value.bestQuarterMile;
  return {
    racesPlayed: num(value.racesPlayed, base.racesPlayed),
    racesWon: num(value.racesWon, base.racesWon),
    duelsPlayed: num(value.duelsPlayed, base.duelsPlayed),
    duelsWon: num(value.duelsWon, base.duelsWon),
    quizzesPlayed: num(value.quizzesPlayed, base.quizzesPlayed),
    quizQuestionsAnswered: num(
      value.quizQuestionsAnswered,
      base.quizQuestionsAnswered,
    ),
    quizCorrectAnswers: num(value.quizCorrectAnswers, base.quizCorrectAnswers),
    quizBestStreak: num(value.quizBestStreak, base.quizBestStreak),
    perfectShifts: num(value.perfectShifts, base.perfectShifts),
    coinsEarned: num(value.coinsEarned, base.coinsEarned),
    coinsSpent: num(value.coinsSpent, base.coinsSpent),
    upgradesPurchased: num(value.upgradesPurchased, base.upgradesPurchased),
    carsPurchased: num(value.carsPurchased, base.carsPurchased),
    bestQuarterMile:
      typeof best === "number" && Number.isFinite(best) ? best : null,
  };
}

/**
 * Transformă orice obiect citit din storage într-un `PlayerProfile` valid.
 * Dacă structura e iremediabil coruptă (fără mașini), întoarce null și
 * apelantul pornește un profil nou.
 */
export function normalizeProfile(value: unknown): PlayerProfile | null {
  if (!isRecord(value)) return null;

  const ownedCars = Array.isArray(value.ownedCars)
    ? value.ownedCars
        .map(normalizeOwnedCar)
        .filter((car): car is OwnedCar => car !== null)
    : [];

  if (ownedCars.length === 0) return null;

  const achievements = Array.isArray(value.achievements)
    ? value.achievements
        .filter(isRecord)
        .map((entry) => ({
          id: str(entry.id, ""),
          unlockedAt: num(entry.unlockedAt, Date.now()),
        }))
        .filter((entry) => entry.id !== "")
    : [];

  const selectedCandidate = str(value.selectedCarId, "");
  const selectedCarId = ownedCars.some((c) => c.carId === selectedCandidate)
    ? selectedCandidate
    : (ownedCars[0]?.carId ?? null);

  const now = Date.now();

  return {
    id: str(value.id, createId("player")),
    name: str(value.name, "Pilot"),
    coins: Math.max(0, Math.round(num(value.coins, STARTING_COINS))),
    xp: Math.max(0, Math.round(num(value.xp, 0))),
    totalXp: Math.max(0, Math.round(num(value.totalXp, 0))),
    level: Math.max(1, Math.round(num(value.level, 1))),
    ownedCars,
    selectedCarId,
    achievements,
    raceHistory: Array.isArray(value.raceHistory)
      ? (value.raceHistory.slice(0, MAX_HISTORY_ENTRIES) as PlayerProfile["raceHistory"])
      : [],
    duelHistory: Array.isArray(value.duelHistory)
      ? (value.duelHistory.slice(0, MAX_HISTORY_ENTRIES) as PlayerProfile["duelHistory"])
      : [],
    quizHistory: Array.isArray(value.quizHistory)
      ? (value.quizHistory.slice(0, MAX_HISTORY_ENTRIES) as PlayerProfile["quizHistory"])
      : [],
    stats: normalizeStats(value.stats),
    createdAt: num(value.createdAt, now),
    updatedAt: now,
  };
}
