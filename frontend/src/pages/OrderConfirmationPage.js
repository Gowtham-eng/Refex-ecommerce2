import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { 
  CheckCircle2, 
  Package, 
  Truck, 
  Star, 
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function OrderConfirmationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { fetchCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [error, setError] = useState(null);

  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    if (sessionId) {
      pollPaymentStatus();
    } else {
      setError('Invalid session');
      setLoading(false);
    }
  }, [sessionId]);

  const pollPaymentStatus = async (attempts = 0) => {
    const maxAttempts = 10;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setError('Payment verification timed out. Please check your orders.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/checkout/status/${sessionId}`);
      setPaymentStatus(response.data);

      if (response.data.payment_status === 'paid') {
        // Fetch order details
        if (orderId) {
          const orderResponse = await axios.get(`${API_URL}/api/orders/${orderId}`);
          setOrder(orderResponse.data);
        }
        
        // Refresh user data (points, wallet)
        await refreshUser();
        await fetchCart();
        
        setLoading(false);
      } else if (response.data.status === 'expired' || response.data.payment_status === 'unpaid') {
        setError('Payment was not completed');
        setLoading(false);
      } else {
        // Continue polling
        setTimeout(() => pollPaymentStatus(attempts + 1), pollInterval);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      if (attempts < maxAttempts - 1) {
        setTimeout(() => pollPaymentStatus(attempts + 1), pollInterval);
      } else {
        setError('Failed to verify payment status');
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="order-confirmation-loading">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="font-serif text-xl font-medium mb-2">Confirming your payment...</h2>
          <p className="text-muted-foreground">Please wait while we verify your transaction</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="order-confirmation-error">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-medium mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate('/orders')}>
              Check My Orders
            </Button>
            <Button onClick={() => navigate('/cart')}>
              Return to Cart
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12" data-testid="order-confirmation-page">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground">
            Thank you for your purchase. Your order has been placed successfully.
          </p>
        </motion.div>

        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-sm shadow-luxury p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-6 pb-6 border-b">
              <div>
                <p className="text-sm text-muted-foreground">Order Number</p>
                <p className="font-mono-display text-lg">{order.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-xl font-semibold">${order.total?.toFixed(2)}</p>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="font-medium mb-4">Items Ordered</h3>
              <div className="space-y-3">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-muted rounded overflow-hidden">
                      <img
                        src={item.product?.image_url}
                        alt={item.product?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.product?.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Info */}
            <div className="mb-6 pb-6 border-b">
              <h3 className="font-medium mb-3">Delivery Method</h3>
              <div className="flex items-start space-x-3">
                {order.delivery_type === 'airport' ? (
                  <>
                    <Package className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Airport Pickup</p>
                      <p className="text-sm text-muted-foreground">
                        Terminal: {order.airport_delivery_details?.terminal || 'TBD'}
                        {order.airport_delivery_details?.gate && ` • Gate: ${order.airport_delivery_details.gate}`}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Truck className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Home Delivery</p>
                      <p className="text-sm text-muted-foreground">
                        {order.delivery_address?.address}, {order.delivery_address?.city}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Rewards Earned */}
            {order.loyalty_points_earned > 0 && (
              <div className="flex items-center justify-between p-4 bg-secondary rounded-sm">
                <div className="flex items-center space-x-3">
                  <Star className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium">Points Earned</p>
                    <p className="text-sm text-muted-foreground">Added to your loyalty account</p>
                  </div>
                </div>
                <span className="text-xl font-semibold text-amber-600">+{order.loyalty_points_earned}</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            variant="outline"
            onClick={() => navigate('/orders')}
            className="rounded-full"
            data-testid="view-orders-btn"
          >
            View My Orders
          </Button>
          <Button
            onClick={() => navigate('/shop')}
            className="rounded-full"
            data-testid="continue-shopping-btn"
          >
            Continue Shopping
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
