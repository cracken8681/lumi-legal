# Lumi — Project Context

**Last updated:** 2026-04-22  
**Status:** MVP in active development — Supabase connected, running live on iPhone via Expo Go

---

## What Is Lumi

A mobile app that solves two problems at once:
1. **Personal finance management** — track spending, set budgets per category, visualise where money goes
2. **Supermarket deal notifications** — geolocation alerts when the user is near a store with relevant deals

No competitor currently combines both in one app. Full PRD: `lumi-PRD.md`

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React Native + Expo | RN 0.81.5 / Expo SDK 54 |
| Navigation | Expo Router (file-based) | 6.0.23 |
| State | Zustand | 5.x |
| Backend | Supabase | @supabase/supabase-js |
| Fonts | Inter via @expo-google-fonts | — |
| Icons | @expo/vector-icons (Ionicons) | 15.x |
| Language | TypeScript | 5.9 |
| Animations | react-native-reanimated | 4.1.1 |
| Testing | Expo Go (iOS) | — |

**Backend:** Supabase — client initialized in `lib/supabase.ts`, credentials in `.env`  
**Build/deploy (planned):** EAS Build → App Store + Google Play

---

## Project Structure

```
Lumi/
├── app/                        # Expo Router file-based navigation
│   ├── _layout.tsx             # Root layout — fonts (Inter), SplashScreen, ThemeProvider, Supabase auth redirect
│   ├── (auth)/                 # Auth group (unauthenticated)
│   │   ├── _layout.tsx         # Auth stack (no header)
│   │   ├── login.tsx           # Email/password login
│   │   └── register.tsx        # Sign up + confirm password validation
│   ├── (tabs)/                 # Bottom tab group
│   │   ├── _layout.tsx         # Tab bar config (5 tabs, Ionicons, Lumi colours)
│   │   ├── index.tsx           # Home — Dashboard screen
│   │   ├── expenses.tsx        # Expense tracking screen
│   │   ├── deals.tsx           # Supermarket deals feed
│   │   ├── list.tsx            # Shopping list
│   │   └── profile.tsx         # Profile & settings
│   ├── modal.tsx               # Generic modal screen
│   ├── +not-found.tsx          # 404 fallback
│   └── +html.tsx               # Web-only HTML wrapper
│
├── components/                 # From Expo template (kept for useColorScheme etc.)
│   ├── useColorScheme.ts       # Returns 'light' | 'dark' — used everywhere
│   ├── useClientOnlyValue.ts   # SSR guard for web
│   ├── Themed.tsx              # Base themed Text/View (template, largely unused)
│   └── __tests__/
│
├── constants/
│   ├── LumiColors.ts           # MAIN design system — full light/dark palette
│   ├── categories.ts           # 7 expense categories (label, emoji, color)
│   ├── translations.ts         # EN/EL strings for all screens (i18n)
│   └── Colors.ts               # Expo template default (kept, not used by Lumi screens)
│
├── store/
│   └── useAppStore.ts          # Zustand store — all app state (transactions, budgets, language)
│
├── lib/
│   └── supabase.ts             # Supabase client — createClient with AsyncStorage session persistence
│
├── hooks/
│   ├── useTransactions.ts      # Supabase CRUD for transactions (fetchAll, add, remove)
│   ├── useBudgets.ts           # Supabase CRUD for budgets (fetchAll, upsert per month)
│   └── useShoppingList.ts      # Supabase CRUD for shopping list (fetchAll, add, toggle, remove)
│
├── assets/                     # Icons, splash screen, fonts
├── app.json                    # Expo config (scheme, orientation, splash, icons)
├── package.json
├── tsconfig.json               # Path alias @/* → root
└── lumi-PRD.md                 # Full Product Requirements Document
```

---

## Navigation Flow

```
app/_layout.tsx  (Root — Stack navigator, ThemeProvider, Inter fonts, Supabase session check)
│
├── (auth)/_layout.tsx  (Auth Stack — no header)
│   ├── login.tsx        [Login]     Email/password sign in
│   └── register.tsx     [Register]  Sign up with confirm password
│
└── (tabs)/_layout.tsx  (Bottom Tab Bar — implementation="custom")
    ├── index.tsx        [Home]      Tab 1 — Dashboard
    ├── expenses.tsx     [Expenses]  Tab 2 — Add/view transactions
    ├── deals.tsx        [Deals]     Tab 3 — Supermarket offers feed
    ├── list.tsx         [List]      Tab 4 — Shopping list
    └── profile.tsx      [Profile]   Tab 5 — Settings
```

Auth redirect logic (in `_layout.tsx`):
- App starts at `(auth)` group (initialRouteName)
- `getSession()` + `onAuthStateChange()` determine session state
- Session exists → `router.replace('/(tabs)')`
- No session → `router.replace('/(auth)/login')`
- Splash screen stays visible until session check completes (no flash)

Deep links / modals:
- `modal.tsx` — accessible via `<Link href="/modal">` from any screen
- `+not-found.tsx` — catches unknown routes

---

## Screen Breakdown

### Home (`index.tsx`)
- Monthly budget card (remaining / spent / limit + progress bar)
- Lumi Score (0–100, colour-coded green/amber/red)
- Category budget bars (all 7 categories with % fill)
- "Nearby Deals" teaser widget (location CTA)

### Expenses (`expenses.tsx`)
- Transaction list grouped chronologically
- Floating `+` button → inline form (amount, note, category selector)
- Delete transaction → Zustand auto-updates budget totals
- Empty state illustration

### Deals (`deals.tsx`)
- Hardcoded sample deals (Σκλαβενίτης, ΑΒ, Lidl, My Market, Masoutis)
- Each card: product, store, original price, deal price, % discount, distance
- **TODO:** Replace with real API / Supabase data

### Shopping List (`list.tsx`)
- Add items via text input
- Check off items (moves to "Done" section with strikethrough)
- Item count in header

### Profile (`profile.tsx`)
- Avatar placeholder
- Language toggle (English / Greek) via Zustand
- Notification settings row
- Privacy & Security row
- Sign Out row

---

## State Management (Zustand — `useAppStore.ts`)

```typescript
State:
  language: 'el' | 'en'
  currency: '€'
  transactions: Transaction[]   // { id, amount, category, note, date }
  budgets: Budget[]             // { category, limit, spent }

Actions:
  setLanguage(lang)
  setTransactions(transactions) // bulk replace (used after Supabase fetch)
  setBudgets(budgets)           // bulk replace (used after Supabase fetch)
  addTransaction(t)             // also increments budget.spent; accepts optional id from Supabase
  deleteTransaction(id)         // also decrements budget.spent
  updateBudget(category, limit)
```

**⚠️ Data is in-memory only.** Closing the app resets all data.  
**TODO:** Persist with Supabase or AsyncStorage.

---

## Design System (`LumiColors.ts`)

Inspired by Monzo + Revolut. Follows iOS system dark/light setting automatically.

| Token | Light | Dark |
|---|---|---|
| background | `#F8F9FF` | `#0D0F1A` |
| surface | `#FFFFFF` | `#161829` |
| primary | `#5B5FEF` | `#6E72FF` |
| accent | `#FF6B6B` | `#FF7A7A` |
| success | `#00C896` | `#00E5AD` |
| warning | `#FFB547` | `#FFCA6B` |
| danger | `#FF4757` | `#FF6B78` |
| text | `#1A1D2E` | `#F0F1FF` |
| textMuted | `#8B8FA8` | `#5A5E7A` |

Font: **Inter** (400 / 500 / 600 / 700) — loaded in root `_layout.tsx`

---

## Critical Technical Notes

> These were learned the hard way — don't repeat these mistakes.

1. **Template:** Must use `--template tabs` from `create-expo-app`, not `blank-typescript` + manual expo-router install. The latter produces incompatible package versions.

2. **`implementation="custom"`** on `<Tabs>` is required. Without it, React Navigation's native bottom-tabs path causes a Fabric type error (`expected boolean, got string`) on RN 0.81.5 + New Architecture.

3. **No `babel.config.js`** — use Expo's default Babel config. Custom babel configs with NativeWind's `jsxImportSource` broke the New Architecture renderer.

4. **Icons:** Use `@expo/vector-icons` (Ionicons). `lucide-react-native` uses `react-native-svg` which has incompatibilities with the New Architecture in Expo Go.

5. **After installing packages:** Always run `npx expo install --fix` to align versions with Expo SDK 54.

6. **NativeWind:** Not yet integrated. Will be added later with a proper setup once the baseline is stable.

---

## Roadmap

### Phase 1 — MVP (current)
- [x] Tab navigation with 5 screens
- [x] Dashboard with budget overview and Lumi Score
- [x] Manual expense tracking (add / delete)
- [x] Deals feed (static sample data)
- [x] Shopping list
- [x] Dark / light mode
- [x] Supabase client connected (`lib/supabase.ts`, env vars, AsyncStorage session)
- [x] Supabase hooks created (`hooks/useTransactions.ts`, `hooks/useBudgets.ts`)
- [x] Authentication flow — login + register screens + session-based redirect in root layout
- [x] i18n — EN/EL translations in `constants/translations.ts`, all screens switch language via Zustand
- [x] Shopping List Supabase persistence (`hooks/useShoppingList.ts`, useFocusEffect sync)
- [x] Dashboard auto-refresh on tab focus (useFocusEffect fetches transactions + budgets)
- [ ] Supabase database tables created (transactions, budgets — run SQL in Supabase dashboard)
- [ ] Wire hooks into screens (expenses.tsx, index.tsx)
- [ ] Geolocation notifications (expo-location)
- [ ] Onboarding flow

### Phase 2
- [ ] Open banking via GoCardless (auto bank sync — PSD2, Greece supported)
- [ ] Family Plan (shared budgets, subscription)
- [ ] Real supermarket deal data

### Phase 3
- [ ] Supermarket ad revenue (promoted deals)
- [ ] More languages (Italian, German, Spanish)
- [ ] Analytics dashboard for brands

---

## Running the App

```bash
cd "/Users/cracken8681/Desktop/Coding projects/Lumi"
npx expo start --clear
# Scan QR code with Expo Go (iOS) — must be on same WiFi
```

**Expo account:** cracken8681@gmail.com
