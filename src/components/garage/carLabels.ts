import type { CarCategory, Drivetrain, UpgradePart } from "@/types/car";
import type { RaceDifficulty } from "@/types/race";

/** Etichete în română pentru enum-urile din catalog. Un singur loc, reutilizat. */
export const CATEGORY_LABEL: Record<CarCategory, string> = {
  "hot-hatch": "Hot Hatch",
  muscle: "Muscle",
  jdm: "JDM",
  supercar: "Supercar",
  hypercar: "Hypercar",
  rally: "Raliu",
  ev: "Electrică",
};

export const CATEGORY_ORDER: readonly CarCategory[] = [
  "hot-hatch",
  "jdm",
  "muscle",
  "rally",
  "supercar",
  "hypercar",
  "ev",
];

export const DRIVETRAIN_LABEL: Record<Drivetrain, string> = {
  fwd: "Tracțiune față",
  rwd: "Tracțiune spate",
  awd: "Integrală",
};

export const DRIVETRAIN_SHORT: Record<Drivetrain, string> = {
  fwd: "FWD",
  rwd: "RWD",
  awd: "AWD",
};

export const UPGRADE_LABEL: Record<UpgradePart, string> = {
  engine: "Motor",
  turbo: "Turbo",
  tires: "Anvelope",
  weight: "Greutate",
};

export const DIFFICULTY_LABEL: Record<RaceDifficulty, string> = {
  rookie: "Începător",
  pro: "Profesionist",
  elite: "Elită",
};

export const DIFFICULTY_HINT: Record<RaceDifficulty, string> = {
  rookie: "Adversar cu mașină stock. Recompensă ×1",
  pro: "Adversar cu upgrade-uri medii. Recompensă ×1,25",
  elite: "Adversar aproape complet modificat. Recompensă ×1,6",
};

/** Formatare numerică unitară (ro-RO), pentru tot ce nu sunt monede. */
export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat("ro-RO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Timpi de cursă: mereu 2 zecimale, ca să se compare pe verticală. */
export function formatSeconds(value: number): string {
  return `${formatNumber(value, 2)} s`;
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp));
}
