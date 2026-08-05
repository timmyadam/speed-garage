/**
 * Economia jocului: XP, niveluri, prețuri de upgrade, recompense, drop-uri.
 * Toate funcțiile de aici sunt PURE (fără I/O, fără Math.random neinjectat)
 * ca să poată fi testate și rulate identic pe server și pe client.
 */

import type {
  Car,
  CarStats,
  CarUpgrades,
  EffectiveCarStats,
  UpgradeLevel,
  UpgradeOption,
  UpgradePart,
} from "@/types/car";
import type { LevelProgress } from "@/types/player";
import type { RaceDifficulty, Rewards } from "@/types/race";

/* ------------------------------------------------------------------ */
/* CONSTANTE DE BALANS                                                 */
/* ------------------------------------------------------------------ */

/**
 * Monede la profil nou.
 * Calibrare: cea mai ieftină mașină cumpărabilă (Golf GTI Mk7) costă 3.800.
 * O victorie la începutul jocului aduce ~285-340 de monede, deci prima
 * achiziție devine posibilă după 3-4 curse câștigate
 * (2.800 + 3 x ~340 = 3.820, respectiv 2.800 + 4 x ~285 = 3.940).
 */
export const STARTING_COINS = 2800;

export const MAX_UPGRADE_LEVEL: UpgradeLevel = 5;

export const UPGRADE_PARTS: readonly UpgradePart[] = [
  "engine",
  "turbo",
  "tires",
  "weight",
];

/** Upgrade-uri toate pe 0 — starea „stock”. */
export const STOCK_UPGRADES: CarUpgrades = {
  engine: 0,
  turbo: 0,
  tires: 0,
  weight: 0,
};

/**
 * Bonus de statistici per NIVEL de upgrade.
 * Cu 5 niveluri pe toate cele 4 piese o mașină câștigă aproximativ
 * +16 topSpeed, +33 acceleration, +19 handling, +15 braking — suficient
 * cât un Common complet modificat să bată un Rare stock, dar nu un Epic.
 */
export const UPGRADE_STAT_GAIN: Record<UpgradePart, CarStats> = {
  engine: { topSpeed: 2.2, acceleration: 1.6, handling: 0, braking: 0 },
  turbo: { topSpeed: 1.0, acceleration: 3.0, handling: 0, braking: 0 },
  tires: { topSpeed: 0, acceleration: 0.8, handling: 2.6, braking: 1.4 },
  weight: { topSpeed: 0, acceleration: 1.2, handling: 1.2, braking: 1.6 },
};

/** Efect mecanic (CP / kg) per nivel, folosit în simularea cursei. */
const UPGRADE_POWER_GAIN_PER_LEVEL: Record<UpgradePart, number> = {
  engine: 0.06,
  turbo: 0.08,
  tires: 0,
  weight: 0,
};
const WEIGHT_REDUCTION_PER_LEVEL = 0.025;

/** Cât de scumpă e fiecare piesă față de baza comună. */
const UPGRADE_PART_COST_MULTIPLIER: Record<UpgradePart, number> = {
  engine: 1.25,
  turbo: 1.15,
  tires: 0.9,
  weight: 1.0,
};

/** Coeficient global al costului de upgrade, raportat la prețul mașinii. */
const UPGRADE_COST_BASE_RATIO = 0.032;

/** Bonus de rating adăugat pentru raritate (mașinile rare „impun respect”). */
const RARITY_RATING_BONUS: Record<Car["rarity"], number> = {
  common: 0,
  rare: 2,
  epic: 4,
  legendary: 6,
};

/** Valoare numerică a rarității, folosită la runda de raritate din duel. */
export const RARITY_VALUE: Record<Car["rarity"], number> = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

/** Multiplicatorii de recompensă pe dificultate (cursă). */
export const DIFFICULTY_REWARD_MULTIPLIER: Record<RaceDifficulty, number> = {
  rookie: 1,
  pro: 1.25,
  elite: 1.6,
};

/* ------------------------------------------------------------------ */
/* UTILITARE                                                           */
/* ------------------------------------------------------------------ */

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Generator pseudo-aleator determinist (mulberry32) — același seed, același joc. */
export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* STATISTICI EFECTIVE                                                 */
/* ------------------------------------------------------------------ */

/**
 * Statisticile efective = statisticile de bază + bonusurile de upgrade.
 * Statisticile 0-100 sunt plafonate la 100; puterea și greutatea nu sunt
 * plafonate, ele intră în modelul fizic simplificat din raceEngine.
 */
export function getEffectiveStats(
  car: Car,
  upgrades: CarUpgrades = STOCK_UPGRADES,
): EffectiveCarStats {
  let topSpeed = car.stats.topSpeed;
  let acceleration = car.stats.acceleration;
  let handling = car.stats.handling;
  let braking = car.stats.braking;
  let powerMultiplier = 1;

  for (const part of UPGRADE_PARTS) {
    const level = upgrades[part];
    if (level <= 0) continue;
    const gain = UPGRADE_STAT_GAIN[part];
    topSpeed += gain.topSpeed * level;
    acceleration += gain.acceleration * level;
    handling += gain.handling * level;
    braking += gain.braking * level;
    powerMultiplier += UPGRADE_POWER_GAIN_PER_LEVEL[part] * level;
  }

  return {
    topSpeed: clamp(roundTo(topSpeed, 1), 0, 100),
    acceleration: clamp(roundTo(acceleration, 1), 0, 100),
    handling: clamp(roundTo(handling, 1), 0, 100),
    braking: clamp(roundTo(braking, 1), 0, 100),
    powerHp: Math.round(car.powerHp * powerMultiplier),
    weightKg: Math.round(
      car.weightKg * (1 - WEIGHT_REDUCTION_PER_LEVEL * upgrades.weight),
    ),
  };
}

/**
 * Rating sintetic 0-100 folosit pentru matchmaking (cursă și duel).
 * Ponderile favorizează accelerația și viteza maximă, pentru că modul
 * principal este drag race-ul.
 */
export function computePowerRating(
  car: Car,
  upgrades: CarUpgrades = STOCK_UPGRADES,
): number {
  const s = getEffectiveStats(car, upgrades);
  const raw =
    s.topSpeed * 0.34 +
    s.acceleration * 0.34 +
    s.handling * 0.18 +
    s.braking * 0.14 +
    RARITY_RATING_BONUS[car.rarity];
  return clamp(Math.round(raw), 1, 100);
}

/* ------------------------------------------------------------------ */
/* UPGRADE-URI                                                         */
/* ------------------------------------------------------------------ */

/**
 * Costul pentru a urca o piesă la `targetLevel`.
 * Formula: pret_masina * 0.032 * targetLevel^1.55 * multiplicator_piesa,
 * rotunjit la 10 monede. Creșterea supraliniară face ca nivelul 5 să coste
 * de ~11 ori mai mult decât nivelul 1, deci maxarea e o decizie, nu o rutină.
 */
export function getUpgradeCost(
  car: Car,
  part: UpgradePart,
  targetLevel: number,
): number {
  if (targetLevel < 1 || targetLevel > MAX_UPGRADE_LEVEL) return 0;
  const raw =
    car.price *
    UPGRADE_COST_BASE_RATIO *
    targetLevel ** 1.55 *
    UPGRADE_PART_COST_MULTIPLIER[part];
  return Math.max(50, Math.round(raw / 10) * 10);
}

/** Costul total pentru a duce toate piesele la maxim de la nivelurile curente. */
export function getRemainingUpgradeCost(
  car: Car,
  upgrades: CarUpgrades,
): number {
  let total = 0;
  for (const part of UPGRADE_PARTS) {
    for (let level = upgrades[part] + 1; level <= MAX_UPGRADE_LEVEL; level++) {
      total += getUpgradeCost(car, part, level);
    }
  }
  return total;
}

/** Descrierea completă a panoului de upgrade pentru o mașină deținută. */
export function getUpgradeOptions(
  car: Car,
  upgrades: CarUpgrades,
): UpgradeOption[] {
  return UPGRADE_PARTS.map((part) => {
    const currentLevel = upgrades[part];
    const isMaxed = currentLevel >= MAX_UPGRADE_LEVEL;
    const nextLevel = isMaxed ? null : ((currentLevel + 1) as UpgradeLevel);
    return {
      part,
      currentLevel,
      nextLevel,
      cost: nextLevel === null ? null : getUpgradeCost(car, part, nextLevel),
      isMaxed,
      gain: isMaxed
        ? { topSpeed: 0, acceleration: 0, handling: 0, braking: 0 }
        : { ...UPGRADE_STAT_GAIN[part] },
    };
  });
}

/** Progresul de modificare al mașinii, 0-1 (0 = stock, 1 = totul la maxim). */
export function getUpgradeProgress(upgrades: CarUpgrades): number {
  const total = UPGRADE_PARTS.reduce((sum, part) => sum + upgrades[part], 0);
  return total / (UPGRADE_PARTS.length * MAX_UPGRADE_LEVEL);
}

/* ------------------------------------------------------------------ */
/* XP ȘI NIVELURI                                                      */
/* ------------------------------------------------------------------ */

/**
 * XP necesar pentru a trece de la `level` la `level + 1`.
 * Curbă ușor supraliniară: 100 * level^1.25.
 *   L1->L2 = 100, L5->L6 = 748, L10->L11 = 1.778, L20->L21 = 4.729.
 * O cursă câștigată aduce ~90-170 XP, deci primele niveluri vin repede
 * iar nivelul 15 (mașini Legendary) cere sute de activități — e endgame.
 */
export function xpForLevel(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  return Math.round(100 * safeLevel ** 1.25);
}

/** XP total cumulat necesar pentru a ATINGE `level` (nivelul 1 = 0 XP). */
export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < Math.max(1, Math.floor(level)); l++) {
    total += xpForLevel(l);
  }
  return total;
}

/**
 * Aplică XP câștigat și detectează level-up-urile (pot fi mai multe deodată).
 * Returnează starea nouă completă, fără să mute nimic în profil — apelantul
 * decide ce face cu `levelsGained` (ex: toast de level-up).
 */
export function applyXp(
  current: { level: number; xp: number; totalXp: number },
  gained: number,
): LevelProgress {
  let level = Math.max(1, Math.floor(current.level));
  let xp = Math.max(0, current.xp) + Math.max(0, Math.round(gained));
  const totalXp = Math.max(0, current.totalXp) + Math.max(0, Math.round(gained));
  let levelsGained = 0;

  // Buclă: un câștig mare de XP poate acoperi mai multe niveluri deodată.
  let needed = xpForLevel(level);
  while (xp >= needed) {
    xp -= needed;
    level += 1;
    levelsGained += 1;
    needed = xpForLevel(level);
  }

  return {
    level,
    xp,
    totalXp,
    xpToNextLevel: needed,
    progress: needed > 0 ? clamp(xp / needed, 0, 1) : 0,
    levelsGained,
  };
}

/** Starea de progres a unui profil, fără a adăuga XP (pentru bara din navbar). */
export function getLevelProgress(current: {
  level: number;
  xp: number;
  totalXp: number;
}): LevelProgress {
  return applyXp(current, 0);
}

/* ------------------------------------------------------------------ */
/* RECOMPENSE                                                          */
/* ------------------------------------------------------------------ */

/**
 * Multiplicator de monede în funcție de nivel: +9% per nivel peste 1.
 * Fără el, mașinile Legendary (145k-320k) ar fi imposibil de atins;
 * cu el, o victorie la nivel 15 aduce de ~2,3 ori mai mult decât la nivel 1.
 */
export function levelCoinMultiplier(level: number): number {
  return 1 + 0.09 * (Math.max(1, level) - 1);
}

export interface RaceRewardInput {
  won: boolean;
  playerTime: number;
  opponentTime: number;
  /** Ratingul mașinii adversarului (0-100). */
  opponentRating: number;
  perfectShifts: number;
  totalShifts: number;
  playerLevel: number;
  difficulty: RaceDifficulty;
}

/**
 * Recompensa de cursă:
 *   baza (180 câștig / 60 pierdere)
 * + rating adversar x 2,0 (câștig) sau x 0,6 (pierdere)
 * + precizie la shift-uri x 70
 * + marja de victorie (max 3s) x 35
 * totul înmulțit cu dificultatea și cu multiplicatorul de nivel.
 */
export function computeRaceRewards(input: RaceRewardInput): Rewards {
  const precision =
    input.totalShifts > 0 ? input.perfectShifts / input.totalShifts : 0;
  const margin = input.won
    ? clamp(input.opponentTime - input.playerTime, 0, 3)
    : 0;

  const baseCoins = input.won ? 180 : 60;
  const ratingCoins = input.opponentRating * (input.won ? 2.0 : 0.6);
  const precisionCoins = precision * 70;
  const marginCoins = margin * 35;

  const multiplier =
    DIFFICULTY_REWARD_MULTIPLIER[input.difficulty] *
    levelCoinMultiplier(input.playerLevel);

  const coins = Math.round(
    (baseCoins + ratingCoins + precisionCoins + marginCoins) * multiplier,
  );

  const baseXp = input.won ? 70 : 24;
  const xp = Math.round(
    (baseXp + input.opponentRating * (input.won ? 0.9 : 0.35)) *
      DIFFICULTY_REWARD_MULTIPLIER[input.difficulty],
  );

  return { coins, xp };
}

export interface DuelRewardInput {
  won: boolean;
  roundsWon: number;
  opponentRating: number;
  playerLevel: number;
}

/** Duelul e mai scurt decât cursa, deci plătește ~60% dintr-o victorie de cursă. */
export function computeDuelRewards(input: DuelRewardInput): Rewards {
  const baseCoins = input.won ? 120 : 35;
  const roundCoins = input.roundsWon * 35;
  const ratingCoins = input.opponentRating * (input.won ? 0.9 : 0.3);

  const coins = Math.round(
    (baseCoins + roundCoins + ratingCoins) * levelCoinMultiplier(input.playerLevel),
  );
  const xp = Math.round(
    (input.won ? 45 : 15) + input.roundsWon * 8 + input.opponentRating * 0.2,
  );

  return { coins, xp };
}

export interface QuizRewardInput {
  correctAnswers: number;
  totalQuestions: number;
  bestStreak: number;
  playerLevel: number;
}

/**
 * Quiz-ul răsplătește consistența: fiecare răspuns corect 16 monede,
 * fiecare treaptă de streak încă 12, iar un scor perfect adaugă 100.
 * O sesiune perfectă de 10 întrebări = 380 monede la nivelul 1.
 */
export function computeQuizRewards(input: QuizRewardInput): Rewards {
  const perfect =
    input.totalQuestions > 0 && input.correctAnswers === input.totalQuestions;

  const coins = Math.round(
    (input.correctAnswers * 16 + input.bestStreak * 12 + (perfect ? 100 : 0)) *
      levelCoinMultiplier(input.playerLevel),
  );
  const xp = Math.round(
    input.correctAnswers * 7 + input.bestStreak * 4 + (perfect ? 30 : 0),
  );

  return { coins, xp };
}

/** Scor brut al unei sesiuni de quiz (afișat separat de monede). */
export function computeQuizScore(
  correctAnswers: number,
  bestStreak: number,
): number {
  return correctAnswers * 100 + bestStreak * 50;
}

/* ------------------------------------------------------------------ */
/* DROP DE MAȘINI RARE                                                 */
/* ------------------------------------------------------------------ */

export interface DropChanceInput {
  won: boolean;
  opponentRating: number;
  allShiftsPerfect: boolean;
  difficulty: RaceDifficulty;
}

/**
 * Șansa de drop după o cursă: 3,5% de bază, +0,06% per punct de rating al
 * adversarului, +2% pentru o cursă fără nicio greșeală, scalat cu dificultatea.
 * Plafon 12% — dropul rămâne un bonus, nu sursa principală de mașini.
 */
export function computeDropChance(input: DropChanceInput): number {
  if (!input.won) return 0;
  const base =
    0.035 +
    input.opponentRating * 0.0006 +
    (input.allShiftsPerfect ? 0.02 : 0);
  return clamp(base * DIFFICULTY_REWARD_MULTIPLIER[input.difficulty], 0, 0.12);
}

/**
 * Alege o mașină din lista de candidați dacă zarul cade sub `chance`.
 * Candidații sunt filtrați de apelant (mașini nedeținute, sub nivelul permis).
 */
export function rollCarDrop(
  chance: number,
  candidates: readonly Car[],
  rng: () => number,
): string | null {
  if (candidates.length === 0 || chance <= 0) return null;
  if (rng() >= chance) return null;
  const index = Math.floor(rng() * candidates.length) % candidates.length;
  const picked = candidates[index];
  return picked === undefined ? null : picked.id;
}

/** Poate jucătorul să cumpere mașina? Motiv explicit pentru UI. */
export type PurchaseCheck =
  | { canBuy: true }
  | { canBuy: false; reason: "owned" | "level" | "coins" };

export function canPurchaseCar(
  car: Car,
  playerLevel: number,
  coins: number,
  ownedCarIds: readonly string[],
): PurchaseCheck {
  if (ownedCarIds.includes(car.id)) return { canBuy: false, reason: "owned" };
  if (playerLevel < car.unlockLevel) return { canBuy: false, reason: "level" };
  if (coins < car.price) return { canBuy: false, reason: "coins" };
  return { canBuy: true };
}
