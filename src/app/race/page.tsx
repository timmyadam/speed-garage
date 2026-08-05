import type { Metadata } from "next";
import type { ReactElement } from "react";
import { RaceClient } from "@/components/race/RaceClient";
import { getCars } from "@/services/carService";

export const metadata: Metadata = {
  title: "Cursă",
  description:
    "Drag race pe 400 m: reacție la semafor, schimbări de treaptă în fereastra optimă și recompense în monede și XP.",
};

export default async function RacePage(): Promise<ReactElement> {
  const cars = await getCars();
  return <RaceClient cars={cars} />;
}
