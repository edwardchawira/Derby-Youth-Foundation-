// Vapi Edge Function: Update or cancel booking
// Allows voice agent to modify existing bookings for both studio and equipment

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔍 vapi-update-booking called');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing environment variables');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Server configuration error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body with error handling
    let requestBody;
    try {
      const bodyText = await req.text();
      if (!bodyText || bodyText.trim() === '') {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Empty request body',
            message: 'Request body is empty. Please provide booking details.',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      requestBody = JSON.parse(bodyText);
      console.log('📥 Request body:', JSON.stringify(requestBody, null, 2));
    } catch (parseError: any) {
      console.error('❌ Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request format',
          message: 'Request body is not valid JSON. Please check your request format.',
          details: parseError.message,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      booking_id,
      booking_number, // For equipment bookings
      booking_type = 'studio',
      action = 'update', // 'update' or 'cancel'
      customer_email, // For verification
      new_booking_date,
      new_booking_time,
      new_session_hours, // For studio bookings
      new_duration_days, // For equipment bookings
      new_booking_time_equipment, // Collection time for equipment
      new_special_requests,
    } = requestBody;

    if (!booking_id && !booking_number) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'booking_id (for studio) or booking_number (for equipment) is required' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify booking exists and belongs to customer (if email provided)
    let booking: any;
    let tableName: string;
    
    if (booking_type === 'studio') {
      if (!booking_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'booking_id is required for studio bookings' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Handle "STUDIO-33B6E329" format - extract UUID prefix
      let query = supabaseClient
        .from('studio_bookings')
        .select('*');
      
      if (booking_id.startsWith('STUDIO-')) {
        // Extract the UUID prefix (e.g., "33B6E329" from "STUDIO-33B6E329")
        const uuidPrefix = booking_id.replace('STUDIO-', '').toLowerCase();
        // Search by partial UUID match using ilike (case-insensitive)
        query = query.ilike('id', `${uuidPrefix}%`);
      } else {
        // Direct UUID match
        query = query.eq('id', booking_id);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        console.error('❌ Studio booking not found:', error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Studio booking not found',
            message: `Could not find a booking with ID: ${booking_id}. Please verify the booking ID and try again.`
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if booking is already cancelled
      if (data.booking_status === 'cancelled' && action === 'cancel') {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Booking already cancelled',
            message: 'This booking has already been cancelled.',
            booking_status: data.booking_status,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Allow updates and cancellations for all booking statuses (pending, confirmed, cancelled)
      // Just log the current status for reference
      if (data.booking_status) {
        console.log(`📊 Booking status: ${data.booking_status} - ${action === 'cancel' ? 'cancelling' : 'updating'}`);
      }

      // Verify customer email matches if provided
      if (customer_email && data.customer_email !== customer_email) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Unauthorized: Email does not match booking',
            message: 'The email provided does not match the booking. Please verify your email address.'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      booking = data;
      tableName = 'studio_bookings';
    } else if (booking_type === 'equipment') {
      const identifier = booking_number || booking_id;
      if (!identifier) {
        return new Response(
          JSON.stringify({ success: false, error: 'booking_number or booking_id is required for equipment bookings' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Try booking_number first, then id
      let query = supabaseClient
        .from('bookings')
        .select('*');
      
      if (booking_number) {
        query = query.eq('booking_number', booking_number);
      } else {
        query = query.eq('id', booking_id);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ success: false, error: 'Equipment booking not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify customer email matches if provided
      if (customer_email && data.customer_email !== customer_email) {
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized: Email does not match booking' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      booking = data;
      tableName = 'bookings';
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid booking_type. Must be "studio" or "equipment"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle cancellation
    if (action === 'cancel') {
      const statusField = booking_type === 'studio' ? 'booking_status' : 'status';
      
      // Check if already cancelled
      const currentStatus = booking_type === 'studio' ? booking.booking_status : booking.status;
      if (currentStatus === 'cancelled') {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Booking already cancelled',
            message: 'This booking has already been cancelled.',
            booking_id: booking.id,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`❌ Cancelling booking ${booking.id} (current status: ${currentStatus})`);
      
      const { error: updateError } = await supabaseClient
        .from(tableName)
        .update({ [statusField]: 'cancelled' })
        .eq('id', booking.id);

      if (updateError) {
        console.error('❌ Error cancelling booking:', updateError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: updateError.message || 'Failed to cancel booking',
            details: updateError 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ Booking cancelled successfully:', booking.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Booking cancelled successfully',
          booking_id: booking.id,
          booking_number: booking.booking_number || booking.id,
          previous_status: currentStatus,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle update - check for conflicts if date/time changed (studio only)
    if (booking_type === 'studio' && (new_booking_date || new_booking_time)) {
      // Convert date to DB format if provided
      const checkDate = new_booking_date ? convertDateToDBFormat(new_booking_date) : booking.booking_date;
      const checkTime = new_booking_time || booking.booking_time;
      const checkHours = new_session_hours || booking.session_hours;

      // Validate new date format if provided
      if (new_booking_date) {
        const testDate = new Date(checkDate);
        if (isNaN(testDate.getTime())) {
          return new Response(
            JSON.stringify({ 
              success: false,
              error: `Invalid date format. Expected DD-MM-YYYY format (e.g., 25-12-2024). Received: ${new_booking_date}` 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Check blocked slot (date + time) whenever date or time is being updated
      const timeStr = (checkTime || '09:00').toString().slice(0, 5);
      const { data: blockedRow } = await supabaseClient
        .from('blocked_slots')
        .select('id')
        .eq('blocked_date', checkDate)
        .eq('blocked_time', timeStr)
        .maybeSingle();

      if (blockedRow) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Time slot is not available for booking',
            message: `Sorry, the selected time slot is not available. Please choose a different time.`,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check for conflicts (excluding current booking)
      // Allow confirmed bookings to be updated - we're checking conflicts with OTHER bookings
      console.log(`🔍 Checking for conflicts on ${checkDate} at ${checkTime} (excluding booking ${booking.id})`);
      
      const { data: conflicts, error: conflictCheckError } = await supabaseClient
        .from('studio_bookings')
        .select('id, booking_time, session_hours, booking_status')
        .eq('booking_date', checkDate)
        .in('booking_status', ['pending', 'confirmed', 'completed'])
        .neq('id', booking.id); // Exclude current booking - this allows updating confirmed bookings

      if (conflictCheckError) {
        console.error('⚠️ Error checking conflicts:', conflictCheckError);
        // Continue with update - don't block on conflict check error
      } else if (conflicts && conflicts.length > 0) {
        console.log(`📊 Found ${conflicts.length} other bookings on ${checkDate}, checking for time conflicts...`);
        
        const requestedStart = new Date(`${checkDate}T${checkTime}`);
        requestedStart.setHours(parseInt(checkTime.split(':')[0]), parseInt(checkTime.split(':')[1]), 0, 0);
        const requestedEnd = new Date(requestedStart);
        requestedEnd.setHours(requestedStart.getHours() + checkHours);

        for (const conflict of conflicts) {
          if (!conflict.booking_time) continue;
          
          const [bookingHours, bookingMinutes] = conflict.booking_time.split(':').map(Number);
          const conflictStart = new Date(`${checkDate}T${conflict.booking_time}`);
          conflictStart.setHours(bookingHours, bookingMinutes, 0, 0);
          const conflictEnd = new Date(conflictStart);
          conflictEnd.setHours(conflictStart.getHours() + (conflict.session_hours || 1));

          // Check if times overlap
          if (requestedStart < conflictEnd && requestedEnd > conflictStart) {
            console.log(`⚠️ Conflict detected with booking ${conflict.id} at ${conflict.booking_time}`);
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Booking conflict detected',
                message: `The requested time slot ${checkTime} conflicts with an existing ${conflict.booking_status} booking. Please choose a different time.`,
                conflict_details: {
                  existing_time: conflict.booking_time,
                  existing_hours: conflict.session_hours,
                  booking_status: conflict.booking_status,
                }
              }),
              { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
        console.log('✅ No conflicts found, proceeding with update');
      } else {
        console.log('✅ No other bookings on this date, no conflicts to check');
      }
    }

    // Check if booking is cancelled (can't update cancelled bookings)
    const currentStatus = booking_type === 'studio' ? booking.booking_status : booking.status;
    if (currentStatus === 'cancelled') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Cannot update cancelled booking',
          message: 'This booking has been cancelled and cannot be updated. Please create a new booking instead.',
          booking_status: currentStatus,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✏️ Updating booking ${booking.id} (current status: ${currentStatus})`);

    // Build update data
    const updateData: any = {};
    
    if (booking_type === 'studio') {
      // Studio booking updates
      if (new_booking_date) updateData.booking_date = convertDateToDBFormat(new_booking_date);
      if (new_booking_time) updateData.booking_time = new_booking_time;
      if (new_session_hours) {
        // Rehearsal minimum: 3 hours
        const packageName = booking.package_name || '';
        const isRehearsal = packageName.toLowerCase().includes('rehearsal');
        if (isRehearsal && new_session_hours < 3) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Rehearsal minimum booking is 3 hours',
              message: 'Rehearsal space has a minimum booking of 3 hours. Please specify at least 3 hours.',
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        updateData.session_hours = new_session_hours;
        
        // Recalculate price if session_hours changed
        // Get service type from package_name
        const serviceType = packageName.toLowerCase().includes('rehearsal') ? 'rehearsal' 
                          : packageName.toLowerCase().includes('recording') ? 'recording'
                          : null;
        
        if (serviceType) {
          const { data: services } = await supabaseClient
            .from('studio_services')
            .select('hourly_rate, four_hour_rate, eight_hour_rate')
            .eq('type', serviceType)
            .limit(1);
          
          if (services && services.length > 0) {
            const service = services[0];
            const hourlyRate = parseFloat(service.hourly_rate) || 0;
            
            if (new_session_hours >= 8 && service.eight_hour_rate) {
              updateData.package_price = parseFloat(service.eight_hour_rate);
            } else if (new_session_hours >= 4 && service.four_hour_rate) {
              updateData.package_price = parseFloat(service.four_hour_rate);
            } else {
              updateData.package_price = hourlyRate * new_session_hours;
            }
            
            console.log(`💰 Recalculated price for ${new_session_hours} hours: £${updateData.package_price}`);
          }
        }
      }
      if (new_special_requests !== undefined) updateData.special_requests = new_special_requests;
    } else if (booking_type === 'equipment') {
      // Equipment booking updates
      if (new_booking_date) updateData.booking_date = convertDateToDBFormat(new_booking_date);
      if (new_booking_time_equipment !== undefined) updateData.booking_time = new_booking_time_equipment;
      if (new_duration_days) {
        updateData.duration_days = new_duration_days;
        
        // Recalculate price if duration_days changed
        if (booking.items && Array.isArray(booking.items)) {
          const items = booking.items.map((item: any) => {
            const itemDuration = new_duration_days;
            const itemPrice = item.price || 0;
            const itemQuantity = item.quantity || 1;
            const itemTotal = itemPrice * itemDuration * itemQuantity;
            
            return {
              ...item,
              duration: itemDuration,
              total: itemTotal,
            };
          });

          const subtotal = items.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
          updateData.items = items;
          updateData.subtotal = subtotal;
          updateData.total = subtotal;
          
          console.log(`💰 Recalculated equipment price for ${new_duration_days} days: £${subtotal}`);
        }
      }
      if (new_special_requests !== undefined) updateData.notes = new_special_requests;
    }

    // Perform update if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No update fields provided',
          message: 'Please provide at least one field to update (date, time, hours, duration, or special requests).',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: updatedBooking, error: updateError } = await supabaseClient
      .from(tableName)
      .update(updateData)
      .eq('id', booking.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating booking:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Booking updated successfully:', booking.id);

    return new Response(
      JSON.stringify({
        success: true,
        booking: updatedBooking,
        message: 'Booking updated successfully',
        booking_id: updatedBooking.id,
        booking_number: updatedBooking.booking_number || updatedBooking.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error in update-booking:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'An error occurred while updating the booking' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
