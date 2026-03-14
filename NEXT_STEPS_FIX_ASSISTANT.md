# Next Steps to Fix AI Assistant Capabilities

## 🚨 CRITICAL: Step 1 - Register Tools in OpenAI Assistant Dashboard

**This is the most important step!** Your backend code exists, but the OpenAI Assistant needs to know about these tools.

### Action Items:

1. **Go to OpenAI Assistant Dashboard**
   - Visit: https://platform.openai.com/assistants
   - Find your Assistant (ID: `asst_SibvhD1eJir6qxrECfVa2vC5`)
   - Click to edit it

2. **Add Tools**
   - Go to the "Tools" section
   - Click "Add Tool" → "Function"
   - Add these THREE tools (copy from `openai_tool_definitions_complete.json`):

   **Tool 1: searchInventory**
   ```json
   {
     "type": "function",
     "function": {
       "name": "searchInventory",
       "description": "Search the products inventory for items matching a query. Searches both product names and descriptions. Returns an array of products with details including id, name, description, price, technical specifications, and YouTube URL. Use this to help customers find products based on their needs, preferences, or requirements.",
       "parameters": {
         "type": "object",
         "properties": {
           "query": {
             "type": "string",
             "description": "The search query to find products. Can be a product name, keyword, category, or description. Examples: 'microphone', 'audio interface', 'speakers', 'studio monitors', 'podcasting equipment', 'condenser mic'"
           }
         },
         "required": ["query"]
       }
     }
   }
   ```

   **Tool 2: addToCart**
   ```json
   {
     "type": "function",
     "function": {
       "name": "addToCart",
       "description": "Add a product to the user's shopping cart. Requires the user to be authenticated. If the item already exists in the cart, the quantity will be updated. Returns success status and a message. Use this when the customer wants to purchase a product.",
       "parameters": {
         "type": "object",
         "properties": {
           "productId": {
             "type": "string",
             "description": "The UUID of the product to add to cart. This is the product ID returned from searchInventory."
           },
           "quantity": {
             "type": "integer",
             "description": "The quantity of items to add to the cart. Must be a positive integer.",
             "minimum": 1
           }
         },
         "required": ["productId", "quantity"]
       }
     }
   }
   ```

   **Tool 3: fetchWebSpecs**
   ```json
   {
     "type": "function",
     "function": {
       "name": "fetchWebSpecs",
       "description": "Fetch technical specifications and detailed information about a product from trusted online sources. Use this when you need more detailed technical specs, compatibility information, release dates, or specifications that may not be in the local database. Returns top 3-5 search results with technical information.",
       "parameters": {
         "type": "object",
         "properties": {
           "query": {
             "type": "string",
             "description": "The search query for technical specifications. Should include the product name and what specs you're looking for. Examples: 'Shure SM7B microphone specifications', 'Focusrite Scarlett 2i2 compatibility', 'Yamaha HS8 studio monitor technical specs'"
           }
         },
         "required": ["query"]
       }
     }
   }
   ```

3. **Update Assistant Instructions**
   - In the "Instructions" field, add:
   ```
   You are a helpful sales assistant for Pinnacle, a professional audio gear and music services store.

   Your capabilities:
   1. SEARCHING PRODUCTS: Use searchInventory to find products in our inventory. You can search by product name, category, brand, or description.
   2. RECOMMENDING PRODUCTS: After searching, analyze the results and recommend the best products based on the customer's needs, budget, and requirements.
   3. PRODUCT SPECIFICATIONS: Use fetchWebSpecs to get detailed technical specifications when needed, especially for compatibility questions or detailed specs not in our database.
   4. ADDING TO CART: Use addToCart when customers want to purchase items. Always confirm the product and quantity before adding.

   Guidelines:
   - Always search first before recommending
   - Provide helpful comparisons when multiple products match
   - Ask clarifying questions if the customer's needs are unclear
   - When suggesting products, mention key features, price, and why it fits their needs
   - For technical questions, use fetchWebSpecs to get accurate information
   - Always confirm before adding items to cart
   ```

4. **Save the Assistant**

---

## ⚠️ Step 2 - Add TAVILY_API_KEY (For fetchWebSpecs)

The `fetchWebSpecs` tool requires Tavily API key to work properly.

1. Get Tavily API Key: https://tavily.com
2. Add to Vercel Environment Variables:
   - Variable name: `TAVILY_API_KEY`
   - Value: Your Tavily API key
   - Environments: Production, Preview, Development
3. Redeploy your application

---

## ❌ Step 3 - Implement Bundle Recommendation Tool (Future Enhancement)

Currently missing - would require:
1. Creating `recommendBundle` function in `lib/ai-actions.ts`
2. Adding handler in `app/api/assistant/route.ts`
3. Registering in OpenAI Assistant

**Note**: For now, the Assistant can use `searchInventory` multiple times to find products for a setup, but a dedicated bundle tool would be better.

---

## ✅ Current Status Summary

| Capability | Backend Code | OpenAI Tool Registered | Status |
|------------|--------------|------------------------|--------|
| Search Products | ✅ | ⚠️ Needs verification | Needs Step 1 |
| Recommend Products | ✅ (via instructions) | ⚠️ Needs verification | Needs Step 1 + Instructions |
| Product Specifications | ✅ | ❌ Missing | Needs Step 1 + Step 2 |
| Bundle Items | ❌ | ❌ | Future enhancement |
| Add to Cart | ✅ | ⚠️ Needs verification | Needs Step 1 |

---

## Quick Checklist

- [ ] Step 1: Register all 3 tools in OpenAI Assistant dashboard
- [ ] Step 1: Update Assistant instructions
- [ ] Step 2: Add TAVILY_API_KEY to Vercel
- [ ] Step 2: Redeploy application
- [ ] Test: Try searching for products
- [ ] Test: Try asking for specifications
- [ ] Test: Try adding items to cart
- [ ] (Future) Step 3: Implement bundle recommendation
