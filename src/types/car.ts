/**
 * Modele de date pentru mașini.
 * Toate statisticile sunt normalizate 0-100 ca să poată fi afișate direct
 * ca progress bars în UI, fără conversii suplimentare.
 */

/** Raritatea determină prețul, statisticile și șansa de drop. */
export type CarRarity = "common" | "rare" | "epic" | "legendary";

/** Categoriile de mașini din catalog. */
export type CarCategory =
  | "hot-hatch"
  | "muscle"
  | "jdm"
  | "supercar"
  | "hypercar"
  | "rally"
  | "ev";

/** Tipul de tracțiune — influențează lansarea în drag race. */
export type Drivetrain = "fwd" | "rwd" | "awd";

/** Piesele care pot fi îmbunătățite. */
export type UpgradePart = "engine" | "turbo" | "tires" | "weight";

/** Nivelul unui upgrade: 0 = stock, 5 = maxim. */
export type UpgradeLevel = 0 | 1 | 2 | 3 | 4 | 5;

/** Statistici normalizate 0-100. */
export interface CarStats {
  /** Viteză maximă relativă (0-100). */
  topSpeed: number;
  /** Accelerație relativă (0-100). */
  acceleration: number;
  /** Ținută de drum / viraje (0-100). */
  handling: number;
  /** Capacitate de frânare (0-100). */
  braking: number;
}

/** Nivelurile de upgrade instalate pe o mașină deținută. */
export interface CarUpgrades {
  engine: UpgradeLevel;
  turbo: UpgradeLevel;
  tires: UpgradeLevel;
  weight: UpgradeLevel;
}

/** O mașină din catalog (date statice, imutabile). */
export interface Car {
  id: string;
  /** Numele modelului, fără marcă (ex: "Supra MK4"). */
  name: string;
  /** Marca (ex: "Toyota"). */
  brand: string;
  category: CarCategory;
  rarity: CarRarity;
  /** Statistici de bază, înainte de upgrade-uri. */
  stats: CarStats;
  /** Putere în cai putere (CP). */
  powerHp: number;
  /** Masă în kilograme. */
  weightKg: number;
  drivetrain: Drivetrain;
  /** Timp 0-100 km/h în secunde. */
  zeroToHundred: number;
  /** Viteză maximă reală în km/h (pentru afișare). */
  topSpeedKmh: number;
  /** Preț în monede virtuale. */
  price: number;
  /** Culoare de accent (hex) folosită pentru placeholder-ul CSS al mașinii. */
  accentColor: string;
  /** Nivelul de jucător necesar pentru a putea cumpăra mașina. */
  unlockLevel: number;
  /** Anul modelului (pentru fișa tehnică). */
  year: number;
}

/** Statistici efective = bază + bonusuri din upgrade-uri. */
export interface EffectiveCarStats extends CarStats {
  /** Putere efectivă în CP, după upgrade-uri de motor/turbo. */
  powerHp: number;
  /** Masă efectivă în kg, după upgrade-ul de reducere a greutății. */
  weightKg: number;
}

/** Descrierea unui upgrade disponibil (pentru panoul din garaj). */
export interface UpgradeOption {
  part: UpgradePart;
  currentLevel: UpgradeLevel;
  nextLevel: UpgradeLevel | null;
  /** null dacă piesa este deja la nivel maxim. */
  cost: number | null;
  isMaxed: boolean;
  /** Diferența de statistici pe care o aduce următorul nivel. */
  gain: CarStats;
}
