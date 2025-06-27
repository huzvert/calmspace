import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
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
          userId: 'user123', // You can make this dynamic later
          timestamp: new Date().toISOString(),
        };
        
        const response = await fetch('http://localhost:7071/api/CreateMoodEntry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          // Wait a moment, then fetch updated stats
          setTimeout(async () => {
            setIsLogged(false);
            setSelectedMood(null);
            await fetchStats(); // re-fetch stats after logging
          }, 1000);
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
      const response = await fetch('http://localhost:7071/api/GetMoodStats?userId=user123');
      
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
        const response = await fetch('http://localhost:7071/api/GetMoodStats?userId=user123');
        
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
  }, []);

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
            
            CalmSpace
          </h1>
          <p className="app-subtitle">Your peaceful sanctuary for mindful reflection</p>
        </div>
      </header>

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
