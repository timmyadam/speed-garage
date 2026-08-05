import type { Metadata } from "next";
import type { ReactElement } from "react";
import { GarageClient } from "@/components/garage/GarageClient";
import { getCars } from "@/services/carService";

export const metadata: Metadata = {
  title: "Garaj",
  description:
    "Colecția ta de mașini și magazinul complet: filtrează după raritate și categorie, cumpără și alege mașina activă.",
};

export default async function GaragePage(): Promise<ReactElement> {
  const cars = await getCars();
  return <GarageClient cars={cars} />;
}
