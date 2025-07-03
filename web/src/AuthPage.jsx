import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from './config';

const AuthPage = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    email: '',
    password: '',
    name: '',
    username: '',
    confirmPassword: ''
  });

  // Check for small screen and adjust layout
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerHeight < 700);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    window.addEventListener('orientationchange', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
      window.removeEventListener('orientationchange', checkScreenSize);
    };
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const validateForm = () => {
    if (isLogin) {
      if (!formData.emailOrUsername || !formData.password) {
        setError('Email/username and password are required');
        return false;
      }
    } else {    if (!formData.email || !formData.password || !formData.name || !formData.username) {
      setError('Email, password, name, and username are all required');
      return false;
    }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? API_ENDPOINTS.LOGIN : API_ENDPOINTS.REGISTER;
      const payload = isLogin 
        ? { 
            ...(formData.emailOrUsername.includes('@') 
              ? { email: formData.emailOrUsername } 
              : { username: formData.emailOrUsername }
            ),
            password: formData.password 
          }
        : { 
            email: formData.email, 
            password: formData.password, 
            name: formData.name,
            username: formData.username || null
          };

      console.log('Sending request to:', endpoint, 'with payload:', payload);

      console.log('Auth attempt:', { isLogin, endpoint, payload });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        console.log('Response text:', await response.text());
        throw new Error('Server returned invalid JSON response');
      }

      console.log('Auth response:', { 
        status: response.status, 
        ok: response.ok,
        url: response.url,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data 
      });

      if (response.ok) {
        // Store token and user info
        localStorage.setItem('calmspace_token', data.token);
        localStorage.setItem('calmspace_user', JSON.stringify(data.user));
        
        // Call success callback
        onAuthSuccess(data.user, data.token);
      } else {
        console.error('Auth error:', { status: response.status, statusText: response.statusText, data });
        // Show more detailed error message
        const errorMessage = data.error || data.message || `Authentication failed (${response.status}: ${response.statusText})`;
        const detailsMessage = data.details ? `\nDetails: ${data.details}` : '';
        setError(errorMessage + detailsMessage);
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({
      emailOrUsername: '',
      email: '',
      password: '',
      name: '',
      username: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>

      <div className={`auth-container ${isSmallScreen ? 'small-screen' : ''}`}>
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">
              🧘‍♀️ CalmSpace
            </h1>
            <p className="auth-subtitle">
              {isLogin ? 'Welcome back to your peaceful sanctuary' : 'Join your mindful community'}
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Choose a unique username"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                </div>
              </>
            )}

            {isLogin && (
              <div className="form-group">
                <label htmlFor="emailOrUsername">Email or Username</label>
                <input
                  type="text"
                  id="emailOrUsername"
                  name="emailOrUsername"
                  value={formData.emailOrUsername}
                  onChange={handleInputChange}
                  placeholder="Enter your email or username"
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={isLogin ? "Enter your password" : "Create a password (min 6 characters)"}
                disabled={isLoading}
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  disabled={isLoading}
                />
              </div>
            )}

            {error && (
              <div className="auth-error">
                ⚠️ {error}
              </div>
            )}

            <button 
              type="submit" 
              className="auth-submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <span>
                  <span className="loading-spinner"></span>
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                isLogin ? '🔐 Sign In' : '✨ Create Account'
              )}
            </button>
          </form>

          <div className="auth-switch">
            <p>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button 
                type="button" 
                className="switch-btn" 
                onClick={switchMode}
                disabled={isLoading}
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>

          <div className="auth-features">
            <div className="feature">
              <span className="feature-icon">🔒</span>
              <span>Secure & Private</span>
            </div>
            <div className="feature">
              <span className="feature-icon">📊</span>
              <span>Personal Analytics</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🔔</span>
              <span>Real-time Updates</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
