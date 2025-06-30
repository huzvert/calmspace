# 🧪 CalmSpace Testing Guide

This guide will help you test every feature of your CalmSpace application to ensure everything is working correctly.

## 📋 **Pre-Testing Checklist**

### ✅ **1. Required Services Running**
```bash
# Terminal 1: Start Azure Functions
cd api
func start

# Terminal 2: Start React Frontend  
cd web
npm run dev
```

### ✅ **2. Environment Variables Set**
Check `api/local.settings.json` contains:
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_DB_URI": "your-cosmos-db-endpoint",
    "COSMOS_DB_KEY": "your-cosmos-db-key",
    "AzureSignalRConnectionString": "your-signalr-connection" // Optional for now
  }
}
```

---

## 🧪 **Test 1: Basic Functionality (Core Features)**

### **1.1: Test Azure Functions Backend**

Open PowerShell and test each endpoint:

```powershell
# Test GetMoodStats endpoint
Invoke-WebRequest -Uri "http://localhost:7071/api/GetMoodStats?userId=test-user" -Method GET

# Expected: 200 OK with empty stats or existing data
```

```powershell
# Test CreateMoodEntry endpoint
$body = @{
    mood = "happy"
    userId = "test-user"
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:7071/api/CreateMoodEntry" -Method POST -Body $body -ContentType "application/json"

# Expected: 201 Created with mood entry details
```

### **1.2: Test Frontend Basic Features**

1. **Open Browser**: Navigate to `http://localhost:5173`
2. **UI Load Test**: 
   - ✅ App loads without errors
   - ✅ Mood buttons are visible
   - ✅ "Your Mood Journey" section shows
3. **Mood Logging Test**:
   - ✅ Click a mood (e.g., Happy 😊)
   - ✅ Click "Log Mood" button  
   - ✅ Success message appears
   - ✅ Stats update after 1 second

### **1.3: Test Database Integration**

```powershell
# Log multiple moods to test stats calculation
$moods = @("happy", "calm", "sad", "anxious", "tired")
foreach ($mood in $moods) {
    $body = @{
        mood = $mood
        userId = "test-user"
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    } | ConvertTo-Json
    
    Invoke-WebRequest -Uri "http://localhost:7071/api/CreateMoodEntry" -Method POST -Body $body -ContentType "application/json"
    Start-Sleep -Seconds 1
}

# Check stats after logging multiple moods
Invoke-WebRequest -Uri "http://localhost:7071/api/GetMoodStats?userId=test-user" -Method GET
```

**Expected Results:**
- `daysTracked`: Should be 1 (all same day)
- `mostCommonMood`: Should show the mood that was logged most
- `positiveDaysPercentage`: Should be 100% (has happy/calm moods)

---

## 🔐 **Test 2: Azure AD B2C Authentication**

### **2.1: Test Without Azure Setup (Demo Mode)**
1. **Check Demo Behavior**:
   - ✅ App loads with "Sign In with Azure AD B2C" button
   - ✅ Clicking button shows error (expected - no B2C configured)
   - ✅ App falls back to demo-user for functionality
   - ✅ Mood logging still works with demo-user

### **2.2: Test With Azure B2C (If Configured)**
1. **Setup Required**: Follow `AZURE_SETUP.md` first
2. **Update Configuration**: Update `web/src/authConfig.js` with your B2C details
3. **Test Authentication Flow**:
   - ✅ Click "Sign In with Azure AD B2C"
   - ✅ Redirected to B2C login page
   - ✅ Can create new account or sign in
   - ✅ Redirected back to app with user info
   - ✅ Welcome message shows user name
   - ✅ Mood logging uses authenticated user ID

---

## 📡 **Test 3: SignalR Real-time Features**

### **3.1: Test SignalR Connection (Local Mode)**
1. **Check Browser Console**:
   - ✅ Open F12 Developer Tools
   - ✅ Look for SignalR connection logs
   - ✅ Should see "SignalR: Skipping connection - no authenticated user" (expected for demo)

### **3.2: Test SignalR with Mock User**
1. **Temporarily Enable SignalR**: 
   - In `web/src/useSignalR.js`, change line 12:
   ```javascript
   // Change this:
   if (!userId || userId === 'demo-user') {
   // To this (temporarily):
   if (!userId) {
   ```
2. **Test Real-time Features**:
   - ✅ Refresh page and check for "🔴 Live" indicator
   - ✅ Check console for SignalR connection attempts
   - ✅ Log a mood and watch for real-time notifications

---

## 🔄 **Test 4: Azure Logic Apps**

### **4.1: Test Logic App JSONs**
1. **Validate JSON Structure**:
   ```bash
   # Check JSON syntax is valid
   cat logic-apps/daily-mood-reminder.json | python -m json.tool
   cat logic-apps/mood-analysis.json | python -m json.tool
   ```

### **4.2: Test Logic App Deployment (Azure Portal)**
If you've deployed to Azure:
1. **Go to Azure Portal** → Logic Apps
2. **Find your Logic Apps**
3. **Test Run**: Click "Run Trigger" manually
4. **Check Run History**: Verify execution without errors

---

## 🐛 **Test 5: Error Handling & Edge Cases**

### **5.1: Test API Error Handling**
```powershell
# Test with invalid data
$badBody = @{
    mood = ""  # Empty mood
    userId = "test-user"
    timestamp = "invalid-date"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:7071/api/CreateMoodEntry" -Method POST -Body $badBody -ContentType "application/json"

# Expected: 400 Bad Request with error message
```

### **5.2: Test Network Failures**
1. **Stop Azure Functions**: `Ctrl+C` in Functions terminal
2. **Try Logging Mood**: Should show error message in UI
3. **Restart Functions**: Verify app recovers gracefully

### **5.3: Test CORS**
```javascript
// Open browser console on http://localhost:5173
// Run this command:
fetch('http://localhost:7071/api/GetMoodStats?userId=test-user')
  .then(r => r.json())
  .then(d => console.log('CORS works:', d))
  .catch(e => console.error('CORS failed:', e))

// Expected: Should succeed, not show CORS error
```

---

## 📊 **Test 6: Multi-Day Statistics**

### **6.1: Create Multi-Day Test Data**
```powershell
# Create entries for "yesterday"
$yesterday = (Get-Date).AddDays(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$body = @{
    mood = "sad"
    userId = "test-user"
    timestamp = $yesterday
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:7071/api/CreateMoodEntry" -Method POST -Body $body -ContentType "application/json"

# Create entries for "2 days ago" 
$twoDaysAgo = (Get-Date).AddDays(-2).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$body = @{
    mood = "happy"
    userId = "test-user" 
    timestamp = $twoDaysAgo
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:7071/api/CreateMoodEntry" -Method POST -Body $body -ContentType "application/json"

# Check updated stats
Invoke-WebRequest -Uri "http://localhost:7071/api/GetMoodStats?userId=test-user" -Method GET
```

**Expected Results:**
- `daysTracked`: Should be 3 (today + yesterday + 2 days ago)
- `mostCommonMood`: Should reflect all entries
- `positiveDaysPercentage`: Should be 67% (2 positive days out of 3)

---

## ✅ **Test Results Checklist**

Mark each test as you complete it:

### **Core Functionality**
- [ ] Azure Functions endpoints respond correctly
- [ ] Frontend loads without errors
- [ ] Mood logging works end-to-end
- [ ] Stats calculate correctly
- [ ] Multi-day tracking works
- [ ] CORS is properly configured

### **Authentication** 
- [ ] Demo mode works (fallback behavior)
- [ ] Azure B2C integration (if configured)
- [ ] User context passed to APIs

### **Real-time Features**
- [ ] SignalR connection logic works
- [ ] Real-time UI components render
- [ ] Error handling for connection failures

### **Azure Integration**
- [ ] Logic Apps JSON files are valid
- [ ] Azure services can be deployed
- [ ] Documentation is complete

---

## 🐛 **Common Issues & Solutions**

### **CORS Errors**
```
Access to fetch at 'http://localhost:7071/api/...' from origin 'http://localhost:5173' has been blocked by CORS policy
```
**Solution**: Check `api/host.json` has correct CORS origins

### **Azure Functions Not Starting**
```
Failed to start host
```
**Solution**: Check `local.settings.json` exists and has valid JSON

### **Database Connection Errors**
```
CosmosClient is not defined
```
**Solution**: Verify Cosmos DB URI and key in `local.settings.json`

### **React App Build Errors**
```
Module not found: Can't resolve '@azure/msal-react'
```
**Solution**: Run `npm install` in web directory

---

## 🎯 **Success Criteria**

Your CalmSpace app is fully working if:
1. ✅ You can log moods and see them reflected in stats
2. ✅ Multi-day tracking shows increasing `daysTracked`
3. ✅ Authentication flow works (demo or B2C)
4. ✅ All Azure Functions endpoints return expected responses
5. ✅ Real-time features initialize without errors
6. ✅ App handles network failures gracefully

**🎉 Ready for presentation when all core tests pass!**
