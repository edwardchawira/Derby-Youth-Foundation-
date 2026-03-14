# MCP Server Setup Instructions

## ✅ Installed MCP Servers

### 1. Context7 MCP
- **Package**: `@upstash/context7-mcp` (v2.1.0)
- **Purpose**: Provides up-to-date, version-specific documentation and code examples for libraries
- **API Key**: Optional (but recommended for private repos and higher limits)

### 2. Brave Search MCP
- **Package**: `@modelcontextprotocol/server-brave-search` (v0.6.2)
- **Purpose**: Enables web search, image/video search, and summaries using Brave Search API
- **API Key**: **Required** (Free plan: ~2,000 queries/month)

---

## 🔑 Getting API Keys

### Context7 API Key (Optional)
1. Visit: https://context7.com (or check Upstash dashboard)
2. Sign up / Log in
3. Generate an API key from your account settings
4. Replace `YOUR_CONTEXT7_API_KEY_HERE` in `mcp.json` with your actual key

**Note**: Context7 can work without an API key for basic usage, but you'll have better limits with a key.

### Brave Search API Key (Required)
1. Visit: https://brave.com/search/api
2. Sign up / Log in to Brave Search API
3. Generate an API key from your dashboard
4. Replace `YOUR_BRAVE_API_KEY_HERE` in `mcp.json` with your actual key

**Free Plan**: ~2,000 queries/month
**Pro Plan**: More features and higher limits

---

## 📝 Configuration File Location

Your MCP configuration is located at:
```
C:\Users\masha\.cursor\mcp.json
```

Current configuration includes:
- ✅ n8n-workflow-builder
- ✅ mcp-n8n
- ✅ context7 (needs API key)
- ✅ brave-search (needs API key)

---

## 🔧 Next Steps

1. **Add your API keys**:
   - Open `C:\Users\masha\.cursor\mcp.json`
   - Replace `YOUR_CONTEXT7_API_KEY_HERE` with your Context7 API key (if you have one)
   - Replace `YOUR_BRAVE_API_KEY_HERE` with your Brave Search API key

2. **Restart Cursor**:
   - Close all Cursor windows completely
   - Reopen Cursor
   - Wait for MCP servers to connect

3. **Verify Connection**:
   - Go to Cursor Settings → MCP Servers
   - Check that both servers show green (not red)
   - If red, check that API keys are correct

---

## 🧪 Testing

After restarting Cursor, you can test the MCP servers:

### Test Context7:
- Ask Cursor to look up documentation for a library
- Context7 will provide version-specific docs

### Test Brave Search:
- Ask Cursor to search the web for something
- Brave Search will fetch recent results

---

## ❓ Troubleshooting

### Server shows red in Cursor:
1. Check API keys are correct (no extra spaces)
2. Verify you have internet connection
3. Check Cursor logs for error messages
4. Try running the package manually:
   ```powershell
   npx -y @upstash/context7-mcp
   npx -y @modelcontextprotocol/server-brave-search
   ```

### API Key Issues:
- Make sure keys are in the `env` section
- No quotes needed around the key value
- Keys are case-sensitive

### Package Not Found:
- Ensure Node.js is installed and in PATH
- Try: `npm install -g @upstash/context7-mcp` (though npx should work)

---

## 📚 Resources

- Context7: https://context7.com
- Brave Search API: https://brave.com/search/api
- MCP Documentation: https://modelcontextprotocol.io
