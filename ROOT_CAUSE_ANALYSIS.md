# Root Cause Analysis: Why AI Assistant Tools Aren't Working

## Summary

Since `fetchWebSpecs` is working but `searchInventory` and `addToCart` are not, the tool calling mechanism IS functional. The issue is likely one of these:

## Most Likely Causes (Ranked by Probability)

### 1. Tool Names Don't Match Exactly (60% probability) ⚠️

**Problem**: Tool names in OpenAI Assistant dashboard must match backend code EXACTLY (case-sensitive).

**How to Check**:
1. Go to OpenAI Assistant dashboard
2. Check the exact tool names (case-sensitive):
   - Should be: `searchInventory` (lowercase 's')
   - Should be: `addToCart` (lowercase 'a')
   - Should be: `fetchWebSpecs` (lowercase 'f')

**Common Mistakes**:
- `SearchInventory` vs `searchInventory` ❌
- `AddToCart` vs `addToCart` ❌
- `search_inventory` vs `searchInventory` ❌

**Backend Code Uses** (from route.ts line 227-267):
- `case 'searchInventory':` ✅
- `case 'addToCart':` ✅
- `case 'fetchWebSpecs':` ✅

**Fix**: Ensure tool names in OpenAI dashboard match these EXACTLY.

---

### 2. Tools Not Registered in OpenAI Assistant (30% probability) ⚠️

**Problem**: Only `fetchWebSpecs` is registered, but `searchInventory` and `addToCart` are missing.

**How to Check**:
1. Go to https://platform.openai.com/assistants
2. Open your Assistant
3. Go to "Tools" section
4. Verify ALL THREE tools are listed:
   - ✅ `searchInventory`
   - ✅ `addToCart`
   - ✅ `fetchWebSpecs`

**If tools are missing**: Add them using the schema from `openai_tool_definitions_complete.json`

---

### 3. Tool Parameter Schema Mismatch (10% probability) ⚠️

**Problem**: Tool schemas in OpenAI don't match what backend expects.

**How to Check**:
1. Compare tool schemas in OpenAI dashboard with backend code
2. Check if parameters match exactly

**Backend Expectations**:

**searchInventory**:
```typescript
const { query } = JSON.parse(args);
// Expects: { query: string }
```

**addToCart**:
```typescript
const { productId, quantity } = JSON.parse(args);
// Expects: { productId: string, quantity: number }
```

**fetchWebSpecs**:
```typescript
const { query } = JSON.parse(args);
// Expects: { query: string }
```

---

## Debugging Steps (Use Enhanced Logging)

I've added enhanced logging to the code. When you test the assistant, check your server console for these logs:

### If Tool Calls Are Detected:
```
🔧 Received requires_action event
🔧 Tool calls required: 1 tool(s)
🔧 Tool call names: ['searchInventory']
🔧 Processing 1 tool call(s)
🔧 Tool call detected: name="searchInventory", id="call_..."
🔧 Tool arguments (raw): {"query":"microphones"}
✅ Executing searchInventory tool
✅ Parsed query: "microphones"
✅ Found 5 products
✅ Tool searchInventory completed successfully
```

### If Tool Name Doesn't Match:
```
🔧 Received requires_action event
🔧 Tool calls required: 1 tool(s)
🔧 Tool call names: ['SearchInventory']  ← WRONG CASE!
🔧 Processing 1 tool call(s)
🔧 Tool call detected: name="SearchInventory", id="call_..."
❌ Unknown tool name: "SearchInventory"
❌ Available tools: searchInventory, addToCart, fetchWebSpecs
```

### If Tool Isn't Being Called At All:
```
(No "🔧 Received requires_action event" log appears)
```

This means the Assistant isn't deciding to use the tool.

---

## Quick Fix Checklist

1. **Verify Tool Names Match EXACTLY** (case-sensitive)
   - [ ] OpenAI Dashboard: `searchInventory` (lowercase 's')
   - [ ] OpenAI Dashboard: `addToCart` (lowercase 'a')
   - [ ] OpenAI Dashboard: `fetchWebSpecs` (lowercase 'f')

2. **Verify All Tools Are Registered**
   - [ ] All 3 tools appear in OpenAI Assistant "Tools" section
   - [ ] Tool schemas match `openai_tool_definitions_complete.json`

3. **Test and Check Logs**
   - [ ] Ask: "search for microphones"
   - [ ] Check server console for logs
   - [ ] Look for "🔧 Tool call detected" messages
   - [ ] Look for "❌ Unknown tool name" errors

4. **Compare Working vs Non-Working**
   - [ ] `fetchWebSpecs` works - check its exact name in OpenAI
   - [ ] Compare with `searchInventory` and `addToCart` names
   - [ ] Ensure they match backend code exactly

---

## Expected Behavior

When working correctly, you should see:

1. User asks: "search for microphones"
2. Server logs:
   ```
   🔧 Received requires_action event
   🔧 Tool call detected: name="searchInventory"
   ✅ Executing searchInventory tool
   ✅ Found X products
   ```
3. Assistant responds with product list

If you see "❌ Unknown tool name", the name doesn't match.
If you see no tool call logs, the tool isn't registered or Assistant isn't using it.
