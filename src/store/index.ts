/** Barrel pentru store. Componentele importă doar de aici. */

export {
  useGameStore,
  selectAchievements,
  selectCoins,
  selectGarageError,
  selectIsHydrated,
  selectLastLevelUp,
  selectLevel,
  selectOwnedCars,
  selectPendingAchievements,
  selectProfile,
  selectRaceHistory,
  selectSelectedCarId,
  selectSelectedOwnedCar,
  selectStats,
  selectXp,
} from "./useGameStore";

export type { GameSlice, GameStore, GarageSlice, PlayerSlice } from "./types";
export { SAVE_DEBOUNCE_MS, flushSave } from "./persist";
