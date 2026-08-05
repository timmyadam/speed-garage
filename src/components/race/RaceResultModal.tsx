"use client";

import type { ReactElement } from "react";
import { GiftIcon } from "@phosphor-icons/react/dist/ssr";
import {
  Button,
  Modal,
  RarityBadge,
  formatCoins,
  normalizeRarity,
} from "@/components/common";
import { LinkButton } from "@/components/dashboard/LinkButton";
import { formatSeconds } from "@/components/garage/carLabels";
import type { Car } from "@/types/car";
import type { RaceResult } from "@/types/race";

export interface RaceResultModalProps {
  open: boolean;
  result: RaceResult | null;
  opponentCar: Car | null;
  droppedCar: Car | null;
  onRematch: () => void;
  onClose: () => void;
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "win" | "lose" | "gold";
}): ReactElement {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2 last:border-b-0">
      <dt className="text-sm text-fg-3">{label}</dt>
      <dd
        className={`font-display text-base font-bold tnum ${
          tone === "win"
            ? "text-win"
            : tone === "lose"
              ? "text-lose"
              : tone === "gold"
                ? "text-legendary"
                : "text-fg"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

export function RaceResultModal({
  open,
  result,
  opponentCar,
  droppedCar,
  onRematch,
  onClose,
}: RaceResultModalProps): ReactElement | null {
  if (result === null) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      hideCloseButton
      closeOnBackdrop={false}
      tone={result.won ? "win" : "lose"}
      title={result.won ? "Victorie" : "Înfrângere"}
      description={
        opponentCar === null
          ? undefined
          : `400 m contra ${opponentCar.brand} ${opponentCar.name}`
      }
      footer={
        <>
          <LinkButton href="/garage" variant="ghost">
            Înapoi în garaj
          </LinkButton>
          <Button variant="primary" onClick={onRematch}>
            Încă o cursă
          </Button>
        </>
      }
    >
      <p className="font-display text-5xl font-bold leading-none text-fg tnum">
        {formatSeconds(result.playerTime)}
      </p>
      <p className="mt-1 text-sm text-fg-3">
        Adversar {formatSeconds(result.opponentTime)} ·{" "}
        {result.marginSeconds >= 0 ? "avans" : "rămas în urmă"}{" "}
        {formatSeconds(Math.abs(result.marginSeconds))}
      </p>

      <dl className="mt-4">
        <Row
          label="Viteză la sosire"
          value={`${result.playerTrapSpeedKmh} km/h`}
        />
        <Row
          label="Shift-uri perfecte"
          value={`${result.perfectShifts} / ${result.totalShifts}`}
          tone={
            result.totalShifts > 0 &&
            result.perfectShifts === result.totalShifts
              ? "win"
              : undefined
          }
        />
        <Row
          label="Timp de reacție"
          value={formatSeconds(result.reactionTime)}
        />
        <Row
          label="Monede"
          value={`+${formatCoins(result.coinsEarned)}`}
          tone="gold"
        />
        <Row label="XP" value={`+${formatCoins(result.xpEarned)}`} tone="win" />
      </dl>

      {droppedCar !== null ? (
        <div className="mt-4 flex items-center gap-3 rounded-md border border-legendary/35 bg-legendary-wash p-3">
          <GiftIcon
            weight="duotone"
            className="size-6 shrink-0 text-legendary"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-legendary">
              Mașină primită
            </p>
            <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm font-semibold text-fg">
              {droppedCar.brand} {droppedCar.name}
              <RarityBadge
                rarity={normalizeRarity(droppedCar.rarity)}
                size="sm"
              />
            </p>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

export default RaceResultModal;
