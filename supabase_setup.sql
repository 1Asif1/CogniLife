-- ============================================================
-- CogniLife Database Schema - Run in Supabase SQL Editor
-- ============================================================

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  age INT,
  height INT,
  weight INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_logs table
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Mobile data (auto-collected)
  screen_time FLOAT DEFAULT 0,
  late_night_usage FLOAT DEFAULT 0,
  -- Wearable data (from Health Connect)
  sleep_hours FLOAT DEFAULT 0,
  activity_level VARCHAR(20) DEFAULT 'low',
  sitting_time FLOAT DEFAULT 0,
  inactivity_periods INT DEFAULT 0,
  steps INT DEFAULT 0,
  -- Manual entry
  meals_per_day INT DEFAULT 3,
  calorie_intake INT DEFAULT 0,
  food_quality INT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  log_id uuid null,
  fatigue integer null,
  future_health_risk integer null,
  diabetes_risk integer null,
  anemia_risk integer null,
  pcos_risk integer null,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  constraint predictions_pkey primary key (id),
  constraint predictions_log_id_fkey foreign KEY (log_id) references daily_logs (id),
  constraint predictions_user_id_fkey foreign KEY (user_id) references users (id)
);

-- Create anomalies table
CREATE TABLE IF NOT EXISTS anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_id UUID REFERENCES daily_logs(id) ON DELETE CASCADE,
  is_anomaly BOOLEAN DEFAULT FALSE,
  anomaly_type VARCHAR(100),
  anomaly_score FLOAT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create behavior_clusters table
CREATE TABLE IF NOT EXISTS behavior_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_id UUID REFERENCES daily_logs(id) ON DELETE CASCADE,
  cluster_id INT,
  cluster_name VARCHAR(255),
  cluster_confidence FLOAT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create insights table
CREATE TABLE IF NOT EXISTS insights (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  log_id uuid null,
  summary text null,
  reasons text null,
  recommendations text null,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  constraint insights_pkey primary key (id),
  constraint insights_log_id_fkey foreign KEY (log_id) references daily_logs (id),
  constraint insights_user_id_fkey foreign KEY (user_id) references users (id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id ON daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_user_id ON anomalies(user_id);
CREATE INDEX IF NOT EXISTS idx_behavior_clusters_user_id ON behavior_clusters(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON insights(user_id);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavior_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- RLS Policy for users (for now, allow all since we're using anon key with manual user_id)
CREATE POLICY "Allow all for users table" ON users FOR ALL TO public USING (true) WITH CHECK (true);

-- RLS Policies for other tables (users can see all for now, restrict later with auth)
CREATE POLICY "Allow all for daily_logs" ON daily_logs FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for predictions" ON predictions FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anomalies" ON anomalies FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for behavior_clusters" ON behavior_clusters FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for insights" ON insights FOR ALL TO public USING (true) WITH CHECK (true);
