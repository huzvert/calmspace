import React, { useState, useEffect } from 'react';
import { useSignalR } from './useSignalR';
import { API_ENDPOINTS } from './config';
import { useAuth } from './useAuth';
import AuthPage from './AuthPage';
import UserProfile from './UserProfile';
import './App.css';

function App() {
  const { isAuthenticated, isLoading, login, getUserId } = useAuth();
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodNote, setMoodNote] = useState('');
  const [isLogged, setIsLogged] = useState(false);
  const [stats, setStats] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const moods = [
    { emoji: '😊', label: 'Happy', color: '#FFE5B4' },
    { emoji: '😌', label: 'Calm', color: '#E8F4FD' },
    { emoji: '😔', label: 'Sad', color: '#F0E6FF' },
    { emoji: '😰', label: 'Anxious', color: '#FFE5E5' },
    { emoji: '😴', label: 'Tired', color: '#E5F3E5' }
  ];

  // Initialize SignalR connection with authenticated user
  const userId = getUserId();
  const { isConnected, messages } = useSignalR(userId);

  // Initialize dark mode theme on app load
  useEffect(() => {
    const initializeDarkMode = async () => {
      // Always check localStorage first for immediate application
      const storedDarkMode = localStorage.getItem('calmspace-dark-mode') === 'true';
      
      // Apply immediately from localStorage
      if (storedDarkMode) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
      
      const userId = getUserId();
      
      if (userId) {
        try {
          // Try to sync with backend preference
          const response = await fetch(`${API_ENDPOINTS.GET_USER_SETTINGS}?userId=${userId}`);
          
          if (response.ok) {
            const text = await response.text();
            if (text.trim()) {
              const settings = JSON.parse(text);
              const backendDarkMode = settings.darkMode !== undefined ? settings.darkMode : false;
              
              // If backend differs from localStorage, use backend and update localStorage
              if (backendDarkMode !== storedDarkMode) {
                if (backendDarkMode) {
                  document.body.classList.add('dark-mode');
                } else {
                  document.body.classList.remove('dark-mode');
                }
                localStorage.setItem('calmspace-dark-mode', backendDarkMode.toString());
              }
            }
          }
          // If API fails, keep using localStorage preference (already applied above)
        } catch (error) {
          console.warn('Could not sync dark mode preference with backend:', error);
          // Keep using localStorage preference (already applied above)
        }
      }
      // If no user, localStorage preference is already applied above
    };

    if (isAuthenticated) {
      initializeDarkMode();
    } else {
      // For unauthenticated users, just use localStorage
      const storedDarkMode = localStorage.getItem('calmspace-dark-mode') === 'true';
      if (storedDarkMode) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    }
  }, [isAuthenticated, getUserId]);

  // Handle mood selection
  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
  };

  // Handle mood logging
  const handleLogMood = async () => {
    if (selectedMood) {
      setIsLogged(true);
      
      try {
        const payload = {
          mood: selectedMood.label.toLowerCase(),
          userId: getUserId(), // Use authenticated user ID
          timestamp: new Date().toISOString(),
          ...(moodNote.trim() && { note: moodNote.trim() }) // Include note if provided
        };
        
        console.log('Logging mood:', payload);
        
        const response = await fetch(API_ENDPOINTS.CREATE_MOOD, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          console.log('Mood logged successfully');
          
          // Wait a moment, then reset UI and fetch updated stats
          setTimeout(async () => {
            console.log('Resetting UI state');
            setIsLogged(false);
            setSelectedMood(null);
            setMoodNote(''); // Reset note field
            await fetchStats(); // re-fetch stats after logging
          }, 1500);
        } else {
          const errorText = await response.text();
          console.error('Failed to log mood:', response.statusText, errorText);
          setIsLogged(false);
        }
      } catch (error) {
        console.error('Error logging mood:', error);
        setIsLogged(false);
      }
    }
  };

  // Fetch stats from backend
  const fetchStats = async () => {
    try {
      const userId = getUserId();
      const response = await fetch(`${API_ENDPOINTS.GET_STATS}?userId=${userId}`);
      
      if (response.ok) {
        const stats = await response.json();
        setStats(stats);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch stats:', response.statusText, errorText);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    const loadInitialStats = async () => {
      try {
        const userId = getUserId();
        const response = await fetch(`${API_ENDPOINTS.GET_STATS}?userId=${userId}`);
        
        if (response.ok) {
          const stats = await response.json();
          setStats(stats);
        } else {
          console.error('Failed to fetch initial stats:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching initial stats:', error);
      }
    };

    loadInitialStats();
  }, [getUserId]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <h1 className="auth-title">🧘‍♀️ CalmSpace</h1>
              <p className="auth-subtitle">Loading your peaceful sanctuary...</p>
            </div>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={login} />;
  }

  return (
    <div className="app">
      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <header className="hero">
        <div className="hero-content">
          <h1 className="app-title">
            🧘‍♀️ CalmSpace
          </h1>
          <p className="app-subtitle">Your peaceful sanctuary for mindful reflection</p>
        </div>
      </header>

      {/* User Profile Component - Shows Welcome Banner and Hamburger Menu */}
      <UserProfile onMenuToggle={setIsMenuOpen} />

      {/* Real-time Connection Status & Notifications */}
      <div className="realtime-status" style={{
        position: 'fixed',
        top: '85px',
        left: isMenuOpen ? '340px' : '25px',
        background: isConnected ? '#22c55e' : '#ef4444',
        color: 'white',
        padding: '10px 18px',
        borderRadius: '25px',
        fontSize: '13px',
        fontWeight: '500',
        zIndex: isMenuOpen ? 998 : 1000,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        {isConnected ? '🟢 Live Connected' : '🔴 Disconnected'}
      </div>
      
      {/* Debug: Show message count */}
      <div style={{
        position: 'fixed',
        top: '130px',
        left: isMenuOpen ? '340px' : '25px',
        background: 'rgba(59, 130, 246, 0.9)',
        color: 'white',
        padding: '6px 12px',
        borderRadius: '15px',
        fontSize: '11px',
        fontWeight: '500',
        zIndex: isMenuOpen ? 998 : 1000,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        Messages: {messages.length}
      </div>
      
      {messages.length > 0 && (
        <div className="realtime-notifications" style={{
          position: 'fixed',
          top: '175px',
          left: isMenuOpen ? '340px' : '25px',
          maxWidth: '320px',
          zIndex: isMenuOpen ? 998 : 1000,
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {messages.slice(-3).map((msg, index) => (
            <div key={index} className={`notification ${msg.type}`} style={{
              background: '#4ade80',
              color: 'white',
              padding: '8px 12px',
              margin: '4px 0',
              borderRadius: '8px',
              fontSize: '12px'
            }}>
              <span className="notification-time">
                {msg.timestamp.toLocaleTimeString()}
              </span>
              <br />
              <span className="notification-message">
                {msg.data.message || JSON.stringify(msg.data)}
              </span>
            </div>
          ))}
        </div>
      )}

      <main className="main-content">
        <section className="mood-log">
          <h2 className="section-title">How are you feeling today?</h2>

          <div className="mood-selector">
            {moods.map((mood, index) => (
              <div
                key={index}
                className={`mood-card ${selectedMood?.label === mood.label ? 'selected' : ''}`}
                onClick={() => handleMoodSelect(mood)}
                style={{ '--mood-color': mood.color }}
              >
                <div className="mood-emoji">{mood.emoji}</div>
                <div className="mood-label">{mood.label}</div>
              </div>
            ))}
          </div>

          {/* Optional Journal Note */}
          <div className="journal-note">
            <label htmlFor="mood-note" className="note-label">
              📝 Add a note (optional)
            </label>
            <textarea
              id="mood-note"
              className="note-input"
              value={moodNote}
              onChange={(e) => setMoodNote(e.target.value)}
              placeholder="How was your day? What made you feel this way? (optional)"
              rows="3"
              maxLength="500"
              disabled={isLogged}
            />
            <div className="character-count">
              {moodNote.length}/500 characters
            </div>
          </div>

          <button
            className={`log-btn ${selectedMood ? 'active' : ''} ${isLogged ? 'logged' : ''}`}
            onClick={handleLogMood}
            disabled={!selectedMood || isLogged}
          >
            {isLogged ? '✓ Logged!' : selectedMood ? `Log ${selectedMood.label} Mood` : 'Select a mood first'}
          </button>
        </section>

        <section className="stats-preview">
          <h3 className="stats-title">Your Mood Journey</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{stats?.daysTracked ?? '-'}</div>
              <div className="stat-label">Days tracked</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats?.mostCommonMood ?? '-'}</div>
              <div className="stat-label">Most common</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">
                {stats?.positiveDaysPercentage != null ? `${stats.positiveDaysPercentage}%` : '-'}
              </div>
              <div className="stat-label">Positive days</div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>Crafted with 💙 by Huzaifa</p>
        <p className="footer-quote">"Peace comes from within. Do not seek it without." - Buddha</p>
      </footer>
    </div>
  );
}

export default App;
