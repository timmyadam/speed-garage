/**
 * Contractul store-ului global.
 * Interfețele stau aici (nu în fișierele de slice) ca să nu apară importuri
 * circulare între slice-uri și tipul agregat `GameStore`.
 */

import type { StateCreator } from "zustand";
import type { UpgradePart } from "@/types/car";
import type { OwnedCarSource, PlayerProfile } from "@/types/player";
import type { QuizResult } from "@/types/quiz";
import type { DuelResult, RaceResult } from "@/types/race";
import type { ServiceError } from "@/services/result";

/* ------------------------------- PLAYER ------------------------------- */

export interface PlayerSlice {
  profile: PlayerProfile;
  /** false până când s-a citit localStorage — UI-ul afișează skeleton. */
  isHydrated: boolean;
  /** Setat dacă localStorage e indisponibil (mod privat, quota). */
  storageError: string | null;
  /** Nivelul atins la ultimul level-up, null dacă a fost confirmat. */
  lastLevelUp: number | null;
  /** Id-uri de achievements deblocate și neafișate încă. */
  pendingAchievements: string[];

  /** Citește profilul din localStorage. Apelată o singură dată, din layout. */
  hydrate: () => Promise<void>;
  addCoins: (amount: number) => Promise<void>;
  addXp: (amount: number) => Promise<void>;
  renamePlayer: (name: string) => Promise<void>;
  resetProgress: () => Promise<void>;
  /** Marchează toast-urile ca văzute. */
  acknowledgeAchievements: () => void;
  acknowledgeLevelUp: () => void;
}

/* ------------------------------- GARAGE ------------------------------- */

export interface GarageSlice {
  /** Ultima eroare de business (bani insuficienți etc.), pentru UI. */
  garageError: { code: ServiceError; message: string } | null;

  buyCar: (carId: string) => Promise<boolean>;
  upgradeCar: (carId: string, part: UpgradePart) => Promise<boolean>;
  selectCar: (carId: string) => Promise<boolean>;
  /** Adaugă o mașină gratuit (drop de cursă). */
  grantCar: (carId: string, source: OwnedCarSource) => Promise<boolean>;
  clearGarageError: () => void;
}

/* -------------------------------- GAME -------------------------------- */

export interface GameSlice {
  lastRaceResult: RaceResult | null;
  lastDuelResult: DuelResult | null;
  lastQuizResult: QuizResult | null;

  recordRaceResult: (result: RaceResult) => Promise<void>;
  recordDuelResult: (result: DuelResult) => Promise<void>;
  recordQuizResult: (result: QuizResult) => Promise<void>;
  clearLastResults: () => void;
}

export type GameStore = PlayerSlice & GarageSlice & GameSlice;

/** Helper de tipare pentru fiecare slice. */
export type SliceCreator<T> = StateCreator<GameStore, [], [], T>;
