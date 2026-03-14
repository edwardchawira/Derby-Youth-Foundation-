# Complete Vapi Edge Functions Code

Copy each function code below into Supabase Edge Functions.

---

## 1. vapi-check-availability

**Function Name**: `vapi-check-availability`

**Complete Code**:
```typescript
// Vapi Edge Function: Check booking availability
// Called by Vapi to check if a time slot is available

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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { booking_date, booking_time, session_hours, booking_type = 'studio' } = await req.json();

    if (!booking_date) {
      return new Response(
        JSON.stringify({ error: 'booking_date is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert date from DD-MM-YYYY to YYYY-MM-DD for database
    const dbDate = convertDateToDBFormat(booking_date);

    // Parse the date and time
    const requestedDate = new Date(dbDate);
    if (isNaN(requestedDate.getTime())) {
      return new Response(
        JSON.stringify({ error: `Invalid date format. Expected DD-MM-YYYY format (e.g., 25-12-2024). Received: ${booking_date}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestedTime = booking_time || '09:00'; // Default to 9 AM if not provided
    const [hours, minutes] = requestedTime.split(':').map(Number);
    
    requestedDate.setHours(hours, minutes, 0, 0);
    const requestedStart = requestedDate;
    const requestedEnd = new Date(requestedStart);
    requestedEnd.setHours(requestedStart.getHours() + (session_hours || 1));

    // Check conflicts based on booking type
    let conflicts = [];

    if (booking_type === 'studio') {
      // Check studio_bookings for conflicts (use DB format date)
      const { data: studioBookings, error: studioError } = await supabaseClient
        .from('studio_bookings')
        .select('booking_date, booking_time, session_hours, booking_status')
        .eq('booking_date', dbDate)
        .in('booking_status', ['pending', 'confirmed']);

      if (studioError) {
        console.error('Error checking studio bookings:', studioError);
      } else if (studioBookings) {
        // Check each booking for time overlap
        for (const booking of studioBookings) {
          const [bookingHours, bookingMinutes] = booking.booking_time.split(':').map(Number);
          const bookingStart = new Date(requestedDate);
          bookingStart.setHours(bookingHours, bookingMinutes, 0, 0);
          
          const bookingEnd = new Date(bookingStart);
          bookingEnd.setHours(bookingStart.getHours() + booking.session_hours);

          // Check if times overlap
          if (requestedStart < bookingEnd && requestedEnd > bookingStart) {
            conflicts.push({
              type: 'studio',
              booking_time: booking.booking_time,
              session_hours: booking.session_hours,
            });
          }
        }
      }
    } else if (booking_type === 'equipment') {
      // Check bookings table for equipment conflicts (use DB format date)
      const { data: equipmentBookings, error: equipmentError } = await supabaseClient
        .from('bookings')
        .select('booking_date, duration_days, status')
        .eq('booking_date', dbDate)
        .in('status', ['pending', 'confirmed']);

      if (equipmentError) {
        console.error('Error checking equipment bookings:', equipmentError);
      } else if (equipmentBookings && equipmentBookings.length > 0) {
        // For equipment, check if date overlaps with rental period
        conflicts.push({
          type: 'equipment',
          message: 'Equipment may be unavailable on this date',
        });
      }
    }

    const isAvailable = conflicts.length === 0;

    return new Response(
      JSON.stringify({
        available: isAvailable,
        conflicts: conflicts,
        requested_date: booking_date, // Return in original format (DD-MM-YYYY)
        requested_time: booking_time,
        requested_hours: session_hours || 1,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-availability:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## 2. vapi-get-available-slots

**Function Name**: `vapi-get-available-slots`

**Complete Code**:
```typescript
// Vapi Edge Function: Get available time slots for a date
// Returns available booking times for voice agent

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

// Available booking time slots (adjust as needed)
const AVAILABLE_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

const SLOT_DURATION_HOURS = 1; // Default 1 hour slots

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { booking_date, booking_type = 'studio', session_hours = 1 } = await req.json();

    if (!booking_date) {
      return new Response(
        JSON.stringify({ error: 'booking_date is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert date from DD-MM-YYYY to YYYY-MM-DD for database
    const dbDate = convertDateToDBFormat(booking_date);

    // Validate date format
    const testDate = new Date(dbDate);
    if (isNaN(testDate.getTime())) {
      return new Response(
        JSON.stringify({ error: `Invalid date format. Expected DD-MM-YYYY format (e.g., 25-12-2024). Received: ${booking_date}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get existing bookings for this date
    let bookedTimes: string[] = [];

    if (booking_type === 'studio') {
      const { data: studioBookings } = await supabaseClient
        .from('studio_bookings')
        .select('booking_time, session_hours')
        .eq('booking_date', dbDate)
        .in('booking_status', ['pending', 'confirmed']);

      if (studioBookings) {
        // Calculate all time slots that are booked
        for (const booking of studioBookings) {
          const [startHours, startMinutes] = booking.booking_time.split(':').map(Number);
          const bookedHours = booking.session_hours;
          
          // Mark all hours in this booking as unavailable
          for (let i = 0; i < bookedHours; i++) {
            const hour = startHours + i;
            const timeSlot = `${hour.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`;
            if (!bookedTimes.includes(timeSlot)) {
              bookedTimes.push(timeSlot);
            }
          }
        }
      }
    }

    // Find available slots
    const availableSlots = AVAILABLE_SLOTS.filter(slot => {
      // Check if this slot and required duration would conflict
      const [slotHours] = slot.split(':').map(Number);
      const slotEnd = slotHours + session_hours;
      
      // Check if slot overlaps with any booked time
      for (let i = 0; i < session_hours; i++) {
        const checkHour = slotHours + i;
        const checkTime = `${checkHour.toString().padStart(2, '0')}:00`;
        if (bookedTimes.includes(checkTime)) {
          return false;
        }
      }
      
      // Also check if slot end time is within business hours
      return slotEnd <= 21; // Example: bookings must end by 9 PM
    });

    return new Response(
      JSON.stringify({
        booking_date: booking_date, // Return in original format (DD-MM-YYYY)
        available_slots: availableSlots,
        booking_type: booking_type,
        recommended_slots: availableSlots.slice(0, 5), // First 5 for voice response
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-available-slots:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## 3. vapi-create-booking

**Function Name**: `vapi-create-booking`

**Complete Code**:
```typescript
// Vapi Edge Function: Create booking from voice agent
// Handles phone bookings and prevents double booking

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const {
      customer_name,
      customer_email,
      customer_phone,
      booking_date,
      booking_time,
      session_hours = 1,
      booking_type = 'studio',
      package_name,
      package_price,
      special_requests,
      equipment_items, // For equipment bookings
    } = await req.json();

    // Validate required fields
    if (!customer_name || !customer_email || !booking_date) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: customer_name, customer_email, booking_date are required' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert date from DD-MM-YYYY to YYYY-MM-DD for database
    const dbDate = convertDateToDBFormat(booking_date);

    // Validate date format
    const requestedDate = new Date(dbDate);
    if (isNaN(requestedDate.getTime())) {
      return new Response(
        JSON.stringify({ 
          error: `Invalid date format. Expected DD-MM-YYYY format (e.g., 25-12-2024). Received: ${booking_date}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // First, check availability to prevent double booking
    const requestedTime = booking_time || '09:00';
    const [hours, minutes] = requestedTime.split(':').map(Number);
    requestedDate.setHours(hours, minutes, 0, 0);
    const requestedStart = requestedDate;
    const requestedEnd = new Date(requestedStart);
    requestedEnd.setHours(requestedStart.getHours() + session_hours);

    let hasConflict = false;
    let conflictDetails = null;

    if (booking_type === 'studio' && booking_time) {
      // Check studio booking conflicts (use DB format date)
      const { data: existingBookings } = await supabaseClient
        .from('studio_bookings')
        .select('booking_time, session_hours')
        .eq('booking_date', dbDate)
        .in('booking_status', ['pending', 'confirmed']);

      if (existingBookings) {
        for (const booking of existingBookings) {
          const [bookingHours, bookingMinutes] = booking.booking_time.split(':').map(Number);
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
          error: 'Booking conflict detected',
          conflict: conflictDetails,
          message: `Sorry, the time slot ${booking_time} on ${booking_date} is already booked. Please choose a different time.`,
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create booking based on type
    let bookingResult;

    if (booking_type === 'studio') {
      // Create studio booking (use DB format date)
      const { data: booking, error: bookingError } = await supabaseClient
        .from('studio_bookings')
        .insert({
          customer_name,
          customer_email,
          customer_phone: customer_phone || null,
          package_name: package_name || 'Studio Session',
          package_price: package_price || 0,
          booking_date: dbDate, // Use converted DB format
          booking_time: booking_time || '09:00',
          session_hours,
          booking_status: 'pending',
          payment_status: 'pending',
          special_requests: special_requests || null,
        })
        .select()
        .single();

      if (bookingError) {
        console.error('Error creating studio booking:', bookingError);
        return new Response(
          JSON.stringify({ success: false, error: bookingError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      bookingResult = booking;
    } else if (booking_type === 'equipment') {
      // Create equipment booking
      // Generate unique booking number
      const bookingNumber = `EQ-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const items = equipment_items || [];
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.price || 0), 0);
      const total = subtotal; // Add delivery cost if needed

      const { data: booking, error: bookingError } = await supabaseClient
        .from('bookings')
        .insert({
          booking_number: bookingNumber,
          customer_name,
          customer_email,
          customer_phone: customer_phone || null,
          booking_date: dbDate, // Use converted DB format
          duration_days: session_hours || 1,
          items: items,
          subtotal,
          total,
          status: 'pending',
          notes: special_requests || null,
        })
        .select()
        .single();

      if (bookingError) {
        console.error('Error creating equipment booking:', bookingError);
        return new Response(
          JSON.stringify({ success: false, error: bookingError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      bookingResult = booking;
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid booking_type. Must be "studio" or "equipment"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-booking:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## 4. vapi-list-bookings

**Function Name**: `vapi-list-bookings`

**Complete Code**:
```typescript
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { customer_email, customer_phone, booking_type, date_from, date_to } = await req.json();

    // Convert dates from DD-MM-YYYY to YYYY-MM-DD for database queries
    const dbDateFrom = date_from ? convertDateToDBFormat(date_from) : undefined;
    const dbDateTo = date_to ? convertDateToDBFormat(date_to) : undefined;

    // Require at least email or phone to identify customer
    if (!customer_email && !customer_phone) {
      return new Response(
        JSON.stringify({ error: 'customer_email or customer_phone is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const bookings = [];

    // Get studio bookings
    if (!booking_type || booking_type === 'studio') {
      let studioQuery = supabaseClient
        .from('studio_bookings')
        .select('id, customer_name, booking_date, booking_time, session_hours, package_name, booking_status, payment_status')
        .order('booking_date', { ascending: true });

      if (customer_email) {
        studioQuery = studioQuery.eq('customer_email', customer_email);
      }
      if (customer_phone) {
        studioQuery = studioQuery.eq('customer_phone', customer_phone);
      }
      if (dbDateFrom) {
        studioQuery = studioQuery.gte('booking_date', dbDateFrom);
      }
      if (dbDateTo) {
        studioQuery = studioQuery.lte('booking_date', dbDateTo);
      }

      const { data: studioBookings } = await studioQuery;
      if (studioBookings) {
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
        .select('id, booking_number, customer_name, booking_date, duration_days, status, total')
        .order('booking_date', { ascending: true });

      if (customer_email) {
        equipmentQuery = equipmentQuery.eq('customer_email', customer_email);
      }
      if (customer_phone) {
        equipmentQuery = equipmentQuery.eq('customer_phone', customer_phone);
      }
      if (dbDateFrom) {
        equipmentQuery = equipmentQuery.gte('booking_date', dbDateFrom);
      }
      if (dbDateTo) {
        equipmentQuery = equipmentQuery.lte('booking_date', dbDateTo);
      }

      const { data: equipmentBookings } = await equipmentQuery;
      if (equipmentBookings) {
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
```

---

## 5. vapi-update-booking

**Function Name**: `vapi-update-booking`

**Complete Code**:
```typescript
// Vapi Edge Function: Update or cancel booking
// Allows voice agent to modify existing bookings

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const {
      booking_id,
      booking_type = 'studio',
      action = 'update', // 'update' or 'cancel'
      customer_email, // For verification
      new_booking_date,
      new_booking_time,
      new_session_hours,
      new_special_requests,
    } = await req.json();

    if (!booking_id) {
      return new Response(
        JSON.stringify({ error: 'booking_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify booking exists and belongs to customer (if email provided)
    let booking;
    if (booking_type === 'studio') {
      let query = supabaseClient
        .from('studio_bookings')
        .select('*')
        .eq('id', booking_id)
        .single();

      const { data, error } = await query;
      if (error || !data) {
        return new Response(
          JSON.stringify({ success: false, error: 'Booking not found' }),
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
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Equipment booking updates not yet supported' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle cancellation
    if (action === 'cancel') {
      const { error: updateError } = await supabaseClient
        .from('studio_bookings')
        .update({ booking_status: 'cancelled' })
        .eq('id', booking_id);

      if (updateError) {
        return new Response(
          JSON.stringify({ success: false, error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Booking cancelled successfully',
          booking_id: booking_id,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle update - check for conflicts if date/time changed
    if (new_booking_date || new_booking_time) {
      // Convert date to DB format if provided
      const checkDate = new_booking_date ? convertDateToDBFormat(new_booking_date) : booking.booking_date;
      const checkTime = new_booking_time || booking.booking_time;
      const checkHours = new_session_hours || booking.session_hours;

      // Validate new date format if provided
      if (new_booking_date) {
        const testDate = new Date(checkDate);
        if (isNaN(testDate.getTime())) {
          return new Response(
            JSON.stringify({ 
              error: `Invalid date format. Expected DD-MM-YYYY format (e.g., 25-12-2024). Received: ${new_booking_date}` 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Check for conflicts (excluding current booking)
      const { data: conflicts } = await supabaseClient
        .from('studio_bookings')
        .select('booking_time, session_hours')
        .eq('booking_date', checkDate)
        .in('booking_status', ['pending', 'confirmed'])
        .neq('id', booking_id);

      if (conflicts) {
        const [hours, minutes] = checkTime.split(':').map(Number);
        const requestedStart = new Date(`${checkDate}T${checkTime}`);
        const requestedEnd = new Date(requestedStart);
        requestedEnd.setHours(requestedStart.getHours() + checkHours);

        for (const conflict of conflicts) {
          const [bookingHours, bookingMinutes] = conflict.booking_time.split(':').map(Number);
          const conflictStart = new Date(`${checkDate}T${conflict.booking_time}`);
          const conflictEnd = new Date(conflictStart);
          conflictEnd.setHours(conflictStart.getHours() + conflict.session_hours);

          if (requestedStart < conflictEnd && requestedEnd > conflictStart) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Booking conflict detected',
                message: `The requested time slot conflicts with an existing booking.`,
              }),
              { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      }
    }

    // Perform update
    const updateData: any = {};
    if (new_booking_date) updateData.booking_date = convertDateToDBFormat(new_booking_date);
    if (new_booking_time) updateData.booking_time = new_booking_time;
    if (new_session_hours) updateData.session_hours = new_session_hours;
    if (new_special_requests !== undefined) updateData.special_requests = new_special_requests;

    const { data: updatedBooking, error: updateError } = await supabaseClient
      .from('studio_bookings')
      .update(updateData)
      .eq('id', booking_id)
      .select()
      .single();

    if (updateError) {
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking: updatedBooking,
        message: 'Booking updated successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in update-booking:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## How to Deploy in Supabase

1. **Go to Supabase Dashboard** → Edge Functions
2. **Click "Create a new function"** for each function
3. **Name each function** exactly as shown:
   - `vapi-check-availability`
   - `vapi-get-available-slots`
   - `vapi-create-booking`
   - `vapi-list-bookings`
   - `vapi-update-booking`
4. **Paste the complete code** for each function
5. **Click Deploy**

**Note**: All functions use DD-MM-YYYY date format (e.g., `25-12-2024`) and automatically convert to YYYY-MM-DD for database storage.
