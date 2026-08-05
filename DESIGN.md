# Speed Garage — Design System

> Documentul de referință vizuală. Sursa de adevăr în cod este
> `src/app/globals.css` (blocul `@theme`). Aici e **de ce**.

---

## 0. Direcția vizuală

**Pit-lane, noaptea.** Nu „aplicație de mașini", ci *ecran de cronometraj într-un
garaj de curse*: asfalt cald, o singură lampă de sodiu deasupra, piese metalice
prelucrate, cifre condensate care se citesc de la doi metri.

Trei decizii care țin produsul departe de „AI slop":

1. **Un singur accent, folosit ca resursă limitată.** Portocaliul de sodiu apare
   plin **doar** pe butonul primar al ecranului și pe muchia rutei active. Nicăieri
   altundeva. Zero gradiente mov, zero gradiente de fundal, punct.
2. **Colțul teșit (chamfer).** Cardurile de mașină, modalele de rezultat și
   toast-urile au colțul dreapta-sus tăiat la 45°, ca un panou de caroserie. E o
   formă, nu o culoare — se recunoaște și alb-negru, și pe telefon la 360px.
3. **Adâncimea vine din luminozitate, nu din umbre.** Pe fundal întunecat umbrele
   dispar. Fiecare nivel de suprafață e cu un pas mai deschis decât cel de sub el.

### Ce am refuzat explicit

| Anti-pattern | Ce facem în loc |
|---|---|
| Gradiente mov / violet ca temă | Un accent portocaliu-sodiu, plat, aplicat parcimonios |
| Fade-in la scroll pe tot | **Zero** animații declanșate de scroll |
| Mișcare ambientală (blob-uri, particule, pulsuri) | Fundalul e complet static. Nimic nu se mișcă dacă utilizatorul nu acționează |
| Emoji ca iconițe | Exclusiv Phosphor Icons |
| Sidebar cu 12 linkuri | 5 rute de joc + 2 de consultare, în grupuri separate |
| KPI-uri „număr singur" | Monedele au delta, XP-ul are „încă N XP", statele au delta de upgrade |
| Bento grid 3×2 peste tot | Grid asimetric: cardul de mașină e vertical și dens; dashboard-ul are un card mare de continuare + carduri mici de mod |

---

## 1. Paletă

Toate rapoartele de contrast sunt calculate față de fundalul de pagină `#0a0b0c`.
Prag: **4.5:1** pentru text, **3:1** pentru elemente de UI.

### 1.1 Neutre — rampa „asfalt"

Calde-neutre, nu gri-albastre și nu negru pur (negrul pur pe OLED face bandă
vizibilă la gradientele subtile și obosește la contrast maxim).

| Token | Hex | Rol | Contrast |
|---|---|---|---|
| `--color-bg` | `#0a0b0c` | fundal pagină | — |
| `--color-surface` | `#121316` | card | — |
| `--color-surface-2` | `#191b1f` | card ridicat, rând hover | — |
| `--color-surface-3` | `#212429` | modal, popover | — |
| `--color-track` | `#26292f` | șina barelor de progres | — |
| `--color-line` | `#23262b` | bordură subtilă | — |
| `--color-line-strong` | `#333840` | separator activ, bordură vizibilă | — |
| `--color-fg` | `#e9edf2` | text principal | **15.4:1** |
| `--color-fg-2` | `#a3acba` | text secundar | **8.9:1** |
| `--color-fg-3` | `#7c8593` | text muted / etichete | **5.5:1** |
| `--color-fg-disabled` | `#565d68` | doar stări inerte | 3.1:1 |

`fg-3` trece pragul de body text (5.5:1) — nu avem „gri pe gri" ilizibil nicăieri.
`fg-disabled` e sub 4.5:1 **intenționat**: un control dezactivat trebuie să arate
inert, iar WCAG exceptează explicit componentele dezactivate.

### 1.2 Accent — „Sodium"

| Token | Hex | Rol | Contrast |
|---|---|---|---|
| `--color-accent` | `#ff7a18` | acțiune primară, rută activă | **7.5:1** pe bg |
| `--color-accent-strong` | `#ff9445` | hover (pe dark se *luminează*) | — |
| `--color-accent-press` | `#db6109` | apăsat | — |
| `--color-accent-fg` | `#140a02` | text pe accent | **8.0:1** |
| `--color-accent-wash` | `#2a1608` | suprafață tentată | — |
| `--color-accent-line` | `#58300f` | bordură tentată | — |

**De ce portocaliu-sodiu și nu roșu de curse:** roșul e deja rezervat semantic
pentru înfrângere și acțiuni distructive — într-un joc unde pierzi curse, roșul
*trebuie* să însemne „ai pierdut". Un roșu care e și buton primar, și rezultat
negativ, distruge codul de culoare. Portocaliul de lampă de sodiu păstrează
registrul de motorsport (Gulf, papaya), e complet distinct de roșu la nivel de
nuanță și dă 7.5:1 pe fundal — se poate folosi și ca text, nu doar ca fundal.

**De ce nu gradient:** accentul e plat. Un gradient pe butonul primar ar face
imposibilă recunoașterea instantanee a stării `hover`/`active`, care aici e
o schimbare de luminozitate.

### 1.3 Semantice de rezultat

Sunt steaguri de curse, nu culori de dashboard generic.

| Token | Hex | Sens | Contrast |
|---|---|---|---|
| `--color-win` | `#2fd07b` | steag verde — victorie, upgrade pozitiv | **10.2:1** |
| `--color-lose` | `#ff3b30` | steag roșu — înfrângere, acțiune distructivă | **5.8:1** |
| `--color-caution` | `#ffc53d` | steag galben — avertisment, cost, monede | **13.0:1** |
| `--color-info` | `#3b9eff` | informativ neutru | **7.3:1** |

Fiecare are un `-wash` corespunzător (fundal tentat foarte întunecat), pentru
chips și benzi de rezultat.

### 1.4 Rarități — rampa de anodizare a titanului

Justificarea nu e „așa fac jocurile", ci fizică: titanul anodizat își schimbă
culoarea cu tensiunea aplicată — oțel brut → albastru → violet → auriu. Aceeași
rampă e și o escaladare perceptuală clară (neutru → rece saturat → rece exotic →
cald strălucitor), deci ierarhia se citește fără să știi convenția.

| Raritate | Token | Hex | Contrast |
|---|---|---|---|
| Common | `--color-common` | `#93a1af` | **7.8:1** |
| Rare | `--color-rare` | `#3b9eff` | **7.3:1** |
| Epic | `--color-epic` | `#b072ff` | **6.5:1** |
| Legendary | `--color-legendary` | `#ffc53d` | **13.0:1** |

**Coliziunea aur / portocaliu, rezolvată prin formă:** Legendary (`#ffc53d`) și
accentul (`#ff7a18`) sunt vecine ca nuanță. Nu se confundă pentru că apar în
forme diferite: accentul e **fill plin cu text negru** (buton) sau **bară de 2px**
(rută activă); aurul e **text + bordură hairline pe wash** (badge, monede).
Aurul nu umple niciodată un buton.

**Culoarea nu e niciodată singurul semnal.** `RarityBadge` afișează implicit și
eticheta text; când e ascunsă, rămâne `aria-label` + `title`.

### 1.5 Culoarea per mașină

Fiecare mașină din datele mock aduce propriul `accentColor`. Nu intră în paletă:
e izolat în interiorul siluetei CSS (`--car-accent`), unde e amestecat cu
`color-mix()` pentru caroserie, butuci de roată și halou. Astfel 20+ culori de
mașină nu pot niciodată să concureze cu accentul de UI.

---

## 2. Tipografie

Două familii. Atât.

| Rol | Familie | Unde |
|---|---|---|
| Display / cifre | **Saira Condensed** (500/600/700) | titluri, timpi, viteze, RPM, monede, nivel, valori de stat, etichete de buton |
| Text / UI | **Inter** (variabil) | paragrafe, etichete, descrieri, meniuri |

**De ce Saira Condensed:** condensată și ușor pătrată — încap patru cifre de RPM
într-un gauge îngust fără să scadă lizibilitatea, iar caracterul de „ecran de
cronometraj" vine din literă, nu din decorațiuni adăugate. Are `latin-ext`, deci
ș/ț/ă/î/â se randează corect.

**De ce Inter pentru text:** UI-ul e dens (statistici, liste, clasamente).
Personalitatea o dau Saira + culoarea; corpul de text trebuie doar să dispară.

### Scală

| Nivel | Dimensiune | Line-height | Tracking | Familie |
|---|---|---|---|---|
| Display (rezultat cursă, timp final) | 48px / `text-5xl` | 1.0 | −0.02em | Saira |
| H1 (titlu de pagină) | 30px / `text-3xl` | 1.1 | −0.015em | Saira |
| H2 (secțiune) | 20px / `text-xl` | 1.1 | −0.015em | Saira |
| H3 / nume mașină | 16px / `text-base` bold | 1.2 | 0 | Inter |
| Body | 14px / `text-sm` | 1.5 | 0 | Inter |
| Etichetă de stat | 12px / `text-xs` | 1.4 | 0 | Inter |
| Eyebrow / marcă | 11px | 1.2 | **+0.16em**, uppercase | Saira |
| Micro (bottom nav) | 11px | 1 | 0 | Inter |

Reguli fixe:
- Titlurile mari primesc tracking **negativ** și line-height ≤1.2. Body-ul primește
  tracking 0 și line-height 1.5.
- Un titlu are **un singur** tratament stilistic. Nu combinăm bold + italic +
  colorat + uppercase în același bloc.
- Toate cifrele care se compară pe verticală (statistici, clasament, timpi)
  folosesc utilitarul `.tnum` (cifre tabulare). Fără el, coloana de numere
  „dansează" între rânduri.
- Etichetele uppercase primesc obligatoriu tracking pozitiv (≥0.06em).

---

## 3. Spațiere și dimensiuni

Grid de **4px**, fără excepții: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`.

| Context | Valoare |
|---|---|
| Padding card (`md`) | 16px |
| Padding card (`lg`) / modal | 24px |
| Gap între carduri în grid | 12px mobil, 16px desktop |
| Gap între rânduri de statistici | 6px |
| Padding orizontal pagină | 16px mobil, 32px desktop |
| Înălțime bottom nav | 64px + `safe-area-inset-bottom` |
| Înălțime navbar | 56px mobil, 64px desktop |
| Lățime sidebar | 240px |
| Lățime maximă conținut | 1152px (`max-w-6xl`) |

**Ținte de atingere:** minim 44×44px pe orice element interactiv. Butoanele
`md`/`lg` au 44px/52px înălțime; butonul `sm` (36px) e permis **numai** în
rânduri dense de desktop, niciodată ca acțiune principală pe mobil. Butoanele
doar-iconiță (închide modal, rute secundare) au cutia de 44px chiar dacă
iconița are 20px.

---

## 4. Elevație, borduri, colțuri

### Rampa de suprafețe (adâncime prin luminozitate)

```
pagină     #0a0b0c   ← cel mai întunecat
card       #121316
card ridicat #191b1f
modal      #212429   ← cel mai deschis
```

Un card nu are niciodată același fundal ca părintele lui. Umbrele apar **doar**
pe elemente care plutesc peste conținut (modal, toast) și sunt mari și difuze
(`0 24px 60px -12px rgb(0 0 0 / .7)`) — ca să separe, nu ca să decoreze.

### Raze

`2px` (bare de progres) · `4px` (badge, chip) · `8px` (buton, input) ·
`12px` (card) · `16px` (modal). Piese prelucrate, nu bule.

### Chamfer

`clip-path` cu tăietură de 18px (10px la varianta mică) în colțul dreapta-sus.
Se aplică **doar** pe: card de mașină, panou de modal de rezultat, toast de
realizare, placa de logo. Peste tot altundeva — colț rotunjit normal. Dacă apare
pe orice, își pierde sensul.

### Hașură

Zonele inerte (șina barelor de progres, empty states) primesc `.sg-hatch` —
diagonale de 1px la 3.5% alb. Comunică „aici nu e nimic **încă**", nu „aici e
gol pentru că s-a stricat ceva".

---

## 5. Motion

**Regula principală: dacă utilizatorul nu se mișcă, interfața nu se mișcă.**
Fundalul e static. Nu există fade-in la scroll. Nu există bucle ambientale.

| Durată | Când |
|---|---|
| 150ms | hover, focus, apăsare — feedback micro |
| 200ms | intrare de panou/modal, schimbare de stare |
| 220ms | intrare de toast |
| 400ms | umplerea unei bare de progres (valoarea trebuie urmărită cu ochiul) |

Easing unic: `cubic-bezier(0.2, 0.8, 0.3, 1)` (`--ease-out-quick`) — pornire
rapidă, oprire lină. Un singur easing în tot produsul.

### Cele patru keyframes din sistem

| Nume | Rol comunicativ |
|---|---|
| `sg-spin` | acțiune asincronă în desfășurare (spinner în buton) |
| `sg-shimmer` | schelet de încărcare — spune „datele vin", nu „e stricat" |
| `sg-overlay-in` | backdrop-ul de modal apare (context: pagina trece în plan secund) |
| `sg-panel-in` | panoul de modal urcă 12px și intră (context: obiect nou peste pagină) |
| `sg-toast-in` | realizarea deblocată intră din jos (context: notificare) |

Nu există `fadeInUp` aplicat pe secțiuni de pagină. Conținutul e lizibil din
prima frame.

**`prefers-reduced-motion: reduce`** taie *tot* — inclusiv shimmer-ul de
skeleton și tranzițiile de bară. Nu doar animațiile „mari".

### Micro-interacțiuni obligatorii

- Butonul primar coboară 1px la `:active` (`translate-y-px`) — confirmă apăsarea
  pe touch, unde nu există hover.
- Fiecare acțiune asincronă (cumpără, upgrade, salvează) are **stare de
  încărcare** cu text propriu („Se cumpără…"), nu doar spinner mut.
- Fiecare rezultat (câștig/pierdere) are bandă de tonalitate colorată în capul
  modalului — culoarea se citește înainte de primul cuvânt.

---

## 6. Stări obligatorii

Fiecare componentă interactivă are toate cele cinci: **default · hover · active ·
focus-visible · disabled**. În plus, pentru orice acțiune asincronă: **loading**.

**Focus.** Un singur inel, global, imposibil de ratat:
`outline: 2px solid var(--color-accent); outline-offset: 2px`. Nu există
`outline: none` nicăieri în sistem. Folosim `:focus-visible`, deci mouse-ul nu
lasă inele reziduale.

**Disabled.** Fundal `surface`, text `fg-disabled`, `pointer-events: none`.
Vizibil inert — nu „ușor mai șters".

**Empty.** `EmptyState`: iconiță + explicație concretă + **o singură** acțiune
următoare. Niciodată ecran alb.

**Error.** Mesajele spun ce s-a întâmplat și ce se poate face acum. Nu „A apărut
o eroare".

**Loading.** `Skeleton` care rezervă exact spațiul conținutului real (zero CLS),
nu spinner centrat pe pagină goală.

---

## 7. Wireframe-uri

Notație: `▭` container, `▬` bară, `●` iconiță. Mobil-first; varianta de desktop
e descrisă unde diferă.

### 7.1 Dashboard (`/`)

Nu e un bento 3×2. Un card mare, plin lățime, apoi rutele de joc.

```
┌ Navbar: [logo]              [lvl] [monede] [● clasament] [● profil] ┐
├────────────────────────────────────────────────────────────────────┤
│ H1  Bun venit înapoi                                               │
│ p   Ai 3 mașini în garaj · nivel 7                                 │
│                                                                    │
│ ┌── CONTINUĂ (card mare, chamfer, variant="accent") ─────────────┐  │
│ │  [silueta mașinii active, mare]     Marcă                      │  │
│ │                                     NUME MAȘINĂ  [Legendary]   │  │
│ │                                     ▬▬▬ 4 statistici           │  │
│ │                                     [ INTRĂ ÎN CURSĂ → ]  ← CTA│  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ H2  Moduri de joc                                                  │
│ ┌─ Cursă ──────┐ ┌─ Duel ───────┐   (2 col mobil, 3 col desktop)   │
│ │ ● mare       │ │ ● mare       │                                  │
│ │ Drag 400 m   │ │ Top Trumps   │                                  │
│ │ +120–400 🪙  │ │ +80–250 🪙   │  ← recompensa concretă, nu „joacă"│
│ └──────────────┘ └──────────────┘                                  │
│ ┌─ Quiz ───────┐                                                   │
│                                                                    │
│ H2  Progres            ┌ XpBar complet ────────────────────────┐   │
│                        │ Nivel 7 ▬▬▬▬▬▬▬░░░ încă 340 XP        │   │
│                        └───────────────────────────────────────┘   │
│ H2  Ultimele curse  → listă compactă: rezultat · mașină · +monede  │
└────────────────────────────────────────────────────────────────────┘
[ BottomNav: Acasă · Garaj · Cursă · Duel · Quiz ]
```

**Un singur CTA primar** pe primul ecran: „Intră în cursă". Cardurile de mod sunt
suprafețe navigabile, nu butoane pline concurente.

### 7.2 Garaj (`/garage`)

```
H1 Garaj                                  [ Toate ▾ ] [ Raritate ▾ ]
Tab-uri:  [ Mașinile mele (3) ] [ Magazin (17) ]     ← segmented control
                                             (tab activ = muchie accent jos)
┌ grid: 1 col ≤480px · 2 col ≥480px · 3 col ≥1024px · 4 col ≥1280px ┐
│  ┌ CarCard ─────────┐  ┌ CarCard ─────────┐                       │
│  │ ▔ muchie raritate│  │                  │                       │
│  │ [siluetă CSS]    │  │  [siluetă, 45%   │                       │
│  │ [Rare]           │  │   opacitate]     │                       │
│  ├──────────────────┤  │  ● Necesită      │  ← motivul blocării    │
│  │ MARCĂ            │  │    nivelul 12    │     e VIZIBIL, nu în   │
│  │ Nume mașină      │  ├──────────────────┤     hover              │
│  │ Hot Hatch        │  │ ...              │                       │
│  │ ▬ Viteză     72  │  │ 🪙 48 500        │                       │
│  │ ▬ Accelerație 68 │  │ [ Cumpără ]      │                       │
│  │ ▬ Handling   81  │  └──────────────────┘                       │
│  │ ▬ Frânare    64  │                                             │
│  │ [În garaj]       │                                             │
│  └──────────────────┘                                             │
└────────────────────────────────────────────────────────────────────┘
```

Garaj gol (jucător nou) → `EmptyState`: „Garajul e gol. Primești o mașină de
start când începi prima cursă." + `[ Începe prima cursă ]`.

Cumpărare → **`Modal`** de confirmare cu tonul `accent`: nume, preț, monede
rămase după tranzacție. Butonul primar afișează „Se cumpără…" în loading.

### 7.3 Detaliu mașină (`/garage/[carId]`)

Split asimetric pe desktop (5/7), stivuit pe mobil.

```
← Înapoi la garaj
┌ stânga (sticky pe desktop) ──────┐ ┌ dreapta ───────────────────────┐
│ [siluetă CSS, mare]              │ │ H2 Statistici                  │
│ MARCĂ                            │ │ StatBar Viteză   ▬▬▬▬░ 320 km/h│
│ NUME MAȘINĂ    [Legendary]       │ │ StatBar 0-100    ▬▬▬░░ 3.2 s   │
│ Hypercar · AWD · 1 340 kg        │ │ StatBar Handling ▬▬▬▬░ 81      │
│                                  │ │ StatBar Frânare  ▬▬▬░░ 64      │
│ ┌ Card „Upgrade" ──────────────┐ │ │  (la hover pe un upgrade,      │
│ │ ● Motor      Nv. 2/5         │ │ │   bara arată segmentul fantomă │
│ │   ▬▬▬▬▬░░░░  +8 CP           │ │ │   + delta verde „+8")          │
│ │   🪙 12 000  [ Îmbunătățește ]│ │ │                                │
│ │ ● Turbo      Nv. 0/5         │ │ │ H2 Istoric                     │
│ │ ● Anvelope   Nv. 1/5         │ │ │ listă: cursă · timp · rezultat │
│ │ ● Greutate   Nv. 3/5 (max)   │ │ └────────────────────────────────┘
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

Previzualizarea de upgrade e **explicită și persistentă** (`StatBar delta`), nu
ascunsă în hover — pe mobil hover-ul nu există.

### 7.4 Cursă (`/race`)

Trei faze, aceeași pagină, fără scroll în timpul cursei.

**Fază 1 — pregătire**
```
H1 Drag Race · 400 m
[ Mașina ta ▾ ]  vs  [ Adversar generat ]
┌ CarCard compact ─┐  ┌ CarCard compact ─┐
│                  │  │                  │
└──────────────────┘  └──────────────────┘
Comparație directă: 4 × StatBar față în față (a ta / a lui)
                    [ LA LINIA DE START → ]   ← singurul CTA
```

**Fază 2 — cursă** (viewport blocat, nimic sub fold)
```
┌ RpmGauge, plin lățime ─────────────────────────────────────┐
│  ▬▬▬▬▬▬▬▬▬▬▬▬▬░░░░  [ fereastră de shift = bandă verde ]   │
│  7 240 RPM        ← Saira Condensed, 48px, tnum            │
│  Treapta 3        Distanță 218 / 400 m   Timp 6.42 s       │
└────────────────────────────────────────────────────────────┘
┌ Pistă: două culoare, mașina ta sus, AI jos ────────────────┐
│  ═════▶ [tu]                                               │
│  ═══▶ [AI]                                                 │
└────────────────────────────────────────────────────────────┘
        ┌──────────────────────────────────────┐
        │   SCHIMBĂ TREAPTA   (h ≥ 96px)       │  ← degetul mare,
        └──────────────────────────────────────┘     jos de tot
```

Culoarea benzii de shift: `win` în fereastra optimă, `caution` la marginea ei,
`lose` la supraturare. Feedbackul de shift e o schimbare de culoare + un număr
(„+0.18s"), nu o animație decorativă.

**Fază 3 — rezultat** → `Modal` `tone="win" | "lose"`, `hideCloseButton`:
bandă colorată, titlu „VICTORIE" / „ÎNFRÂNGERE", timp final la 48px, apoi
recompense (`CoinCounter` cu delta, `+XP`), apoi `[ Încă o cursă ]` (primar) +
`[ Înapoi în garaj ]` (ghost).

### 7.5 Duel (`/duel`)

```
H1 Duel de statistici          Runda 3 / 5
┌ DuelRoundIndicator: ● ● ○ ○ ○   (● câștigat=win, ●=lose, ○ neatins) ┐
┌ mașina ta ──────────┐   VS   ┌ adversar ────────────┐
│ [siluetă]           │        │ [siluetă, fața verso │
│ NUME  [Epic]        │        │  până la dezvăluire] │
└─────────────────────┘        └──────────────────────┘
Alege categoria:
[ Viteză max 320 ] [ 0-100  3.2s ] [ Handling 81 ] [ Preț ] [ Raritate ]
   ↑ butoane secondary, plin lățime pe mobil, ≥44px
După alegere: cele două valori apar față în față, câștigătoarea primește
bordură `win`, perdanta `lose`, plus etichetă text („Mai bun" / „Mai slab") —
culoarea nu e singurul semnal.
```

### 7.6 Quiz (`/quiz`)

```
┌ QuizTimer: bară plin lățime, tone accent → caution <5s → lose <2s ┐
Întrebarea 4 / 10                        Streak ×3   ← Saira, accent
H2  În ce an a fost lansat primul Golf GTI?
┌ opțiune A ──────────────────────────────────┐   toate ≥56px înălțime
┌ opțiune B ──────────────────────────────────┐   text stânga, literă
┌ opțiune C ──────────────────────────────────┐   în pastilă la stânga
┌ opțiune D ──────────────────────────────────┐
```

După răspuns: opțiunea corectă primește bordură + fundal `win-wash` și iconiță
`CheckCircle`; cea greșită aleasă primește `lose-wash` + `XCircle`. Ambele au
iconiță, deci se disting și fără culoare. Ecranul final: scor, streak maxim,
recompense, `[ Încă o rundă ]`.

### 7.7 Clasament (`/leaderboard`)

Tabel, nu carduri — datele se compară pe verticală.

```
H1 Clasament                        [ Global ▾ ]
┌───┬────────────────────┬─────────┬────────┬──────────┐
│ # │ Jucător            │ Nivel   │ Curse  │ Puncte   │  ← tnum peste tot
├───┼────────────────────┼─────────┼────────┼──────────┤
│ 1 │ ● Nume             │   24    │  312   │  48 210  │  locul 1-3: numărul
│ 2 │ ● Nume             │   22    │  288   │  44 990  │  în `legendary`
│ 3 │ ● Nume             │   21    │  260   │  41 100  │
│ … │                    │         │        │          │
│ 9 │ ● TU               │    7    │   24   │   6 840  │  ← rând lipit
└───┴────────────────────┴─────────┴────────┴──────────┘     (sticky), fundal
                                                             accent-wash +
Pe mobil: coloanele „Curse" dispare, rămân #, jucător, puncte.  bordură accent
```

### 7.8 Profil (`/profile`)

```
┌ Card antet ─────────────────────────────────────────────┐
│ [placă nivel 7]  Numele jucătorului                     │
│                  ▬▬▬▬▬▬▬░░░ încă 340 XP până la 8       │
│  🪙 24 800 monede · 3 mașini · 24 curse · 71% victorii  │
└─────────────────────────────────────────────────────────┘

H2 Realizări  (6 din 8)
┌ grid 2 col mobil / 4 col desktop ───────────────────────┐
│ [● Medal]      │ [● Trophy]     │ [● Lock, estompat]    │
│ Prima victorie │ Colecționar    │ Rege Quiz             │
│ 12 mar 2026    │ 3/10 mașini ▬▬░│ 10 corecte la rând    │
└─────────────────────────────────────────────────────────┘
   ↑ realizările neobținute arată *progresul*, nu doar „blocat"

H2 Istoric curse → listă: dată · mod · mașină · rezultat · recompensă
   Gol → EmptyState „Nicio cursă încă" + [ Prima ta cursă ]
```

---

## 8. Componente livrate

`src/components/common/` — pur prezentaționale, fără store, fără date.

| Componentă | Rol |
|---|---|
| `Button` | 4 variante × 3 dimensiuni, loading + disabled |
| `Modal` | dialog accesibil: focus trap, Esc, backdrop, `aria-modal`, bandă de tonalitate |
| `ProgressBar` | bară etichetată cu `ghostValue` pentru previzualizări |
| `StatBar` | rândul canonic de statistică: etichetă · bară · număr · delta |
| `CoinCounter` | monede + delta, formatare `ro-RO` |
| `XpBar` | placă de nivel + progres către următorul |
| `RarityBadge` | pastilă de raritate + `normalizeRarity()` |
| `AchievementToast` | notificare `role="status"`, auto-hide + închidere manuală |
| `Card` | 4 variante, 4 paddings, chamfer opțional, antet cu acțiune |
| `EmptyState` | iconiță + explicație + o singură acțiune |
| `Skeleton` | 4 variante, rezervă spațiul real |

`src/components/layout/` — `AppShell`, `Navbar`, `Sidebar`, `BottomNav`, `Logo`,
`routes.ts`.

`src/components/cars/` — `CarCard`, `CarSilhouette`.

Toate primesc datele prin props. Niciuna nu importă store sau fișiere de date.

### Compatibilitate cu `@/types`

- `Rarity` (din `RarityBadge`) e structural identică cu `CarRarity` din
  `@/types/car` — se pasează direct, fără conversie. `normalizeRarity()` există
  doar pentru date externe cu capitalizare necunoscută.
- `CarCardStats` e structural identică cu `CarStats` — `stats={car.stats}` sau
  `stats={effectiveStats}` funcționează direct.

---

## 9. Checklist de accesibilitate

- [x] Tot textul ≥ 4.5:1; elementele de UI ≥ 3:1 (valori calculate în §1)
- [x] `:focus-visible` global, 2px accent, offset 2px; zero `outline: none`
- [x] Ținte de atingere ≥ 44×44px, cu ≥8px între ele
- [x] HTML semantic: `<header>`, `<nav>`, `<aside>`, `<main>`, `<button>`, `<a>`
- [x] Un singur `<h1>` per pagină; ierarhia titlurilor nu sare niveluri
- [x] Iconițele funcționale au `aria-label`; cele decorative au `aria-hidden`
- [x] Silueta mașinii e `role="img"` cu `aria-label` (marca + modelul)
- [x] Barele au `role="progressbar"` / `role="meter"` cu `aria-valuenow/min/max`
- [x] Culoarea nu e niciodată singurul purtător de informație (raritate,
      corect/greșit, victorie/înfrângere au și text sau iconiță)
- [x] `Modal`: `aria-modal`, `aria-labelledby`, focus trap, Esc, focus returnat
- [x] `AchievementToast`: `role="status"` — anunțat fără să fure focusul
- [x] `prefers-reduced-motion` taie toate animațiile și tranzițiile
- [x] `lang="ro"` pe `<html>`
- [x] Text lung: `truncate` + `title`, `overflow-wrap: break-word` global

---

## 10. Reguli pentru implementare

1. **Niciodată hex direct în componente.** Doar tokeni (`bg-surface`,
   `text-fg-2`, `border-line`). Singura excepție: `--car-accent`, care vine din
   datele mașinii.
2. **Un singur buton `primary` vizibil odată.** Dacă un ecran are nevoie de două
   acțiuni, a doua e `secondary` sau `ghost`.
3. **Fără spațieri în afara grilei de 4.** Fără `13px`, fără `gap-[22px]`.
4. **Fără componente one-off.** Dacă un card arată altfel decât `Card`, se adaugă
   o variantă în `Card`, nu un card nou.
5. **Fiecare acțiune asincronă are patru stări:** default, loading, succes, eroare.
6. **Fiecare listă are empty state.** Fără excepții.
7. **Testează la 360px lățime** înainte de a considera un ecran terminat.
