# AI Assistant Capabilities Analysis

## Current Implementation Status

### ✅ Implemented Tools (Backend + API Route)

1. **`searchInventory`** ✅
   - Backend: `lib/ai-actions.ts` - `searchInventory()` function
   - API Handler: `app/api/assistant/route.ts` - case 'searchInventory'
   - Status: Fully implemented and working
   - Functionality: Searches products table by name/description

2. **`addToCart`** ✅
   - Backend: `lib/ai-actions.ts` - `addToCart()` function
   - API Handler: `app/api/assistant/route.ts` - case 'addToCart'
   - Status: Fully implemented and working
   - Functionality: Adds products to user's cart (requires auth)

3. **`fetchWebSpecs`** ✅
   - Backend: `lib/ai-actions.ts` - `fetchWebSpecs()` function
   - API Handler: `app/api/assistant/route.ts` - case 'fetchWebSpecs'
   - Status: Backend implemented, but **may not be registered in OpenAI Assistant**
   - Functionality: Fetches technical specs from Tavily API

### ❌ Missing Tools

4. **`createBundle` / `recommendBundle`** ❌
   - Backend: NOT implemented
   - API Handler: NOT implemented
   - Status: **Missing completely**
   - Required for: Bundling items for specific setups (e.g., podcasting setup)

---

## Required Capabilities vs. Implementation

| Capability | Required | Current Status | Missing |
|------------|----------|----------------|---------|
| 1. Searching Products | ✅ | ✅ `searchInventory` exists | Recommendation logic needs Assistant instructions |
| 2. Recommending Products | ✅ | ⚠️ Partial | Assistant needs better instructions on when/how to recommend |
| 3. Product Specifications | ✅ | ✅ `fetchWebSpecs` exists | **May not be registered in OpenAI Assistant** |
| 4. Bundling Items | ✅ | ❌ **MISSING** | Need to implement `recommendBundle` tool |
| 5. Adding to Cart | ✅ | ✅ `addToCart` exists | None |

---

## Issues Identified

### Issue 1: Tools Not Registered in OpenAI Assistant ⚠️
**Problem**: The tools defined in `openai_tool_definitions.json` are just reference files. The actual OpenAI Assistant needs to have these tools configured in the OpenAI dashboard or via API.

**Impact**: Even though the backend code exists, the Assistant may not know about these tools.

**Solution**: 
1. Go to https://platform.openai.com/assistants
2. Open your Assistant (ID: `asst_SibvhD1eJir6qxrECfVa2vC5`)
3. Check the "Tools" section
4. Ensure these tools are added:
   - `searchInventory`
   - `addToCart`
   - `fetchWebSpecs` (if you want web specs functionality)

### Issue 2: Missing Bundle Tool ❌
**Problem**: No tool exists for recommending/bundling items together.

**Impact**: The Assistant cannot suggest bundles like "podcasting setup" or "home studio bundle".

**Solution**: Need to implement:
1. `recommendBundle` function in `lib/ai-actions.ts`
2. Add tool handler in `app/api/assistant/route.ts`
3. Register tool in OpenAI Assistant

### Issue 3: Assistant Instructions May Be Insufficient ⚠️
**Problem**: The Assistant needs clear instructions on:
- When to use each tool
- How to recommend products
- How to suggest bundles
- How to fetch specs

**Solution**: Update Assistant instructions in OpenAI dashboard

### Issue 4: fetchWebSpecs May Not Be In Tool Definitions
**Problem**: `openai_tool_definitions.json` only has 2 tools, but `fetchWebSpecs` is implemented in backend.

**Solution**: Add `fetchWebSpecs` to tool definitions JSON

---

## Next Steps to Fix

### Step 1: Verify OpenAI Assistant Configuration (CRITICAL)
1. Go to https://platform.openai.com/assistants
2. Click on your Assistant (ID: `asst_SibvhD1eJir6qxrECfVa2vC5`)
3. Check "Tools" section - ensure these are added:
   - `searchInventory` (with proper schema)
   - `addToCart` (with proper schema)
   - `fetchWebSpecs` (with proper schema) - if missing, add it

### Step 2: Add Missing Tool Definitions
Update `openai_tool_definitions.json` to include `fetchWebSpecs` and create `recommendBundle`

### Step 3: Implement Bundle Recommendation Tool
Create a new function `recommendBundle` that can:
- Accept a setup type (e.g., "podcasting", "home studio", "live performance")
- Return a list of recommended products that work together
- Can use `searchInventory` internally or have predefined bundles

### Step 4: Update Assistant Instructions
In the OpenAI Assistant dashboard, update the "Instructions" field to include:
- How to search for products
- When to recommend products
- How to suggest bundles
- When to fetch specifications
- How to add items to cart

### Step 5: Test Each Capability
Test that the Assistant can:
1. ✅ Search products
2. ✅ Recommend products based on user needs
3. ✅ Fetch product specifications
4. ✅ Suggest bundles (after implementation)
5. ✅ Add items to cart

---

## Recommended Actions (Priority Order)

1. **URGENT**: Verify tools are registered in OpenAI Assistant dashboard
2. **HIGH**: Add `fetchWebSpecs` tool definition to OpenAI Assistant
3. **HIGH**: Implement `recommendBundle` tool
4. **MEDIUM**: Update Assistant instructions for better recommendations
5. **MEDIUM**: Add TAVILY_API_KEY to environment variables (for fetchWebSpecs)
