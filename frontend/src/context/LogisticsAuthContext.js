import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const LogisticsAuthContext = createContext(null);

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const useLogisticsAuth = () => {
  const context = useContext(LogisticsAuthContext);
  if (!context) {
    throw new Error('useLogisticsAuth must be used within a LogisticsAuthProvider');
  }
  return context;
};

export const LogisticsAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [partner, setPartner] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('logistics_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/logistics/me`);
      setUser(response.data.user);
      setPartner(response.data.partner);
    } catch (error) {
      console.error('Failed to fetch logistics profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/api/logistics/login`, { email, password });
    const { token: newToken, user: userData, partner: partnerData } = response.data;
    localStorage.setItem('logistics_token', newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(userData);
    setPartner(partnerData);
    return response.data;
  };

  const register = async (data) => {
    const response = await axios.post(`${API_URL}/api/logistics/register`, data);
    const { token: newToken, user: userData, partner: partnerData } = response.data;
    localStorage.setItem('logistics_token', newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(userData);
    setPartner(partnerData);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('logistics_token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setPartner(null);
  };

  return (
    <LogisticsAuthContext.Provider value={{ 
      user, partner, token, loading, login, register, logout, 
      isAuthenticated: !!user,
      refreshProfile: fetchProfile
    }}>
      {children}
    </LogisticsAuthContext.Provider>
  );
};
