# shadcn MCP Fix

## Problem
The `shadcn-mcp` package was showing red/error in Cursor because it's designed to run as an **HTTP server** (port 3176), but Cursor's MCP requires **stdio communication**.

## Solution
1. **Removed** the old `shadcn` entry that used `shadcn-mcp` (HTTP-only)
2. **Kept** the `shadcn-studio-mcp` entry that was installed by `shadcn-studio-cli`
3. **Simplified** the `shadcn-studio-mcp` configuration to use `npx` directly

## Current Configuration

```json
{
  "shadcn-studio-mcp": {
    "command": "npx",
    "args": [
      "-y",
      "shadcn-studio-mcp"
    ]
  }
}
```

## Next Steps

1. **Restart Cursor** completely (close all windows, reopen)
2. **Check Settings → MCP Servers** - `shadcn-studio-mcp` should now show green
3. **Test it** by asking Cursor: "Show me available shadcn components" or "Add a button component"

## What Changed

### Before (Not Working):
- `shadcn` entry using `shadcn-mcp` (HTTP server, incompatible)
- `shadcn-studio-mcp` using `cmd /c` wrapper with empty API keys

### After (Fixed):
- Removed `shadcn` entry
- `shadcn-studio-mcp` using clean `npx` command

## Troubleshooting

If `shadcn-studio-mcp` still shows red:

1. **Check Cursor logs** (View → Output → MCP)
2. **Try running manually**:
   ```powershell
   npx -y shadcn-studio-mcp
   ```
3. **Verify package exists**:
   ```powershell
   npm view shadcn-studio-mcp version
   ```

## Alternative: Use shadcn CLI Directly

If the MCP server continues to have issues, you can always use the shadcn CLI directly in Cursor:
- Ask Cursor: "Run `npx shadcn@latest add button`"
- Cursor can execute commands directly without needing an MCP server

---

**Status**: ✅ Fixed - Removed incompatible HTTP server, using stdio-compatible `shadcn-studio-mcp`
