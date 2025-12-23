import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { 
  ShoppingBag, 
  Heart, 
  Star, 
  Truck, 
  Plane, 
  Shield,
  Minus,
  Plus,
  ChevronLeft
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error('Product not found');
      navigate('/shop');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    const success = await addToCart(product.id, quantity, selectedVariant);
    if (success) {
      toast.success('Added to cart', {
        description: `${quantity}x ${product.name}`,
        action: {
          label: 'View Cart',
          onClick: () => navigate('/cart'),
        },
      });
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to purchase');
      navigate('/login');
      return;
    }

    const success = await addToCart(product.id, quantity, selectedVariant);
    if (success) {
      navigate('/cart');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
            <div className="aspect-square bg-muted rounded-sm" />
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded w-1/4" />
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-24 bg-muted rounded" />
              <div className="h-12 bg-muted rounded w-1/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const displayPrice = product.discount_price || product.price;
  const hasDiscount = product.discount_price && product.discount_price < product.price;
  const discountPercent = hasDiscount ? Math.round((1 - product.discount_price / product.price) * 100) : 0;

  return (
    <div className="min-h-screen py-8" data-testid="product-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          data-testid="back-btn"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to shop
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div className="aspect-square overflow-hidden bg-muted">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col space-y-2">
              {product.is_duty_free && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-medium">
                  Duty Free
                </span>
              )}
              {hasDiscount && (
                <span className="bg-destructive text-destructive-foreground px-3 py-1 rounded text-sm font-medium">
                  -{discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Wishlist */}
            <button className="absolute top-4 right-4 p-3 bg-white rounded-full shadow-lg hover:bg-muted transition-colors">
              <Heart className="h-5 w-5" />
            </button>
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Brand & Category */}
            <div>
              {product.brand && (
                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
                  {product.brand.name}
                </p>
              )}
              <span className="text-xs text-muted-foreground">{product.category}</span>
            </div>

            {/* Title */}
            <h1 className="font-serif text-3xl sm:text-4xl font-medium" data-testid="product-name">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline space-x-3">
              <span className="text-3xl font-semibold" data-testid="product-price">
                ${displayPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-xl text-muted-foreground line-through">
                  ${product.price.toFixed(2)}
                </span>
              )}
            </div>

            {/* Loyalty Points */}
            {product.loyalty_points_earn > 0 && (
              <div className="flex items-center space-x-2 p-4 bg-secondary rounded-sm">
                <Star className="h-5 w-5 text-amber-600" />
                <span className="text-sm">
                  Earn <strong>{product.loyalty_points_earn}</strong> loyalty points with this purchase
                </span>
              </div>
            )}

            {/* Description */}
            <p className="text-muted-foreground leading-relaxed" data-testid="product-description">
              {product.description}
            </p>

            {/* SKU */}
            <p className="font-mono-display text-muted-foreground">
              SKU: {product.sku}
            </p>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border rounded-full">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-muted rounded-l-full transition-colors"
                    data-testid="qty-decrease"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-medium" data-testid="qty-value">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="p-3 hover:bg-muted rounded-r-full transition-colors"
                    data-testid="qty-increase"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.stock} in stock
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                onClick={handleAddToCart}
                variant="outline"
                className="flex-1 rounded-full py-6 text-lg"
                data-testid="add-to-cart-btn"
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
              <Button 
                onClick={handleBuyNow}
                className="flex-1 btn-primary"
                data-testid="buy-now-btn"
              >
                Buy Now
              </Button>
            </div>

            {/* Delivery Info */}
            <div className="border-t pt-6 space-y-4">
              <div className="flex items-start space-x-4">
                <Plane className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Airport Pickup</p>
                  <p className="text-sm text-muted-foreground">
                    Collect at your departure gate or lounge
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Truck className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Home Delivery</p>
                  <p className="text-sm text-muted-foreground">
                    Free shipping on orders over $100
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Shield className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Secure Checkout</p>
                  <p className="text-sm text-muted-foreground">
                    Your payment information is protected
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
