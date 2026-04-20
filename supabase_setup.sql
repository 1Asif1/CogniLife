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
  sleep_duration FLOAT DEFAULT 0,
  mood INT DEFAULT 5,
  stress_level INT DEFAULT 5,
  energy_level INT DEFAULT 5,
  sleep_quality INT DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_id UUID REFERENCES daily_logs(id) ON DELETE CASCADE,
  health_risk_score FLOAT DEFAULT 0,
  fatigue_level FLOAT DEFAULT 0,
  stress_prediction FLOAT DEFAULT 0,
  sleep_quality_prediction FLOAT DEFAULT 0,
  anomaly_detected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_id UUID REFERENCES daily_logs(id) ON DELETE CASCADE,
  insight_text TEXT,
  recommendation TEXT,
  priority VARCHAR(50) DEFAULT 'low',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
CREATE POLICY "Allow all for users table" ON users FOR ALL TO public WITH CHECK (true);

-- RLS Policies for other tables (users can see all for now, restrict later with auth)
CREATE POLICY "Allow all for daily_logs" ON daily_logs FOR ALL TO public WITH CHECK (true);
CREATE POLICY "Allow all for predictions" ON predictions FOR ALL TO public WITH CHECK (true);
CREATE POLICY "Allow all for anomalies" ON anomalies FOR ALL TO public WITH CHECK (true);
CREATE POLICY "Allow all for behavior_clusters" ON behavior_clusters FOR ALL TO public WITH CHECK (true);
CREATE POLICY "Allow all for insights" ON insights FOR ALL TO public WITH CHECK (true);
