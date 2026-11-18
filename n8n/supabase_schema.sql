-- 脆友美食地圖｜階段 5～7 資料庫結構（Supabase / PostgreSQL）
-- 店家主表可先留在 Google 試算表，超過 50~100 家後可一併搬遷

-- 1. 玩家表（店家與食客）
CREATE TABLE IF NOT EXISTS players (
  line_user_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT '食客' CHECK (role IN ('店家', '食客')),
  total_points INTEGER NOT NULL DEFAULT 0,
  level_badge TEXT NOT NULL DEFAULT '新芽' CHECK (level_badge IN ('新芽', '熱心店家', '互推達人')),
  my_store_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 事件紀錄表（去逛、分享、任務、互推）
CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  line_user_id TEXT NOT NULL REFERENCES players(line_user_id),
  store_id TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('visit', 'share', 'daily_task_bonus', 'collab_post')),
  channel TEXT DEFAULT '',
  meta JSONB DEFAULT '{}'::jsonb,
  event_date DATE NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Taipei')::DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_user_date ON events(line_user_id, event_date, action_type);
CREATE INDEX IF NOT EXISTS idx_events_store_date ON events(store_id, event_date, action_type);

-- 防止同一 LINE 帳號、同一家店、同一天重複計分「去逛」
CREATE UNIQUE INDEX IF NOT EXISTS uq_daily_visit
  ON events(line_user_id, store_id, event_date)
  WHERE action_type = 'visit';

-- 3. 點數帳本（方便查帳與扣回）
CREATE TABLE IF NOT EXISTS points_ledger (
  id BIGSERIAL PRIMARY KEY,
  line_user_id TEXT NOT NULL REFERENCES players(line_user_id),
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  ref_event_id BIGINT REFERENCES events(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_user ON points_ledger(line_user_id, created_at DESC);

-- 4. 互推夥伴配對表
CREATE TABLE IF NOT EXISTS collab_pairs (
  id BIGSERIAL PRIMARY KEY,
  week_key TEXT NOT NULL,
  store_a_id TEXT NOT NULL,
  store_b_id TEXT NOT NULL,
  store_a_post_url TEXT DEFAULT '',
  store_b_post_url TEXT DEFAULT '',
  verified_by_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
