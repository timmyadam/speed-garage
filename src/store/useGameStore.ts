/**
 * Store-ul global Zustand, compus din trei slice-uri.
 *
 * De ce Zustand și nu Context + useReducer:
 *  - jocul actualizează state foarte des (RPM, timp, monede); cu Context
 *    fiecare update re-randează tot subarborele, cu Zustand se abonează doar
 *    componentele care citesc bucata respectivă (selectori);
 *  - acțiunile sunt async (servicii care simulează un API), iar în Zustand se
 *    scriu natural, fără middleware de thunk;
 *  - store-ul e accesibil și în afara React (`useGameStore.getState()`), util
 *    în bucla de animație a cursei.
 *
 * NU folosim middleware-ul `persist`: avem nevoie de hidratare explicită
 * (`hydrate()` + `isHydrated`) ca să evităm hydration mismatch în Next.js și
 * de scriere debounced controlată de noi.
 */

import { create } from "zustand";
import { createGameSlice } from "./gameSlice";
import { createGarageSlice } from "./garageSlice";
import { createPlayerSlice } from "./playerSlice";
import type { GameStore } from "./types";

export const useGameStore = create<GameStore>()((...args) => ({
  ...createPlayerSlice(...args),
  ...createGarageSlice(...args),
  ...createGameSlice(...args),
}));

/* ------------------------------------------------------------------ */
/* SELECTORI                                                           */
/* ------------------------------------------------------------------ */
/*
 * Se folosesc așa: `const coins = useGameStore(selectCoins);`
 * Toți întorc valori primitive sau referințe stabile din state, deci nu
 * provoacă re-randări inutile. Pentru obiecte derivate folosiți
 * `useShallow` din `zustand/react/shallow` în componentă.
 */

export const selectProfile = (state: GameStore) => state.profile;
export const selectIsHydrated = (state: GameStore) => state.isHydrated;
export const selectCoins = (state: GameStore) => state.profile.coins;
export const selectLevel = (state: GameStore) => state.profile.level;
export const selectXp = (state: GameStore) => state.profile.xp;
export const selectOwnedCars = (state: GameStore) => state.profile.ownedCars;
export const selectSelectedCarId = (state: GameStore) =>
  state.profile.selectedCarId;
export const selectAchievements = (state: GameStore) =>
  state.profile.achievements;
export const selectPendingAchievements = (state: GameStore) =>
  state.pendingAchievements;
export const selectLastLevelUp = (state: GameStore) => state.lastLevelUp;
export const selectGarageError = (state: GameStore) => state.garageError;
export const selectRaceHistory = (state: GameStore) =>
  state.profile.raceHistory;
export const selectStats = (state: GameStore) => state.profile.stats;

/** Mașina activă (obiectul OwnedCar), null dacă nu e selectată niciuna. */
export const selectSelectedOwnedCar = (state: GameStore) =>
  state.profile.ownedCars.find(
    (car) => car.carId === state.profile.selectedCarId,
  ) ?? null;
