/**
 * Motorul de duel — „Top Trumps” cu mașini.
 *
 * 5 runde, câte una pentru fiecare categorie: viteză maximă, accelerație,
 * handling, preț, raritate. Ordinea rundelor se amestecă, ca jucătorul să nu
 * poată memora secvența. Câștigă cine ia mai multe runde; egalitatea la
 * runde se decide în favoarea celui cu ratingul general mai mare.
 *
 * Funcții pure — catalogul de mașini este primit ca parametru.
 */

import type { Car, CarUpgrades } from "@/types/car";
import type { DuelRound, DuelRoundOutcome, DuelStatKey } from "@/types/race";
import {
  computePowerRating,
  createRng,
  getEffectiveStats,
  RARITY_VALUE,
  STOCK_UPGRADES,
} from "./economy";

/** Cele 5 categorii comparate, în ordinea „canonică”. */
export const DUEL_STATS: readonly DuelStatKey[] = [
  "topSpeed",
  "acceleration",
  "handling",
  "price",
  "rarity",
];

export const DUEL_ROUND_COUNT = DUEL_STATS.length;

/** Etichete în română pentru UI (evită un dicționar separat în componente). */
export const DUEL_STAT_LABELS: Record<DuelStatKey, string> = {
  topSpeed: "Viteză maximă",
  acceleration: "Accelerație",
  handling: "Ținută de drum",
  price: "Valoare",
  rarity: "Raritate",
};

/**
 * Valoarea comparată într-o rundă.
 * Statisticile folosesc valorile EFECTIVE (deci upgrade-urile contează),
 * dar prețul și raritatea rămân la valorile de catalog: nu poți face un
 * Common să pară Legendary doar montându-i turbo.
 */
export function getDuelStatValue(
  car: Car,
  upgrades: CarUpgrades,
  stat: DuelStatKey,
): number {
  switch (stat) {
    case "topSpeed":
      return getEffectiveStats(car, upgrades).topSpeed;
    case "acceleration":
      return getEffectiveStats(car, upgrades).acceleration;
    case "handling":
      return getEffectiveStats(car, upgrades).handling;
    case "price":
      return car.price;
    case "rarity":
      return RARITY_VALUE[car.rarity];
  }
}

/** Amestecare Fisher-Yates cu RNG injectat (determinist dacă dai seed). */
function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = copy[i];
    const b = copy[j];
    if (a === undefined || b === undefined) continue;
    copy[i] = b;
    copy[j] = a;
  }
  return copy;
}

/**
 * Alege adversarul: o mașină din catalog cu rating apropiat de al jucătorului.
 * Toleranța pornește de la ±10 puncte și se lărgește până găsește candidați,
 * ca să nu rămână niciodată fără adversar (ex: jucător cu Jesko full upgrade).
 */
export function selectDuelOpponent(
  playerCar: Car,
  playerUpgrades: CarUpgrades,
  catalog: readonly Car[],
  seed?: number,
): Car {
  const rng = createRng(seed ?? Math.floor(Math.random() * 2 ** 31));
  const playerRating = computePowerRating(playerCar, playerUpgrades);

  const pool = catalog.filter((car) => car.id !== playerCar.id);
  const fallback = pool[0] ?? playerCar;

  for (const tolerance of [10, 18, 28, 45, 100]) {
    const candidates = pool.filter(
      (car) =>
        Math.abs(computePowerRating(car, STOCK_UPGRADES) - playerRating) <=
        tolerance,
    );
    if (candidates.length > 0) {
      const picked = candidates[Math.floor(rng() * candidates.length)];
      if (picked !== undefined) return picked;
    }
  }
  return fallback;
}

/** Rezultatul unei singure runde. */
export function resolveRound(
  playerValue: number,
  opponentValue: number,
): DuelRoundOutcome {
  if (playerValue > opponentValue) return "win";
  if (playerValue < opponentValue) return "loss";
  return "draw";
}

export interface DuelSimulationInput {
  playerCar: Car;
  playerUpgrades: CarUpgrades;
  opponentCar: Car;
  /** Adversarul joacă întotdeauna stock — altfel matchmaking-ul devine opac. */
  opponentUpgrades?: CarUpgrades;
  seed?: number;
}

export interface DuelSimulation {
  rounds: DuelRound[];
  roundsWon: number;
  roundsLost: number;
  roundsDrawn: number;
  won: boolean;
  playerRating: number;
  opponentRating: number;
}

/** Rulează cele 5 runde și decide meciul. */
export function simulateDuel(input: DuelSimulationInput): DuelSimulation {
  const rng = createRng(input.seed ?? Math.floor(Math.random() * 2 ** 31));
  const opponentUpgrades = input.opponentUpgrades ?? STOCK_UPGRADES;
  const order = shuffle(DUEL_STATS, rng);

  const rounds: DuelRound[] = order.map((stat, index) => {
    const playerValue = getDuelStatValue(
      input.playerCar,
      input.playerUpgrades,
      stat,
    );
    const opponentValue = getDuelStatValue(
      input.opponentCar,
      opponentUpgrades,
      stat,
    );
    return {
      index,
      stat,
      playerValue,
      opponentValue,
      outcome: resolveRound(playerValue, opponentValue),
    };
  });

  const roundsWon = rounds.filter((r) => r.outcome === "win").length;
  const roundsLost = rounds.filter((r) => r.outcome === "loss").length;
  const roundsDrawn = rounds.length - roundsWon - roundsLost;

  const playerRating = computePowerRating(input.playerCar, input.playerUpgrades);
  const opponentRating = computePowerRating(input.opponentCar, opponentUpgrades);

  // Departajare la egalitate de runde: ratingul general al mașinii.
  const won =
    roundsWon > roundsLost ||
    (roundsWon === roundsLost && playerRating > opponentRating);

  return {
    rounds,
    roundsWon,
    roundsLost,
    roundsDrawn,
    won,
    playerRating,
    opponentRating,
  };
}
