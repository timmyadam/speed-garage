import type { Achievement } from "@/types/player";

/**
 * Cele 10 achievements — câte unul pentru fiecare tip de condiție din
 * `AchievementConditionType`, ca evaluatorul să acopere toate ramurile.
 * `icon` conține numele iconiței Phosphor; UI-ul face maparea la componentă.
 */
export const ACHIEVEMENTS: readonly Achievement[] = [
  {
    id: "first-win",
    name: "Prima victorie",
    description: "Câștigă prima ta cursă de drag.",
    icon: "FlagCheckered",
    condition: { type: "racesWon", threshold: 1 },
    reward: { coins: 200, xp: 50 },
    order: 1,
  },
  {
    id: "duelist",
    name: "Duelist",
    description: "Câștigă 15 dueluri de statistici.",
    icon: "Medal",
    condition: { type: "duelsWon", threshold: 15 },
    reward: { coins: 700, xp: 180 },
    order: 2,
  },
  {
    id: "collector",
    name: "Colecționar",
    description: "Adună 10 mașini în garaj.",
    icon: "Car",
    condition: { type: "carsOwned", threshold: 10 },
    reward: { coins: 1500, xp: 300 },
    order: 3,
  },
  {
    id: "quiz-king",
    name: "Rege Quiz",
    description: "Dă 10 răspunsuri corecte consecutive la Quiz Auto.",
    icon: "Brain",
    condition: { type: "quizStreak", threshold: 10 },
    reward: { coins: 800, xp: 200 },
    order: 4,
  },
  {
    id: "veteran",
    name: "Veteran al asfaltului",
    description: "Ajunge la nivelul 10 de jucător.",
    icon: "Star",
    condition: { type: "playerLevel", threshold: 10 },
    reward: { coins: 1200, xp: 0 },
    order: 5,
  },
  {
    id: "millionaire",
    name: "Bancă pe roți",
    description: "Câștigă în total 100.000 de monede.",
    icon: "Coins",
    condition: { type: "coinsEarned", threshold: 100000 },
    reward: { coins: 2500, xp: 500 },
    order: 6,
  },
  {
    id: "perfect-shifter",
    name: "Mâna de fier",
    description: "Execută 50 de schimbări de treaptă perfecte.",
    icon: "Gauge",
    condition: { type: "perfectShifts", threshold: 50 },
    reward: { coins: 1000, xp: 250 },
    order: 7,
  },
  {
    id: "head-mechanic",
    name: "Mecanic șef",
    description: "Cumpără 20 de upgrade-uri în garaj.",
    icon: "Wrench",
    condition: { type: "upgradesPurchased", threshold: 20 },
    reward: { coins: 900, xp: 220 },
    order: 8,
  },
  {
    id: "legend-owner",
    name: "Legendă în garaj",
    description: "Deține cel puțin o mașină Legendary.",
    icon: "Crown",
    condition: { type: "legendaryOwned", threshold: 1 },
    reward: { coins: 3000, xp: 600 },
    order: 9,
  },
  {
    id: "sub-ten",
    name: "Sub 10 secunde",
    description: "Termină cei 400 de metri în mai puțin de 10 secunde.",
    icon: "Lightning",
    condition: { type: "quarterMileUnder", threshold: 10 },
    reward: { coins: 1200, xp: 300 },
    order: 10,
  },
];

/** Index rapid id -> Achievement. */
export const ACHIEVEMENT_INDEX: ReadonlyMap<string, Achievement> = new Map(
  ACHIEVEMENTS.map((a) => [a.id, a] as const),
);
