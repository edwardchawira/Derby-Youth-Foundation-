// Vapi Edge Function: Get available time slots for a date
// Returns available booking times for voice agent

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to convert DD-MM-YYYY to YYYY-MM-DD (for database)
function convertDateToDBFormat(dateStr: string): string {
  // Check if already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Convert DD-MM-YYYY to YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
    // DD-MM-YYYY format
    const [day, month, year] = parts;
    return `${year}-${month}-${day}`;
  }
  
  // Try to parse as-is if format is different
  return dateStr;
}

// Helper function to convert YYYY-MM-DD to DD-MM-YYYY (for display)
function convertDateToDisplayFormat(dateStr: string): string {
  // Check if already in DD-MM-YYYY format
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Convert YYYY-MM-DD to DD-MM-YYYY
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const [year, month, day] = parts;
    return `${day}-${month}-${year}`;
  }
  
  return dateStr;
}

// Available booking time slots (09:00 - 23:00)
const AVAILABLE_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
];

const SLOT_DURATION_HOURS = 1; // Default 1 hour slots

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔍 vapi-get-available-slots called');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const { booking_date, booking_type = 'studio', session_hours = 1 } = await req.json();

    if (!booking_date) {
      return new Response(
        JSON.stringify({ error: 'booking_date is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert date from DD-MM-YYYY to YYYY-MM-DD for database
    const dbDate = convertDateToDBFormat(booking_date);

    // Validate date format
    const testDate = new Date(dbDate);
    if (isNaN(testDate.getTime())) {
      return new Response(
        JSON.stringify({ error: `Invalid date format. Expected DD-MM-YYYY format (e.g., 25-12-2024). Received: ${booking_date}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestedDateOnly = new Date(testDate);
    requestedDateOnly.setHours(0, 0, 0, 0);

    if (requestedDateOnly < today) {
      return new Response(
        JSON.stringify({
          booking_date: booking_date,
          available_slots: [],
          booking_type: booking_type,
          recommended_slots: [],
          error: 'Cannot get slots for dates in the past',
          current_date: convertDateToDisplayFormat(today.toISOString().split('T')[0]),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check blocked slots for this date
    const { data: blockedSlots } = await supabaseClient
      .from('blocked_slots')
      .select('blocked_time')
      .eq('blocked_date', dbDate);

    const blockedTimes = new Set((blockedSlots || []).map((r) => r.blocked_time));
    const allBlocked = blockedTimes.size >= 15;

    // Handle equipment bookings - full day blocked = not available
    if (booking_type === 'equipment') {
      if (allBlocked) {
        return new Response(
          JSON.stringify({
            booking_date: booking_date,
            available_slots: [],
            booking_type: booking_type,
            recommended_slots: [],
            error: 'This date is not available for booking',
            current_date: convertDateToDisplayFormat(today.toISOString().split('T')[0]),
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      // blocked_dates check was done above - if we reach here, date is not blocked
      return new Response(
        JSON.stringify({
          booking_date: booking_date,
          available_slots: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'], // Suggested collection times
          booking_type: booking_type,
          recommended_slots: ['09:00', '10:00', '11:00', '14:00', '15:00'],
          message: 'Equipment can be collected on this date. Suggested collection times are available.',
          current_date: convertDateToDisplayFormat(today.toISOString().split('T')[0]),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For studio bookings, check time slot availability
    let bookedTimes: string[] = [];

    if (booking_type === 'studio') {
      const { data: studioBookings } = await supabaseClient
        .from('studio_bookings')
        .select('booking_time, session_hours')
        .eq('booking_date', dbDate)
        .in('booking_status', ['pending', 'confirmed', 'completed']);

      if (studioBookings) {
        // Calculate all time slots that are booked
        for (const booking of studioBookings) {
          const [startHours, startMinutes] = booking.booking_time.split(':').map(Number);
          const bookedHours = booking.session_hours;
          
          // Mark all hours in this booking as unavailable
          for (let i = 0; i < bookedHours; i++) {
            const hour = startHours + i;
            const timeSlot = `${hour.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`;
            if (!bookedTimes.includes(timeSlot)) {
              bookedTimes.push(timeSlot);
            }
          }
        }
      }
    }

    // Find available slots (exclude booked and blocked)
    const availableSlots = AVAILABLE_SLOTS.filter(slot => {
      const [slotHours] = slot.split(':').map(Number);
      const slotEnd = slotHours + session_hours;
      
      for (let i = 0; i < session_hours; i++) {
        const checkHour = slotHours + i;
        const checkTime = `${checkHour.toString().padStart(2, '0')}:00`;
        if (bookedTimes.includes(checkTime) || blockedTimes.has(checkTime)) return false;
      }
      return slotEnd <= 24;
    });

    // Get current date for reference
    const currentDateStr = convertDateToDisplayFormat(today.toISOString().split('T')[0]);

    return new Response(
      JSON.stringify({
        booking_date: booking_date, // Return in original format (DD-MM-YYYY)
        available_slots: availableSlots,
        booking_type: booking_type,
        recommended_slots: availableSlots.slice(0, 5), // First 5 for voice response
        current_date: currentDateStr, // Include current date so VAPI knows what today is
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-available-slots:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
