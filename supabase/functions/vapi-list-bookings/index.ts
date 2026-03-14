// Vapi Edge Function: List bookings (for voice agent queries)
// Allows voice agent to check customer's existing bookings

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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔍 vapi-list-bookings called');
    
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

    // Parse request body with error handling - allow empty body and default to empty object
    let requestBody: any = {};
    try {
      const bodyText = await req.text();
      console.log('📥 Raw request body text:', bodyText || '(empty)');
      console.log('📥 Request method:', req.method);
      console.log('📥 Request headers:', Object.fromEntries(req.headers.entries()));
      
      if (bodyText && bodyText.trim() !== '') {
        requestBody = JSON.parse(bodyText);
        console.log('📥 Parsed request body:', JSON.stringify(requestBody, null, 2));
      } else {
        console.log('⚠️ Empty request body - defaulting to empty object');
        // Try to get params from URL if GET request
        if (req.method === 'GET') {
          const url = new URL(req.url);
          requestBody = Object.fromEntries(url.searchParams.entries());
          console.log('📥 Extracted from URL params:', JSON.stringify(requestBody, null, 2));
        }
      }
    } catch (parseError: any) {
      console.error('❌ Error parsing request body:', parseError);
      // Don't fail completely - try to continue with empty object
      requestBody = {};
    }

    const { 
      customer_email, 
      customer_phone, 
      booking_id, 
      booking_number, 
      booking_type, 
      date_from, 
      date_to 
    } = requestBody;

    // Convert dates from DD-MM-YYYY to YYYY-MM-DD for database queries
    const dbDateFrom = date_from ? convertDateToDBFormat(date_from) : undefined;
    const dbDateTo = date_to ? convertDateToDBFormat(date_to) : undefined;

    // Log what we received
    console.log('🔍 Search parameters received:', {
      customer_email: customer_email || '(not provided)',
      customer_phone: customer_phone || '(not provided)',
      booking_id: booking_id || '(not provided)',
      booking_number: booking_number || '(not provided)',
      booking_type: booking_type || '(not provided)'
    });

    // Allow searching by booking_id, booking_number, email, or phone
    if (!customer_email && !customer_phone && !booking_id && !booking_number) {
      console.error('❌ No search parameters provided');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Search parameter required',
          message: 'Please provide at least one of: customer_email, customer_phone, booking_id, or booking_number. Received: ' + JSON.stringify(requestBody)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const bookings = [];

    // Get studio bookings
    if (!booking_type || booking_type === 'studio') {
      let studioQuery = supabaseClient
        .from('studio_bookings')
        .select('id, customer_name, customer_email, booking_date, booking_time, session_hours, package_name, package_price, booking_status, payment_status')
        .order('booking_date', { ascending: true });

      // Search by booking_id if provided (takes priority)
      if (booking_id) {
        // Handle "STUDIO-33B6E329" format - extract UUID prefix
        let searchId = booking_id;
        if (booking_id.startsWith('STUDIO-')) {
          // Extract the UUID prefix (e.g., "33B6E329" from "STUDIO-33B6E329")
          const uuidPrefix = booking_id.replace('STUDIO-', '').toLowerCase();
          // Search by partial UUID match using ilike (case-insensitive)
          studioQuery = studioQuery.ilike('id', `${uuidPrefix}%`);
        } else {
          // Direct UUID match
          studioQuery = studioQuery.eq('id', booking_id);
        }
      } else {
        // Otherwise search by customer details
        if (customer_email) {
          studioQuery = studioQuery.eq('customer_email', customer_email);
        }
        if (customer_phone) {
          studioQuery = studioQuery.eq('customer_phone', customer_phone);
        }
      }
      
      if (dbDateFrom) {
        studioQuery = studioQuery.gte('booking_date', dbDateFrom);
      }
      if (dbDateTo) {
        studioQuery = studioQuery.lte('booking_date', dbDateTo);
      }

      const { data: studioBookings, error: studioError } = await studioQuery;
      
      if (studioError) {
        console.error('❌ Error fetching studio bookings:', studioError);
      } else if (studioBookings) {
        // Convert dates back to DD-MM-YYYY format for display
        bookings.push(...studioBookings.map(b => ({ 
          ...b, 
          type: 'studio',
          booking_date: convertDateToDisplayFormat(b.booking_date)
        })));
      }
    }

    // Get equipment bookings
    if (!booking_type || booking_type === 'equipment') {
      let equipmentQuery = supabaseClient
        .from('bookings')
        .select('id, booking_number, customer_name, customer_email, booking_date, duration_days, status, total, items')
        .order('booking_date', { ascending: true });

      // Search by booking_id or booking_number if provided (takes priority)
      if (booking_id) {
        equipmentQuery = equipmentQuery.eq('id', booking_id);
      } else if (booking_number) {
        equipmentQuery = equipmentQuery.eq('booking_number', booking_number);
      } else {
        // Otherwise search by customer details
        if (customer_email) {
          equipmentQuery = equipmentQuery.eq('customer_email', customer_email);
        }
        if (customer_phone) {
          equipmentQuery = equipmentQuery.eq('customer_phone', customer_phone);
        }
      }
      
      if (dbDateFrom) {
        equipmentQuery = equipmentQuery.gte('booking_date', dbDateFrom);
      }
      if (dbDateTo) {
        equipmentQuery = equipmentQuery.lte('booking_date', dbDateTo);
      }

      const { data: equipmentBookings, error: equipmentError } = await equipmentQuery;
      
      if (equipmentError) {
        console.error('❌ Error fetching equipment bookings:', equipmentError);
      } else if (equipmentBookings) {
        // Convert dates back to DD-MM-YYYY format for display
        bookings.push(...equipmentBookings.map(b => ({ 
          ...b, 
          type: 'equipment',
          booking_date: convertDateToDisplayFormat(b.booking_date)
        })));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        bookings: bookings,
        count: bookings.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in list-bookings:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
