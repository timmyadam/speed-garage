"use client";

import Link from "next/link";
import { useMemo, type ReactElement } from "react";
import {
  ArrowRightIcon,
  CardsIcon,
  FlagCheckeredIcon,
  GarageIcon,
  QuestionIcon,
  TimerIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import {
  Card,
  EmptyState,
  RarityBadge,
  Skeleton,
  StatBar,
  XpBar,
  formatCoins,
  normalizeRarity,
} from "@/components/common";
import { CarSilhouette } from "@/components/cars/CarSilhouette";
import { createCarIndex } from "@/components/garage/carIndex";
import {
  CATEGORY_LABEL,
  DRIVETRAIN_SHORT,
  formatNumber,
  formatSeconds,
} from "@/components/garage/carLabels";
import { HydrationGate } from "@/components/providers";
import { LinkButton } from "./LinkButton";
import { getEffectiveStats, getLevelProgress } from "@/lib/economy";
import { selectProfile, useGameStore } from "@/store";
import type { Car } from "@/types/car";

interface ModeLink {
  href: string;
  label: string;
  description: string;
  reward: string;
  icon: Icon;
}

const MODES: readonly ModeLink[] = [
  {
    href: "/race",
    label: "Cursă",
    description: "Drag race pe 400 m",
    reward: "180–1 500 monede",
    icon: FlagCheckeredIcon,
  },
  {
    href: "/duel",
    label: "Duel",
    description: "Top Trumps, 5 runde",
    reward: "120–600 monede",
    icon: CardsIcon,
  },
  {
    href: "/quiz",
    label: "Quiz",
    description: "10 întrebări contra cronometru",
    reward: "60–450 monede",
    icon: QuestionIcon,
  },
];

function DashboardBody({ cars }: { cars: readonly Car[] }): ReactElement {
  const profile = useGameStore(selectProfile);
  const index = useMemo(() => createCarIndex(cars), [cars]);
  const progress = getLevelProgress(profile);

  const selectedOwned =
    profile.ownedCars.find((car) => car.carId === profile.selectedCarId) ??
    profile.ownedCars[0] ??
    null;
  const selectedCar =
    selectedOwned === null ? null : (index.get(selectedOwned.carId) ?? null);
  const stats =
    selectedCar === null || selectedOwned === null
      ? null
      : getEffectiveStats(selectedCar, selectedOwned.upgrades);

  const recentRaces = profile.raceHistory.slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl">Bun venit înapoi, {profile.name}</h1>
        <p className="mt-1 text-sm text-fg-3">
          {formatNumber(profile.ownedCars.length)}{" "}
          {profile.ownedCars.length === 1 ? "mașină" : "mașini"} în garaj · nivel{" "}
          {progress.level} · {formatCoins(profile.coins)} monede
        </p>
      </header>

      {selectedCar !== null && stats !== null && selectedOwned !== null ? (
        <Card variant="accent" padding="none" chamfer as="section">
          <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] sm:items-center sm:gap-6 sm:p-6">
            <CarSilhouette
              accentColor={selectedCar.accentColor}
              rarity={normalizeRarity(selectedCar.rarity)}
              alt={`${selectedCar.brand} ${selectedCar.name}`}
              className="rounded-lg bg-bg px-4 py-6"
            />

            <div className="min-w-0">
              <p className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-fg-3">
                {selectedCar.brand}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-3">
                <h2 className="text-xl text-fg">{selectedCar.name}</h2>
                <RarityBadge
                  rarity={normalizeRarity(selectedCar.rarity)}
                  size="sm"
                />
              </div>
              <p className="mt-1 text-xs text-fg-3">
                {CATEGORY_LABEL[selectedCar.category]} ·{" "}
                {DRIVETRAIN_SHORT[selectedCar.drivetrain]} ·{" "}
                {formatNumber(stats.powerHp)} CP
              </p>

              <div className="mt-4 flex flex-col gap-1.5">
                <StatBar
                  label="Viteză"
                  value={stats.topSpeed}
                  size="sm"
                  displayValue={Math.round(stats.topSpeed)}
                />
                <StatBar
                  label="Accelerație"
                  value={stats.acceleration}
                  size="sm"
                  displayValue={Math.round(stats.acceleration)}
                />
                <StatBar
                  label="Handling"
                  value={stats.handling}
                  size="sm"
                  displayValue={Math.round(stats.handling)}
                />
                <StatBar
                  label="Frânare"
                  value={stats.braking}
                  size="sm"
                  displayValue={Math.round(stats.braking)}
                />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <LinkButton
                  href="/race"
                  variant="primary"
                  size="lg"
                  iconRight={
                    <ArrowRightIcon
                      weight="bold"
                      className="size-4"
                      aria-hidden="true"
                    />
                  }
                >
                  Intră în cursă
                </LinkButton>
                <LinkButton
                  href={`/garage/${selectedCar.id}`}
                  variant="ghost"
                  size="lg"
                >
                  Vezi mașina
                </LinkButton>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={<GarageIcon weight="duotone" className="size-7" />}
          title="Garajul e gol"
          description="Nu ai nicio mașină activă. Deschide garajul și alege una."
          action={
            <LinkButton href="/garage" variant="primary">
              Deschide garajul
            </LinkButton>
          }
        />
      )}

      <section>
        <h2 className="mb-3 text-xl">Moduri de joc</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
          {MODES.map((mode) => {
            const ModeIcon = mode.icon;
            return (
              <Link
                key={mode.href}
                href={mode.href}
                className="group flex flex-col gap-2 rounded-lg border border-line bg-surface p-4 transition-colors duration-150 ease-out-quick hover:border-line-strong hover:bg-surface-2"
              >
                <ModeIcon
                  weight="duotone"
                  className="size-7 text-accent"
                  aria-hidden="true"
                />
                <span className="font-display text-base font-bold uppercase tracking-[0.04em] text-fg">
                  {mode.label}
                </span>
                <span className="text-xs text-fg-3">{mode.description}</span>
                <span className="mt-auto pt-2 font-display text-xs font-semibold text-legendary tnum">
                  {mode.reward}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card title="Progres" as="section">
          <XpBar
            level={progress.level}
            xp={progress.xp}
            xpForNextLevel={progress.xpToNextLevel}
          />
          <dl className="mt-4 grid grid-cols-3 gap-3">
            <div>
              <dt className="text-xs text-fg-3">Curse</dt>
              <dd className="font-display text-lg font-bold text-fg tnum">
                {formatNumber(profile.stats.racesPlayed)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-fg-3">Victorii</dt>
              <dd className="font-display text-lg font-bold text-win tnum">
                {formatNumber(profile.stats.racesWon)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-fg-3">Cel mai bun 400 m</dt>
              <dd className="font-display text-lg font-bold text-fg tnum">
                {profile.stats.bestQuarterMile === null
                  ? "—"
                  : formatSeconds(profile.stats.bestQuarterMile)}
              </dd>
            </div>
          </dl>
        </Card>

        <Card
          title="Ultimele curse"
          as="section"
          action={
            <Link
              href="/profile"
              className="font-display text-xs font-semibold uppercase tracking-[0.08em] text-accent"
            >
              Tot istoricul
            </Link>
          }
        >
          {recentRaces.length === 0 ? (
            <p className="py-4 text-center text-sm text-fg-3">
              Nicio cursă încă. Primul drag race te așteaptă.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {recentRaces.map((race) => {
                const car = index.get(race.playerCarId);
                return (
                  <li
                    key={race.id}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <span
                      className={`inline-flex shrink-0 items-center rounded-sm border px-2 py-0.5 font-display text-[11px] font-semibold uppercase tracking-[0.08em] ${
                        race.won
                          ? "border-win/30 bg-win-wash text-win"
                          : "border-lose/30 bg-lose-wash text-lose"
                      }`}
                    >
                      {race.won ? "Victorie" : "Înfrângere"}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-fg-2">
                      {car?.name ?? race.playerCarId}
                    </span>
                    <span className="flex shrink-0 items-center gap-1 font-display text-xs font-semibold text-fg-3 tnum">
                      <TimerIcon
                        weight="regular"
                        className="size-3.5"
                        aria-hidden="true"
                      />
                      {formatSeconds(race.playerTime)}
                    </span>
                    <span className="shrink-0 font-display text-xs font-semibold text-legendary tnum">
                      +{formatCoins(race.coinsEarned)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}

export function Dashboard({ cars }: { cars: readonly Car[] }): ReactElement {
  return (
    <HydrationGate
      fallback={
        <div className="flex flex-col gap-8">
          <Skeleton height={64} />
          <Skeleton height={240} />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <Skeleton height={132} />
            <Skeleton height={132} />
            <Skeleton height={132} />
          </div>
        </div>
      }
    >
      <DashboardBody cars={cars} />
    </HydrationGate>
  );
}

export default Dashboard;
