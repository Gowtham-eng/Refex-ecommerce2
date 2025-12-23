import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { 
  ShoppingBag, 
  User, 
  Search, 
  Menu, 
  X, 
  Plane, 
  Gift, 
  Wallet,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export const Navbar = ({ selectedAirport, onAirportChange, airports = [] }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartItemCount } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 nav-glass" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2" data-testid="logo-link">
            <Plane className="h-6 w-6 text-primary" />
            <span className="font-serif text-xl font-semibold tracking-tight">JetShop</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/shop" className="text-sm font-medium hover:text-primary transition-colors" data-testid="shop-link">
              Shop
            </Link>
            <Link to="/brands" className="text-sm font-medium hover:text-primary transition-colors" data-testid="brands-link">
              Brands
            </Link>
            <Link to="/duty-free" className="text-sm font-medium hover:text-primary transition-colors" data-testid="duty-free-link">
              Duty Free
            </Link>
            
            {/* Airport Selector */}
            {airports.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-1 text-sm" data-testid="airport-selector">
                    <Plane className="h-4 w-4" />
                    <span>{selectedAirport?.code || 'Select Airport'}</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {airports.map((airport) => (
                    <DropdownMenuItem 
                      key={airport.id} 
                      onClick={() => onAirportChange(airport)}
                      className="cursor-pointer"
                      data-testid={`airport-option-${airport.code}`}
                    >
                      <div>
                        <div className="font-medium">{airport.code}</div>
                        <div className="text-xs text-muted-foreground">{airport.name}</div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <button 
              onClick={() => setSearchOpen(!searchOpen)} 
              className="p-2 hover:bg-muted rounded-full transition-colors"
              data-testid="search-toggle"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Cart */}
            <Link to="/cart" className="relative p-2 hover:bg-muted rounded-full transition-colors" data-testid="cart-link">
              <ShoppingBag className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center" data-testid="cart-count">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2" data-testid="user-menu-trigger">
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                      <span className="text-sm font-medium">{user?.name?.charAt(0).toUpperCase()}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer" data-testid="profile-link">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/orders')} className="cursor-pointer" data-testid="orders-link">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    My Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/loyalty')} className="cursor-pointer" data-testid="loyalty-link">
                    <Gift className="mr-2 h-4 w-4" />
                    Loyalty Points
                    <span className="ml-auto text-xs bg-secondary px-2 py-0.5 rounded-full">
                      {user?.loyalty_points || 0}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/wallet')} className="cursor-pointer" data-testid="wallet-link">
                    <Wallet className="mr-2 h-4 w-4" />
                    Wallet
                    <span className="ml-auto text-xs">${user?.wallet_balance?.toFixed(2) || '0.00'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive" data-testid="logout-btn">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={() => navigate('/login')} 
                className="rounded-full px-6"
                data-testid="login-btn"
              >
                Sign In
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 hover:bg-muted rounded-full"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <form onSubmit={handleSearch} className="py-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products, brands..."
                    className="w-full h-12 pl-12 pr-4 bg-muted rounded-full border-0 focus:ring-2 focus:ring-primary"
                    autoFocus
                    data-testid="search-input"
                  />
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-border bg-background"
          >
            <div className="px-4 py-4 space-y-3">
              <Link to="/shop" className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                Shop
              </Link>
              <Link to="/brands" className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                Brands
              </Link>
              <Link to="/duty-free" className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                Duty Free
              </Link>
              {isAuthenticated && (
                <>
                  <Link to="/orders" className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                    My Orders
                  </Link>
                  <Link to="/loyalty" className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                    Loyalty Program
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
