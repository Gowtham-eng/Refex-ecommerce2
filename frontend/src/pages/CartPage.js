import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight,
  Star,
  ChevronLeft
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, updateCart, removeFromCart, loading, fetchCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [localCart, setLocalCart] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      // Load local cart
      const stored = JSON.parse(localStorage.getItem('localCart') || '[]');
      setLocalCart(stored);
    }
  }, [isAuthenticated]);

  // Merge local cart when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      const stored = JSON.parse(localStorage.getItem('localCart') || '[]');
      if (stored.length > 0) {
        // Merge local cart with server cart
        stored.forEach(async (item) => {
          await updateCart([...cart.items.map(i => ({ product_id: i.product_id, quantity: i.quantity })), { product_id: item.product_id, quantity: item.quantity }]);
        });
        localStorage.removeItem('localCart');
        fetchCart();
      }
    }
  }, [isAuthenticated]);

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    if (!isAuthenticated) {
      const updated = localCart.map(item => 
        item.product_id === productId ? { ...item, quantity: newQuantity } : item
      );
      setLocalCart(updated);
      localStorage.setItem('localCart', JSON.stringify(updated));
      return;
    }
    
    const updatedItems = cart.items.map(item => 
      item.product_id === productId 
        ? { product_id: item.product_id, quantity: newQuantity, variant: item.variant }
        : { product_id: item.product_id, quantity: item.quantity, variant: item.variant }
    );
    
    await updateCart(updatedItems);
  };

  const handleRemove = async (productId, productName) => {
    if (!isAuthenticated) {
      const updated = localCart.filter(item => item.product_id !== productId);
      setLocalCart(updated);
      localStorage.setItem('localCart', JSON.stringify(updated));
      toast.success(`Removed ${productName} from cart`);
      return;
    }
    
    await removeFromCart(productId);
    toast.success(`Removed ${productName} from cart`);
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to checkout');
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  // Use local cart if not authenticated
  const displayCart = isAuthenticated ? cart : {
    items: localCart.map(item => ({
      ...item,
      product: item.product,
      item_total: (item.product?.discount_price || item.product?.price || 0) * item.quantity
    })),
    subtotal: localCart.reduce((sum, item) => sum + (item.product?.discount_price || item.product?.price || 0) * item.quantity, 0),
    loyalty_points_earnable: localCart.reduce((sum, item) => sum + (item.product?.loyalty_points_earn || 0) * item.quantity, 0)
  };

  if (displayCart.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="cart-page-empty">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-medium mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Add some products to get started</p>
          <Button onClick={() => navigate('/shop')} className="rounded-full">
            Start Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8" data-testid="cart-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/shop')}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Continue Shopping
        </button>

        <h1 className="font-serif text-3xl sm:text-4xl font-medium mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {displayCart.items.map((item, idx) => (
              <motion.div
                key={item.product_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex gap-6 p-6 bg-card rounded-sm shadow-luxury"
                data-testid={`cart-item-${item.product_id}`}
              >
                {/* Product Image */}
                <Link to={`/product/${item.product_id}`} className="flex-shrink-0">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 overflow-hidden bg-muted">
                    <img
                      src={item.product?.image_url}
                      alt={item.product?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.product_id}`}>
                    <h3 className="font-medium text-lg hover:text-primary transition-colors line-clamp-2">
                      {item.product?.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-muted-foreground mt-1">{item.product?.category}</p>
                  
                  {item.product?.loyalty_points_earn > 0 && (
                    <div className="flex items-center space-x-1 mt-2">
                      <Star className="h-3 w-3 text-amber-600" />
                      <span className="text-xs text-muted-foreground">
                        Earn {item.product.loyalty_points_earn * item.quantity} points
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4">
                    {/* Quantity */}
                    <div className="flex items-center border rounded-full">
                      <button
                        onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                        className="p-2 hover:bg-muted rounded-l-full transition-colors"
                        data-testid={`qty-decrease-${item.product_id}`}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                        className="p-2 hover:bg-muted rounded-r-full transition-colors"
                        data-testid={`qty-increase-${item.product_id}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="font-semibold">
                        ${item.item_total?.toFixed(2)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-muted-foreground">
                          ${(item.product?.discount_price || item.product?.price)?.toFixed(2)} each
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemove(item.product_id, item.product?.name)}
                  className="p-2 h-fit hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors"
                  data-testid={`remove-item-${item.product_id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-card rounded-sm shadow-luxury p-6" data-testid="order-summary">
              <h2 className="font-serif text-xl font-medium mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${displayCart.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-sm">Calculated at checkout</span>
                </div>
              </div>

              {/* Loyalty Points */}
              {displayCart.loyalty_points_earnable > 0 && (
                <div className="flex items-center justify-between p-4 bg-secondary rounded-sm mb-6">
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-amber-600" />
                    <span className="text-sm">Points you'll earn</span>
                  </div>
                  <span className="font-medium">+{displayCart.loyalty_points_earnable}</span>
                </div>
              )}

              {/* User Points */}
              {isAuthenticated && user && user.loyalty_points > 0 && (
                <div className="flex items-center justify-between text-sm mb-6">
                  <span className="text-muted-foreground">Your available points</span>
                  <span className="font-medium">{user.loyalty_points}</span>
                </div>
              )}

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between text-lg">
                  <span className="font-medium">Total</span>
                  <span className="font-semibold">${displayCart.subtotal?.toFixed(2)}</span>
                </div>
              </div>

              <Button 
                onClick={handleCheckout}
                className="w-full btn-primary"
                data-testid="checkout-btn"
              >
                {isAuthenticated ? 'Proceed to Checkout' : 'Sign In to Checkout'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-4">
                {isAuthenticated ? 'Taxes and shipping calculated at checkout' : 'Sign in to complete your purchase'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
