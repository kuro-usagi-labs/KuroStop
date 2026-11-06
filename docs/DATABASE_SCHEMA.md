# KuroStop Database Schema

Database Name: `kurostop.db`  
Engine: SQLite 3 (via `expo-sqlite`)  
PRAGMA: `journal_mode = WAL; foreign_keys = ON; busy_timeout = 5000;`

## Tables

### 1. `schema_migrations`
Tracks applied migration scripts.
```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at INTEGER NOT NULL
);
```

### 2. `smoking_events`
Individual cigarette consumption logs.
```sql
CREATE TABLE IF NOT EXISTS smoking_events (
  id TEXT PRIMARY KEY,
  qty INTEGER NOT NULL CHECK(qty > 0),
  timestamp INTEGER NOT NULL,
  timezone_offset_ms INTEGER NOT NULL DEFAULT 25200000,
  day_key TEXT NOT NULL,
  trigger TEXT,
  note TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_smoking_day_key ON smoking_events(day_key);
CREATE INDEX IF NOT EXISTS idx_smoking_timestamp ON smoking_events(timestamp);
```

### 3. `pmo_events`
Pornography, masturbation, and combined sessions.
```sql
CREATE TABLE IF NOT EXISTS pmo_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('p', 'm', 'pmo')),
  timestamp INTEGER NOT NULL,
  timezone_offset_ms INTEGER NOT NULL DEFAULT 25200000,
  day_key TEXT NOT NULL,
  trigger TEXT,
  note TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pmo_day_key ON pmo_events(day_key);
CREATE INDEX IF NOT EXISTS idx_pmo_timestamp ON pmo_events(timestamp);
```

### 4. `sleep_sessions`
Sleep tracking with cross-midnight association.
```sql
CREATE TABLE IF NOT EXISTS sleep_sessions (
  id TEXT PRIMARY KEY,
  start_time INTEGER NOT NULL,
  end_time INTEGER,
  target_bedtime_min INTEGER NOT NULL,
  night_day_key TEXT NOT NULL,
  timezone_offset_ms INTEGER NOT NULL DEFAULT 25200000,
  note TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sleep_night_key ON sleep_sessions(night_day_key);
CREATE INDEX IF NOT EXISTS idx_sleep_start ON sleep_sessions(start_time);
```

### 5. `cigarette_purchases`
Financial transactions for cigarettes (packs or loose sticks).
```sql
CREATE TABLE IF NOT EXISTS cigarette_purchases (
  id TEXT PRIMARY KEY,
  unit TEXT NOT NULL CHECK(unit IN ('bungkus', 'batang')),
  qty INTEGER NOT NULL CHECK(qty > 0),
  price INTEGER NOT NULL CHECK(price >= 0),
  brand TEXT,
  timestamp INTEGER NOT NULL,
  day_key TEXT NOT NULL,
  note TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_purchase_day_key ON cigarette_purchases(day_key);
CREATE INDEX IF NOT EXISTS idx_purchase_timestamp ON cigarette_purchases(timestamp);
```

### 6. `personal_settings`
Singleton configuration row (`key = 'current'`).
```sql
CREATE TABLE IF NOT EXISTS personal_settings (
  key TEXT PRIMARY KEY CHECK(key = 'current'),
  habits_json TEXT NOT NULL,
  smoke_target INTEGER NOT NULL CHECK(smoke_target >= 0),
  pmo_target INTEGER NOT NULL CHECK(pmo_target >= 0),
  bedtime INTEGER NOT NULL CHECK(bedtime >= 0 AND bedtime < 1440),
  wake INTEGER NOT NULL CHECK(wake >= 0 AND wake < 1440),
  late_grace INTEGER NOT NULL CHECK(late_grace >= 0),
  baseline_per_day INTEGER NOT NULL CHECK(baseline_per_day > 0),
  pack_price INTEGER NOT NULL CHECK(pack_price >= 0),
  pack_size INTEGER NOT NULL CHECK(pack_size > 0),
  single_price INTEGER NOT NULL CHECK(single_price >= 0),
  sensitivity TEXT NOT NULL CHECK(sensitivity IN ('lunak', 'standar', 'keras')),
  intensity TEXT NOT NULL CHECK(intensity IN ('normal', 'strict', 'brutal')),
  messages_on INTEGER NOT NULL CHECK(messages_on IN (0, 1)),
  notif_json TEXT NOT NULL,
  app_lock INTEGER NOT NULL CHECK(app_lock IN (0, 1)),
  pmo_cover INTEGER NOT NULL CHECK(pmo_cover IN (0, 1)),
  reduce_motion TEXT NOT NULL CHECK(reduce_motion IN ('system', 'on', 'off')),
  day_boundary INTEGER NOT NULL CHECK(day_boundary >= 0 AND day_boundary <= 12),
  onboarded INTEGER NOT NULL CHECK(onboarded IN (0, 1)),
  baseline_effective_date TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### 7. `urge_events`
Urge intervention events ("Gue Lagi Pengen...").
```sql
CREATE TABLE IF NOT EXISTS urge_events (
  id TEXT PRIMARY KEY,
  habit TEXT NOT NULL CHECK(habit IN ('smoke', 'pmo', 'sleep')),
  timestamp INTEGER NOT NULL,
  day_key TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK(outcome IN ('resisted', 'gave_in', 'unresolved')),
  method TEXT CHECK(method IN ('breath', 'delay', 'none', NULL)),
  trigger TEXT,
  note TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_urge_day_key ON urge_events(day_key);
```

### 8. `daily_checkins`
Explicit verification of clean days.
```sql
CREATE TABLE IF NOT EXISTS daily_checkins (
  day_key TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK(status IN ('clean_confirmed', 'unverified')),
  timestamp INTEGER NOT NULL,
  note TEXT
);
```
