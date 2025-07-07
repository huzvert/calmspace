import React, { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from './config';
import { useAuth } from './useAuth';

const Settings = ({ onClose }) => {
  const { user, getUserId } = useAuth();
  const [settings, setSettings] = useState({
    displayName: '',
    reminderTime: '08:00',
    darkMode: false,
    notificationsEnabled: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');

  // Schedule daily notification
  const scheduleNotification = useCallback((reminderTime) => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return;
    }

    // Setup daily reminder using setTimeout
    const setupDailyReminder = (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hours, minutes, 0, 0);

      // If the time has passed today, schedule for tomorrow
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      const timeUntilReminder = scheduledTime.getTime() - now.getTime();

      setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification('CalmSpace Reminder', {
            body: '🌟 Time to log your mood! How are you feeling today?',
            icon: '/vite.svg',
            tag: 'mood-reminder',
            requireInteraction: true
          });
        }

        // Schedule the next day's reminder
        setupDailyReminder(time);
      }, timeUntilReminder);

      console.log(`Next mood reminder scheduled for: ${scheduledTime.toLocaleString()}`);
    };

    // Request permission if not granted
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          setupDailyReminder(reminderTime);
        }
      });
    } else if (Notification.permission === 'granted') {
      setupDailyReminder(reminderTime);
    }
  }, []);

  // Disable background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Load user settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const userId = getUserId();
        if (!userId) {
          console.warn('No user ID available');
          // Try to load from localStorage as fallback
          const storedDarkMode = localStorage.getItem('calmspace-dark-mode') === 'true';
          setSettings(prev => ({ ...prev, darkMode: storedDarkMode }));
          
          // Apply dark mode from localStorage
          if (storedDarkMode) {
            document.body.classList.add('dark-mode');
          } else {
            document.body.classList.remove('dark-mode');
          }
          
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_ENDPOINTS.GET_USER_SETTINGS}?userId=${userId}`);
        
        if (response.ok) {
          const text = await response.text();
          if (text.trim()) {
            const data = JSON.parse(text);
            const newSettings = {
              displayName: data.displayName || user?.name || '',
              reminderTime: data.reminderTime || '08:00',
              darkMode: data.darkMode !== undefined ? data.darkMode : false,
              notificationsEnabled: data.notificationsEnabled !== undefined ? data.notificationsEnabled : true
            };
            setSettings(newSettings);
            
            // Apply dark mode immediately and ensure persistence
            if (newSettings.darkMode) {
              document.body.classList.add('dark-mode');
            } else {
              document.body.classList.remove('dark-mode');
            }
            
            // Update localStorage for fallback
            localStorage.setItem('calmspace-dark-mode', newSettings.darkMode.toString());

            // Setup notifications if enabled
            if (newSettings.notificationsEnabled && newSettings.reminderTime) {
              scheduleNotification(newSettings.reminderTime);
            }
          } else {
            // Empty response, use defaults with localStorage fallback for dark mode
            const storedDarkMode = localStorage.getItem('calmspace-dark-mode') === 'true';
            setSettings(prev => ({
              ...prev,
              displayName: user?.name || '',
              darkMode: storedDarkMode
            }));
            
            // Apply the stored dark mode preference
            if (storedDarkMode) {
              document.body.classList.add('dark-mode');
            } else {
              document.body.classList.remove('dark-mode');
            }
          }
        } else {
          console.warn('Failed to load settings:', response.status);
          // Use localStorage fallback for dark mode
          const storedDarkMode = localStorage.getItem('calmspace-dark-mode') === 'true';
          setSettings(prev => ({
            ...prev,
            displayName: user?.name || '',
            darkMode: storedDarkMode
          }));
          
          // Apply the stored dark mode preference
          if (storedDarkMode) {
            document.body.classList.add('dark-mode');
          } else {
            document.body.classList.remove('dark-mode');
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setMessage('❌ Failed to load settings');
        
        // Use localStorage fallback for dark mode on error
        const storedDarkMode = localStorage.getItem('calmspace-dark-mode') === 'true';
        setSettings(prev => ({
          ...prev,
          displayName: user?.name || '',
          darkMode: storedDarkMode
        }));
        
        // Apply the stored dark mode preference
        if (storedDarkMode) {
          document.body.classList.add('dark-mode');
        } else {
          document.body.classList.remove('dark-mode');
        }
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [getUserId, user, scheduleNotification]);

  const handleSaveSettings = async () => {
    setSaving(true);
    setMessage('');

    try {
      const userId = getUserId();
      const response = await fetch(API_ENDPOINTS.SAVE_USER_SETTINGS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...settings
        }),
      });

      if (response.ok) {
        setMessage('✅ Settings saved successfully!');
        
        // Apply dark mode immediately
        if (settings.darkMode) {
          document.body.classList.add('dark-mode');
        } else {
          document.body.classList.remove('dark-mode');
        }
        
        // Update localStorage for persistence
        localStorage.setItem('calmspace-dark-mode', settings.darkMode.toString());
        
        // Schedule notification if enabled
        if (settings.notificationsEnabled && settings.reminderTime) {
          scheduleNotification(settings.reminderTime);
        }
        
        setTimeout(() => setMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setMessage(`❌ Failed to save settings: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('❌ Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Handle dark mode toggle with immediate application
  const handleDarkModeToggle = useCallback((enabled) => {
    // Update local state
    setSettings(prev => ({ ...prev, darkMode: enabled }));
    
    // Apply theme immediately for instant feedback
    if (enabled) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    // Persist to localStorage immediately
    localStorage.setItem('calmspace-dark-mode', enabled.toString());
    
    // Auto-save the preference to backend (non-blocking)
    const userId = getUserId();
    if (userId) {
      const updatedSettings = { ...settings, darkMode: enabled };
      fetch(API_ENDPOINTS.SAVE_USER_SETTINGS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...updatedSettings })
      }).catch(error => {
        console.warn('Failed to auto-save dark mode preference:', error);
      });
    }
  }, [settings, getUserId]);

  const handleDeleteAllMoods = async () => {
    setDeleting(true);
    setMessage('');

    try {
      const userId = getUserId();
      const response = await fetch(API_ENDPOINTS.DELETE_ALL_MOOD_ENTRIES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(`✅ ${data.message}`);
        setShowDeleteConfirm(false);
        setTimeout(() => setMessage(''), 5000);
      } else {
        const errorData = await response.json();
        setMessage(`❌ Failed to delete entries: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error deleting mood entries:', error);
      setMessage('❌ Failed to delete mood entries');
    } finally {
      setDeleting(false);
    }
  };

  const handleResetToDefault = useCallback(() => {
    const defaultSettings = {
      displayName: user?.name || '',
      reminderTime: '08:00',
      darkMode: false,
      notificationsEnabled: true
    };
    
    setSettings(defaultSettings);
    
    // Apply dark mode reset immediately
    document.body.classList.remove('dark-mode');
    
    // Update localStorage
    localStorage.setItem('calmspace-dark-mode', 'false');
    
    // Auto-save to backend
    const userId = getUserId();
    if (userId) {
      fetch(API_ENDPOINTS.SAVE_USER_SETTINGS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...defaultSettings })
      }).catch(error => {
        console.warn('Failed to auto-save reset settings:', error);
      });
    }
    
    setMessage('⚡ Settings reset to default');
    setTimeout(() => setMessage(''), 3000);
  }, [user, getUserId]);

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="settings-overlay">
        <div className="settings-modal">
          <div className="settings-header">
            <h2>⚙️ Settings</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="settings-content">
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading your settings...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>⚙️ Settings</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="settings-content">
          {message && (
            <div className="settings-message">
              {message}
            </div>
          )}

          {/* Personal Settings Section */}
          <div className="settings-section">
            <h3>👤 Personal Information</h3>
            <div className="settings-card">
              <div className="setting-item">
                <label htmlFor="displayName">Display Name</label>
                <input
                  type="text"
                  id="displayName"
                  value={settings.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  placeholder="Enter your display name"
                  className="setting-input"
                />
                <p className="setting-description">This is how your name appears in the app</p>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="settings-section">
            <h3>🔔 Notifications</h3>
            <div className="settings-card">
              <div className="setting-item">
                <label htmlFor="reminderTime">Daily Mood Reminder</label>
                <input
                  type="time"
                  id="reminderTime"
                  value={settings.reminderTime}
                  onChange={(e) => handleInputChange('reminderTime', e.target.value)}
                  className="setting-input"
                />
                <p className="setting-description">When would you like to be reminded to log your mood?</p>
              </div>

              <div className="setting-item">
                <div className="toggle-setting" onClick={() => handleInputChange('notificationsEnabled', !settings.notificationsEnabled)}>
                  <label htmlFor="notificationsEnabled">Enable Notifications</label>
                  <div className="toggle-wrapper">
                    <input
                      type="checkbox"
                      id="notificationsEnabled"
                      checked={settings.notificationsEnabled}
                      onChange={(e) => handleInputChange('notificationsEnabled', e.target.checked)}
                      className="toggle-input"
                    />
                    <span className="toggle-slider"></span>
                  </div>
                </div>
                <p className="setting-description">Receive daily reminders and mood insights</p>
                
                {/* Test notification button */}
                <button 
                  onClick={() => {
                    if (Notification.permission === 'granted') {
                      new Notification('CalmSpace Test', {
                        body: '🧪 Test notification working! Your reminders are set up correctly.',
                        icon: '/vite.svg'
                      });
                    } else {
                      Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                          new Notification('CalmSpace Test', {
                            body: '🧪 Test notification working! Your reminders are set up correctly.',
                            icon: '/vite.svg'
                          });
                        }
                      });
                    }
                  }}
                  className="test-notification-btn"
                  style={{
                    marginTop: '10px',
                    padding: '8px 16px',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  🧪 Test Notification
                </button>
              </div>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="settings-section">
            <h3>🎨 Appearance</h3>
            <div className="settings-card">
              <div className="setting-item">
                <div className="toggle-setting" onClick={() => handleDarkModeToggle(!settings.darkMode)}>
                  <label htmlFor="darkMode">Dark Mode</label>
                  <div className="toggle-wrapper">
                    <input
                      type="checkbox"
                      id="darkMode"
                      checked={settings.darkMode}
                      onChange={(e) => handleDarkModeToggle(e.target.checked)}
                      className="toggle-input"
                    />
                    <span className="toggle-slider"></span>
                  </div>
                </div>
                <p className="setting-description">Toggle between light and dark theme</p>
              </div>
            </div>
          </div>

          {/* Data Management Section */}
          <div className="settings-section">
            <h3>🗂️ Data Management</h3>
            <div className="settings-card">
              <div className="setting-item">
                <label>Mood Data</label>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="delete-data-btn"
                  disabled={deleting}
                >
                  🗑️ Delete All Mood Entries
                </button>
                <p className="setting-description danger">
                  ⚠️ This action cannot be undone. All your mood history will be permanently deleted.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="settings-actions">
            <button
              onClick={handleResetToDefault}
              className="reset-btn"
              disabled={saving}
            >
              🔄 Reset to Default
            </button>
            <button
              onClick={handleSaveSettings}
              className="save-btn"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="loading-spinner small"></span>
                  Saving...
                </>
              ) : (
                '💾 Save Settings'
              )}
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="confirm-overlay">
            <div className="confirm-modal">
              <h3>⚠️ Confirm Deletion</h3>
              <p>Are you sure you want to delete ALL your mood entries? This action cannot be undone.</p>
              <div className="confirm-actions">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="cancel-btn"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAllMoods}
                  className="confirm-delete-btn"
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <span className="loading-spinner small"></span>
                      Deleting...
                    </>
                  ) : (
                    'Yes, Delete All'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
