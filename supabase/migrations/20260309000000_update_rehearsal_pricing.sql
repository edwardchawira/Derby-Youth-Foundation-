-- Update Rehearsal Space pricing: £26/hour, minimum 3 hours
-- four_hour_rate: £104 (26*4), eight_hour_rate: £208 (26*8) - slight discount for blocks
UPDATE studio_services
SET
  hourly_rate = 26.00,
  four_hour_rate = 100.00,
  eight_hour_rate = 200.00
WHERE type = 'rehearsal';
