// Vapi Diagnostic Edge Function
// Tests database connectivity and environment variables

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
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      environment: {},
      database: {},
      tables: {},
      errors: [],
    };

    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    diagnostics.environment = {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseServiceKey?.length || 0,
      urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : null,
    };

    if (!supabaseUrl || !supabaseServiceKey) {
      diagnostics.errors.push('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return new Response(
        JSON.stringify(diagnostics, null, 2),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Test database connection
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Test studio_bookings table
    try {
      const { data: studioData, error: studioError } = await supabaseClient
        .from('studio_bookings')
        .select('id')
        .limit(1);
      
      diagnostics.tables.studio_bookings = {
        accessible: !studioError,
        error: studioError?.message || null,
        code: studioError?.code || null,
        hasData: studioData && studioData.length > 0,
      };
    } catch (e: any) {
      diagnostics.tables.studio_bookings = {
        accessible: false,
        error: e.message,
      };
    }

    // Test bookings table
    try {
      const { data: bookingsData, error: bookingsError } = await supabaseClient
        .from('bookings')
        .select('id')
        .limit(1);
      
      diagnostics.tables.bookings = {
        accessible: !bookingsError,
        error: bookingsError?.message || null,
        code: bookingsError?.code || null,
        hasData: bookingsData && bookingsData.length > 0,
      };
    } catch (e: any) {
      diagnostics.tables.bookings = {
        accessible: false,
        error: e.message,
      };
    }

    // Test equipment_items table
    try {
      const { data: equipmentData, error: equipmentError } = await supabaseClient
        .from('equipment_items')
        .select('id, name')
        .limit(5);
      
      diagnostics.tables.equipment_items = {
        accessible: !equipmentError,
        error: equipmentError?.message || null,
        code: equipmentError?.code || null,
        count: equipmentData?.length || 0,
        items: equipmentData?.map((item: any) => ({ id: item.id, name: item.name })) || [],
      };
    } catch (e: any) {
      diagnostics.tables.equipment_items = {
        accessible: false,
        error: e.message,
      };
    }

    // Test insert capability (dry run - check permissions only)
    try {
      const testDate = new Date();
      testDate.setDate(testDate.getDate() + 7); // Next week
      const testDbDate = testDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Just check if we can access the table structure, don't actually insert
      const { error: insertCheckError } = await supabaseClient
        .from('studio_bookings')
        .select('id')
        .eq('booking_date', testDbDate)
        .limit(0);
      
      diagnostics.database.canQuery = !insertCheckError || insertCheckError.code !== 'PGRST116';
      diagnostics.database.queryError = insertCheckError?.message || null;
    } catch (e: any) {
      diagnostics.database.canQuery = false;
      diagnostics.database.queryError = e.message;
    }

    // Overall health status
    diagnostics.health = {
      databaseConnected: diagnostics.tables.studio_bookings?.accessible || false,
      canAccessTables: Object.values(diagnostics.tables).some((t: any) => t.accessible),
      hasErrors: diagnostics.errors.length > 0,
    };

    const statusCode = diagnostics.health.hasErrors ? 500 : 200;

    return new Response(
      JSON.stringify(diagnostics, null, 2),
      { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      }, null, 2),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
