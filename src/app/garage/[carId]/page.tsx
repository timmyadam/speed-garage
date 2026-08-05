import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { CarDetailClient } from "@/components/garage/CarDetailClient";
import { getCarById, getCars } from "@/services/carService";

/** Catalogul e static, deci toate paginile de mașină pot fi pre-randate. */
export async function generateStaticParams(): Promise<{ carId: string }[]> {
  const cars = await getCars();
  return cars.map((car) => ({ carId: car.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/garage/[carId]">): Promise<Metadata> {
  const { carId } = await params;
  const car = await getCarById(carId);
  if (car === null) return { title: "Mașină inexistentă" };
  return {
    title: `${car.brand} ${car.name}`,
    description: `${car.powerHp} CP · ${car.weightKg} kg · 0–100 în ${car.zeroToHundred} s. Fișa tehnică și panoul de upgrade-uri.`,
  };
}

export default async function CarDetailPage({
  params,
}: PageProps<"/garage/[carId]">): Promise<ReactElement> {
  const { carId } = await params;
  const car = await getCarById(carId);
  if (car === null) notFound();
  return <CarDetailClient car={car} />;
}
