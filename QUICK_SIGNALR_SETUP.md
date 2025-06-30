# 🚀 Quick Start: Azure SignalR Setup

## Step 1: Create SignalR Service in Azure

1. **Go to Azure Portal**: https://portal.azure.com
2. **Search "SignalR Service"** in the top search bar
3. **Click "Create"**
4. **Fill in the details:**
   ```
   Subscription: Your subscription
   Resource Group: Create new "calmspace-rg" (or use existing)
   Resource Name: calmspace-signalr
   Region: Choose closest to you (e.g., East US)
   Pricing Tier: Free F1 (perfect for development)
   Service Mode: Default
   ```
5. **Click "Review + Create"** → **"Create"**
6. **Wait 2-3 minutes** for deployment to complete

## Step 2: Get Connection String

1. **Go to your SignalR service** (search "calmspace-signalr")
2. **Click "Keys"** in left menu
3. **Copy the "Connection string"** (the primary one)

## Step 3: Update Local Settings

1. **Open** `api/local.settings.json`
2. **Add the connection string:**
   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "AzureWebJobsStorage": "",
       "FUNCTIONS_WORKER_RUNTIME": "node",
       "COSMOS_DB_URI": "your-existing-cosmos-uri",
       "COSMOS_DB_KEY": "your-existing-cosmos-key",
       "AzureSignalRConnectionString": "PASTE_YOUR_CONNECTION_STRING_HERE"
     }
   }
   ```

## Step 4: Configure CORS for SignalR

1. **In your SignalR service** → Click "CORS"
2. **Add allowed origins:**
   ```
   http://localhost:5173
   http://127.0.0.1:5173
   ```
3. **Click "Save"**

## Step 5: Test SignalR

1. **Restart Azure Functions:**
   ```bash
   # Stop Functions (Ctrl+C)
   # Then restart:
   cd api
   func start
   ```

2. **Open browser** → http://localhost:5173
3. **Look for:** 🔴 Live indicator in top-left
4. **Test:** Open two browser windows, log mood in one, see notification in both!

✅ **SignalR Setup Complete!** Real-time features now work.
