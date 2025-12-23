import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { 
  Plane, 
  Truck, 
  CreditCard, 
  Star,
  Wallet,
  MapPin,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function CheckoutPage({ selectedAirport }) {
  const navigate = useNavigate();
  const { cart, fetchCart } = useCart();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [calculation, setCalculation] = useState(null);

  const [deliveryType, setDeliveryType] = useState('airport');
  const [airportDetails, setAirportDetails] = useState({
    terminal: '',
    gate: '',
    lounge: ''
  });
  const [homeDetails, setHomeDetails] = useState({
    address: '',
    city: '',
    pincode: '',
    contact_number: ''
  });
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(0);
  const [useWalletAmount, setUseWalletAmount] = useState(0);

  useEffect(() => {
    if (!cart.items.length) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  useEffect(() => {
    if (cart.items.length > 0) {
      calculateTotals();
    }
  }, [deliveryType, useLoyaltyPoints, useWalletAmount]);

  const calculateTotals = async () => {
    try {
      setCalculating(true);
      const response = await axios.post(`${API_URL}/api/checkout/calculate`, {
        delivery_details: {
          delivery_type: deliveryType,
          ...(deliveryType === 'airport' ? airportDetails : homeDetails)
        },
        use_loyalty_points: useLoyaltyPoints,
        use_wallet_amount: useWalletAmount
      });
      setCalculation(response.data);
    } catch (error) {
      console.error('Failed to calculate:', error);
    } finally {
      setCalculating(false);
    }
  };

  const handleCheckout = async () => {
    // Validation
    if (deliveryType === 'airport' && !airportDetails.terminal) {
      toast.error('Please select a terminal');
      return;
    }
    if (deliveryType === 'home' && (!homeDetails.address || !homeDetails.city || !homeDetails.pincode)) {
      toast.error('Please fill in all delivery details');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/checkout/create-payment`, {
        delivery_details: {
          delivery_type: deliveryType,
          ...(deliveryType === 'airport' ? airportDetails : homeDetails)
        },
        use_loyalty_points: useLoyaltyPoints,
        use_wallet_amount: useWalletAmount
      });

      // Redirect to Stripe Checkout
      window.location.href = response.data.checkout_url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create payment session');
      setLoading(false);
    }
  };

  const terminals = selectedAirport?.terminals || ['T1', 'T2', 'T3'];

  return (
    <div className="min-h-screen py-8 bg-muted/30" data-testid="checkout-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/cart')}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to cart
        </button>

        <h1 className="font-serif text-3xl sm:text-4xl font-medium mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Delivery Type */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-sm shadow-luxury p-6"
            >
              <h2 className="font-serif text-xl font-medium mb-6">Delivery Method</h2>
              
              <RadioGroup value={deliveryType} onValueChange={setDeliveryType}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label 
                    className={`flex items-start space-x-4 p-4 border rounded-sm cursor-pointer transition-colors ${
                      deliveryType === 'airport' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                    }`}
                    data-testid="delivery-airport"
                  >
                    <RadioGroupItem value="airport" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Plane className="h-4 w-4 text-primary" />
                        <span className="font-medium">Airport Pickup</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Collect at your gate or lounge
                      </p>
                      <p className="text-xs text-green-600 mt-2">
                        Free for orders over $50
                      </p>
                    </div>
                  </label>

                  <label 
                    className={`flex items-start space-x-4 p-4 border rounded-sm cursor-pointer transition-colors ${
                      deliveryType === 'home' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                    }`}
                    data-testid="delivery-home"
                  >
                    <RadioGroupItem value="home" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Truck className="h-4 w-4 text-primary" />
                        <span className="font-medium">Home Delivery</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Ship to your address
                      </p>
                      <p className="text-xs text-green-600 mt-2">
                        Free for orders over $100
                      </p>
                    </div>
                  </label>
                </div>
              </RadioGroup>
            </motion.div>

            {/* Delivery Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-sm shadow-luxury p-6"
            >
              <h2 className="font-serif text-xl font-medium mb-6 flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Delivery Details</span>
              </h2>

              {deliveryType === 'airport' ? (
                <div className="space-y-4">
                  <div>
                    <Label>Terminal</Label>
                    <Select 
                      value={airportDetails.terminal} 
                      onValueChange={(value) => setAirportDetails({ ...airportDetails, terminal: value })}
                    >
                      <SelectTrigger data-testid="terminal-select">
                        <SelectValue placeholder="Select terminal" />
                      </SelectTrigger>
                      <SelectContent>
                        {terminals.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Gate (Optional)</Label>
                      <Input
                        placeholder="e.g., A12"
                        value={airportDetails.gate}
                        onChange={(e) => setAirportDetails({ ...airportDetails, gate: e.target.value })}
                        data-testid="gate-input"
                      />
                    </div>
                    <div>
                      <Label>Lounge (Optional)</Label>
                      <Input
                        placeholder="e.g., Business Lounge"
                        value={airportDetails.lounge}
                        onChange={(e) => setAirportDetails({ ...airportDetails, lounge: e.target.value })}
                        data-testid="lounge-input"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label>Address</Label>
                    <Input
                      placeholder="Street address, building, etc."
                      value={homeDetails.address}
                      onChange={(e) => setHomeDetails({ ...homeDetails, address: e.target.value })}
                      data-testid="address-input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>City</Label>
                      <Input
                        placeholder="City"
                        value={homeDetails.city}
                        onChange={(e) => setHomeDetails({ ...homeDetails, city: e.target.value })}
                        data-testid="city-input"
                      />
                    </div>
                    <div>
                      <Label>Pincode</Label>
                      <Input
                        placeholder="Pincode"
                        value={homeDetails.pincode}
                        onChange={(e) => setHomeDetails({ ...homeDetails, pincode: e.target.value })}
                        data-testid="pincode-input"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Contact Number</Label>
                    <Input
                      placeholder="Phone number for delivery"
                      value={homeDetails.contact_number}
                      onChange={(e) => setHomeDetails({ ...homeDetails, contact_number: e.target.value })}
                      data-testid="contact-input"
                    />
                  </div>
                </div>
              )}
            </motion.div>

            {/* Loyalty & Wallet */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-sm shadow-luxury p-6"
            >
              <h2 className="font-serif text-xl font-medium mb-6">Rewards & Wallet</h2>

              {/* Loyalty Points */}
              {user?.loyalty_points > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-amber-600" />
                      <span className="font-medium">Use Loyalty Points</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Available: {user.loyalty_points} pts
                    </span>
                  </div>
                  <div className="space-y-2">
                    <Slider
                      value={[useLoyaltyPoints]}
                      onValueChange={(value) => setUseLoyaltyPoints(value[0])}
                      max={Math.min(user.loyalty_points, (cart.subtotal || 0) * 20)} // Max 20% discount
                      step={10}
                      data-testid="loyalty-slider"
                    />
                    <div className="flex justify-between text-sm">
                      <span>{useLoyaltyPoints} points</span>
                      <span className="text-green-600">-${(useLoyaltyPoints * 0.01).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Wallet Balance */}
              {user?.wallet_balance > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Wallet className="h-4 w-4 text-primary" />
                      <span className="font-medium">Use Wallet Balance</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Available: ${user.wallet_balance.toFixed(2)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <Slider
                      value={[useWalletAmount]}
                      onValueChange={(value) => setUseWalletAmount(value[0])}
                      max={Math.min(user.wallet_balance, cart.subtotal || 0)}
                      step={1}
                      data-testid="wallet-slider"
                    />
                    <div className="flex justify-between text-sm">
                      <span>${useWalletAmount.toFixed(2)}</span>
                      <span className="text-green-600">-${useWalletAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {!user?.loyalty_points && !user?.wallet_balance && (
                <p className="text-muted-foreground text-sm">
                  No rewards available. Earn points with your purchase!
                </p>
              )}
            </motion.div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-card rounded-sm shadow-luxury p-6" data-testid="checkout-summary">
              <h2 className="font-serif text-xl font-medium mb-6">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-6 max-h-48 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item.product_id} className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-muted rounded overflow-hidden">
                      <img
                        src={item.product?.image_url}
                        alt={item.product?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product?.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium">${item.item_total?.toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{calculating ? '...' : `$${calculation?.subtotal?.toFixed(2) || cart.subtotal?.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{calculating ? '...' : calculation?.shipping_fee === 0 ? 'Free' : `$${calculation?.shipping_fee?.toFixed(2) || '0.00'}`}</span>
                </div>
                {calculation?.loyalty_discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Loyalty Discount</span>
                    <span>-${calculation.loyalty_discount.toFixed(2)}</span>
                  </div>
                )}
                {calculation?.wallet_discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Wallet</span>
                    <span>-${calculation.wallet_discount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Points to Earn */}
              {calculation?.loyalty_points_earnable > 0 && (
                <div className="flex items-center justify-between p-3 bg-secondary rounded-sm mt-4">
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-amber-600" />
                    <span className="text-sm">Points you'll earn</span>
                  </div>
                  <span className="font-medium">+{calculation.loyalty_points_earnable}</span>
                </div>
              )}

              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between text-lg">
                  <span className="font-medium">Total</span>
                  <span className="font-semibold">
                    {calculating ? '...' : `$${calculation?.total?.toFixed(2) || cart.subtotal?.toFixed(2)}`}
                  </span>
                </div>
              </div>

              <Button 
                onClick={handleCheckout}
                className="w-full btn-primary mt-6"
                disabled={loading || calculating}
                data-testid="pay-now-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Pay Now
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-4">
                Secure checkout powered by Stripe
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
