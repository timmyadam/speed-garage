/**
 * Slice-ul de garaj: cumpărare, upgrade, selectare, drop-uri.
 * Fiecare acțiune întoarce `boolean` (a reușit?), iar motivul eșecului
 * rămâne în `garageError` pentru afișare.
 */

import {
  buyCar as buyCarService,
  grantCar as grantCarService,
  selectCar as selectCarService,
  upgradeCar as upgradeCarService,
} from "@/services/carService";
import { commitProfile } from "./persist";
import type { GarageSlice, SliceCreator } from "./types";

export const createGarageSlice: SliceCreator<GarageSlice> = (set, get) => ({
  garageError: null,

  buyCar: async (carId) => {
    const result = await buyCarService(get().profile, carId);
    if (!result.ok) {
      set({ garageError: { code: result.error, message: result.message } });
      return false;
    }
    const outcome = await commitProfile(result.data);
    set({
      profile: outcome.profile,
      garageError: null,
      pendingAchievements: [
        ...get().pendingAchievements,
        ...outcome.unlockedAchievements,
      ],
    });
    return true;
  },

  upgradeCar: async (carId, part) => {
    const result = await upgradeCarService(get().profile, carId, part);
    if (!result.ok) {
      set({ garageError: { code: result.error, message: result.message } });
      return false;
    }
    const outcome = await commitProfile(result.data);
    set({
      profile: outcome.profile,
      garageError: null,
      pendingAchievements: [
        ...get().pendingAchievements,
        ...outcome.unlockedAchievements,
      ],
    });
    return true;
  },

  selectCar: async (carId) => {
    const result = await selectCarService(get().profile, carId);
    if (!result.ok) {
      set({ garageError: { code: result.error, message: result.message } });
      return false;
    }
    const outcome = await commitProfile(result.data);
    set({ profile: outcome.profile, garageError: null });
    return true;
  },

  grantCar: async (carId, source) => {
    const result = await grantCarService(get().profile, carId, source);
    if (!result.ok) {
      set({ garageError: { code: result.error, message: result.message } });
      return false;
    }
    const outcome = await commitProfile(result.data);
    set({
      profile: outcome.profile,
      pendingAchievements: [
        ...get().pendingAchievements,
        ...outcome.unlockedAchievements,
      ],
    });
    return true;
  },

  clearGarageError: () => set({ garageError: null }),
});
