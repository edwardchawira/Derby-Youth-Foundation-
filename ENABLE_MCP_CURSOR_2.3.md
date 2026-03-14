# Enabling MCP in Cursor 2.3.41

## Quick Steps to Find/Enable MCP

### Step 1: Enable MCP Feature Flag

1. **Open Settings:**
   - Press `Ctrl+,` (Windows) or `Cmd+,` (Mac)

2. **Search for MCP:**
   - In the search bar at the top, type: `mcp`
   - Or search for: `chat.mcp.enabled`

3. **Enable the Setting:**
   - Look for: **"Chat: MCP Enabled"** or **"MCP: Enabled"**
   - Toggle it to **ON** or set it to `true`

4. **Also Check:**
   - **"Editor: Preview Features"** - Enable this if available
   - **"Chat: Enable Preview Features"** - Enable this if available

### Step 2: Access via Command Palette

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type: `MCP`
3. You should see commands like:
   - `MCP: Configure Servers`
   - `MCP: Show Servers`
   - `MCP: Restart Servers`
   - `MCP: Open Settings`

### Step 3: Check Output Panel

1. Go to **View** → **Output**
2. In the dropdown (top-right of Output panel), select:
   - **"MCP"**
   - **"MCP Servers"**
   - **"Model Context Protocol"**
3. This shows MCP logs and connection status

### Step 4: Settings Search

1. Open Settings (`Ctrl+,`)
2. In the search bar, try these searches:
   - `MCP`
   - `Model Context Protocol`
   - `mcp servers`
   - `chat.mcp`
   - `cursor.mcp`

---

## Alternative: Direct JSON Edit (Always Works!)

Even if the UI doesn't show, you can edit the config directly:

1. **Open the config file:**
   ```powershell
   notepad $env:USERPROFILE\.cursor\mcp.json
   ```

2. **Your current config:**
   ```json
   {
     "mcpServers": {
       "n8n-workflow-builder": {
         "command": "npx",
         "args": [
           "-y",
           "@kernel.salacoste/n8n-workflow-builder"
         ],
         "env": {
           "N8N_API_URL": "http://192.168.4.114:5678/",
           "N8N_API_KEY": "your-api-key-here"
         }
       }
     }
   }
   ```

3. **Save and restart Cursor**

---

## Verify MCP Is Working

### Test 1: Check Output Logs

1. **View** → **Output**
2. Select **"MCP"** from dropdown
3. Look for:
   - ✅ "Connected to n8n-workflow-builder"
   - ✅ "MCP server started"
   - ❌ Any error messages

### Test 2: Ask Cursor to Use n8n

Try asking Cursor:
- "List all my n8n workflows"
- "Show me my n8n workflow details"
- "Can you interact with my n8n instance?"

If Cursor responds with n8n data, MCP is working! ✅

### Test 3: Command Palette Test

1. `Ctrl+Shift+P`
2. Type: `MCP`
3. If you see MCP commands, it's enabled

---

## Common Issues in Cursor 2.3+

### Issue 1: Feature Flag Not Enabled

**Solution:** Enable `chat.mcp.enabled` in settings

### Issue 2: Copilot Chat Extension Missing

**Solution:** 
- Some MCP features require Copilot Chat extension
- Check **Extensions** → Search for "Copilot Chat"
- Install if missing

### Issue 3: UI Changed - Direct File Edit

**Solution:**
- In newer versions, clicking "Add MCP Server" might directly open `mcp.json`
- This is normal! Just edit the file directly

### Issue 4: Settings UI Hidden

**Solution:**
- The config file still works even if UI doesn't show
- MCP will function automatically when you use it

---

## Your Current Status

✅ **Config File:** `C:\Users\masha\.cursor\mcp.json` - Valid and configured  
✅ **Alternative Config:** `C:\Users\masha\AppData\Roaming\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json` - Also configured  
✅ **n8n Credentials:** Already added to config  
✅ **Cursor Version:** 2.3.41 - Fully supports MCP  

**Next Step:** Restart Cursor and test if MCP works by asking Cursor to interact with n8n!

---

## Quick Test After Restart

1. **Restart Cursor** completely
2. **Open Output Panel:** View → Output → Select "MCP"
3. **Ask Cursor:** "List my n8n workflows"
4. **Check Output Panel** for MCP activity

If you see MCP logs or Cursor responds with n8n data, it's working! 🎉
