export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY,
  smoking_target_daily INTEGER NOT NULL DEFAULT 0,
  pmo_target_daily INTEGER NOT NULL DEFAULT 0,
  target_bedtime TEXT NOT NULL DEFAULT '23:00',
  target_wake_time TEXT NOT NULL DEFAULT '06:00',
  daily_cigarette_spend_baseline INTEGER NOT NULL DEFAULT 30000,
  accountability_intensity TEXT NOT NULL DEFAULT 'brutal',
  reduce_motion INTEGER NOT NULL DEFAULT 0,
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS habit_events (
  id TEXT PRIMARY KEY,
  habit_type TEXT NOT NULL,
  event_timestamp INTEGER NOT NULL,
  local_date TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  pmo_type TEXT,
  trigger_tag TEXT,
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  purchase_timestamp INTEGER NOT NULL,
  local_date TEXT NOT NULL,
  item_type TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price INTEGER NOT NULL,
  brand_name TEXT,
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sleep_sessions (
  id TEXT PRIMARY KEY,
  sleep_night_date TEXT NOT NULL,
  bedtime_timestamp INTEGER NOT NULL,
  wake_timestamp INTEGER,
  target_bedtime TEXT NOT NULL,
  lateness_minutes INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS urge_logs (
  id TEXT PRIMARY KEY,
  urge_timestamp INTEGER NOT NULL,
  local_date TEXT NOT NULL,
  habit_type TEXT NOT NULL,
  resisted INTEGER NOT NULL DEFAULT 1,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  trigger_tag TEXT,
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_habit_events_date ON habit_events(local_date);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(local_date);
CREATE INDEX IF NOT EXISTS idx_sleep_night_date ON sleep_sessions(sleep_night_date);
CREATE INDEX IF NOT EXISTS idx_urge_logs_date ON urge_logs(local_date);
`;
