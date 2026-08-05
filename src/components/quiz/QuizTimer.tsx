"use client";

import type { ReactElement } from "react";
import { ProgressBar, type ProgressTone } from "@/components/common";

export interface QuizTimerProps {
  remainingMs: number;
  totalMs: number;
  /** Îngheață bara după ce s-a răspuns. */
  frozen?: boolean;
}

/**
 * Cronometrul întrebării. Tonul se schimbă la 5 s și la 2 s, deci presiunea
 * se vede periferic, fără să fie nevoie să citești cifra.
 */
export function QuizTimer({
  remainingMs,
  totalMs,
  frozen = false,
}: QuizTimerProps): ReactElement {
  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const tone: ProgressTone = frozen
    ? "neutral"
    : remainingMs <= 2000
      ? "lose"
      : remainingMs <= 5000
        ? "caution"
        : "accent";

  return (
    <ProgressBar
      value={Math.max(0, remainingMs)}
      max={totalMs}
      tone={tone}
      size="sm"
      label="Timp rămas"
      valueLabel={`${seconds} s`}
      ariaLabel="Timp rămas pentru întrebare"
    />
  );
}

export default QuizTimer;
