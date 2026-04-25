# Lumi 💡

A modern personal finance + supermarket deals app built with React Native & Expo.

Lumi solves two daily problems in one place: knowing exactly where your money goes, and never missing a supermarket deal when you're near a store.

---

## Features

- **Budget Dashboard** — Monthly overview with spending progress, category breakdown, and Lumi Score (0–100 financial health indicator)
- **Expense Tracking** — Add and delete transactions manually; budgets update in real time
- **Deals Feed** — Supermarket offers from local chains with discount percentage and distance
- **Shopping List** — Add items, check them off while shopping
- **Dark / Light Mode** — Follows iOS/Android system setting automatically
- **Authentication** — Email/password sign in and registration via Supabase Auth
- **Multi-language** — English and Greek (more coming)

---

## Stack

| | |
|---|---|
| Framework | React Native 0.81.5 + Expo SDK 54 |
| Navigation | Expo Router 6 (file-based) |
| State | Zustand |
| Backend | Supabase (database + auth) |
| Fonts | Inter (@expo-google-fonts) |
| Icons | Ionicons (@expo/vector-icons) |
| Language | TypeScript |

---

## Getting Started

**Requirements:** Node.js 18+, Expo Go app on your phone

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npx expo start --clear

# 3. Scan the QR code with Expo Go (iOS) or the Camera app (Android)
```

> Phone and computer must be on the same WiFi network.

---

## Project Structure

```
app/
├── _layout.tsx          # Root layout (fonts, theme)
└── (tabs)/
    ├── index.tsx        # Home — Dashboard
    ├── expenses.tsx     # Expense tracking
    ├── deals.tsx        # Supermarket deals
    ├── list.tsx         # Shopping list
    └── profile.tsx      # Settings
constants/
├── LumiColors.ts        # Design system (light + dark)
└── categories.ts        # Expense categories
store/
└── useAppStore.ts       # Global state (Zustand)
lib/
└── supabase.ts          # Supabase client (auth + database)
hooks/
├── useTransactions.ts   # Supabase CRUD for transactions
└── useBudgets.ts        # Supabase CRUD for budgets
```

---

## Roadmap

- [ ] Supabase — data persistence & auth
- [ ] Geolocation alerts — notify when near a store with matching deals
- [ ] Open banking — auto bank sync via GoCardless (PSD2 / Greece)
- [ ] Family Plan — shared budgets with subscription
- [ ] App Store + Google Play release

---

## Design

Inspired by Monzo and Revolut. Primary colour `#5B5FEF` (indigo). Full design tokens in `constants/LumiColors.ts`.
