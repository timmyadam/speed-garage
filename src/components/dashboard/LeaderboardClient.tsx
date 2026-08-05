"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import { Card, Skeleton, cn } from "@/components/common";
import { createCarIndex } from "@/components/garage/carIndex";
import { formatNumber } from "@/components/garage/carLabels";
import { HydrationGate } from "@/components/providers";
import { getLeaderboard } from "@/services/playerService";
import { selectProfile, useGameStore } from "@/store";
import type { Car } from "@/types/car";
import type { LeaderboardEntry } from "@/types/player";

function LeaderboardBody({ cars }: { cars: readonly Car[] }): ReactElement {
  const profile = useGameStore(selectProfile);
  const index = useMemo(() => createCarIndex(cars), [cars]);
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);

  useEffect(() => {
    let active = true;
    void getLeaderboard(profile).then((rows) => {
      if (active) setEntries(rows);
    });
    return () => {
      active = false;
    };
  }, [profile]);

  const playerRank =
    entries === null
      ? null
      : entries.findIndex((entry) => entry.isPlayer) + 1 || null;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl">Clasament</h1>
        <p className="mt-1 text-sm text-fg-3">
          {playerRank === null
            ? "Se calculează poziția ta…"
            : `Ești pe locul ${playerRank} din ${entries?.length ?? 0}, după XP total.`}
        </p>
      </header>

      <Card padding="none" as="section">
        {entries === null ? (
          <div className="p-4">
            <Skeleton variant="text" lines={8} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-full text-left text-sm">
              <caption className="sr-only">
                Clasament global după XP total
              </caption>
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-[0.08em] text-fg-3">
                  <th scope="col" className="w-12 px-3 py-2.5 text-right">
                    #
                  </th>
                  <th scope="col" className="px-3 py-2.5">
                    Jucător
                  </th>
                  <th scope="col" className="w-16 px-3 py-2.5 text-right">
                    Nivel
                  </th>
                  <th
                    scope="col"
                    className="hidden w-20 px-3 py-2.5 text-right sm:table-cell"
                  >
                    Curse
                  </th>
                  <th scope="col" className="w-24 px-3 py-2.5 text-right">
                    XP total
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, position) => {
                  const rank = position + 1;
                  const car = index.get(entry.favoriteCarId);
                  return (
                    <tr
                      key={entry.id}
                      className={cn(
                        "border-b border-line last:border-b-0",
                        entry.isPlayer
                          ? "border-accent-line bg-accent-wash"
                          : "hover:bg-surface-2",
                      )}
                    >
                      <td
                        className={cn(
                          "px-3 py-2.5 text-right font-display font-bold tnum",
                          rank <= 3 ? "text-legendary" : "text-fg-3",
                        )}
                      >
                        {rank}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "block truncate font-semibold",
                            entry.isPlayer ? "text-accent" : "text-fg",
                          )}
                        >
                          {entry.name}
                          {entry.isPlayer ? (
                            <span className="ml-2 font-display text-[10px] uppercase tracking-[0.12em] text-accent">
                              tu
                            </span>
                          ) : null}
                        </span>
                        <span className="block truncate text-xs text-fg-3">
                          {car === undefined
                            ? "—"
                            : `${car.brand} ${car.name}`}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-display font-semibold text-fg-2 tnum">
                        {entry.level}
                      </td>
                      <td className="hidden px-3 py-2.5 text-right font-display font-semibold text-fg-2 tnum sm:table-cell">
                        {formatNumber(entry.racesWon)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-display font-semibold text-fg tnum">
                        {formatNumber(entry.totalXp)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export function LeaderboardClient({
  cars,
}: {
  cars: readonly Car[];
}): ReactElement {
  return (
    <HydrationGate
      fallback={
        <div className="flex flex-col gap-6">
          <Skeleton height={64} />
          <Skeleton height={400} />
        </div>
      }
    >
      <LeaderboardBody cars={cars} />
    </HydrationGate>
  );
}

export default LeaderboardClient;
