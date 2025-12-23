import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  Star, 
  Wallet, 
  ShoppingBag, 
  TrendingUp,
  Gift,
  ChevronRight,
  User,
  Settings,
  Bell,
  Crown,
  Plane,
  Clock,
  CheckCircle2,
  Truck
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    pointsEarned: 0,
    savedAmount: 0
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [ordersRes, loyaltyRes, walletRes] = await Promise.all([
        axios.get(`${API_URL}/api/orders`),
        axios.get(`${API_URL}/api/loyalty`),
        axios.get(`${API_URL}/api/wallet`)
      ]);
      
      const ordersData = ordersRes.data || [];
      setOrders(ordersData);
      setLoyaltyData(loyaltyRes.data);
      setWalletData(walletRes.data);
      
      // Calculate stats
      const totalSpent = ordersData.reduce((sum, o) => sum + (o.total || 0), 0);
      const pointsEarned = ordersData.reduce((sum, o) => sum + (o.loyalty_points_earned || 0), 0);
      const savedAmount = ordersData.reduce((sum, o) => sum + ((o.loyalty_points_used * 0.01) + (o.wallet_amount_used || 0)), 0);
      
      setStats({
        totalOrders: ordersData.length,
        totalSpent,
        pointsEarned,
        savedAmount
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-medium mb-2">Sign in to view your dashboard</h2>
          <p className="text-muted-foreground mb-6">Access your orders, rewards, and account settings</p>
          <Button onClick={() => navigate('/login')} className="rounded-full">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'out_for_delivery': return 'text-blue-600 bg-blue-100';
      case 'processing': case 'confirmed': return 'text-amber-600 bg-amber-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum'];
  const currentTierIndex = tiers.indexOf(loyaltyData?.tier || 'Bronze');
  const nextTier = currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : null;
  const progressToNext = nextTier && loyaltyData?.points_to_next_tier 
    ? Math.min(100, ((user?.loyalty_points || 0) / (user?.loyalty_points + loyaltyData.points_to_next_tier)) * 100)
    : 100;

  return (
    <div className="min-h-screen py-8 bg-muted/30" data-testid="dashboard-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium mb-2">
              Welcome back, {user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-muted-foreground">
              Manage your orders, rewards, and account settings
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="icon" className="rounded-full">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Orders', value: stats.totalOrders, icon: Package, color: 'bg-blue-50 text-blue-600' },
            { label: 'Total Spent', value: `$${stats.totalSpent.toFixed(2)}`, icon: ShoppingBag, color: 'bg-green-50 text-green-600' },
            { label: 'Points Earned', value: stats.pointsEarned, icon: Star, color: 'bg-amber-50 text-amber-600' },
            { label: 'Amount Saved', value: `$${stats.savedAmount.toFixed(2)}`, icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-card rounded-xl p-6 shadow-luxury"
            >
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="text-2xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Orders */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl shadow-luxury p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl font-medium">Recent Orders</h2>
                <Link to="/orders" className="text-sm text-primary hover:underline flex items-center">
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-4">
                      <div className="w-16 h-16 bg-muted rounded" />
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                        <div className="h-3 bg-muted rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">No orders yet</p>
                  <Button onClick={() => navigate('/shop')} size="sm" className="rounded-full">
                    Start Shopping
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <Link
                      key={order.id}
                      to={`/orders/${order.id}`}
                      className="flex items-center space-x-4 p-4 rounded-lg hover:bg-muted/50 transition-colors"
                      data-testid={`dashboard-order-${order.id}`}
                    >
                      <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        {order.items?.[0]?.product?.image_url ? (
                          <img 
                            src={order.items[0].product.image_url} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium truncate">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                            {order.order_status?.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()} • {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${order.total?.toFixed(2)}</p>
                        <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
              {[
                { label: 'Shop Now', icon: ShoppingBag, path: '/shop', color: 'bg-primary text-white' },
                { label: 'Track Orders', icon: Truck, path: '/orders', color: 'bg-blue-500 text-white' },
                { label: 'My Rewards', icon: Gift, path: '/loyalty', color: 'bg-amber-500 text-white' },
                { label: 'Wallet', icon: Wallet, path: '/wallet', color: 'bg-green-500 text-white' },
              ].map((action) => (
                <Link
                  key={action.label}
                  to={action.path}
                  className={`${action.color} rounded-xl p-4 text-center hover:opacity-90 transition-opacity`}
                >
                  <action.icon className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">{action.label}</p>
                </Link>
              ))}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Loyalty Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-xl p-6 shadow-luxury"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Crown className="h-5 w-5" />
                  <span className="text-sm font-medium opacity-80">JetShop Rewards</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  loyaltyData?.tier === 'Platinum' ? 'bg-slate-200 text-slate-800' :
                  loyaltyData?.tier === 'Gold' ? 'bg-yellow-200 text-yellow-800' :
                  loyaltyData?.tier === 'Silver' ? 'bg-gray-200 text-gray-800' : 'bg-amber-200 text-amber-800'
                }`}>
                  {loyaltyData?.tier || 'Bronze'}
                </span>
              </div>
              
              <p className="text-4xl font-bold mb-1">{user?.loyalty_points || 0}</p>
              <p className="text-sm opacity-70 mb-4">Available Points</p>
              
              {nextTier && (
                <div>
                  <div className="flex justify-between text-xs mb-2 opacity-80">
                    <span>{loyaltyData?.points_to_next_tier} pts to {nextTier}</span>
                    <span>{progressToNext.toFixed(0)}%</span>
                  </div>
                  <Progress value={progressToNext} className="h-2 bg-white/20" />
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t border-white/20">
                <p className="text-xs opacity-70 mb-1">Loyalty ID</p>
                <p className="font-mono text-sm">{loyaltyData?.loyalty_id}</p>
              </div>
            </motion.div>

            {/* Wallet Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-xl p-6 shadow-luxury"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium flex items-center space-x-2">
                  <Wallet className="h-5 w-5 text-green-600" />
                  <span>Wallet Balance</span>
                </h3>
                <Link to="/wallet" className="text-xs text-primary hover:underline">
                  View History
                </Link>
              </div>
              <p className="text-3xl font-bold text-green-600 mb-2">
                ${user?.wallet_balance?.toFixed(2) || '0.00'}
              </p>
              <p className="text-sm text-muted-foreground">
                Use at checkout for instant savings
              </p>
            </motion.div>

            {/* Member Benefits */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-xl p-6 shadow-luxury"
            >
              <h3 className="font-medium mb-4">Your Benefits</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <Star className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{loyaltyData?.benefits?.points_multiplier || 1}x Points</p>
                    <p className="text-xs text-muted-foreground">On all purchases</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Truck className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Free Shipping</p>
                    <p className="text-xs text-muted-foreground">
                      Orders over ${loyaltyData?.benefits?.free_shipping_threshold || 200}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Gift className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{loyaltyData?.benefits?.discount || 0}% Discount</p>
                    <p className="text-xs text-muted-foreground">Member exclusive</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
