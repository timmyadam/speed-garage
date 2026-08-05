/**
 * Slice-ul de profil: hidratare, monede, XP, level-up, reset.
 * Toate mutațiile trec prin `commitProfile`, care evaluează achievements
 * și programează salvarea debounced.
 */

import { createNewProfile } from "@/lib/profile";
import {
  addCoins as addCoinsService,
  addXp as addXpService,
  getPlayerProfile,
  renamePlayer as renamePlayerService,
  resetPlayerProfile,
} from "@/services/playerService";
import { cancelScheduledSave, commitProfile, flushSave } from "./persist";
import type { PlayerSlice, SliceCreator } from "./types";

export const createPlayerSlice: SliceCreator<PlayerSlice> = (set, get) => ({
  // Profilul implicit există de la început ca UI-ul să nu lucreze cu null,
  // dar `isHydrated: false` îi spune să nu-l afișeze încă (evită mismatch SSR).
  profile: createNewProfile(),
  isHydrated: false,
  storageError: null,
  lastLevelUp: null,
  pendingAchievements: [],

  hydrate: async () => {
    if (get().isHydrated) return;
    const loaded = await getPlayerProfile();
    // La prima rulare (profil nou) și după migrare, comitem imediat ca să
    // existe o salvare validă în noua schemă.
    const outcome = await commitProfile(loaded.profile);
    set({
      profile: outcome.profile,
      isHydrated: true,
      storageError: loaded.storageError,
      pendingAchievements: [
        ...get().pendingAchievements,
        ...outcome.unlockedAchievements,
      ],
    });
  },

  addCoins: async (amount) => {
    const updated = await addCoinsService(get().profile, amount);
    const outcome = await commitProfile(updated);
    set({
      profile: outcome.profile,
      pendingAchievements: [
        ...get().pendingAchievements,
        ...outcome.unlockedAchievements,
      ],
    });
  },

  addXp: async (amount) => {
    const before = get().profile.level;
    const { profile } = await addXpService(get().profile, amount);
    const outcome = await commitProfile(profile);
    set({
      profile: outcome.profile,
      lastLevelUp:
        outcome.profile.level > before ? outcome.profile.level : get().lastLevelUp,
      pendingAchievements: [
        ...get().pendingAchievements,
        ...outcome.unlockedAchievements,
      ],
    });
  },

  renamePlayer: async (name) => {
    const updated = await renamePlayerService(get().profile, name);
    const outcome = await commitProfile(updated);
    set({ profile: outcome.profile });
  },

  resetProgress: async () => {
    cancelScheduledSave();
    const fresh = await resetPlayerProfile();
    set({
      profile: fresh,
      isHydrated: true,
      lastLevelUp: null,
      pendingAchievements: [],
      garageError: null,
      lastRaceResult: null,
      lastDuelResult: null,
      lastQuizResult: null,
    });
    // Scriem imediat noul profil, ca un refresh instant să nu învie progresul.
    await commitProfile(fresh);
    flushSave();
  },

  acknowledgeAchievements: () => set({ pendingAchievements: [] }),
  acknowledgeLevelUp: () => set({ lastLevelUp: null }),
});
