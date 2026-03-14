# Resend Email Setup Guide - Step by Step

## Why Emails Aren't Sending

If emails aren't being sent, it's usually because:
1. **Resend API key not set** in Supabase
2. **Domain not verified** in Resend (can't use custom "from" addresses)
3. **Using unverified sender address**

## Quick Setup (For Testing - 5 Minutes)

### Step 1: Sign Up for Resend

1. Go to [https://resend.com](https://resend.com)
2. Click **"Sign Up"** (top right)
3. Sign up with your email (free tier includes 3,000 emails/month)
4. Verify your email address

### Step 2: Get Your API Key

1. After logging in, go to **API Keys** in the left sidebar
2. Click **"Create API Key"**
3. Give it a name (e.g., "Pinnacle SSA Production")
4. **Copy the API key immediately** - you won't be able to see it again!

### Step 3: Add API Key to Supabase

**Option A: Via Supabase Dashboard (Easiest)**

1. Go to your Supabase project dashboard
2. Click **Project Settings** (gear icon in left sidebar)
3. Click **Edge Functions** in the left menu
4. Scroll down to **Secrets**
5. Click **"Add new secret"**
6. Enter:
   - **Name:** `RESEND_API_KEY`
   - **Value:** Paste your Resend API key
7. Click **"Save"**

**Option B: Via Supabase CLI**

```bash
supabase secrets set RESEND_API_KEY=re_your_actual_api_key_here
```

### Step 4: Update Email Function (Already Done)

The email function has been updated to use `onboarding@resend.dev` as the default sender, which works without domain verification.

### Step 5: Deploy the Email Function

```bash
supabase functions deploy send-email
```

### Step 6: Test It

1. Create a test booking on your website
2. Check the Supabase logs:
   - Go to **Edge Functions** → **send-email** → **Logs**
   - Look for "✅ Email sent successfully" or error messages
3. Check your email inbox (and spam folder)

## Production Setup (With Your Own Domain)

### Step 1: Verify Your Domain in Resend

1. In Resend dashboard, go to **Domains**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `pinnaclessa.com`)
4. Click **"Add"**
5. Resend will show you DNS records to add:
   - **SPF record** (TXT)
   - **DKIM record** (TXT)
   - **DMARC record** (TXT) - optional but recommended

### Step 2: Add DNS Records

1. Go to your domain registrar (where you bought the domain)
2. Go to DNS settings
3. Add the TXT records Resend provided
4. Wait 5-10 minutes for DNS to propagate

### Step 3: Verify Domain

1. Go back to Resend dashboard → **Domains**
2. Click **"Verify"** next to your domain
3. Wait for verification (usually takes a few minutes)

### Step 4: Update Email Function

Once your domain is verified, update the default sender in `send-email/index.ts`:

```typescript
const { to, subject, html, from = 'Pinnacle SSA <noreply@yourdomain.com>' } = await req.json() as EmailRequest;
```

Replace `yourdomain.com` with your actual domain.

### Step 5: Redeploy

```bash
supabase functions deploy send-email
```

## Troubleshooting

### Check 1: Is the API Key Set?

**In Supabase Dashboard:**
1. Go to **Project Settings** → **Edge Functions** → **Secrets**
2. Verify `RESEND_API_KEY` exists and has a value

**Or via CLI:**
```bash
supabase secrets list
```

### Check 2: Check Function Logs

1. Go to Supabase Dashboard → **Edge Functions**
2. Click on **send-email**
3. Click **"Logs"** tab
4. Look for errors like:
   - `❌ RESEND_API_KEY not configured` → API key not set
   - `❌ Resend API error` → Check the error details

### Check 3: Check Resend Dashboard

1. Go to Resend dashboard → **Logs**
2. See if emails are being sent
3. Check for error messages

### Check 4: Test Email Function Directly

You can test the email function directly:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "subject": "Test Email",
    "html": "<h1>Test</h1><p>This is a test email</p>"
  }'
```

### Common Errors

#### Error: "Email service not configured"
- **Fix:** API key not set in Supabase secrets
- **Solution:** Follow Step 3 above

#### Error: "Invalid 'from' address"
- **Fix:** Using an unverified domain
- **Solution:** Use `onboarding@resend.dev` for testing, or verify your domain

#### Error: "Rate limit exceeded"
- **Fix:** Free tier limit reached (3,000 emails/month)
- **Solution:** Upgrade Resend plan or wait for next month

#### Error: "Domain not verified"
- **Fix:** Trying to use custom domain that isn't verified
- **Solution:** Verify domain in Resend dashboard (see Production Setup)

## Testing Checklist

- [ ] Resend account created
- [ ] API key generated
- [ ] API key added to Supabase secrets
- [ ] Email function deployed
- [ ] Test booking created
- [ ] Checked Supabase logs for "Email sent successfully"
- [ ] Checked email inbox (and spam folder)
- [ ] Email received with correct content

## Quick Reference

**Resend Dashboard:** https://resend.com/emails
**Supabase Secrets:** Project Settings → Edge Functions → Secrets
**Function Logs:** Edge Functions → send-email → Logs

## Next Steps After Setup

1. ✅ Test with `onboarding@resend.dev` (works immediately)
2. ✅ Verify your domain in Resend
3. ✅ Update sender address to your domain
4. ✅ Monitor email delivery in Resend dashboard
5. ✅ Set up email templates if needed

## Support

If emails still aren't sending:
1. Check Supabase Edge Function logs
2. Check Resend dashboard logs
3. Verify API key is correct
4. Test with `onboarding@resend.dev` first
5. Check spam folder
