# Cursor MCP Settings Not Showing - Troubleshooting Guide

## The Problem

You can't find the **MCP Servers** section in Cursor Settings → Features.

---

## Why This Happens

1. **Cursor Version**: MCP support requires Cursor version **0.46 or higher**
2. **Invalid Config**: If `mcp.json` has syntax errors, the UI section may be hidden
3. **Wrong Location**: Cursor might be looking in a different config file location
4. **UI Bug**: Sometimes the UI doesn't show even when config is valid

---

## Solutions

### Solution 1: Check Your Cursor Version

1. Open Cursor
2. Go to **Help** → **About** (or **Cursor** → **About Cursor** on Mac)
3. Check your version number
4. If it's below **0.46**, update Cursor to the latest version

**To Update:**
- Windows: Download from [cursor.com](https://cursor.com)
- Or use Cursor's built-in updater if available

---

### Solution 2: Verify Your Config File

Your MCP config should be at:
- **Primary Location**: `C:\Users\masha\.cursor\mcp.json`
- **Alternative Location**: `C:\Users\masha\AppData\Roaming\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`

**Check for errors:**

1. Open the file in a text editor
2. Validate JSON syntax (use an online JSON validator if needed)
3. Make sure it looks like this:

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
        "N8N_API_URL": "https://your-n8n-instance.com",
        "N8N_API_KEY": "your-api-token-here"
      }
    }
  }
}
```

**Common Errors:**
- Missing commas
- Trailing commas
- Unclosed brackets
- Invalid JSON structure

---

### Solution 3: Try Alternative Settings Locations

The MCP section might be under different names:

1. **Settings** → **Features** → **MCP Servers**
2. **Settings** → **Tools & Integrations** → **MCP**
3. **Settings** → **Tools** → **MCP Servers**
4. **Settings** → Search for "MCP" in the search bar

---

### Solution 4: Manual Config (Works Even Without UI)

**Good news:** Even if the UI doesn't show, the config file still works!

1. **Edit the config file directly:**
   ```powershell
   notepad $env:USERPROFILE\.cursor\mcp.json
   ```

2. **Add your n8n credentials:**
   - Replace `https://your-n8n-instance.com` with your actual n8n URL
   - Replace `your-api-token-here` with your n8n API key

3. **Save the file**

4. **Restart Cursor completely** (close all windows)

5. **Test if it works:**
   - Try asking Cursor to interact with n8n
   - The MCP server should work even if the UI doesn't show it

---

### Solution 5: Create Config in Alternative Location

Some Cursor versions look for the config in a different location:

**Create the file at:**
```
C:\Users\masha\AppData\Roaming\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
```

**PowerShell command to create it:**
```powershell
# Create directory if it doesn't exist
New-Item -ItemType Directory -Path "$env:APPDATA\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings" -Force

# Copy your existing config
Copy-Item "$env:USERPROFILE\.cursor\mcp.json" "$env:APPDATA\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json"
```

---

### Solution 6: Check Cursor Output/Logs

1. In Cursor, open **View** → **Output**
2. Select **"MCP"** or **"MCP Servers"** from the dropdown
3. Look for error messages about loading MCP servers
4. Fix any errors shown in the logs

---

### Solution 7: Validate JSON Syntax

Run this PowerShell command to check if your JSON is valid:

```powershell
try {
    Get-Content "$env:USERPROFILE\.cursor\mcp.json" | ConvertFrom-Json | Out-Null
    Write-Host "✅ JSON is valid!"
} catch {
    Write-Host "❌ JSON has errors: $_"
}
```

---

## Quick Fix Checklist

- [ ] Updated Cursor to version 0.46+
- [ ] Verified `mcp.json` has valid JSON syntax
- [ ] Added n8n credentials (URL and API key)
- [ ] Created config in alternative location
- [ ] Restarted Cursor completely
- [ ] Checked Output panel for MCP errors
- [ ] Searched Settings for "MCP" keyword

---

## Test If MCP Is Working (Even Without UI)

Even if you can't see the MCP section in settings, you can test if it's working:

1. **Restart Cursor** after configuring `mcp.json`
2. **Ask Cursor** to interact with n8n:
   - "List my n8n workflows"
   - "Create a new n8n workflow that..."
   - "Show me n8n workflow details"

If Cursor can interact with n8n, the MCP is working even if the UI doesn't show it!

---

## Still Not Working?

If none of the above works:

1. **Check Cursor version** - Must be 0.46+
2. **Try a fresh config** - Delete `mcp.json` and recreate it
3. **Check Cursor forums** - [forum.cursor.com](https://forum.cursor.com)
4. **Report the issue** - Include your Cursor version and OS

---

## Your Current Config File

**Location:** `C:\Users\masha\.cursor\mcp.json`

**Alternative Location:** `C:\Users\masha\AppData\Roaming\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`

Both files have been created with the n8n workflow builder configuration. Just add your n8n credentials and restart Cursor!
