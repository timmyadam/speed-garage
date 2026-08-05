"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { FireIcon } from "@phosphor-icons/react/dist/ssr";
import { Button, Card, Skeleton, cn } from "@/components/common";
import { HydrationGate } from "@/components/providers";
import {
  DEFAULT_QUIZ_CONFIG,
  checkAnswer,
  getRandomQuestions,
  getStreakMultiplier,
  gradeQuiz,
} from "@/services/quizService";
import { selectProfile, useGameStore } from "@/store";
import type { QuizAnswer, QuizQuestion, QuizResult } from "@/types/quiz";
import { QuizQuestionCard } from "./QuizQuestionCard";
import { QuizResultScreen } from "./QuizResultScreen";
import { QuizTimer } from "./QuizTimer";

type Phase = "intro" | "playing" | "done";

const QUESTION_MS = DEFAULT_QUIZ_CONFIG.secondsPerQuestion * 1000;
const TICK_MS = 100;

function QuizBody(): ReactElement {
  const profile = useGameStore(selectProfile);

  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [remainingMs, setRemainingMs] = useState(QUESTION_MS);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  const questionStartRef = useRef<number>(0);
  const revealedRef = useRef(false);

  const streak = (() => {
    let count = 0;
    for (let i = answers.length - 1; i >= 0; i--) {
      const answer = answers[i];
      if (answer === undefined || !answer.isCorrect) break;
      count += 1;
    }
    return count;
  })();

  const question = questions[current];

  const settleAnswer = useCallback(
    async (index: number | null) => {
      if (revealedRef.current || question === undefined) return;
      revealedRef.current = true;
      setRevealed(true);
      setSelected(index);

      const isCorrect =
        index === null ? false : await checkAnswer(question.id, index);
      setAnswers((current_) => [
        ...current_,
        {
          questionId: question.id,
          selectedIndex: index,
          isCorrect,
          timeMs: Math.round(performance.now() - questionStartRef.current),
        },
      ]);
    },
    [question],
  );

  /**
   * Cronometrul: un singur interval per întrebare, oprit la răspuns.
   * Efectul nu setează state sincron — doar marchează momentul de start
   * (ref) și pornește intervalul; resetarea afișajului o fac acțiunile
   * care schimbă întrebarea.
   */
  useEffect(() => {
    if (phase !== "playing" || revealed || question === undefined) return;
    questionStartRef.current = performance.now();
    revealedRef.current = false;

    const timer = window.setInterval(() => {
      const elapsed = performance.now() - questionStartRef.current;
      const left = QUESTION_MS - elapsed;
      setRemainingMs(left);
      if (left <= 0) {
        window.clearInterval(timer);
        void settleAnswer(null);
      }
    }, TICK_MS);

    return () => window.clearInterval(timer);
    // `revealed` intră în dependențe ca intervalul să se oprească la răspuns.
  }, [phase, current, revealed, question, settleAnswer]);

  const startQuiz = useCallback(async () => {
    setIsLoading(true);
    const fresh = await getRandomQuestions();
    setQuestions(fresh);
    setAnswers([]);
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
    revealedRef.current = false;
    setResult(null);
    setRemainingMs(QUESTION_MS);
    setIsLoading(false);
    setPhase("playing");
  }, []);

  const goNext = useCallback(async () => {
    if (current + 1 < questions.length) {
      setCurrent((value) => value + 1);
      setSelected(null);
      setRevealed(false);
      setRemainingMs(QUESTION_MS);
      revealedRef.current = false;
      return;
    }

    setIsLoading(true);
    const graded = await gradeQuiz(answers, profile.level);
    // Serviciul doar notează; store-ul aplică monedele, XP-ul și achievements.
    await useGameStore.getState().recordQuizResult(graded);
    setResult(graded);
    setIsLoading(false);
    setPhase("done");
  }, [current, questions.length, answers, profile.level]);

  if (phase === "intro") {
    return (
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-3xl">Quiz Auto</h1>
          <p className="mt-1 text-sm text-fg-3">
            {DEFAULT_QUIZ_CONFIG.questionCount} întrebări ·{" "}
            {DEFAULT_QUIZ_CONFIG.secondsPerQuestion} secunde fiecare. Răspunsurile
            corecte consecutive cresc multiplicatorul.
          </p>
        </header>

        <Card padding="lg" as="section">
          <h2 className="text-xl">Cum se punctează</h2>
          <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-sm text-fg-2">
            <li>Fiecare răspuns corect aduce monede și XP.</li>
            <li>
              Streak de 3 → ×1,5, de 5 → ×2, de 8 → ×3 la scorul afișat.
            </li>
            <li>Timpul expirat contează ca răspuns greșit.</li>
            <li>Sesiunea perfectă are bonus separat.</li>
          </ul>
          <div className="mt-6">
            <Button
              variant="primary"
              size="lg"
              loading={isLoading}
              loadingLabel="Se pregătesc întrebările…"
              onClick={() => void startQuiz()}
            >
              Începe quiz-ul
            </Button>
          </div>
        </Card>

        {profile.quizHistory.length > 0 ? (
          <Card title="Sesiuni anterioare" as="section">
            <ul className="flex flex-col divide-y divide-line">
              {profile.quizHistory.slice(0, 5).map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <span className="font-display text-sm font-semibold text-fg tnum">
                    {entry.correctAnswers}/{entry.totalQuestions}
                  </span>
                  <span className="flex-1 text-xs text-fg-3">
                    streak maxim {entry.bestStreak}
                  </span>
                  <span className="font-display text-xs font-semibold text-legendary tnum">
                    +{entry.coinsEarned}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>
    );
  }

  if (phase === "done" && result !== null) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl">Rezultat quiz</h1>
        <QuizResultScreen result={result} onRestart={() => void startQuiz()} />
      </div>
    );
  }

  if (question === undefined) {
    return <Skeleton height={320} />;
  }

  const multiplier = getStreakMultiplier(streak);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl">
          Întrebarea {current + 1}
          <span className="text-fg-3"> / {questions.length}</span>
        </h1>
        <p
          className={cn(
            "inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 font-display text-sm font-semibold tnum",
            streak >= 3
              ? "border-accent-line bg-accent-wash text-accent"
              : "border-line bg-surface-2 text-fg-3",
          )}
          aria-label={`Streak ${streak}, multiplicator ${multiplier}`}
        >
          <FireIcon weight="fill" className="size-4" aria-hidden="true" />
          Streak {streak} · ×{multiplier}
        </p>
      </header>

      <QuizTimer
        remainingMs={remainingMs}
        totalMs={QUESTION_MS}
        frozen={revealed}
      />

      <Card padding="lg" as="section">
        <QuizQuestionCard
          question={question}
          selectedIndex={selected}
          revealed={revealed}
          onSelect={(index) => void settleAnswer(index)}
        />
      </Card>

      {revealed ? (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          loadingLabel="Se calculează scorul…"
          onClick={() => void goNext()}
        >
          {current + 1 < questions.length
            ? "Următoarea întrebare"
            : "Vezi rezultatul"}
        </Button>
      ) : null}
    </div>
  );
}

export function QuizClient(): ReactElement {
  return (
    <HydrationGate
      fallback={
        <div className="flex flex-col gap-6">
          <Skeleton height={64} />
          <Skeleton height={260} />
        </div>
      }
    >
      <QuizBody />
    </HydrationGate>
  );
}

export default QuizClient;
