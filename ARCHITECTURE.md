# Speed Garage — Arhitectură

Document scris de `backend-architect`. Descrie stratul de date, logica de joc și
contractul pe care îl consumă `frontend-developer`. **Nu există backend real**:
tot ce urmează rulează în browser, cu `localStorage` ca singură persistență.

---

## 1. Decizia de state management: Zustand

**Ales: Zustand 5, cu store unic compus din trei slice-uri.**

De ce nu Context + `useReducer`:

| Criteriu | Context + useReducer | Zustand |
|---|---|---|
| Re-randări | Orice update re-randează tot subarborele consumatorilor | Fiecare componentă se abonează prin selector, doar la ce citește |
| Acțiuni async | Cer thunk-uri scrise manual | Acțiunile sunt funcții async normale |
| Acces în afara React | Necesită ref-uri/hack-uri | `useGameStore.getState()` direct |
| Boilerplate | Provider + reducer + tipuri de acțiuni | O funcție `create()` |

Jocul are update-uri de mare frecvență (acul de RPM, cronometrul cursei) plus
componente permanente care citesc doar 1-2 valori (contorul de monede, bara de
XP din navbar). Modelul de selectori al Zustand este exact potrivit.

**Nu folosim middleware-ul `persist`.** Avem nevoie de:

- hidratare **explicită** (`hydrate()` + flag `isHydrated`), ca UI-ul să poată
  randa un skeleton și să evite hydration mismatch-ul Next.js (serverul nu are
  `localStorage`, deci prima randare trebuie să fie identică pe server și client);
- scriere **debounced** (400 ms) controlată de noi, pentru că o singură cursă
  produce 4-5 mutații consecutive de profil.

### Slice-uri

- `playerSlice` — profil, hidratare, monede, XP, level-up, reset, toast-uri.
- `garageSlice` — cumpărare, upgrade, selectare mașină, drop-uri.
- `gameSlice` — înregistrarea rezultatelor de cursă / duel / quiz.

Toate mutațiile trec printr-un singur punct, `commitProfile()` din
`store/persist.ts`, care: evaluează achievements → acordă recompensele lor →
programează salvarea debounced → întoarce profilul final.

---

## 2. Schema de date

```
PlayerProfile
├─ id, name, createdAt, updatedAt
├─ coins, xp (în nivelul curent), totalXp, level
├─ ownedCars: OwnedCar[]        // carId + upgrades {engine,turbo,tires,weight} 0-5
│                               // + acquiredAt, source, racesTotal/Won, bestQuarterMile
├─ selectedCarId
├─ achievements: { id, unlockedAt }[]
├─ raceHistory / duelHistory / quizHistory   // max 25 intrări fiecare, cele noi primele
└─ stats: PlayerStats           // contorii pe care se evaluează achievements
```

Catalogul (`Car`), întrebările (`QuizQuestion`), achievements-urile și rivalii
sunt **date statice**, nu ajung niciodată în `localStorage`; profilul reține doar
`carId`-uri. Așa putem rebalansa catalogul fără să invalidăm salvările.

Statisticile mașinilor sunt normalizate 0-100 (`topSpeed`, `acceleration`,
`handling`, `braking`) ca să poată fi randate direct ca progress bars.
Datele „reale” (CP, kg, 0-100, km/h) sunt separate și se folosesc în fișa tehnică
și în modelul fizic simplificat.

---

## 3. Persistență: versionare și migrare

- Cheie unică: `speed-garage:save`
- Payload: `{ version: number, savedAt: number, profile: PlayerProfile }`
- `SCHEMA_VERSION = 2`

Istoric:

- **v1** — un singur `history`, `stats` fără `upgradesPurchased` / `carsPurchased`.
- **v2** — istorice separate pe mod de joc, `stats` complet.

La citire:

1. `JSON.parse` în `try/catch` (mod privat Safari, quota, JSON corupt);
2. se aplică în lanț migrările din `MIGRATIONS` (cheia `n` duce datele de la
   versiunea `n` la `n+1`), până la `SCHEMA_VERSION`;
3. rezultatul trece prin `normalizeProfile()` — validare defensivă câmp cu câmp,
   cu fallback pe valori implicite; dacă profilul nu are nicio mașină, se
   consideră corupt și se pornește unul nou.

Toate accesele la `window` sunt protejate de `typeof window === "undefined"`,
deci modulele pot fi importate și din Server Components.

---

## 4. Matematica jocului

### 4.1 Cursă (drag race, 400 m)

```
timp_final = timp_de_bază(stats_efective)
           - bonus_putere/greutate
           + penalizare_tracțiune
           + penalizare_reacție
           + Σ delte_shift
```

- `timp_de_bază = 19.65 − 0.07 × acceleration − 0.03 × topSpeed`
  (calibrat: hot-hatch stock ≈ 15,9 s, hypercar ≈ 9 s — valori plauzibile pentru
  sfertul de milă).
- Bonus putere/greutate: `clamp((CP_per_tonă − 150) × 0.0012, −0.4, 1.0)` secunde.
- Tracțiune la lansare: FWD +0,15 s, RWD +0,05 s, AWD 0. EV primește −0,15 s
  pentru cuplul instantaneu.
- Reacție: `clamp(reacție − 0.25, −0.15, 0.9)`.
- Shift: `perfect −0.14 s`, `good −0.02 s`, `early +0.12 s`, `late +0.20 s`.
  Pe 6 trepte, diferența dintre o cursă impecabilă și una ratată este ~1,7 s —
  suficient cât abilitatea să compenseze o mașină puțin mai bună.
- Cutia de viteze: 6 trepte (7 la supercar/hypercar, 2 la EV), limitator pe
  categorie (6.500–8.600 rpm, 16.000 la EV, +100 rpm per nivel de motor).
  Fereastra „perfect” pornește la 93% din limitator, se îngustează cu 0,6% pe
  treaptă și se lărgește cu 0,8% pe nivel de anvelope.
- AI-ul: skill de shift 0,35 / 0,62 / 0,85 pe dificultate, reacție 0,42 / 0,30 /
  0,22 s, plus jitter ±0,18 s dintr-un RNG cu seed (curse reproductibile).

### 4.2 Duel (Top Trumps)

5 runde, ordine amestecată, pe `topSpeed / acceleration / handling / price /
rarity`. Statisticile folosesc valorile **efective** (upgrade-urile contează),
prețul și raritatea rămân la valorile de catalog. Adversarul se alege din catalog
cu rating apropiat (toleranță crescătoare 10 → 18 → 28 → 45 → 100). Egalitatea la
runde se departajează după ratingul general.

`rating = 0.34·topSpeed + 0.34·acceleration + 0.18·handling + 0.14·braking +
bonus_raritate (0/2/4/6)`.

### 4.3 Quiz

10 întrebări din 32, 15 s fiecare, streak pe răspunsuri corecte consecutive.

### 4.4 Economie

| Formulă | Valoare |
|---|---|
| Monede la start | **2.800** (prima mașină de 3.800 după 3-4 victorii) |
| XP per nivel | `100 × nivel^1.25` (L2 = 100, L10 ≈ 7.000 XP cumulat, L15 ≈ 18.200) |
| Multiplicator monede | `1 + 0.09 × (nivel − 1)` |
| Cursă | `(180/60 + rating×2.0/0.6 + precizie×70 + marjă×35) × dificultate × mult_nivel` |
| Duel | `(120/35 + runde×35 + rating×0.9/0.3) × mult_nivel` |
| Quiz | `(corecte×16 + streak×12 + 100 dacă perfect) × mult_nivel` |
| Upgrade | `preț_mașină × 0.032 × nivel^1.55 × mult_piesă` (motor 1,25 / turbo 1,15 / anvelope 0,9 / greutate 1,0) |
| Drop mașină rară | `3,5% + 0,06%/punct rating + 2% cursă perfectă`, plafon 12% |

Dificultate: rookie ×1,0, pro ×1,25, elite ×1,6.

Verificare de balans: victorie la nivel 1 ≈ 285-340 monede; la nivel 5 pe „pro”
≈ 560; la nivel 15 pe „elite” ≈ 1.550. Prețurile merg de la 2.200 (mașini de
start) la 320.000 (Koenigsegg Jesko), deci colecția completă rămâne un obiectiv
de endgame, nu ceva atins în prima oră.

---

## 5. Harta folderelor

```
src/
├─ types/                 modele TS, fără logică
│  ├─ car.ts              Car, CarStats, CarUpgrades, UpgradePart, UpgradeOption
│  ├─ player.ts           PlayerProfile, OwnedCar, PlayerStats, Achievement, LeaderboardEntry
│  ├─ quiz.ts             QuizQuestion, QuizAnswer, QuizResult
│  ├─ race.ts             ShiftEvent, GearWindow, RaceResult, DuelResult, Rewards
│  └─ index.ts            barrel
│
├─ data/                  date statice (mock)
│  ├─ cars.mock.ts        24 mașini + STARTER_CAR_IDS + CAR_INDEX
│  ├─ quiz.mock.ts        32 întrebări
│  ├─ achievements.mock.ts 10 achievements
│  └─ leaderboard.mock.ts 15 rivali simulați
│
├─ lib/                   motorul de joc — FUNCȚII PURE, fără I/O
│  ├─ economy.ts          stats efective, rating, costuri, XP, recompense, drop
│  ├─ raceEngine.ts       simulare 400 m, cutie de viteze, ferestre de shift
│  ├─ duelEngine.ts       Top Trumps, matchmaking, rezolvare runde
│  ├─ achievements.ts     checkAchievements(profile) → id-uri noi
│  └─ profile.ts          fabrica de profil + normalizare defensivă
│
├─ services/              „API” simulat — totul async, mutații imutabile
│  ├─ carService.ts       catalog, magazin, garaj, buyCar, upgradeCar
│  ├─ playerService.ts    load/save profil, monede, XP, achievements, clasament
│  ├─ raceService.ts      adversari, runRace, runDuel
│  ├─ quizService.ts      getRandomQuestions, gradeQuiz
│  ├─ storageService.ts   localStorage + versionare + migrare
│  └─ result.ts           ServiceResult<T> + mesaje de eroare în română
│
├─ store/                 Zustand
│  ├─ types.ts            contractul complet al store-ului
│  ├─ playerSlice.ts / garageSlice.ts / gameSlice.ts
│  ├─ persist.ts          debounce 400 ms + commitProfile
│  ├─ useGameStore.ts     store + selectori
│  └─ index.ts            barrel
│
├─ app/                   Next.js App Router  (proprietar: frontend-developer)
└─ components/            UI                  (proprietar: ui-designer / frontend-developer)
```

### Reguli de dependență

```
components → store → services → lib → data → types
```

Săgețile merg într-o singură direcție. `lib` nu importă niciodată din
`services` sau `store`; `services` nu ating `window` direct (doar prin
`storageService`); componentele nu importă `data` pentru logică, ci trec prin
servicii.

---

## 6. Contract pentru `frontend-developer`

- Randează UI-ul real doar când `isHydrated === true`; până atunci, skeleton.
- Apelează `hydrate()` **o singură dată**, dintr-un client component montat în
  `app/layout.tsx`.
- Nu muta niciodată profilul direct: folosește acțiunile store-ului.
- Serviciile `runRace` / `runDuel` / `gradeQuiz` **doar calculează**; rezultatul
  se aplică apoi prin `recordRaceResult` / `recordDuelResult` / `recordQuizResult`.
- `pendingAchievements` și `lastLevelUp` sunt cozi de toast-uri: după afișare,
  apelează `acknowledgeAchievements()` / `acknowledgeLevelUp()`.
