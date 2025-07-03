import React, { useState } from 'react';
// import { useMsal } from '@azure/msal-react';
// import { loginRequest } from './authConfig';

const AuthButton = () => {
  // const { instance, accounts } = useMsal();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [userInfo] = useState({
    name: "Huzaifa Satti",
    email: "huzaifa.satti@contour-software.com",
    avatar: "https://via.placeholder.com/40/4CAF50/white?text=HS"
  });

  const handleLogin = () => {
    setShowLoginModal(true);
  };

  const handleMockLogin = () => {
    setIsLoggedIn(true);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <div className="auth-section">
      {!isLoggedIn ? (
        <button className="auth-button login-button" onClick={handleLogin}>
          <span className="auth-icon">🔐</span>
          Sign In with Azure AD
        </button>
      ) : (
        <div className="user-info logged-in">
          <img src={userInfo.avatar} alt="User Avatar" className="user-avatar" />
          <div className="user-details">
            <span className="user-name">{userInfo.name}</span>
            <span className="user-email">{userInfo.email}</span>
          </div>
          <button className="auth-button logout-button" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      )}

      {/* Mock Login Modal */}
      {showLoginModal && (
        <div className="auth-modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="auth-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔐 Azure AD Authentication</h3>
              <button className="close-btn" onClick={() => setShowLoginModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="auth-provider">
                <div className="provider-logo">🔷</div>
                <span>Microsoft Azure Active Directory</span>
              </div>
              <p className="auth-description">
                In production, this would redirect to Azure AD B2C for secure authentication.
              </p>
              <button className="mock-login-btn" onClick={handleMockLogin}>
                🎭 Demo Login (Mock)
              </button>
              <div className="auth-features">
                <div className="feature">✅ Multi-factor Authentication</div>
                <div className="feature">✅ Enterprise Single Sign-On</div>
                <div className="feature">✅ Conditional Access Policies</div>
                <div className="feature">✅ Identity Protection</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthButton;
