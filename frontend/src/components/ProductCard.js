import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { ShoppingBag, Heart, Star } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

export const ProductCard = ({ product, index = 0 }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const success = await addToCart(product.id, 1);
    if (success) {
      toast.success('Added to cart', {
        description: product.name,
        action: {
          label: 'View Cart',
          onClick: () => navigate('/cart'),
        },
      });
    } else {
      toast.error('Please login to add items to cart');
      navigate('/login');
    }
  };

  const displayPrice = product.discount_price || product.price;
  const hasDiscount = product.discount_price && product.discount_price < product.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group"
    >
      <Link to={`/product/${product.id}`} data-testid={`product-card-${product.id}`}>
        <div className="product-card relative overflow-hidden bg-card shadow-luxury hover:shadow-luxury-hover">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden bg-muted">
            <img
              src={product.image_url}
              alt={product.name}
              className="product-image w-full h-full object-cover"
              loading="lazy"
            />
            
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col space-y-2">
              {product.is_duty_free && (
                <span className="badge-duty-free">Duty Free</span>
              )}
              {hasDiscount && (
                <span className="bg-destructive text-destructive-foreground px-2 py-0.5 rounded text-xs font-medium">
                  -{Math.round((1 - product.discount_price / product.price) * 100)}%
                </span>
              )}
            </div>

            {/* Quick Actions */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button className="p-2 bg-white rounded-full shadow-lg hover:bg-muted transition-colors">
                <Heart className="h-4 w-4" />
              </button>
            </div>

            {/* Add to Cart Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button 
                onClick={handleAddToCart}
                className="w-full rounded-full bg-white text-black hover:bg-white/90"
                data-testid={`add-to-cart-${product.id}`}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              {product.category}
            </p>
            <h3 className="font-serif font-medium text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-baseline space-x-2">
                <span className="text-lg font-semibold">${displayPrice.toFixed(2)}</span>
                {hasDiscount && (
                  <span className="text-sm text-muted-foreground line-through">
                    ${product.price.toFixed(2)}
                  </span>
                )}
              </div>
              
              {product.loyalty_points_earn > 0 && (
                <span className="badge-loyalty flex items-center space-x-1">
                  <Star className="h-3 w-3" />
                  <span>+{product.loyalty_points_earn}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
