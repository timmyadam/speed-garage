import type { ReactElement } from "react";
import { cn } from "./cn";

/**
 * Rarități, în ordinea rampei de anodizare a titanului:
 * oțel brut → albastru → violet → aur.
 */
export type Rarity = "common" | "rare" | "epic" | "legendary";

export const RARITY_ORDER: readonly Rarity[] = [
  "common",
  "rare",
  "epic",
  "legendary",
] as const;

/**
 * Acceptă orice variantă de capitalizare venită din datele mock
 * ("Legendary", "LEGENDARY", "legendary") și o normalizează.
 * Fallback sigur: `common`.
 */
export function normalizeRarity(value: string): Rarity {
  const key = value.trim().toLowerCase();
  return (RARITY_ORDER as readonly string[]).includes(key)
    ? (key as Rarity)
    : "common";
}

/** Culoarea CSS a unei rarități — pentru consumatori care au nevoie de hex/var. */
export function rarityColorVar(rarity: Rarity): string {
  return `var(--color-${rarity})`;
}

export const RARITY_LABEL: Record<Rarity, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

const RARITY_CLASS: Record<Rarity, string> = {
  common: "text-common bg-common-wash border-common/30",
  rare: "text-rare bg-rare-wash border-rare/35",
  epic: "text-epic bg-epic-wash border-epic/35",
  legendary: "text-legendary bg-legendary-wash border-legendary/40",
};

export interface RarityBadgeProps {
  rarity: Rarity;
  size?: "sm" | "md";
  /** Ascunde textul și lasă doar pastila de culoare (rămâne accesibil prin aria-label). */
  showLabel?: boolean;
  className?: string;
}

/**
 * Culoarea nu e niciodată singurul purtător de sens: eticheta text e vizibilă
 * implicit, iar când nu e, rămâne un `aria-label` + `title`.
 */
export function RarityBadge({
  rarity,
  size = "md",
  showLabel = true,
  className,
}: RarityBadgeProps): ReactElement {
  const label = RARITY_LABEL[rarity];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border font-display font-semibold uppercase tracking-[0.09em] whitespace-nowrap",
        RARITY_CLASS[rarity],
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs",
        className,
      )}
      title={label}
      aria-label={showLabel ? undefined : `Raritate: ${label}`}
    >
      <span
        aria-hidden="true"
        className={cn(
          "block rounded-[1px] bg-current",
          size === "sm" ? "size-1.5" : "size-2",
        )}
      />
      {showLabel ? label : null}
    </span>
  );
}

export default RarityBadge;
