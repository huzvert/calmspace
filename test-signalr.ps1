# Test SignalR Connection
Write-Output "🧪 Testing SignalR Setup..."

# Test SignalR negotiate endpoint
try {
    $response = Invoke-WebRequest -Uri "http://localhost:7071/api/SignalRNegotiate" -Method GET
    Write-Output "✅ SignalR Negotiate: Status $($response.StatusCode)"
} catch {
    Write-Output "❌ SignalR Negotiate failed: $($_.Exception.Message)"
}

# Test SignalR broadcast endpoint
try {
    $testMessage = @{
        userId = "test-user"
        type = "notification"
        data = @{
            message = "🧪 Test SignalR message"
        }
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:7071/api/SignalRBroadcast" -Method POST -Body $testMessage -ContentType "application/json"
    Write-Output "✅ SignalR Broadcast: Status $($response.StatusCode)"
} catch {
    Write-Output "❌ SignalR Broadcast failed: $($_.Exception.Message)"
}

Write-Output ""
Write-Output "Next steps:"
Write-Output "1. Set up Azure SignalR service (see QUICK_SIGNALR_SETUP.md)"
Write-Output "2. Add connection string to local.settings.json"
Write-Output "3. Restart Functions and test real-time features"
Write-Output "4. Open http://localhost:5173 and look for Live indicator"
