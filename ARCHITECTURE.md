# Lumi — Architecture Document

**Last updated:** April 2026  
**Status:** MVP in active development

---

## What Is Lumi

A mobile app that solves two problems at once:
1. **Personal finance management** — track spending, set budgets, pay yourself first
2. **Supermarket deal notifications** — geolocation alerts near stores with deals

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React Native + Expo | RN 0.81.5 / Expo SDK 54 |
| Navigation | Expo Router (file-based) | 6.0.23 |
| State | Zustand + persist (AsyncStorage) | 5.x |
| Database | Supabase (PostgreSQL) | — |
| Auth | Supabase Auth (email/password) | — |
| Fonts | Inter via @expo-google-fonts | — |
| Icons | @expo/vector-icons (Ionicons) | 15.x |
| Language | TypeScript | 5.9 |
| Animations | react-native-reanimated | 4.1.1 |

---

## Project Structure
```
Lumi/
├── app/
│   ├── _layout.tsx              # Root layout — auth redirect, session listener
│   ├── (auth)/
│   │   ├── _layout.tsx          # Auth stack
│   │   ├── login.tsx            # Email/password login
│   │   └── register.tsx         # Registration
│   └── (tabs)/
│       ├── _layout.tsx          # Tab bar (6 tabs)
│       ├── index.tsx            # Home — Dashboard
│       ├── expenses.tsx         # Expense tracking
│       ├── assets.tsx           # Investment tracking
│       ├── list.tsx             # Shopping list
│       ├── deals.tsx            # Supermarket deals
│       └── profile.tsx          # Settings
├── components/
├── constants/
│   ├── LumiColors.ts            # Design system (light/dark)
│   ├── categories.ts            # Expense categories
│   └── translations.ts          # EN/EL strings
├── hooks/
│   ├── useTransactions.ts       # CRUD transactions
│   ├── useBudgets.ts            # CRUD budgets
│   ├── useShoppingList.ts       # CRUD shopping list
│   ├── useInvestments.ts        # CRUD investments + returns
│   └── usePayYourselfFirst.ts   # PYF amounts
├── lib/
│   └── supabase.ts              # Supabase client
└── store/
    └── useAppStore.ts           # Zustand global state
```

---

## Navigation Flow
```
_layout.tsx (Root)
├── No session → /(auth)/login
└── Session exists → /(tabs)
    ├── [1] Home — Dashboard + Pay Yourself First + Budget overview
    ├── [2] Expenses — Add/edit/delete transactions
    ├── [3] Assets — Investment tracking + P&L
    ├── [4] List — Shopping list
    ├── [5] Deals — Supermarket offers
    └── [6] Profile — Settings, language, sign out
```

---

## Database Schema (Supabase)

### auth.users (built-in Supabase)

### transactions
```sql
id uuid, user_id uuid, amount numeric,
category text, note text, date timestamptz
```

### budgets
```sql
id uuid, user_id uuid, category text,
limit_amount numeric, month text,
emoji text default '📦', custom_name text,
UNIQUE(user_id, category, month)
```

### shopping_list
```sql
id uuid, user_id uuid, name text,
checked boolean default false
```

### investments
```sql
id uuid, user_id uuid, name text, amount numeric
```

### investment_returns
```sql
id uuid, investment_id uuid, user_id uuid,
amount numeric, note text
```

### pay_yourself_first
```sql
id uuid, user_id uuid,
type text CHECK (type IN ('investment','savings','goals')),
amount numeric default 0,
UNIQUE(user_id, type)
```

**All tables have Row Level Security (RLS) enabled.**

---

## Design System

Inspired by Monzo + Revolut.

| Token | Light | Dark |
|---|---|---|
| background | #F8F9FF | #0D0F1A |
| surface | #FFFFFF | #161829 |
| primary | #5B5FEF | #6E72FF |
| success | #00C896 | #00E5AD |
| warning | #FFB547 | #FFCA6B |
| danger | #FF4757 | #FF6B78 |

Font: **Inter** (400/500/600/700)

---

## Key Architectural Decisions

### 1. Optimistic UI
Zustand updates immediately → Supabase writes in background.
User sees instant feedback without waiting for network.

### 2. useFocusEffect για data fetching
Κάθε screen κάνει fetch όταν γίνεται active (όχι μόνο mount).
Εξασφαλίζει fresh data όταν ο user γυρνάει σε tab.

### 3. Persist μόνο το language
Zustand persist αποθηκεύει μόνο το language preference.
Τα data έρχονται πάντα από Supabase.

### 4. Pay Yourself First πριν από κατανάλωση
pyfTotal αφαιρείται από totalRemaining πριν εμφανιστούν τα budget bars.
Ψυχολογικό anchor — ο user βλέπει πρώτα τι "έχει κρατήσει".

---

## Roadmap

### ✅ Phase 1 — MVP (Complete)
- Auth (login/register)
- Expense tracking + Supabase persistence
- Budget management με custom categories
- Pay Yourself First section
- Investment tracking + P&L
- Shopping list persistence
- Dark/light mode
- EN/EL language switch

### 🔄 Phase 2 — Polish & Launch
- Onboarding flow
- Animations + microinteractions
- App Store + Google Play release
- Geolocation notifications (expo-location)

### 📋 Phase 3 — Growth
- Family Plan (shared budgets + shopping list)
- Open Banking via GoCardless (PSD2/Greece)
- VA Integration (Voice Assistant)
- Widget (iOS + Android)

---

## Future: VA Integration Architecture
```
VA (Siri / Google / Custom)
↓
Supabase Edge Functions (API layer)
↓
Intent Parser
├── "Πρόσθεσε €5 καφέ"     → addTransaction()
├── "Βάλε γάλα στη λίστα"  → addShoppingItem()
└── "Πόσα έξοδα έχω;"      → getStats()
↓
Lumi Database
```

All hooks (useTransactions, useShoppingList κλπ) είναι ήδη atomic functions — έτοιμα για VA integration.

---

## Future: Family Plan — Shared Shopping List

Real-time sync μέσω Supabase Realtime:
- Κάθε μέλος βλέπει τη λίστα live
- Προσθήκη item → εμφανίζεται αμέσως σε όλους
- Check item → διαγραμμίζεται σε όλους real-time
- Αποτρέπει διπλές αγορές

Implementation:
- Supabase Realtime subscriptions στο list.tsx
- Family "room" με shared group_id
- Push notifications για νέα items

---

## Future: Widget

iOS/Android widget για γρήγορη καταχώριση:
- "+ Έξοδο" — άμεση καταχώριση χωρίς άνοιγμα app
- "+ Λίστα" — προσθήκη item στη shopping list
- Implementation: Expo Widgets (SDK 54+)

---

## Security

- Supabase credentials στο .env (δεν ανεβαίνουν στο GitHub)
- Row Level Security σε όλους τους πίνακες
- Κάθε user βλέπει ΜΟΝΟ τα δικά του data
- Session persistence μέσω AsyncStorage

---

## Running the App

```bash
cd "/Users/cracken8681/Desktop/Coding projects/Lumi"
npx expo start --clear
# Scan QR με Expo Go (iOS) — same WiFi
```

**Expo account:** cracken8681@gmail.com  
**Supabase project:** fwpkzlyivebdknbqmqus
