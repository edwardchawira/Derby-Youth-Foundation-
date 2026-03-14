// Vapi Edge Function: List bookings (for voice agent queries)
// Allows voice agent to check customer's existing bookings
// Supports POST (JSON body)

import { createClient } from "npm:@supabase/supabase-js@2.45.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function convertDateToDBFormat(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  const parts = dateStr.split("-");
  if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
    const [day, month, year] = parts;
    return `${year}-${month}-${day}`;
  }
  return dateStr;
}

function convertDateToDisplayFormat(dateStr: string): string {
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    return dateStr;
  }
  const parts = dateStr.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    const [year, month, day] = parts;
    return `${day}-${month}-${year}`;
  }
  return dateStr;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("🔍 vapi-list-bookings called");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Missing environment variables");
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" 
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

    const { customer_email, customer_phone, booking_type, date_from, date_to } = params;

    const dbDateFrom = date_from ? convertDateToDBFormat(date_from) : undefined;
    const dbDateTo = date_to ? convertDateToDBFormat(date_to) : undefined;

    if (!customer_email && !customer_phone) {
      return new Response(
        JSON.stringify({ error: "customer_email or customer_phone is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bookings = [];

    if (!booking_type || booking_type === "studio") {
      let studioQuery = supabaseClient
        .from("studio_bookings")
        .select("id, customer_name, booking_date, booking_time, session_hours, package_name, booking_status, payment_status")
        .order("booking_date", { ascending: true });

      if (customer_email) {
        studioQuery = studioQuery.eq("customer_email", customer_email);
      }
      if (customer_phone) {
        studioQuery = studioQuery.eq("customer_phone", customer_phone);
      }
      if (dbDateFrom) {
        studioQuery = studioQuery.gte("booking_date", dbDateFrom);
      }
      if (dbDateTo) {
        studioQuery = studioQuery.lte("booking_date", dbDateTo);
      }

      const { data: studioBookings } = await studioQuery;
      if (studioBookings) {
        bookings.push(...studioBookings.map(b => ({ 
          ...b, 
          type: "studio",
          booking_date: convertDateToDisplayFormat(b.booking_date)
        })));
      }
    }

    if (!booking_type || booking_type === "equipment") {
      let equipmentQuery = supabaseClient
        .from("bookings")
        .select("id, booking_number, customer_name, booking_date, duration_days, status, total")
        .order("booking_date", { ascending: true });

      if (customer_email) {
        equipmentQuery = equipmentQuery.eq("customer_email", customer_email);
      }
      if (customer_phone) {
        equipmentQuery = equipmentQuery.eq("customer_phone", customer_phone);
      }
      if (dbDateFrom) {
        equipmentQuery = equipmentQuery.gte("booking_date", dbDateFrom);
      }
      if (dbDateTo) {
        equipmentQuery = equipmentQuery.lte("booking_date", dbDateTo);
      }

      const { data: equipmentBookings } = await equipmentQuery;
      if (equipmentBookings) {
        bookings.push(...equipmentBookings.map(b => ({ 
          ...b, 
          type: "equipment",
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
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in list-bookings:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
