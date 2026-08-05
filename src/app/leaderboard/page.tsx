import type { Metadata } from "next";
import type { ReactElement } from "react";
import { LeaderboardClient } from "@/components/dashboard/LeaderboardClient";
import { getCars } from "@/services/carService";

export const metadata: Metadata = {
  title: "Clasament",
  description:
    "Clasamentul global după XP total, cu rândul tău evidențiat printre rivalii simulați.",
};

export default async function LeaderboardPage(): Promise<ReactElement> {
  const cars = await getCars();
  return <LeaderboardClient cars={cars} />;
}
