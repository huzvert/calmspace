import React, { useState, useEffect, useCallback } from 'react';
// import { useMsal } from '@azure/msal-react';
import AuthButton from './AuthButton';
import { useSignalR } from './useSignalR';
import { API_ENDPOINTS } from './config';
import './App.css';

function App() {
  // const { accounts } = useMsal();
  // const accounts = []; // Temporary: disable MSAL for now
  const [selectedMood, setSelectedMood] = useState(null);
  const [isLogged, setIsLogged] = useState(false);
  const [stats, setStats] = useState(null);
  
  const moods = [
    { emoji: '😊', label: 'Happy', color: '#FFE5B4' },
    { emoji: '😌', label: 'Calm', color: '#E8F4FD' },
    { emoji: '😔', label: 'Sad', color: '#F0E6FF' },
    { emoji: '😰', label: 'Anxious', color: '#FFE5E5' },
    { emoji: '😴', label: 'Tired', color: '#E5F3E5' }
  ];

  // Get authenticated user ID
  const getUserId = useCallback(() => {
    // const accounts = []; // Temporary: disable MSAL for now
    // if (accounts.length > 0) {
    //   return accounts[0].localAccountId || accounts[0].homeAccountId;
    // }
    return 'demo-user'; // Fallback for demo purposes
  }, []);
  
  // Initialize SignalR connection
  const userId = getUserId();
  const { isConnected, messages } = useSignalR(userId);

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

  return (
    <div className="app">
      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <header className="hero">
        <AuthButton />
        <div className="hero-content">
          <h1 className="app-title">
            
            CalmSpace
          </h1>
          <p className="app-subtitle">Your peaceful sanctuary for mindful reflection</p>
        </div>
      </header>

      {/* Real-time Connection Status & Notifications */}
      <div className="realtime-status" style={{
        position: 'fixed',
        top: '70px',
        left: '20px',
        background: isConnected ? '#22c55e' : '#ef4444',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '12px',
        zIndex: 1000
      }}>
        {isConnected ? '🟢 Live - Connected' : '🔴 Disconnected'}
      </div>
      
      {/* Debug: Show message count */}
      <div style={{
        position: 'fixed',
        top: '110px',
        left: '20px',
        background: '#3b82f6',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '10px',
        fontSize: '10px',
        zIndex: 1000
      }}>
        Messages: {messages.length}
      </div>
      
      {messages.length > 0 && (
        <div className="realtime-notifications" style={{
          position: 'fixed',
          top: '150px',
          left: '20px',
          maxWidth: '300px',
          zIndex: 1000
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
