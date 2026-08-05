"use client";

import type { ReactElement } from "react";
import {
  CheckCircleIcon,
  CoinsIcon,
  EngineIcon,
  FeatherIcon,
  TireIcon,
  WindIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { Button, Card, cn, formatCoins } from "@/components/common";
import { MAX_UPGRADE_LEVEL } from "@/lib/economy";
import type { UpgradeOption, UpgradePart } from "@/types/car";
import { UPGRADE_LABEL } from "./carLabels";

const PART_ICON: Record<UpgradePart, Icon> = {
  engine: EngineIcon,
  turbo: WindIcon,
  tires: TireIcon,
  weight: FeatherIcon,
};

const PART_HINT: Record<UpgradePart, string> = {
  engine: "Putere și turație maximă",
  turbo: "Accelerație brută",
  tires: "Aderență, frânare și ferestre de shift mai largi",
  weight: "Mai ușoară: accelerează, virează și frânează mai bine",
};

export interface UpgradePanelProps {
  options: readonly UpgradeOption[];
  coins: number;
  /** Piesa previzualizată în barele de statistici din dreapta. */
  previewPart: UpgradePart | null;
  onPreviewChange: (part: UpgradePart | null) => void;
  onUpgrade: (part: UpgradePart) => void;
  pendingPart: UpgradePart | null;
  disabled?: boolean;
}

/**
 * Cele 4 trasee de upgrade. Costul și efectul următorului nivel sunt vizibile
 * ÎNAINTE de apăsare — previzualizarea nu stă ascunsă în hover, pentru că pe
 * mobil hover-ul nu există: rândul selectat rămâne selectat.
 */
export function UpgradePanel({
  options,
  coins,
  previewPart,
  onPreviewChange,
  onUpgrade,
  pendingPart,
  disabled = false,
}: UpgradePanelProps): ReactElement {
  return (
    <Card title="Upgrade-uri" padding="sm" as="section">
      <ul className="flex flex-col gap-2">
        {options.map((option) => {
          const PartIcon = PART_ICON[option.part];
          const affordable =
            option.cost !== null && coins >= option.cost && !option.isMaxed;
          const isPreviewed = previewPart === option.part;

          return (
            <li
              key={option.part}
              className={cn(
                "rounded-md border p-3 transition-colors duration-150 ease-out-quick",
                isPreviewed
                  ? "border-accent-line bg-accent-wash"
                  : "border-line bg-surface-2",
              )}
              onMouseEnter={() =>
                !option.isMaxed && onPreviewChange(option.part)
              }
              onMouseLeave={() => onPreviewChange(null)}
            >
              <div className="flex items-center gap-3">
                <PartIcon
                  weight="duotone"
                  className="size-5 shrink-0 text-fg-2"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-baseline gap-2 text-sm font-semibold text-fg">
                    {UPGRADE_LABEL[option.part]}
                    <span className="font-display text-xs font-semibold text-fg-3 tnum">
                      Nv. {option.currentLevel}/{MAX_UPGRADE_LEVEL}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-fg-3">
                    {PART_HINT[option.part]}
                  </p>
                </div>
              </div>

              {/* Pipsuri de nivel: se citesc și fără culoare. */}
              <div
                className="mt-2.5 flex gap-1"
                role="meter"
                aria-label={`${UPGRADE_LABEL[option.part]}, nivel ${option.currentLevel} din ${MAX_UPGRADE_LEVEL}`}
                aria-valuenow={option.currentLevel}
                aria-valuemin={0}
                aria-valuemax={MAX_UPGRADE_LEVEL}
              >
                {Array.from({ length: MAX_UPGRADE_LEVEL }, (_, index) => (
                  <span
                    key={index}
                    aria-hidden="true"
                    className={cn(
                      "h-1.5 flex-1 rounded-xs",
                      index < option.currentLevel
                        ? "bg-accent"
                        : "bg-track sg-hatch",
                    )}
                  />
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                {option.isMaxed ? (
                  <span className="inline-flex items-center gap-1.5 font-display text-xs font-semibold uppercase tracking-[0.08em] text-win">
                    <CheckCircleIcon
                      weight="fill"
                      className="size-4"
                      aria-hidden="true"
                    />
                    Nivel maxim
                  </span>
                ) : (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 font-display text-sm font-semibold tnum",
                      affordable ? "text-fg" : "text-fg-disabled",
                    )}
                  >
                    <CoinsIcon
                      weight="fill"
                      className={cn(
                        "size-4",
                        affordable ? "text-legendary" : "text-fg-disabled",
                      )}
                      aria-hidden="true"
                    />
                    {formatCoins(option.cost ?? 0)}
                    <span className="sr-only">monede</span>
                  </span>
                )}

                {!option.isMaxed ? (
                  <Button
                    size="sm"
                    variant={affordable ? "primary" : "secondary"}
                    disabled={disabled || !affordable}
                    loading={pendingPart === option.part}
                    loadingLabel="Se montează…"
                    onFocus={() => onPreviewChange(option.part)}
                    onBlur={() => onPreviewChange(null)}
                    onClick={() => onUpgrade(option.part)}
                  >
                    {affordable ? "Îmbunătățește" : "Monede insuficiente"}
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export default UpgradePanel;
