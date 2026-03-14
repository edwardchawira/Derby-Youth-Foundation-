-- Extend business hours from 09:00-20:00 to 09:00-23:00

CREATE OR REPLACE FUNCTION get_available_slots(
  p_booking_date date,
  p_session_hours integer DEFAULT 1
)
RETURNS TABLE(time_slot time) AS $$
DECLARE
  start_time time := '09:00'::time;
  end_time time := '23:00'::time;
  current_slot time;
  slot_end time;
BEGIN
  current_slot := start_time;
  
  WHILE current_slot <= (end_time - (p_session_hours || ' hours')::interval)::time LOOP
    slot_end := (current_slot + (p_session_hours || ' hours')::interval)::time;
    
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
    
    current_slot := (current_slot + '1 hour'::interval)::time;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
