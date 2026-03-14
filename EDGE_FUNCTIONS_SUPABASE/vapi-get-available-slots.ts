// Vapi Edge Function: Get available time slots for a date
// Returns available booking times for voice agent
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

const AVAILABLE_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("🔍 vapi-get-available-slots called");
    
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

    const { booking_date, booking_type = "studio", session_hours = 1 } = params;

    if (!booking_date) {
      return new Response(
        JSON.stringify({ error: "booking_date is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const dbDate = convertDateToDBFormat(booking_date);
    const testDate = new Date(dbDate);
    if (isNaN(testDate.getTime())) {
      return new Response(
        JSON.stringify({ error: `Invalid date format. Expected DD-MM-YYYY format (e.g., 25-12-2024). Received: ${booking_date}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let bookedTimes: string[] = [];

    if (booking_type === "studio") {
      const { data: studioBookings } = await supabaseClient
        .from("studio_bookings")
        .select("booking_time, session_hours")
        .eq("booking_date", dbDate)
        .in("booking_status", ["pending", "confirmed"]);

      if (studioBookings) {
        for (const booking of studioBookings) {
          const [startHours, startMinutes] = booking.booking_time.split(":").map(Number);
          const bookedHours = booking.session_hours;
          
          for (let i = 0; i < bookedHours; i++) {
            const hour = startHours + i;
            const timeSlot = `${hour.toString().padStart(2, "0")}:${startMinutes.toString().padStart(2, "0")}`;
            if (!bookedTimes.includes(timeSlot)) {
              bookedTimes.push(timeSlot);
            }
          }
        }
      }
    }

    const availableSlots = AVAILABLE_SLOTS.filter(slot => {
      const [slotHours] = slot.split(":").map(Number);
      const slotEnd = slotHours + session_hours;
      
      for (let i = 0; i < session_hours; i++) {
        const checkHour = slotHours + i;
        const checkTime = `${checkHour.toString().padStart(2, "0")}:00`;
        if (bookedTimes.includes(checkTime)) {
          return false;
        }
      }
      
      return slotEnd <= 21;
    });

    return new Response(
      JSON.stringify({
        booking_date: booking_date,
        available_slots: availableSlots,
        booking_type: booking_type,
        recommended_slots: availableSlots.slice(0, 5),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in get-available-slots:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
