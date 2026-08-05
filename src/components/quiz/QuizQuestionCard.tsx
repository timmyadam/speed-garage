"use client";

import type { ReactElement } from "react";
import { CheckCircleIcon, XCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/components/common";
import type { QuizQuestion } from "@/types/quiz";

export interface QuizQuestionCardProps {
  question: QuizQuestion;
  /** Indexul ales de jucător; null = încă n-a răspuns sau a expirat timpul. */
  selectedIndex: number | null;
  revealed: boolean;
  onSelect: (index: number) => void;
}

const LETTERS = ["A", "B", "C", "D", "E", "F"] as const;

/**
 * Întrebarea + cele 4 opțiuni. După răspuns, corectul și greșitul au ȘI
 * iconiță, nu doar culoare — se disting și fără percepția culorilor.
 */
export function QuizQuestionCard({
  question,
  selectedIndex,
  revealed,
  onSelect,
}: QuizQuestionCardProps): ReactElement {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl text-fg">{question.question}</h2>

      <ul className="flex flex-col gap-2">
        {question.options.map((option, index) => {
          const isCorrect = index === question.correctIndex;
          const isChosen = index === selectedIndex;

          const state = !revealed
            ? isChosen
              ? "chosen"
              : "idle"
            : isCorrect
              ? "correct"
              : isChosen
                ? "wrong"
                : "idle";

          return (
            <li key={option}>
              <button
                type="button"
                disabled={revealed}
                aria-pressed={isChosen}
                onClick={() => onSelect(index)}
                className={cn(
                  "flex min-h-14 w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors duration-150 ease-out-quick",
                  state === "correct" &&
                    "border-win bg-win-wash text-fg",
                  state === "wrong" && "border-lose bg-lose-wash text-fg",
                  state === "chosen" && "border-accent bg-accent-wash text-fg",
                  state === "idle" &&
                    "border-line bg-surface text-fg-2 hover:border-line-strong hover:bg-surface-2 hover:text-fg",
                  revealed && "cursor-default",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-sm border font-display text-sm font-bold",
                    state === "correct"
                      ? "border-win/40 text-win"
                      : state === "wrong"
                        ? "border-lose/40 text-lose"
                        : "border-line-strong text-fg-3",
                  )}
                >
                  {LETTERS[index] ?? index + 1}
                </span>
                <span className="min-w-0 flex-1">{option}</span>
                {revealed && isCorrect ? (
                  <CheckCircleIcon
                    weight="fill"
                    className="size-5 shrink-0 text-win"
                    aria-label="Răspuns corect"
                  />
                ) : null}
                {revealed && isChosen && !isCorrect ? (
                  <XCircleIcon
                    weight="fill"
                    className="size-5 shrink-0 text-lose"
                    aria-label="Răspuns greșit"
                  />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>

      {revealed ? (
        <p
          className="rounded-md border border-line bg-surface-2 p-3 text-sm text-fg-2"
          aria-live="polite"
        >
          {selectedIndex === null
            ? "Timpul a expirat. "
            : selectedIndex === question.correctIndex
              ? "Corect. "
              : "Greșit. "}
          {question.explanation}
        </p>
      ) : null}
    </div>
  );
}

export default QuizQuestionCard;
