"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import {
  CheckCircleIcon,
  EqualsIcon,
  GarageIcon,
  QuestionIcon,
  XCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
  Button,
  Card,
  EmptyState,
  RARITY_LABEL,
  RARITY_ORDER,
  RarityBadge,
  Skeleton,
  cn,
  formatCoins,
  normalizeRarity,
} from "@/components/common";
import { CarSilhouette } from "@/components/cars/CarSilhouette";
import { LinkButton } from "@/components/dashboard/LinkButton";
import { createCarIndex } from "@/components/garage/carIndex";
import { CATEGORY_LABEL } from "@/components/garage/carLabels";
import { HydrationGate } from "@/components/providers";
import { DUEL_ROUND_COUNT, DUEL_STAT_LABELS } from "@/lib/duelEngine";
import { runDuel } from "@/services/raceService";
import { selectProfile, useGameStore } from "@/store";
import type { Car } from "@/types/car";
import type { DuelResult, DuelRound, DuelStatKey } from "@/types/race";
import { DuelResultModal } from "./DuelResultModal";
import { DuelRoundIndicator } from "./DuelRoundIndicator";

type Phase = "select" | "duel" | "result";

/** Formatarea depinde de categorie: rating 0-100, monede sau etichetă de raritate. */
function formatStatValue(stat: DuelStatKey, value: number): string {
  if (stat === "price") return `${formatCoins(value)} monede`;
  if (stat === "rarity") {
    const rarity = RARITY_ORDER[Math.min(3, Math.max(0, Math.round(value) - 1))];
    return rarity === undefined ? String(value) : RARITY_LABEL[rarity];
  }
  return String(Math.round(value));
}

const OUTCOME_META = {
  win: { label: "Mai bun", className: "border-win bg-win-wash text-win" },
  loss: { label: "Mai slab", className: "border-lose bg-lose-wash text-lose" },
  draw: {
    label: "Egalitate",
    className: "border-caution bg-caution-wash text-caution",
  },
} as const;

function RoundCard({ round }: { round: DuelRound }): ReactElement {
  const OutcomeIcon =
    round.outcome === "win"
      ? CheckCircleIcon
      : round.outcome === "loss"
        ? XCircleIcon
        : EqualsIcon;
  const meta = OUTCOME_META[round.outcome];

  return (
    <li className="rounded-md border border-line bg-surface-2 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.06em] text-fg-2">
          Runda {round.index + 1} · {DUEL_STAT_LABELS[round.stat]}
        </p>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-sm border px-2 py-0.5 font-display text-[11px] font-semibold uppercase tracking-[0.08em]",
            meta.className,
          )}
        >
          <OutcomeIcon weight="fill" className="size-3.5" aria-hidden="true" />
          {meta.label}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <p
          className={cn(
            "font-display text-lg font-bold tnum",
            round.outcome === "win" ? "text-win" : "text-fg",
          )}
        >
          {formatStatValue(round.stat, round.playerValue)}
        </p>
        <span className="font-display text-xs font-semibold uppercase text-fg-disabled">
          vs
        </span>
        <p
          className={cn(
            "text-right font-display text-lg font-bold tnum",
            round.outcome === "loss" ? "text-lose" : "text-fg",
          )}
        >
          {formatStatValue(round.stat, round.opponentValue)}
        </p>
      </div>
    </li>
  );
}

function DuelBody({ cars }: { cars: readonly Car[] }): ReactElement {
  const profile = useGameStore(selectProfile);
  const index = useMemo(() => createCarIndex(cars), [cars]);

  const [phase, setPhase] = useState<Phase>("select");
  const [playerCarId, setPlayerCarId] = useState<string | null>(
    profile.selectedCarId,
  );
  const [duel, setDuel] = useState<DuelResult | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recordedRef = useRef<string | null>(null);

  const ownedCars = profile.ownedCars
    .map((owned) => ({ owned, car: index.get(owned.carId) ?? null }))
    .filter(
      (entry): entry is { owned: (typeof profile.ownedCars)[number]; car: Car } =>
        entry.car !== null,
    );

  const playerCar =
    playerCarId === null ? null : (index.get(playerCarId) ?? null);
  const opponentCar =
    duel === null ? null : (index.get(duel.opponentCarId) ?? null);

  const startDuel = useCallback(async () => {
    if (playerCarId === null) return;
    setIsStarting(true);
    setError(null);
    try {
      const result = await runDuel({ profile, playerCarId });
      setDuel(result);
      setRevealed(0);
      recordedRef.current = null;
      setPhase("duel");
    } catch {
      setError("Duelul nu a putut fi pornit. Alege altă mașină din garaj.");
    } finally {
      setIsStarting(false);
    }
  }, [playerCarId, profile]);

  const revealNext = useCallback(async () => {
    if (duel === null) return;
    const next = revealed + 1;
    setRevealed(next);
    if (next >= duel.rounds.length && recordedRef.current !== duel.id) {
      recordedRef.current = duel.id;
      // Rezultatul e deja calculat; store-ul îl aplică o singură dată.
      await useGameStore.getState().recordDuelResult(duel);
      setPhase("result");
    }
  }, [duel, revealed]);

  const restart = useCallback(() => {
    setDuel(null);
    setRevealed(0);
    setPhase("select");
  }, []);

  if (ownedCars.length === 0) {
    return (
      <EmptyState
        icon={<GarageIcon weight="duotone" className="size-7" />}
        title="Garajul e gol"
        description="Ai nevoie de cel puțin o mașină ca să intri într-un duel de statistici."
        action={
          <LinkButton href="/garage" variant="primary">
            Deschide garajul
          </LinkButton>
        }
      />
    );
  }

  const revealedRounds = duel?.rounds.slice(0, revealed) ?? [];
  const score = revealedRounds.reduce(
    (acc, round) => ({
      won: acc.won + (round.outcome === "win" ? 1 : 0),
      lost: acc.lost + (round.outcome === "loss" ? 1 : 0),
    }),
    { won: 0, lost: 0 },
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">Duel de statistici</h1>
          <p className="mt-1 text-sm text-fg-3">
            {DUEL_ROUND_COUNT} categorii comparate. Cine ia mai multe, câștigă.
          </p>
        </div>
        {phase !== "select" && duel !== null ? (
          <div className="flex items-center gap-3">
            <DuelRoundIndicator
              rounds={duel.rounds}
              revealed={revealed}
              total={duel.rounds.length}
            />
            <p className="font-display text-lg font-bold text-fg tnum">
              {score.won}–{score.lost}
            </p>
          </div>
        ) : null}
      </header>

      {error !== null ? (
        <Card padding="sm" className="border-lose/40">
          <p className="text-sm text-lose">{error}</p>
        </Card>
      ) : null}

      {phase === "select" ? (
        <>
          <section>
            <h2 className="mb-3 text-xl">Alege mașina</h2>
            <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {ownedCars.map(({ owned, car }) => {
                const active = playerCarId === car.id;
                return (
                  <li key={car.id}>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => setPlayerCarId(car.id)}
                      className={cn(
                        "flex w-full flex-col rounded-lg border p-3 text-left transition-colors duration-150 ease-out-quick",
                        active
                          ? "border-accent bg-accent-wash"
                          : "border-line bg-surface hover:border-line-strong hover:bg-surface-2",
                      )}
                    >
                      <CarSilhouette
                        accentColor={car.accentColor}
                        rarity={normalizeRarity(car.rarity)}
                        alt={`${car.brand} ${car.name}`}
                        className="mb-2 rounded-md bg-bg px-2 py-3"
                      />
                      <span className="truncate font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-fg-3">
                        {car.brand}
                      </span>
                      <span className="truncate text-sm font-bold text-fg">
                        {car.name}
                      </span>
                      <span className="mt-1 flex items-center gap-2">
                        <RarityBadge
                          rarity={normalizeRarity(car.rarity)}
                          size="sm"
                        />
                        <span className="text-[11px] text-fg-disabled">
                          {owned.upgrades.engine +
                            owned.upgrades.turbo +
                            owned.upgrades.tires +
                            owned.upgrades.weight}{" "}
                          upgrade-uri
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={playerCarId === null}
            loading={isStarting}
            loadingLabel="Se caută adversar…"
            onClick={() => void startDuel()}
          >
            Începe duelul
          </Button>
        </>
      ) : null}

      {phase !== "select" && duel !== null && playerCar !== null ? (
        <>
          <section className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <Card padding="sm" as="article">
              <CarSilhouette
                accentColor={playerCar.accentColor}
                rarity={normalizeRarity(playerCar.rarity)}
                alt={`${playerCar.brand} ${playerCar.name}`}
                className="mb-2 rounded-md bg-bg px-2 py-3"
              />
              <p className="truncate text-sm font-bold text-fg">
                {playerCar.name}
              </p>
              <p className="truncate text-xs text-fg-3">
                {CATEGORY_LABEL[playerCar.category]}
              </p>
            </Card>

            <span className="font-display text-lg font-bold uppercase text-fg-disabled">
              vs
            </span>

            <Card padding="sm" as="article">
              {revealed === 0 || opponentCar === null ? (
                <div className="flex h-full min-h-32 flex-col items-center justify-center gap-2 rounded-md bg-bg py-6 sg-hatch">
                  <QuestionIcon
                    weight="duotone"
                    className="size-8 text-fg-disabled"
                    aria-hidden="true"
                  />
                  <p className="text-xs text-fg-3">Adversar necunoscut</p>
                </div>
              ) : (
                <>
                  <CarSilhouette
                    accentColor={opponentCar.accentColor}
                    rarity={normalizeRarity(opponentCar.rarity)}
                    alt={`${opponentCar.brand} ${opponentCar.name}`}
                    className="mb-2 rounded-md bg-bg px-2 py-3"
                  />
                  <p className="truncate text-sm font-bold text-fg">
                    {opponentCar.name}
                  </p>
                  <p className="truncate text-xs text-fg-3">
                    {CATEGORY_LABEL[opponentCar.category]}
                  </p>
                </>
              )}
            </Card>
          </section>

          <ul className="flex flex-col gap-2" aria-live="polite">
            {revealedRounds.map((round) => (
              <RoundCard key={round.index} round={round} />
            ))}
          </ul>

          {revealed < duel.rounds.length ? (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => void revealNext()}
            >
              {revealed === 0
                ? "Dezvăluie prima categorie"
                : `Runda ${revealed + 1} din ${duel.rounds.length}`}
            </Button>
          ) : null}
        </>
      ) : null}

      <DuelResultModal
        open={phase === "result" && duel !== null}
        result={duel}
        opponentCar={opponentCar}
        onAgain={restart}
        onClose={restart}
      />
    </div>
  );
}

export function DuelClient({ cars }: { cars: readonly Car[] }): ReactElement {
  return (
    <HydrationGate
      fallback={
        <div className="flex flex-col gap-6">
          <Skeleton height={64} />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} height={180} />
            ))}
          </div>
        </div>
      }
    >
      <DuelBody cars={cars} />
    </HydrationGate>
  );
}

export default DuelClient;
