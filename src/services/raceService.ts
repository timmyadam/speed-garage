/**
 * Stratul de „API” pentru modurile Cursă și Duel.
 * Aici se face legătura dintre catalogul de mașini, profilul jucătorului și
 * motoarele pure din `lib`. Serviciul NU scrie în storage — întoarce doar
 * rezultatul, iar store-ul decide cum îl aplică peste profil.
 */

import { CARS, CAR_INDEX } from "@/data/cars.mock";
import {
  computeDropChance,
  computeDuelRewards,
  computePowerRating,
  computeRaceRewards,
  createRng,
  rollCarDrop,
  STOCK_UPGRADES,
} from "@/lib/economy";
import { createId } from "@/lib/profile";
import { simulateDuel, selectDuelOpponent } from "@/lib/duelEngine";
import { simulateRace, type RaceSimulation } from "@/lib/raceEngine";
import type { Car, CarUpgrades, UpgradeLevel } from "@/types/car";
import type { PlayerProfile } from "@/types/player";
import type {
  DuelResult,
  RaceDifficulty,
  RaceResult,
  ShiftEvent,
} from "@/types/race";

/**
 * Cât de „pregătită” e mașina AI-ului, pe dificultate.
 * Rookie merge stock, Elite vine cu jumătate din upgrade-uri montate.
 */
const AI_UPGRADE_LEVEL: Record<RaceDifficulty, UpgradeLevel> = {
  rookie: 0,
  pro: 2,
  elite: 4,
};

/** Cu cât e ratingul adversarului peste/sub al jucătorului, pe dificultate. */
const AI_RATING_OFFSET: Record<RaceDifficulty, number> = {
  rookie: -8,
  pro: 2,
  elite: 12,
};

function aiUpgrades(difficulty: RaceDifficulty): CarUpgrades {
  const level = AI_UPGRADE_LEVEL[difficulty];
  return { engine: level, turbo: level, tires: level, weight: level };
}

/** O propunere de adversar pentru ecranul de selecție. */
export interface OpponentOption {
  car: Car;
  upgrades: CarUpgrades;
  rating: number;
  difficulty: RaceDifficulty;
  /** Timp estimat al adversarului, ca jucătorul să știe ce-l așteaptă. */
  estimatedTime: number;
}

/**
 * Trei adversari, câte unul pentru fiecare dificultate, aleși din catalog
 * în funcție de ratingul mașinii active a jucătorului.
 */
export async function getRaceOpponents(
  profile: PlayerProfile,
  seed?: number,
): Promise<OpponentOption[]> {
  const playerOwned = profile.ownedCars.find(
    (c) => c.carId === profile.selectedCarId,
  );
  const playerCar =
    playerOwned === undefined ? undefined : CAR_INDEX.get(playerOwned.carId);
  const playerRating =
    playerCar === undefined
      ? 30
      : computePowerRating(playerCar, playerOwned?.upgrades ?? STOCK_UPGRADES);

  const rng = createRng(seed ?? Math.floor(Math.random() * 2 ** 31));
  const difficulties: RaceDifficulty[] = ["rookie", "pro", "elite"];

  return difficulties.map((difficulty) => {
    const target = playerRating + AI_RATING_OFFSET[difficulty];
    const upgrades = aiUpgrades(difficulty);

    // Sortăm catalogul după cât de aproape e de ratingul-țintă și alegem
    // aleator dintre primele 4, ca să nu apară mereu aceeași mașină.
    const ranked = [...CARS]
      .filter((car) => car.id !== playerCar?.id)
      .sort(
        (a, b) =>
          Math.abs(computePowerRating(a, upgrades) - target) -
          Math.abs(computePowerRating(b, upgrades) - target),
      );
    const pool = ranked.slice(0, 4);
    const picked = pool[Math.floor(rng() * pool.length)] ?? ranked[0] ?? CARS[0];
    const car = picked ?? CARS[0];

    if (car === undefined) {
      throw new Error("Catalogul de mașini este gol.");
    }

    const simulation = simulateRace({
      playerCar: car,
      playerUpgrades: upgrades,
      opponentCar: car,
      opponentUpgrades: upgrades,
      shifts: [],
      reactionTime: 0.25,
      difficulty,
      seed: 1,
    });

    return {
      car,
      upgrades,
      rating: computePowerRating(car, upgrades),
      difficulty,
      // `opponentTime` din simulare = timpul mașinii conduse de AI.
      estimatedTime: simulation.opponentTime,
    };
  });
}

export interface RunRaceInput {
  profile: PlayerProfile;
  opponentCarId: string;
  difficulty: RaceDifficulty;
  shifts: readonly ShiftEvent[];
  reactionTime: number;
  seed?: number;
}

export interface RunRaceOutput {
  result: RaceResult;
  simulation: RaceSimulation;
}

/**
 * Rulează o cursă completă: simulare + recompense + eventual drop de mașină.
 * Aruncă doar dacă datele de intrare sunt inconsistente (mașină inexistentă).
 */
export async function runRace(input: RunRaceInput): Promise<RunRaceOutput> {
  const { profile } = input;
  const owned = profile.ownedCars.find((c) => c.carId === profile.selectedCarId);
  if (owned === undefined) {
    throw new Error("Nicio mașină selectată în garaj.");
  }
  const playerCar = CAR_INDEX.get(owned.carId);
  const opponentCar = CAR_INDEX.get(input.opponentCarId);
  if (playerCar === undefined || opponentCar === undefined) {
    throw new Error("Mașina nu există în catalog.");
  }

  const opponentUpgrades = aiUpgrades(input.difficulty);
  const seed = input.seed ?? Math.floor(Math.random() * 2 ** 31);

  const simulation = simulateRace({
    playerCar,
    playerUpgrades: owned.upgrades,
    opponentCar,
    opponentUpgrades,
    shifts: input.shifts,
    reactionTime: input.reactionTime,
    difficulty: input.difficulty,
    seed,
  });

  const rewards = computeRaceRewards({
    won: simulation.won,
    playerTime: simulation.playerTime,
    opponentTime: simulation.opponentTime,
    opponentRating: simulation.opponentRating,
    perfectShifts: simulation.perfectShifts,
    totalShifts: simulation.expectedShifts,
    playerLevel: profile.level,
    difficulty: input.difficulty,
  });

  /* ---- drop de mașină rară ---- */
  const allPerfect =
    simulation.expectedShifts > 0 &&
    simulation.perfectShifts === simulation.expectedShifts;
  const chance = computeDropChance({
    won: simulation.won,
    opponentRating: simulation.opponentRating,
    allShiftsPerfect: allPerfect,
    difficulty: input.difficulty,
  });
  const ownedIds = new Set(profile.ownedCars.map((c) => c.carId));
  // Se pot pica doar mașini Rare/Epic, nedeținute și cel mult cu 3 niveluri
  // peste nivelul curent — dropul nu trebuie să sară peste toată progresia.
  const dropCandidates = CARS.filter(
    (car) =>
      !ownedIds.has(car.id) &&
      (car.rarity === "rare" || car.rarity === "epic") &&
      car.unlockLevel <= profile.level + 3,
  );
  const droppedCarId = rollCarDrop(
    chance,
    dropCandidates,
    createRng(seed + 7919),
  );

  const result: RaceResult = {
    id: createId("race"),
    playedAt: Date.now(),
    playerCarId: playerCar.id,
    opponentCarId: opponentCar.id,
    difficulty: input.difficulty,
    playerTime: simulation.playerTime,
    opponentTime: simulation.opponentTime,
    won: simulation.won,
    marginSeconds: simulation.marginSeconds,
    playerTrapSpeedKmh: simulation.playerTrapSpeedKmh,
    perfectShifts: simulation.perfectShifts,
    totalShifts: simulation.expectedShifts,
    reactionTime: input.reactionTime,
    coinsEarned: rewards.coins,
    xpEarned: rewards.xp,
    droppedCarId,
  };

  return { result, simulation };
}

/* ------------------------------------------------------------------ */
/* DUEL                                                                */
/* ------------------------------------------------------------------ */

/** Alege adversarul de duel pe baza mașinii primite. */
export async function getDuelOpponent(
  playerCarId: string,
  playerUpgrades: CarUpgrades,
  seed?: number,
): Promise<Car | null> {
  const playerCar = CAR_INDEX.get(playerCarId);
  if (playerCar === undefined) return null;
  return selectDuelOpponent(playerCar, playerUpgrades, CARS, seed);
}

export interface RunDuelInput {
  profile: PlayerProfile;
  playerCarId: string;
  /** Omis => se alege automat un adversar cu rating comparabil. */
  opponentCarId?: string;
  seed?: number;
}

/** Rulează duelul de 5 runde și calculează recompensele. */
export async function runDuel(input: RunDuelInput): Promise<DuelResult> {
  const owned = input.profile.ownedCars.find(
    (c) => c.carId === input.playerCarId,
  );
  if (owned === undefined) {
    throw new Error("Mașina selectată nu este în garaj.");
  }
  const playerCar = CAR_INDEX.get(owned.carId);
  if (playerCar === undefined) {
    throw new Error("Mașina nu există în catalog.");
  }

  const seed = input.seed ?? Math.floor(Math.random() * 2 ** 31);
  const opponentCar =
    (input.opponentCarId === undefined
      ? undefined
      : CAR_INDEX.get(input.opponentCarId)) ??
    selectDuelOpponent(playerCar, owned.upgrades, CARS, seed);

  const simulation = simulateDuel({
    playerCar,
    playerUpgrades: owned.upgrades,
    opponentCar,
    seed,
  });

  const rewards = computeDuelRewards({
    won: simulation.won,
    roundsWon: simulation.roundsWon,
    opponentRating: simulation.opponentRating,
    playerLevel: input.profile.level,
  });

  return {
    id: createId("duel"),
    playedAt: Date.now(),
    playerCarId: playerCar.id,
    opponentCarId: opponentCar.id,
    rounds: simulation.rounds,
    roundsWon: simulation.roundsWon,
    roundsLost: simulation.roundsLost,
    roundsDrawn: simulation.roundsDrawn,
    won: simulation.won,
    coinsEarned: rewards.coins,
    xpEarned: rewards.xp,
  };
}
