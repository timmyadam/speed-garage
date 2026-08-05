"use client";

import type { ReactElement, RefObject } from "react";

export interface RaceTrackProps {
  playerLabel: string;
  opponentLabel: string;
  playerColor: string;
  opponentColor: string;
  /** Poziția pe culoar (0–100%), scrisă din bucla de animație. */
  playerRef: RefObject<HTMLDivElement | null>;
  opponentRef: RefObject<HTMLDivElement | null>;
}

function Lane({
  label,
  color,
  markerRef,
  tone,
}: {
  label: string;
  color: string;
  markerRef: RefObject<HTMLDivElement | null>;
  tone: "player" | "opponent";
}): ReactElement {
  return (
    <div>
      <p className="mb-1 flex items-center gap-2 text-xs text-fg-3">
        <span
          aria-hidden="true"
          className="size-2 rounded-xs"
          style={{ backgroundColor: color }}
        />
        <span className="truncate">{label}</span>
        <span className="ml-auto font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-fg-disabled">
          {tone === "player" ? "Tu" : "Adversar"}
        </span>
      </p>
      <div className="relative h-6 w-full overflow-hidden rounded-sm border border-line bg-bg">
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 w-1.5"
          style={{
            backgroundImage:
              "repeating-conic-gradient(#e9edf2 0% 25%, #0a0b0c 0% 50%)",
            backgroundSize: "6px 6px",
          }}
        />
        <div
          ref={markerRef}
          aria-hidden="true"
          className="absolute top-1/2 h-3 w-8 -translate-y-1/2 rounded-xs"
          style={{ left: "0%", backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/** Cele două culoare de drag strip. Poziția e scrisă direct în DOM, nu prin state. */
export function RaceTrack({
  playerLabel,
  opponentLabel,
  playerColor,
  opponentColor,
  playerRef,
  opponentRef,
}: RaceTrackProps): ReactElement {
  return (
    <section
      aria-label="Pistă"
      className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4"
    >
      <Lane
        label={playerLabel}
        color={playerColor}
        markerRef={playerRef}
        tone="player"
      />
      <Lane
        label={opponentLabel}
        color={opponentColor}
        markerRef={opponentRef}
        tone="opponent"
      />
    </section>
  );
}

export default RaceTrack;
