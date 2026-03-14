import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, X-Admin-Auth',
};

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'pinnacle2024';

function verifyAdminCredentials(authHeader: string | null): boolean {
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  try {
    const base64Credentials = authHeader.slice(6);
    const credentials = atob(base64Credentials);
    const [username, password] = credentials.split(':');
    
    return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
  } catch {
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Supabase gateway requires Authorization: Bearer <anon_key> to invoke functions.
    // Admin credentials are passed via X-Admin-Auth: Basic <base64(user:pass)>.
    const authHeader = req.headers.get('X-Admin-Auth') ?? req.headers.get('Authorization');
    if (!verifyAdminCredentials(authHeader)) {
      console.error('Admin auth failed: Invalid credentials');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey
      });
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    if (req.method === 'GET' && path === 'musicians') {
      console.log('Fetching musicians...');
      const { data: musicians, error } = await supabase
        .from('musician_profiles')
        .select(`
          *,
          skills:musician_skills(skill_name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error fetching musicians:', error);
        return new Response(
          JSON.stringify({ error: `Database error: ${error.message}` }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      console.log(`Successfully fetched ${musicians?.length || 0} musicians`);
      return new Response(
        JSON.stringify({ musicians }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (req.method === 'GET' && path === 'bookings') {
      console.log('Fetching bookings...');
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error fetching bookings:', error);
        return new Response(
          JSON.stringify({ error: `Database error: ${error.message}` }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      console.log(`Successfully fetched ${bookings?.length || 0} bookings`);
      return new Response(
        JSON.stringify({ bookings }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (req.method === 'POST' && path === 'approve-musician') {
      const { musicianId } = await req.json();
      console.log('Approving musician:', musicianId);

      if (!musicianId) {
        console.error('Missing musicianId in request');
        return new Response(
          JSON.stringify({ error: 'Missing musicianId' }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      const { error } = await supabase
        .from('musician_profiles')
        .update({ is_verified: true })
        .eq('id', musicianId);

      if (error) {
        console.error('Database error approving musician:', error);
        return new Response(
          JSON.stringify({ error: `Database error: ${error.message}` }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      console.log('Successfully approved musician:', musicianId);
      return new Response(
        JSON.stringify({ success: true, message: 'Musician approved' }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (req.method === 'GET' && path === 'blocked-slots') {
      const { data: rows, error } = await supabase
        .from('blocked_slots')
        .select('blocked_date, blocked_time')
        .order('blocked_date', { ascending: true })
        .order('blocked_time', { ascending: true });

      if (error) {
        console.error('Database error fetching blocked slots:', error);
        return new Response(
          JSON.stringify({ error: `Database error: ${error.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const blockedSlots = (rows || []).map((r) => ({ date: r.blocked_date, time: r.blocked_time }));
      return new Response(
        JSON.stringify({ blockedSlots }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST' && path === 'blocked-slots') {
      const body = await req.json();
      const { date, time, block_whole_day } = body;
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return new Response(
          JSON.stringify({ error: 'Invalid date. Use YYYY-MM-DD format.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const TIMES = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];

      if (block_whole_day) {
        const rows = TIMES.map((t) => ({ blocked_date: date, blocked_time: t }));
        for (const row of rows) {
          const { error } = await supabase.from('blocked_slots').insert(row);
          if (error && error.code !== '23505') {
            console.error('Database error blocking whole day:', error);
            return new Response(
              JSON.stringify({ error: `Database error: ${error.message}` }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
        return new Response(
          JSON.stringify({ success: true, blockedSlot: { date, block_whole_day: true } }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!time || !/^\d{2}:\d{2}$/.test(time)) {
        return new Response(
          JSON.stringify({ error: 'Invalid time. Use HH:mm format (e.g. 09:00). Or set block_whole_day: true to block the whole day.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase
        .from('blocked_slots')
        .insert({ blocked_date: date, blocked_time: time });

      if (error) {
        if (error.code === '23505') {
          return new Response(
            JSON.stringify({ error: 'Slot is already blocked' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        console.error('Database error adding blocked slot:', error);
        return new Response(
          JSON.stringify({ error: `Database error: ${error.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, blockedSlot: { date, time } }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'DELETE' && path === 'blocked-slots') {
      const urlParams = new URL(req.url).searchParams;
      const date = urlParams.get('date');
      const time = urlParams.get('time');
      const body = await req.json().catch(() => ({}));
      const dateParam = date || body.date;
      const timeParam = time || body.time;
      const unblock_whole_day = urlParams.get('unblock_whole_day') === 'true' || body.unblock_whole_day === true;
      if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        return new Response(
          JSON.stringify({ error: 'Invalid date. Use YYYY-MM-DD format.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (unblock_whole_day || !timeParam) {
        const { error } = await supabase
          .from('blocked_slots')
          .delete()
          .eq('blocked_date', dateParam);
        if (error) {
          console.error('Database error removing blocked slots:', error);
          return new Response(
            JSON.stringify({ error: `Database error: ${error.message}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        return new Response(
          JSON.stringify({ success: true, unblockedSlot: { date: dateParam, unblock_whole_day: true } }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!/^\d{2}:\d{2}$/.test(timeParam)) {
        return new Response(
          JSON.stringify({ error: 'Invalid time. Use HH:mm format (e.g. 09:00).' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase
        .from('blocked_slots')
        .delete()
        .eq('blocked_date', dateParam)
        .eq('blocked_time', timeParam);

      if (error) {
        console.error('Database error removing blocked slot:', error);
        return new Response(
          JSON.stringify({ error: `Database error: ${error.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, unblockedSlot: { date: dateParam, time: timeParam } }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST' && path === 'send-confirmation-email') {
      const body = await req.json().catch(() => ({}));
      const { booking_number, session_start_time, overrides = {} } = body;
      if (!booking_number) {
        return new Response(
          JSON.stringify({ error: 'Missing booking_number' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_number', booking_number)
        .maybeSingle();

      if (fetchError || !booking) {
        return new Response(
          JSON.stringify({ error: fetchError?.message || 'Booking not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const supabaseFunctionsUrl = supabaseUrl?.replace(/\/rest\/v1.*$/, '') || supabaseUrl;
      const customerName = overrides.customer_name ?? booking.customer_name ?? '';
      const customerEmail = overrides.customer_email ?? booking.customer_email;
      const bookingDate = overrides.booking_date ?? booking.booking_date;
      const sessionTime = overrides.session_start_time ?? session_start_time ?? booking.booking_time ?? '19:45';
      const durationDays = booking.duration_days ?? 1;
      const formatBookingItems = (items: any[]) => {
        return items.map((item: any) => {
          const qty = item.quantity || 1;
          const name = item.name || 'Item';
          const isStudio = item.type === 'studio';
          const unitLabel = isStudio ? 'hour(s)' : 'day(s)';
          const unitCount = isStudio ? (item.duration || 1) : (item.duration ?? durationDays);
          return `${qty}x ${name} (${unitCount} ${unitLabel})`;
        }).join(', ');
      };
      const itemsList = overrides.service_description ?? (Array.isArray(booking.items) && booking.items.length > 0
        ? formatBookingItems(booking.items)
        : 'Studio / Rehearsal');
      const hasEquipment = Array.isArray(booking.items) && booking.items.some((i: any) => i.type !== 'studio');
      const customMessage = overrides.custom_message;

      if (!customerEmail) {
        return new Response(
          JSON.stringify({ error: 'Customer email is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const firstName = (customerName || '').trim().split(/\s+/)[0] || 'there';
      const formattedDate = bookingDate
        ? new Date(bookingDate + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        : 'TBC';

      const EMAIL_STYLES = `
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #0f1419; }
        .container { max-width: 600px; margin: 0 auto; padding: 24px; }
        .card { background: #151c2c; border-radius: 12px; overflow: hidden; border: 1px solid #2d3a4d; box-shadow: 0 4px 24px rgba(0,0,0,0.4); }
        .brand { background: linear-gradient(135deg, #151c2c 0%, #252f3f 50%, #1e2936 100%); padding: 36px 24px; text-align: center; border-bottom: 3px solid #eb3d2e; }
        .brand h1 { margin: 0; font-size: 22px; font-weight: 700; color: #eb3d2e; }
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

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${EMAIL_STYLES}</style></head>
        <body>
          <div class="container">
            <div class="card">
              <div class="brand">
                <h1>Pinnacle Sound Studios & Academy</h1>
                <p class="tagline">Sound • Lighting • Recording • Rehearsals</p>
              </div>
              <div class="content">
                <span class="badge">✓ Payment confirmed</span>
                <p class="greeting">Hi ${firstName},</p>
                <p class="intro">Thank you for your booking with Pinnacle Sound Studios & Academy. We're pleased to confirm that your payment has been received and your booking is now secured.</p>
                ${customMessage ? `<div class="section" style="background: rgba(235,61,46,0.08); border-left: 4px solid #eb3d2e; padding: 12px; border-radius: 0 8px 8px 0; margin-bottom: 20px;"><p style="margin:0;color:#f1f5f9;white-space:pre-wrap;">${String(customMessage).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</p></div>` : ''}
                <div class="section">
                  <div class="section-title">Booking Details</div>
                  <div class="detail-row"><span class="detail-label">Service:</span><span class="detail-value">${itemsList}</span></div>
                  <div class="detail-row"><span class="detail-label">Date:</span><span class="detail-value">${formattedDate}</span></div>
                  ${sessionTime ? `<div class="detail-row"><span class="detail-label">${booking.duration_days ? 'Collection time:' : 'Session starts:'}</span><span class="detail-value">${sessionTime}</span></div>` : ''}
                  ${booking.duration_days ? `<div class="detail-row"><span class="detail-label">Duration:</span><span class="detail-value">${booking.duration_days} day(s)</span></div>` : ''}
                  <div class="detail-row"><span class="detail-label">Location:</span><span class="detail-value">${(booking.delivery_cost && parseFloat(booking.delivery_cost) > 0) ? 'Delivery to your address' : 'Pinnacle SSA, Unit 4, Robinson Industrial Estate, DE23 8NL Derby'}</span></div>
                  <div class="detail-row"><span class="detail-label">Reference:</span><span class="detail-value">${booking.booking_number}</span></div>
                  ${(booking.delivery_cost && parseFloat(booking.delivery_cost) > 0) ? `<div class="detail-row"><span class="detail-label">Delivery:</span><span class="detail-value">£${parseFloat(booking.delivery_cost).toFixed(2)}</span></div>` : ''}
                  <div class="detail-row"><span class="detail-label">Amount paid:</span><span class="detail-value">£${parseFloat(booking.total || 0).toFixed(2)}</span></div>
                </div>
                <div class="section">
                  <div class="section-title">What Happens Next</div>
                  <ul class="steps">
                    ${hasEquipment
                      ? `<li>Our team will prepare your equipment for collection${(booking.delivery_cost && parseFloat(booking.delivery_cost) > 0) ? ' and delivery' : ''}.</li>
                    <li>A member of the team may contact you to confirm ${(booking.delivery_cost && parseFloat(booking.delivery_cost) > 0) ? 'delivery times, parking, and access requirements' : 'access times and parking'}.</li>
                    <li>Please bring this confirmation email when collecting equipment. Hire periods run strictly to the booked times.</li>`
                      : `<li>Our team will prepare the studio for your session.</li>
                    <li>Please arrive <strong>15 minutes before</strong> ${sessionTime || 'your session time'} to allow for setup. Sessions run strictly to the booked times.</li>
                    <li>You are welcome to bring your desired instruments. Free on-site parking available.</li>`}
                  </ul>
                </div>
                <div class="notes">
                  <div class="section-title">Important Notes</div>
                  <ul>
                    <li>Any changes or cancellations must be made at least 48 hours in advance.</li>
                    <li>Late arrivals may result in reduced session time.</li>
                  </ul>
                </div>
                <div class="contact">
                  Questions? Reply to this email or contact us:<br>
                  📧 <a href="mailto:info@pinnaclessa.co.uk">info@pinnaclessa.co.uk</a><br>
                  📞 <a href="tel:+447478760211">+44 7478760211</a>
                </div>
                <p class="signoff">We look forward to working with you.</p>
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

      try {
        const emailRes = await fetch(`${supabaseFunctionsUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: customerEmail,
            subject: 'Booking Confirmed - Pinnacle Sound Studios & Academy',
            html: emailHtml,
          }),
        });
        const emailData = await emailRes.json();
        if (!emailRes.ok) {
          console.error('Send email error:', emailData);
          return new Response(
            JSON.stringify({ error: emailData.error || 'Failed to send email' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        console.log('✅ Confirmation email sent for', booking_number);
        return new Response(
          JSON.stringify({ success: true, message: 'Confirmation email sent', emailId: emailData.emailId }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (emailErr: any) {
        console.error('Error sending confirmation email:', emailErr);
        return new Response(
          JSON.stringify({ error: emailErr.message || 'Failed to send email' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (req.method === 'POST' && path === 'reject-musician') {
      const { musicianId } = await req.json();
      console.log('Rejecting musician:', musicianId);

      if (!musicianId) {
        console.error('Missing musicianId in request');
        return new Response(
          JSON.stringify({ error: 'Missing musicianId' }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      const { error } = await supabase
        .from('musician_profiles')
        .update({ is_active: false })
        .eq('id', musicianId);

      if (error) {
        console.error('Database error rejecting musician:', error);
        return new Response(
          JSON.stringify({ error: `Database error: ${error.message}` }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      console.log('Successfully rejected musician:', musicianId);
      return new Response(
        JSON.stringify({ success: true, message: 'Musician rejected' }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Admin operations error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});