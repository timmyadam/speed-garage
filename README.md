# Speed Garage

**▶ Joacă: [speed-garage-ten.vercel.app](https://speed-garage-ten.vercel.app/)**

Joc web complex cu mașini — 100% frontend, fără backend și fără bază de date. Toate datele sunt mock (TypeScript), iar progresul jucătorului se salvează în `localStorage`.

## Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript** strict mode
- **Tailwind CSS v4** (tokens definite prin `@theme` în `src/app/globals.css`, fără `tailwind.config`)
- **Phosphor Icons** (`@phosphor-icons/react`)
- **Zustand** pentru state global, cu persistență debounced în `localStorage`
- Componente custom, construite de la zero (fără component libraries)

## Moduri de joc

| Mod | Descriere |
| --- | --- |
| **Garaj** | Colecție, magazin de mașini, upgrade-uri (motor, turbo, anvelope, greutate) |
| **Cursă** | Drag race pe 400m cu mini-joc de timing pe schimbarea treptelor |
| **Duel** | Top Trumps — 5 runde de comparat statistici împotriva unui adversar |
| **Quiz** | Întrebări auto cu timer și multiplicator de streak |

Toate cele patru moduri alimentează o economie comună: monede, XP, nivel de jucător și achievements.

## Rulare locală

```bash
npm install
npm run dev
```

Aplicația pornește pe `http://localhost:3000`. Nu sunt necesare variabile de mediu sau chei API.

```bash
npm run build   # build de producție
npm run lint    # ESLint
```

## Documentație

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — modele de date, state management, schema de persistență, formulele motorului de joc
- [`DESIGN.md`](./DESIGN.md) — design system: paletă, tipografie, spacing, wireframe-uri per ecran

## Structura proiectului

```
src/
  app/          rute App Router (dashboard, garage, race, duel, quiz, leaderboard, profile)
  components/   componente UI grupate pe domeniu (common, layout, cars, race, duel, quiz)
  types/        modele TypeScript
  data/         date mock (mașini, întrebări quiz, achievements, leaderboard)
  services/     strat de "API" simulat (funcții async peste datele mock)
  lib/          motorul jocului — funcții pure (cursă, duel, economie, achievements)
  store/        store Zustand cu slice-uri și hidratare din localStorage
```

## Resetarea progresului

Progresul se șterge din ecranul de **Profil** sau golind `localStorage` din DevTools.
