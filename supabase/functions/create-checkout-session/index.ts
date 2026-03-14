import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@14.10.0";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BookingRequest {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  packageName: string;
  packagePrice: number;
  bookingDate: string;
  bookingTime: string;
  sessionHours: number;
  specialRequests?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeKey || !supabaseUrl || !supabaseKey) {
      console.error('Missing environment variables:', {
        hasStripeKey: !!stripeKey,
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseKey: !!supabaseKey
      });
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2024-11-20.acacia",
    });

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Creating checkout session for studio booking');
    const bookingData: BookingRequest = await req.json();

    // Rehearsal minimum: 3 hours
    const isRehearsal = bookingData.packageName?.toLowerCase().includes('rehearsal');
    if (isRehearsal && (bookingData.sessionHours || 0) < 3) {
      return new Response(
        JSON.stringify({
          error: 'Rehearsal space has a minimum booking of 3 hours.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check blocked slot (date + time)
    const { data: blockedRow } = await supabase
      .from("blocked_slots")
      .select("id")
      .eq("blocked_date", bookingData.bookingDate)
      .eq("blocked_time", bookingData.bookingTime)
      .maybeSingle();

    if (blockedRow) {
      return new Response(
        JSON.stringify({
          error: "This date is not available for booking. Please choose a different date.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const bookingRecord = {
      customer_name: bookingData.customerName,
      customer_email: bookingData.customerEmail,
      customer_phone: bookingData.customerPhone || null,
      package_name: bookingData.packageName,
      package_price: bookingData.packagePrice,
      booking_date: bookingData.bookingDate,
      booking_time: bookingData.bookingTime,
      session_hours: bookingData.sessionHours,
      special_requests: bookingData.specialRequests || null,
      payment_status: "pending",
      booking_status: "pending",
    };

    const { data: booking, error: dbError } = await supabase
      .from("studio_bookings")
      .insert(bookingRecord)
      .select()
      .single();

    if (dbError) {
      console.error('Database error creating studio booking:', dbError);
      return new Response(
        JSON.stringify({ error: `Database error: ${dbError.message}` }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log('Studio booking created:', booking.id);

    const origin = req.headers.get("origin") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: bookingData.packageName,
              description: `${bookingData.sessionHours} hour studio session on ${bookingData.bookingDate} at ${bookingData.bookingTime}`,
            },
            unit_amount: Math.round(bookingData.packagePrice * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      customer_email: bookingData.customerEmail,
      metadata: {
        booking_id: booking.id,
      },
    });

    const { error: updateError } = await supabase
      .from("studio_bookings")
      .update({ stripe_session_id: session.id })
      .eq("id", booking.id);

    if (updateError) {
      console.error('Error updating booking with session ID:', updateError);
    }

    // Send email with payment link - use same blue/red branded template as other flows
    const TAGLINE = "Sound • Lighting • Recording • Rehearsals";
    const EMAIL_STYLES = `
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #0f1419; }
      .container { max-width: 600px; margin: 0 auto; padding: 24px; }
      .card { background: #151c2c; border-radius: 12px; overflow: hidden; border: 1px solid #2d3a4d; box-shadow: 0 4px 24px rgba(0,0,0,0.4); }
      .brand { background: linear-gradient(135deg, #151c2c 0%, #252f3f 50%, #1e2936 100%); padding: 36px 24px; text-align: center; border-bottom: 3px solid #eb3d2e; }
      .brand h1 { margin: 0; font-size: 22px; font-weight: 700; color: #eb3d2e; letter-spacing: 0.5px; }
      .brand .tagline { margin: 10px 0 0 0; font-size: 11px; color: #94a3b8; letter-spacing: 2px; text-transform: uppercase; }
      .content { padding: 28px 24px; color: #f1f5f9; }
      .greeting { font-size: 18px; font-weight: 600; color: #f8fafc; margin: 0 0 16px 0; }
      .intro { color: #94a3b8; margin: 0 0 24px 0; font-size: 15px; }
      .section { margin: 0 0 24px 0; }
      .section-title { font-size: 12px; font-weight: 700; color: #eb3d2e; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #eb3d2e; }
      .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #2d3a4d; }
      .detail-row:last-child { border-bottom: none; }
      .detail-label { color: #94a3b8; font-size: 14px; flex: 0 0 140px; }
      .detail-value { color: #f1f5f9; font-weight: 500; }
      .cta-button { display: inline-block; background: #eb3d2e; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; margin: 24px 0; }
      .cta-button:hover { background: #d63526; }
      .notes { background: rgba(235,61,46,0.08); border-left: 4px solid #eb3d2e; padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0; border: 1px solid rgba(235,61,46,0.2); }
      .notes .section-title { color: #eb3d2e; }
      .notes p { margin: 8px 0 0 0; color: #cbd5e1; font-size: 14px; }
      .contact { background: #252f3f; padding: 16px; border-radius: 8px; margin: 20px 0; font-size: 14px; border: 1px solid #2d3a4d; }
      .contact a { color: #eb3d2e; text-decoration: none; font-weight: 600; }
      .footer { text-align: center; color: #64748b; font-size: 12px; padding: 20px 24px; border-top: 1px solid #2d3a4d; background: #151c2c; }
      .footer a { color: #eb3d2e; text-decoration: none; }
    `;
    const formattedDate = new Date(bookingData.bookingDate + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${EMAIL_STYLES}</style></head>
      <body>
        <div class="container">
          <div class="card">
            <div class="brand">
              <h1>🎵 Studio Booking Confirmed</h1>
              <p class="tagline">${TAGLINE}</p>
            </div>
            <div class="content">
              <p class="greeting">Dear ${bookingData.customerName},</p>
              <p class="intro">Your studio booking has been confirmed. Please complete your payment to secure your session.</p>
              <div class="section">
                <div class="section-title">Booking Details</div>
                <div class="detail-row"><span class="detail-label">Package:</span><span class="detail-value">${bookingData.packageName}</span></div>
                <div class="detail-row"><span class="detail-label">Date:</span><span class="detail-value">${formattedDate}</span></div>
                <div class="detail-row"><span class="detail-label">Time:</span><span class="detail-value">${bookingData.bookingTime}</span></div>
                <div class="detail-row"><span class="detail-label">Duration:</span><span class="detail-value">${bookingData.sessionHours} hour(s)</span></div>
                <div class="detail-row"><span class="detail-label">Total Amount:</span><span class="detail-value">£${bookingData.packagePrice.toFixed(2)}</span></div>
              </div>
              <div style="text-align: center;">
                <a href="${session.url}" class="cta-button">Complete Payment</a>
              </div>
              <div class="notes">
                <div class="section-title">Important</div>
                <p>Please complete your payment within 24 hours to secure your booking. Your session will be confirmed once payment is received.</p>
              </div>
              <div class="contact">
                Questions? Reply to this email or contact us:<br>
                📧 <a href="mailto:info@pinnaclessa.co.uk">info@pinnaclessa.co.uk</a><br>
                📞 <a href="tel:+447478760211">+44 7478760211</a>
              </div>
            </div>
            <div class="footer">
              <a href="https://pinnaclessa.com">pinnaclessa.com</a> &nbsp;•&nbsp; &copy; ${new Date().getFullYear()} Pinnacle Sound Studios & Academy
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const supabaseFunctionsUrl = Deno.env.get("SUPABASE_URL")?.replace('/rest/v1', '');
    try {
      const emailResponse = await fetch(`${supabaseFunctionsUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: bookingData.customerEmail,
          subject: 'Complete Your Studio Booking Payment - Pinnacle SSA',
          html: emailHtml,
        }),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        console.error('Failed to send payment email:', errorData);
      } else {
        console.log('✅ Payment link email sent to:', bookingData.customerEmail);
      }
    } catch (emailError) {
      console.error('Error sending payment email:', emailError);
      // Don't fail the request if email fails
    }

    console.log('Checkout session created successfully:', session.id);
    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error('Error in create-checkout-session:', error);
    const statusCode = error.message?.includes('Database error') ? 500 : 400;
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: statusCode,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
