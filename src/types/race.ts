/** Modele de date pentru modul Cursă (drag race) și modul Duel (Top Trumps). */

import type { CarUpgrades } from "./car";

/* ------------------------------------------------------------------ */
/* CURSĂ                                                               */
/* ------------------------------------------------------------------ */

/**
 * Calitatea unei schimbări de treaptă, evaluată de UI în funcție de
 * poziția acului de turație față de fereastra optimă.
 */
export type ShiftQuality = "perfect" | "good" | "early" | "late";

/** Un eveniment de schimbare a treptei, trimis de UI către motorul de cursă. */
export interface ShiftEvent {
  /** Treapta din care s-a schimbat (1 = din 1 în 2). */
  fromGear: number;
  quality: ShiftQuality;
  /** Turația la care s-a apăsat butonul (pentru afișare/telemetrie). */
  rpm: number;
}

/** Fereastra optimă de shift pentru o treaptă. */
export interface GearWindow {
  gear: number;
  /** Turația de ralanti pentru treapta respectivă. */
  idleRpm: number;
  /** Turația maximă (limitator). */
  redlineRpm: number;
  /** Limita inferioară a ferestrei „perfect". */
  optimalMinRpm: number;
  /** Limita superioară a ferestrei „perfect". */
  optimalMaxRpm: number;
  /** Cât de repede urcă acul în treapta asta (RPM/secundă). */
  rpmRisePerSecond: number;
}

export type RaceDifficulty = "rookie" | "pro" | "elite";

/** Input-ul complet pentru simularea unei curse. */
export interface RaceInput {
  playerCarId: string;
  playerUpgrades: CarUpgrades;
  opponentCarId: string;
  /** Nivelurile de upgrade ale adversarului (AI). */
  opponentUpgrades: CarUpgrades;
  shifts: ShiftEvent[];
  /** Timp de reacție la stingerea semaforului, în secunde. */
  reactionTime: number;
  difficulty: RaceDifficulty;
  playerLevel: number;
  /** Seed opțional pentru rezultate deterministe (test/replay). */
  seed?: number;
}

/** Recompensele acordate după un mod de joc. */
export interface Rewards {
  coins: number;
  xp: number;
}

/** Rezultatul unei curse. */
export interface RaceResult {
  id: string;
  playedAt: number;
  playerCarId: string;
  opponentCarId: string;
  difficulty: RaceDifficulty;
  /** Timp final jucător pe 400 m, în secunde. */
  playerTime: number;
  opponentTime: number;
  won: boolean;
  /** Diferența (pozitivă = jucătorul a câștigat). */
  marginSeconds: number;
  /** Viteză de trecere a liniei de sosire, km/h. */
  playerTrapSpeedKmh: number;
  perfectShifts: number;
  totalShifts: number;
  reactionTime: number;
  coinsEarned: number;
  xpEarned: number;
  /** id-ul mașinii primite ca drop, dacă a existat unul. */
  droppedCarId: string | null;
}

/* ------------------------------------------------------------------ */
/* DUEL (Top Trumps)                                                   */
/* ------------------------------------------------------------------ */

/** Statisticile pe care se compară cele două mașini în duel. */
export type DuelStatKey =
  | "topSpeed"
  | "acceleration"
  | "handling"
  | "price"
  | "rarity";

export type DuelRoundOutcome = "win" | "loss" | "draw";

export interface DuelRound {
  index: number;
  stat: DuelStatKey;
  playerValue: number;
  opponentValue: number;
  outcome: DuelRoundOutcome;
}

export interface DuelResult {
  id: string;
  playedAt: number;
  playerCarId: string;
  opponentCarId: string;
  rounds: DuelRound[];
  roundsWon: number;
  roundsLost: number;
  roundsDrawn: number;
  won: boolean;
  coinsEarned: number;
  xpEarned: number;
}
