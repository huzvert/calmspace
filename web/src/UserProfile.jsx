import React, { useState } from 'react';
import { useAuth } from './useAuth';

const UserProfile = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    setShowMenu(false);
    onMenuToggle?.(false);
  };

  const toggleMenu = () => {
    const newState = !showMenu;
    setShowMenu(newState);
    onMenuToggle?.(newState);
  };

  const displayName = user.username || user.name.split(' ')[0];

  return (
    <>
      {/* Welcome Banner - Below the main title */}
      <div className="welcome-banner">
        <h2 className="welcome-text">Welcome back, {displayName}</h2>
      </div>

      {/* Hamburger Menu - Top Left */}
      <div className="hamburger-menu">
        <button 
          className="hamburger-button"
          onClick={toggleMenu}
          title="Menu"
          aria-label="Open menu"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

        {/* Slide-out Menu */}
        {showMenu && (
          <div className="slide-menu">
            <div className="menu-header">
              <div className="menu-avatar">👤</div>
              <div className="menu-info">
                <span className="menu-name">{user.name}</span>
                <span className="menu-username">@{user.username || user.email}</span>
              </div>
            </div>
            
            <div className="menu-divider"></div>
            
            <button className="menu-item" onClick={() => {setShowMenu(false); onMenuToggle?.(false);}}>
              <span className="menu-icon">📊</span>
              My Analytics
            </button>
            
            <button className="menu-item" onClick={() => {setShowMenu(false); onMenuToggle?.(false);}}>
              <span className="menu-icon">⚙️</span>
              Settings
            </button>
            
            <button className="menu-item" onClick={() => {setShowMenu(false); onMenuToggle?.(false);}}>
              <span className="menu-icon">🎯</span>
              Mood Goals
            </button>
            
            <div className="menu-divider"></div>
            
            <button className="menu-item logout-item" onClick={handleLogout}>
              <span className="menu-icon">🚪</span>
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Overlay */}
      {showMenu && (
        <div 
          className="menu-overlay" 
          onClick={() => {setShowMenu(false); onMenuToggle?.(false);}}
        ></div>
      )}
    </>
  );
};

export default UserProfile;
