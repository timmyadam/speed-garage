import type { ReactElement } from "react";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { getCars } from "@/services/carService";

/**
 * Server Component: catalogul (date statice) se citește o singură dată la
 * randare și ajunge ca prop în componenta client, care are nevoie de el doar
 * ca să rezolve id-urile din profil.
 */
export default async function HomePage(): Promise<ReactElement> {
  const cars = await getCars();
  return <Dashboard cars={cars} />;
}
