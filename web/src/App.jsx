import React, { useState } from 'react';
import './App.css';

function App() {
  const [selectedMood, setSelectedMood] = useState(null);
  const [isLogged, setIsLogged] = useState(false);

  const moods = [
    { emoji: '😊', label: 'Happy', color: '#FFE5B4' },
    { emoji: '😌', label: 'Calm', color: '#E8F4FD' },
    { emoji: '😔', label: 'Sad', color: '#F0E6FF' },
    { emoji: '😰', label: 'Anxious', color: '#FFE5E5' },
    { emoji: '😴', label: 'Tired', color: '#E5F3E5' }
  ];

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
  };

  const handleLogMood = () => {
    if (selectedMood) {
      setIsLogged(true);
      setTimeout(() => {
        setIsLogged(false);
        setSelectedMood(null);
      }, 2000);
    }
  };

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
            <span className="meditation-icon">🧘</span>
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
              <div className="stat-number">7</div>
              <div className="stat-label">Days tracked</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">😊</div>
              <div className="stat-label">Most common</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">85%</div>
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