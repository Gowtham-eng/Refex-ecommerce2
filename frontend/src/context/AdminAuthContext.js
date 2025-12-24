import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AdminAuthContext = createContext(null);

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [brand, setBrand] = useState(null);
  const [role, setRole] = useState(null); // 'super_admin' or 'brand_admin'
  const [token, setToken] = useState(localStorage.getItem('admin_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Try to get stored user data
      const storedUser = localStorage.getItem('admin_user');
      const storedRole = localStorage.getItem('admin_role');
      const storedBrand = localStorage.getItem('admin_brand');
      
      if (storedUser && storedRole) {
        setUser(JSON.parse(storedUser));
        setRole(storedRole);
        if (storedBrand) {
          setBrand(JSON.parse(storedBrand));
        }
        setLoading(false);
      } else {
        // Fetch profile based on role
        fetchProfile();
      }
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const storedRole = localStorage.getItem('admin_role');
      if (storedRole === 'super_admin') {
        const response = await axios.get(`${API_URL}/api/super-admin/me`);
        setUser(response.data);
        setRole('super_admin');
      } else if (storedRole === 'brand_admin') {
        const response = await axios.get(`${API_URL}/api/brand-admin/me`);
        setUser(response.data.user);
        setBrand(response.data.brand);
        setRole('brand_admin');
      }
    } catch (error) {
      console.error('Failed to fetch admin profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    // Use unified login endpoint
    const response = await axios.post(`${API_URL}/api/super-admin/unified-login`, { email, password });
    const { token: newToken, user: userData, role: userRole, brand: brandData } = response.data;
    
    localStorage.setItem('admin_token', newToken);
    localStorage.setItem('admin_user', JSON.stringify(userData));
    localStorage.setItem('admin_role', userRole);
    if (brandData) {
      localStorage.setItem('admin_brand', JSON.stringify(brandData));
    }
    
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(userData);
    setRole(userRole);
    if (brandData) {
      setBrand(brandData);
    }
    
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_role');
    localStorage.removeItem('admin_brand');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setRole(null);
    setBrand(null);
  };

  return (
    <AdminAuthContext.Provider value={{ 
      user, brand, role, token, loading, login, logout, 
      isAuthenticated: !!user,
      isAdmin: role === 'super_admin',
      isBrand: role === 'brand_admin',
      refreshProfile: fetchProfile
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
