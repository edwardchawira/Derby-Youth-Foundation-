# Update n8n Workflow: Replace Twilio with Vonage
# This script updates your existing workflow via n8n API

$n8nUrl = "http://192.168.4.114:5678"
$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YzdlMmEwZS0yMDU2LTQ3MTctYjk1OS01NjhiYjM1MDFmMTIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY4NzUwOTMzfQ.DoMJ2k2hpc7xKOYrnJTIb5WKpfz50HH7qEAfJY8zwMc"

Write-Host "=== Updating n8n Workflow to Use Vonage ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get all workflows
Write-Host "Step 1: Fetching workflows..." -ForegroundColor Yellow
try {
    $headers = @{
        "X-N8N-API-KEY" = $apiKey
        "Content-Type" = "application/json"
    }
    
    $workflowsResponse = Invoke-RestMethod -Uri "$n8nUrl/api/v1/workflows" -Method GET -Headers $headers
    $workflows = $workflowsResponse.data
    
    # Find the cart SMS workflow
    $targetWorkflow = $workflows | Where-Object { $_.name -like "*Cart*SMS*" -or $_.name -like "*cart*sms*" }
    
    if (-not $targetWorkflow) {
        Write-Host "❌ Workflow not found. Available workflows:" -ForegroundColor Red
        $workflows | ForEach-Object { Write-Host "  - $($_.name)" -ForegroundColor White }
        exit 1
    }
    
    Write-Host "✅ Found workflow: $($targetWorkflow.name)" -ForegroundColor Green
    Write-Host "   Workflow ID: $($targetWorkflow.id)" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Error fetching workflows: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Get the full workflow
Write-Host ""
Write-Host "Step 2: Fetching workflow details..." -ForegroundColor Yellow
try {
    $workflowResponse = Invoke-RestMethod -Uri "$n8nUrl/api/v1/workflows/$($targetWorkflow.id)" -Method GET -Headers $headers
    $workflow = $workflowResponse
    
    Write-Host "✅ Workflow retrieved" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error fetching workflow: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Update workflow nodes
Write-Host ""
Write-Host "Step 3: Updating workflow nodes..." -ForegroundColor Yellow

# Find and update the Twilio node
$twilioNode = $workflow.nodes | Where-Object { $_.type -eq "n8n-nodes-base.twilio" }
$codeNode = $workflow.nodes | Where-Object { $_.name -like "*Format*Message*" -or $_.type -eq "n8n-nodes-base.code" }

if ($twilioNode) {
    Write-Host "✅ Found Twilio node: $($twilioNode.name)" -ForegroundColor Green
    
    # Remove Twilio node
    $workflow.nodes = $workflow.nodes | Where-Object { $_.id -ne $twilioNode.id }
    Write-Host "   Removed Twilio node" -ForegroundColor Gray
    
    # Create Vonage node
    $vonageNode = @{
        id = "send-sms-vonage"
        name = "Send SMS via Vonage"
        type = "n8n-nodes-base.vonage"
        typeVersion = 1
        position = $twilioNode.position
        parameters = @{
            operation = "sendSMS"
            from = "={{ `$json.from }}"
            to = "={{ `$json.to }}"
            text = "={{ `$json.message }}"
            options = @{}
        }
        credentials = @{
            vonageApi = @{
                id = ""
                name = "Vonage account"
            }
        }
    }
    
    # Add Vonage node
    $workflow.nodes += $vonageNode
    Write-Host "   Added Vonage node" -ForegroundColor Gray
    
    # Update connections
    if ($workflow.connections) {
        # Remove Twilio connections
        $nodeName = $twilioNode.name
        foreach ($key in $workflow.connections.PSObject.Properties.Name) {
            if ($workflow.connections.$key.main) {
                for ($i = 0; $i -lt $workflow.connections.$key.main.Count; $i++) {
                    if ($workflow.connections.$key.main[$i]) {
                        $workflow.connections.$key.main[$i] = $workflow.connections.$key.main[$i] | Where-Object { $_.node -ne $nodeName }
                    }
                }
            }
        }
        
        # Add new connections: Code -> Vonage -> Respond
        if ($codeNode) {
            if (-not $workflow.connections.$($codeNode.name)) {
                $workflow.connections | Add-Member -MemberType NoteProperty -Name $codeNode.name -Value @{
                    main = @(@())
                }
            }
            $workflow.connections.$($codeNode.name).main[0] = @(@{
                node = "Send SMS via Vonage"
                type = "main"
                index = 0
            })
        }
        
        $workflow.connections | Add-Member -MemberType NoteProperty -Name "Send SMS via Vonage" -Value @{
            main = @(@{
                node = "Respond to Webhook"
                type = "main"
                index = 0
            })
        } -Force
        
        Write-Host "   Updated connections" -ForegroundColor Gray
    }
    
    # Update code node for Vonage phone formatting
    if ($codeNode) {
        # Read the code from the Vonage workflow JSON file
        $vonageWorkflowPath = Join-Path $PSScriptRoot "n8n-cart-sms-workflow-vonage.json"
        if (Test-Path $vonageWorkflowPath) {
            $vonageWorkflow = Get-Content $vonageWorkflowPath | ConvertFrom-Json
            $vonageCodeNode = $vonageWorkflow.nodes | Where-Object { $_.type -eq "n8n-nodes-base.code" }
            if ($vonageCodeNode) {
                $codeNode.parameters.jsCode = $vonageCodeNode.parameters.jsCode
                Write-Host "   Updated code node for Vonage phone formatting" -ForegroundColor Gray
            }
        } else {
            Write-Host "   ⚠️  Vonage workflow file not found, skipping code update" -ForegroundColor Yellow
        }
    }
    
} else {
    Write-Host "⚠️  Twilio node not found. Workflow may already be updated." -ForegroundColor Yellow
}

# Step 4: Update workflow via API
Write-Host ""
Write-Host "Step 4: Saving updated workflow..." -ForegroundColor Yellow
try {
    # Create clean update payload (only send necessary fields)
    $updatePayload = @{
        name = $workflow.name
        nodes = $workflow.nodes
        connections = $workflow.connections
    }
    
    # Only add settings if it exists and has expected structure
    if ($workflow.settings) {
        $cleanSettings = @{}
        if ($workflow.settings.executionOrder) {
            $cleanSettings.executionOrder = $workflow.settings.executionOrder
        }
        if ($cleanSettings.Count -gt 0) {
            $updatePayload.settings = $cleanSettings
        }
    }
    
    $body = $updatePayload | ConvertTo-Json -Depth 20 -Compress
    $updateResponse = Invoke-RestMethod -Uri "$n8nUrl/api/v1/workflows/$($targetWorkflow.id)" -Method PUT -Headers $headers -Body $body
    
    Write-Host "✅ Workflow updated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Open n8n: $n8nUrl" -ForegroundColor White
    Write-Host "2. Open your workflow: $($targetWorkflow.name)" -ForegroundColor White
    Write-Host "3. Configure the 'Send SMS via Vonage' node:" -ForegroundColor White
    Write-Host "   - Select your Vonage credentials" -ForegroundColor Gray
    Write-Host "   - Verify 'From' field is set to 'PinnacleSSA' or your Vonage number" -ForegroundColor Gray
    Write-Host "4. Activate the workflow" -ForegroundColor White
    
} catch {
    Write-Host "❌ Error updating workflow: $_" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Update Complete ===" -ForegroundColor Green
