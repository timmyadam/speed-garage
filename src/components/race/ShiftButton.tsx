"use client";

import { useEffect, type ReactElement } from "react";
import { ArrowFatUpIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/components/common";

export interface ShiftButtonProps {
  onShift: () => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
}

/**
 * Butonul de shift: ocupă toată lățimea și stă jos de tot, în zona degetului
 * mare — cursa trebuie să fie jucabilă cu o singură mână pe telefon.
 * `pointerdown` (nu `click`) ca să nu pierdem cele ~100 ms de latență ale
 * evenimentului sintetizat pe touch; `Space`/`Enter` funcționează pe desktop.
 */
export function ShiftButton({
  onShift,
  disabled = false,
  label = "Schimbă treapta",
  hint,
}: ShiftButtonProps): ReactElement {
  useEffect(() => {
    if (disabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.tagName === "BUTTON") return;
      event.preventDefault();
      onShift();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onShift, disabled]);

  return (
    <div className="sticky bottom-0 z-10 pt-2">
      <button
        type="button"
        disabled={disabled}
        onPointerDown={(event) => {
          event.preventDefault();
          if (!disabled) onShift();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!disabled) onShift();
          }
        }}
        className={cn(
          "flex h-24 w-full touch-manipulation select-none flex-col items-center justify-center gap-1 rounded-lg border font-display text-xl font-bold uppercase tracking-[0.08em]",
          "transition-[background-color,border-color,transform] duration-150 ease-out-quick active:translate-y-px",
          disabled
            ? "pointer-events-none border-line bg-surface text-fg-disabled"
            : "border-accent bg-accent text-accent-fg shadow-[0_1px_0_0_rgb(255_255_255/0.18)_inset] active:bg-accent-press",
        )}
      >
        <ArrowFatUpIcon weight="fill" className="size-6" aria-hidden="true" />
        {label}
        {hint ? (
          <span className="text-xs font-semibold tracking-[0.06em] opacity-80">
            {hint}
          </span>
        ) : null}
      </button>
    </div>
  );
}

export default ShiftButton;
