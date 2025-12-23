import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  Truck, 
  Plane, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  ShoppingBag
} from 'lucide-react';
import { Button } from '../components/ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function OrdersPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/orders`);
      setOrders(response.data || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'out_for_delivery': return 'text-blue-600 bg-blue-100';
      case 'processing': case 'confirmed': return 'text-amber-600 bg-amber-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered': return CheckCircle2;
      case 'out_for_delivery': return Truck;
      case 'processing': case 'confirmed': return Package;
      default: return Clock;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-medium mb-2">Sign in to view your orders</h2>
          <p className="text-muted-foreground mb-6">Track your purchases and order history</p>
          <Button onClick={() => navigate('/login')} className="rounded-full">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8" data-testid="orders-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-medium mb-8">My Orders</h1>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-card rounded-sm p-6">
                <div className="h-6 bg-muted rounded w-1/4 mb-4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-serif text-xl font-medium mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
            <Button onClick={() => navigate('/shop')} className="rounded-full">
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, idx) => {
              const StatusIcon = getStatusIcon(order.order_status);
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Link
                    to={`/orders/${order.id}`}
                    className="block bg-card rounded-sm shadow-luxury hover:shadow-luxury-hover transition-shadow p-6"
                    data-testid={`order-${order.id}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-mono-display text-muted-foreground mb-1">
                          ORDER #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.order_status)}`}>
                        <StatusIcon className="h-4 w-4" />
                        <span className="capitalize">{order.order_status?.replace('_', ' ')}</span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 mb-4">
                      {order.items?.slice(0, 3).map((item, i) => (
                        <div key={i} className="w-16 h-16 bg-muted rounded overflow-hidden">
                          <img
                            src={item.product?.image_url || 'https://via.placeholder.com/64'}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {order.items?.length > 3 && (
                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                          <span className="text-sm text-muted-foreground">+{order.items.length - 3}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          {order.delivery_type === 'airport' ? (
                            <>
                              <Plane className="h-4 w-4" />
                              <span>Airport Pickup</span>
                            </>
                          ) : (
                            <>
                              <Truck className="h-4 w-4" />
                              <span>Home Delivery</span>
                            </>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold">${order.total?.toFixed(2)}</span>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
