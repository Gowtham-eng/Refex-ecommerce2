import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  Truck, 
  Plane, 
  CheckCircle2, 
  Clock, 
  MapPin,
  Phone,
  Mail,
  ChevronLeft,
  Star,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchOrder();
    }
  }, [isAuthenticated, id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/orders/${id}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
      toast.error('Order not found');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const copyOrderId = () => {
    navigator.clipboard.writeText(order?.id || '');
    toast.success('Order ID copied to clipboard');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-medium mb-2">Sign in to view order</h2>
          <Button onClick={() => navigate('/login')} className="rounded-full">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="h-64 bg-muted rounded" />
            <div className="h-48 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) return null;

  // Define tracking steps based on delivery type
  const airportSteps = [
    { key: 'pending', label: 'Order Placed', icon: Clock },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
    { key: 'processing', label: 'Preparing', icon: Package },
    { key: 'ready_for_pickup', label: 'Ready for Pickup', icon: MapPin },
    { key: 'out_for_delivery', label: 'Runner Assigned', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
  ];

  const homeSteps = [
    { key: 'pending', label: 'Order Placed', icon: Clock },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
    { key: 'processing', label: 'Processing', icon: Package },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'in_transit', label: 'In Transit', icon: Plane },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
  ];

  const trackingSteps = order.delivery_type === 'airport' ? airportSteps : homeSteps;
  
  // Find current step index
  const currentStepIndex = trackingSteps.findIndex(step => step.key === order.order_status);
  const isDelivered = order.order_status === 'delivered';
  const isCancelled = order.order_status === 'cancelled';

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'text-green-600';
      case 'cancelled': return 'text-red-600';
      case 'out_for_delivery': return 'text-blue-600';
      default: return 'text-amber-600';
    }
  };

  return (
    <div className="min-h-screen py-8 bg-muted/30" data-testid="order-detail-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/orders')}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Orders
        </button>

        {/* Order Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl shadow-luxury p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <h1 className="font-serif text-2xl font-medium">
                  Order #{order.id.slice(0, 8).toUpperCase()}
                </h1>
                <button 
                  onClick={copyOrderId}
                  className="p-1 hover:bg-muted rounded transition-colors"
                  title="Copy Order ID"
                >
                  <Copy className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
                isDelivered ? 'bg-green-100 text-green-700' :
                isCancelled ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {order.order_status?.replace('_', ' ')}
              </span>
              <Button variant="outline" size="sm" onClick={fetchOrder} className="rounded-full">
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Payment Status */}
          <div className="flex items-center space-x-2 text-sm">
            {order.payment_status === 'paid' ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-green-600 font-medium">Payment Complete</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-amber-600 font-medium">Payment {order.payment_status}</span>
              </>
            )}
          </div>
        </motion.div>

        {/* Order Tracking */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl shadow-luxury p-6 mb-6"
        >
          <h2 className="font-serif text-xl font-medium mb-6 flex items-center space-x-2">
            <Truck className="h-5 w-5" />
            <span>Track Your Order</span>
          </h2>

          {isCancelled ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
              <p className="text-red-600 font-medium">Order Cancelled</p>
              <p className="text-sm text-muted-foreground mt-1">This order has been cancelled</p>
            </div>
          ) : (
            <>
              {/* Progress Bar */}
              <div className="relative mb-8">
                <div className="absolute top-5 left-0 right-0 h-1 bg-muted">
                  <div 
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${Math.min(100, (currentStepIndex / (trackingSteps.length - 1)) * 100)}%` }}
                  />
                </div>
                
                <div className="relative flex justify-between">
                  {trackingSteps.map((step, idx) => {
                    const isCompleted = idx <= currentStepIndex;
                    const isCurrent = idx === currentStepIndex;
                    const StepIcon = step.icon;
                    
                    return (
                      <div key={step.key} className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${
                          isCompleted 
                            ? 'bg-primary text-white' 
                            : 'bg-muted text-muted-foreground'
                        } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}>
                          <StepIcon className="h-5 w-5" />
                        </div>
                        <p className={`text-xs mt-2 text-center max-w-[80px] ${
                          isCompleted ? 'text-primary font-medium' : 'text-muted-foreground'
                        }`}>
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tracking History */}
              {order.tracking_status && order.tracking_status.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="text-sm font-medium mb-4">Tracking History</h3>
                  <div className="space-y-4">
                    {order.tracking_status.slice().reverse().map((status, idx) => (
                      <div key={idx} className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${idx === 0 ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                        <div>
                          <p className={`text-sm font-medium capitalize ${idx === 0 ? 'text-primary' : ''}`}>
                            {status.status?.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(status.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Delivery Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl shadow-luxury p-6"
          >
            <h2 className="font-serif text-lg font-medium mb-4 flex items-center space-x-2">
              {order.delivery_type === 'airport' ? (
                <>
                  <Plane className="h-5 w-5" />
                  <span>Airport Pickup</span>
                </>
              ) : (
                <>
                  <Truck className="h-5 w-5" />
                  <span>Home Delivery</span>
                </>
              )}
            </h2>

            {order.delivery_type === 'airport' ? (
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Terminal {order.airport_delivery_details?.terminal || 'TBD'}</p>
                    {order.airport_delivery_details?.gate && (
                      <p className="text-sm text-muted-foreground">Gate: {order.airport_delivery_details.gate}</p>
                    )}
                    {order.airport_delivery_details?.lounge && (
                      <p className="text-sm text-muted-foreground">Lounge: {order.airport_delivery_details.lounge}</p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your order will be delivered to your specified location within the airport.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{order.delivery_address?.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.delivery_address?.city}, {order.delivery_address?.pincode}
                    </p>
                  </div>
                </div>
                {order.delivery_address?.contact_number && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm">{order.delivery_address.contact_number}</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl shadow-luxury p-6"
          >
            <h2 className="font-serif text-lg font-medium mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${order.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>{order.shipping_fee === 0 ? 'Free' : `$${order.shipping_fee?.toFixed(2)}`}</span>
              </div>
              {order.loyalty_points_used > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Points Redeemed ({order.loyalty_points_used} pts)</span>
                  <span>-${(order.loyalty_points_used * 0.01).toFixed(2)}</span>
                </div>
              )}
              {order.wallet_amount_used > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Wallet</span>
                  <span>-${order.wallet_amount_used.toFixed(2)}</span>
                </div>
              )}
            </div>
            
            <div className="border-t pt-3">
              <div className="flex justify-between font-semibold">
                <span>Total Paid</span>
                <span>${order.total?.toFixed(2)}</span>
              </div>
            </div>

            {order.loyalty_points_earned > 0 && (
              <div className="mt-4 p-3 bg-secondary rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-amber-600" />
                  <span className="text-sm">Points Earned</span>
                </div>
                <span className="font-semibold text-amber-600">+{order.loyalty_points_earned}</span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Order Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-xl shadow-luxury p-6 mt-6"
        >
          <h2 className="font-serif text-lg font-medium mb-4">
            Items ({order.items?.length})
          </h2>
          
          <div className="divide-y">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-4 py-4 first:pt-0 last:pb-0">
                <Link to={`/product/${item.product_id}`} className="flex-shrink-0">
                  <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden">
                    <img
                      src={item.product?.image_url}
                      alt={item.product?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.product_id}`} className="hover:text-primary transition-colors">
                    <h4 className="font-medium truncate">{item.product?.name}</h4>
                  </Link>
                  <p className="text-sm text-muted-foreground">{item.product?.category}</p>
                  <p className="text-sm">Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    ${((item.product?.discount_price || item.product?.price) * item.quantity).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ${(item.product?.discount_price || item.product?.price)?.toFixed(2)} each
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 mt-8 justify-center"
        >
          <Button variant="outline" className="rounded-full" onClick={() => navigate('/orders')}>
            View All Orders
          </Button>
          <Button className="rounded-full" onClick={() => navigate('/shop')}>
            Continue Shopping
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
