"use client";

import type { ReactElement } from "react";
import { cn } from "@/components/common";
import type { DuelRound } from "@/types/race";

export interface DuelRoundIndicatorProps {
  rounds: readonly DuelRound[];
  /** Câte runde au fost dezvăluite până acum. */
  revealed: number;
  total: number;
}

const OUTCOME_CLASS = {
  win: "border-win bg-win text-bg",
  loss: "border-lose bg-lose text-bg",
  draw: "border-caution bg-caution text-bg",
} as const;

const OUTCOME_LABEL = {
  win: "câștigată",
  loss: "pierdută",
  draw: "egalitate",
} as const;

/** Cele 5 runde ca șir de pastile. Starea e și text, nu doar culoare. */
export function DuelRoundIndicator({
  rounds,
  revealed,
  total,
}: DuelRoundIndicatorProps): ReactElement {
  return (
    <ol className="flex items-center gap-2" aria-label="Runde">
      {Array.from({ length: total }, (_, index) => {
        const round = index < revealed ? rounds[index] : undefined;
        return (
          <li key={index}>
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-sm border font-display text-xs font-bold tnum",
                round === undefined
                  ? "border-line bg-track text-fg-disabled sg-hatch"
                  : OUTCOME_CLASS[round.outcome],
              )}
            >
              {index + 1}
              <span className="sr-only">
                {round === undefined
                  ? `Runda ${index + 1}, nedezvăluită`
                  : `Runda ${index + 1}, ${OUTCOME_LABEL[round.outcome]}`}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default DuelRoundIndicator;
