// Vapi Edge Function: Check booking availability
// Called by Vapi to check if a time slot is available
// Supports POST (JSON body)

import { createClient } from "npm:@supabase/supabase-js@2.45.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Helper function to convert DD-MM-YYYY to YYYY-MM-DD (for database)
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("🔍 vapi-check-availability called");
    
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

    const { booking_date, booking_time, session_hours, booking_type = "studio" } = params;

    if (!booking_date) {
      return new Response(
        JSON.stringify({ error: "booking_date is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const dbDate = convertDateToDBFormat(booking_date);
    const requestedDate = new Date(dbDate);
    if (isNaN(requestedDate.getTime())) {
      return new Response(
        JSON.stringify({ error: `Invalid date format. Expected DD-MM-YYYY format (e.g., 25-12-2024). Received: ${booking_date}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestedTime = booking_time || "09:00";
    const [hours, minutes] = requestedTime.split(":").map(Number);
    requestedDate.setHours(hours, minutes, 0, 0);
    const requestedStart = requestedDate;
    const requestedEnd = new Date(requestedStart);
    requestedEnd.setHours(requestedStart.getHours() + (session_hours || 1));

    let conflicts = [];

    if (booking_type === "studio") {
      const { data: studioBookings, error: studioError } = await supabaseClient
        .from("studio_bookings")
        .select("booking_date, booking_time, session_hours, booking_status")
        .eq("booking_date", dbDate)
        .in("booking_status", ["pending", "confirmed"]);

      if (studioError) {
        console.error("Error checking studio bookings:", studioError);
      } else if (studioBookings) {
        for (const booking of studioBookings) {
          const [bookingHours, bookingMinutes] = booking.booking_time.split(":").map(Number);
          const bookingStart = new Date(requestedDate);
          bookingStart.setHours(bookingHours, bookingMinutes, 0, 0);
          const bookingEnd = new Date(bookingStart);
          bookingEnd.setHours(bookingStart.getHours() + booking.session_hours);

          if (requestedStart < bookingEnd && requestedEnd > bookingStart) {
            conflicts.push({
              type: "studio",
              booking_time: booking.booking_time,
              session_hours: booking.session_hours,
            });
          }
        }
      }
    } else if (booking_type === "equipment") {
      const { data: equipmentBookings } = await supabaseClient
        .from("bookings")
        .select("booking_date, duration_days, status")
        .eq("booking_date", dbDate)
        .in("status", ["pending", "confirmed"]);

      if (equipmentBookings && equipmentBookings.length > 0) {
        conflicts.push({
          type: "equipment",
          message: "Equipment may be unavailable on this date",
        });
      }
    }

    const isAvailable = conflicts.length === 0;

    return new Response(
      JSON.stringify({
        available: isAvailable,
        conflicts: conflicts,
        requested_date: booking_date,
        requested_time: booking_time,
        requested_hours: session_hours || 1,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in check-availability:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
