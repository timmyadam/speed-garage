/**
 * Wrapper tipizat peste localStorage.
 *
 * Reguli:
 *  - orice acces la `window` este protejat (`typeof window === "undefined"`),
 *    ca modulul să poată fi importat și dintr-un Server Component;
 *  - orice operație e într-un try/catch: în Safari privat / quota plină
 *    localStorage aruncă, iar jocul nu are voie să crape din cauza asta;
 *  - datele salvate au un `version`; la citire trec printr-un lanț de migrări
 *    până la `SCHEMA_VERSION`, apoi prin normalizare defensivă.
 */

import { normalizeProfile } from "@/lib/profile";
import type { PlayerProfile } from "@/types/player";

/** Cheia unică sub care trăiește tot salvarea jocului. */
export const STORAGE_KEY = "speed-garage:save";

/**
 * Versiunea curentă a schemei.
 * Istoric:
 *   v1 — profil fără `duelHistory`/`quizHistory` și fără `stats.upgradesPurchased`
 *   v2 — schema curentă (istorice separate pe mod de joc, stats complete)
 */
export const SCHEMA_VERSION = 2;

/** Forma exactă a obiectului serializat. */
export interface StoredSave {
  version: number;
  savedAt: number;
  profile: PlayerProfile;
}

/** Rezultatul unei încărcări, cu informație de diagnostic pentru UI. */
export interface LoadResult {
  profile: PlayerProfile | null;
  /** true dacă datele au fost aduse dintr-o versiune mai veche de schemă. */
  migrated: boolean;
  /** Setat dacă citirea a eșuat (storage indisponibil, JSON corupt etc.). */
  error: string | null;
}

/** Există localStorage utilizabil în contextul curent? */
export function isStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const probe = "__speed_garage_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* MIGRĂRI                                                             */
/* ------------------------------------------------------------------ */

type MigrationStep = (data: Record<string, unknown>) => Record<string, unknown>;

/**
 * Lanțul de migrări: cheia `n` transformă datele de la versiunea `n` la `n+1`.
 * Fiecare pas primește obiectul BRUT (nu tipat), pentru că forma veche nu mai
 * corespunde tipurilor curente.
 */
const MIGRATIONS: Record<number, MigrationStep> = {
  // v1 -> v2: istoricul era un singur array `history`; îl împărțim pe moduri
  // și completăm contorii noi din `stats`.
  1: (data) => {
    const legacyHistory = Array.isArray(data.history) ? data.history : [];
    const stats =
      typeof data.stats === "object" && data.stats !== null
        ? (data.stats as Record<string, unknown>)
        : {};
    return {
      ...data,
      raceHistory: Array.isArray(data.raceHistory)
        ? data.raceHistory
        : legacyHistory,
      duelHistory: Array.isArray(data.duelHistory) ? data.duelHistory : [],
      quizHistory: Array.isArray(data.quizHistory) ? data.quizHistory : [],
      stats: {
        ...stats,
        upgradesPurchased: stats.upgradesPurchased ?? 0,
        carsPurchased: stats.carsPurchased ?? 0,
      },
    };
  },
};

/**
 * Aplică toate migrările necesare peste profilul brut.
 * Exportată separat ca să poată fi testată fără localStorage.
 */
export function migrateProfile(
  rawProfile: unknown,
  fromVersion: number,
): { profile: PlayerProfile | null; migrated: boolean } {
  if (typeof rawProfile !== "object" || rawProfile === null) {
    return { profile: null, migrated: false };
  }

  let data = rawProfile as Record<string, unknown>;
  let version = Number.isFinite(fromVersion) ? Math.floor(fromVersion) : 1;
  let migrated = false;

  while (version < SCHEMA_VERSION) {
    const step = MIGRATIONS[version];
    if (step === undefined) break; // versiune necunoscută: mergem pe normalizare
    data = step(data);
    version += 1;
    migrated = true;
  }

  return { profile: normalizeProfile(data), migrated };
}

/* ------------------------------------------------------------------ */
/* API PUBLIC                                                          */
/* ------------------------------------------------------------------ */

/** Citește profilul salvat. Nu aruncă niciodată. */
export async function loadProfile(): Promise<LoadResult> {
  if (typeof window === "undefined") {
    return { profile: null, migrated: false, error: null };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return { profile: null, migrated: false, error: null };

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return { profile: null, migrated: false, error: "Format necunoscut." };
    }

    const save = parsed as Partial<StoredSave>;
    const version = typeof save.version === "number" ? save.version : 1;
    const { profile, migrated } = migrateProfile(save.profile, version);

    return { profile, migrated, error: null };
  } catch (error) {
    return {
      profile: null,
      migrated: false,
      error: error instanceof Error ? error.message : "Eroare la citire.",
    };
  }
}

/** Scrie profilul. Întoarce false dacă scrierea a eșuat (quota, private mode). */
export async function saveProfile(profile: PlayerProfile): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const payload: StoredSave = {
      version: SCHEMA_VERSION,
      savedAt: Date.now(),
      profile,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

/** Șterge salvarea (reset progres). */
export async function clearProfile(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/** Export brut al salvării, pentru un eventual buton „descarcă progresul”. */
export async function exportSave(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
