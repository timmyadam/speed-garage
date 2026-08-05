/**
 * Persistența store-ului.
 *
 * De ce debounce: la un upgrade sau la finalul unei curse se pot lanța 3-4
 * mutații consecutive (monede, XP, achievements, istoric). Fără debounce am
 * serializa profilul de fiecare dată. 400 ms adună tot într-o singură scriere,
 * suficient de repede cât să nu pierdem progres la un refresh rapid.
 *
 * Modulul nu importă store-ul, ca să nu existe dependențe circulare.
 */

import { checkAchievements } from "@/lib/achievements";
import { unlockAchievements } from "@/services/playerService";
import { saveProfile } from "@/services/storageService";
import type { PlayerProfile } from "@/types/player";

export const SAVE_DEBOUNCE_MS = 400;

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingProfile: PlayerProfile | null = null;
let unloadHookRegistered = false;

/** Scrie imediat ce e în așteptare (la unload sau la reset). */
export function flushSave(): void {
  if (saveTimer !== null) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (pendingProfile !== null) {
    const profile = pendingProfile;
    pendingProfile = null;
    void saveProfile(profile);
  }
}

/** Programează salvarea debounced a profilului. */
export function scheduleSave(profile: PlayerProfile): void {
  pendingProfile = profile;

  if (typeof window !== "undefined" && !unloadHookRegistered) {
    unloadHookRegistered = true;
    // Dacă utilizatorul închide tab-ul în cele 400 ms, nu pierdem nimic.
    window.addEventListener("beforeunload", flushSave);
  }

  if (saveTimer !== null) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    const toSave = pendingProfile;
    pendingProfile = null;
    if (toSave !== null) void saveProfile(toSave);
  }, SAVE_DEBOUNCE_MS);
}

/** Anulează orice salvare programată (folosit la resetProgress). */
export function cancelScheduledSave(): void {
  if (saveTimer !== null) clearTimeout(saveTimer);
  saveTimer = null;
  pendingProfile = null;
}

export interface CommitOutcome {
  profile: PlayerProfile;
  /** Achievements deblocate de mutația curentă (pentru toast-uri). */
  unlockedAchievements: string[];
  /** Niveluri câștigate ca urmare a recompenselor de achievement. */
  levelsGained: number;
}

/**
 * Punctul unic prin care trece ORICE profil nou:
 *  1. evaluează achievements și le acordă recompensele,
 *  2. programează salvarea debounced,
 *  3. întoarce profilul final + ce s-a deblocat.
 */
export async function commitProfile(
  profile: PlayerProfile,
): Promise<CommitOutcome> {
  const newlyUnlocked = checkAchievements(profile);

  if (newlyUnlocked.length === 0) {
    scheduleSave(profile);
    return { profile, unlockedAchievements: [], levelsGained: 0 };
  }

  const levelBefore = profile.level;
  const result = await unlockAchievements(profile, newlyUnlocked);
  scheduleSave(result.profile);

  return {
    profile: result.profile,
    unlockedAchievements: result.unlocked,
    levelsGained: result.profile.level - levelBefore,
  };
}
