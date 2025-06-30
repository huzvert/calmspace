# Azure Services Setup Guide for CalmSpace

This guide will help you set up the required Azure services to make CalmSpace fully functional with authentication, automation, and real-time features.

## 🔐 Azure AD B2C Setup

### 1. Create Azure AD B2C Tenant
1. Go to [Azure Portal](https://portal.azure.com)
2. Search for "Azure AD B2C" and create a new tenant
3. Choose "Create a new Azure AD B2C Tenant"
4. Fill in:
   - Organization name: `CalmSpace`
   - Initial domain name: `calmspace`
   - Country/Region: Select your region

### 2. Register Application
1. In your B2C tenant, go to "App registrations"
2. Click "New registration"
3. Fill in:
   - Name: `CalmSpace Web App`
   - Supported account types: `Accounts in any identity provider or organizational directory`
   - Redirect URI: `Single-page application (SPA)` → `http://localhost:5173`
4. Note down the **Application (client) ID**

### 3. Create User Flow
1. Go to "User flows" in B2C
2. Click "New user flow"
3. Select "Sign up and sign in"
4. Choose "Recommended" version
5. Name: `B2C_1_signupsignin1`
6. Configure:
   - Identity providers: `Email signup`
   - User attributes: `Display Name`, `Email Address`
   - Application claims: `Display Name`, `Email Addresses`, `User's Object ID`

### 4. Update Frontend Configuration
In `web/src/authConfig.js`, replace:
```javascript
clientId: 'YOUR_CLIENT_ID', // Use your Application (client) ID
authority: 'https://calmspace.b2clogin.com/calmspace.onmicrosoft.com/B2C_1_signupsignin1',
knownAuthorities: ['calmspace.b2clogin.com'],
```

## 🔄 Azure Logic Apps Setup

### 1. Create Logic App for Daily Reminders
1. In Azure Portal, search "Logic Apps"
2. Click "Create" → "Multi-tenant"
3. Fill in:
   - Name: `calmspace-daily-reminder`
   - Resource group: Create new or use existing
   - Location: Same as your other resources

### 2. Import Logic App Definition
1. Go to your Logic App → "Logic app designer"
2. Choose "Blank Logic App"
3. Click "Code view"
4. Replace content with the JSON from `logic-apps/daily-mood-reminder.json`
5. Update the Function App URL in the HTTP action

### 3. Configure Email Connection
1. In the Logic App designer, click on the email action
2. Sign in with your Office 365 or Outlook account
3. Grant permissions

### 4. Create Mood Analysis Logic App
1. Repeat steps 1-3 for mood analysis
2. Name: `calmspace-mood-analysis`
3. Use JSON from `logic-apps/mood-analysis.json`

## 📡 Azure SignalR Setup

### 1. Create SignalR Service
1. In Azure Portal, search "SignalR Service"
2. Click "Create"
3. Fill in:
   - Name: `calmspace-signalr`
   - Resource group: Same as above
   - Location: Same region
   - Pricing tier: `Free F1` (for development)
   - Service mode: `Default`

### 2. Get Connection String
1. Go to your SignalR service → "Keys"
2. Copy the **Connection string**

### 3. Update Function App Settings
In `api/local.settings.json`, add:
```json
{
  "Values": {
    "AzureSignalRConnectionString": "YOUR_SIGNALR_CONNECTION_STRING"
  }
}
```

### 4. Configure CORS for SignalR
1. In SignalR service → "CORS"
2. Add allowed origins:
   - `http://localhost:5173`
   - `http://127.0.0.1:5173`

## 🚀 Testing Your Setup

### 1. Test Authentication
1. Run the app: `npm run dev` in the `web` folder
2. Click "Sign In with Azure AD B2C"
3. Create a new account or sign in
4. Verify user info displays correctly

### 2. Test Logic Apps
1. Manually trigger the Logic Apps from Azure Portal
2. Check email delivery
3. Monitor runs in Logic App history

### 3. Test SignalR
1. Open two browser windows with the app
2. Log a mood in one window
3. Check for real-time notifications in both windows
4. Verify "Live" indicator shows when connected

## 🔧 Production Deployment

### 1. Update URLs for Production
- Update `authConfig.js` redirect URIs
- Update Logic App HTTP endpoints
- Update SignalR connection in React app

### 2. Configure App Service
- Deploy Functions to Azure Functions
- Deploy React app to Azure Static Web Apps
- Configure custom domains and SSL

### 3. Security
- Remove development URLs from CORS
- Configure proper authentication scopes
- Enable Application Insights for monitoring

## 🐛 Troubleshooting

**Authentication Issues:**
- Verify B2C tenant URLs match exactly
- Check redirect URIs are correctly configured
- Ensure user flow name matches configuration

**Logic Apps Not Triggering:**
- Check HTTP trigger URLs are accessible
- Verify email connection permissions
- Review Logic App run history for errors

**SignalR Connection Failed:**
- Verify connection string is correct
- Check CORS configuration
- Ensure Functions are running and accessible

## 📞 Support
If you encounter issues, check Azure service health status and Function App logs for detailed error messages.
