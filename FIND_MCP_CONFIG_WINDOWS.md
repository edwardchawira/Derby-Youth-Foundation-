# Finding Cursor MCP Configuration File on Windows

## Your MCP Config File Location

**Found at:** `C:\Users\masha\.cursor\mcp.json`

This file has been updated with the n8n workflow builder configuration!

---

## How to Access It

### Method 1: File Explorer
1. Press `Win + R` to open Run dialog
2. Type: `%USERPROFILE%\.cursor`
3. Press Enter
4. Look for `mcp.json`

### Method 2: PowerShell
```powershell
notepad $env:USERPROFILE\.cursor\mcp.json
```

### Method 3: Command Prompt
```cmd
notepad %USERPROFILE%\.cursor\mcp.json
```

### Method 4: Direct Path
Open this path in File Explorer:
```
C:\Users\masha\.cursor\mcp.json
```

---

## Alternative Locations (If Above Doesn't Work)

Cursor may also use these locations:

1. **Global Storage Location:**
   ```
   C:\Users\masha\AppData\Roaming\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
   ```

2. **User Settings:**
   ```
   C:\Users\masha\AppData\Roaming\Cursor\User\settings.json
   ```
   (MCP config might be in a `mcp` section here)

---

## Current Configuration

Your `mcp.json` file now contains:

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

---

## Next Steps

1. **Edit the file** and replace:
   - `https://your-n8n-instance.com` → Your actual n8n URL
   - `your-api-token-here` → Your n8n API key

2. **Save the file**

3. **Restart Cursor** completely

4. **Verify connection:**
   - Open Cursor Settings (Ctrl+,)
   - Go to Features → MCP Servers
   - Check if "n8n-workflow-builder" shows as connected

---

## Quick Edit Command

To quickly edit the file, run this in PowerShell:

```powershell
notepad $env:USERPROFILE\.cursor\mcp.json
```

Or in Command Prompt:

```cmd
notepad %USERPROFILE%\.cursor\mcp.json
```

---

## Troubleshooting

### If File Doesn't Exist

Create it manually:

1. Open File Explorer
2. Navigate to `C:\Users\masha\.cursor\`
3. If `.cursor` folder doesn't exist, create it
4. Create a new file called `mcp.json`
5. Copy the configuration from `mcp-config-template.json`

### If Cursor Doesn't Recognize It

1. Check Cursor version (should be recent)
2. Look in Cursor Settings → Features → MCP Servers
3. Try the alternative location mentioned above
4. Restart Cursor completely (close all windows)

---

## File Contents Reference

The file should look like this (with your actual values):

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

Replace the placeholder values with your actual n8n credentials!
