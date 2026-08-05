/**
 * Stratul de „API” pentru mașini.
 * Toate funcțiile sunt async ca să poată fi înlocuite mâine cu fetch-uri
 * reale, fără să se schimbe nimic în componente.
 *
 * Operațiile care schimbă profilul (buyCar / upgradeCar) sunt IMUTABILE:
 * primesc profilul și întorc unul nou, nu modifică nimic pe loc. Store-ul
 * decide dacă îl adoptă.
 */

import { CARS, CAR_INDEX } from "@/data/cars.mock";
import {
  canPurchaseCar,
  computePowerRating,
  getEffectiveStats,
  getUpgradeCost,
  getUpgradeOptions,
  getUpgradeProgress,
  MAX_UPGRADE_LEVEL,
} from "@/lib/economy";
import { createOwnedCar } from "@/lib/profile";
import {
  estimateBestTime,
  getGearWindows,
  getShiftCount,
} from "@/lib/raceEngine";
import type {
  Car,
  CarCategory,
  CarRarity,
  CarUpgrades,
  EffectiveCarStats,
  UpgradeLevel,
  UpgradeOption,
  UpgradePart,
} from "@/types/car";
import type { OwnedCar, PlayerProfile } from "@/types/player";
import type { GearWindow } from "@/types/race";
import { fail, ok, type ServiceResult } from "./result";

/* ------------------------------------------------------------------ */
/* CITIRI                                                              */
/* ------------------------------------------------------------------ */

export async function getCars(): Promise<Car[]> {
  return [...CARS];
}

export async function getCarById(carId: string): Promise<Car | null> {
  return CAR_INDEX.get(carId) ?? null;
}

export async function getCarsByIds(carIds: readonly string[]): Promise<Car[]> {
  return carIds
    .map((id) => CAR_INDEX.get(id))
    .filter((car): car is Car => car !== undefined);
}

export async function getCarsByCategory(
  category: CarCategory,
): Promise<Car[]> {
  return CARS.filter((car) => car.category === category);
}

export async function getCarsByRarity(rarity: CarRarity): Promise<Car[]> {
  return CARS.filter((car) => car.rarity === rarity);
}

/** O intrare din magazin, cu tot ce trebuie ca UI-ul să deseneze cardul. */
export interface ShopEntry {
  car: Car;
  owned: boolean;
  canBuy: boolean;
  /** null dacă poate cumpăra. */
  lockReason: "owned" | "level" | "coins" | null;
  rating: number;
}

/** Catalogul din perspectiva jucătorului, sortat după preț. */
export async function getShop(profile: PlayerProfile): Promise<ShopEntry[]> {
  const ownedIds = profile.ownedCars.map((c) => c.carId);
  return CARS.map((car) => {
    const check = canPurchaseCar(car, profile.level, profile.coins, ownedIds);
    return {
      car,
      owned: ownedIds.includes(car.id),
      canBuy: check.canBuy,
      lockReason: check.canBuy ? null : check.reason,
      rating: computePowerRating(car),
    };
  }).sort((a, b) => a.car.price - b.car.price);
}

/** Fișa completă a unei mașini deținute (pagina de detaliu din garaj). */
export interface CarDetails {
  car: Car;
  upgrades: CarUpgrades;
  effectiveStats: EffectiveCarStats;
  rating: number;
  upgradeOptions: UpgradeOption[];
  /** 0-1, cât de modificată e mașina. */
  upgradeProgress: number;
  /** Timp estimat pe 400 m cu shift-uri perfecte. */
  estimatedBestTime: number;
  gearWindows: GearWindow[];
  shiftCount: number;
}

export async function getCarDetails(
  carId: string,
  upgrades: CarUpgrades,
): Promise<CarDetails | null> {
  const car = CAR_INDEX.get(carId);
  if (car === undefined) return null;
  return {
    car,
    upgrades,
    effectiveStats: getEffectiveStats(car, upgrades),
    rating: computePowerRating(car, upgrades),
    upgradeOptions: getUpgradeOptions(car, upgrades),
    upgradeProgress: getUpgradeProgress(upgrades),
    estimatedBestTime: estimateBestTime(car, upgrades),
    gearWindows: getGearWindows(car, upgrades),
    shiftCount: getShiftCount(car),
  };
}

/** Garajul jucătorului, cu mașinile rezolvate din catalog. */
export interface GarageEntry {
  owned: OwnedCar;
  car: Car;
  rating: number;
  effectiveStats: EffectiveCarStats;
  isSelected: boolean;
}

export async function getGarage(
  profile: PlayerProfile,
): Promise<GarageEntry[]> {
  return profile.ownedCars
    .map((owned) => {
      const car = CAR_INDEX.get(owned.carId);
      if (car === undefined) return null;
      return {
        owned,
        car,
        rating: computePowerRating(car, owned.upgrades),
        effectiveStats: getEffectiveStats(car, owned.upgrades),
        isSelected: profile.selectedCarId === owned.carId,
      };
    })
    .filter((entry): entry is GarageEntry => entry !== null)
    .sort((a, b) => b.rating - a.rating);
}

/* ------------------------------------------------------------------ */
/* MUTAȚII (imutabile)                                                 */
/* ------------------------------------------------------------------ */

/** Adaugă o mașină în garaj fără cost (drop, cadou, mașini de start). */
export async function grantCar(
  profile: PlayerProfile,
  carId: string,
  source: OwnedCar["source"],
): Promise<ServiceResult<PlayerProfile>> {
  const car = CAR_INDEX.get(carId);
  if (car === undefined) return fail("car-not-found");
  if (profile.ownedCars.some((c) => c.carId === carId)) {
    return fail("car-already-owned");
  }
  return ok({
    ...profile,
    ownedCars: [...profile.ownedCars, createOwnedCar(carId, source)],
    updatedAt: Date.now(),
  });
}

/** Cumpără o mașină: verifică nivel + monede, scade prețul, actualizează stats. */
export async function buyCar(
  profile: PlayerProfile,
  carId: string,
): Promise<ServiceResult<PlayerProfile>> {
  const car = CAR_INDEX.get(carId);
  if (car === undefined) return fail("car-not-found");

  const ownedIds = profile.ownedCars.map((c) => c.carId);
  const check = canPurchaseCar(car, profile.level, profile.coins, ownedIds);
  if (!check.canBuy) {
    if (check.reason === "owned") return fail("car-already-owned");
    if (check.reason === "level") return fail("level-too-low");
    return fail("not-enough-coins");
  }

  return ok({
    ...profile,
    coins: profile.coins - car.price,
    ownedCars: [...profile.ownedCars, createOwnedCar(carId, "purchase")],
    stats: {
      ...profile.stats,
      coinsSpent: profile.stats.coinsSpent + car.price,
      carsPurchased: profile.stats.carsPurchased + 1,
    },
    updatedAt: Date.now(),
  });
}

/** Urcă o piesă cu un nivel pe o mașină deținută. */
export async function upgradeCar(
  profile: PlayerProfile,
  carId: string,
  part: UpgradePart,
): Promise<ServiceResult<PlayerProfile>> {
  const car = CAR_INDEX.get(carId);
  if (car === undefined) return fail("car-not-found");

  const owned = profile.ownedCars.find((c) => c.carId === carId);
  if (owned === undefined) return fail("car-not-owned");

  const currentLevel = owned.upgrades[part];
  if (currentLevel >= MAX_UPGRADE_LEVEL) return fail("upgrade-maxed");

  const nextLevel = (currentLevel + 1) as UpgradeLevel;
  const cost = getUpgradeCost(car, part, nextLevel);
  if (profile.coins < cost) return fail("not-enough-coins");

  return ok({
    ...profile,
    coins: profile.coins - cost,
    ownedCars: profile.ownedCars.map((entry) =>
      entry.carId === carId
        ? { ...entry, upgrades: { ...entry.upgrades, [part]: nextLevel } }
        : entry,
    ),
    stats: {
      ...profile.stats,
      coinsSpent: profile.stats.coinsSpent + cost,
      upgradesPurchased: profile.stats.upgradesPurchased + 1,
    },
    updatedAt: Date.now(),
  });
}

/** Schimbă mașina activă. */
export async function selectCar(
  profile: PlayerProfile,
  carId: string,
): Promise<ServiceResult<PlayerProfile>> {
  if (!profile.ownedCars.some((c) => c.carId === carId)) {
    return fail("car-not-owned");
  }
  return ok({ ...profile, selectedCarId: carId, updatedAt: Date.now() });
}
