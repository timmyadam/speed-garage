/** Barrel pentru toate tipurile publice ale jocului. */

export type {
  Car,
  CarCategory,
  CarRarity,
  CarStats,
  CarUpgrades,
  Drivetrain,
  EffectiveCarStats,
  UpgradeLevel,
  UpgradeOption,
  UpgradePart,
} from "./car";

export type {
  Achievement,
  AchievementCondition,
  AchievementConditionType,
  LeaderboardEntry,
  LevelProgress,
  OwnedCar,
  OwnedCarSource,
  PlayerProfile,
  PlayerStats,
  UnlockedAchievement,
} from "./player";

export type {
  QuizAnswer,
  QuizCategory,
  QuizDifficulty,
  QuizQuestion,
  QuizResult,
  QuizSessionConfig,
} from "./quiz";

export type {
  DuelResult,
  DuelRound,
  DuelRoundOutcome,
  DuelStatKey,
  GearWindow,
  RaceDifficulty,
  RaceInput,
  RaceResult,
  Rewards,
  ShiftEvent,
  ShiftQuality,
} from "./race";
