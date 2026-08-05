/**
 * Slice-ul de joc: înregistrarea rezultatelor din cursă, duel și quiz.
 *
 * Fluxul e identic pentru toate trei:
 *   actualizează contorii -> adaugă în istoric -> aplică monede/XP ->
 *   (opțional) acordă dropul -> commit (achievements + salvare debounced).
 */

import { MAX_HISTORY_ENTRIES } from "@/lib/profile";
import { grantCar as grantCarService } from "@/services/carService";
import { addCoins, addXp } from "@/services/playerService";
import type { PlayerProfile } from "@/types/player";
import { commitProfile } from "./persist";
import type { GameSlice, SliceCreator } from "./types";

/** Aplică recompensele unui mod de joc peste profil. */
async function applyRewards(
  profile: PlayerProfile,
  coins: number,
  xp: number,
): Promise<PlayerProfile> {
  const withCoins = await addCoins(profile, coins);
  const { profile: withXp } = await addXp(withCoins, xp);
  return withXp;
}

export const createGameSlice: SliceCreator<GameSlice> = (set, get) => ({
  lastRaceResult: null,
  lastDuelResult: null,
  lastQuizResult: null,

  recordRaceResult: async (result) => {
    const profile = get().profile;
    const levelBefore = profile.level;

    const previousBest = profile.stats.bestQuarterMile;
    const isNewBest =
      previousBest === null || result.playerTime < previousBest;

    let next: PlayerProfile = {
      ...profile,
      stats: {
        ...profile.stats,
        racesPlayed: profile.stats.racesPlayed + 1,
        racesWon: profile.stats.racesWon + (result.won ? 1 : 0),
        perfectShifts: profile.stats.perfectShifts + result.perfectShifts,
        bestQuarterMile: isNewBest ? result.playerTime : previousBest,
      },
      ownedCars: profile.ownedCars.map((owned) => {
        if (owned.carId !== result.playerCarId) return owned;
        const carBest = owned.bestQuarterMile;
        return {
          ...owned,
          racesTotal: owned.racesTotal + 1,
          racesWon: owned.racesWon + (result.won ? 1 : 0),
          bestQuarterMile:
            carBest === null || result.playerTime < carBest
              ? result.playerTime
              : carBest,
        };
      }),
      raceHistory: [result, ...profile.raceHistory].slice(
        0,
        MAX_HISTORY_ENTRIES,
      ),
      updatedAt: Date.now(),
    };

    next = await applyRewards(next, result.coinsEarned, result.xpEarned);

    // Dropul de mașină rară, dacă a picat unul.
    if (result.droppedCarId !== null) {
      const granted = await grantCarService(next, result.droppedCarId, "drop");
      if (granted.ok) next = granted.data;
    }

    const outcome = await commitProfile(next);
    set({
      profile: outcome.profile,
      lastRaceResult: result,
      lastLevelUp:
        outcome.profile.level > levelBefore
          ? outcome.profile.level
          : get().lastLevelUp,
      pendingAchievements: [
        ...get().pendingAchievements,
        ...outcome.unlockedAchievements,
      ],
    });
  },

  recordDuelResult: async (result) => {
    const profile = get().profile;
    const levelBefore = profile.level;

    let next: PlayerProfile = {
      ...profile,
      stats: {
        ...profile.stats,
        duelsPlayed: profile.stats.duelsPlayed + 1,
        duelsWon: profile.stats.duelsWon + (result.won ? 1 : 0),
      },
      duelHistory: [result, ...profile.duelHistory].slice(
        0,
        MAX_HISTORY_ENTRIES,
      ),
      updatedAt: Date.now(),
    };

    next = await applyRewards(next, result.coinsEarned, result.xpEarned);

    const outcome = await commitProfile(next);
    set({
      profile: outcome.profile,
      lastDuelResult: result,
      lastLevelUp:
        outcome.profile.level > levelBefore
          ? outcome.profile.level
          : get().lastLevelUp,
      pendingAchievements: [
        ...get().pendingAchievements,
        ...outcome.unlockedAchievements,
      ],
    });
  },

  recordQuizResult: async (result) => {
    const profile = get().profile;
    const levelBefore = profile.level;

    let next: PlayerProfile = {
      ...profile,
      stats: {
        ...profile.stats,
        quizzesPlayed: profile.stats.quizzesPlayed + 1,
        quizQuestionsAnswered:
          profile.stats.quizQuestionsAnswered + result.totalQuestions,
        quizCorrectAnswers:
          profile.stats.quizCorrectAnswers + result.correctAnswers,
        quizBestStreak: Math.max(
          profile.stats.quizBestStreak,
          result.bestStreak,
        ),
      },
      quizHistory: [result, ...profile.quizHistory].slice(
        0,
        MAX_HISTORY_ENTRIES,
      ),
      updatedAt: Date.now(),
    };

    next = await applyRewards(next, result.coinsEarned, result.xpEarned);

    const outcome = await commitProfile(next);
    set({
      profile: outcome.profile,
      lastQuizResult: result,
      lastLevelUp:
        outcome.profile.level > levelBefore
          ? outcome.profile.level
          : get().lastLevelUp,
      pendingAchievements: [
        ...get().pendingAchievements,
        ...outcome.unlockedAchievements,
      ],
    });
  },

  clearLastResults: () =>
    set({ lastRaceResult: null, lastDuelResult: null, lastQuizResult: null }),
});
