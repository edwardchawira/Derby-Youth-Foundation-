# n8n MCP Integration with Cursor - Complete Guide

This guide will walk you through integrating n8n (workflow automation) with Cursor using Model Context Protocol (MCP).

## What is MCP?

Model Context Protocol (MCP) allows AI assistants like Cursor to interact with external services. With n8n MCP integration, you can:
- **Search and list workflows** from Cursor
- **Trigger workflows** directly from Cursor
- **Monitor workflow executions**
- **View workflow metadata** (status, triggers, etc.)
- **✨ CREATE workflows from scratch** using natural language
- **✨ EDIT and modify existing workflows** programmatically
- **✨ Add/remove nodes, connect them, and configure parameters** via AI

## Can I Develop Workflows from Scratch?

**YES!** With the right MCP server, you can use Cursor to:
- Create complete workflows from natural language prompts
- Add, remove, and modify nodes
- Connect nodes together
- Configure node parameters
- Deploy workflows to your n8n instance

**Example:** You can ask Cursor: *"Create a workflow that monitors incoming emails, filters by keyword 'urgent', and sends a Slack notification"* and it will build the entire workflow for you!

---

## Prerequisites

1. **n8n instance** (version 2.2.0 or higher) - self-hosted or cloud
2. **Admin/Owner access** to your n8n instance
3. **Cursor IDE** installed
4. **Node.js** installed (for running the MCP server)

---

## Step 1: Enable MCP in n8n

### 1.1 Access Instance-Level MCP Settings

1. Log into your n8n instance
2. Navigate to **Settings** → **Instance-level MCP**
3. Toggle **Enable MCP access** (requires admin/owner permissions)

### 1.2 Configure Authentication

You have two authentication options:

#### Option A: Access Token (Recommended for Development)

1. In n8n, go to **Settings** → **API**
2. Click **Create API Key**
3. Give it a name (e.g., "Cursor MCP Integration")
4. Copy the generated token (you'll need this later)
5. Set appropriate permissions (at minimum: read workflows, execute workflows)

#### Option B: OAuth2 (For Production)

1. In n8n, go to **Settings** → **OAuth**
2. Create a new OAuth client
3. Configure redirect URIs
4. Note the Client ID and Client Secret

### 1.3 Expose Workflows to MCP

For workflows to be accessible via MCP:

1. **Publish the workflow** (it must be active/published)
2. **Use a supported trigger node**:
   - Webhook
   - Schedule
   - Chat
   - Form
3. **Enable MCP access** for each workflow:
   - Go to **Settings** → **Instance-level MCP**
   - Find your workflow in the list
   - Toggle it to "Exposed" or "Enabled"
   
   OR
   
   - Open the workflow editor
   - Go to workflow settings
   - Enable "Expose to MCP"

### 1.4 Note Your n8n URL

Record your n8n instance URL:
- Self-hosted: `http://localhost:5678` or `https://your-domain.com`
- Cloud: `https://your-workspace.app.n8n.cloud`

---

## Step 2: Choose Your n8n MCP Server

There are several MCP servers available for n8n. Choose based on your needs:

### Option 1: n8n Workflow Builder MCP (Recommended for Creating Workflows)

**Best for:** Creating and editing workflows from scratch

This MCP server allows you to:
- Create workflows from natural language
- Add/remove/modify nodes
- Connect nodes together
- Configure node parameters
- Deploy workflows automatically

**Installation:**
```bash
# Using npx (no installation needed)
npx -y @ifmelate/n8n-workflow-builder-mcp

# Or install globally
npm install -g @ifmelate/n8n-workflow-builder-mcp
```

**GitHub:** https://github.com/ifmelate/n8n-workflow-builder-mcp

### Option 2: mcp-n8n (Official Community Server)

**Best for:** Comprehensive n8n control

This server provides:
- Workflow creation and management
- Execution monitoring
- Template usage
- Workflow activation/deactivation

**Installation:**
```bash
npx -y mcp-n8n
```

**Community:** https://community.n8n.io/t/mcp-n8n-control-n8n-with-ai

### Option 3: Official n8n MCP Server

**Best for:** Basic workflow listing and triggering

The official n8n MCP server (built into n8n 2.2.0+) provides:
- Listing workflows
- Triggering workflows
- Viewing workflow metadata

**Note:** This is the instance-level MCP built into n8n, which is more limited than the workflow builder servers above.

---

## Step 3: Configure Cursor to Connect to n8n

### 3.1 Locate Cursor MCP Configuration

The MCP configuration file location depends on your OS:

- **Windows**: `%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
- **macOS**: `~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- **Linux**: `~/.config/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

**OR** you can create it at:     
- **Windows**: `C:\Users\YourUsername\.cursor\mcp.json`
- **macOS/Linux**: `~/.cursor/mcp.json`

### 3.2 Create/Edit MCP Configuration File

Choose the configuration based on which MCP server you want to use:

#### Configuration A: n8n Workflow Builder (Recommended for Creating Workflows)

```json
{
  "mcpServers": {
    "n8n-workflow-builder": {
      "command": "npx",
      "args": [
        "-y",
        "@ifmelate/n8n-workflow-builder-mcp"
      ],
      "env": {
        "N8N_API_URL": "https://your-n8n-instance.com",
        "N8N_API_KEY": "your-api-token-here"
      }
    }
  }
}
```

#### Configuration B: mcp-n8n (Comprehensive Control)

```json
{
  "mcpServers": {
    "mcp-n8n": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-n8n"
      ],
      "env": {
        "N8N_API_URL": "https://your-n8n-instance.com",
        "N8N_API_KEY": "your-api-token-here"
      }
    }
  }
}
```

#### Configuration C: Official n8n MCP (Basic - List/Trigger Only)

```json
{
  "mcpServers": {
    "n8n": {
      "command": "npx",
      "args": [
        "-y",
        "@n8n/mcp-server"
      ],
      "env": {
        "N8N_API_URL": "https://your-n8n-instance.com",
        "N8N_API_KEY": "your-api-token-here"
      }
    }
  }
}
```

**Replace:**
- `https://your-n8n-instance.com` with your actual n8n URL
- `your-api-token-here` with the API token you created in Step 1.2

**💡 Recommendation:** Use **Configuration A** (n8n Workflow Builder) if you want to create workflows from scratch in Cursor.

### 3.3 Alternative: Using Direct Package Path

If you installed globally or have a local installation:

```json
{
  "mcpServers": {
    "n8n": {
      "command": "node",
      "args": [
        "/path/to/node_modules/@n8n/mcp-server/dist/index.js"
      ],
      "env": {
        "N8N_API_URL": "https://your-n8n-instance.com",
        "N8N_API_KEY": "your-api-token-here"
      }
    }
  }
}
```

### 3.4 Environment Variables (Alternative Method)

You can also set environment variables in your system:

**Windows (PowerShell):**
```powershell
$env:N8N_API_URL="https://your-n8n-instance.com"
$env:N8N_API_KEY="your-api-token-here"
```

**macOS/Linux:**
```bash
export N8N_API_URL="https://your-n8n-instance.com"
export N8N_API_KEY="your-api-token-here"
```

Then use a simpler config:

```json
{
  "mcpServers": {
    "n8n": {
      "command": "npx",
      "args": ["-y", "@n8n/mcp-server"]
    }
  }
}
```

---

## Step 4: Restart Cursor

After configuring the MCP server:

1. **Close Cursor completely**
2. **Restart Cursor**
3. The MCP server should automatically connect on startup

---

## Step 5: Verify Connection

### 5.1 Check MCP Server Status

1. In Cursor, open **Settings** (Ctrl+, or Cmd+,)
2. Navigate to **Features** → **MCP Servers** (or search for "MCP")
3. Look for your "n8n" server
4. It should show as **Connected** (green status)

### 5.2 Test MCP Tools

Once connected, you should be able to use n8n-related commands in Cursor:

- **List workflows**: Ask Cursor to "list my n8n workflows"
- **Trigger workflow**: "Run my n8n workflow named [workflow-name]"
- **Search workflows**: "Find workflows related to [keyword]"

### 5.3 Check Available Tools

In Cursor's command palette (Ctrl+Shift+P / Cmd+Shift+P), you might see:
- `n8n: List Workflows`
- `n8n: Execute Workflow`
- `n8n: Get Workflow Details`

---

## Step 6: Example Usage

### Basic Operations (All MCP Servers)

#### Example 1: List All Workflows

Ask Cursor:
```
"Can you list all my n8n workflows?"
```

Cursor will use the MCP server to fetch and display your workflows.

#### Example 2: Trigger a Workflow

Ask Cursor:
```
"Trigger my n8n workflow called 'Send Email Notification' with the data: { 'email': 'user@example.com', 'message': 'Hello' }"
```

#### Example 3: Get Workflow Details

Ask Cursor:
```
"Show me details about my 'Data Sync' workflow"
```

### Creating Workflows from Scratch (Workflow Builder MCP)

#### Example 4: Create a Simple Workflow

Ask Cursor:
```
"Create a workflow that monitors incoming emails, filters for emails containing 'urgent' in the subject, and sends a Slack notification to #alerts channel"
```

Cursor will:
1. Generate the workflow structure
2. Add the necessary nodes (Email trigger, Filter, Slack)
3. Connect the nodes
4. Configure parameters
5. Deploy it to your n8n instance

#### Example 5: Create a Data Processing Workflow

Ask Cursor:
```
"Build a workflow that:
1. Triggers on a webhook
2. Extracts data from the JSON payload
3. Transforms the data
4. Saves it to a Google Sheet
5. Sends a confirmation email"
```

#### Example 6: Modify an Existing Workflow

Ask Cursor:
```
"Add a Slack notification node to my 'Data Sync' workflow that sends a message when the sync completes successfully"
```

#### Example 7: Create a Scheduled Workflow

Ask Cursor:
```
"Create a workflow that runs every day at 9 AM, fetches data from an API, processes it, and stores results in a database"
```

#### Example 8: Complex Multi-Step Workflow

Ask Cursor:
```
"Create a workflow that:
- Starts with a webhook trigger
- Validates the incoming data
- If valid: processes it and sends to API A
- If invalid: logs the error and sends alert email
- After processing: updates a database and sends confirmation"
```

### Advanced Workflow Development

#### Example 9: Use Workflow Templates

Ask Cursor:
```
"Show me available workflow templates and create one for 'Email to Database'"
```

#### Example 10: Debug and Fix Workflows

Ask Cursor:
```
"My 'Email Processor' workflow is failing. Can you check the node configuration and fix any issues?"
```

#### Example 11: Optimize Workflow

Ask Cursor:
```
"Review my 'Data Pipeline' workflow and suggest optimizations to make it faster and more reliable"
```

---

## Troubleshooting

### Issue: MCP Server Not Connecting

**Symptoms:**
- Server shows as "Disconnected" or "Error" in Cursor settings
- No n8n tools available

**Solutions:**

1. **Check n8n URL and API Key:**
   ```bash
   # Test the connection manually
   curl -H "X-N8N-API-KEY: your-api-key" https://your-n8n-instance.com/api/v1/workflows
   ```

2. **Verify n8n version:**
   - Ensure you're running n8n 2.2.0 or higher
   - Check version: `n8n --version` or in n8n UI → Settings → About

3. **Check Node.js version:**
   ```bash
   node --version  # Should be v18 or higher
   ```

4. **Verify npx is available:**
   ```bash
   npx --version
   ```

5. **Check Cursor logs:**
   - Open Cursor → Help → Toggle Developer Tools
   - Check Console for MCP-related errors

### Issue: Workflows Not Showing

**Symptoms:**
- MCP server connects but no workflows appear

**Solutions:**

1. **Ensure workflows are published:**
   - In n8n, workflows must be in "Active" state
   - Unpublished workflows won't appear

2. **Check trigger nodes:**
   - Workflows must have Webhook, Schedule, Chat, or Form triggers
   - Other trigger types may not be supported

3. **Verify MCP exposure:**
   - Go to n8n → Settings → Instance-level MCP
   - Ensure workflows are marked as "Exposed"

4. **Check API permissions:**
   - Your API key needs "read workflows" permission
   - Regenerate API key if needed

### Issue: Can't Execute Workflows

**Symptoms:**
- Workflows list but can't be triggered

**Solutions:**

1. **Check API permissions:**
   - API key needs "execute workflows" permission
   - Regenerate with proper permissions

2. **Verify workflow is active:**
   - Workflow must be published and active
   - Check workflow status in n8n UI

3. **Check workflow trigger:**
   - Webhook workflows: Ensure webhook is accessible
   - Schedule workflows: Should execute automatically
   - Chat workflows: May need specific setup

### Issue: Authentication Errors

**Symptoms:**
- "Unauthorized" or "401" errors

**Solutions:**

1. **Regenerate API key:**
   - Old keys may have expired
   - Create a new one in n8n → Settings → API

2. **Check API key format:**
   - Should be a long string (not a password)
   - Copy it exactly, no extra spaces

3. **Verify URL:**
   - Ensure no trailing slashes
   - Use HTTPS for production instances

---

## Advanced Configuration

### Using Multiple n8n Instances

You can connect to multiple n8n instances:

```json
{
  "mcpServers": {
    "n8n-production": {
      "command": "npx",
      "args": ["-y", "@n8n/mcp-server"],
      "env": {
        "N8N_API_URL": "https://prod.n8n.example.com",
        "N8N_API_KEY": "prod-api-key"
      }
    },
    "n8n-staging": {
      "command": "npx",
      "args": ["-y", "@n8n/mcp-server"],
      "env": {
        "N8N_API_URL": "https://staging.n8n.example.com",
        "N8N_API_KEY": "staging-api-key"
      }
    }
  }
}
```

### Custom n8n Version

If you need to specify a specific n8n version:

```json
{
  "mcpServers": {
    "n8n": {
      "command": "npx",
      "args": ["-y", "@n8n/mcp-server"],
      "env": {
        "N8N_API_URL": "https://your-n8n-instance.com",
        "N8N_API_KEY": "your-api-token-here",
        "N8N_VERSION": "2.2.0"
      }
    }
  }
}
```

---

## Security Best Practices

1. **Use Environment Variables:**
   - Don't hardcode API keys in config files
   - Use system environment variables when possible

2. **Limit API Key Permissions:**
   - Only grant necessary permissions (read + execute)
   - Don't use owner/admin tokens if possible

3. **Use HTTPS:**
   - Always use HTTPS for n8n instances
   - Don't expose n8n on public networks without authentication

4. **Rotate Keys Regularly:**
   - Regenerate API keys periodically
   - Revoke old keys when no longer needed

---

## Next Steps

Once integrated, you can:

1. **Automate development tasks:**
   - Trigger deployments
   - Run tests
   - Send notifications

2. **Integrate with your workflow:**
   - Connect n8n workflows to your development process
   - Automate repetitive tasks

3. **Build custom workflows:**
   - Create workflows specifically for Cursor integration
   - Use webhook triggers for Cursor events

---

## Additional Resources

- [n8n MCP Documentation](https://docs.n8n.io/advanced-ai/accessing-n8n-mcp-server/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [n8n API Documentation](https://docs.n8n.io/api/)

---

## Quick Reference

**Config File Location:**
- Windows: `%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
- macOS: `~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- Linux: `~/.config/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

**Minimal Config:**
```json
{
  "mcpServers": {
    "n8n": {
      "command": "npx",
      "args": ["-y", "@n8n/mcp-server"],
      "env": {
        "N8N_API_URL": "YOUR_N8N_URL",
        "N8N_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

**Test Connection:**
```bash
curl -H "X-N8N-API-KEY: YOUR_API_KEY" YOUR_N8N_URL/api/v1/workflows
```
