import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const [cart, setCart] = useState({ items: [], subtotal: 0, loyalty_points_earnable: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCart({ items: [], subtotal: 0, loyalty_points_earnable: 0 });
    }
  }, [isAuthenticated]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/cart`);
      setCart(response.data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1, variant = null) => {
    try {
      await axios.post(`${API_URL}/api/cart/add`, {
        product_id: productId,
        quantity,
        variant
      });
      await fetchCart();
      return true;
    } catch (error) {
      console.error('Failed to add to cart:', error);
      return false;
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await axios.delete(`${API_URL}/api/cart/item/${productId}`);
      await fetchCart();
      return true;
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      return false;
    }
  };

  const updateCart = async (items) => {
    try {
      await axios.post(`${API_URL}/api/cart/update`, { items });
      await fetchCart();
      return true;
    } catch (error) {
      console.error('Failed to update cart:', error);
      return false;
    }
  };

  const clearCart = async () => {
    try {
      await axios.delete(`${API_URL}/api/cart`);
      setCart({ items: [], subtotal: 0, loyalty_points_earnable: 0 });
      return true;
    } catch (error) {
      console.error('Failed to clear cart:', error);
      return false;
    }
  };

  const cartItemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      loading, 
      addToCart, 
      removeFromCart, 
      updateCart, 
      clearCart, 
      fetchCart,
      cartItemCount 
    }}>
      {children}
    </CartContext.Provider>
  );
};
