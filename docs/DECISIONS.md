# DECISIONS.md — KuroStop Architectural & Design Decision Records

## ADR 001: Visual Direction Selection — Direction A ("White Corruption")
* **Date:** 2026-11-05
* **Context:**
  Huashu Design guidelines require creating and evaluating three distinct visual directions:
  - **Direction A: White Corruption** (Pristine light canvas `#F8FAF9`, mint-green breathing orb, organic visual decay via chromatic aberration, amber fracture borders, and deep crimson ambient tension).
  - **Direction B: Clinical Threat** (Sterile medical monitor, monospaced tabular layouts, cold monochrome grid, surgical diagnostic alerts).
  - **Direction C: Minimal Editorial Discipline** (Swiss typography, extreme scale contrasts, stark monochrome rules, editorial text treatments).
* **Evaluation Matrix:**
  | Metric | Direction A (White Corruption) | Direction B (Clinical Threat) | Direction C (Minimal Editorial) |
  |---|---|---|---|
  | Emotional Consequence | 10/10 (Living, immediate visceral feedback) | 8/10 (Cold, diagnostic) | 7/10 (Intellectual, detached) |
  | Readability & Hierarchy | 9/10 (Strict typography with soft layers) | 8/10 (Dense data tables) | 9/10 (High readability) |
  | iOS HIG Conformance | 9.5/10 (System font, native sheets, standard tabs) | 7.5/10 (Too non-standard/dense) | 8.5/10 (Clean, but sterile) |
  | Motion Potential | 10/10 (Dynamic morphing orb, organic pulse) | 6/10 (Flickering dials) | 5/10 (Subtle line slides) |
  | Light-Theme Fulfillment | 10/10 (Designed specifically for light canvas decay) | 8.5/10 (Sterile white) | 9/10 (Paper white) |
* **Decision:** Direction A ("White Corruption") is selected as the primary visual production architecture. It delivers the intimate, intimidating consequence model requested by the user without sacrificing Apple's design purity.

---

## ADR 002: Deterministic Consequence Scoring Engine
* **Date:** 2026-11-05
* **Context:**
  The visual zone must not transition arbitrarily or based on unscientific scoring formulas. Transitions must be deterministic, transparent, and configurable per habit.
* **Decision:**
  - Define `calculateDailyZone(events, goals, sleepRecord, thresholds)`.
  - Severity points are assigned:
    - Smoking: 0 = Clear, 1 = Warning (+25 pts), 2-3 = Danger (+50 pts), 4+ = Critical (+75 pts).
    - PMO: 0 = Clear, 1 = Warning (+35 pts), 2+ = Critical (+80 pts).
    - Sleep lateness: 0-15 min = Clear, 16-45 min = Warning (+20 pts), 46-90 min = Danger (+45 pts), >90 min = Critical (+75 pts).
  - Zone thresholds:
    - Score 0: `CLEAR`
    - Score 1 - 39: `WARNING`
    - Score 40 - 74: `DANGER`
    - Score 75+: `CRITICAL`
  - Any single critical violation (e.g., >3 cigarettes or multiple PMO episodes) immediately pulls the environment into DANGER or CRITICAL.
  - Zero recorded events on a day shows an "unverified fresh" state rather than a falsely certified win until the day concludes or the user logs their status.

---

## ADR 003: Financial Calculations & Integer Currency
* **Date:** 2026-11-05
* **Context:**
  Floating point math can introduce rounding errors in currency calculations. Cigarette pack and stick prices in Indonesia fluctuate (e.g. Rp 28.000 today, Rp 17.000 for a different brand tomorrow).
* **Decision:**
  - All financial amounts are stored as integer Indonesian Rupiah (`IDR`).
  - Distinguish explicitly between:
    - `actualSpending = sum(valid cigarette purchase totals)`
    - `baselineExpectedSpending = dailyBaselineRate * trackedDayCount`
    - `avoidedSpending = baselineExpectedSpending - actualSpending` (may be negative if user outspends their baseline).
  - Honest copy: Label avoided spending as "Perkiraan pengeluaran yang dihindari" (Estimated avoided spending), never cash in hand.

---

## ADR 004: Local SQLite Persistence with Explicit Migrations
* **Date:** 2026-11-05
* **Context:**
  The app is private and offline-first. Habit records, purchases, and settings must survive restarts, app termination, and system updates.
* **Decision:**
  - Use `expo-sqlite` with explicit SQL migrations.
  - Tables:
    - `events`: Individual habit events (smoking, pmo, sleep markers) with UUID, timestamp, local date string (`YYYY-MM-DD`), type, count, note, trigger tag.
    - `purchases`: Cigarette pack/stick purchases with UUID, timestamp, local date, quantity, total price (integer IDR), brand/note.
    - `sleep_sessions`: Bedtime sessions crossing midnight, associated with the originating sleep night date (`YYYY-MM-DD`), target bedtime, actual sleep time, wake time, and lateness minutes.
    - `user_settings`: Baseline spending, targets, accountability level (`normal` | `strict` | `brutal`), bedtime string (`HH:mm`), reduce motion flag.
    - `urge_logs`: Urge events ("Gue Lagi Pengen..."), habit type, resisted (boolean), duration seconds, trigger tag.
