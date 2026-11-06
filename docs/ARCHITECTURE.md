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
