# How to Fix: AI Assistant Tools Not Calling Backend

## The Core Issue

Since `fetchWebSpecs` is working, your backend code and tool calling mechanism ARE working correctly. The problem is that `searchInventory` and `addToCart` either:

1. **Aren't registered in OpenAI Assistant** (most likely)
2. **Have wrong tool names** (case-sensitive mismatch)
3. **Aren't being called by the Assistant** (instructions issue)

---

## Step 1: Verify Tool Registration in OpenAI Dashboard ⚠️ CRITICAL

1. Go to https://platform.openai.com/assistants
2. Open your Assistant (ID: `asst_SibvhD1eJir6qxrECfVa2vC5`)
3. Click on the "Tools" section
4. **Verify ALL THREE tools are listed:**
   - `searchInventory`
   - `addToCart`
   - `fetchWebSpecs`

**If any are missing, add them now!**

Copy the tool definitions from `openai_tool_definitions_complete.json`.

---

## Step 2: Verify Tool Names Match EXACTLY (Case-Sensitive)

Tool names must match EXACTLY between OpenAI dashboard and your backend code.

**Your Backend Code Uses** (from `app/api/assistant/route.ts`):
- ✅ `searchInventory` (lowercase 's')
- ✅ `addToCart` (lowercase 'a')
- ✅ `fetchWebSpecs` (lowercase 'f')

**Check in OpenAI Dashboard:**
- Tool names must match these EXACTLY (case-sensitive)
- Common mistakes:
  - `SearchInventory` ❌ (wrong - capital S)
  - `search_inventory` ❌ (wrong - uses underscore)
  - `searchInventory` ✅ (correct)

---

## Step 3: Test with Enhanced Logging

I've added detailed logging to your code. When you test:

1. **Start your development server**: `npm run dev`
2. **Open the browser console** (F12 → Console tab)
3. **Check your terminal/console** where the server is running
4. **Ask the assistant**: "search for microphones"
5. **Look for these logs in your server console:**

### If Tool Is Working:
```
🔧 Received requires_action event
🔧 Tool calls required: 1 tool(s)
🔧 Tool call names: ['searchInventory']
🔧 Processing 1 tool call(s)
🔧 Tool call detected: name="searchInventory", id="call_..."
✅ Executing searchInventory tool
✅ Parsed query: "microphones"
✅ Found X products
✅ Tool searchInventory completed successfully
```

### If Tool Name Doesn't Match:
```
🔧 Tool call detected: name="SearchInventory", id="call_..."  ← WRONG CASE
❌ Unknown tool name: "SearchInventory"
❌ Available tools: searchInventory, addToCart, fetchWebSpecs
```

### If Tool Isn't Registered/Being Called:
```
(No tool call logs appear - the Assistant just responds without using tools)
```

---

## Step 4: Compare Working Tool with Non-Working Tools

Since `fetchWebSpecs` works:

1. **Check `fetchWebSpecs` in OpenAI Dashboard:**
   - What is the EXACT tool name? (case-sensitive)
   - Copy it exactly

2. **Check `searchInventory` in OpenAI Dashboard:**
   - Does the name match `fetchWebSpecs` format? (camelCase)
   - Is it exactly `searchInventory` (lowercase 's')?

3. **Compare the tool schemas:**
   - Are they defined similarly?
   - Do they use the same structure?

---

## Step 5: Verify Tool Schemas Match

Open each tool in OpenAI Dashboard and verify:

### searchInventory Schema Should Be:
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "The search query to find products..."
    }
  },
  "required": ["query"]
}
```

### addToCart Schema Should Be:
```json
{
  "type": "object",
  "properties": {
    "productId": {
      "type": "string",
      "description": "The UUID of the product..."
    },
    "quantity": {
      "type": "integer",
      "description": "The quantity of items...",
      "minimum": 1
    }
  },
  "required": ["productId", "quantity"]
}
```

---

## Most Common Fix

**90% of the time, the issue is:**

1. Tools aren't registered in OpenAI Assistant dashboard
   - **Fix**: Add the missing tools using `openai_tool_definitions_complete.json`

2. Tool names have wrong case
   - **Fix**: Change `SearchInventory` to `searchInventory` (or vice versa to match backend)

---

## Quick Test

After making changes:

1. Ask: "search for microphones"
2. Check server logs for tool call messages
3. If you see "❌ Unknown tool name", fix the tool name case
4. If you see no tool call logs, the tool isn't registered or Assistant isn't using it

---

## Still Not Working?

If tools are registered correctly and names match, check:

1. **Assistant Instructions**: Does the Assistant know WHEN to use each tool?
   - Add instructions like: "Use searchInventory when customers ask about products"

2. **Server Logs**: Check for any errors that might prevent tool execution

3. **Test `fetchWebSpecs` again**: If it stops working, something changed in OpenAI configuration
