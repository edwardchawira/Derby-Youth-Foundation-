# Email System Setup Guide

## Overview
This system sends automated emails to customers at two key points in the booking process:

1. **Booking Confirmation Email** (with payment link) - Sent when booking is created
2. **Payment Confirmation Email** (with collection/session details) - Sent after payment is completed

## Components Created

### 1. Email Service Function
**File:** `supabase/functions/send-email/index.ts`

This is a reusable Edge Function that handles sending emails using the Resend API.

### 2. Updated Functions

#### `create-checkout-session` (Studio Bookings)
- Sends email with payment link when studio booking is created
- Email includes: booking details, payment button, 24-hour reminder

#### `create-equipment-checkout` (Equipment Rentals)
- Sends email with payment link when equipment booking is created
- Email includes: booking details, equipment list, payment button, 24-hour reminder

#### `stripe-webhook` (Payment Processing)
- Changes booking status to "completed" after successful payment
- Sends confirmation email with:
  - **Studio bookings:** Session time, date, arrival instructions
  - **Equipment bookings:** Collection time, equipment list, collection instructions

## Setup Instructions

### 1. Get Resend API Key

1. Sign up at [Resend.com](https://resend.com) (free tier available)
2. Create an API key in the Resend dashboard
3. Add it to your Supabase project:

**In Supabase Dashboard:**
- Go to Project Settings → Edge Functions → Secrets
- Add secret: `RESEND_API_KEY` = `your-resend-api-key`

**Or via CLI:**
```bash
supabase secrets set RESEND_API_KEY=your-resend-api-key
```

### 2. Verify Domain (Optional but Recommended)

For production:
1. In Resend dashboard, go to Domains
2. Add your domain (e.g., `pinnaclessa.com`)
3. Add the DNS records provided by Resend
4. Update the `from` field in `send-email/index.ts` to use your verified domain

For testing, you can use Resend's default sender address or update the `from` field to match your verified domain.

### 3. Deploy Functions

Deploy all updated functions to Supabase:

```bash
# Deploy email service
supabase functions deploy send-email

# Deploy updated checkout functions
supabase functions deploy create-checkout-session
supabase functions deploy create-equipment-checkout

# Deploy updated webhook
supabase functions deploy stripe-webhook
```

### 4. Update Environment Variables

Make sure these are set in Supabase:
- `RESEND_API_KEY` - Your Resend API key
- `SUPABASE_URL` - Your Supabase project URL (automatically available)
- `SUPABASE_SERVICE_ROLE_KEY` - Your service role key (automatically available)
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret

## Email Flow

### Studio Bookings

1. **Customer creates booking** → Booking created with status "pending"
   - **Email sent:** "Complete Your Studio Booking Payment"
   - Contains: Booking details, payment link

2. **Customer completes payment** → Stripe webhook triggered
   - **Status updated:** `booking_status` = "completed", `payment_status` = "paid"
   - **Email sent:** "Studio Session Confirmed"
   - Contains: Session details, arrival time, location info

### Equipment Rentals

1. **Customer creates booking** → Booking created with status "pending"
   - **Email sent:** "Complete Your Equipment Booking Payment"
   - Contains: Booking details, equipment list, payment link

2. **Customer completes payment** → Stripe webhook triggered
   - **Status updated:** `status` = "completed"
   - **Email sent:** "Equipment Booking Confirmed"
   - Contains: Collection time, equipment list, collection instructions

## Email Templates

All emails use HTML templates with:
- Responsive design
- Branded header (Pinnacle SSA colors)
- Clear booking details
- Call-to-action buttons (for payment emails)
- Professional footer with contact information

### Customization

To customize email templates, edit the `html` strings in:
- `create-checkout-session/index.ts` (studio payment email)
- `create-equipment-checkout/index.ts` (equipment payment email)
- `stripe-webhook/index.ts` (confirmation emails after payment)

## Testing

### Test Payment Link Email

1. Create a test booking through the website
2. Check customer email inbox for payment link email
3. Verify all booking details are correct
4. Click payment link to test Stripe checkout

### Test Confirmation Email

1. Complete a test payment
2. Check customer email inbox for confirmation email
3. Verify booking status is "completed" in database
4. Verify all session/collection details are correct

### Testing with Stripe Test Mode

1. Use Stripe test cards (e.g., `4242 4242 4242 4242`)
2. Complete a test payment
3. Verify webhook receives the event
4. Check Supabase logs for email sending confirmation
5. Verify emails are received

## Troubleshooting

### Emails Not Sending

1. **Check Resend API Key:**
   ```bash
   supabase secrets list
   ```
   Verify `RESEND_API_KEY` is set

2. **Check Function Logs:**
   - Go to Supabase Dashboard → Edge Functions → Logs
   - Look for errors in `send-email` function
   - Check for "Email sent successfully" messages

3. **Verify Resend Account:**
   - Check Resend dashboard for API usage
   - Verify you haven't exceeded free tier limits
   - Check email delivery status in Resend dashboard

### Booking Status Not Updating

1. **Check Webhook Logs:**
   - Go to Supabase Dashboard → Edge Functions → Logs
   - Look for `stripe-webhook` function logs
   - Verify webhook is receiving `checkout.session.completed` events

2. **Verify Stripe Webhook Configuration:**
   - Webhook endpoint should point to: `https://your-project.supabase.co/functions/v1/stripe-webhook`
   - Webhook should listen for: `checkout.session.completed`
   - Webhook secret must match `STRIPE_WEBHOOK_SECRET`

### Email Formatting Issues

- Emails use inline CSS for maximum compatibility
- Test in multiple email clients (Gmail, Outlook, Apple Mail)
- Use Resend's email preview feature before sending

## Status Changes Summary

### Before
- Studio bookings: `booking_status` = "confirmed" after payment
- Equipment bookings: `status` = "confirmed" after payment

### After
- Studio bookings: `booking_status` = "completed", `payment_status` = "paid" after payment
- Equipment bookings: `status` = "completed" after payment

This change ensures customers know their booking is fully processed and ready.

## Support

If you encounter issues:
1. Check Supabase Edge Function logs
2. Check Resend dashboard for delivery status
3. Verify all environment variables are set correctly
4. Test with Stripe test mode first

For questions or issues, check the function logs or Resend delivery reports.
