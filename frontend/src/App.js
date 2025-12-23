import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from 'sonner';

// Context Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Components
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import LoyaltyPage from './pages/LoyaltyPage';
import DashboardPage from './pages/DashboardPage';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Main App Content
const AppContent = () => {
  const [selectedAirport, setSelectedAirport] = useState(null);
  const [airports, setAirports] = useState([]);

  useEffect(() => {
    fetchAirports();
    seedData();
  }, []);

  const fetchAirports = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/airports`);
      setAirports(response.data || []);
      // Auto-select first airport
      if (response.data?.length > 0) {
        setSelectedAirport(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch airports:', error);
    }
  };

  const seedData = async () => {
    try {
      await axios.post(`${API_URL}/api/seed-data`);
    } catch (error) {
      // Data might already be seeded, ignore error
    }
  };

  const handleAirportChange = (airport) => {
    setSelectedAirport(airport);
  };

  // Check if current path is auth page
  const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster 
        position="top-right" 
        toastOptions={{
          className: 'font-sans',
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
          },
        }}
      />
      
      <Routes>
        {/* Auth pages without navbar/footer */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Main pages with navbar/footer */}
        <Route path="/*" element={
          <>
            <Navbar 
              selectedAirport={selectedAirport} 
              onAirportChange={handleAirportChange}
              airports={airports}
            />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={
                  <HomePage 
                    selectedAirport={selectedAirport}
                    onAirportChange={handleAirportChange}
                    airports={airports}
                  />
                } />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/brands" element={<ShopPage />} />
                <Route path="/duty-free" element={<ShopPage />} />
                <Route path="/product/:id" element={<ProductPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={
                  <ProtectedRoute>
                    <CheckoutPage selectedAirport={selectedAirport} />
                  </ProtectedRoute>
                } />
                <Route path="/order-confirmation" element={
                  <ProtectedRoute>
                    <OrderConfirmationPage />
                  </ProtectedRoute>
                } />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/orders/:id" element={<OrdersPage />} />
                <Route path="/loyalty" element={<LoyaltyPage />} />
                <Route path="/profile" element={<LoyaltyPage />} />
                <Route path="/wallet" element={<LoyaltyPage />} />
              </Routes>
            </main>
            <Footer />
          </>
        } />
      </Routes>
    </div>
  );
};

// Main App with Providers
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
