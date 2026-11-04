# AGENTS.md — KuroStop Multi-Agent & Engineering Guidance

## Overview
**KuroStop** is a personal-use iOS discipline system designed to stop three unwanted habits:
1. Smoking cigarettes
2. Pornography and masturbation (PMO)
3. Staying awake beyond a chosen bedtime (Begadang)

**Core Axiom:** *Your actions visibly change your environment.* Every violation deteriorates the UI from a calm mint-tinted light canvas into an intimidating corrupted state (CLEAR -> WARNING -> DANGER -> CRITICAL). At local calendar midnight, the visual atmosphere is reborn fresh, while historical event logs remain intact.

---

## Agent Roles & Responsibilities

| Role | Domain / Focus | Key Constraints |
|---|---|---|
| **Principal Architect** | System structure, persistence, offline-first reliability | SQLite migrations, zero-leak telemetry, deterministic zone calculations |
| **iOS HIG Designer** | Apple Human Interface Guidelines, visual craft, accessibility | 44pt touch targets, SF Pro typography scale, high contrast, Reduce Motion support |
| **Motion Engineer** | Living Orb, fluid microinteractions, transitions | Reanimated physics, no jank, no epilepsy/strobe triggers, graceful fallbacks |
| **Domain & Finance Specialist** | Indonesian habit taxonomy, financial math | Integer IDR, negative savings handling, baseline comparisons, honest Indonesian copy |

---

## Strict Behavioral Boundaries
1. **Never moralize or preach**: Maintain an objective, personal accountability tone in Bahasa Indonesia.
2. **Never claim fake capabilities**: Only document real, executed tests and installed packages.
3. **No cloud leaks**: KuroStop is 100% offline-first and private. Never send user habit logs to external APIs or agent memory.
4. **Light Theme First**: KuroStop uses a premium light interface (`#F8FAF9`) that degrades visually through subtle chromatic aberration, fissure borders, and deep red ambient tension.
5. **Accurate Financial Math**: Cigarette pricing is variable (e.g. Rp28.000 vs Rp17.000), integer-based, and distinguishes actual spending from baseline and avoided spending.
