# KuroStop Architecture Specification

## Overview

KuroStop is an offline-first, private personal discipline application for iOS designed to help a single adult user stop smoking, manage PMO, and adhere to a healthy sleep schedule.

This document describes the Phase 2 local-first architecture, separating concerns into strict layers:

```text
┌────────────────────────────────────────────────────────┐
│                      UI Layer                          │
│  React Native Screens, Expo Router, "Lembar" Theme     │
├────────────────────────────────────────────────────────┤
│                 Application Layer                      │
│   AppProvider, React Hooks (useToday, useNow), Actions │
├────────────────────────────────────────────────────────┤
│                   Domain Layer                         │
│  Consequence Engine, Financial Engine, Sleep Engine,    │
│  Streak Engine, Input Validation Guards                │
├────────────────────────────────────────────────────────┤
│                Repository Layer                        │
│  SmokingRepo, PmoRepo, SleepRepo, FinanceRepo,         │
│  UrgeRepo, SettingsRepo, CheckinRepo                   │
├────────────────────────────────────────────────────────┤
│               Persistence Layer                        │
│   SQLite Database (expo-sqlite), WAL mode, Migrations  │
└────────────────────────────────────────────────────────┘
```

## Core Principles

1. **Local-First & Zero Telemetry**:
   - All data resides strictly inside a local SQLite database on the user's device (`kurostop.db`).
   - No external API calls, no analytics, no cloud databases, no registration.

2. **Preserve Visual Identity ("Lembar")**:
   - The porcelain-paper and sumi-ink design system is completely preserved.
   - DaySheet consequence visual treatment, dynamic ink marks, tabular numerals, and fluid Reanimated transitions are maintained.

3. **Deterministic Business Logic**:
   - Consequence zone evaluation is a pure, side-effect-free function:
     `calculateDailyZone(context): ConsequenceResult`.
   - Financial calculations use integer IDR (zero floating-point precision loss).
   - Streaks strictly distinguish verified clean days from unverified days (empty event list does not automatically equal clean).

4. **Strict Isolation of Demonstration Data**:
   - Production SQLite database stores real user records only.
   - Synthetic demo records are isolated to development/testing utility modules and can only be seeded if the user explicitly opts in.

5. **No Claude-Mem Dependency**:
   - All architectural context and project rules are maintained exclusively via project files (`AGENTS.md`, `docs/*`).

## Navigation Architecture (Session 6)

The app previously registered **every** screen as a tab in a single root `Tabs`
navigator and hid secondary screens with `href: null`. React Navigation's tab
router treats `router.push` as a tab jump, and its default `backBehavior` is
`firstRoute`. As a result, closing any pushed screen bounced the user to the
first tab ("Hari Ini"), which read like "every tap returns to the home tab".

The current structure separates the two navigators:

```text
src/app/_layout.tsx          Root <Stack> + declarative onboarding gate
├─ (tabs)/_layout.tsx        Bottom <Tabs> — exactly five destinations
│  ├─ index.tsx              Hari Ini
│  ├─ smoke.tsx / pmo.tsx / sleep.tsx / more.tsx
├─ log.tsx                   Stack screen (modal)
├─ history.tsx               Stack screen
├─ money.tsx                 Stack screen
├─ urge.tsx                  Stack screen (modal)
├─ settings.tsx              Stack screen
├─ onboarding.tsx            Stack screen, guarded while onboarding is pending
└─ +not-found.tsx            Guarded fallback
```

Rules for future screens:

1. A destination that appears in the tab bar goes in `src/app/(tabs)/`.
2. Anything opened with `router.push()` goes next to the root `_layout.tsx` and
   is declared as a `<Stack.Screen>`.
3. Never navigate away from onboarding imperatively. `Stack.Protected` reacts to
   `state.onboarded`, so finishing onboarding swaps the navigator automatically.
4. Deep links used by automation (`kurostop://onboarding?action=quick-start`)
   stay in the route file; the wizard UI lives in
   `src/components/onboarding/OnboardingScreen.tsx`.

## State Write Path (Session 6)

`AppProvider` keeps optimistic updates, but all SQLite writes now pass through a
FIFO promise queue (`queueWrite`) so repeated taps cannot interleave
transactions. `add` and `restore` share the single `persistEntry` function, and
failed restores roll back by `entry.id` instead of the previously-undefined
global `id`. `ENTRY_ADDED` / `ENTRY_ADD_FAILED` milestones make simulator logs
diagnostic.

`AppLockProvider` only renders its full-screen overlays after the store is ready
and onboarding is complete, prompts at most once per lock cycle, ignores the
`inactive` state caused by Face ID itself, and fails open when the device has
neither biometrics nor a passcode so the UI can never become untappable.

