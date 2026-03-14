# Debugging Tool Call Issues

## The Problem

The user reports that `fetchWebSpecs` is working, but other tools (`searchInventory`, `addToCart`) are not "talking to the backend."

## Critical Discovery: OpenAI Assistant API Tool Calling Mechanism

**IMPORTANT**: The OpenAI Assistant API does NOT automatically call your backend. Here's how it actually works:

1. **Assistant Configuration**: Tools are defined in the OpenAI Assistant dashboard
2. **Assistant Decides**: When the Assistant wants to use a tool, it returns a `requires_action` status
3. **Your Backend Detects**: Your code (in `route.ts`) listens for `thread.run.requires_action` events
4. **Your Backend Executes**: Your code calls your functions (`searchInventory`, `addToCart`, etc.)
5. **Your Backend Submits**: Your code sends the results back to OpenAI via `submit_tool_outputs`

## Why fetchWebSpecs Works But Others Don't

If `fetchWebSpecs` is working, it means:
- ✅ Tool calling mechanism is working
- ✅ Event detection is working (`thread.run.requires_action`)
- ✅ Tool output submission is working

But if `searchInventory` and `addToCart` don't work, possible causes:

### 1. Tool Names Don't Match (Case-Sensitive)
- OpenAI Dashboard: `SearchInventory` (capital S)
- Backend Code: `case 'searchInventory':` (lowercase s)
- **Mismatch = Tool call detected but switch case fails**

### 2. Tool Schemas Don't Match
- OpenAI Dashboard: Parameters defined differently
- Backend Code: Expects different parameter structure
- **Mismatch = JSON.parse fails or wrong parameters**

### 3. Tool Not Registered in OpenAI Dashboard
- Only `fetchWebSpecs` is registered
- `searchInventory` and `addToCart` are missing
- **Missing = Assistant never calls them**

## Debugging Steps

### Step 1: Check Console Logs
Look for these log messages in your server console:

```
Processing tool calls - threadId: ..., runId: ...
Error executing tool searchInventory: ...
Error executing tool addToCart: ...
```

### Step 2: Verify Tool Names Match Exactly

Check that tool names in OpenAI Dashboard match backend code EXACTLY:

**Backend Code (route.ts line 226-267):**
- `case 'searchInventory':` 
- `case 'addToCart':`
- `case 'fetchWebSpecs':`

**Must match OpenAI Dashboard tool names EXACTLY (case-sensitive)**

### Step 3: Check Tool Call Detection

Look for this log message:
```
Processing tool calls - threadId: ..., runId: ...
```

If you see this, tool calls ARE being detected. If not, tools aren't being called by the Assistant.

### Step 4: Check for Errors in Tool Execution

Look for:
```
Error executing tool [toolName]: ...
```

This indicates the tool was called but failed during execution.

### Step 5: Test Tool Calling Directly

Add console.log statements to see what's happening:

```typescript
case 'searchInventory': {
  console.log('🔍 searchInventory called with args:', args);
  const { query } = JSON.parse(args);
  console.log('🔍 Parsed query:', query);
  const products = await searchInventory(query);
  console.log('🔍 Found products:', products.length);
  // ...
}
```

## Most Likely Issues

### Issue 1: Tool Names Mismatch (50% probability)
- Check OpenAI dashboard - tool names must match EXACTLY
- Common mistake: `SearchInventory` vs `searchInventory`

### Issue 2: Tools Not Registered (30% probability)
- Only `fetchWebSpecs` is registered
- `searchInventory` and `addToCart` missing from dashboard

### Issue 3: Parameter Schema Mismatch (20% probability)
- Tool schema in OpenAI doesn't match what backend expects
- JSON.parse fails or returns wrong structure

## Quick Fix Checklist

- [ ] Open OpenAI Assistant Dashboard
- [ ] Verify ALL THREE tools are listed:
  - `searchInventory` (exact case)
  - `addToCart` (exact case)  
  - `fetchWebSpecs` (exact case)
- [ ] Verify tool names match backend code EXACTLY
- [ ] Check server console logs for errors
- [ ] Test by asking: "search for microphones"
- [ ] Check if "Processing tool calls" log appears
- [ ] Check if tool-specific logs appear
