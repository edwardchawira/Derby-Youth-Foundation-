// Vapi Edge Function: Check booking availability
// Called by Vapi to check if a time slot is available

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

// Helper function to convert YYYY-MM-DD to DD-MM-YYYY (for user display)
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔍 vapi-check-availability called');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing environment variables');
      return new Response(
        JSON.stringify({ 
          available: false,
          error: 'Server configuration error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
          conflicts: [{ type: 'server_error', message: 'Server configuration error' }]
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body with better error handling
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error('❌ Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({
          available: false,
          error: 'Invalid request format',
          conflicts: [{ type: 'request_error', message: 'Could not parse request body' }]
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { booking_date, booking_time, session_hours, booking_type = 'studio' } = requestData;
    
    console.log('📥 Request data:', { booking_date, booking_time, session_hours, booking_type });

    if (!booking_date) {
      return new Response(
        JSON.stringify({
          available: false,
          error: 'booking_date is required',
          conflicts: [{ type: 'validation_error', message: 'Booking date is required' }]
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert date from DD-MM-YYYY to YYYY-MM-DD for database
    const dbDate = convertDateToDBFormat(booking_date);

    // Parse the date and time
    const requestedDate = new Date(dbDate);
    if (isNaN(requestedDate.getTime())) {
      return new Response(
        JSON.stringify({
          available: false,
          error: `Invalid date format. Expected DD-MM-YYYY format (e.g., 25-12-2024). Received: ${booking_date}`,
          conflicts: [{ type: 'validation_error', message: `Invalid date format: ${booking_date}` }]
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestedDateOnly = new Date(requestedDate);
    requestedDateOnly.setHours(0, 0, 0, 0);
    
    if (requestedDateOnly < today) {
      return new Response(
        JSON.stringify({
          available: false,
          conflicts: [{
            type: 'date_validation',
            message: 'Cannot book dates in the past. Please select today or a future date.',
            current_date: convertDateToDisplayFormat(today.toISOString().split('T')[0])
          }],
          requested_date: booking_date,
          requested_time: booking_time,
          requested_hours: session_hours || 1,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestedTime = booking_time || '09:00'; // Default to 9 AM if not provided
    const [hours, minutes] = requestedTime.split(':').map(Number);
    
    requestedDate.setHours(hours, minutes, 0, 0);
    const requestedStart = requestedDate;
    const requestedEnd = new Date(requestedStart);
    requestedEnd.setHours(requestedStart.getHours() + (session_hours || 1));

    // Check conflicts based on booking type
    let conflicts: Array<{
      type: string;
      booking_time?: string;
      session_hours?: number;
      message?: string;
    }> = [];

    // Check blocked slot (date + time)
    const { data: blockedRow } = await supabaseClient
      .from('blocked_slots')
      .select('id')
      .eq('blocked_date', dbDate)
      .eq('blocked_time', (booking_time || '09:00').slice(0, 5))
      .maybeSingle();

    if (blockedRow) {
      conflicts.push({
        type: 'blocked',
        message: 'This time slot is not available for booking',
      });
    }

    if (booking_type === 'studio' && conflicts.length === 0) {
      // For studio bookings, we need booking_time to check availability
      if (!booking_time) {
        return new Response(
          JSON.stringify({
            available: false,
            error: 'booking_time is required for studio bookings',
            conflicts: [{ type: 'validation_error', message: 'Studio bookings require a booking time' }],
            requested_date: booking_date,
            booking_type: booking_type,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check studio_bookings for conflicts (use DB format date)
      const { data: studioBookings, error: studioError } = await supabaseClient
        .from('studio_bookings')
        .select('booking_date, booking_time, session_hours, booking_status')
        .eq('booking_date', dbDate)
        .in('booking_status', ['pending', 'confirmed', 'completed']);

      if (studioError) {
        console.error('❌ Error checking studio bookings:', studioError);
        // Don't fail completely - return available but with a warning
        console.log('⚠️ Database error, but continuing with availability check');
      } else if (studioBookings && studioBookings.length > 0) {
        console.log(`📊 Found ${studioBookings.length} existing studio bookings for ${dbDate}`);
        // Check each booking for time overlap
        for (const booking of studioBookings) {
          if (!booking.booking_time) continue;
          
          const [bookingHours, bookingMinutes] = booking.booking_time.split(':').map(Number);
          const bookingStart = new Date(requestedDate);
          bookingStart.setHours(bookingHours, bookingMinutes, 0, 0);
          
          const bookingEnd = new Date(bookingStart);
          bookingEnd.setHours(bookingStart.getHours() + (booking.session_hours || 1));

          // Check if times overlap
          if (requestedStart < bookingEnd && requestedEnd > bookingStart) {
            conflicts.push({
              type: 'studio',
              booking_time: booking.booking_time,
              session_hours: booking.session_hours,
              message: `Time slot ${booking.booking_time} is already booked for ${booking.session_hours} hour(s)`,
            });
          }
        }
      } else {
        console.log('✅ No existing studio bookings found for this date');
      }
    } else if (booking_type === 'equipment') {
      // For equipment bookings, we don't need strict time-based availability checks
      // Equipment can be rented on the same date by multiple customers (as long as inventory allows)
      // We only validate that:
      // 1. The date is not in the past (already checked above)
      // 2. The date is valid
      // Equipment availability is based on inventory, not calendar conflicts
      
      console.log('📦 Equipment booking - no time-based conflicts to check');
      
      // Optional: Check if there are any equipment bookings on this date for reference
      // But don't mark it as unavailable - equipment can be rented multiple times per day
      const { data: equipmentBookings, error: equipmentError } = await supabaseClient
        .from('bookings')
        .select('booking_date, duration_days, status')
        .eq('booking_date', dbDate)
        .in('status', ['pending', 'confirmed']);

      if (equipmentError) {
        console.error('⚠️ Error checking equipment bookings:', equipmentError);
        // Don't fail - equipment availability is not strictly calendar-based
      } else {
        console.log(`📊 Found ${equipmentBookings?.length || 0} equipment bookings on this date (not blocking)`);
      }
      
      // Equipment bookings are generally available - no conflicts for calendar purposes
      // Note: Actual equipment availability would depend on inventory/stock levels
      // which is beyond the scope of calendar-based availability checking
    } else {
      console.error(`❌ Unknown booking_type: ${booking_type}`);
      return new Response(
        JSON.stringify({
          available: false,
          error: `Invalid booking_type: ${booking_type}. Must be 'studio' or 'equipment'`,
          conflicts: [{ type: 'validation_error', message: `Invalid booking type: ${booking_type}` }]
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isAvailable = conflicts.length === 0;

    // Get current date for reference
    const todayForResponse = new Date();
    const currentDateStr = convertDateToDisplayFormat(todayForResponse.toISOString().split('T')[0]);

    const response = {
      available: isAvailable,
      conflicts: conflicts,
      requested_date: booking_date, // Return in original format (DD-MM-YYYY)
      requested_time: booking_time || null,
      requested_hours: session_hours || 1,
      booking_type: booking_type,
      current_date: currentDateStr, // Include current date so VAPI knows what today is
      message: isAvailable 
        ? (booking_type === 'equipment' 
          ? `Equipment can be collected on ${booking_date}. Date is available.`
          : `Time slot ${booking_time} on ${booking_date} is available.`)
        : `Time slot is not available. ${conflicts.length} conflict(s) found.`,
    };

    console.log('✅ Availability check result:', {
      available: isAvailable,
      conflicts_count: conflicts.length,
      booking_type,
    });

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error in check-availability:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Get current date for error response
    const todayForError = new Date();
    const currentDateStr = convertDateToDisplayFormat(todayForError.toISOString().split('T')[0]);
    
    return new Response(
      JSON.stringify({
        available: false,
        error: error.message || 'An error occurred while checking availability',
        conflicts: [{ type: 'server_error', message: error.message || 'Server error' }],
        current_date: currentDateStr,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
