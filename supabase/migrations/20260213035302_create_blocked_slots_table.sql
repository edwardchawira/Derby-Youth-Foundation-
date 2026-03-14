-- Blocked slots: date + time specific (studio business hours 09:00-20:00)
CREATE TABLE IF NOT EXISTS blocked_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocked_date date NOT NULL,
  blocked_time text NOT NULL CHECK (blocked_time ~ '^\d{2}:\d{2}$'),
  created_at timestamptz DEFAULT now(),
  UNIQUE(blocked_date, blocked_time)
);

CREATE INDEX IF NOT EXISTS idx_blocked_slots_date ON blocked_slots(blocked_date);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_date_time ON blocked_slots(blocked_date, blocked_time);

ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read blocked_slots" ON blocked_slots
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage blocked_slots" ON blocked_slots
  FOR ALL USING (auth.role() = 'service_role');

-- Migrate existing blocked_dates if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blocked_dates') THEN
    INSERT INTO blocked_slots (blocked_date, blocked_time)
    SELECT bd.blocked_date, t.t
    FROM blocked_dates bd
    CROSS JOIN (
      SELECT '09:00' AS t UNION SELECT '10:00' UNION SELECT '11:00' UNION SELECT '12:00'
      UNION SELECT '13:00' UNION SELECT '14:00' UNION SELECT '15:00' UNION SELECT '16:00'
      UNION SELECT '17:00' UNION SELECT '18:00' UNION SELECT '19:00' UNION SELECT '20:00'
    ) t
    ON CONFLICT (blocked_date, blocked_time) DO NOTHING;
    DROP TABLE IF EXISTS blocked_dates;
  END IF;
END $$;
