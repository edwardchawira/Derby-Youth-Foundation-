# Testing Your n8n MCP Connection

## ✅ MCP Servers Section Found!

Great! Your MCP configuration is working. Now let's verify the connection to n8n.

---

## Step 1: Check Connection Status

In the MCP Servers section, you should see:
- **Server Name:** `n8n-workflow-builder`
- **Status:** Should show as "Connected" (green) or "Running"

**If it shows as "Disconnected" or has an error:**
- Check that your n8n instance is running at `http://192.168.4.114:5678/`
- Verify your API key is correct
- Click "Restart" or "Reconnect" if available

---

## Step 2: Test the Connection

### Test 1: Ask Cursor to List Workflows

Try asking Cursor:
```
List all my n8n workflows
```

Or:
```
Show me my n8n workflows
```

**Expected Result:** Cursor should list your n8n workflows or tell you if there are none.

### Test 2: Get Workflow Details

If you have workflows, try:
```
Show me details about my n8n workflows
```

Or:
```
What workflows do I have in n8n?
```

### Test 3: Create a Simple Workflow

Try asking Cursor to create a workflow:
```
Create a simple n8n workflow that sends an email when triggered
```

**Note:** This will test if the workflow builder MCP server can create workflows.

---

## Step 3: Check MCP Output Logs

1. In Cursor: **View** → **Output**
2. Select **"MCP"** or **"MCP Servers"** from the dropdown
3. Look for:
   - ✅ "Connected to n8n-workflow-builder"
   - ✅ "MCP server started successfully"
   - ✅ Any API calls to your n8n instance
   - ❌ Any error messages

---

## Step 4: Verify n8n Instance is Accessible

Make sure your n8n instance is:
- ✅ Running at `http://192.168.4.114:5678/`
- ✅ Accessible from your computer
- ✅ API is enabled
- ✅ Your API key has the correct permissions

**Test in browser:**
- Open: `http://192.168.4.114:5678/`
- You should see the n8n interface

**Test API access:**
- Open: `http://192.168.4.114:5678/api/v1/workflows`
- You should see JSON (or be prompted for authentication)

---

## Common Issues

### Issue 1: "Connection Failed" or "Timeout"

**Possible Causes:**
- n8n instance is not running
- Firewall blocking connection
- Wrong IP address or port
- Network connectivity issue

**Solutions:**
- Verify n8n is running
- Check firewall settings
- Test the URL in a browser
- Verify IP address is correct

### Issue 2: "Authentication Failed" or "401 Unauthorized"

**Possible Causes:**
- Invalid API key
- API key expired
- Wrong API key format

**Solutions:**
- Generate a new API key in n8n
- Update the API key in `mcp.json`
- Restart Cursor after updating

### Issue 3: "No Tools Available"

**Possible Causes:**
- MCP server not fully loaded
- Package installation issue
- n8n API not responding

**Solutions:**
- Restart Cursor
- Check MCP output logs for errors
- Verify npx can run the package

---

## What You Can Do Now

Once connected, you can use Cursor to:

1. **List Workflows:**
   - "Show me all my n8n workflows"
   - "List workflows in n8n"

2. **View Workflow Details:**
   - "Show me details about workflow [name]"
   - "What does workflow [name] do?"

3. **Create Workflows:**
   - "Create a workflow that monitors bookings and sends emails"
   - "Build a workflow that triggers on new Supabase records"

4. **Modify Workflows:**
   - "Add a Slack notification to workflow [name]"
   - "Update workflow [name] to include error handling"

5. **Trigger Workflows:**
   - "Run workflow [name]"
   - "Execute my booking notification workflow"

---

## Next Steps

1. ✅ **Verify connection status** in MCP Servers section
2. ✅ **Test with a simple query** (list workflows)
3. ✅ **Check output logs** for any errors
4. ✅ **Try creating a workflow** if everything works

---

## Quick Test Commands

Copy and paste these into Cursor chat:

```
List my n8n workflows
```

```
Show me details about my n8n instance
```

```
Create a simple test workflow in n8n
```

---

## Success Indicators

You'll know it's working when:
- ✅ Cursor responds with n8n workflow data
- ✅ MCP output logs show successful API calls
- ✅ You can create/modify workflows via Cursor
- ✅ No error messages in the MCP section

---

**Your n8n Configuration:**
- **URL:** `http://192.168.4.114:5678/`
- **API Key:** Configured in `mcp.json`
- **MCP Server:** `n8n-workflow-builder` (@kernel.salacoste/n8n-workflow-builder)

Good luck! 🚀
