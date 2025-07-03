import React, { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from './config';
import { useAuth } from './useAuth';

const MoodAnalytics = ({ onClose }) => {
  const { getUserId } = useAuth();
  const [stats, setStats] = useState(null);
  const [moodEntries, setMoodEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7'); // Default to 7 days

  const moodEmojis = {
    happy: '😊',
    calm: '😌',
    sad: '😔',
    anxious: '😰',
    tired: '😴'
  };

  const moodColors = {
    happy: '#FFE5B4',
    calm: '#E8F4FD',
    sad: '#F0E6FF',
    anxious: '#FFE5E5',
    tired: '#E5F3E5'
  };

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userId = getUserId();
      
      // Fetch stats
      const statsResponse = await fetch(`${API_ENDPOINTS.GET_STATS}?userId=${userId}`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch mood entries for the selected time range
      const entriesResponse = await fetch(`${API_ENDPOINTS.GET_MOOD_HISTORY}?userId=${userId}&limit=100`);
      if (entriesResponse.ok) {
        const entriesData = await entriesResponse.json();
        
        // Filter entries based on time range
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeRange));
        
        const filteredEntries = entriesData.entries.filter(entry => 
          new Date(entry.timestamp) >= cutoffDate
        );
        
        setMoodEntries(filteredEntries);
      }
    } catch (err) {
      setError(`Error fetching analytics: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [getUserId, timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const getMoodDistribution = () => {
    const distribution = {};
    moodEntries.forEach(entry => {
      const mood = entry.mood.toLowerCase();
      distribution[mood] = (distribution[mood] || 0) + 1;
    });
    return distribution;
  };

  const getDailyMoodTrend = () => {
    const dailyMoods = {};
    
    moodEntries.forEach(entry => {
      const date = entry.timestamp.split('T')[0];
      if (!dailyMoods[date]) {
        dailyMoods[date] = [];
      }
      dailyMoods[date].push(entry.mood.toLowerCase());
    });

    // Convert to trend data with mood scores
    const moodScores = { happy: 5, calm: 4, tired: 3, sad: 2, anxious: 1 };
    
    return Object.entries(dailyMoods)
      .map(([date, moods]) => {
        const avgScore = moods.reduce((sum, mood) => sum + (moodScores[mood] || 3), 0) / moods.length;
        return { date, score: avgScore, count: moods.length };
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const renderMoodDistributionChart = () => {
    const distribution = getMoodDistribution();
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    
    if (total === 0) return <p>No mood data available for this period.</p>;

    return (
      <div className="mood-distribution-chart">
        {Object.entries(distribution).map(([mood, count]) => {
          const percentage = ((count / total) * 100).toFixed(1);
          return (
            <div key={mood} className="mood-bar-container">
              <div className="mood-bar-label">
                <span className="mood-emoji">{moodEmojis[mood]}</span>
                <span className="mood-name">{mood}</span>
                <span className="mood-percentage">{percentage}%</span>
              </div>
              <div className="mood-bar-track">
                <div 
                  className="mood-bar-fill"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: moodColors[mood]
                  }}
                ></div>
              </div>
              <div className="mood-count">{count} entries</div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTrendChart = () => {
    const trendData = getDailyMoodTrend();
    
    if (trendData.length === 0) return <p>No trend data available.</p>;

    const maxScore = 5;
    const minScore = 1;
    
    return (
      <div className="trend-chart">
        <div className="trend-chart-container">
          {trendData.map((day) => {
            const height = ((day.score - minScore) / (maxScore - minScore)) * 100;
            const date = new Date(day.date);
            const isToday = date.toDateString() === new Date().toDateString();
            
            return (
              <div key={day.date} className="trend-bar-container">
                <div className="trend-bar-wrapper">
                  <div 
                    className={`trend-bar ${isToday ? 'today' : ''}`}
                    style={{ height: `${height}%` }}
                    title={`${day.date}: Score ${day.score.toFixed(1)} (${day.count} entries)`}
                  ></div>
                </div>
                <div className="trend-date">
                  {date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="trend-legend">
          <div className="trend-legend-item">
            <div className="legend-color" style={{ backgroundColor: '#22c55e' }}></div>
            <span>Higher mood (5)</span>
          </div>
          <div className="trend-legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ef4444' }}></div>
            <span>Lower mood (1)</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="analytics-overlay">
      <div className="analytics-modal">
        <div className="analytics-header">
          <h2>📊 Mood Analytics</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="analytics-filters">
          <label htmlFor="time-range">Time Range:</label>
          <select
            id="time-range"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 2 weeks</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
          </select>
        </div>

        <div className="analytics-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading analytics...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>❌ {error}</p>
              <button onClick={fetchAnalytics}>Try Again</button>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="analytics-summary">
                <div className="summary-card">
                  <div className="summary-number">{stats?.daysTracked || 0}</div>
                  <div className="summary-label">Days Tracked</div>
                </div>
                <div className="summary-card">
                  <div className="summary-number">{moodEntries.length}</div>
                  <div className="summary-label">Total Entries</div>
                </div>
                <div className="summary-card">
                  <div className="summary-number">
                    {stats?.positiveDaysPercentage || 0}%
                  </div>
                  <div className="summary-label">Positive Days</div>
                </div>
                <div className="summary-card">
                  <div className="summary-number">{stats?.mostCommonMood || '-'}</div>
                  <div className="summary-label">Most Common</div>
                </div>
              </div>

              {/* Mood Distribution Chart */}
              <div className="chart-section">
                <h3>Mood Distribution</h3>
                {renderMoodDistributionChart()}
              </div>

              {/* Daily Trend Chart */}
              <div className="chart-section">
                <h3>Daily Mood Trend</h3>
                <p className="chart-description">
                  Your mood scores over time (1=Low, 5=High)
                </p>
                {renderTrendChart()}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoodAnalytics;
