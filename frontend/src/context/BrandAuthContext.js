import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const BrandAuthContext = createContext(null);

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const useBrandAuth = () => {
  const context = useContext(BrandAuthContext);
  if (!context) {
    throw new Error('useBrandAuth must be used within a BrandAuthProvider');
  }
  return context;
};

export const BrandAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [brand, setBrand] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('brand_token'));
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
      const response = await axios.get(`${API_URL}/api/brand-admin/me`);
      setUser(response.data.user);
      setBrand(response.data.brand);
    } catch (error) {
      console.error('Failed to fetch brand profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/api/brand-admin/login`, { email, password });
    const { token: newToken, user: userData, brand: brandData } = response.data;
    localStorage.setItem('brand_token', newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(userData);
    setBrand(brandData);
    return response.data;
  };

  const register = async (data) => {
    const response = await axios.post(`${API_URL}/api/brand-admin/register`, data);
    const { token: newToken, user: userData, brand: brandData } = response.data;
    localStorage.setItem('brand_token', newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(userData);
    setBrand(brandData);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('brand_token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setBrand(null);
  };

  return (
    <BrandAuthContext.Provider value={{ 
      user, brand, token, loading, login, register, logout, 
      isAuthenticated: !!user,
      refreshProfile: fetchProfile
    }}>
      {children}
    </BrandAuthContext.Provider>
  );
};
