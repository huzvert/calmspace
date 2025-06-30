# Azure AD B2C Setup Guide for CalmSpace

## 🎯 Overview
This guide will walk you through setting up Azure AD B2C authentication for your mood tracking app.

## 📋 Prerequisites
- Azure subscription
- Azure CLI installed and logged in
- Admin access to create Azure AD B2C tenant

## 🚀 Step 1: Create Azure AD B2C Tenant

### Option A: Azure Portal (Recommended)
1. Go to [Azure Portal](https://portal.azure.com)
2. Click **"Create a resource"**
3. Search for **"Azure Active Directory B2C"**
4. Click **"Create"**
5. Select **"Create a new Azure AD B2C Tenant"**
6. Fill in the details:
   - **Organization name**: `CalmSpace`
   - **Initial domain name**: `calmspace` (will become calmspace.onmicrosoft.com)
   - **Country/Region**: Choose your country
   - **Subscription**: Select your subscription
   - **Resource group**: Create new or use existing
7. Click **"Review + create"** then **"Create"**

### Option B: Azure CLI
```powershell
# Create resource group
az group create --name rg-calmspace-b2c --location eastus

# Create B2C tenant (Note: This may require manual steps in portal)
az ad b2c tenant create --resource-group rg-calmspace-b2c --tenant-name calmspace
```

## 🔑 Step 2: Register Your Application

### In Azure Portal:
1. Navigate to your new B2C tenant
2. Go to **"App registrations"** → **"New registration"**
3. Fill in the details:
   - **Name**: `CalmSpace Web App`
   - **Supported account types**: `Accounts in any identity provider or organizational directory`
   - **Redirect URI**: 
     - Type: `Single-page application (SPA)`
     - URL: `http://localhost:5173` (for local development)
4. Click **"Register"**

### Save These Values:
- **Application (client) ID**: `[Copy this from the overview page]`
- **Directory (tenant) ID**: `[Copy this from the overview page]`
- **Domain**: `calmspace.b2clogin.com`

## 🌊 Step 3: Create User Flows

### Sign-up and Sign-in Flow:
1. In your B2C tenant, go to **"User flows"**
2. Click **"New user flow"**
3. Select **"Sign up and sign in"**
4. Choose **"Recommended"** version
5. Name it: `B2C_1_signupsignin1`
6. **Identity providers**: Select `Email signup`
7. **User attributes and claims**:
   - **Collect attributes**: Display Name, Email Address
   - **Return claims**: Display Name, Email Addresses, User's Object ID
8. Click **"Create"**

### Profile Editing Flow (Optional):
1. Click **"New user flow"**
2. Select **"Profile editing"**
3. Name it: `B2C_1_profileediting1`
4. Configure similar to sign-up flow
5. Click **"Create"**

### Password Reset Flow (Optional):
1. Click **"New user flow"**
2. Select **"Password reset"**
3. Name it: `B2C_1_passwordreset1`
4. Configure and create

## ⚙️ Step 4: Update Your App Configuration

Update `web/src/authConfig.js` with your B2C details:

```javascript
export const msalConfig = {
  auth: {
    clientId: "YOUR_CLIENT_ID_HERE", // Replace with your App ID
    authority: "https://calmspace.b2clogin.com/calmspace.onmicrosoft.com/B2C_1_signupsignin1", // Replace with your domain
    knownAuthorities: ["calmspace.b2clogin.com"], // Replace with your domain
    redirectUri: "http://localhost:5173", // Must match registration
    postLogoutRedirectUri: "http://localhost:5173"
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  }
};

export const loginRequest = {
  scopes: ["openid", "profile"],
};

export const b2cPolicies = {
  names: {
    signUpSignIn: "B2C_1_signupsignin1",
    editProfile: "B2C_1_profileediting1",
    passwordReset: "B2C_1_passwordreset1"
  },
  authorities: {
    signUpSignIn: {
      authority: "https://calmspace.b2clogin.com/calmspace.onmicrosoft.com/B2C_1_signupsignin1",
    },
    editProfile: {
      authority: "https://calmspace.b2clogin.com/calmspace.onmicrosoft.com/B2C_1_profileediting1",
    },
    passwordReset: {
      authority: "https://calmspace.b2clogin.com/calmspace.onmicrosoft.com/B2C_1_passwordreset1",
    }
  }
};
```

## 🧪 Step 5: Test Authentication

1. **Start your app**: `npm run dev` (in web folder)
2. **Click "Sign In"** button
3. **Create a test account** or sign in
4. **Verify user info** appears in the app
5. **Test sign out** functionality

## 🚀 Step 6: Production Configuration

For production deployment, add these redirect URIs in App Registration:
- `https://yourapp.azurestaticapps.net`
- `https://your-custom-domain.com`

## 🔍 Troubleshooting

### Common Issues:
1. **"AADB2C90006" Error**: Check your redirect URI matches exactly
2. **"AADB2C90008" Error**: Verify your client ID is correct
3. **CORS Errors**: Ensure your domain is registered in B2C

### Debug Steps:
1. Check browser console for detailed error messages
2. Verify all URLs and IDs match exactly
3. Test with incognito/private browsing
4. Clear browser cache and cookies

## 📋 Configuration Checklist

- [ ] Azure AD B2C tenant created
- [ ] App registration completed
- [ ] User flows created (sign-up/sign-in)
- [ ] `authConfig.js` updated with correct values
- [ ] Redirect URIs configured
- [ ] Test authentication working
- [ ] User info displayed in app

## 🎯 Next Steps

After B2C is working:
1. **Integrate with mood entries** (associate moods with authenticated users)
2. **Update API calls** to include user tokens
3. **Add user-specific statistics**
4. **Test full end-to-end flow**

---

## 📝 Values You'll Need

Fill these in as you complete the setup:

```
Tenant Name: calmspace
Domain: calmspace.b2clogin.com
Client ID: [From App Registration]
Sign-up/Sign-in Policy: B2C_1_signupsignin1
```

## 🔗 Useful Links

- [Azure AD B2C Documentation](https://docs.microsoft.com/en-us/azure/active-directory-b2c/)
- [MSAL.js Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-js-initializing-client-applications)
- [B2C User Flow Reference](https://docs.microsoft.com/en-us/azure/active-directory-b2c/user-flow-overview)
