# New MCP Servers Setup Guide

## ✅ Installed MCP Servers

### 1. Supabase MCP
- **Package**: `@supabase/mcp-server-supabase` (v0.6.1)
- **Purpose**: Interact with Supabase projects - query data, manage schema, run migrations, generate TypeScript types
- **API Key Required**: Yes (Supabase Personal Access Token)

### 2. shadcn Registry MCP
- **Package**: `shadcn-mcp` (v1.0.0)
- **Purpose**: Browse, search, and install shadcn/ui components via natural language
- **API Key Required**: No (uses your existing `components.json`)

### 3. Postman MCP
- **Package**: `@postman/postman-mcp-server` (v2.5.4)
- **Purpose**: Manage Postman collections, workspaces, specs, environments, and API workflows
- **API Key Required**: Yes (Postman API Key)

---

## 🔑 Getting API Keys

### Supabase Access Token (Required)

1. **Visit**: https://supabase.com/dashboard/account/tokens
2. **Sign in** to your Supabase account
3. **Generate a new Personal Access Token**:
   - Click "Generate new token"
   - Give it a name (e.g., "Cursor MCP")
   - Copy the token (you won't see it again!)
4. **Get your Project Reference ID**:
   - Go to your Supabase project dashboard
   - Settings → General
   - Copy the "Reference ID" (looks like: `abcdefghijklmnop`)

5. **Update `mcp.json`**:
   - Replace `YOUR_SUPABASE_ACCESS_TOKEN_HERE` with your token
   - Replace `YOUR_PROJECT_REF_HERE` with your project reference ID

### Postman API Key (Required)

1. **Visit**: https://www.postman.com/settings/me/api-keys
2. **Sign in** to your Postman account
3. **Generate API Key**:
   - Click "Generate API Key"
   - Give it a name (e.g., "Cursor MCP")
   - Copy the API key
4. **Update `mcp.json`**:
   - Replace `YOUR_POSTMAN_API_KEY_HERE` with your API key

---

## 📝 Configuration File Location

Your MCP configuration is located at:
```
C:\Users\masha\.cursor\mcp.json
```

Current configuration includes:
- ✅ mcp-n8n
- ✅ context7
- ✅ brave-search
- ✅ supabase (needs API key + project ref)
- ✅ shadcn (ready to use!)
- ✅ postman (needs API key)

---

## 🔧 Next Steps

### 1. Add Your API Keys

Open `C:\Users\masha\.cursor\mcp.json` and replace:
- `YOUR_SUPABASE_ACCESS_TOKEN_HERE` → Your Supabase Personal Access Token
- `YOUR_PROJECT_REF_HERE` → Your Supabase Project Reference ID
- `YOUR_POSTMAN_API_KEY_HERE` → Your Postman API Key

### 2. Restart Cursor

1. Close all Cursor windows completely
2. Reopen Cursor
3. Wait for MCP servers to connect
4. Check Settings → MCP Servers - all should show green

### 3. Verify Connection

After restarting, you can test each server:

**Test Supabase:**
- Ask Cursor: "List my Supabase tables" or "Show me the schema for my users table"
- Cursor should be able to query your Supabase database

**Test shadcn:**
- Ask Cursor: "Show me available shadcn components" or "Add a button component"
- Cursor can browse and install components from the registry

**Test Postman:**
- Ask Cursor: "List my Postman collections" or "Show me my API environments"
- Cursor can manage your Postman resources

---

## 🎯 What Each Server Can Do

### Supabase MCP
- ✅ Query database tables
- ✅ View and manage database schema
- ✅ Generate TypeScript types from schema
- ✅ Run SQL queries
- ✅ Manage migrations
- ✅ View project settings

### shadcn Registry MCP
- ✅ Browse available components
- ✅ Search components by name/description
- ✅ Install components to your project
- ✅ View component documentation
- ✅ Works with your existing `components.json` config

### Postman MCP
- ✅ List collections, workspaces, environments
- ✅ Create and manage API collections
- ✅ Update environment variables
- ✅ View and manage API specs
- ✅ Execute API requests
- ✅ Manage monitors and tests

---

## ❓ Troubleshooting

### Server shows red in Cursor:

1. **Check API keys are correct** (no extra spaces, copied completely)
2. **Verify you have internet connection**
3. **Check Cursor logs** for error messages
4. **Try running the package manually**:
   ```powershell
   npx -y @supabase/mcp-server-supabase@latest
   npx -y shadcn-mcp
   npx -y @postman/postman-mcp-server --full
   ```

### Supabase Issues:

- **"Invalid token"**: Make sure you're using a Personal Access Token, not a project API key
- **"Project not found"**: Verify your Project Reference ID is correct
- **"Permission denied"**: Check your token has the right scopes/permissions

### Postman Issues:

- **"Unauthorized"**: Verify your API key is correct and active
- **"Rate limit"**: Postman has rate limits on free accounts

### shadcn Issues:

- **"No components found"**: Make sure your `components.json` is properly configured
- **"Registry not found"**: Check your registry URLs in `components.json`

---

## 📚 Resources

- **Supabase MCP**: https://supabase.com/mcp
- **Postman MCP**: https://learning.postman.com/docs/developer/postman-api/postman-mcp-server/
- **shadcn/ui**: https://ui.shadcn.com
- **MCP Documentation**: https://modelcontextprotocol.io

---

## 🔒 Security Notes

- **Never commit API keys** to version control
- **Use read-only tokens** for production databases when possible
- **Rotate API keys** periodically
- **Limit token scopes** to only what's needed
- **Use environment variables** for sensitive data in production

---

**After adding your API keys and restarting Cursor, all three servers should be ready to use!** 🚀
