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
    console.log('🔍 vapi-create-booking called');
    
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

    const requestBody = await req.json();
    console.log('📥 Request body:', JSON.stringify(requestBody, null, 2));
    
    const {
      customer_name,
      customer_email,
      customer_phone,
      booking_date,
      booking_time,
      session_hours = 1,
      duration_days, // For equipment bookings
      booking_type = 'studio',
      service_type, // For studio bookings: 'rehearsal' or 'recording'
      package_name: provided_package_name,
      package_price,
      special_requests,
      equipment_items, // For equipment bookings - array of {name, quantity, price, duration}
    } = requestBody;
    
    let package_name = provided_package_name;

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
    let conflictDetails: { existing_time: string; existing_hours: number } | null = null;

    // Check blocked slot (date + time)
    const checkTime = (booking_time || '09:00').slice(0, 5);
    const { data: blockedRow } = await supabaseClient
      .from('blocked_slots')
      .select('id')
      .eq('blocked_date', dbDate)
      .eq('blocked_time', checkTime)
      .maybeSingle();

    if (blockedRow) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Time slot is not available for booking',
          message: `Sorry, ${booking_date} at ${checkTime} is not available. Please choose a different time.`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For equipment bookings, skip time-based conflict checking
    // Equipment can be rented on the same date by multiple customers
    if (booking_type === 'equipment') {
      console.log('📦 Equipment booking - skipping time-based conflict check');
      hasConflict = false; // Equipment doesn't have time-based conflicts
    } else if (booking_type === 'studio' && booking_time) {
      // Check studio booking conflicts (use DB format date)
      const { data: existingBookings, error: conflictCheckError } = await supabaseClient
        .from('studio_bookings')
        .select('booking_time, session_hours')
        .eq('booking_date', dbDate)
        .in('booking_status', ['pending', 'confirmed', 'completed']);

      if (conflictCheckError) {
        console.error('❌ Error checking studio booking conflicts:', conflictCheckError);
        // Continue anyway - let the booking be created
      } else if (existingBookings && existingBookings.length > 0) {
        console.log(`📊 Checking ${existingBookings.length} existing studio bookings for conflicts`);
        for (const booking of existingBookings) {
          if (!booking.booking_time) continue;
          
          const [bookingHours, bookingMinutes] = booking.booking_time.split(':').map(Number);
          const bookingStart = new Date(requestedDate);
          bookingStart.setHours(bookingHours, bookingMinutes, 0, 0);
          
          const bookingEnd = new Date(bookingStart);
          bookingEnd.setHours(bookingStart.getHours() + (booking.session_hours || 1));

          if (requestedStart < bookingEnd && requestedEnd > bookingStart) {
            hasConflict = true;
            conflictDetails = {
              existing_time: booking.booking_time,
              existing_hours: booking.session_hours,
            };
            console.log('⚠️ Conflict detected:', conflictDetails);
            break;
          }
        }
      }
    } else if (booking_type === 'studio' && !booking_time) {
      // Studio bookings require booking_time
      return new Response(
        JSON.stringify({
          success: false,
          error: 'booking_time is required for studio bookings',
          message: 'Studio bookings require a specific time slot. Please provide booking_time.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      // Validate service_type for studio bookings
      if (!service_type || (service_type !== 'rehearsal' && service_type !== 'recording')) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'service_type is required for studio bookings',
            message: 'For studio bookings, you must specify service_type as either "rehearsal" or "recording". Please ask the customer which type of studio service they want.',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Rehearsal minimum: 3 hours
      if (service_type === 'rehearsal' && (session_hours < 3 || !session_hours)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Rehearsal minimum booking is 3 hours',
            message: 'Rehearsal space has a minimum booking of 3 hours. Please ask the customer how many hours they need (minimum 3).',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate or fetch studio session price
      let calculatedPrice = package_price || 0;
      
      // Fetch the correct service based on service_type
      console.log(`💰 Fetching pricing for ${service_type} studio service...`);
      
      const { data: services, error: pricingError } = await supabaseClient
        .from('studio_services')
        .select('id, name, type, hourly_rate, four_hour_rate, eight_hour_rate')
        .eq('type', service_type) // Filter by service_type
        .limit(1);
      
      if (pricingError) {
        console.error('⚠️ Error fetching pricing:', pricingError);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to fetch pricing information',
            message: `Unable to retrieve pricing for ${service_type} studio. Please try again.`,
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (!services || services.length === 0) {
        console.error(`❌ No ${service_type} studio service found in database`);
        return new Response(
          JSON.stringify({
            success: false,
            error: `No ${service_type} studio service found`,
            message: `Unable to find pricing for ${service_type} studio. Please contact support.`,
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const service = services[0];
      console.log(`✅ Found service: ${service.name} (${service.type})`);
      
      // If price is not provided or is 0, calculate from database
      if (!package_price || package_price === 0) {
        const hourlyRate = parseFloat(service.hourly_rate) || 0;
        
        // Calculate price based on session hours
        if (session_hours >= 8 && service.eight_hour_rate) {
          calculatedPrice = parseFloat(service.eight_hour_rate);
          console.log(`💰 Using 8-hour package rate: £${calculatedPrice}`);
        } else if (session_hours >= 4 && service.four_hour_rate) {
          calculatedPrice = parseFloat(service.four_hour_rate);
          console.log(`💰 Using 4-hour package rate: £${calculatedPrice}`);
        } else {
          // Calculate hourly rate
          calculatedPrice = hourlyRate * session_hours;
          console.log(`💰 Calculating hourly rate: £${hourlyRate} × ${session_hours} hours = £${calculatedPrice}`);
        }
      } else {
        console.log(`💰 Using provided price: £${calculatedPrice}`);
      }
      
      // Set package_name based on service
      package_name = service.name;
      console.log(`📦 Package name set to: ${package_name}`);
      
      // Create studio booking (use DB format date)
      const insertData = {
        customer_name,
        customer_email,
        customer_phone: customer_phone || null,
        package_name: package_name || 'Studio Session',
        package_price: calculatedPrice,
        booking_date: dbDate, // Use converted DB format
        booking_time: booking_time || '09:00',
        session_hours,
        booking_status: 'pending',
        payment_status: 'pending',
        special_requests: special_requests || null,
      };
      
      console.log('📝 Inserting studio booking:', JSON.stringify(insertData, null, 2));
      
      const { data: booking, error: bookingError } = await supabaseClient
        .from('studio_bookings')
        .insert(insertData)
        .select()
        .single();

      if (bookingError) {
        console.error('❌ Error creating studio booking:', bookingError);
        console.error('❌ Error details:', JSON.stringify(bookingError, null, 2));
        console.error('❌ Error code:', bookingError.code);
        console.error('❌ Error message:', bookingError.message);
        console.error('❌ Error hint:', bookingError.hint);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: bookingError.message,
            code: bookingError.code,
            hint: bookingError.hint,
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ Studio booking created successfully:', booking?.id);
      
      // Create Stripe checkout session and send email with payment link
      try {
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (stripeKey) {
          const Stripe = (await import('npm:stripe@14.10.0')).default;
          const stripe = new Stripe(stripeKey, {
            apiVersion: '2024-11-20.acacia',
          });

          const origin = 'https://pinnaclessa.com'; // Update with your actual domain
          const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
              {
                price_data: {
                  currency: 'gbp',
                  product_data: {
                    name: package_name || 'Studio Session',
                    description: `${session_hours} hour ${service_type} studio session on ${booking_date} at ${booking_time}`,
                  },
                  unit_amount: Math.round(calculatedPrice * 100),
                },
                quantity: 1,
              },
            ],
            mode: 'payment',
            success_url: `${origin}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/pricing`,
            customer_email: customer_email,
            metadata: {
              booking_id: booking.id,
              booking_type: 'studio',
            },
          });

          // Update booking with Stripe session ID
          await supabaseClient
            .from('studio_bookings')
            .update({ stripe_session_id: session.id })
            .eq('id', booking.id);

          // Log session URL for debugging
          console.log('🔗 Stripe checkout session created:', {
            sessionId: session.id,
            sessionUrl: session.url,
            hasUrl: !!session.url,
          });

          // Send email with payment link directly (avoiding function-to-function auth issues)
          const resendApiKey = Deno.env.get('RESEND_API_KEY');
          if (resendApiKey) {
            // Ensure session URL is available
            if (!session.url) {
              console.error('❌ Stripe session URL is missing!', session);
            }
            
            const paymentUrl = session.url || 'https://pinnaclessa.com/pricing'; // Fallback URL
            console.log('📧 Using payment URL:', paymentUrl);
            
            // Format booking date for display
            const bookingDateObj = new Date(dbDate);
            const formattedDate = bookingDateObj.toLocaleDateString('en-GB', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            });
            
            const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  background-color: hsl(222, 47%, 11%);
                  color: #ffffff;
                  line-height: 1.6;
                  padding: 20px;
                }
                .email-container { 
                  max-width: 800px; 
                  margin: 0 auto; 
                  background-color: hsl(222, 47%, 11%);
                  border-radius: 8px;
                  overflow: hidden;
                }
                .header-section {
                  background: linear-gradient(135deg, hsl(222, 47%, 11%) 0%, hsl(217, 33%, 17%) 100%);
                  padding: 30px;
                  border-bottom: 3px solid hsl(200, 85%, 60%);
                }
                .header-title {
                  font-size: 24px;
                  font-weight: bold;
                  color: hsl(200, 85%, 60%);
                  margin-bottom: 10px;
                  display: flex;
                  align-items: center;
                  gap: 10px;
                }
                .booking-id {
                  color: #888;
                  font-size: 14px;
                  margin-top: 5px;
                }
                .content-section {
                  padding: 30px;
                  background-color: hsl(222, 47%, 11%);
                }
                .section {
                  background-color: hsl(217, 33%, 17%);
                  border: 1px solid hsl(217, 33%, 25%);
                  border-radius: 8px;
                  padding: 20px;
                  margin-bottom: 20px;
                }
                .section-title {
                  font-size: 18px;
                  font-weight: 600;
                  color: hsl(200, 85%, 60%);
                  margin-bottom: 15px;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                }
                .info-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 15px;
                }
                .info-item {
                  display: flex;
                  flex-direction: column;
                }
                .info-label {
                  font-size: 12px;
                  color: #888;
                  margin-bottom: 5px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                }
                .info-value {
                  font-size: 16px;
                  color: #ffffff;
                  font-weight: 500;
                }
                .status-badge {
                  display: inline-block;
                  padding: 4px 12px;
                  border-radius: 12px;
                  font-size: 12px;
                  font-weight: 600;
                  background-color: hsl(0, 85%, 60%);
                  color: #ffffff;
                }
                .equipment-item {
                  background-color: hsl(222, 47%, 11%);
                  border: 1px solid hsl(217, 33%, 25%);
                  border-radius: 6px;
                  padding: 15px;
                  margin-bottom: 10px;
                }
                .equipment-name {
                  font-size: 16px;
                  font-weight: 600;
                  color: #ffffff;
                  margin-bottom: 8px;
                }
                .price-breakdown {
                  font-size: 14px;
                  color: #888;
                  margin-bottom: 5px;
                }
                .item-total {
                  font-size: 16px;
                  font-weight: 600;
                  color: hsl(0, 85%, 60%);
                  margin-top: 5px;
                }
                .pricing-summary {
                  background-color: hsl(222, 47%, 11%);
                  border: 1px solid hsl(217, 33%, 25%);
                  border-radius: 6px;
                  padding: 15px;
                }
                .summary-row {
                  display: flex;
                  justify-content: space-between;
                  padding: 10px 0;
                  border-bottom: 1px solid hsl(217, 33%, 25%);
                }
                .summary-row:last-child {
                  border-bottom: none;
                  border-top: 2px solid hsl(200, 85%, 60%);
                  margin-top: 10px;
                  padding-top: 15px;
                }
                .summary-label {
                  color: #888;
                  font-size: 14px;
                }
                .summary-value {
                  color: #ffffff;
                  font-weight: 600;
                  font-size: 16px;
                }
                .summary-total {
                  color: hsl(0, 85%, 60%);
                  font-size: 20px;
                  font-weight: bold;
                }
                .payment-button {
                  display: block;
                  width: 100%;
                  background: linear-gradient(135deg, hsl(142, 76%, 36%) 0%, hsl(142, 76%, 28%) 100%);
                  color: #ffffff;
                  text-align: center;
                  padding: 18px 30px;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: bold;
                  font-size: 18px;
                  margin: 30px 0;
                  transition: all 0.3s ease;
                }
                .payment-button:hover {
                  background: linear-gradient(135deg, hsl(142, 76%, 28%) 0%, hsl(142, 76%, 36%) 100%);
                  transform: translateY(-2px);
                  box-shadow: 0 4px 12px hsla(142, 76%, 36%, 0.3);
                }
                .footer {
                  text-align: center;
                  color: #666;
                  font-size: 12px;
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid hsl(217, 33%, 25%);
                }
                .footer a {
                  color: hsl(200, 85%, 60%);
                  text-decoration: none;
                }
                @media only screen and (max-width: 600px) {
                  .info-grid {
                    grid-template-columns: 1fr;
                  }
                  .content-section {
                    padding: 20px;
                  }
                }
              </style>
            </head>
            <body>
              <div class="email-container">
                <div class="header-section">
                  <div class="header-title">
                    📦 Booking Details
                    <span style="background-color: hsl(217, 33%, 20%); padding: 4px 12px; border-radius: 12px; font-size: 12px; color: hsl(200, 85%, 60%); margin-left: 10px;">Studio Session</span>
                  </div>
                  <div class="booking-id">Booking ID: ${booking.id.substring(0, 8).toUpperCase()}</div>
                </div>

                <div class="content-section">
                  <p style="margin-bottom: 25px; color: #ccc; font-size: 16px;">Dear ${customer_name},</p>
                  <p style="margin-bottom: 30px; color: #ccc; font-size: 14px;">Your studio booking has been confirmed via phone. Please complete your payment to secure your session.</p>

                  <!-- Customer Information -->
                  <div class="section">
                    <div class="section-title">👥 Customer Information</div>
                    <div class="info-grid">
                      <div class="info-item">
                        <span class="info-label">Name</span>
                        <span class="info-value">${customer_name}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">Email</span>
                        <span class="info-value">${customer_email}</span>
                      </div>
                      ${customer_phone ? `
                      <div class="info-item">
                        <span class="info-label">Phone</span>
                        <span class="info-value">${customer_phone}</span>
                      </div>
                      ` : ''}
                    </div>
                  </div>

                  <!-- Booking Details -->
                  <div class="section">
                    <div class="section-title">📅 Booking Details</div>
                    <div class="info-grid">
                      <div class="info-item">
                        <span class="info-label">Booking Date</span>
                        <span class="info-value">${formattedDate}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">Time</span>
                        <span class="info-value">${booking_time}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">Duration</span>
                        <span class="info-value">${session_hours} hour(s)</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">Status</span>
                        <span class="status-badge">pending</span>
                      </div>
                    </div>
                  </div>

                  <!-- Package Details -->
                  <div class="section">
                    <div class="section-title">🎵 Package Details</div>
                    <div class="equipment-item">
                      <div class="equipment-name">${package_name || 'Studio Session'}</div>
                      <div class="price-breakdown">${service_type} studio session - ${session_hours} hour(s)</div>
                      <div class="item-total">£${calculatedPrice.toFixed(2)}</div>
                    </div>
                  </div>

                  <!-- Pricing Summary -->
                  <div class="section">
                    <div class="section-title">💰 Pricing Summary</div>
                    <div class="pricing-summary">
                      <div class="summary-row">
                        <span class="summary-label">Package Price</span>
                        <span class="summary-value">£${calculatedPrice.toFixed(2)}</span>
                      </div>
                      <div class="summary-row">
                        <span class="summary-label">Total Amount</span>
                        <span class="summary-value summary-total">£${calculatedPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Payment Button -->
                  <a href="${paymentUrl}" class="payment-button">💳 Complete Payment</a>
                  ${!session.url ? '<p style="color: hsl(0, 85%, 60%); font-size: 12px; text-align: center; margin-top: 10px;">Payment link is being generated. Please contact support if you don\'t receive it shortly.</p>' : ''}

                  <p style="margin-top: 30px; color: #888; font-size: 14px; text-align: center;">
                    <strong style="color: hsl(0, 85%, 60%);">Important:</strong> Please complete your payment within 24 hours to secure your booking. 
                    Your session will be confirmed once payment is received.
                  </p>

                  <div class="footer">
                    <p>If you have any questions, please contact us at <a href="mailto:support@pinnaclessa.com">support@pinnaclessa.com</a></p>
                    <p style="margin-top: 10px;">&copy; ${new Date().getFullYear()} Pinnacle SSA. All rights reserved.</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `;

            // Send email directly via Resend API (bypassing function-to-function auth)
            try {
              const resendResponse = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${resendApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: 'Pinnacle SSA <noreply@pinnaclessa.com>',
                  to: customer_email,
                  subject: 'Complete Your Studio Booking Payment - Pinnacle SSA',
                  html: emailHtml,
                  bcc: ['customerservice@pinnaclessa.com'],
                }),
              });

              const resendData = await resendResponse.json();

              if (!resendResponse.ok) {
                console.error('❌ Resend API error:', resendData);
              } else {
                console.log('✅ Payment link email sent to:', customer_email, 'Email ID:', resendData.id);
              }
            } catch (emailError) {
              console.error('❌ Error sending email via Resend:', emailError);
            }
          } else {
            console.warn('⚠️ RESEND_API_KEY not configured - skipping email');
          }
        }
      } catch (emailError) {
        console.error('Error creating checkout session or sending email:', emailError);
        // Don't fail the booking creation if email fails
      }
      
      bookingResult = booking;
    } else if (booking_type === 'equipment') {
      // Validate equipment booking requirements
      if (!equipment_items || !Array.isArray(equipment_items) || equipment_items.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Equipment bookings require at least one equipment item. Please provide equipment_items array.' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!duration_days || duration_days < 1) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Equipment bookings require duration_days (number of rental days).' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create equipment booking
      // Generate unique booking number
      const bookingNumber = `EQ-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Process equipment items and calculate pricing
      const items = equipment_items.map((item: any) => {
        const itemDuration = item.duration || duration_days;
        const itemPrice = item.price || 0;
        const itemQuantity = item.quantity || 1;
        const itemTotal = itemPrice * itemDuration * itemQuantity;
        
        return {
          id: item.id || null,
          name: item.name || 'Unknown Item',
          quantity: itemQuantity,
          price: itemPrice, // Price per day
          duration: itemDuration, // Duration in days
          total: itemTotal, // Total for this item (price * duration * quantity)
        };
      });

      // Calculate subtotal (sum of all item totals)
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
      const total = subtotal; // Add delivery cost if needed in future

      console.log('📝 Equipment booking details:', {
        items: items.length,
        duration_days,
        subtotal,
        total,
        collection_time: booking_time || 'Not specified',
      });

      const { data: booking, error: bookingError } = await supabaseClient
        .from('bookings')
        .insert({
          booking_number: bookingNumber,
          customer_name,
          customer_email,
          customer_phone: customer_phone || null,
          booking_date: dbDate, // Use converted DB format
          booking_time: booking_time || null, // Collection time for equipment
          duration_days: duration_days,
          items: items,
          subtotal,
          total,
          status: 'pending',
          notes: special_requests || null,
        })
        .select()
        .single();

      if (bookingError) {
        console.error('❌ Error creating equipment booking:', bookingError);
        console.error('❌ Error details:', JSON.stringify(bookingError, null, 2));
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: bookingError.message,
            details: bookingError 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ Equipment booking created successfully:', booking?.id);
      
      // Create Stripe checkout session and send email with payment link
      try {
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (stripeKey) {
          const Stripe = (await import('npm:stripe@14.10.0')).default;
          const stripe = new Stripe(stripeKey, {
            apiVersion: '2024-11-20.acacia',
          });

          const origin = 'https://pinnaclessa.com'; // Update with your actual domain
          
          const lineItems = items.map((item: any) => ({
            price_data: {
              currency: 'gbp',
              product_data: {
                name: item.name,
                description: `${item.duration || duration_days} day rental`,
              },
              unit_amount: Math.round((item.price || 0) * (item.duration || duration_days) * 100),
            },
            quantity: item.quantity || 1,
          }));

          const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${origin}/cart?success=true&booking_number=${bookingNumber}`,
            cancel_url: `${origin}/cart`,
            customer_email: customer_email,
            metadata: {
              booking_id: booking.id,
              booking_number: bookingNumber,
              booking_type: 'equipment',
            },
          });

          // Update booking with Stripe session ID
          await supabaseClient
            .from('bookings')
            .update({ stripe_session_id: session.id })
            .eq('id', booking.id);

          // Log session URL for debugging
          console.log('🔗 Stripe checkout session created:', {
            sessionId: session.id,
            sessionUrl: session.url,
            hasUrl: !!session.url,
          });

          // Send email with payment link directly (avoiding function-to-function auth issues)
          const resendApiKey = Deno.env.get('RESEND_API_KEY');
          if (resendApiKey) {
            // Ensure session URL is available
            if (!session.url) {
              console.error('❌ Stripe session URL is missing!', session);
            }
            
            const paymentUrl = session.url || 'https://pinnaclessa.com/cart'; // Fallback URL
            console.log('📧 Using payment URL:', paymentUrl);
            
            const itemsList = items.map((item: any) => 
              `<li>${item.quantity || 1}x ${item.name} (${item.duration || duration_days} day(s)) - £${((item.price || 0) * (item.quantity || 1) * (item.duration || duration_days)).toFixed(2)}</li>`
            ).join('');

            // Format booking date for display
            const bookingDateObj = new Date(dbDate);
            const formattedDate = bookingDateObj.toLocaleDateString('en-GB', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            });
            
            const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  background-color: hsl(222, 47%, 11%);
                  color: #ffffff;
                  line-height: 1.6;
                  padding: 20px;
                }
                .email-container { 
                  max-width: 800px; 
                  margin: 0 auto; 
                  background-color: hsl(222, 47%, 11%);
                  border-radius: 8px;
                  overflow: hidden;
                }
                .header-section {
                  background: linear-gradient(135deg, hsl(222, 47%, 11%) 0%, hsl(217, 33%, 17%) 100%);
                  padding: 30px;
                  border-bottom: 3px solid hsl(200, 85%, 60%);
                }
                .header-title {
                  font-size: 24px;
                  font-weight: bold;
                  color: hsl(200, 85%, 60%);
                  margin-bottom: 10px;
                  display: flex;
                  align-items: center;
                  gap: 10px;
                }
                .booking-id {
                  color: #888;
                  font-size: 14px;
                  margin-top: 5px;
                }
                .content-section {
                  padding: 30px;
                  background-color: hsl(222, 47%, 11%);
                }
                .section {
                  background-color: hsl(217, 33%, 17%);
                  border: 1px solid hsl(217, 33%, 25%);
                  border-radius: 8px;
                  padding: 20px;
                  margin-bottom: 20px;
                }
                .section-title {
                  font-size: 18px;
                  font-weight: 600;
                  color: hsl(200, 85%, 60%);
                  margin-bottom: 15px;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                }
                .info-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 15px;
                }
                .info-item {
                  display: flex;
                  flex-direction: column;
                }
                .info-label {
                  font-size: 12px;
                  color: #888;
                  margin-bottom: 5px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                }
                .info-value {
                  font-size: 16px;
                  color: #ffffff;
                  font-weight: 500;
                }
                .status-badge {
                  display: inline-block;
                  padding: 4px 12px;
                  border-radius: 12px;
                  font-size: 12px;
                  font-weight: 600;
                  background-color: hsl(0, 85%, 60%);
                  color: #ffffff;
                }
                .equipment-item {
                  background-color: hsl(222, 47%, 11%);
                  border: 1px solid hsl(217, 33%, 25%);
                  border-radius: 6px;
                  padding: 15px;
                  margin-bottom: 10px;
                }
                .equipment-name {
                  font-size: 16px;
                  font-weight: 600;
                  color: #ffffff;
                  margin-bottom: 8px;
                }
                .price-breakdown {
                  font-size: 14px;
                  color: #888;
                  margin-bottom: 5px;
                }
                .item-total {
                  font-size: 16px;
                  font-weight: 600;
                  color: hsl(0, 85%, 60%);
                  margin-top: 5px;
                }
                .pricing-summary {
                  background-color: hsl(222, 47%, 11%);
                  border: 1px solid hsl(217, 33%, 25%);
                  border-radius: 6px;
                  padding: 15px;
                }
                .summary-row {
                  display: flex;
                  justify-content: space-between;
                  padding: 10px 0;
                  border-bottom: 1px solid hsl(217, 33%, 25%);
                }
                .summary-row:last-child {
                  border-bottom: none;
                  border-top: 2px solid hsl(200, 85%, 60%);
                  margin-top: 10px;
                  padding-top: 15px;
                }
                .summary-label {
                  color: #888;
                  font-size: 14px;
                }
                .summary-value {
                  color: #ffffff;
                  font-weight: 600;
                  font-size: 16px;
                }
                .summary-total {
                  color: hsl(0, 85%, 60%);
                  font-size: 20px;
                  font-weight: bold;
                }
                .payment-button {
                  display: block;
                  width: 100%;
                  background: linear-gradient(135deg, hsl(142, 76%, 36%) 0%, hsl(142, 76%, 28%) 100%);
                  color: #ffffff;
                  text-align: center;
                  padding: 18px 30px;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: bold;
                  font-size: 18px;
                  margin: 30px 0;
                  transition: all 0.3s ease;
                }
                .payment-button:hover {
                  background: linear-gradient(135deg, hsl(142, 76%, 28%) 0%, hsl(142, 76%, 36%) 100%);
                  transform: translateY(-2px);
                  box-shadow: 0 4px 12px hsla(142, 76%, 36%, 0.3);
                }
                .footer {
                  text-align: center;
                  color: #666;
                  font-size: 12px;
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid hsl(217, 33%, 25%);
                }
                .footer a {
                  color: hsl(200, 85%, 60%);
                  text-decoration: none;
                }
                @media only screen and (max-width: 600px) {
                  .info-grid {
                    grid-template-columns: 1fr;
                  }
                  .content-section {
                    padding: 20px;
                  }
                }
              </style>
            </head>
            <body>
              <div class="email-container">
                <div class="header-section">
                  <div class="header-title">
                    📦 Booking Details
                    <span style="background-color: hsl(217, 33%, 20%); padding: 4px 12px; border-radius: 12px; font-size: 12px; color: hsl(200, 85%, 60%); margin-left: 10px;">Studio Booking</span>
                  </div>
                  <div class="booking-id">Booking ID: ${bookingNumber}</div>
                </div>

                <div class="content-section">
                  <p style="margin-bottom: 25px; color: #ccc; font-size: 16px;">Dear ${customer_name},</p>
                  <p style="margin-bottom: 30px; color: #ccc; font-size: 14px;">Your studio booking has been confirmed via phone. Please complete your payment to secure your booking.</p>

                  <!-- Customer Information -->
                  <div class="section">
                    <div class="section-title">👥 Customer Information</div>
                    <div class="info-grid">
                      <div class="info-item">
                        <span class="info-label">Name</span>
                        <span class="info-value">${customer_name}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">Email</span>
                        <span class="info-value">${customer_email}</span>
                      </div>
                      ${customer_phone ? `
                      <div class="info-item">
                        <span class="info-label">Phone</span>
                        <span class="info-value">${customer_phone}</span>
                      </div>
                      ` : ''}
                    </div>
                  </div>

                  <!-- Booking Details -->
                  <div class="section">
                    <div class="section-title">📅 Booking Details</div>
                    <div class="info-grid">
                      <div class="info-item">
                        <span class="info-label">Booking Date</span>
                        <span class="info-value">${formattedDate}</span>
                      </div>
                      ${booking_time ? `
                      <div class="info-item">
                        <span class="info-label">Collection Time</span>
                        <span class="info-value">${booking_time}</span>
                      </div>
                      ` : ''}
                      <div class="info-item">
                        <span class="info-label">Rental Duration</span>
                        <span class="info-value">${duration_days} day${duration_days > 1 ? 's' : ''}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">Status</span>
                        <span class="status-badge">pending</span>
                      </div>
                    </div>
                  </div>

                  <!-- Studio Booked -->
                  <div class="section">
                    <div class="section-title">📦 Studio Booked</div>
                    ${items.map((item: any) => `
                      <div class="equipment-item">
                        <div class="equipment-name">${item.name}</div>
                        <div class="price-breakdown">Duration: ${item.duration || duration_days} day${(item.duration || duration_days) > 1 ? 's' : ''}</div>
                        <div class="price-breakdown">Price: £${(item.price || 0).toFixed(2)}/day × ${item.quantity || 1} × ${item.duration || duration_days} day${(item.duration || duration_days) > 1 ? 's' : ''}</div>
                        <div class="item-total">£${((item.price || 0) * (item.quantity || 1) * (item.duration || duration_days)).toFixed(2)}</div>
                      </div>
                    `).join('')}
                  </div>

                  <!-- Pricing Summary -->
                  <div class="section">
                    <div class="section-title">💰 Pricing Summary</div>
                    <div class="pricing-summary">
                      ${subtotal !== total ? `
                      <div class="summary-row">
                        <span class="summary-label">Subtotal</span>
                        <span class="summary-value">£${subtotal.toFixed(2)}</span>
                      </div>
                      ` : ''}
                      <div class="summary-row">
                        <span class="summary-label">Total Amount</span>
                        <span class="summary-value summary-total">£${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Payment Button -->
                  <a href="${paymentUrl}" class="payment-button">💳 Complete Payment</a>
                  ${!session.url ? '<p style="color: hsl(0, 85%, 60%); font-size: 12px; text-align: center; margin-top: 10px;">Payment link is being generated. Please contact support if you don\'t receive it shortly.</p>' : ''}

                  <p style="margin-top: 30px; color: #888; font-size: 14px; text-align: center;">
                    <strong style="color: hsl(0, 85%, 60%);">Important:</strong> Please complete your payment within 24 hours to secure your booking. 
                    Collection details will be sent once payment is received.
                  </p>

                  <div class="footer">
                    <p>If you have any questions, please contact us at <a href="mailto:support@pinnaclessa.com">support@pinnaclessa.com</a></p>
                    <p style="margin-top: 10px;">&copy; ${new Date().getFullYear()} Pinnacle SSA. All rights reserved.</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `;

            // Send email directly via Resend API (bypassing function-to-function auth)
            try {
              const resendResponse = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${resendApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: 'Pinnacle SSA <noreply@pinnaclessa.com>',
                  to: customer_email,
                  subject: 'Complete Your Studio Booking Payment - Pinnacle SSA',
                  html: emailHtml,
                  bcc: ['customerservice@pinnaclessa.com'],
                }),
              });

              const resendData = await resendResponse.json();

              if (!resendResponse.ok) {
                console.error('❌ Resend API error:', resendData);
              } else {
                console.log('✅ Payment link email sent to:', customer_email, 'Email ID:', resendData.id);
              }
            } catch (emailError) {
              console.error('❌ Error sending email via Resend:', emailError);
            }
          } else {
            console.warn('⚠️ RESEND_API_KEY not configured - skipping email');
          }
        }
      } catch (emailError) {
        console.error('Error creating checkout session or sending email:', emailError);
        // Don't fail the booking creation if email fails
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
