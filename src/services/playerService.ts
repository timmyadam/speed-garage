/**
 * Stratul de „API” pentru profilul jucătorului: încărcare, salvare,
 * economie (monede/XP) și clasament.
 * Ca și carService, toate mutațiile sunt imutabile și async.
 */

import { RIVALS } from "@/data/leaderboard.mock";
import { sumAchievementRewards } from "@/lib/achievements";
import { applyXp, getLevelProgress } from "@/lib/economy";
import { createNewProfile } from "@/lib/profile";
import type { LeaderboardEntry, LevelProgress, PlayerProfile } from "@/types/player";
import type { Rewards } from "@/types/race";
import { clearProfile, loadProfile, saveProfile } from "./storageService";

/** Rezultatul încărcării profilului la pornirea aplicației. */
export interface ProfileLoad {
  profile: PlayerProfile;
  /** true dacă nu exista nimic salvat și s-a creat un profil nou. */
  isNew: boolean;
  /** true dacă salvarea a fost adusă dintr-o versiune veche de schemă. */
  migrated: boolean;
  storageError: string | null;
}

/**
 * Citește profilul din localStorage; dacă nu există (sau e corupt),
 * creează unul nou cu mașinile de start.
 */
export async function getPlayerProfile(): Promise<ProfileLoad> {
  const result = await loadProfile();
  if (result.profile !== null) {
    return {
      profile: result.profile,
      isNew: false,
      migrated: result.migrated,
      storageError: result.error,
    };
  }
  return {
    profile: createNewProfile(),
    isNew: true,
    migrated: false,
    storageError: result.error,
  };
}

export async function savePlayerProfile(
  profile: PlayerProfile,
): Promise<boolean> {
  return saveProfile(profile);
}

/** Șterge salvarea și întoarce un profil nou-nouț. */
export async function resetPlayerProfile(): Promise<PlayerProfile> {
  await clearProfile();
  return createNewProfile();
}

/* ------------------------------------------------------------------ */
/* ECONOMIE                                                            */
/* ------------------------------------------------------------------ */

/** Adaugă monede și actualizează contorul de câștiguri totale. */
export async function addCoins(
  profile: PlayerProfile,
  amount: number,
): Promise<PlayerProfile> {
  const delta = Math.max(0, Math.round(amount));
  return {
    ...profile,
    coins: profile.coins + delta,
    stats: { ...profile.stats, coinsEarned: profile.stats.coinsEarned + delta },
    updatedAt: Date.now(),
  };
}

/** Scade monede (fără să treacă sub 0) și actualizează contorul de cheltuieli. */
export async function spendCoins(
  profile: PlayerProfile,
  amount: number,
): Promise<PlayerProfile> {
  const delta = Math.min(profile.coins, Math.max(0, Math.round(amount)));
  return {
    ...profile,
    coins: profile.coins - delta,
    stats: { ...profile.stats, coinsSpent: profile.stats.coinsSpent + delta },
    updatedAt: Date.now(),
  };
}

/** Adaugă XP și rezolvă level-up-urile. `levelsGained > 0` => toast în UI. */
export async function addXp(
  profile: PlayerProfile,
  amount: number,
): Promise<{ profile: PlayerProfile; progress: LevelProgress }> {
  const progress = applyXp(
    { level: profile.level, xp: profile.xp, totalXp: profile.totalXp },
    amount,
  );
  return {
    profile: {
      ...profile,
      level: progress.level,
      xp: progress.xp,
      totalXp: progress.totalXp,
      updatedAt: Date.now(),
    },
    progress,
  };
}

/** Aplică monede + XP dintr-o singură recompensă (cursă, duel, quiz). */
export async function applyRewards(
  profile: PlayerProfile,
  rewards: Rewards,
): Promise<{ profile: PlayerProfile; progress: LevelProgress }> {
  const withCoins = await addCoins(profile, rewards.coins);
  return addXp(withCoins, rewards.xp);
}

/**
 * Marchează achievements ca deblocate și acordă recompensele lor.
 * Id-urile deja deblocate sunt ignorate, deci apelul e idempotent.
 */
export async function unlockAchievements(
  profile: PlayerProfile,
  ids: readonly string[],
): Promise<{
  profile: PlayerProfile;
  rewards: Rewards;
  progress: LevelProgress;
  unlocked: string[];
}> {
  const already = new Set(profile.achievements.map((a) => a.id));
  const fresh = ids.filter((id) => !already.has(id));

  if (fresh.length === 0) {
    return {
      profile,
      rewards: { coins: 0, xp: 0 },
      progress: getLevelProgress(profile),
      unlocked: [],
    };
  }

  const now = Date.now();
  const withAchievements: PlayerProfile = {
    ...profile,
    achievements: [
      ...profile.achievements,
      ...fresh.map((id) => ({ id, unlockedAt: now })),
    ],
  };

  const rewards = sumAchievementRewards(fresh);
  const applied = await applyRewards(withAchievements, rewards);

  return {
    profile: applied.profile,
    rewards,
    progress: applied.progress,
    unlocked: fresh,
  };
}

/* ------------------------------------------------------------------ */
/* CLASAMENT ȘI REZUMAT                                                */
/* ------------------------------------------------------------------ */

/** Clasamentul: rivalii mock + jucătorul, sortat descrescător după XP total. */
export async function getLeaderboard(
  profile: PlayerProfile,
): Promise<LeaderboardEntry[]> {
  const playerEntry: LeaderboardEntry = {
    id: profile.id,
    name: profile.name,
    level: profile.level,
    totalXp: profile.totalXp,
    racesWon: profile.stats.racesWon,
    favoriteCarId: profile.selectedCarId ?? "civic-ek9",
    isPlayer: true,
  };
  return [...RIVALS, playerEntry].sort((a, b) => b.totalXp - a.totalXp);
}

/** Datele agregate pentru dashboard-ul de pe pagina principală. */
export interface ProfileSummary {
  level: number;
  xp: number;
  xpToNextLevel: number;
  levelProgress: number;
  coins: number;
  carsOwned: number;
  achievementsUnlocked: number;
  winRate: number;
  bestQuarterMile: number | null;
}

export async function getProfileSummary(
  profile: PlayerProfile,
): Promise<ProfileSummary> {
  const progress = getLevelProgress(profile);
  const played = profile.stats.racesPlayed;
  return {
    level: progress.level,
    xp: progress.xp,
    xpToNextLevel: progress.xpToNextLevel,
    levelProgress: progress.progress,
    coins: profile.coins,
    carsOwned: profile.ownedCars.length,
    achievementsUnlocked: profile.achievements.length,
    winRate: played > 0 ? profile.stats.racesWon / played : 0,
    bestQuarterMile: profile.stats.bestQuarterMile,
  };
}

/** Renunțare la nume implicit: permite jucătorului să-și schimbe numele. */
export async function renamePlayer(
  profile: PlayerProfile,
  name: string,
): Promise<PlayerProfile> {
  const trimmed = name.trim().slice(0, 24);
  return {
    ...profile,
    name: trimmed.length > 0 ? trimmed : profile.name,
    updatedAt: Date.now(),
  };
}
