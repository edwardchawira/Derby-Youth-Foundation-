// Vapi Edge Function: Update or cancel booking
// Allows voice agent to modify existing bookings
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("🔍 vapi-update-booking called");
    
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

    const {
      booking_id,
      booking_type = "studio",
      action = "update",
      customer_email,
      new_booking_date,
      new_booking_time,
      new_session_hours,
      new_special_requests,
    } = params;

    if (!booking_id) {
      return new Response(
        JSON.stringify({ error: "booking_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let booking;
    if (booking_type === "studio") {
      let query = supabaseClient
        .from("studio_bookings")
        .select("*")
        .eq("id", booking_id)
        .single();

      const { data, error } = await query;
      if (error || !data) {
        return new Response(
          JSON.stringify({ success: false, error: "Booking not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (customer_email && data.customer_email !== customer_email) {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized: Email does not match booking" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      booking = data;
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Equipment booking updates not yet supported" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "cancel") {
      const { error: updateError } = await supabaseClient
        .from("studio_bookings")
        .update({ booking_status: "cancelled" })
        .eq("id", booking_id);

      if (updateError) {
        return new Response(
          JSON.stringify({ success: false, error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Booking cancelled successfully",
          booking_id: booking_id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (new_booking_date || new_booking_time) {
      const checkDate = new_booking_date ? convertDateToDBFormat(new_booking_date) : booking.booking_date;
      const checkTime = new_booking_time || booking.booking_time;
      const checkHours = new_session_hours || booking.session_hours;

      if (new_booking_date) {
        const testDate = new Date(checkDate);
        if (isNaN(testDate.getTime())) {
          return new Response(
            JSON.stringify({ 
              error: `Invalid date format. Expected DD-MM-YYYY format (e.g., 25-12-2024). Received: ${new_booking_date}` 
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      const { data: conflicts } = await supabaseClient
        .from("studio_bookings")
        .select("booking_time, session_hours")
        .eq("booking_date", checkDate)
        .in("booking_status", ["pending", "confirmed"])
        .neq("id", booking_id);

      if (conflicts) {
        const [hours, minutes] = checkTime.split(":").map(Number);
        const requestedStart = new Date(`${checkDate}T${checkTime}`);
        const requestedEnd = new Date(requestedStart);
        requestedEnd.setHours(requestedStart.getHours() + checkHours);

        for (const conflict of conflicts) {
          const [bookingHours, bookingMinutes] = conflict.booking_time.split(":").map(Number);
          const conflictStart = new Date(`${checkDate}T${conflict.booking_time}`);
          const conflictEnd = new Date(conflictStart);
          conflictEnd.setHours(conflictStart.getHours() + conflict.session_hours);

          if (requestedStart < conflictEnd && requestedEnd > conflictStart) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Booking conflict detected",
                message: `The requested time slot conflicts with an existing booking.`,
              }),
              { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      }
    }

    const updateData: any = {};
    if (new_booking_date) updateData.booking_date = convertDateToDBFormat(new_booking_date);
    if (new_booking_time) updateData.booking_time = new_booking_time;
    if (new_session_hours) updateData.session_hours = new_session_hours;
    if (new_special_requests !== undefined) updateData.special_requests = new_special_requests;

    const { data: updatedBooking, error: updateError } = await supabaseClient
      .from("studio_bookings")
      .update(updateData)
      .eq("id", booking_id)
      .select()
      .single();

    if (updateError) {
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking: updatedBooking,
        message: "Booking updated successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in update-booking:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
