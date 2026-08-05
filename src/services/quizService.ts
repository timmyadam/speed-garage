/**
 * Stratul de „API” pentru modul Quiz Auto.
 * Extrage întrebări (opțional filtrate), amestecă ordinea și notează sesiunea.
 */

import { QUIZ_INDEX, QUIZ_QUESTIONS } from "@/data/quiz.mock";
import { computeQuizRewards, computeQuizScore, createRng } from "@/lib/economy";
import { createId } from "@/lib/profile";
import type {
  QuizAnswer,
  QuizQuestion,
  QuizResult,
  QuizSessionConfig,
} from "@/types/quiz";

/** Configurația implicită: 10 întrebări, 15 secunde fiecare. */
export const DEFAULT_QUIZ_CONFIG: QuizSessionConfig = {
  questionCount: 10,
  secondsPerQuestion: 15,
};

/** Multiplicatorul de streak afișat în UI (informativ, nu intră în formulă). */
export function getStreakMultiplier(streak: number): number {
  if (streak >= 8) return 3;
  if (streak >= 5) return 2;
  if (streak >= 3) return 1.5;
  return 1;
}

function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = copy[i];
    const b = copy[j];
    if (a === undefined || b === undefined) continue;
    copy[i] = b;
    copy[j] = a;
  }
  return copy;
}

/**
 * Întrebări aleatorii pentru o sesiune.
 * Dacă filtrele lasă prea puține întrebări, completăm din restul băncii,
 * ca sesiunea să aibă întotdeauna numărul cerut.
 */
export async function getRandomQuestions(
  config: Partial<QuizSessionConfig> = {},
  seed?: number,
): Promise<QuizQuestion[]> {
  const merged = { ...DEFAULT_QUIZ_CONFIG, ...config };
  const rng = createRng(seed ?? Math.floor(Math.random() * 2 ** 31));

  const matches = QUIZ_QUESTIONS.filter(
    (q) =>
      (merged.difficulty === undefined || q.difficulty === merged.difficulty) &&
      (merged.category === undefined || q.category === merged.category),
  );

  const primary = shuffle(matches, rng);
  if (primary.length >= merged.questionCount) {
    return primary.slice(0, merged.questionCount);
  }

  const usedIds = new Set(primary.map((q) => q.id));
  const filler = shuffle(
    QUIZ_QUESTIONS.filter((q) => !usedIds.has(q.id)),
    rng,
  );
  return [...primary, ...filler].slice(0, merged.questionCount);
}

export async function getQuestionById(
  id: string,
): Promise<QuizQuestion | null> {
  return QUIZ_INDEX.get(id) ?? null;
}

export async function getQuestionCount(): Promise<number> {
  return QUIZ_QUESTIONS.length;
}

/** Verifică un singur răspuns (folosit live, după fiecare apăsare). */
export async function checkAnswer(
  questionId: string,
  selectedIndex: number | null,
): Promise<boolean> {
  const question = QUIZ_INDEX.get(questionId);
  if (question === undefined || selectedIndex === null) return false;
  return question.correctIndex === selectedIndex;
}

/**
 * Notează sesiunea completă: numără corectele, calculează cel mai lung streak
 * și transformă totul în monede/XP.
 */
export async function gradeQuiz(
  answers: readonly QuizAnswer[],
  playerLevel: number,
): Promise<QuizResult> {
  let correctAnswers = 0;
  let currentStreak = 0;
  let bestStreak = 0;

  for (const answer of answers) {
    if (answer.isCorrect) {
      correctAnswers += 1;
      currentStreak += 1;
      if (currentStreak > bestStreak) bestStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  }

  const rewards = computeQuizRewards({
    correctAnswers,
    totalQuestions: answers.length,
    bestStreak,
    playerLevel,
  });

  return {
    id: createId("quiz"),
    playedAt: Date.now(),
    totalQuestions: answers.length,
    correctAnswers,
    bestStreak,
    score: computeQuizScore(correctAnswers, bestStreak),
    coinsEarned: rewards.coins,
    xpEarned: rewards.xp,
    answers: [...answers],
  };
}
