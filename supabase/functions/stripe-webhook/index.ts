import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@14.10.0";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const VENUE = "Pinnacle SSA, Unit 4, Robinson Industrial Estate, DE23 8NL Derby";
const PHONE = "+44 7478760211";
const EMAIL = "info@pinnaclessa.co.uk";
const TAGLINE = "Sound • Lighting • Recording • Rehearsals";

function getFirstName(name: string): string {
  const first = (name || "").trim().split(/\s+/)[0];
  return first || "there";
}

function getEndTime(timeStr: string, hours: number): string {
  const [h, m] = timeStr.split(":").map(Number);
  const endMins = (h || 0) * 60 + (m || 0) + hours * 60;
  const endH = Math.floor(endMins / 60) % 24;
  const endM = endMins % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

// Site colours: background hsl(222,47%,11%) #151c2c | secondary hsl(217,33%,17%) #252f3f | gold hsl(0,85%,60%) #eb3d2e | sky hsl(200,85%,60%) #0ea5e9
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
  .detail-label { color: #94a3b8; font-size: 14px; flex: 0 0 120px; }
  .detail-value { color: #f1f5f9; font-weight: 500; }
  .steps { margin: 0; padding-left: 20px; color: #cbd5e1; }
  .steps li { margin-bottom: 8px; }
  .notes { background: rgba(235,61,46,0.08); border-left: 4px solid #eb3d2e; padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0; border: 1px solid rgba(235,61,46,0.2); }
  .notes .section-title { color: #eb3d2e; }
  .notes ul { margin: 8px 0 0 0; padding-left: 20px; color: #cbd5e1; }
  .contact { background: #252f3f; padding: 16px; border-radius: 8px; margin: 20px 0; font-size: 14px; border: 1px solid #2d3a4d; }
  .contact a { color: #eb3d2e; text-decoration: none; font-weight: 600; }
  .signoff { margin: 24px 0 0 0; color: #94a3b8; font-size: 14px; }
  .footer { text-align: center; color: #64748b; font-size: 12px; padding: 20px 24px; border-top: 1px solid #2d3a4d; background: #151c2c; }
  .footer a { color: #eb3d2e; text-decoration: none; }
  .badge { display: inline-block; padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 600; background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.4); margin-bottom: 20px; }
`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeKey || !supabaseUrl || !supabaseKey) {
      console.error('Missing environment variables:', {
        hasStripeKey: !!stripeKey,
        hasWebhookSecret: !!webhookSecret,
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

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    let event: Stripe.Event;

    try {
      if (!webhookSecret) {
        console.error('Stripe webhook secret not configured');
        return new Response(
          JSON.stringify({ error: 'Webhook not configured' }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      event = stripe.webhooks.constructEvent(
        body,
        signature!,
        webhookSecret
      );
      console.log('Webhook event received:', event.type);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    async function insertRevenueEntry(
      supabaseClient: ReturnType<typeof createClient>,
      session: Stripe.Checkout.Session,
      bookingId: string,
      bookingType: 'equipment' | 'studio',
      bookingNumber?: string
    ) {
      const amountCents = session.amount_total ?? 0;
      const amount = amountCents / 100;
      const currency = (session.currency || 'gbp').toLowerCase();
      const { error } = await supabaseClient.from('revenue_entries').insert({
        amount,
        currency,
        booking_id: bookingId,
        booking_type: bookingType,
        booking_number: bookingNumber || null,
        stripe_session_id: session.id,
      });
      if (error) {
        console.error('Error inserting revenue entry:', error);
      } else {
        console.log(`✅ Revenue entry recorded: £${amount.toFixed(2)} (${bookingType})`);
      }
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.booking_id;
        const bookingNumber = session.metadata?.booking_number;

        console.log('Processing checkout.session.completed for booking:', bookingId);

        const supabaseFunctionsUrl = supabaseUrl.replace('/rest/v1', '');

        if (bookingId) {
          if (bookingNumber && bookingNumber.startsWith("PSA-")) {
            // Equipment booking
            const { data: booking, error: fetchError } = await supabase
              .from("bookings")
              .select("*")
              .eq("id", bookingId)
              .single();

            if (fetchError) {
              console.error('Error fetching equipment booking:', fetchError);
            } else {
              const { error } = await supabase
                .from("bookings")
                .update({
                  status: "completed",
                })
                .eq("id", bookingId);

              if (error) {
                console.error('Error updating equipment booking:', error);
              } else {
                console.log('Equipment booking completed:', bookingNumber);

                // Record revenue for admin dashboard
                await insertRevenueEntry(supabase, session, bookingId, 'equipment', bookingNumber);

                // Insert studio items into studio_bookings so slots are blocked (no double-booking)
                const items = Array.isArray(booking.items) ? booking.items : [];
                for (const item of items) {
                  if (item.type === 'studio' && item.bookingDate && item.bookingTime) {
                    const sessionHours = Math.max(1, (item.duration || 1) * (item.quantity || 1));
                    const timeStr = String(item.bookingTime).padStart(5, '0').slice(0, 5);
                    const { error: insertError } = await supabase
                      .from('studio_bookings')
                      .insert({
                        customer_name: booking.customer_name,
                        customer_email: booking.customer_email,
                        customer_phone: booking.customer_phone || null,
                        package_name: item.name,
                        package_price: item.price,
                        booking_date: item.bookingDate,
                        booking_time: timeStr,
                        session_hours: sessionHours,
                        payment_status: 'paid',
                        booking_status: 'confirmed',
                      });

                    if (insertError) {
                      console.error('Error inserting studio slot from cart booking:', insertError);
                    } else {
                      console.log(`Studio slot blocked: ${item.bookingDate} ${timeStr} for ${sessionHours}h`);
                    }
                  }
                }

                // Send confirmation email with collection details
                try {
                  const firstName = getFirstName(booking.customer_name);
                  const itemsList = Array.isArray(booking.items) 
                    ? booking.items.map((item: any) => `${item.quantity || 1}x ${item.name} (${item.duration || booking.duration_days} day(s))`).join(', ')
                    : 'Studio booking';
                  const formattedDate = new Date(booking.booking_date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                  const hasDelivery = booking.delivery_cost && parseFloat(booking.delivery_cost) > 0;
                  const serviceName = itemsList;

                  const emailHtml = `
                    <!DOCTYPE html>
                    <html>
                    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${EMAIL_STYLES}</style></head>
                    <body>
                      <div class="container">
                        <div class="card">
                          <div class="brand">
                            <h1>Pinnacle Sound Studios & Academy</h1>
                            <p class="tagline">${TAGLINE}</p>
                          </div>
                          <div class="content">
                            <span class="badge">✓ Payment confirmed</span>
                            <p class="greeting">Hi ${firstName},</p>
                            <p class="intro">Thank you for your booking with Pinnacle Sound Studios & Academy. We're pleased to confirm that your payment has been received and your booking is now secured.</p>
                            
                            <div class="section">
                              <div class="section-title">Booking Details</div>
                              <div class="detail-row"><span class="detail-label">Service:</span><span class="detail-value">${serviceName}</span></div>
                              <div class="detail-row"><span class="detail-label">Date:</span><span class="detail-value">${formattedDate}</span></div>
                              ${booking.booking_time ? `<div class="detail-row"><span class="detail-label">Collection Time:</span><span class="detail-value">${booking.booking_time}</span></div>` : ''}
                              <div class="detail-row"><span class="detail-label">Duration:</span><span class="detail-value">${booking.duration_days} day(s)</span></div>
                              <div class="detail-row"><span class="detail-label">Location:</span><span class="detail-value">${hasDelivery ? 'Delivery to your address' : VENUE}</span></div>
                              <div class="detail-row"><span class="detail-label">Reference:</span><span class="detail-value">${booking.booking_number}</span></div>
                              ${hasDelivery ? `<div class="detail-row"><span class="detail-label">Delivery:</span><span class="detail-value">£${parseFloat(booking.delivery_cost).toFixed(2)}</span></div>` : ''}
                              <div class="detail-row"><span class="detail-label">Amount paid:</span><span class="detail-value">£${parseFloat(booking.total).toFixed(2)}</span></div>
                              ${booking.notes ? `<div class="detail-row"><span class="detail-label">Notes:</span><span class="detail-value">${booking.notes}</span></div>` : ''}
                            </div>

                            <div class="section">
                              <div class="section-title">What Happens Next</div>
                              <ul class="steps">
                                <li>Our team will prepare your equipment for collection${hasDelivery ? ' and delivery' : ''}.</li>
                                ${hasDelivery ? '<li>A member of the team may contact you to confirm delivery times, parking, and access requirements.</li>' : '<li>A member of the team may contact you to confirm access times and parking.</li>'}
                                <li>You are welcome to bring your desired instruments. Please bring this confirmation email when collecting equipment. Sessions and hire periods run strictly to the booked times.</li>
                              </ul>
                            </div>

                            <div class="notes">
                              <div class="section-title">Important Notes</div>
                              <ul>
                                <li>Any changes or cancellations must be made at least 48 hours in advance (full refund minus £5; 24–48h: 50% refund; &lt;24h: no refund).</li>
                                <li>You are responsible for safe use and return of equipment in original condition. Equipment will be inspected at collection and return.</li>
                                <li>Late returns will be charged at the standard daily rate.</li>
                              </ul>
                            </div>

                            <div class="contact">
                              Questions or need to make adjustments? Reply to this email or contact us:<br>
                              📧 <a href="mailto:${EMAIL}">${EMAIL}</a><br>
                              📞 <a href="tel:${PHONE.replace(/\s/g,'')}">${PHONE}</a>
                            </div>

                            <p class="signoff">We look forward to working with you and making your event/session a success.</p>
                            <p style="margin:0;font-weight:600;color:#f8fafc;">Best regards,<br>Pinnacle Sound Studios & Academy</p>
                          </div>
                          <div class="footer">
                            <a href="https://pinnaclessa.com">pinnaclessa.com</a> &nbsp;•&nbsp; &copy; ${new Date().getFullYear()} Pinnacle Sound Studios & Academy
                          </div>
                        </div>
                      </div>
                    </body>
                    </html>
                  `;

                  await fetch(`${supabaseFunctionsUrl}/functions/v1/send-email`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${supabaseKey}`,
                      'apikey': supabaseKey,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      to: booking.customer_email,
                      subject: 'Studio Booking Confirmed - Pinnacle Sound Studios & Academy',
                      html: emailHtml,
                    }),
                  });
                  console.log('✅ Confirmation email sent for equipment booking');
                } catch (emailError) {
                  console.error('Error sending confirmation email:', emailError);
                }
              }
            }
          } else {
            // Studio booking
            const { data: booking, error: fetchError } = await supabase
              .from("studio_bookings")
              .select("*")
              .eq("id", bookingId)
              .single();

            if (fetchError) {
              console.error('Error fetching studio booking:', fetchError);
            } else {
              const { error } = await supabase
                .from("studio_bookings")
                .update({
                  payment_status: "paid",
                  booking_status: "completed",
                  stripe_payment_intent: session.payment_intent as string,
                })
                .eq("id", bookingId);

              if (error) {
                console.error('Error updating studio booking:', error);
              } else {
                console.log('Studio booking completed:', bookingId);

                // Record revenue for admin dashboard
                await insertRevenueEntry(supabase, session, bookingId, 'studio', `STUDIO-${bookingId.substring(0, 8).toUpperCase()}`);

                // Send confirmation email with session details
                try {
                  const firstName = getFirstName(booking.customer_name);
                  const formattedDate = new Date(booking.booking_date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                  const bookingRef = `STUDIO-${booking.id.substring(0, 8).toUpperCase()}`;
                  const endTime = getEndTime(booking.booking_time || '09:00', booking.session_hours || 1);

                  const emailHtml = `
                    <!DOCTYPE html>
                    <html>
                    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${EMAIL_STYLES}</style></head>
                    <body>
                      <div class="container">
                        <div class="card">
                          <div class="brand">
                            <h1>Pinnacle Sound Studios & Academy</h1>
                            <p class="tagline">${TAGLINE}</p>
                          </div>
                          <div class="content">
                            <span class="badge">✓ Payment confirmed</span>
                            <p class="greeting">Hi ${firstName},</p>
                            <p class="intro">Thank you for your booking with Pinnacle Sound Studios & Academy. We're pleased to confirm that your payment has been received and your booking is now secured.</p>
                            
                            <div class="section">
                              <div class="section-title">Booking Details</div>
                              <div class="detail-row"><span class="detail-label">Service:</span><span class="detail-value">${booking.package_name}</span></div>
                              <div class="detail-row"><span class="detail-label">Date:</span><span class="detail-value">${formattedDate}</span></div>
                              <div class="detail-row"><span class="detail-label">Time:</span><span class="detail-value">${booking.booking_time} – ${endTime}</span></div>
                              <div class="detail-row"><span class="detail-label">Location:</span><span class="detail-value">${VENUE}</span></div>
                              <div class="detail-row"><span class="detail-label">Reference:</span><span class="detail-value">${bookingRef}</span></div>
                              <div class="detail-row"><span class="detail-label">Amount paid:</span><span class="detail-value">£${parseFloat(booking.package_price).toFixed(2)}</span></div>
                              ${booking.special_requests ? `<div class="detail-row"><span class="detail-label">Notes:</span><span class="detail-value">${booking.special_requests}</span></div>` : ''}
                            </div>

                            <div class="section">
                              <div class="section-title">What Happens Next</div>
                              <ul class="steps">
                                <li>Our team will prepare all equipment and studio resources for your session.</li>
                                <li>Please arrive <strong>15 minutes before</strong> your start time to allow for setup. Sessions run strictly to the booked times.</li>
                                <li>You are welcome to bring your desired instruments and recording media (USB/SD). Free on-site parking available.</li>
                              </ul>
                            </div>

                            <div class="notes">
                              <div class="section-title">Important Notes</div>
                              <ul>
                                <li>Any changes or cancellations must be made at least 48 hours in advance (full refund minus £5; 24–48h: 50% refund; &lt;24h: no refund).</li>
                                <li>Late arrivals may result in reduced session time.</li>
                                <li>No-shows without prior notice may be charged in full.</li>
                              </ul>
                            </div>

                            <div class="contact">
                              Questions or need to make adjustments? Reply to this email or contact us:<br>
                              📧 <a href="mailto:${EMAIL}">${EMAIL}</a><br>
                              📞 <a href="tel:${PHONE.replace(/\s/g,'')}">${PHONE}</a>
                            </div>

                            <p class="signoff">We look forward to working with you and making your session a success.</p>
                            <p style="margin:0;font-weight:600;color:#f8fafc;">Best regards,<br>Pinnacle Sound Studios & Academy</p>
                          </div>
                          <div class="footer">
                            <a href="https://pinnaclessa.com">pinnaclessa.com</a> &nbsp;•&nbsp; &copy; ${new Date().getFullYear()} Pinnacle Sound Studios & Academy
                          </div>
                        </div>
                      </div>
                    </body>
                    </html>
                  `;

                  await fetch(`${supabaseFunctionsUrl}/functions/v1/send-email`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${supabaseKey}`,
                      'apikey': supabaseKey,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      to: booking.customer_email,
                      subject: 'Booking Confirmed - Pinnacle Sound Studios & Academy',
                      html: emailHtml,
                    }),
                  });
                  console.log('✅ Confirmation email sent for studio booking');
                } catch (emailError) {
                  console.error('Error sending confirmation email:', emailError);
                }
              }
            }
          }
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.booking_id;
        const bookingNumber = session.metadata?.booking_number;

        console.log('Processing checkout.session.expired for booking:', bookingId);

        if (bookingId) {
          if (bookingNumber && bookingNumber.startsWith("PSA-")) {
            const { error } = await supabase
              .from("bookings")
              .update({
                status: "cancelled",
              })
              .eq("id", bookingId);

            if (error) console.error('Error cancelling equipment booking:', error);
          } else {
            const { error } = await supabase
              .from("studio_bookings")
              .update({
                payment_status: "failed",
                booking_status: "cancelled",
              })
              .eq("id", bookingId);

            if (error) console.error('Error cancelling studio booking:', error);
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Processing payment_intent.payment_failed:', paymentIntent.id);

        const { error } = await supabase
          .from("studio_bookings")
          .update({
            payment_status: "failed",
          })
          .eq("stripe_payment_intent", paymentIntent.id);

        if (error) console.error('Error marking payment as failed:', error);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        console.log('Processing charge.refunded for payment intent:', charge.payment_intent);

        const { error } = await supabase
          .from("studio_bookings")
          .update({
            payment_status: "refunded",
            booking_status: "cancelled",
          })
          .eq("stripe_payment_intent", charge.payment_intent as string);

        if (error) console.error('Error processing refund:', error);
        break;
      }

      default:
        console.log('Unhandled webhook event type:', event.type);
    }

    console.log('Webhook processed successfully:', event.type);
    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error('Error in stripe-webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
