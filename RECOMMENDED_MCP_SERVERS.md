# Recommended MCP Servers for PinnacleSSA

## Your Current Setup
✅ **n8n Workflow Builder** - Already configured and working!

## Recommended MCP Servers

Based on your tech stack (Supabase, Stripe, Resend, Vapi, Next.js, GitHub), here are the most useful MCP servers:

---

## 🔥 Top Priority Recommendations

### 1. **GitHub MCP** ⭐⭐⭐⭐⭐
**Why:** Essential for managing your code, pull requests, issues, and releases directly from Cursor.

**Benefits:**
- Create and manage GitHub issues
- Review pull requests
- Manage repositories
- Create branches and commits
- View code diffs

**Configuration:**
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-github-token-here"
      }
    }
  }
}
```

**Get GitHub Token:**
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo`, `issues`, `pull_requests` scopes

---

### 2. **Brave Search MCP** ⭐⭐⭐⭐
**Why:** Search the web for documentation, error solutions, and latest tech updates without leaving Cursor.

**Benefits:**
- Web search for documentation
- Find solutions to coding problems
- Research technologies and APIs
- Get current information (not limited to training data)

**Configuration:**
```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "your-brave-api-key-here"
      }
    }
  }
}
```

**Get Brave API Key:**
1. Visit: https://brave.com/search/api/
2. Sign up for free API access
3. Get your API key

---

### 3. **Filesystem MCP** ⭐⭐⭐⭐
**Why:** Enhanced file operations, searching, and code analysis across your project.

**Benefits:**
- Search files by content
- Read/write files programmatically
- Find files by patterns
- Better file management than basic editor

**Configuration:**
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:\\Users\\masha\\Pinnaclessa\\PinnacleSSA"
      ]
    }
  }
}
```

**Note:** Uses your project root path - no API key needed!

---

### 4. **PostgreSQL MCP** ⭐⭐⭐⭐
**Why:** Direct database access to your Supabase Postgres database for queries and analysis.

**Benefits:**
- Run SQL queries directly
- Analyze database schema
- Check booking data
- Debug database issues
- Generate reports

**Configuration:**
```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres"
      ],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require"
      }
    }
  }
}
```

**Get Connection String:**
1. Go to Supabase Dashboard → Settings → Database
2. Copy the connection string (use connection pooling URL)
3. Replace `[PASSWORD]` with your database password

---

## 🎯 Secondary Recommendations

### 5. **Slack MCP** ⭐⭐⭐
**Why:** If you use Slack for team communication, integrate notifications and updates.

**Configuration:**
```json
{
  "mcpServers": {
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-your-token-here",
        "SLACK_TEAM_ID": "your-team-id"
      }
    }
  }
}
```

---

### 6. **Stripe MCP** ⭐⭐⭐
**Why:** If available, manage payments, customers, and subscriptions directly.

**Note:** Check if official Stripe MCP server exists. If not, you can use n8n workflows to interact with Stripe API.

---

### 7. **Gmail MCP** ⭐⭐⭐
**Why:** If you use Gmail for business emails, manage emails and send notifications.

**Configuration:**
```json
{
  "mcpServers": {
    "gmail": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-gmail"],
      "env": {
        "GMAIL_CREDENTIALS": "path-to-credentials.json",
        "GMAIL_TOKEN": "path-to-token.json"
      }
    }
  }
}
```

---

## 📋 Complete Configuration Example

Here's your complete `mcp.json` with all recommended servers:

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
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-github-token-here"
      }
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "your-brave-api-key-here"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:\\Users\\masha\\Pinnaclessa\\PinnacleSSA"
      ]
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
      }
    }
  }
}
```

---

## 🚀 Quick Setup Priority

**Start with these 3:**

1. **GitHub MCP** - Most useful for code management
2. **Filesystem MCP** - Enhances file operations (no API key needed!)
3. **Brave Search MCP** - Great for documentation lookup

**Then add:**
4. **PostgreSQL MCP** - If you need direct database access
5. **Slack MCP** - If you use Slack

---

## 📚 Other Useful MCP Servers (Check Availability)

- **Linear MCP** - Project management
- **Notion MCP** - Documentation and notes
- **Airtable MCP** - Data management
- **Google Drive MCP** - File storage
- **SendGrid MCP** - Email (if you switch from Resend)
- **AWS MCP** - Cloud services
- **Vercel MCP** - Deployment management

---

## 🔍 How to Find More MCP Servers

1. **Official MCP Registry:** https://modelcontextprotocol.io/servers
2. **npm search:** `npm search mcp-server`
3. **GitHub:** Search for "mcp-server" repositories
4. **Community:** Check MCP Discord/forums

---

## ⚠️ Important Notes

1. **API Keys:** Keep your API keys secure. Never commit them to git!
2. **Rate Limits:** Some services have API rate limits
3. **Permissions:** Only grant necessary permissions to API tokens
4. **Testing:** Test each MCP server individually before adding multiple

---

## 🎯 For Your Specific Use Case (PinnacleSSA)

**Most Relevant:**
1. **GitHub MCP** - Manage your codebase and deployments
2. **Filesystem MCP** - Better file operations in your project
3. **PostgreSQL MCP** - Direct access to Supabase database for bookings analysis
4. **Brave Search MCP** - Look up Supabase, Stripe, Resend documentation

These will give you the most value for your booking system project!
