"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react";
import {
  CheckCircleIcon,
  GarageIcon,
  StorefrontIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
  Button,
  Card,
  CoinCounter,
  EmptyState,
  Modal,
  RARITY_LABEL,
  RARITY_ORDER,
  Skeleton,
  cn,
  formatCoins,
  normalizeRarity,
  type Rarity,
} from "@/components/common";
import { CarCard } from "@/components/cars/CarCard";
import { LinkButton } from "@/components/dashboard/LinkButton";
import { HydrationGate } from "@/components/providers";
import { getEffectiveStats } from "@/lib/economy";
import { getGarage, getShop } from "@/services/carService";
import type { GarageEntry, ShopEntry } from "@/services/carService";
import { selectProfile, useGameStore } from "@/store";
import type { Car, CarCategory } from "@/types/car";
import { CATEGORY_LABEL, CATEGORY_ORDER, formatNumber } from "./carLabels";

type Tab = "owned" | "shop";
type RarityFilter = Rarity | "all";
type CategoryFilter = CarCategory | "all";

const SELECT_CLASS =
  "h-11 min-w-0 rounded-md border border-line-strong bg-surface-2 px-3 text-sm text-fg transition-colors duration-150 hover:border-fg-3";

function GarageBody({ cars }: { cars: readonly Car[] }): ReactElement {
  const profile = useGameStore(selectProfile);
  const buyCar = useGameStore((state) => state.buyCar);
  const selectCar = useGameStore((state) => state.selectCar);
  const garageError = useGameStore((state) => state.garageError);
  const clearGarageError = useGameStore((state) => state.clearGarageError);

  const [tab, setTab] = useState<Tab>("owned");
  const [rarity, setRarity] = useState<RarityFilter>("all");
  const [category, setCategory] = useState<CategoryFilter>("all");

  const [garageEntries, setGarageEntries] = useState<GarageEntry[]>([]);
  const [shopEntries, setShopEntries] = useState<ShopEntry[]>([]);

  const [pendingCar, setPendingCar] = useState<Car | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);

  // Datele derivate vin din servicii (nu recalculăm regulile de business în UI).
  useEffect(() => {
    let active = true;
    void Promise.all([getGarage(profile), getShop(profile)]).then(
      ([garage, shop]) => {
        if (!active) return;
        setGarageEntries(garage);
        setShopEntries(shop);
      },
    );
    return () => {
      active = false;
    };
  }, [profile, cars]);

  const matchesFilters = useCallback(
    (car: Car) =>
      (rarity === "all" || normalizeRarity(car.rarity) === rarity) &&
      (category === "all" || car.category === category),
    [rarity, category],
  );

  const ownedFiltered = useMemo(
    () => garageEntries.filter((entry) => matchesFilters(entry.car)),
    [garageEntries, matchesFilters],
  );
  const shopFiltered = useMemo(
    () =>
      shopEntries
        .filter((entry) => !entry.owned)
        .filter((entry) => matchesFilters(entry.car)),
    [shopEntries, matchesFilters],
  );

  const shopCount = shopEntries.filter((entry) => !entry.owned).length;

  const handleBuy = useCallback(async () => {
    if (pendingCar === null) return;
    setIsBuying(true);
    const success = await buyCar(pendingCar.id);
    setIsBuying(false);
    if (success) setPendingCar(null);
  }, [pendingCar, buyCar]);

  const handleSelect = useCallback(
    async (carId: string) => {
      setSelectingId(carId);
      await selectCar(carId);
      setSelectingId(null);
    },
    [selectCar],
  );

  const hasFilters = rarity !== "all" || category !== "all";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Garaj</h1>
          <p className="mt-1 text-sm text-fg-3">
            {formatNumber(garageEntries.length)} mașini deținute ·{" "}
            {formatNumber(shopCount)} disponibile în magazin
          </p>
        </div>
        <CoinCounter coins={profile.coins} size="lg" />
      </header>

      {/* Tab-uri: muchie de accent jos pe cel activ. */}
      <div
        role="tablist"
        aria-label="Secțiuni garaj"
        className="flex gap-1 border-b border-line"
      >
        {(
          [
            {
              id: "owned" as const,
              label: `Mașinile mele (${garageEntries.length})`,
              icon: GarageIcon,
            },
            {
              id: "shop" as const,
              label: `Magazin (${shopCount})`,
              icon: StorefrontIcon,
            },
          ] as const
        ).map((item) => {
          const TabIcon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={active}
              aria-controls={`panel-${item.id}`}
              onClick={() => setTab(item.id)}
              className={cn(
                "-mb-px inline-flex h-11 items-center gap-2 border-b-2 px-3 font-display text-sm font-semibold uppercase tracking-[0.06em] transition-colors duration-150",
                active
                  ? "border-accent text-fg"
                  : "border-transparent text-fg-3 hover:text-fg",
              )}
            >
              <TabIcon
                weight={active ? "fill" : "regular"}
                className="size-4"
                aria-hidden="true"
              />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-fg-3">
          <span>Raritate</span>
          <select
            className={SELECT_CLASS}
            value={rarity}
            onChange={(event) =>
              setRarity(event.target.value as RarityFilter)
            }
          >
            <option value="all">Toate</option>
            {RARITY_ORDER.map((value) => (
              <option key={value} value={value}>
                {RARITY_LABEL[value]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-xs text-fg-3">
          <span>Categorie</span>
          <select
            className={SELECT_CLASS}
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as CategoryFilter)
            }
          >
            <option value="all">Toate</option>
            {CATEGORY_ORDER.map((value) => (
              <option key={value} value={value}>
                {CATEGORY_LABEL[value]}
              </option>
            ))}
          </select>
        </label>

        {hasFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setRarity("all");
              setCategory("all");
            }}
          >
            Șterge filtrele
          </Button>
        ) : null}
      </div>

      {garageError !== null ? (
        <Card variant="default" padding="sm" className="border-lose/40">
          <p className="flex items-center gap-2 text-sm text-lose">
            <WarningCircleIcon
              weight="fill"
              className="size-4 shrink-0"
              aria-hidden="true"
            />
            {garageError.message}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={clearGarageError}
            >
              Am înțeles
            </Button>
          </p>
        </Card>
      ) : null}

      {tab === "owned" ? (
        <div id="panel-owned" role="tabpanel" aria-labelledby="tab-owned">
          {ownedFiltered.length === 0 ? (
            <EmptyState
              icon={<GarageIcon weight="duotone" className="size-7" />}
              title={
                garageEntries.length === 0
                  ? "Garajul e gol"
                  : "Nicio mașină nu trece de filtre"
              }
              description={
                garageEntries.length === 0
                  ? "Cumpără prima mașină din magazin sau câștig-o ca drop într-o cursă."
                  : "Schimbă raritatea sau categoria ca să vezi restul colecției."
              }
              action={
                garageEntries.length === 0 ? (
                  <Button variant="primary" onClick={() => setTab("shop")}>
                    Deschide magazinul
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setRarity("all");
                      setCategory("all");
                    }}
                  >
                    Șterge filtrele
                  </Button>
                )
              }
            />
          ) : (
            <ul className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3 lg:gap-4 xl:grid-cols-4">
              {ownedFiltered.map((entry) => (
                <li key={entry.car.id} className="flex">
                  <CarCard
                    className="w-full"
                    name={entry.car.name}
                    brand={entry.car.brand}
                    rarity={normalizeRarity(entry.car.rarity)}
                    accentColor={entry.car.accentColor}
                    category={CATEGORY_LABEL[entry.car.category]}
                    owned
                    selected={entry.isSelected}
                    stats={entry.effectiveStats}
                    footer={
                      <div className="flex items-center gap-2">
                        {entry.isSelected ? (
                          <span className="inline-flex items-center gap-1 font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">
                            <CheckCircleIcon
                              weight="fill"
                              className="size-4"
                              aria-hidden="true"
                            />
                            Activă
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={selectingId === entry.car.id}
                            loadingLabel="Se alege…"
                            onClick={() => void handleSelect(entry.car.id)}
                          >
                            Alege
                          </Button>
                        )}
                        <LinkButton
                          href={`/garage/${entry.car.id}`}
                          size="sm"
                          variant="ghost"
                        >
                          Detalii
                        </LinkButton>
                      </div>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div id="panel-shop" role="tabpanel" aria-labelledby="tab-shop">
          {shopFiltered.length === 0 ? (
            <EmptyState
              icon={<StorefrontIcon weight="duotone" className="size-7" />}
              title={
                shopCount === 0
                  ? "Ai cumpărat tot catalogul"
                  : "Niciun rezultat pentru filtrele astea"
              }
              description={
                shopCount === 0
                  ? "Toate cele 24 de mașini sunt în garajul tău. Respect."
                  : "Încearcă altă raritate sau categorie."
              }
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setRarity("all");
                    setCategory("all");
                  }}
                >
                  Șterge filtrele
                </Button>
              }
            />
          ) : (
            <ul className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3 lg:gap-4 xl:grid-cols-4">
              {shopFiltered.map((entry) => {
                const stats = getEffectiveStats(entry.car);
                const levelLocked = entry.lockReason === "level";
                const tooExpensive = entry.lockReason === "coins";
                return (
                  <li key={entry.car.id} className="flex">
                    <CarCard
                      className="w-full"
                      name={entry.car.name}
                      brand={entry.car.brand}
                      rarity={normalizeRarity(entry.car.rarity)}
                      accentColor={entry.car.accentColor}
                      category={CATEGORY_LABEL[entry.car.category]}
                      price={entry.car.price}
                      locked={levelLocked}
                      lockedReason={`Necesită nivelul ${entry.car.unlockLevel}`}
                      stats={stats}
                      footer={
                        <Button
                          size="sm"
                          variant={entry.canBuy ? "primary" : "secondary"}
                          disabled={!entry.canBuy}
                          title={
                            levelLocked
                              ? `Necesită nivelul ${entry.car.unlockLevel}`
                              : tooExpensive
                                ? "Nu ai destule monede"
                                : undefined
                          }
                          onClick={() => setPendingCar(entry.car)}
                        >
                          {levelLocked
                            ? `Nivel ${entry.car.unlockLevel}`
                            : tooExpensive
                              ? "Prea scumpă"
                              : "Cumpără"}
                        </Button>
                      }
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <Modal
        open={pendingCar !== null}
        onClose={() => {
          if (!isBuying) setPendingCar(null);
        }}
        tone="accent"
        size="sm"
        title="Confirmi achiziția?"
        description={
          pendingCar === null
            ? undefined
            : `${pendingCar.brand} ${pendingCar.name}`
        }
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setPendingCar(null)}
              disabled={isBuying}
            >
              Renunț
            </Button>
            <Button
              variant="primary"
              loading={isBuying}
              loadingLabel="Se cumpără…"
              onClick={() => void handleBuy()}
            >
              Cumpără
            </Button>
          </>
        }
      >
        {pendingCar !== null ? (
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-fg-3">Preț</dt>
              <dd className="font-display font-semibold text-fg tnum">
                {formatCoins(pendingCar.price)} monede
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-fg-3">Monede acum</dt>
              <dd className="font-display font-semibold text-fg tnum">
                {formatCoins(profile.coins)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-line pt-2">
              <dt className="text-fg-3">Rămân după</dt>
              <dd className="font-display font-semibold text-legendary tnum">
                {formatCoins(Math.max(0, profile.coins - pendingCar.price))}
              </dd>
            </div>
            {garageError !== null ? (
              <p className="mt-2 text-sm text-lose">{garageError.message}</p>
            ) : null}
          </dl>
        ) : null}
      </Modal>
    </div>
  );
}

export function GarageClient({ cars }: { cars: readonly Car[] }): ReactElement {
  return (
    <HydrationGate
      fallback={
        <div className="flex flex-col gap-6">
          <Skeleton height={64} />
          <Skeleton height={44} />
          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} variant="card" />
            ))}
          </div>
        </div>
      }
    >
      <GarageBody cars={cars} />
    </HydrationGate>
  );
}

export default GarageClient;
