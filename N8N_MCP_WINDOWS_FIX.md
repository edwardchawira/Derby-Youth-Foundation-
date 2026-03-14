# Fixing n8n MCP Installation on Windows

## The Problem

When installing `n8n-workflow-builder-mcp` globally on Windows, you may encounter:

1. **Python not found error** - The package needs Python to compile native dependencies (`better-sqlite3`)
2. **Permission errors** - Global installs may require admin privileges
3. **Package not found** - Wrong package name used

## ✅ Solution: Use npx (No Installation Needed!)

**You don't need to install the package globally!** Cursor's MCP configuration uses `npx`, which runs the package on-demand without installation.

### Step 1: Update Your MCP Config

Use this configuration in your Cursor MCP settings file:

```json
{
  "mcpServers": {
    "n8n-workflow-builder": {
      "command": "npx",
      "args": [
        "-y",
        "n8n-workflow-builder-mcp"
      ],
      "env": {
        "N8N_API_URL": "https://your-n8n-instance.com",
        "N8N_API_KEY": "your-api-token-here"
      }
    }
  }
}
```

**Note:** The `-y` flag tells npx to automatically install the package if needed, without prompting.

### Step 2: Alternative Package Options

If `n8n-workflow-builder-mcp` still has issues, try these alternatives:

#### Option A: @kernel.salacoste/n8n-workflow-builder (Recommended)

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

#### Option B: @makafeli/n8n-workflow-builder

```json
{
  "mcpServers": {
    "n8n-workflow-builder": {
      "command": "npx",
      "args": [
        "-y",
        "@makafeli/n8n-workflow-builder"
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

## If You Still Want to Install Globally

If you really need a global installation (not recommended), here's how to fix the Python issue:

### Option 1: Install Python (Simplest)

1. Download Python 3.11+ from [python.org](https://www.python.org/downloads/)
2. **Important:** Check "Add Python to PATH" during installation
3. Restart PowerShell
4. Verify: `python --version`
5. Try install again: `npm install -g n8n-workflow-builder-mcp`

### Option 2: Install Windows Build Tools

```powershell
npm install -g windows-build-tools
```

This installs Python and Visual Studio build tools automatically.

### Option 3: Use Pre-built Binaries

Some packages have pre-built binaries. Try:

```powershell
npm install -g n8n-workflow-builder-mcp --build-from-source=false
```

---

## Testing Without Global Install

You can test if npx works without installing:

```powershell
npx -y n8n-workflow-builder-mcp --help
```

If this works, you're all set! Just use the npx configuration in Cursor.

---

## Recommended Approach

**For Cursor MCP integration, always use npx in your config file.** This:
- ✅ Avoids Python/build tool requirements
- ✅ Avoids permission issues
- ✅ Keeps your system clean
- ✅ Works immediately after configuration

The package will be cached by npm after first use, so subsequent runs are fast.

---

## Troubleshooting npx Issues

If npx itself has issues:

1. **Clear npm cache:**
   ```powershell
   npm cache clean --force
   ```

2. **Update npm:**
   ```powershell
   npm install -g npm@latest
   ```

3. **Check npx version:**
   ```powershell
   npx --version
   ```

4. **Try with explicit node:**
   ```json
   {
     "mcpServers": {
       "n8n-workflow-builder": {
         "command": "node",
         "args": [
           "C:\\Users\\YourName\\AppData\\Roaming\\npm\\node_modules\\npx\\bin\\npx.js",
           "-y",
           "n8n-workflow-builder-mcp"
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

## Summary

**TL;DR:** Don't install globally. Use `npx` in your Cursor MCP config. It's simpler, cleaner, and avoids all the Python/build tool headaches!
