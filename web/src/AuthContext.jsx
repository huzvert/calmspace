import React, { createContext, useState, useEffect } from 'react';
import { API_ENDPOINTS } from './config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing auth on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedToken = localStorage.getItem('calmspace_token');
        const savedUser = localStorage.getItem('calmspace_user');

        if (savedToken && savedUser) {
          // Verify token is still valid by fetching user profile
          const response = await fetch(API_ENDPOINTS.PROFILE, {
            headers: {
              'Authorization': `Bearer ${savedToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setToken(savedToken);
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('calmspace_token');
            localStorage.removeItem('calmspace_user');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('calmspace_token');
        localStorage.removeItem('calmspace_user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('calmspace_token', authToken);
    localStorage.setItem('calmspace_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('calmspace_token');
    localStorage.removeItem('calmspace_user');
  };

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
    localStorage.setItem('calmspace_user', JSON.stringify(updatedUserData));
  };

  // Helper function to get user ID (for API calls)
  const getUserId = () => {
    return user?.id || null;
  };

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
    getUserId,
    getAuthHeaders
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
