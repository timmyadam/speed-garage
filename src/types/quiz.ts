/** Modele de date pentru modul Quiz Auto. */

export type QuizDifficulty = "easy" | "medium" | "hard";

export type QuizCategory =
  | "brands"
  | "specs"
  | "history"
  | "motorsport"
  | "technology";

export interface QuizQuestion {
  id: string;
  question: string;
  /** Exact 4 opțiuni în toate întrebările mock. */
  options: string[];
  /** Index în `options` al răspunsului corect. */
  correctIndex: number;
  difficulty: QuizDifficulty;
  category: QuizCategory;
  /** Explicație scurtă afișată după răspuns. */
  explanation: string;
}

/** Răspunsul dat de jucător la o întrebare. */
export interface QuizAnswer {
  questionId: string;
  /** null = timpul a expirat fără răspuns. */
  selectedIndex: number | null;
  isCorrect: boolean;
  /** Milisecunde consumate până la răspuns. */
  timeMs: number;
}

/** Rezultatul agregat al unei sesiuni de quiz. */
export interface QuizResult {
  id: string;
  playedAt: number;
  totalQuestions: number;
  correctAnswers: number;
  /** Cel mai lung șir de răspunsuri corecte consecutive. */
  bestStreak: number;
  /** Scor brut (înainte de conversia în monede). */
  score: number;
  coinsEarned: number;
  xpEarned: number;
  answers: QuizAnswer[];
}

/** Configurația unei sesiuni de quiz. */
export interface QuizSessionConfig {
  questionCount: number;
  /** Secunde per întrebare. */
  secondsPerQuestion: number;
  /** Dacă e setat, se extrag doar întrebări din dificultatea respectivă. */
  difficulty?: QuizDifficulty;
  category?: QuizCategory;
}
