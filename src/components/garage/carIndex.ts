import type { Car } from "@/types/car";

/**
 * Catalogul ajunge în componentele client ca prop dintr-un Server Component
 * (o singură citire, la randarea paginii). Aici doar îl indexăm pentru căutări
 * O(1) după id, fără să atingem fișierele de date din UI.
 */
export function createCarIndex(cars: readonly Car[]): Map<string, Car> {
  return new Map(cars.map((car) => [car.id, car] as const));
}
