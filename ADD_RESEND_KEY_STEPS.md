# How to Add Resend API Key to Supabase - Step by Step

## Step 1: Get Your Resend API Key

1. Go to [https://resend.com](https://resend.com)
2. **Sign up** or **Log in** to your account
3. Once logged in, look at the left sidebar
4. Click on **"API Keys"**
5. Click the **"Create API Key"** button (usually at the top right)
6. Give it a name like "Pinnacle SSA" or "Production"
7. **IMPORTANT:** Copy the API key immediately - it starts with `re_` and looks like:
   ```
   re_1234567890abcdefghijklmnopqrstuvwxyz
   ```
   ⚠️ **You won't be able to see it again after closing the window!**

## Step 2: Add to Supabase Secrets

### Method 1: Via Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project (PinnacleSSA)

2. **Navigate to Project Settings**
   - Click the **gear icon** (⚙️) in the left sidebar
   - This is "Project Settings"

3. **Go to Edge Functions**
   - In the left menu under Project Settings, click **"Edge Functions"**

4. **Find Secrets Section**
   - Scroll down until you see a section called **"Secrets"**
   - You'll see a list of existing secrets (if any)

5. **Add New Secret**
   - Click the **"Add new secret"** button (or "+" button)
   - A form will appear

6. **Enter the Secret**
   - **Name field:** Type exactly: `RESEND_API_KEY`
     - Must be all caps
     - Must match exactly (no spaces, no typos)
   - **Value field:** Paste your Resend API key (the one starting with `re_`)

7. **Save**
   - Click **"Save"** or **"Add secret"**
   - You should see it appear in the secrets list

### Method 2: Via Supabase CLI (If you have it installed)

```bash
supabase secrets set RESEND_API_KEY=re_your_actual_api_key_here
```

Replace `re_your_actual_api_key_here` with your actual Resend API key.

## Step 3: Verify It's Set

1. Go back to **Project Settings** → **Edge Functions** → **Secrets**
2. You should see `RESEND_API_KEY` in the list
3. The value should be hidden (showing as dots or asterisks)

## Step 4: Deploy the Email Function

After adding the secret, you need to deploy the function:

```bash
supabase functions deploy send-email
```

Or if you're using the dashboard, the function should automatically pick up the new secret on the next invocation.

## Step 5: Test It

1. Create a test booking on your website
2. Check the logs:
   - Go to **Edge Functions** in Supabase dashboard
   - Click on **send-email** function
   - Click **"Logs"** tab
   - Look for: `✅ Email sent successfully`
3. Check your email inbox (and spam folder)

## Troubleshooting

### Can't find "Edge Functions" in Settings?
- Make sure you're in **Project Settings** (gear icon)
- Look in the left sidebar menu under Project Settings
- It might be under a submenu

### Can't find "Secrets" section?
- Scroll down in the Edge Functions page
- It's usually at the bottom of the Edge Functions settings page
- Look for a section titled "Secrets" or "Environment Variables"

### Secret not working?
- Make sure the name is exactly `RESEND_API_KEY` (all caps, no spaces)
- Make sure you copied the entire API key (starts with `re_`)
- Try removing and re-adding the secret
- Redeploy the function after adding the secret

### Still not working?
1. Check Supabase logs for errors
2. Verify the API key is correct in Resend dashboard
3. Make sure you deployed the `send-email` function after adding the secret

## Quick Checklist

- [ ] Resend account created
- [ ] API key generated in Resend dashboard
- [ ] API key copied (starts with `re_`)
- [ ] Added to Supabase: Project Settings → Edge Functions → Secrets
- [ ] Name is exactly: `RESEND_API_KEY`
- [ ] Value is your full API key
- [ ] Secret saved successfully
- [ ] Function deployed (or will be on next use)
- [ ] Tested with a booking

## Visual Guide

**Supabase Navigation Path:**
```
Dashboard → [Your Project] → ⚙️ Project Settings → Edge Functions → Secrets → Add new secret
```

**Resend Navigation Path:**
```
Dashboard → API Keys (left sidebar) → Create API Key → Copy key
```

## Need Help?

If you're still stuck:
1. Check that you're in the correct Supabase project
2. Make sure you have admin/owner access to the project
3. Try refreshing the Supabase dashboard page
4. Check if there's a "Secrets" or "Environment Variables" section elsewhere

Once the secret is added, emails should start working immediately!
