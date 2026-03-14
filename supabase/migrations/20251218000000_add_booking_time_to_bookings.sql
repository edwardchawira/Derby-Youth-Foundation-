-- Add booking_time field to bookings table for equipment collection time
-- This allows storing collection time for equipment rentals

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS booking_time text;

COMMENT ON COLUMN bookings.booking_time IS 'Collection time for equipment rentals (HH:MM format) or session time if applicable';
