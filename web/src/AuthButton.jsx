import React from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from './authConfig';

const AuthButton = () => {
  const { instance, accounts } = useMsal();
  
  const handleLogin = () => {
    instance.loginPopup(loginRequest).catch(e => {
      console.error(e);
    });
  };

  const handleLogout = () => {
    instance.logoutPopup().catch(e => {
      console.error(e);
    });
  };

  return (
    <div className="auth-section">
      {accounts.length > 0 ? (
        <div className="user-info">
          <span className="welcome-text">
            Welcome, {accounts[0].name || accounts[0].username}!
          </span>
          <button 
            onClick={handleLogout}
            className="auth-button logout-button"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <button 
          onClick={handleLogin}
          className="auth-button login-button"
        >
          Sign In with Azure AD B2C
        </button>
      )}
    </div>
  );
};

export default AuthButton;
