"use client";

import type { ReactElement } from "react";
import { Button, Card, ProgressBar, formatCoins } from "@/components/common";
import { LinkButton } from "@/components/dashboard/LinkButton";
import type { QuizResult } from "@/types/quiz";

export interface QuizResultScreenProps {
  result: QuizResult;
  onRestart: () => void;
}

export function QuizResultScreen({
  result,
  onRestart,
}: QuizResultScreenProps): ReactElement {
  const ratio =
    result.totalQuestions > 0
      ? result.correctAnswers / result.totalQuestions
      : 0;
  const verdict =
    ratio === 1
      ? "Sesiune perfectă"
      : ratio >= 0.7
        ? "Sesiune bună"
        : ratio >= 0.4
          ? "Se poate mai bine"
          : "Mai exersează";

  return (
    <Card padding="lg" chamfer as="section">
      <p className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
        {verdict}
      </p>
      <p className="mt-1 font-display text-5xl font-bold leading-none text-fg tnum">
        {result.correctAnswers}
        <span className="text-2xl text-fg-3">/{result.totalQuestions}</span>
      </p>

      <div className="mt-4">
        <ProgressBar
          value={result.correctAnswers}
          max={result.totalQuestions}
          tone={ratio >= 0.7 ? "win" : ratio >= 0.4 ? "caution" : "lose"}
          label="Răspunsuri corecte"
          valueLabel={`${Math.round(ratio * 100)}%`}
        />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-fg-3">Cel mai lung streak</dt>
          <dd className="font-display text-xl font-bold text-fg tnum">
            {result.bestStreak}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-fg-3">Scor</dt>
          <dd className="font-display text-xl font-bold text-fg tnum">
            {formatCoins(result.score)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-fg-3">Monede</dt>
          <dd className="font-display text-xl font-bold text-legendary tnum">
            +{formatCoins(result.coinsEarned)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-fg-3">XP</dt>
          <dd className="font-display text-xl font-bold text-win tnum">
            +{formatCoins(result.xpEarned)}
          </dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="primary" size="lg" onClick={onRestart}>
          Încă o rundă
        </Button>
        <LinkButton href="/" variant="ghost" size="lg">
          Înapoi acasă
        </LinkButton>
      </div>
    </Card>
  );
}

export default QuizResultScreen;
