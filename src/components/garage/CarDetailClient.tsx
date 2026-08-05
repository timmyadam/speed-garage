"use client";

import {
  useOptimistic,
  useState,
  useTransition,
  type ReactElement,
} from "react";
import {
  ArrowLeftIcon,
  GaugeIcon,
  SpeedometerIcon,
  SteeringWheelIcon,
  TimerIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
  Button,
  Card,
  CoinCounter,
  RarityBadge,
  Skeleton,
  StatBar,
  cn,
  formatCoins,
  normalizeRarity,
} from "@/components/common";
import { CarSilhouette } from "@/components/cars/CarSilhouette";
import { LinkButton } from "@/components/dashboard/LinkButton";
import { HydrationGate } from "@/components/providers";
import {
  computePowerRating,
  getEffectiveStats,
  getUpgradeOptions,
  STOCK_UPGRADES,
} from "@/lib/economy";
import { estimateBestTime } from "@/lib/raceEngine";
import { selectProfile, useGameStore } from "@/store";
import type { Car, CarStats, CarUpgrades, UpgradePart } from "@/types/car";
import {
  CATEGORY_LABEL,
  DRIVETRAIN_LABEL,
  formatNumber,
  formatSeconds,
} from "./carLabels";
import { UpgradePanel } from "./UpgradePanel";

const EMPTY_GAIN: CarStats = {
  topSpeed: 0,
  acceleration: 0,
  handling: 0,
  braking: 0,
};

function CarDetailBody({ car }: { car: Car }): ReactElement {
  const profile = useGameStore(selectProfile);
  const upgradeCar = useGameStore((state) => state.upgradeCar);
  const selectCar = useGameStore((state) => state.selectCar);
  const buyCar = useGameStore((state) => state.buyCar);
  const garageError = useGameStore((state) => state.garageError);

  const owned =
    profile.ownedCars.find((entry) => entry.carId === car.id) ?? null;
  const baseUpgrades: CarUpgrades = owned?.upgrades ?? STOCK_UPGRADES;

  /**
   * `useOptimistic`: nivelul piesei urcă imediat la apăsare, iar barele de
   * statistici se actualizează în același frame. Dacă serviciul refuză
   * (monede insuficiente), React revine automat la valoarea reală.
   */
  const [upgrades, addOptimisticUpgrade] = useOptimistic(
    baseUpgrades,
    (state: CarUpgrades, part: UpgradePart): CarUpgrades => ({
      ...state,
      [part]: Math.min(5, state[part] + 1) as CarUpgrades[UpgradePart],
    }),
  );

  const [isPending, startTransition] = useTransition();
  const [pendingPart, setPendingPart] = useState<UpgradePart | null>(null);
  const [previewPart, setPreviewPart] = useState<UpgradePart | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  const stats = getEffectiveStats(car, upgrades);
  const options = getUpgradeOptions(car, upgrades);
  const rating = computePowerRating(car, upgrades);
  const bestTime = estimateBestTime(car, upgrades);

  const preview =
    previewPart === null
      ? EMPTY_GAIN
      : (options.find((option) => option.part === previewPart)?.gain ??
        EMPTY_GAIN);

  const isSelected = profile.selectedCarId === car.id;
  const carRaces = profile.raceHistory
    .filter((race) => race.playerCarId === car.id)
    .slice(0, 8);

  const handleUpgrade = (part: UpgradePart): void => {
    setPendingPart(part);
    startTransition(async () => {
      addOptimisticUpgrade(part);
      await upgradeCar(car.id, part);
      setPendingPart(null);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <LinkButton
        href="/garage"
        variant="ghost"
        size="sm"
        icon={
          <ArrowLeftIcon weight="bold" className="size-4" aria-hidden="true" />
        }
        className="self-start"
      >
        Înapoi la garaj
      </LinkButton>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
        <div className="flex flex-col gap-4 lg:sticky lg:top-24">
          <Card padding="none" chamfer as="section">
            <CarSilhouette
              accentColor={car.accentColor}
              rarity={normalizeRarity(car.rarity)}
              alt={`${car.brand} ${car.name}`}
              className="bg-bg px-4 pt-6 pb-3"
            />
            <div className="border-t border-line p-4">
              <p className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-fg-3">
                {car.brand}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl">{car.name}</h1>
                <RarityBadge rarity={normalizeRarity(car.rarity)} />
              </div>
              <p className="mt-1 text-sm text-fg-3">
                {CATEGORY_LABEL[car.category]} ·{" "}
                {DRIVETRAIN_LABEL[car.drivetrain]} · {car.year}
              </p>

              <dl className="mt-4 grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Putere",
                    value: `${formatNumber(stats.powerHp)} CP`,
                  },
                  {
                    label: "Greutate",
                    value: `${formatNumber(stats.weightKg)} kg`,
                  },
                  { label: "0–100 km/h", value: `${car.zeroToHundred} s` },
                  {
                    label: "Viteză maximă",
                    value: `${formatNumber(car.topSpeedKmh)} km/h`,
                  },
                  { label: "Rating", value: `${rating}/100` },
                  { label: "400 m estimat", value: formatSeconds(bestTime) },
                ].map((item) => (
                  <div key={item.label}>
                    <dt className="text-xs text-fg-3">{item.label}</dt>
                    <dd className="font-display text-base font-bold text-fg tnum">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {owned === null ? (
                  <>
                    <CoinCounter coins={car.price} />
                    <Button
                      variant="primary"
                      loading={isBuying}
                      loadingLabel="Se cumpără…"
                      disabled={
                        profile.level < car.unlockLevel ||
                        profile.coins < car.price
                      }
                      onClick={() => {
                        setIsBuying(true);
                        void buyCar(car.id).finally(() => setIsBuying(false));
                      }}
                    >
                      {profile.level < car.unlockLevel
                        ? `Necesită nivelul ${car.unlockLevel}`
                        : profile.coins < car.price
                          ? "Monede insuficiente"
                          : "Cumpără"}
                    </Button>
                  </>
                ) : isSelected ? (
                  <>
                    <span className="inline-flex items-center rounded-sm border border-accent-line bg-accent-wash px-2 py-1 font-display text-xs font-semibold uppercase tracking-[0.08em] text-accent">
                      Mașină activă
                    </span>
                    <LinkButton href="/race" variant="primary">
                      Intră în cursă
                    </LinkButton>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    loading={isSelecting}
                    loadingLabel="Se alege…"
                    onClick={() => {
                      setIsSelecting(true);
                      void selectCar(car.id).finally(() =>
                        setIsSelecting(false),
                      );
                    }}
                  >
                    Fă-o mașina activă
                  </Button>
                )}
              </div>

              {garageError !== null ? (
                <p className="mt-3 flex items-center gap-2 text-sm text-lose">
                  <WarningCircleIcon
                    weight="fill"
                    className="size-4 shrink-0"
                    aria-hidden="true"
                  />
                  {garageError.message}
                </p>
              ) : null}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card title="Statistici" as="section">
            <div className="flex flex-col gap-2.5">
              <StatBar
                label="Viteză maximă"
                icon={<SpeedometerIcon className="size-4" />}
                value={stats.topSpeed}
                delta={preview.topSpeed}
              />
              <StatBar
                label="Accelerație"
                icon={<TimerIcon className="size-4" />}
                value={stats.acceleration}
                delta={preview.acceleration}
              />
              <StatBar
                label="Handling"
                icon={<SteeringWheelIcon className="size-4" />}
                value={stats.handling}
                delta={preview.handling}
              />
              <StatBar
                label="Frânare"
                icon={<GaugeIcon className="size-4" />}
                value={stats.braking}
                delta={preview.braking}
              />
            </div>
            <p
              className={cn(
                "mt-3 text-xs",
                previewPart === null ? "text-fg-disabled" : "text-fg-2",
              )}
              aria-live="polite"
            >
              {previewPart === null
                ? "Alege o piesă din dreapta ca să vezi exact ce câștigi."
                : "Segmentul verde arată statisticile după upgrade."}
            </p>
          </Card>

          {owned !== null ? (
            <UpgradePanel
              options={options}
              coins={profile.coins}
              previewPart={previewPart}
              onPreviewChange={setPreviewPart}
              onUpgrade={handleUpgrade}
              pendingPart={pendingPart}
              disabled={isPending}
            />
          ) : (
            <Card padding="md" as="section">
              <p className="text-sm text-fg-3">
                Upgrade-urile se deblochează după ce mașina ajunge în garajul
                tău. Prețul de listă este{" "}
                <span className="font-display font-semibold text-fg tnum">
                  {formatCoins(car.price)}
                </span>{" "}
                monede.
              </p>
            </Card>
          )}

          <Card title="Istoric cu mașina asta" as="section">
            {carRaces.length === 0 ? (
              <p className="py-2 text-sm text-fg-3">
                Nicio cursă cu mașina asta încă.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {carRaces.map((race) => (
                  <li
                    key={race.id}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center rounded-sm border px-2 py-0.5 font-display text-[11px] font-semibold uppercase tracking-[0.08em]",
                        race.won
                          ? "border-win/30 bg-win-wash text-win"
                          : "border-lose/30 bg-lose-wash text-lose",
                      )}
                    >
                      {race.won ? "Victorie" : "Înfrângere"}
                    </span>
                    <span className="flex-1 font-display text-sm text-fg-2 tnum">
                      {formatSeconds(race.playerTime)}
                    </span>
                    <span className="shrink-0 text-xs text-fg-3 tnum">
                      {race.perfectShifts}/{race.totalShifts} shift-uri perfecte
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export function CarDetailClient({ car }: { car: Car }): ReactElement {
  return (
    <HydrationGate
      fallback={
        <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <Skeleton height={420} />
          <Skeleton height={420} />
        </div>
      }
    >
      <CarDetailBody car={car} />
    </HydrationGate>
  );
}

export default CarDetailClient;
