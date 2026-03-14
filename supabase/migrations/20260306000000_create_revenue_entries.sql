-- Revenue entries: one row per Stripe-confirmed payment
-- Updated by stripe-webhook on checkout.session.completed
CREATE TABLE IF NOT EXISTS revenue_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount decimal(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'gbp',
  booking_id uuid,
  booking_type text NOT NULL CHECK (booking_type IN ('equipment', 'studio')),
  booking_number text,
  stripe_session_id text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_revenue_entries_created_at ON revenue_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_booking_id ON revenue_entries(booking_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_revenue_entries_booking_unique ON revenue_entries(booking_id, booking_type);

ALTER TABLE revenue_entries ENABLE ROW LEVEL SECURITY;

-- Service role can manage (stripe-webhook uses service role)
CREATE POLICY "Service role can manage revenue_entries" ON revenue_entries
  FOR ALL USING (auth.role() = 'service_role');

-- Allow read for admin dashboard (uses anon key)
CREATE POLICY "Allow read revenue_entries" ON revenue_entries
  FOR SELECT USING (true);

-- Backfill from existing completed/paid bookings (idempotent via ON CONFLICT)
INSERT INTO revenue_entries (amount, currency, booking_id, booking_type, booking_number, created_at)
SELECT total, 'gbp', id, 'equipment', booking_number, created_at
FROM bookings
WHERE status = 'completed'
ON CONFLICT (booking_id, booking_type) DO NOTHING;

-- Backfill studio bookings (direct from create-checkout-session only - have stripe_session_id)
-- Studio slots from equipment cart don't have stripe_session_id, avoiding double-count
INSERT INTO revenue_entries (amount, currency, booking_id, booking_type, booking_number, stripe_session_id, created_at)
SELECT package_price, 'gbp', id, 'studio', 'STUDIO-' || UPPER(LEFT(id::text, 8)), stripe_session_id, created_at
FROM studio_bookings
WHERE payment_status = 'paid'
  AND stripe_session_id IS NOT NULL
ON CONFLICT (booking_id, booking_type) DO NOTHING;
