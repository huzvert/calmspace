import React, { useState, useEffect } from 'react';
import { RadialBarChart, RadialBar, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { API_ENDPOINTS } from './config';
import { useAuth } from './useAuth';

const MoodGoals = ({ onClose }) => {
  const { getUserId } = useAuth();
  const [goals, setGoals] = useState([
    { id: 1, title: 'Log mood daily', target: 7, current: 3, completed: false },
    { id: 2, title: 'Have 5 positive days', target: 5, current: 2, completed: false },
    { id: 3, title: 'Write 3 journal entries', target: 3, current: 1, completed: false }
  ]);

  const [newGoal, setNewGoal] = useState({ title: '', target: 1 });
  const [moodData, setMoodData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Disable background scrolling when modal is open
  useEffect(() => {
    // Disable scrolling
    document.body.style.overflow = 'hidden';
    
    // Cleanup: re-enable scrolling when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Fetch mood data for visualizations
  useEffect(() => {
    const fetchMoodData = async () => {
      try {
        const userId = getUserId();
        const response = await fetch(`${API_ENDPOINTS.GET_MOOD_HISTORY}?userId=${userId}&limit=30`);
        
        if (response.ok) {
          const data = await response.json();
          setMoodData(data.entries || []);
        }
      } catch (error) {
        console.error('Error fetching mood data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMoodData();
  }, [getUserId]);

  const addGoal = () => {
    if (newGoal.title.trim()) {
      setGoals([...goals, {
        id: Date.now(),
        title: newGoal.title,
        target: newGoal.target,
        current: 0,
        completed: false
      }]);
      setNewGoal({ title: '', target: 1 });
    }
  };

  const updateGoal = (id, current) => {
    setGoals(goals.map(goal => {
      if (goal.id === id) {
        return { ...goal, current, completed: current >= goal.target };
      }
      return goal;
    }));
  };

  const deleteGoal = (id) => {
    setGoals(goals.filter(goal => goal.id !== id));
  };

  // Calculate mood statistics for visualizations
  const getMoodStats = () => {
    const moodCounts = {};
    const recentDays = 7;
    const recentMoods = moodData.slice(0, recentDays);
    
    recentMoods.forEach(entry => {
      const mood = entry.mood.toLowerCase();
      moodCounts[mood] = (moodCounts[mood] || 0) + 1;
    });

    return Object.entries(moodCounts).map(([mood, count], index) => ({
      name: mood.charAt(0).toUpperCase() + mood.slice(1),
      value: count,
      fill: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][index % 5]
    }));
  };

  // Create data for radial progress charts
  const getGoalProgressData = (goal) => {
    const percentage = Math.min((goal.current / goal.target) * 100, 100);
    return [
      {
        name: goal.title,
        value: percentage,
        fill: goal.completed ? '#4ECDC4' : percentage > 70 ? '#FFEAA7' : '#FF6B6B'
      }
    ];
  };

  // Get encouraging message based on overall progress
  const getEncouragingMessage = () => {
    const completedGoals = goals.filter(g => g.completed).length;
    const totalGoals = goals.length;
    const overallProgress = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

    if (overallProgress === 100) {
      return "🎉 Amazing! You've completed all your goals!";
    } else if (overallProgress >= 75) {
      return "🌟 You're doing fantastic! Almost there!";
    } else if (overallProgress >= 50) {
      return "💪 Great progress! Keep up the good work!";
    } else if (overallProgress >= 25) {
      return "🌱 You're on the right track! Every step counts!";
    } else {
      return "🚀 Your journey begins now! You've got this!";
    }
  };

  return (
    <div className="goals-overlay">
      <div className="goals-modal">
        <div className="goals-header">
          <h2>🎯 Your Mood Goals</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="goals-content">
          {/* Encouraging Message */}
          <div className="encouraging-message">
            <p>{getEncouragingMessage()}</p>
          </div>

          {/* Mood Analytics Section */}
          {!loading && moodData.length > 0 && (
            <div className="mood-analytics-section">
              <h3>📊 Your Recent Mood Pattern</h3>
              <div className="charts-container">
                <div className="chart-item">
                  <h4>Last 7 Days Overview</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={getMoodStats()}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {getMoodStats().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Goals Progress Visualization */}
          <div className="goals-progress-section">
            <h3>🎯 Goals Progress</h3>
            <div className="progress-charts">
              {goals.map(goal => (
                <div key={goal.id} className="goal-progress-chart">
                  <h4>{goal.title}</h4>
                  <ResponsiveContainer width="100%" height={150}>
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="40%"
                      outerRadius="80%"
                      barSize={10}
                      data={getGoalProgressData(goal)}
                    >
                      <RadialBar
                        minAngle={15}
                        label={{ position: 'insideStart', fill: '#fff' }}
                        background
                        clockWise
                        dataKey="value"
                      />
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="progress-label">
                        {goal.current}/{goal.target}
                      </text>
                    </RadialBarChart>
                  </ResponsiveContainer>
                  {goal.completed && <div className="completed-badge">✅ Completed!</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="add-goal-section">
            <h3>Set a New Goal</h3>
            <div className="add-goal-form">
              <input
                type="text"
                placeholder="Enter your goal..."
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                className="goal-input"
              />
              <input
                type="number"
                min="1"
                max="100"
                value={newGoal.target}
                onChange={(e) => setNewGoal({ ...newGoal, target: parseInt(e.target.value) })}
                className="goal-target"
              />
              <button onClick={addGoal} className="add-goal-btn">Add Goal</button>
            </div>
          </div>

          <div className="goals-list">
            <h3>Your Goals</h3>
            {goals.length === 0 ? (
              <p className="no-goals">No goals set yet. Add one above!</p>
            ) : (
              goals.map(goal => (
                <div key={goal.id} className={`goal-item ${goal.completed ? 'completed' : ''}`}>
                  <div className="goal-info">
                    <h4>{goal.title}</h4>
                    <div className="goal-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${(goal.current / goal.target) * 100}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">
                        {goal.current}/{goal.target}
                      </span>
                    </div>
                  </div>
                  <div className="goal-actions">
                    <button 
                      onClick={() => updateGoal(goal.id, Math.min(goal.current + 1, goal.target))}
                      disabled={goal.completed}
                      className="increment-btn"
                    >
                      +
                    </button>
                    <button 
                      onClick={() => updateGoal(goal.id, Math.max(goal.current - 1, 0))}
                      disabled={goal.current === 0}
                      className="decrement-btn"
                    >
                      -
                    </button>
                    <button 
                      onClick={() => deleteGoal(goal.id)}
                      className="delete-btn"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodGoals;
