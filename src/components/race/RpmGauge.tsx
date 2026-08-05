"use client";

import type { ReactElement, RefObject } from "react";

export interface RpmGaugeProps {
  /** Umplerea acului de turație (width în %), scrisă din bucla de animație. */
  fillRef: RefObject<HTMLDivElement | null>;
  /** Banda ferestrei optime — se mută la fiecare treaptă. */
  bandRef: RefObject<HTMLDivElement | null>;
  rpmTextRef: RefObject<HTMLSpanElement | null>;
  gearTextRef: RefObject<HTMLSpanElement | null>;
  timeTextRef: RefObject<HTMLSpanElement | null>;
  distanceTextRef: RefObject<HTMLSpanElement | null>;
  /** Feedbackul ultimului shift („PERFECT −0.14 s"). */
  feedbackRef: RefObject<HTMLParagraphElement | null>;
  redlineRpm: number;
  /** Scala gauge-ului merge peste limitator, ca supraturarea să fie vizibilă. */
  scaleMaxRpm: number;
  gearCount: number;
}

/**
 * Gauge-ul de turație.
 *
 * Nu primește NICIO valoare dinamică prin props în timpul cursei: cifrele și
 * lățimile sunt scrise direct în DOM din bucla `requestAnimationFrame` a
 * paginii, prin ref-urile de mai sus. Componenta se randează o singură dată
 * pe cursă, deci arborele React nu se re-randează la 60fps.
 */
export function RpmGauge({
  fillRef,
  bandRef,
  rpmTextRef,
  gearTextRef,
  timeTextRef,
  distanceTextRef,
  feedbackRef,
  redlineRpm,
  scaleMaxRpm,
  gearCount,
}: RpmGaugeProps): ReactElement {
  const redlinePercent = (redlineRpm / scaleMaxRpm) * 100;

  return (
    <section
      aria-label="Turometru"
      className="rounded-lg border border-line bg-surface p-4"
    >
      <div className="flex items-end justify-between gap-4">
        <p className="font-display text-5xl font-bold leading-none text-fg tnum">
          <span ref={rpmTextRef}>0</span>
          <span className="ml-1 text-base font-semibold text-fg-3">RPM</span>
        </p>
        <p className="text-right font-display text-sm font-semibold text-fg-2 tnum">
          Treapta{" "}
          <span ref={gearTextRef} className="text-2xl text-fg">
            1
          </span>
          <span className="text-fg-3">/{gearCount}</span>
        </p>
      </div>

      <div
        className="relative mt-3 h-9 w-full overflow-hidden rounded-sm bg-track sg-hatch"
        role="meter"
        aria-label="Turație motor"
        aria-valuemin={0}
        aria-valuemax={Math.round(scaleMaxRpm)}
        aria-valuenow={0}
      >
        {/* Fereastra optimă de shift — banda verde. */}
        <div
          ref={bandRef}
          aria-hidden="true"
          className="absolute inset-y-0 border-x border-win/70 bg-win/20"
          style={{ left: "0%", width: "0%" }}
        />
        {/* Limitatorul. Dincolo de el, acul intră în zona roșie. */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 w-0.5 bg-lose"
          style={{ left: `${redlinePercent}%` }}
        />
        <div
          ref={fillRef}
          aria-hidden="true"
          className="absolute inset-y-0 left-0 bg-accent"
          style={{ width: "0%" }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-4 font-display text-sm font-semibold text-fg-2 tnum">
        <span>
          Distanță <span ref={distanceTextRef}>0</span>
          <span className="text-fg-3"> / 400 m</span>
        </span>
        <span>
          Timp <span ref={timeTextRef}>0.00</span>
          <span className="text-fg-3"> s</span>
        </span>
      </div>

      <p
        ref={feedbackRef}
        aria-live="polite"
        className="mt-2 h-6 font-display text-sm font-semibold uppercase tracking-[0.08em] text-fg-3"
      />
    </section>
  );
}

export default RpmGauge;
