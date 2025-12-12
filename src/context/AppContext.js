import React, { createContext, useContext, useState, useEffect } from 'react';
import { hotelsAPI, usageAPI } from '../services/api';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Hotels state
  const [hotels, setHotels] = useState([]);
  const [hotelsLoading, setHotelsLoading] = useState(false);

  // Usage state
  const [usage, setUsage] = useState({
    daily: { used: 0, limit: 1500 },
    monthly: { used: 0, limit: 45000 },
    yearly: { used: 0, limit: 547500 },
    total: 0,
  });

  // Check auth on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  // Login function
  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  // Fetch hotels
  const fetchHotels = async () => {
    setHotelsLoading(true);
    try {
      const response = await hotelsAPI.getAll();
      setHotels(response.data.hotels || []);
    } catch (error) {
      console.error('Failed to fetch hotels:', error);
    } finally {
      setHotelsLoading(false);
    }
  };

  // Fetch usage
  const fetchUsage = async () => {
    try {
      const response = await usageAPI.getStats();
      if (response.data) {
        setUsage({
          daily: {
            used: response.data.daily_count || 0,
            limit: response.data.daily_limit || 1500,
          },
          monthly: {
            used: response.data.monthly_count || 0,
            limit: response.data.monthly_limit || 45000,
          },
          yearly: {
            used: response.data.yearly_count || 0,
            limit: response.data.yearly_limit || 547500,
          },
          total: response.data.total_count || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    }
  };

  // Load initial data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchHotels();
      fetchUsage();
    }
  }, [isAuthenticated]);

  const value = {
    // Auth
    isAuthenticated,
    user,
    login,
    logout,
    // Hotels
    hotels,
    hotelsLoading,
    fetchHotels,
    setHotels,
    // Usage
    usage,
    fetchUsage,
    setUsage,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;
