// Vapi Edge Function: Get studio session pricing
// Allows voice agent to query accurate pricing from the database
// Supports POST (JSON body)

import { createClient } from "npm:@supabase/supabase-js@2.45.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("🔍 vapi-get-pricing called");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    console.log("📊 Environment check:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseServiceKey?.length || 0,
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Missing environment variables");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Server configuration error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
          details: {
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseServiceKey,
          }
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    let params: any = {};
    if (req.method === "POST") {
      params = await req.json().catch(() => ({}));
    } else if (req.method === "GET") {
      const url = new URL(req.url);
      params = Object.fromEntries(url.searchParams.entries());
    }

    const { service_type } = params;

    console.log("📥 Request params:", { service_type });

    let query = supabaseClient
      .from("studio_services")
      .select("id, name, type, hourly_rate, four_hour_rate, eight_hour_rate, description, features")
      .order("name", { ascending: true });

    if (service_type) {
      query = query.ilike("type", `%${service_type}%`);
    }

    console.log("🔍 Executing query...");
    const { data: services, error: servicesError } = await query;

    if (servicesError) {
      console.error("❌ Error fetching pricing:", servicesError);
      console.error("❌ Error details:", JSON.stringify(servicesError, null, 2));
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: servicesError.message,
          code: servicesError.code,
          details: servicesError,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Found ${services?.length || 0} pricing services`);

    const formattedPricing = (services || []).map((service: any) => ({
      id: service.id,
      name: service.name,
      type: service.type,
      hourly_rate: parseFloat(service.hourly_rate) || 0,
      four_hour_rate: service.four_hour_rate ? parseFloat(service.four_hour_rate) : null,
      eight_hour_rate: service.eight_hour_rate ? parseFloat(service.eight_hour_rate) : null,
      description: service.description || "",
      features: service.features || [],
    }));

    const pricingWithSavings = formattedPricing.map((service: any) => {
      const savings: any = { four_hour: null, eight_hour: null };
      
      if (service.four_hour_rate && service.hourly_rate > 0) {
        const hourlyTotal = service.hourly_rate * 4;
        const savingsAmount = hourlyTotal - service.four_hour_rate;
        savings.four_hour = savingsAmount > 0 ? {
          amount: savingsAmount,
          percentage: Math.round((savingsAmount / hourlyTotal) * 100),
        } : null;
      }
      
      if (service.eight_hour_rate && service.hourly_rate > 0) {
        const hourlyTotal = service.hourly_rate * 8;
        const savingsAmount = hourlyTotal - service.eight_hour_rate;
        savings.eight_hour = savingsAmount > 0 ? {
          amount: savingsAmount,
          percentage: Math.round((savingsAmount / hourlyTotal) * 100),
        } : null;
      }
      
      return {
        ...service,
        savings,
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        pricing: pricingWithSavings,
        count: pricingWithSavings.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Exception in vapi-get-pricing:", error);
    console.error("❌ Error stack:", error.stack);
    console.error("❌ Error message:", error.message);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error",
        stack: error.stack,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
