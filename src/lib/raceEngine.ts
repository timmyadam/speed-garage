/**
 * Motorul de cursă — drag race pe 400 de metri.
 *
 * Modelul NU este o simulare fizică reală; este o formulă calibrată care
 * produce timpi plauzibili (un hot-hatch stock ~15,9 s, un hypercar ~9 s)
 * și, mai important, care reacționează vizibil la abilitatea jucătorului.
 *
 * Timp final =
 *     timp_de_bază(stats)                 // ce poate mașina
 *   - bonus_putere/greutate               // CP per tonă
 *   + penalizare_tracțiune                // FWD patinează la lansare
 *   + penalizare_reacție                  // cât de repede pleci de la stop
 *   + suma_deltelor_de_shift              // ce faci tu cu ea
 *
 * Toate funcțiile sunt pure. Nu se atinge de catalog sau de storage:
 * apelantul (raceService) livrează obiectele Car deja rezolvate.
 */

import type { Car, CarCategory, CarUpgrades } from "@/types/car";
import type {
  GearWindow,
  RaceDifficulty,
  ShiftEvent,
  ShiftQuality,
} from "@/types/race";
import {
  clamp,
  computePowerRating,
  createRng,
  getEffectiveStats,
  roundTo,
  STOCK_UPGRADES,
} from "./economy";

/** Distanța cursei, în metri. */
export const RACE_DISTANCE_M = 400;

/** Constanta de start a formulei de timp (secunde pentru o mașină „zero”). */
const BASE_TIME_CONSTANT = 19.65;
/** Cât scade timpul pentru fiecare punct de accelerație / viteză maximă. */
const ACCELERATION_WEIGHT = 0.07;
const TOP_SPEED_WEIGHT = 0.03;

/** Penalizare de lansare în funcție de tracțiune (secunde). */
const DRIVETRAIN_LAUNCH_PENALTY: Record<Car["drivetrain"], number> = {
  fwd: 0.15,
  rwd: 0.05,
  awd: 0,
};

/** Timpul de reacție „ideal” — sub el primești bonus, peste el penalizare. */
export const IDEAL_REACTION_TIME = 0.25;

/**
 * Delta de timp adăugată de fiecare schimbare de treaptă.
 * Un „perfect” scade 0,14 s, un „late” adaugă 0,20 s: pe 6 trepte
 * diferența dintre o cursă impecabilă și una ratată este ~1,7 s,
 * adică suficient cât abilitatea să bată o mașină puțin mai bună.
 */
export const SHIFT_TIME_DELTA: Record<ShiftQuality, number> = {
  perfect: -0.14,
  good: -0.02,
  early: 0.12,
  late: 0.2,
};

/** Bonus pentru cuplul instantaneu al electricelor (nu au ce shift-uri să rateze). */
const EV_INSTANT_TORQUE_BONUS = 0.15;

/** Turația de ralanti afișată în gauge. */
export const IDLE_RPM = 900;

/** Limitatorul de turație, pe categorie. */
const REDLINE_BY_CATEGORY: Record<CarCategory, number> = {
  "hot-hatch": 6800,
  muscle: 6500,
  jdm: 8200,
  rally: 7000,
  supercar: 8600,
  hypercar: 8200,
  ev: 16000,
};

/** Numărul de trepte, pe categorie (EV = cutie cu 2 rapoarte). */
const GEAR_COUNT_BY_CATEGORY: Record<CarCategory, number> = {
  "hot-hatch": 6,
  muscle: 6,
  jdm: 6,
  rally: 6,
  supercar: 7,
  hypercar: 7,
  ev: 2,
};

/** Cât de mult „încălzește” fiecare nivel de motor limitatorul. */
const REDLINE_GAIN_PER_ENGINE_LEVEL = 100;

/* ------------------------------------------------------------------ */
/* CUTIE DE VITEZE ȘI FERESTRE DE SHIFT (helpere pentru UI)            */
/* ------------------------------------------------------------------ */

/** Numărul de trepte al mașinii. */
export function getGearCount(car: Car): number {
  return GEAR_COUNT_BY_CATEGORY[car.category];
}

/** Câte schimbări de treaptă execută jucătorul într-o cursă. */
export function getShiftCount(car: Car): number {
  return Math.max(0, getGearCount(car) - 1);
}

/** Turația maximă efectivă, după upgrade-urile de motor. */
export function getRedlineRpm(
  car: Car,
  upgrades: CarUpgrades = STOCK_UPGRADES,
): number {
  return (
    REDLINE_BY_CATEGORY[car.category] +
    REDLINE_GAIN_PER_ENGINE_LEVEL * upgrades.engine
  );
}

/**
 * Ferestrele de shift pentru fiecare treaptă.
 *
 * - fereastra „perfect” pornește la 93% din limitator și se îngustează cu
 *   fiecare treaptă (0,6% pe treaptă), deci finalul cursei cere mai multă
 *   precizie decât startul;
 * - anvelopele mai bune (upgrade `tires`) lărgesc fereastra cu 0,8% pe nivel,
 *   pentru că mașina e mai iertătoare la cuplarea treptei;
 * - `rpmRisePerSecond` scade cu treapta (rapoartele sunt mai lungi) și crește
 *   cu accelerația mașinii — UI-ul poate anima acul direct din valoarea asta.
 */
export function getGearWindows(
  car: Car,
  upgrades: CarUpgrades = STOCK_UPGRADES,
): GearWindow[] {
  const redline = getRedlineRpm(car, upgrades);
  const stats = getEffectiveStats(car, upgrades);
  const gearCount = getGearCount(car);
  const tireWiden = 0.008 * upgrades.tires;

  const windows: GearWindow[] = [];
  for (let gear = 1; gear <= gearCount; gear++) {
    const lowerRatio = clamp(0.93 + 0.006 * (gear - 1) - tireWiden, 0.85, 0.985);
    // Timpul petrecut într-o treaptă crește cu numărul ei; o mașină cu
    // accelerație mare trece mai repede prin fiecare raport.
    const gearTime =
      0.85 * gear ** 0.45 * (1 + (60 - stats.acceleration) / 140);
    windows.push({
      gear,
      idleRpm: IDLE_RPM,
      redlineRpm: redline,
      optimalMinRpm: Math.round(redline * lowerRatio),
      optimalMaxRpm: Math.round(redline * 0.99),
      rpmRisePerSecond: Math.round((redline - IDLE_RPM) / Math.max(0.35, gearTime)),
    });
  }
  return windows;
}

/**
 * Evaluează calitatea unui shift în funcție de turația la care s-a apăsat.
 * UI-ul apelează asta la fiecare tap și trimite rezultatul mai departe
 * în `simulateRace`, ca motorul să nu depindă de animație.
 */
export function getShiftQuality(rpm: number, window: GearWindow): ShiftQuality {
  if (rpm > window.optimalMaxRpm) return "late";
  if (rpm >= window.optimalMinRpm) return "perfect";
  // „Good” = ultimele 8% din limitator dinaintea ferestrei perfecte.
  if (rpm >= window.optimalMinRpm - window.redlineRpm * 0.08) return "good";
  return "early";
}

/* ------------------------------------------------------------------ */
/* SIMULAREA CURSEI                                                    */
/* ------------------------------------------------------------------ */

/** Cât de bine schimbă treptele AI-ul, pe dificultate (0-1). */
const AI_SHIFT_SKILL: Record<RaceDifficulty, number> = {
  rookie: 0.35,
  pro: 0.62,
  elite: 0.85,
};

/** Timpul de reacție al AI-ului, pe dificultate. */
const AI_REACTION_TIME: Record<RaceDifficulty, number> = {
  rookie: 0.42,
  pro: 0.3,
  elite: 0.22,
};

export interface RaceSimulationInput {
  playerCar: Car;
  playerUpgrades: CarUpgrades;
  opponentCar: Car;
  opponentUpgrades: CarUpgrades;
  /** Shift-urile executate de jucător, în ordine. */
  shifts: readonly ShiftEvent[];
  /** Timp de reacție la start, în secunde. */
  reactionTime: number;
  difficulty: RaceDifficulty;
  /** Seed pentru variația AI-ului; omis => aleator. */
  seed?: number;
}

export interface RaceSimulation {
  playerTime: number;
  opponentTime: number;
  won: boolean;
  /** Pozitiv = jucătorul a câștigat, în secunde. */
  marginSeconds: number;
  playerTrapSpeedKmh: number;
  opponentTrapSpeedKmh: number;
  perfectShifts: number;
  totalShifts: number;
  /** Câte shift-uri se așteptau de la mașina jucătorului. */
  expectedShifts: number;
  playerRating: number;
  opponentRating: number;
  /** Suma deltelor de shift — util pentru ecranul de rezultat. */
  shiftDelta: number;
  reactionPenalty: number;
}

/**
 * Timpul „brut” al unei mașini, fără contribuția pilotului.
 * Este partea din rezultat care ține exclusiv de fișa tehnică.
 */
export function computeBaseTime(car: Car, upgrades: CarUpgrades): number {
  const stats = getEffectiveStats(car, upgrades);

  // Contribuția statisticilor normalizate.
  let time =
    BASE_TIME_CONSTANT -
    ACCELERATION_WEIGHT * stats.acceleration -
    TOP_SPEED_WEIGHT * stats.topSpeed;

  // Bonus de raport putere/greutate (CP la tonă). 150 CP/t = neutru.
  const powerToWeight = (stats.powerHp / stats.weightKg) * 1000;
  time -= clamp((powerToWeight - 150) * 0.0012, -0.4, 1.0);

  // Tracțiunea contează la lansare, nu la viteză maximă.
  time += DRIVETRAIN_LAUNCH_PENALTY[car.drivetrain];

  if (car.category === "ev") time -= EV_INSTANT_TORQUE_BONUS;

  // Plafon de siguranță: nicio configurație nu poate coborî sub 7,5 s.
  return Math.max(7.5, time);
}

/** Penalizarea/bonusul de reacție la semafor. */
export function computeReactionPenalty(reactionTime: number): number {
  const safe = clamp(reactionTime, 0.1, 1.5);
  return clamp(safe - IDEAL_REACTION_TIME, -0.15, 0.9);
}

/**
 * Viteza de trecere a liniei de sosire, estimată din timpul total.
 * Viteza medie pe 400 m înmulțită cu 1,55 aproximează bine „trap speed”-ul
 * unei curse de drag; rezultatul e plafonat de viteza maximă reală a mașinii.
 */
export function computeTrapSpeed(car: Car, time: number): number {
  const averageMs = RACE_DISTANCE_M / Math.max(1, time);
  return Math.round(clamp(averageMs * 3.6 * 1.55, 60, car.topSpeedKmh));
}

/** Simulează cursa completă și întoarce toate cifrele necesare UI-ului. */
export function simulateRace(input: RaceSimulationInput): RaceSimulation {
  const rng = createRng(input.seed ?? Math.floor(Math.random() * 2 ** 31));

  /* ---- jucător ---- */
  const expectedShifts = getShiftCount(input.playerCar);
  const usedShifts = input.shifts.slice(0, expectedShifts);
  let shiftDelta = 0;
  let perfectShifts = 0;
  for (const shift of usedShifts) {
    shiftDelta += SHIFT_TIME_DELTA[shift.quality];
    if (shift.quality === "perfect") perfectShifts += 1;
  }
  // Shift-urile neexecutate (jucătorul a ratat complet treapta) se
  // penalizează la fel ca un shift întârziat.
  const missedShifts = Math.max(0, expectedShifts - usedShifts.length);
  shiftDelta += missedShifts * SHIFT_TIME_DELTA.late;

  const reactionPenalty = computeReactionPenalty(input.reactionTime);
  const playerTime = roundTo(
    Math.max(
      6.5,
      computeBaseTime(input.playerCar, input.playerUpgrades) +
        shiftDelta +
        reactionPenalty,
    ),
    3,
  );

  /* ---- adversar (AI) ---- */
  const aiSkill = AI_SHIFT_SKILL[input.difficulty];
  const aiShiftCount = getShiftCount(input.opponentCar);
  // AI-ul amestecă shift-uri perfecte cu shift-uri „early” proporțional cu skill-ul.
  const aiShiftDelta =
    aiShiftCount *
    (aiSkill * SHIFT_TIME_DELTA.perfect + (1 - aiSkill) * SHIFT_TIME_DELTA.early);
  // Jitter ±0,18 s ca aceeași cursă să nu fie identică de fiecare dată.
  const aiJitter = (rng() - 0.5) * 0.36;
  const opponentTime = roundTo(
    Math.max(
      6.5,
      computeBaseTime(input.opponentCar, input.opponentUpgrades) +
        aiShiftDelta +
        computeReactionPenalty(AI_REACTION_TIME[input.difficulty]) +
        aiJitter,
    ),
    3,
  );

  const margin = roundTo(opponentTime - playerTime, 3);

  return {
    playerTime,
    opponentTime,
    won: playerTime < opponentTime,
    marginSeconds: margin,
    playerTrapSpeedKmh: computeTrapSpeed(input.playerCar, playerTime),
    opponentTrapSpeedKmh: computeTrapSpeed(input.opponentCar, opponentTime),
    perfectShifts,
    totalShifts: usedShifts.length,
    expectedShifts,
    playerRating: computePowerRating(input.playerCar, input.playerUpgrades),
    opponentRating: computePowerRating(input.opponentCar, input.opponentUpgrades),
    shiftDelta: roundTo(shiftDelta, 3),
    reactionPenalty: roundTo(reactionPenalty, 3),
  };
}

/**
 * Estimează timpul pe care l-ar face mașina cu o cursă „bună” (toate
 * shift-urile în fereastra perfectă și reacție ideală). Folosit în garaj
 * ca indicator de performanță și la matchmaking.
 */
export function estimateBestTime(car: Car, upgrades: CarUpgrades): number {
  return roundTo(
    computeBaseTime(car, upgrades) +
      getShiftCount(car) * SHIFT_TIME_DELTA.perfect,
    2,
  );
}
