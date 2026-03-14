// Vapi Edge Function: List available equipment items
// Allows voice agent to query available equipment for rental

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
    console.log('🔍 vapi-list-equipment called');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('📊 Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseServiceKey?.length || 0,
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing environment variables');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server configuration error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
          details: {
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseServiceKey,
          }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const { category, search, available_only = true } = await req.json().catch(() => ({}));

    console.log('📥 Request params:', { category, search, available_only });

    // Build query
    let query = supabaseClient
      .from('equipment_items')
      .select('id, name, description, price_per_day, available, category_id, equipment_categories(name)')
      .order('name', { ascending: true });

    // Filter by availability if requested
    if (available_only) {
      query = query.eq('available', true);
    }

    // Filter by category if provided
    if (category) {
      // First get category ID
      const { data: categoryData } = await supabaseClient
        .from('equipment_categories')
        .select('id')
        .ilike('name', `%${category}%`)
        .single();

      if (categoryData) {
        query = query.eq('category_id', categoryData.id);
      }
    }

    // Search by name or description
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    console.log('🔍 Executing query...');
    const { data: equipment, error: equipmentError } = await query;

    if (equipmentError) {
      console.error('❌ Error fetching equipment:', equipmentError);
      console.error('❌ Error details:', JSON.stringify(equipmentError, null, 2));
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: equipmentError.message,
          code: equipmentError.code,
          details: equipmentError,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Found ${equipment?.length || 0} equipment items`);

    // Format response for voice agent
    const formattedEquipment = (equipment || []).map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price_per_day: parseFloat(item.price_per_day) || 0,
      available: item.available,
      category: (item.equipment_categories as any)?.name || 'Uncategorized',
    }));

    return new Response(
      JSON.stringify({
        success: true,
        equipment: formattedEquipment,
        count: formattedEquipment.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Exception in vapi-list-equipment:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error message:', error.message);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error',
        stack: error.stack,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
