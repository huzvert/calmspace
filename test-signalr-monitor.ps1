# Test SignalR monitoring from external client
# This will help us verify if SignalR broadcasts are reaching all clients

Write-Host "🧪 Testing SignalR Cross-Client Broadcasting..." -ForegroundColor Cyan
Write-Host "This script will monitor SignalR messages to verify cross-tab functionality" -ForegroundColor Yellow

# Test SignalR negotiate endpoint first
Write-Host "`n1. Testing SignalR negotiate endpoint..." -ForegroundColor Green
try {
    $negotiateResponse = Invoke-WebRequest -Uri "http://localhost:7071/api/SignalRNegotiate" -Method GET
    Write-Host "✅ SignalR negotiate endpoint is accessible" -ForegroundColor Green
    Write-Host "Status: $($negotiateResponse.StatusCode)" -ForegroundColor White
} catch {
    Write-Host "❌ SignalR negotiate endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Instructions for manual testing
Write-Host "`n2. Manual Cross-Tab Testing Instructions:" -ForegroundColor Green
Write-Host "   a. Open multiple browser tabs to http://localhost:5173" -ForegroundColor White
Write-Host "   b. Log a mood in ONE tab" -ForegroundColor White
Write-Host "   c. Check if notifications appear in ALL tabs" -ForegroundColor White
Write-Host "   d. Look for the red notification dot and message count" -ForegroundColor White

Write-Host "`n3. What to look for in browser console:" -ForegroundColor Green
Write-Host "   - All tabs should show: '✅ Real-time mood update received'" -ForegroundColor White
Write-Host "   - Check if SignalR connection is established in all tabs" -ForegroundColor White

Write-Host "`n4. Testing API directly..." -ForegroundColor Green
$testMood = @{
    userId = "test-user-cross-tab"
    mood = "excited"
    date = (Get-Date).ToString("yyyy-MM-dd")
    timestamp = (Get-Date).ToString("o")
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:7071/api/CreateMoodEntry" -Method POST -Body $testMood -ContentType "application/json"
    Write-Host "✅ Mood entry created successfully" -ForegroundColor Green
    Write-Host "Check all browser tabs for real-time notifications!" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Failed to create mood entry: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 Expected Behavior:" -ForegroundColor Cyan
Write-Host "   - ALL open browser tabs should receive the SignalR notification" -ForegroundColor White
Write-Host "   - The red dot and message count should appear in ALL tabs" -ForegroundColor White
Write-Host "   - Console logs should show SignalR events in ALL tabs" -ForegroundColor White
