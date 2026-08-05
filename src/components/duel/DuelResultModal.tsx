"use client";

import type { ReactElement } from "react";
import { Button, Modal, formatCoins } from "@/components/common";
import { LinkButton } from "@/components/dashboard/LinkButton";
import type { Car } from "@/types/car";
import type { DuelResult } from "@/types/race";

export interface DuelResultModalProps {
  open: boolean;
  result: DuelResult | null;
  opponentCar: Car | null;
  onAgain: () => void;
  onClose: () => void;
}

export function DuelResultModal({
  open,
  result,
  opponentCar,
  onAgain,
  onClose,
}: DuelResultModalProps): ReactElement | null {
  if (result === null) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      hideCloseButton
      closeOnBackdrop={false}
      tone={result.won ? "win" : "lose"}
      title={result.won ? "Duel câștigat" : "Duel pierdut"}
      description={
        opponentCar === null
          ? undefined
          : `Contra ${opponentCar.brand} ${opponentCar.name}`
      }
      footer={
        <>
          <LinkButton href="/" variant="ghost">
            Înapoi acasă
          </LinkButton>
          <Button variant="primary" onClick={onAgain}>
            Încă un duel
          </Button>
        </>
      }
    >
      <p className="font-display text-5xl font-bold leading-none text-fg tnum">
        {result.roundsWon} – {result.roundsLost}
        {result.roundsDrawn > 0 ? (
          <span className="ml-2 text-2xl text-fg-3">
            ({result.roundsDrawn} egal)
          </span>
        ) : null}
      </p>
      <p className="mt-1 text-sm text-fg-3">
        {result.roundsWon} din {result.rounds.length} categorii câștigate
      </p>

      <dl className="mt-4">
        <div className="flex items-baseline justify-between gap-4 border-b border-line py-2">
          <dt className="text-sm text-fg-3">Monede</dt>
          <dd className="font-display text-base font-bold text-legendary tnum">
            +{formatCoins(result.coinsEarned)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 py-2">
          <dt className="text-sm text-fg-3">XP</dt>
          <dd className="font-display text-base font-bold text-win tnum">
            +{formatCoins(result.xpEarned)}
          </dd>
        </div>
      </dl>
    </Modal>
  );
}

export default DuelResultModal;
