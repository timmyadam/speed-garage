import type { Metadata } from "next";
import type { ReactElement } from "react";
import { ProfileClient } from "@/components/dashboard/ProfileClient";
import { getCars } from "@/services/carService";

export const metadata: Metadata = {
  title: "Profil",
  description:
    "Nivelul, monedele, realizările și istoricul complet al curselor tale.",
};

export default async function ProfilePage(): Promise<ReactElement> {
  const cars = await getCars();
  return <ProfileClient cars={cars} />;
}
