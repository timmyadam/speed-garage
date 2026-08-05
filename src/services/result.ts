/**
 * Rezultat uniform pentru operațiile de „service” care pot eșua din motive
 * de business (bani insuficienți, nivel prea mic etc.).
 * Nu folosim excepții: UI-ul are nevoie de mesaj, nu de stack trace.
 */

export type ServiceError =
  | "car-not-found"
  | "car-already-owned"
  | "car-not-owned"
  | "level-too-low"
  | "not-enough-coins"
  | "upgrade-maxed"
  | "invalid-input";

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ServiceError; message: string };

/** Mesaje în română pentru fiecare cod de eroare. */
export const SERVICE_ERROR_MESSAGES: Record<ServiceError, string> = {
  "car-not-found": "Mașina nu există în catalog.",
  "car-already-owned": "Ai deja mașina asta în garaj.",
  "car-not-owned": "Nu deții mașina asta.",
  "level-too-low": "Nivelul tău este prea mic pentru mașina asta.",
  "not-enough-coins": "Nu ai destule monede.",
  "upgrade-maxed": "Piesa este deja la nivel maxim.",
  "invalid-input": "Date invalide.",
};

export function ok<T>(data: T): ServiceResult<T> {
  return { ok: true, data };
}

export function fail<T>(error: ServiceError): ServiceResult<T> {
  return { ok: false, error, message: SERVICE_ERROR_MESSAGES[error] };
}
