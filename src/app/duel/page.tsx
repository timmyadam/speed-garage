import type { Metadata } from "next";
import type { ReactElement } from "react";
import { DuelClient } from "@/components/duel/DuelClient";
import { getCars } from "@/services/carService";

export const metadata: Metadata = {
  title: "Duel",
  description:
    "Duel de statistici în stil Top Trumps: 5 categorii comparate cu o mașină din garajul tău.",
};

export default async function DuelPage(): Promise<ReactElement> {
  const cars = await getCars();
  return <DuelClient cars={cars} />;
}
