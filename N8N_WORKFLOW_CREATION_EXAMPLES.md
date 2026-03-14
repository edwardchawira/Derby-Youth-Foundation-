# Creating n8n Workflows from Scratch with Cursor - Examples

This guide shows you how to use Cursor with n8n MCP to create workflows from scratch using natural language.

## Prerequisites

1. ✅ n8n MCP server configured (see `N8N_MCP_INTEGRATION_GUIDE.md`)
2. ✅ Using `@ifmelate/n8n-workflow-builder-mcp` or `mcp-n8n` (not the basic official server)
3. ✅ n8n API key with workflow creation permissions

---

## How It Works

When you ask Cursor to create a workflow, it will:
1. **Understand your requirements** from natural language
2. **Generate the workflow structure** (nodes, connections, parameters)
3. **Use the MCP server** to create the workflow in your n8n instance
4. **Deploy it automatically** (or provide you with the JSON to import)

---

## Example Prompts for Creating Workflows

### Simple Workflows

#### 1. Email to Slack Notification

**Prompt:**
```
Create an n8n workflow that:
- Triggers when a new email arrives in my Gmail inbox
- Checks if the subject contains "urgent"
- If yes, sends a message to my Slack channel #alerts
- If no, does nothing
```

**What Cursor will create:**
- Gmail trigger node
- IF node to check subject
- Slack node for notifications
- Proper connections between nodes

#### 2. Webhook to Database

**Prompt:**
```
Build a workflow that receives a webhook POST request, extracts the JSON data, validates required fields (name, email, message), and if valid, saves it to a PostgreSQL database table called 'contact_submissions'
```

#### 3. Scheduled Data Sync

**Prompt:**
```
Create a workflow that runs every hour, fetches data from https://api.example.com/data, transforms it (adds a timestamp field), and appends it to a Google Sheet
```

### Medium Complexity Workflows

#### 4. Multi-Step Data Processing

**Prompt:**
```
Create a workflow that:
1. Triggers on a webhook
2. Extracts user data from the payload
3. Validates the email format
4. Checks if user exists in database
5. If new: creates user record and sends welcome email
6. If exists: updates last login and sends notification
7. Logs all actions to a file
```

#### 5. Error Handling Workflow

**Prompt:**
```
Build a workflow that:
- Monitors a folder for new CSV files
- Processes each file row by row
- If processing succeeds: moves file to 'processed' folder
- If processing fails: moves file to 'errors' folder and sends alert email with error details
```

#### 6. Conditional Branching

**Prompt:**
```
Create a workflow that receives order data via webhook and:
- If order value > £100: sends to premium processing queue and notifies VIP team
- If order value £50-100: sends to standard processing
- If order value < £50: sends to basic processing
- All orders: sends confirmation email to customer
```

### Advanced Workflows

#### 7. API Integration with Retry Logic

**Prompt:**
```
Build a workflow that:
- Triggers on schedule (every 15 minutes)
- Calls an external API to get order statuses
- For each order, checks if status changed
- If changed: updates internal database
- If API call fails: retries 3 times with exponential backoff
- After 3 failures: sends alert to operations team
```

#### 8. Data Transformation Pipeline

**Prompt:**
```
Create a workflow that:
1. Reads data from a REST API
2. Transforms the data structure (rename fields, calculate totals)
3. Validates data quality (check for nulls, format dates)
4. Splits into batches of 100 records
5. Sends each batch to a processing API
6. Collects all results and generates a summary report
7. Sends report via email
```

#### 9. Multi-System Integration

**Prompt:**
```
Build a workflow that:
- Monitors a Shopify store for new orders
- When order is placed:
  - Creates customer record in CRM (HubSpot)
  - Sends order details to fulfillment system
  - Creates invoice in accounting software (Xero)
  - Sends order confirmation email
  - Updates inventory in warehouse system
  - Logs everything to analytics platform
```

---

## Modifying Existing Workflows

### Add Nodes to Existing Workflow

**Prompt:**
```
Add a Slack notification node to my existing 'Order Processing' workflow that sends a message when an order value exceeds £500
```

### Remove Nodes

**Prompt:**
```
Remove the email notification node from my 'Data Sync' workflow
```

### Update Node Configuration

**Prompt:**
```
Update my 'Email Trigger' workflow to check for emails from 'support@example.com' instead of all emails
```

### Add Error Handling

**Prompt:**
```
Add error handling to my 'API Sync' workflow: if any step fails, send an alert email to admin@example.com with error details
```

---

## Best Practices for Prompting

### ✅ Good Prompts

- **Be specific about triggers:** "webhook", "schedule every hour", "new email"
- **Specify data sources:** "from Gmail", "from PostgreSQL", "from API endpoint"
- **Define conditions clearly:** "if value > 100", "if email contains 'urgent'"
- **List all steps:** Break down complex workflows into numbered steps
- **Specify destinations:** "save to database", "send to Slack", "append to Google Sheet"

### ❌ Vague Prompts (Avoid)

- "Create a workflow" (too vague - what should it do?)
- "Make it work" (no clear requirements)
- "Do something with emails" (unclear action)

### ✅ Better Prompts

- "Create a workflow that monitors Gmail for emails with subject 'Order' and extracts order details to a database"
- "Build a workflow that runs daily at 9 AM, fetches sales data from API, and sends a summary report via email"

---

## Troubleshooting Workflow Creation

### Issue: Workflow Created But Not Working

**Ask Cursor:**
```
"Review my 'Email Processor' workflow and check for any configuration errors or missing connections"
```

### Issue: Workflow Missing Nodes

**Ask Cursor:**
```
"Add the missing authentication node to my 'API Sync' workflow - it needs OAuth2 authentication"
```

### Issue: Workflow Too Complex

**Ask Cursor:**
```
"Break down my 'Data Pipeline' workflow into smaller, more manageable sub-workflows"
```

---

## Advanced Techniques

### Using Templates

**Prompt:**
```
"Show me available n8n workflow templates and create one based on the 'Email to Database' template, customized for my Gmail and PostgreSQL setup"
```

### Workflow Optimization

**Prompt:**
```
"Analyze my 'Data Processing' workflow and optimize it for better performance - reduce API calls, add caching where possible, and improve error handling"
```

### Testing Workflows

**Prompt:**
```
"Create a test version of my 'Order Processing' workflow that uses mock data instead of real API calls"
```

---

## Real-World Use Cases

### 1. Customer Support Automation

**Prompt:**
```
Create a workflow that:
- Monitors support email inbox
- Categorizes emails by keywords (billing, technical, general)
- Routes to appropriate team Slack channel
- Creates ticket in helpdesk system
- Sends auto-reply to customer
```

### 2. Lead Management

**Prompt:**
```
Build a workflow that:
- Receives form submissions via webhook
- Validates and enriches lead data (check email, add company info)
- Scores leads based on criteria
- Adds to CRM with appropriate tags
- Sends welcome email sequence
- Notifies sales team for high-score leads
```

### 3. Content Publishing

**Prompt:**
```
Create a workflow that:
- Monitors a Google Doc for new content
- When published, extracts content
- Formats for different platforms
- Publishes to WordPress, Medium, and LinkedIn
- Shares on social media
- Tracks analytics
```

---

## Tips for Success

1. **Start Simple:** Begin with basic workflows and gradually add complexity
2. **Test Incrementally:** Test each node as you add it
3. **Use Clear Names:** Name your workflows and nodes descriptively
4. **Document:** Ask Cursor to document your workflow's purpose and flow
5. **Version Control:** Export workflows as JSON and commit to git
6. **Error Handling:** Always include error handling for production workflows

---

## Next Steps

1. **Try a simple workflow first** to verify your MCP setup works
2. **Gradually increase complexity** as you get comfortable
3. **Review generated workflows** in n8n UI to understand the structure
4. **Iterate and refine** based on results

---

## Resources

- [n8n Workflow Builder MCP](https://github.com/ifmelate/n8n-workflow-builder-mcp)
- [n8n Documentation](https://docs.n8n.io/)
- [n8n Community](https://community.n8n.io/)
