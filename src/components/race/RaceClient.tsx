"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import {
  ArrowRightIcon,
  FlagCheckeredIcon,
  GarageIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
  Button,
  Card,
  EmptyState,
  RarityBadge,
  Skeleton,
  StatBar,
  cn,
  formatCoins,
  normalizeRarity,
} from "@/components/common";
import { CarSilhouette } from "@/components/cars/CarSilhouette";
import { LinkButton } from "@/components/dashboard/LinkButton";
import { createCarIndex } from "@/components/garage/carIndex";
import {
  CATEGORY_LABEL,
  DIFFICULTY_HINT,
  DIFFICULTY_LABEL,
  formatNumber,
  formatSeconds,
} from "@/components/garage/carLabels";
import { HydrationGate } from "@/components/providers";
import { clamp, getEffectiveStats, STOCK_UPGRADES } from "@/lib/economy";
import {
  IDLE_RPM,
  RACE_DISTANCE_M,
  SHIFT_TIME_DELTA,
  estimateBestTime,
  getGearCount,
  getGearWindows,
  getRedlineRpm,
  getShiftCount,
  getShiftQuality,
} from "@/lib/raceEngine";
import { getRaceOpponents, runRace } from "@/services/raceService";
import type { OpponentOption } from "@/services/raceService";
import { selectProfile, useGameStore } from "@/store";
import type { Car } from "@/types/car";
import type {
  RaceDifficulty,
  RaceResult,
  ShiftEvent,
  ShiftQuality,
} from "@/types/race";
import { RaceResultModal } from "./RaceResultModal";
import { RaceTrack } from "./RaceTrack";
import { RpmGauge } from "./RpmGauge";
import { ShiftButton } from "./ShiftButton";

type Phase = "setup" | "staging" | "running" | "result";

const DIFFICULTIES: readonly RaceDifficulty[] = ["rookie", "pro", "elite"];

const SHIFT_FEEDBACK: Record<ShiftQuality, { text: string; className: string }> =
  {
    perfect: { text: "Perfect", className: "text-win" },
    good: { text: "Bun", className: "text-caution" },
    early: { text: "Prea devreme", className: "text-lose" },
    late: { text: "Prea târziu", className: "text-lose" },
  };

/** Starea mutabilă a cursei. Trăiește într-un ref: se scrie la 60fps. */
interface RunState {
  rpm: number;
  gear: number;
  shifts: ShiftEvent[];
  reaction: number;
  startTime: number;
  lastFrame: number;
  finished: boolean;
}

function createRunState(reaction: number): RunState {
  return {
    rpm: IDLE_RPM,
    gear: 1,
    shifts: [],
    reaction,
    startTime: 0,
    lastFrame: 0,
    finished: false,
  };
}

function RaceBody({ cars }: { cars: readonly Car[] }): ReactElement {
  const profile = useGameStore(selectProfile);
  const index = useMemo(() => createCarIndex(cars), [cars]);

  const ownedCar =
    profile.ownedCars.find((entry) => entry.carId === profile.selectedCarId) ??
    profile.ownedCars[0] ??
    null;
  const playerCar =
    ownedCar === null ? null : (index.get(ownedCar.carId) ?? null);
  const upgrades = ownedCar?.upgrades ?? STOCK_UPGRADES;

  const [opponents, setOpponents] = useState<OpponentOption[] | null>(null);
  const [difficulty, setDifficulty] = useState<RaceDifficulty>("rookie");
  const [phase, setPhase] = useState<Phase>("setup");
  const [lights, setLights] = useState(0);
  const [isGreen, setIsGreen] = useState(false);
  const [jumpStart, setJumpStart] = useState(false);
  const [result, setResult] = useState<RaceResult | null>(null);
  /** Adversarul folosit efectiv în cursa încheiată (lista se poate reîmprospăta). */
  const [resultOpponent, setResultOpponent] = useState<Car | null>(null);
  const [raceError, setRaceError] = useState<string | null>(null);

  /* ---------------- date de cursă, stabile pe durata unei runde --------- */

  const windows = useMemo(
    () => (playerCar === null ? [] : getGearWindows(playerCar, upgrades)),
    [playerCar, upgrades],
  );
  const redline = playerCar === null ? 8000 : getRedlineRpm(playerCar, upgrades);
  const scaleMax = redline * 1.15;
  const shiftCount = playerCar === null ? 0 : getShiftCount(playerCar);
  const gearCount = playerCar === null ? 1 : getGearCount(playerCar);
  const playerReference =
    playerCar === null ? 12 : estimateBestTime(playerCar, upgrades) + 0.6;

  const activeOpponent =
    opponents?.find((option) => option.difficulty === difficulty) ?? null;

  /* --------------------------- ref-uri de DOM --------------------------- */

  const fillRef = useRef<HTMLDivElement | null>(null);
  const bandRef = useRef<HTMLDivElement | null>(null);
  const rpmTextRef = useRef<HTMLSpanElement | null>(null);
  const gearTextRef = useRef<HTMLSpanElement | null>(null);
  const timeTextRef = useRef<HTMLSpanElement | null>(null);
  const distanceTextRef = useRef<HTMLSpanElement | null>(null);
  const feedbackRef = useRef<HTMLParagraphElement | null>(null);
  const playerMarkerRef = useRef<HTMLDivElement | null>(null);
  const opponentMarkerRef = useRef<HTMLDivElement | null>(null);

  /** Starea cursei se creeaza abia la lansare, niciodata in timpul randarii. */
  const runRef = useRef<RunState | null>(null);
  const rafRef = useRef<number | null>(null);
  const greenAtRef = useRef<number>(0);
  const opponentRef = useRef<OpponentOption | null>(null);
  const submittingRef = useRef(false);

  /* ------------------------- încărcarea adversarilor -------------------- */

  useEffect(() => {
    let active = true;
    void getRaceOpponents(profile).then((options) => {
      if (active) setOpponents(options);
    });
    return () => {
      active = false;
    };
  }, [profile]);

  /* ------------------------------ pictura ------------------------------- */

  const paintBand = useCallback(() => {
    const band = bandRef.current;
    const run = runRef.current;
    const window_ = run === null ? undefined : windows[run.gear - 1];
    if (band === null || window_ === undefined) return;
    const left = (window_.optimalMinRpm / scaleMax) * 100;
    const width =
      ((window_.optimalMaxRpm - window_.optimalMinRpm) / scaleMax) * 100;
    band.style.left = `${left}%`;
    band.style.width = `${width}%`;
  }, [windows, scaleMax]);

  const showFeedback = useCallback(
    (quality: ShiftQuality) => {
      const node = feedbackRef.current;
      if (node === null) return;
      const meta = SHIFT_FEEDBACK[quality];
      const delta = SHIFT_TIME_DELTA[quality];
      node.className = cn(
        "mt-2 h-6 font-display text-sm font-semibold uppercase tracking-[0.08em]",
        meta.className,
      );
      node.textContent = `${meta.text} ${delta > 0 ? "+" : "−"}${Math.abs(
        delta,
      ).toFixed(2)} s`;
    },
    [],
  );

  /* ------------------------ finalul cursei ------------------------------ */

  const finishRace = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const opponent = opponentRef.current;
    const run = runRef.current;
    const store = useGameStore.getState();
    if (opponent === null || run === null) {
      submittingRef.current = false;
      return;
    }

    try {
      const { result: raceResult } = await runRace({
        profile: store.profile,
        opponentCarId: opponent.car.id,
        difficulty: opponent.difficulty,
        shifts: run.shifts,
        reactionTime: run.reaction,
      });
      // Serviciul doar calculează; store-ul aplică recompensele și salvează.
      await store.recordRaceResult(raceResult);
      setResultOpponent(opponent.car);
      setResult(raceResult);
      setPhase("result");
    } catch {
      setRaceError(
        "Cursa nu a putut fi finalizată. Verifică mașina activă din garaj.",
      );
      setPhase("setup");
    } finally {
      submittingRef.current = false;
    }
  }, []);

  /* --------------------------- shift-ul --------------------------------- */

  const applyShift = useCallback(
    (forced: boolean) => {
      const run = runRef.current;
      if (run === null || run.finished || phase !== "running") return;
      const window_ = windows[run.gear - 1];
      if (window_ === undefined) return;

      // Supraturarea peste limitator e evaluată tot de motor: „late".
      const quality: ShiftQuality = forced
        ? "late"
        : getShiftQuality(run.rpm, window_);
      run.shifts.push({
        fromGear: run.gear,
        quality,
        rpm: Math.round(run.rpm),
      });
      showFeedback(quality);

      if (run.shifts.length >= shiftCount) {
        run.finished = true;
        void finishRace();
        return;
      }

      run.gear += 1;
      // Căderea de turație la cuplarea treptei următoare.
      run.rpm = Math.max(IDLE_RPM, run.rpm * 0.62);
      paintBand();
      const gearNode = gearTextRef.current;
      if (gearNode !== null) gearNode.textContent = String(run.gear);
    },
    [phase, windows, shiftCount, showFeedback, paintBand, finishRace],
  );

  /* ------------------------- bucla de animație -------------------------- */

  useEffect(() => {
    if (phase !== "running" || playerCar === null || activeOpponent === null) {
      return;
    }

    const run = runRef.current;
    if (run === null) return;
    const now0 = performance.now();
    run.startTime = now0;
    run.lastFrame = now0;
    paintBand();

    const opponentReference = Math.max(6, activeOpponent.estimatedTime);

    const loop = (now: number) => {
      const state = runRef.current;
      if (state === null) return;
      const dt = Math.min(0.05, (now - state.lastFrame) / 1000);
      state.lastFrame = now;

      const window_ = windows[state.gear - 1];
      if (window_ !== undefined) {
        state.rpm += window_.rpmRisePerSecond * dt;
        const hardLimit = window_.redlineRpm * 1.12;
        if (state.rpm >= hardLimit) {
          // Motorul lovește limitatorul: shift forțat, penalizat ca „late".
          state.rpm = hardLimit;
          applyShift(true);
        }
      }

      const elapsed = (now - state.startTime) / 1000;
      const playerProgress = clamp(elapsed / playerReference, 0, 1);
      const opponentProgress = clamp(elapsed / opponentReference, 0, 1);

      const fill = fillRef.current;
      if (fill !== null) {
        const pct = clamp((state.rpm / scaleMax) * 100, 0, 100);
        fill.style.width = `${pct}%`;
        fill.style.backgroundColor =
          state.rpm > (window_?.redlineRpm ?? redline)
            ? "var(--color-lose)"
            : window_ !== undefined && state.rpm >= window_.optimalMinRpm
              ? "var(--color-win)"
              : "var(--color-accent)";
      }
      const rpmNode = rpmTextRef.current;
      if (rpmNode !== null) rpmNode.textContent = String(Math.round(state.rpm));
      const timeNode = timeTextRef.current;
      if (timeNode !== null) timeNode.textContent = elapsed.toFixed(2);
      const distNode = distanceTextRef.current;
      if (distNode !== null) {
        distNode.textContent = String(
          Math.round(playerProgress * RACE_DISTANCE_M),
        );
      }
      const playerMarker = playerMarkerRef.current;
      if (playerMarker !== null) {
        playerMarker.style.left = `calc(${playerProgress * 100}% - ${
          playerProgress * 32
        }px)`;
      }
      const opponentMarker = opponentMarkerRef.current;
      if (opponentMarker !== null) {
        opponentMarker.style.left = `calc(${opponentProgress * 100}% - ${
          opponentProgress * 32
        }px)`;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [
    phase,
    playerCar,
    activeOpponent,
    windows,
    scaleMax,
    playerReference,
    redline,
    paintBand,
    applyShift,
  ]);

  /* ----------------------------- staging -------------------------------- */

  useEffect(() => {
    if (phase !== "staging") return;
    const timers: number[] = [];
    for (let i = 1; i <= 3; i++) {
      timers.push(window.setTimeout(() => setLights(i), 600 * i));
    }
    timers.push(
      window.setTimeout(
        () => {
          setIsGreen(true);
          greenAtRef.current = performance.now();
        },
        600 * 3 + 500 + Math.random() * 700,
      ),
    );
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [phase]);

  const startStaging = useCallback(() => {
    if (activeOpponent === null) return;
    opponentRef.current = activeOpponent;
    setRaceError(null);
    setResult(null);
    setJumpStart(false);
    setLights(0);
    setIsGreen(false);
    runRef.current = null;
    setPhase("staging");
  }, [activeOpponent]);

  const handleLaunch = useCallback(() => {
    if (phase !== "staging") return;
    let reaction = 0.9;
    if (isGreen) {
      reaction = clamp(
        (performance.now() - greenAtRef.current) / 1000,
        0.1,
        1.5,
      );
    } else {
      setJumpStart(true);
    }
    runRef.current = createRunState(reaction);
    setPhase("running");
  }, [phase, isGreen]);

  const handleRematch = useCallback(() => {
    setResult(null);
    setPhase("setup");
  }, []);

  /* ------------------------------ randare ------------------------------- */

  if (playerCar === null || ownedCar === null) {
    return (
      <EmptyState
        icon={<GarageIcon weight="duotone" className="size-7" />}
        title="Nicio mașină activă"
        description="Alege o mașină din garaj înainte de a intra pe linia de start."
        action={
          <LinkButton href="/garage" variant="primary">
            Deschide garajul
          </LinkButton>
        }
      />
    );
  }

  const playerStats = getEffectiveStats(playerCar, upgrades);
  const opponentStats =
    activeOpponent === null
      ? null
      : getEffectiveStats(activeOpponent.car, activeOpponent.upgrades);
  const droppedCar =
    result?.droppedCarId == null
      ? null
      : (index.get(result.droppedCarId) ?? null);
  const trackOpponent =
    phase === "result" ? resultOpponent : (activeOpponent?.car ?? null);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">Drag Race · 400 m</h1>
          <p className="mt-1 text-sm text-fg-3">
            Reacție la semafor, apoi {shiftCount} schimbări de treaptă în
            fereastra verde.
          </p>
        </div>
        {phase === "setup" ? (
          <LinkButton href={`/garage/${playerCar.id}`} variant="ghost" size="sm">
            Schimbă mașina
          </LinkButton>
        ) : null}
      </header>

      {raceError !== null ? (
        <Card padding="sm" className="border-lose/40">
          <p className="text-sm text-lose">{raceError}</p>
        </Card>
      ) : null}

      {phase === "setup" ? (
        <>
          <section>
            <h2 className="mb-3 text-xl">Alege adversarul</h2>
            {opponents === null ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <Skeleton height={132} />
                <Skeleton height={132} />
                <Skeleton height={132} />
              </div>
            ) : (
              <div
                role="radiogroup"
                aria-label="Dificultate"
                className="grid gap-3 sm:grid-cols-3"
              >
                {DIFFICULTIES.map((level) => {
                  const option = opponents.find(
                    (item) => item.difficulty === level,
                  );
                  if (option === undefined) return null;
                  const active = difficulty === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setDifficulty(level)}
                      className={cn(
                        "flex flex-col gap-1 rounded-lg border p-4 text-left transition-colors duration-150 ease-out-quick",
                        active
                          ? "border-accent bg-accent-wash"
                          : "border-line bg-surface hover:border-line-strong hover:bg-surface-2",
                      )}
                    >
                      <span className="font-display text-base font-bold uppercase tracking-[0.06em] text-fg">
                        {DIFFICULTY_LABEL[level]}
                      </span>
                      <span className="text-xs text-fg-3">
                        {DIFFICULTY_HINT[level]}
                      </span>
                      <span className="mt-2 truncate text-sm font-semibold text-fg-2">
                        {option.car.brand} {option.car.name}
                      </span>
                      <span className="font-display text-xs font-semibold text-fg-3 tnum">
                        Rating {option.rating} · ~
                        {formatSeconds(option.estimatedTime)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card title="Mașina ta" padding="md" as="section">
              <CarSilhouette
                accentColor={playerCar.accentColor}
                rarity={normalizeRarity(playerCar.rarity)}
                alt={`${playerCar.brand} ${playerCar.name}`}
                className="mb-3 rounded-md bg-bg px-3 py-4"
              />
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-fg">
                  {playerCar.brand} {playerCar.name}
                </h3>
                <RarityBadge
                  rarity={normalizeRarity(playerCar.rarity)}
                  size="sm"
                />
              </div>
              <p className="mt-0.5 text-xs text-fg-3">
                {CATEGORY_LABEL[playerCar.category]} ·{" "}
                {formatNumber(playerStats.powerHp)} CP · {gearCount} trepte
              </p>
              <div className="mt-3 flex flex-col gap-1.5">
                <StatBar
                  label="Viteză"
                  value={playerStats.topSpeed}
                  size="sm"
                />
                <StatBar
                  label="Accelerație"
                  value={playerStats.acceleration}
                  size="sm"
                />
                <StatBar
                  label="Handling"
                  value={playerStats.handling}
                  size="sm"
                />
                <StatBar label="Frânare" value={playerStats.braking} size="sm" />
              </div>
            </Card>

            <Card title="Adversar" padding="md" as="section">
              {activeOpponent === null || opponentStats === null ? (
                <Skeleton height={240} />
              ) : (
                <>
                  <CarSilhouette
                    accentColor={activeOpponent.car.accentColor}
                    rarity={normalizeRarity(activeOpponent.car.rarity)}
                    alt={`${activeOpponent.car.brand} ${activeOpponent.car.name}`}
                    className="mb-3 rounded-md bg-bg px-3 py-4"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-fg">
                      {activeOpponent.car.brand} {activeOpponent.car.name}
                    </h3>
                    <RarityBadge
                      rarity={normalizeRarity(activeOpponent.car.rarity)}
                      size="sm"
                    />
                  </div>
                  <p className="mt-0.5 text-xs text-fg-3">
                    {CATEGORY_LABEL[activeOpponent.car.category]} ·{" "}
                    {formatNumber(opponentStats.powerHp)} CP
                  </p>
                  <div className="mt-3 flex flex-col gap-1.5">
                    <StatBar
                      label="Viteză"
                      value={opponentStats.topSpeed}
                      size="sm"
                    />
                    <StatBar
                      label="Accelerație"
                      value={opponentStats.acceleration}
                      size="sm"
                    />
                    <StatBar
                      label="Handling"
                      value={opponentStats.handling}
                      size="sm"
                    />
                    <StatBar
                      label="Frânare"
                      value={opponentStats.braking}
                      size="sm"
                    />
                  </div>
                </>
              )}
            </Card>
          </section>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={activeOpponent === null}
            onClick={startStaging}
            iconRight={
              <ArrowRightIcon
                weight="bold"
                className="size-4"
                aria-hidden="true"
              />
            }
          >
            La linia de start
          </Button>
        </>
      ) : null}

      {phase === "staging" ? (
        <section className="flex flex-col items-center gap-6 rounded-lg border border-line bg-surface p-6">
          <div className="flex gap-3" aria-hidden="true">
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={cn(
                  "size-10 rounded-full border transition-colors duration-150",
                  isGreen
                    ? "border-line bg-track"
                    : lights >= n
                      ? "border-caution bg-caution"
                      : "border-line bg-track",
                )}
              />
            ))}
            <span
              className={cn(
                "size-10 rounded-full border transition-colors duration-150",
                isGreen ? "border-win bg-win" : "border-line bg-track",
              )}
            />
          </div>
          <p
            aria-live="assertive"
            className="font-display text-2xl font-bold uppercase tracking-[0.08em] text-fg"
          >
            {isGreen ? "Pleacă!" : "Pregătit…"}
          </p>
          <p className="max-w-sm text-center text-sm text-fg-3">
            Apasă în momentul în care se aprinde verdele. Prea devreme = start
            furat și 0,90 s penalizare.
          </p>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            className="h-20 text-xl"
            onClick={handleLaunch}
          >
            Lansează
          </Button>
        </section>
      ) : null}

      {phase === "running" || phase === "result" ? (
        <div className="flex flex-col gap-4">
          {jumpStart ? (
            <p className="rounded-md border border-lose/40 bg-lose-wash px-3 py-2 text-sm text-lose">
              Start furat — 0,90 s penalizare de reacție.
            </p>
          ) : null}
          <RpmGauge
            fillRef={fillRef}
            bandRef={bandRef}
            rpmTextRef={rpmTextRef}
            gearTextRef={gearTextRef}
            timeTextRef={timeTextRef}
            distanceTextRef={distanceTextRef}
            feedbackRef={feedbackRef}
            redlineRpm={redline}
            scaleMaxRpm={scaleMax}
            gearCount={gearCount}
          />
          <RaceTrack
            playerLabel={`${playerCar.brand} ${playerCar.name}`}
            opponentLabel={
              trackOpponent === null
                ? "Adversar"
                : `${trackOpponent.brand} ${trackOpponent.name}`
            }
            playerColor={playerCar.accentColor}
            opponentColor={trackOpponent?.accentColor ?? "#7c8593"}
            playerRef={playerMarkerRef}
            opponentRef={opponentMarkerRef}
          />
          <ShiftButton
            onShift={() => applyShift(false)}
            disabled={phase !== "running"}
            hint={`${shiftCount} schimbări · fereastra verde`}
          />
        </div>
      ) : null}

      {phase === "setup" && profile.raceHistory.length > 0 ? (
        <Card title="Ultimele curse" as="section">
          <ul className="flex flex-col divide-y divide-line">
            {profile.raceHistory.slice(0, 5).map((race) => (
              <li
                key={race.id}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <FlagCheckeredIcon
                  weight={race.won ? "fill" : "regular"}
                  className={cn(
                    "size-4 shrink-0",
                    race.won ? "text-win" : "text-fg-disabled",
                  )}
                  aria-hidden="true"
                />
                <span className="flex-1 font-display text-sm text-fg-2 tnum">
                  {formatSeconds(race.playerTime)}
                </span>
                <span className="shrink-0 font-display text-xs font-semibold text-legendary tnum">
                  +{formatCoins(race.coinsEarned)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <RaceResultModal
        open={phase === "result" && result !== null}
        result={result}
        opponentCar={resultOpponent}
        droppedCar={droppedCar}
        onRematch={handleRematch}
        onClose={handleRematch}
      />
    </div>
  );
}

export function RaceClient({ cars }: { cars: readonly Car[] }): ReactElement {
  return (
    <HydrationGate
      fallback={
        <div className="flex flex-col gap-6">
          <Skeleton height={64} />
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton height={132} />
            <Skeleton height={132} />
            <Skeleton height={132} />
          </div>
          <Skeleton height={280} />
        </div>
      }
    >
      <RaceBody cars={cars} />
    </HydrationGate>
  );
}

export default RaceClient;
