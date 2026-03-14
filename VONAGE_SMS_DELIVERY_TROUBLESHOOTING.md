# Vonage SMS Delivery Troubleshooting

## Issue: SMS Shows "Successful and Queued" but Not Arriving

If Vonage dashboard shows messages as "successful and queued" but they're not arriving on your phone, this is a **delivery issue**, not a workflow issue.

---

## Troubleshooting Steps

### 1. Check Phone Number Format

**Your phone number:** `07361971592` (UK format)

**For Vonage, it should be:**
- International format: `447361971592` (no +, no spaces, no leading 0)
- NOT: `+447361971592`
- NOT: `07361971592`
- NOT: `447361971592` with spaces

**Verify in Vonage:**
1. Go to: https://dashboard.nexmo.com/
2. Check the "To" field in your message logs
3. Ensure it's exactly: `447361971592`

---

### 2. Check Vonage Message Logs

1. **Go to Vonage Dashboard:** https://dashboard.nexmo.com/
2. **Navigate to:** Messages or SMS Logs
3. **Find your message** to `447361971592`
4. **Check the status:**
   - ✅ **Delivered** = Message reached the carrier
   - ⏳ **Queued** = Waiting to be sent
   - ⚠️ **Accepted** = Vonage accepted it, but not yet delivered
   - ❌ **Failed** = Check error code

5. **Check error codes:**
   - `1` = Unknown error
   - `2` = Absent subscriber
   - `3` = Service unavailable
   - `4` = Unidentified subscriber
   - `5` = Absent subscriber (temporary)
   - `6` = Absent subscriber (permanent)
   - `7` = Number barred
   - `8` = Operator barred
   - `9` = Routing error
   - `10` = Invalid number
   - `11` = Unroutable
   - `12` = Destination not allowed
   - `13` = Sender ID not allowed
   - `14` = Invalid sender address
   - `15` = Invalid TON
   - `16` = Invalid NPI
   - `17` = Unroutable (cancel)
   - `19` = Invalid destination network
   - `20` = Invalid destination number format
   - `23` = Network congestion
   - `24` = Destination not allowed
   - `25` = Number ported
   - `26` = Number not ported
   - `27` = Invalid source address
   - `28` = Invalid source network
   - `29` = Invalid destination
   - `30` = Rejected by operator
   - `31` = Unknown error
   - `32` = Number barred
   - `33` = Spam detected
   - `34` = Duplicate message
   - `35` = Invalid message content
   - `36` = Invalid message encoding
   - `37` = Invalid message length
   - `38` = Invalid message type
   - `39` = Invalid message format
   - `40` = Invalid message content
   - `41` = Invalid message encoding
   - `42` = Invalid message length
   - `43` = Invalid message type
   - `44` = Invalid message format
   - `45` = Invalid message content
   - `46` = Invalid message encoding
   - `47` = Invalid message length
   - `48` = Invalid message type
   - `49` = Invalid message format
   - `50` = Invalid message content

---

### 3. Check Your Phone Settings

**Common phone issues:**

1. **Blocked Numbers:**
   - Check if you've blocked the sender number
   - Settings → Blocked Numbers (on iPhone)
   - Settings → Blocked Contacts (on Android)

2. **Spam/Junk Folder:**
   - Check your spam or junk SMS folder
   - Some phones have a separate spam folder

3. **Do Not Disturb:**
   - Check if Do Not Disturb is enabled
   - This might filter SMS messages

4. **Carrier Blocking:**
   - Some carriers block automated SMS
   - Contact your carrier (EE, O2, Vodafone, Three, etc.)
   - Ask if they're blocking messages from Vonage

5. **Network Issues:**
   - Ensure you have good signal
   - Try turning airplane mode on/off
   - Restart your phone

---

### 4. Test with Different Phone Number

**Try sending to a different phone number:**
1. Use another phone (friend/family)
2. Send test SMS to that number
3. If it works, the issue is with your specific number
4. If it doesn't work, the issue is with Vonage configuration

---

### 5. Check Vonage Account Settings

1. **Go to:** https://dashboard.nexmo.com/settings
2. **Check:**
   - Account status (not suspended)
   - SMS sending enabled
   - No restrictions on your account
   - Credits/balance available

3. **Check Sender ID:**
   - Go to: https://dashboard.nexmo.com/settings/sender-ids
   - Verify your sender ID is approved
   - Or use a Vonage number instead

---

### 6. Verify Phone Number is Correct

**Test the number format:**
- Your number: `07361971592` (UK mobile)
- International: `+447361971592`
- For Vonage: `447361971592` (no +, no spaces)

**Verify in Vonage:**
- Try sending to: `447361971592`
- Also try: `447361971592` (double-check no typos)

---

### 7. Check Carrier-Specific Issues

**UK Carriers:**
- **EE:** May block automated SMS
- **O2:** May require opt-in
- **Vodafone:** May filter automated messages
- **Three:** May block certain sender IDs

**Solution:**
- Contact your carrier
- Ask about SMS filtering/blocking
- Request to whitelist Vonage numbers

---

### 8. Test with Different Sender ID

**Try using a Vonage phone number instead of sender ID:**
1. Get your Vonage number from dashboard
2. Use that number in the "From" field
3. Some carriers prefer phone numbers over alphanumeric sender IDs

---

## Quick Diagnostic Checklist

- [ ] Phone number format is correct: `447361971592`
- [ ] Vonage shows message as "Queued" or "Accepted"
- [ ] Checked phone spam/junk folder
- [ ] Phone is not in Do Not Disturb mode
- [ ] No blocked numbers on phone
- [ ] Good network signal
- [ ] Tried different phone number (if available)
- [ ] Checked Vonage account status
- [ ] Verified sender ID is approved
- [ ] Contacted carrier about SMS filtering

---

## Next Steps

1. **Check Vonage dashboard** for specific error codes
2. **Contact your mobile carrier** (EE, O2, Vodafone, Three) about SMS filtering
3. **Try a different phone number** to isolate the issue
4. **Use a Vonage phone number** instead of sender ID in the "From" field

---

## If Still Not Working

**Contact Vonage Support:**
- Email: support@vonage.com
- Provide:
  - Your Vonage account details
  - Message ID from dashboard
  - Phone number: `447361971592`
  - Error code (if any)
  - Screenshot of message status

**Contact Your Mobile Carrier:**
- Explain you're not receiving SMS from a business service
- Ask if they're blocking automated SMS
- Request to whitelist Vonage numbers

---

**The workflow is likely working correctly - the issue is SMS delivery to your phone.**
