"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactElement,
} from "react";
import {
  CheckIcon,
  FlagCheckeredIcon,
  LockSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
  Button,
  Card,
  EmptyState,
  Modal,
  ProgressBar,
  Skeleton,
  XpBar,
  cn,
  formatCoins,
} from "@/components/common";
import { createCarIndex } from "@/components/garage/carIndex";
import {
  formatDate,
  formatNumber,
  formatSeconds,
} from "@/components/garage/carLabels";
import { HydrationGate } from "@/components/providers";
import { getAchievementProgress } from "@/lib/achievements";
import { getProfileSummary } from "@/services/playerService";
import type { ProfileSummary } from "@/services/playerService";
import { selectProfile, useGameStore } from "@/store";
import type { Car } from "@/types/car";
import { ACHIEVEMENT_LIST, AchievementIcon } from "./achievementMeta";
import { LinkButton } from "./LinkButton";

function ProfileBody({ cars }: { cars: readonly Car[] }): ReactElement {
  const profile = useGameStore(selectProfile);
  const renamePlayer = useGameStore((state) => state.renamePlayer);
  const resetProgress = useGameStore((state) => state.resetProgress);
  const storageError = useGameStore((state) => state.storageError);

  const index = useMemo(() => createCarIndex(cars), [cars]);
  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  /** null = câmpul urmărește numele din profil; string = jucătorul a tastat. */
  const [draftName, setDraftName] = useState<string | null>(null);
  const name = draftName ?? profile.name;
  const [isSaved, setIsSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    let active = true;
    void getProfileSummary(profile).then((value) => {
      if (active) setSummary(value);
    });
    return () => {
      active = false;
    };
  }, [profile]);

  const unlockedIds = new Set(profile.achievements.map((entry) => entry.id));

  const handleRename = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await renamePlayer(name);
    setDraftName(null);
    setIsSaved(true);
    window.setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl">Profil</h1>

      {storageError !== null ? (
        <Card padding="sm" className="border-caution/40">
          <p className="text-sm text-caution">
            Progresul nu poate fi salvat: {storageError}
          </p>
        </Card>
      ) : null}

      <Card padding="lg" chamfer as="section">
        <form
          onSubmit={(event) => void handleRename(event)}
          className="flex flex-wrap items-end gap-3"
        >
          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-xs text-fg-3">Numele pilotului</span>
            <input
              type="text"
              value={name}
              maxLength={24}
              onChange={(event) => setDraftName(event.target.value)}
              className="h-11 w-full rounded-md border border-line-strong bg-surface-2 px-3 text-sm text-fg transition-colors duration-150 hover:border-fg-3"
            />
          </label>
          <Button
            type="submit"
            variant="secondary"
            disabled={name.trim().length === 0 || name === profile.name}
            icon={
              isSaved ? (
                <CheckIcon
                  weight="bold"
                  className="size-4 text-win"
                  aria-hidden="true"
                />
              ) : undefined
            }
          >
            {isSaved ? "Salvat" : "Salvează"}
          </Button>
        </form>

        <div className="mt-5">
          <XpBar
            level={profile.level}
            xp={profile.xp}
            xpForNextLevel={summary?.xpToNextLevel ?? 100}
          />
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            {
              label: "Monede",
              value: formatCoins(profile.coins),
              tone: "text-legendary",
            },
            {
              label: "Mașini",
              value: formatNumber(profile.ownedCars.length),
              tone: "text-fg",
            },
            {
              label: "Curse",
              value: formatNumber(profile.stats.racesPlayed),
              tone: "text-fg",
            },
            {
              label: "Rată de victorie",
              value: `${Math.round((summary?.winRate ?? 0) * 100)}%`,
              tone: "text-win",
            },
          ].map((item) => (
            <div key={item.label}>
              <dt className="text-xs text-fg-3">{item.label}</dt>
              <dd
                className={cn(
                  "font-display text-xl font-bold tnum",
                  item.tone,
                )}
              >
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <section>
        <h2 className="mb-3 text-xl">
          Realizări{" "}
          <span className="text-fg-3">
            ({profile.achievements.length} din {ACHIEVEMENT_LIST.length})
          </span>
        </h2>
        <ul className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
          {ACHIEVEMENT_LIST.map((achievement) => {
            const progress = getAchievementProgress(profile, achievement);
            const unlocked = unlockedIds.has(achievement.id);
            const unlockedAt = profile.achievements.find(
              (entry) => entry.id === achievement.id,
            )?.unlockedAt;

            return (
              <li
                key={achievement.id}
                className={cn(
                  "flex flex-col gap-2 rounded-lg border p-4",
                  unlocked
                    ? "border-legendary/35 bg-legendary-wash"
                    : "border-line bg-surface",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-sm border",
                    unlocked
                      ? "border-legendary/30 text-legendary"
                      : "border-line text-fg-disabled",
                  )}
                >
                  {unlocked ? (
                    <AchievementIcon
                      name={achievement.icon}
                      className="size-5"
                    />
                  ) : (
                    <LockSimpleIcon
                      weight="duotone"
                      className="size-5"
                      aria-hidden="true"
                    />
                  )}
                </span>
                <p className="text-sm font-bold text-fg">{achievement.name}</p>
                <p className="text-xs text-fg-3">{achievement.description}</p>

                {unlocked ? (
                  <p className="mt-auto font-display text-xs font-semibold text-legendary tnum">
                    {unlockedAt === undefined
                      ? "Deblocată"
                      : `Deblocată ${formatDate(unlockedAt)}`}
                  </p>
                ) : (
                  <div className="mt-auto pt-1">
                    <ProgressBar
                      value={progress.ratio * 100}
                      tone="neutral"
                      size="xs"
                      ariaLabel={`Progres pentru ${achievement.name}`}
                    />
                    <p className="mt-1 font-display text-[11px] font-semibold text-fg-3 tnum">
                      {achievement.condition.type === "quarterMileUnder"
                        ? `${
                            Number.isFinite(progress.current)
                              ? formatSeconds(progress.current)
                              : "—"
                          } · țintă sub ${progress.target} s`
                        : `${formatNumber(
                            Math.min(progress.current, progress.target),
                          )} / ${formatNumber(progress.target)}`}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl">Istoric curse</h2>
        {profile.raceHistory.length === 0 ? (
          <EmptyState
            icon={<FlagCheckeredIcon weight="duotone" className="size-7" />}
            title="Nicio cursă încă"
            description="Istoricul se completează după prima ta cursă de drag."
            action={
              <LinkButton href="/race" variant="primary">
                Prima ta cursă
              </LinkButton>
            }
          />
        ) : (
          <Card padding="none" as="section">
            <ul className="flex flex-col divide-y divide-line">
              {profile.raceHistory.map((race) => {
                const car = index.get(race.playerCarId);
                return (
                  <li
                    key={race.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3"
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
                    <span className="min-w-0 flex-1 truncate text-sm text-fg-2">
                      {car === undefined
                        ? race.playerCarId
                        : `${car.brand} ${car.name}`}
                    </span>
                    <span className="font-display text-sm text-fg tnum">
                      {formatSeconds(race.playerTime)}
                    </span>
                    <span className="font-display text-xs font-semibold text-legendary tnum">
                      +{formatCoins(race.coinsEarned)}
                    </span>
                    <span className="w-full text-xs text-fg-disabled sm:w-auto">
                      {formatDate(race.playedAt)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xl">Zonă periculoasă</h2>
        <Card padding="md" as="section">
          <p className="text-sm text-fg-3">
            Resetarea șterge definitiv profilul salvat în browser: monede,
            mașini, upgrade-uri, realizări și istoric.
          </p>
          <div className="mt-4">
            <Button variant="danger" onClick={() => setConfirmReset(true)}>
              Resetează progresul
            </Button>
          </div>
        </Card>
      </section>

      <Modal
        open={confirmReset}
        onClose={() => {
          if (!isResetting) setConfirmReset(false);
        }}
        size="sm"
        tone="lose"
        title="Resetezi tot progresul?"
        description="Acțiunea nu poate fi anulată."
        footer={
          <>
            <Button
              variant="ghost"
              disabled={isResetting}
              onClick={() => setConfirmReset(false)}
            >
              Renunț
            </Button>
            <Button
              variant="danger"
              loading={isResetting}
              loadingLabel="Se resetează…"
              onClick={() => {
                setIsResetting(true);
                void resetProgress().finally(() => {
                  setIsResetting(false);
                  setConfirmReset(false);
                });
              }}
            >
              Șterge tot
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg-2">
          Vei porni de la zero: {formatCoins(2800)} monede și cele două mașini de
          start.
        </p>
      </Modal>
    </div>
  );
}

export function ProfileClient({ cars }: { cars: readonly Car[] }): ReactElement {
  return (
    <HydrationGate
      fallback={
        <div className="flex flex-col gap-6">
          <Skeleton height={64} />
          <Skeleton height={240} />
          <Skeleton height={320} />
        </div>
      }
    >
      <ProfileBody cars={cars} />
    </HydrationGate>
  );
}

export default ProfileClient;
