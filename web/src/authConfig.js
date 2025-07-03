// Azure AD B2C Configuration for CalmSpace
import { LogLevel } from '@azure/msal-browser';

// Replace these with your actual Azure AD B2C tenant details
export const msalConfig = {
  auth: {
    clientId: 'YOUR_CLIENT_ID', // Replace with your Application (client) ID
    authority: 'https://YOUR_TENANT.b2clogin.com/YOUR_TENANT.onmicrosoft.com/B2C_1_signupsignin1', 
    knownAuthorities: ['YOUR_TENANT.b2clogin.com'], // Replace with your tenant
    redirectUri: 'http://localhost:5173', // Development redirect URI
  },
  cache: {
    cacheLocation: 'sessionStorage', // This configures where your cache will be stored
    storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
        }
      }
    }
  }
};

// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
export const loginRequest = {
  scopes: ['User.Read']
};

// Add the endpoints here for Microsoft Graph API services you'd like to use.
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me'
};

// Helper function to get user ID
export const getUserId = () => {
  // In production, this would extract the user ID from MSAL tokens
  // For demo purposes, return a mock user ID
  return 'demo-user-huzaifa';
};

// Mock authentication status
export const isAuthenticated = () => {
  // In production, this would check MSAL authentication status
  return false; // Set to false for demo mode
};

// Azure AD B2C Architecture Explanation (for presentation)
export const authArchitecture = {
  description: "Azure AD B2C provides enterprise-grade identity management for customer-facing applications",
  features: [
    "🔐 Multi-factor Authentication (MFA)",
    "🌐 Social Identity Providers (Google, Facebook, LinkedIn)",
    "📱 Custom User Journeys and Policies", 
    "🔒 Conditional Access Policies",
    "🛡️ Identity Protection and Risk Detection",
    "📊 Advanced Analytics and Monitoring",
    "🔄 Seamless Single Sign-On (SSO)",
    "⚡ Scalable to millions of users",
    "🎨 Customizable UI and Branding",
    "🌍 Global Scale and Compliance"
  ],
  implementation: {
    frontend: "MSAL.js library for React SPA integration",
    backend: "JWT token validation in Azure Functions", 
    policies: "Custom B2C user flows for sign-up/sign-in/profile editing",
    security: "OAuth 2.0 and OpenID Connect protocols",
    storage: "Secure token caching and session management"
  },
  benefits: [
    "🚀 Reduce development time by 80%",
    "🔒 Enterprise-grade security out of the box", 
    "💰 Cost-effective identity solution",
    "📈 Built-in analytics and insights",
    "🔧 Easy integration with existing systems"
  ]
};
