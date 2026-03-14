/*
  # Add Vapi Booking Calendar Support

  This migration adds indexes and helper functions to support phone booking calendar management
  via Vapi voice agent integration.

  1. Indexes for faster calendar queries
  2. Helper function to check booking conflicts
  3. View for unified calendar (optional)
*/

-- Add indexes for faster availability checks
CREATE INDEX IF NOT EXISTS idx_studio_bookings_date_status 
ON studio_bookings(booking_date, booking_status) 
WHERE booking_status IN ('pending', 'confirmed');

CREATE INDEX IF NOT EXISTS idx_studio_bookings_date_time 
ON studio_bookings(booking_date, booking_time);

CREATE INDEX IF NOT EXISTS idx_bookings_date_status 
ON bookings(booking_date, status) 
WHERE status IN ('pending', 'confirmed');

-- Create helper function to check time slot conflicts
CREATE OR REPLACE FUNCTION check_booking_conflict(
  p_booking_date date,
  p_booking_time time,
  p_session_hours integer,
  p_booking_id uuid DEFAULT NULL -- Exclude this booking if updating
)
RETURNS boolean AS $$
DECLARE
  conflict_count integer;
BEGIN
  -- Check for overlapping studio bookings
  SELECT COUNT(*) INTO conflict_count
  FROM studio_bookings
  WHERE booking_date = p_booking_date
    AND booking_status IN ('pending', 'confirmed')
    AND (p_booking_id IS NULL OR id != p_booking_id)
    AND (
      -- Check if booking times overlap
      (booking_time::time <= (p_booking_time + (p_session_hours || ' hours')::interval)::time
       AND (booking_time + (session_hours || ' hours')::interval)::time >= p_booking_time::time)
    );

  RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get available time slots for a date
CREATE OR REPLACE FUNCTION get_available_slots(
  p_booking_date date,
  p_session_hours integer DEFAULT 1
)
RETURNS TABLE(time_slot time) AS $$
DECLARE
  start_time time := '09:00'::time;
  end_time time := '20:00'::time;
  current_slot time;
  slot_end time;
BEGIN
  current_slot := start_time;
  
  WHILE current_slot <= (end_time - (p_session_hours || ' hours')::interval)::time LOOP
    slot_end := (current_slot + (p_session_hours || ' hours')::interval)::time;
    
    -- Check if this slot conflicts with any existing booking
    IF NOT EXISTS (
      SELECT 1
      FROM studio_bookings
      WHERE booking_date = p_booking_date
        AND booking_status IN ('pending', 'confirmed')
        AND (
          (booking_time::time < slot_end
           AND (booking_time + (session_hours || ' hours')::interval)::time > current_slot)
        )
    ) THEN
      RETURN QUERY SELECT current_slot;
    END IF;
    
    -- Move to next hour
    current_slot := (current_slot + '1 hour'::interval)::time;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_booking_conflict(date, time, integer, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_available_slots(date, integer) TO anon, authenticated;
