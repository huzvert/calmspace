import React, { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from './config';
import { useAuth } from './useAuth';

const MoodHistory = ({ onClose }) => {
  const { getUserId } = useAuth();
  const [moodEntries, setMoodEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

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

  const fetchMoodHistory = useCallback(async (resetData = false, dateFilter = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const userId = getUserId();
      const currentOffset = resetData ? 0 : offset;
      
      let url = `${API_ENDPOINTS.GET_MOOD_HISTORY}?userId=${userId}&limit=20&offset=${currentOffset}`;
      if (dateFilter) {
        url += `&date=${dateFilter}`;
      }

      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        
        if (resetData) {
          setMoodEntries(data.entries);
          setOffset(20);
        } else {
          setMoodEntries(prev => [...prev, ...data.entries]);
          setOffset(prev => prev + 20);
        }
        
        setHasMore(data.hasMore);
      } else {
        const errorText = await response.text();
        setError(`Failed to fetch mood history: ${errorText}`);
      }
    } catch (err) {
      setError(`Error fetching mood history: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [getUserId, offset]);

  useEffect(() => {
    fetchMoodHistory(true);
  }, [fetchMoodHistory]);

  const handleDateFilter = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    setOffset(0);
    fetchMoodHistory(true, date);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchMoodHistory(false, selectedDate);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const groupEntriesByDate = (entries) => {
    const grouped = {};
    entries.forEach(entry => {
      const dateKey = entry.date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(entry);
    });
    return grouped;
  };

  const groupedEntries = groupEntriesByDate(moodEntries);

  return (
    <div className="mood-history-overlay">
      <div className="mood-history-modal">
        <div className="mood-history-header">
          <h2>📖 Your Mood Journal</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="mood-history-filters">
          <label htmlFor="date-filter">Filter by date:</label>
          <input
            type="date"
            id="date-filter"
            value={selectedDate}
            onChange={handleDateFilter}
            className="date-filter-input"
          />
          {selectedDate && (
            <button 
              className="clear-filter-btn"
              onClick={() => {
                setSelectedDate('');
                setOffset(0);
                fetchMoodHistory(true);
              }}
            >
              Clear Filter
            </button>
          )}
        </div>

        <div className="mood-history-content">
          {loading && moodEntries.length === 0 ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading your mood history...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>❌ {error}</p>
              <button onClick={() => fetchMoodHistory(true, selectedDate)}>
                Try Again
              </button>
            </div>
          ) : moodEntries.length === 0 ? (
            <div className="empty-state">
              <p>📝 No mood entries found.</p>
              <p>Start logging your moods to see them here!</p>
            </div>
          ) : (
            <div className="mood-entries">
              {Object.entries(groupedEntries).map(([dateKey, entries]) => (
                <div key={dateKey} className="date-group">
                  <h3 className="date-header">
                    {formatTimestamp(entries[0].timestamp).date}
                  </h3>
                  {entries.map((entry) => {
                    const formatted = formatTimestamp(entry.timestamp);
                    return (
                      <div 
                        key={entry.id} 
                        className="mood-entry"
                        style={{ 
                          '--mood-color': moodColors[entry.mood.toLowerCase()] || '#f0f0f0' 
                        }}
                      >
                        <div className="mood-entry-header">
                          <div className="mood-info">
                            <span className="mood-emoji">
                              {moodEmojis[entry.mood.toLowerCase()] || '❓'}
                            </span>
                            <span className="mood-name">{entry.mood}</span>
                          </div>
                          <span className="mood-time">{formatted.time}</span>
                        </div>
                        {entry.note && (
                          <div className="mood-note">
                            <p>"{entry.note}"</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
              
              {hasMore && (
                <button 
                  className="load-more-btn"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoodHistory;
