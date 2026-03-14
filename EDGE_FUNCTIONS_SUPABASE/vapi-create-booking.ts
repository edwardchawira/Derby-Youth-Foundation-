// Vapi Edge Function: Create booking from voice agent
// Handles phone bookings and prevents double booking
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
    console.log("🔍 vapi-create-booking called");
    
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

    const {
      customer_name,
      customer_email,
      customer_phone,
      booking_date,
      booking_time,
      session_hours = 1,
      booking_type = "studio",
      package_name,
      package_price,
      special_requests,
      equipment_items,
    } = params;

    if (!customer_name || !customer_email || !booking_date) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields: customer_name, customer_email, booking_date are required" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const dbDate = convertDateToDBFormat(booking_date);
    const requestedDate = new Date(dbDate);
    if (isNaN(requestedDate.getTime())) {
      return new Response(
        JSON.stringify({ 
          error: `Invalid date format. Expected DD-MM-YYYY format (e.g., 25-12-2024). Received: ${booking_date}` 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (requestedDate < today) {
      return new Response(
        JSON.stringify({ 
          error: "Cannot create bookings for past dates" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestedTime = booking_time || "09:00";
    const [hours, minutes] = requestedTime.split(":").map(Number);
    requestedDate.setHours(hours, minutes, 0, 0);
    const requestedStart = requestedDate;
    const requestedEnd = new Date(requestedStart);
    requestedEnd.setHours(requestedStart.getHours() + session_hours);

    let hasConflict = false;
    let conflictDetails = null;

    if (booking_type === "studio" && booking_time) {
      const { data: existingBookings } = await supabaseClient
        .from("studio_bookings")
        .select("booking_time, session_hours")
        .eq("booking_date", dbDate)
        .in("booking_status", ["pending", "confirmed"]);

      if (existingBookings) {
        for (const booking of existingBookings) {
          const [bookingHours, bookingMinutes] = booking.booking_time.split(":").map(Number);
          const bookingStart = new Date(requestedDate);
          bookingStart.setHours(bookingHours, bookingMinutes, 0, 0);
          const bookingEnd = new Date(bookingStart);
          bookingEnd.setHours(bookingStart.getHours() + booking.session_hours);

          if (requestedStart < bookingEnd && requestedEnd > bookingStart) {
            hasConflict = true;
            conflictDetails = {
              existing_time: booking.booking_time,
              existing_hours: booking.session_hours,
            };
            break;
          }
        }
      }
    }

    if (hasConflict) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Booking conflict detected",
          conflict: conflictDetails,
          message: `Sorry, the time slot ${booking_time} on ${booking_date} is already booked. Please choose a different time.`,
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let bookingResult;

    if (booking_type === "studio") {
      const insertData = {
        customer_name,
        customer_email,
        customer_phone: customer_phone || null,
        package_name: package_name || "Studio Session",
        package_price: package_price || 0,
        booking_date: dbDate,
        booking_time: booking_time || "09:00",
        session_hours,
        booking_status: "pending",
        payment_status: "pending",
        special_requests: special_requests || null,
      };
      
      console.log("📝 Inserting studio booking:", JSON.stringify(insertData, null, 2));
      
      const { data: booking, error: bookingError } = await supabaseClient
        .from("studio_bookings")
        .insert(insertData)
        .select()
        .single();

      if (bookingError) {
        console.error("❌ Error creating studio booking:", bookingError);
        console.error("❌ Error details:", JSON.stringify(bookingError, null, 2));
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: bookingError.message,
            code: bookingError.code,
            hint: bookingError.hint,
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("✅ Studio booking created successfully:", booking?.id);
      bookingResult = booking;
    } else if (booking_type === "equipment") {
      const bookingNumber = `EQ-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const items = equipment_items || [];
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.price || 0), 0);
      const total = subtotal;

      const { data: booking, error: bookingError } = await supabaseClient
        .from("bookings")
        .insert({
          booking_number: bookingNumber,
          customer_name,
          customer_email,
          customer_phone: customer_phone || null,
          booking_date: dbDate,
          duration_days: session_hours || 1,
          items: items,
          subtotal,
          total,
          status: "pending",
          notes: special_requests || null,
        })
        .select()
        .single();

      if (bookingError) {
        console.error("Error creating equipment booking:", bookingError);
        return new Response(
          JSON.stringify({ success: false, error: bookingError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      bookingResult = booking;
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid booking_type. Must be "studio" or "equipment"' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking: bookingResult,
        message: `Booking created successfully. Your booking reference is ${bookingResult.id}.`,
        booking_id: bookingResult.id,
        booking_number: bookingResult.booking_number || bookingResult.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in create-booking:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
