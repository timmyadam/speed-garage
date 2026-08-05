import Link from "next/link";
import type { ReactElement, ReactNode } from "react";
import {
  CoinsIcon,
  GaugeIcon,
  LockSimpleIcon,
  SpeedometerIcon,
  SteeringWheelIcon,
  TimerIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "../common/cn";
import { formatCoins } from "../common/CoinCounter";
import { RarityBadge, type Rarity } from "../common/RarityBadge";
import { CarSilhouette } from "./CarSilhouette";

/**
 * Statistici normalizate 0–100, pentru barele comparabile între mașini.
 * Structural identică cu `CarStats` din `@/types` — se poate trimite direct
 * `stats={car.stats}` sau `stats={effectiveStats}`.
 */
export interface CarCardStats {
  topSpeed: number;
  acceleration: number;
  handling: number;
  braking: number;
}

export interface CarCardProps {
  name: string;
  brand: string;
  rarity: Rarity;
  /** Culoarea mașinii din datele mock — sursa vizualului CSS. */
  accentColor: string;
  stats: CarCardStats;
  /** Categorie (ex: „Hot Hatch", „Hypercar"). */
  category?: string;
  /** Preț în monede. Afișat doar când mașina nu e deținută. */
  price?: number;
  owned?: boolean;
  /** Blocată de nivel/preț. Motivul e vizibil, nu ascuns în hover. */
  locked?: boolean;
  lockedReason?: string;
  /** Bifă de selecție (ex: alegerea mașinii pentru cursă). */
  selected?: boolean;
  /** Dacă e dat, tot cardul devine link. Altfel se folosește `footer`. */
  href?: string;
  /** Zonă de acțiuni sub statistici (ex: butonul „Cumpără"). */
  footer?: ReactNode;
  /** Ascunde barele de statistici — pentru liste dense. */
  compact?: boolean;
  className?: string;
}

const STAT_META = [
  { key: "topSpeed", label: "Viteză", Icon: SpeedometerIcon },
  { key: "acceleration", label: "Accelerație", Icon: TimerIcon },
  { key: "handling", label: "Handling", Icon: SteeringWheelIcon },
  { key: "braking", label: "Frânare", Icon: GaugeIcon },
] as const;

function MiniStat({
  label,
  value,
  Icon,
}: {
  label: string;
  value: number;
  Icon: typeof GaugeIcon;
}) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-3.5 shrink-0 text-fg-disabled" aria-hidden="true" />
      <span className="w-16 shrink-0 truncate text-[11px] text-fg-3">
        {label}
      </span>
      <span
        role="meter"
        aria-label={label}
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="relative h-1 min-w-0 flex-1 overflow-hidden rounded-xs bg-track sg-hatch"
      >
        <span
          className="absolute inset-y-0 left-0 rounded-xs bg-accent"
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="w-6 shrink-0 text-right font-display text-[11px] font-semibold text-fg-2 tnum">
        {Math.round(value)}
      </span>
    </div>
  );
}

/**
 * Cardul de mașină. Ierarhia: vizual → nume → raritate → statistici → preț.
 * Colțul teșit sus-dreapta e semnătura produsului; muchia colorată de sus
 * codează raritatea și e vizibilă chiar și când cardul e mic pe mobil.
 */
export function CarCard({
  name,
  brand,
  rarity,
  accentColor,
  stats,
  category,
  price,
  owned = false,
  locked = false,
  lockedReason,
  selected = false,
  href,
  footer,
  compact = false,
  className,
}: CarCardProps): ReactElement {
  const body = (
    <>
      {/* Muchie de raritate: 2px sus, lățime completă. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ backgroundColor: `var(--color-${rarity})` }}
      />

      <div className="relative">
        <CarSilhouette
          accentColor={accentColor}
          rarity={rarity}
          alt={`${brand} ${name}`}
          muted={locked}
          className="bg-bg px-4 pt-5 pb-2"
        />

        <div className="absolute top-3 left-3">
          <RarityBadge rarity={rarity} size="sm" />
        </div>

        {locked ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-bg/72 px-4 text-center">
            <LockSimpleIcon
              weight="duotone"
              className="size-6 text-fg-2"
              aria-hidden="true"
            />
            <p className="text-xs font-medium text-fg-2">
              {lockedReason ?? "Blocată"}
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 border-t border-line p-4">
        <div className="min-w-0">
          <p className="truncate font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-fg-3">
            {brand}
          </p>
          <h3 className="truncate text-base font-bold text-fg" title={name}>
            {name}
          </h3>
          {category ? (
            <p className="mt-0.5 truncate text-xs text-fg-disabled">
              {category}
            </p>
          ) : null}
        </div>

        {!compact ? (
          <div className="flex flex-col gap-1.5">
            {STAT_META.map(({ key, label, Icon }) => (
              <MiniStat
                key={key}
                label={label}
                value={stats[key]}
                Icon={Icon}
              />
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
          {owned ? (
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-win/30 bg-win-wash px-2 py-1 text-[11px] font-semibold text-win">
              În garaj
            </span>
          ) : price !== undefined ? (
            <span className="inline-flex items-center gap-1.5 font-display text-base font-bold text-fg tnum">
              <CoinsIcon
                weight="fill"
                className="size-4 text-legendary"
                aria-hidden="true"
              />
              {formatCoins(price)}
              <span className="sr-only">monede</span>
            </span>
          ) : (
            <span />
          )}
          {footer ? <div className="shrink-0">{footer}</div> : null}
        </div>
      </div>
    </>
  );

  const shell = cn(
    "group relative flex flex-col overflow-hidden border bg-surface sg-chamfer",
    "transition-colors duration-150 ease-out-quick",
    selected
      ? "border-accent"
      : "border-line hover:border-line-strong hover:bg-surface-2",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={shell} aria-current={selected ? "true" : undefined}>
        {body}
      </Link>
    );
  }

  return <article className={shell}>{body}</article>;
}

export default CarCard;
