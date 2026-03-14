# Vapi Phone Number Configuration Guide

This guide shows you exactly what to fill in when configuring your imported Vonage phone number in Vapi.

## Phone Number Details Section

### 1. **Phone Number Label**
**What to put:** A descriptive name for your internal reference

**Examples:**
- `PinnacleSSA Customer Service`
- `PinnacleSSA Main Booking Line`
- `PinnacleSSA Studio Bookings`

**Current value:** `PinnacleSSA Customer Service` ✅ (This is fine, you can keep it or change it)

**Purpose:** This is just for you to identify the number in your Vapi dashboard. It doesn't affect functionality.

---

### 2. **Provider**
**What to put:** `Vonage`

**Current value:** `Vonage` ✅ (Already correct - don't change this)

**Purpose:** This identifies where the number came from. Since you imported it from Vonage, this is already set correctly.

---

## Server URL Section

### 3. **Server URL**
**What to put:** This depends on your setup:

#### **Option A: If You DON'T Need Custom Webhooks (Recommended for Basic Setup)**

**Leave this EMPTY or use a placeholder.**

For basic booking functionality using only the Supabase Edge Functions you've already configured, you typically **don't need** a Server URL. The tools you added handle everything.

**If Vapi requires a URL:**
- You can use a placeholder like: `https://placeholder.com` (won't be called)
- Or leave it empty if the field allows

#### **Option B: If You Want to Handle Call Events**

If you want to receive webhooks about call events (call started, ended, etc.) to your Next.js application:

**Value:** 
```
https://[YOUR-DEPLOYED-APP-URL]/api/vapi-webhook
```

**Example:**
```
https://pinnaclessa.com/api/vapi-webhook
```

**Note:** You would need to create a webhook handler at `app/api/vapi-webhook/route.ts` in your Next.js app to receive these events.

**For now:** Since you're using Supabase Edge Functions for all booking logic, you can **leave this empty or use a placeholder**. The tools you configured handle all the booking functionality.

---

### 4. **Timeout (seconds)**
**What to put:** `20` (or keep default)

**Current value:** `20` ✅ (This is fine)

**Range:** Must be between 1 and 300 seconds

**Purpose:** Maximum time Vapi waits for a response from your Server URL (if you set one).

**Recommendation:** Keep it at `20` seconds. This is only relevant if you set a Server URL.

---

## Most Important: Assign Your Assistant

**This is the critical step!**

1. Look for an **"Assistant"** dropdown or **"Assign Assistant"** section on the phone number page
2. Select your **"Pinnacle Booking Assistant"** (or whatever you named it)
3. This connects the phone number to your assistant with all the tools you configured

---

## Complete Configuration Checklist

For your Vonage-imported phone number:

- [x] **Phone Number Label:** `PinnacleSSA Customer Service` (or your preferred name)
- [x] **Provider:** `Vonage` (already set correctly)
- [ ] **Server URL:** 
  - **Option 1 (Recommended):** Leave empty or use placeholder `https://placeholder.com`
  - **Option 2:** Your webhook endpoint if you want call event handling
- [x] **Timeout:** `20` seconds (default is fine)
- [ ] **Assistant Assignment:** ⚠️ **MOST IMPORTANT** - Select your assistant from dropdown
- [ ] **Save:** Click the green "Save" button

---

## Quick Answer

**For basic setup (recommended):**

1. **Phone Number Label:** Keep `PinnacleSSA Customer Service` or change to your preference
2. **Provider:** `Vonage` (already correct)
3. **Server URL:** Leave empty OR use `https://placeholder.com` if field is required
4. **Timeout:** `20` (keep default)
5. **Assistant:** Select your "Pinnacle Booking Assistant" ⚠️ **CRITICAL**
6. **Save:** Click Save

---

## Important Notes

### Server URL is NOT for Supabase Edge Functions

- Your Supabase Edge Functions are already configured in the **Tools** section
- The Server URL is for **webhooks** (call events, not tool calls)
- For basic booking, you don't need a Server URL
- All booking logic happens through the tools you already added

### Assistant Assignment is Critical

- Without assigning your assistant, the phone number won't work
- Make sure you select the assistant that has all 5 tools configured
- This is the most important step!

---

## After Configuration

1. ✅ Click **"Save"** button (green button at top right)
2. ✅ Verify your assistant is assigned to the number
3. ✅ Make a test call to your number: `+44 (20) 8059 5330`
4. ✅ Test the booking flow

---

## Troubleshooting

### Phone Number Not Answering?

- Check that assistant is assigned to the number
- Verify assistant has tools configured
- Check Vapi call logs for errors

### Calls Work But Tools Don't?

- Verify tools are added to the assistant (not just the phone number)
- Check tool URLs are correct
- Verify Authorization headers are set

### Need Help?

- Check `VAPI_FINAL_STEPS_AFTER_TOOLS.md` for complete setup
- Review `VAPI_TESTING_GUIDE.md` for testing steps
- Check Vapi call logs for detailed error messages

---

You're almost done! Just assign your assistant and you're ready to test! 🎉
