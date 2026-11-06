# KuroStop Business Rules Specification

## 1. Consequence Zone Calculation

The app classifies each day into one of four consequence zones based on objective metrics:
- **CLEAR (`clear`)**: All active habits stayed within their configured targets.
- **WARNING (`warning`)**: Mild violation (1-2 points above target).
- **DANGER (`danger`)**: Moderate to severe violation (3-4 points above target).
- **CRITICAL (`critical`)**: Severe violations across one or multiple habits (>= 5 points).

### Point System:
1. **Smoking**:
   - `excess = max(0, daily_smoke_count - smoke_target)`
   - `smoking_severity = excess * 1` point.
2. **PMO**:
   - `excess = max(0, daily_pmo_sessions - pmo_target)`
   - `pmo_severity = excess * 2` points per session above target.
   - Note: A combined `pmo` session counts strictly as 1 session, never 2.
3. **Sleep**:
   - `late_minutes = sleep_start - target_bedtime`
   - If `late_minutes > late_grace`:
     - `<= 60 min`: 1 point
     - `61 - 120 min`: 2 points
     - `> 120 min`: 3 points
   - If user did not sleep by morning (exceeded day boundary): treated as 3 points.

### Sensitivity Thresholds:
- **Lunak (Lenient)**:
  - Warning: >= 2 points
  - Danger: >= 4 points
  - Critical: >= 7 points
- **Standar (Default)**:
  - Warning: >= 1 point
  - Danger: >= 3 points
  - Critical: >= 5 points
- **Keras (Strict)**:
  - Warning: >= 1 point
  - Danger: >= 2 points
  - Critical: >= 4 points

## 2. Streak Semantics

- A streak day must be **verified**:
  - Contains events within targets, OR
  - Contains a confirmed clean check-in (`clean_confirmed`).
- An **unverified day** (zero logged entries and no check-in) breaks an active streak.
- Today's date extends a streak if compliant so far, but does NOT break a streak if incomplete.

## 3. Financial Calculation Rules

- Currency: **Integer IDR** (Indonesian Rupiah).
- **Actual Spending**: Sum of all `cigarette_purchases.price` within the query period.
- **Daily Baseline Cost**: `baseline_per_day * (pack_price / pack_size)`
- **Period Baseline Expected Cost**: `daily_baseline_cost * days_in_period`
- **Estimated Avoided Spending**: `period_baseline_cost - actual_spending`
  - Can be negative if the user bought more than their historical baseline (honest accounting).
  - Never clamped to zero.

## 4. Sleep Tracking Rules

- Day boundary is 04:00 AM (Asia/Jakarta, UTC+7).
- A sleep session starting at 01:15 AM on Saturday belongs to Friday night (`night_day_key = 'YYYY-MM-DD'` of Friday).
- Only ONE active sleep session may exist at any time. Attempting to start another while one is open updates the existing or prompts resolution.
- Sleep lateness is calculated as `actual_start_ms - target_bedtime_ms`.
