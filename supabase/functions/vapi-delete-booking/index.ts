// Vapi Edge Function: Delete booking permanently
// Allows voice agent to permanently delete bookings (use with caution)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔍 vapi-delete-booking called');
    
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

    const {
      booking_id,
      booking_number, // For equipment bookings
      booking_type = 'studio',
      customer_email, // For verification
      confirm_deletion = false, // Safety flag
    } = await req.json();

    if (!booking_id && !booking_number) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'booking_id (for studio) or booking_number (for equipment) is required' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!confirm_deletion) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Deletion must be explicitly confirmed. Set confirm_deletion to true.',
          message: 'Please confirm that you want to permanently delete this booking. This action cannot be undone.',
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

      const { data, error } = await supabaseClient
        .from('studio_bookings')
        .select('id, customer_email, booking_date, booking_time, package_name')
        .eq('id', booking_id)
        .single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ success: false, error: 'Studio booking not found' }),
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
        .select('id, booking_number, customer_email, booking_date');
      
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

    // Delete the booking
    const { error: deleteError } = await supabaseClient
      .from(tableName)
      .delete()
      .eq('id', booking.id);

    if (deleteError) {
      console.error('❌ Error deleting booking:', deleteError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: deleteError.message || 'Failed to delete booking' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Booking deleted successfully:', booking.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Booking deleted successfully',
        booking_id: booking.id,
        booking_number: booking.booking_number || booking.id,
        deleted_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error in delete-booking:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An error occurred while deleting the booking' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
