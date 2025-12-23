import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowRight, 
  Plane, 
  Gift, 
  Truck, 
  Shield, 
  Star,
  ChevronRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import ProductCard from '../components/ProductCard';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function HomePage({ selectedAirport, onAirportChange, airports }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedAirport]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, brandsRes] = await Promise.all([
        axios.get(`${API_URL}/api/products?limit=8`),
        axios.get(`${API_URL}/api/brands${selectedAirport ? `?airport_id=${selectedAirport.id}` : ''}`)
      ]);
      setFeaturedProducts(productsRes.data.products || []);
      setBrands(brandsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { name: 'Perfumes', image: 'https://images.unsplash.com/photo-1587304946976-cbbbafce2133?w=400', count: 45 },
    { name: 'Spirits', image: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400', count: 32 },
    { name: 'Chocolates', image: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=400', count: 28 },
    { name: 'Accessories', image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400', count: 56 },
  ];

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: 'url(https://images.unsplash.com/photo-1743291393141-0047030d2544?w=1920&q=80)',
          }}
        />
        <div className="absolute inset-0 hero-overlay" />
        
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            {isAuthenticated && user && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
              >
                <span className="inline-flex items-center space-x-2 bg-secondary/80 backdrop-blur px-4 py-2 rounded-full text-sm">
                  <Gift className="h-4 w-4 text-amber-600" />
                  <span>Welcome back, <strong>{user.name}</strong>! You have <strong>{user.loyalty_points}</strong> points</span>
                </span>
              </motion.div>
            )}
            
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-foreground mb-6">
              Luxury Shopping,<br />
              <span className="italic">Elevated</span>
            </h1>
            
            <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-lg">
              Discover exclusive duty-free products from the world's finest brands. 
              Shop before your flight and pick up at the airport.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={() => navigate('/shop')}
                className="btn-primary text-lg"
                data-testid="shop-now-btn"
              >
                Shop Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/brands')}
                className="rounded-full px-8 py-6 text-lg border-2"
              >
                Explore Brands
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Airport Selection Banner */}
      {!selectedAirport && airports.length > 0 && (
        <section className="bg-secondary py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <Plane className="h-5 w-5 text-primary" />
                <span className="font-medium">Select your departure airport for personalized shopping</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {airports.slice(0, 4).map((airport) => (
                  <Button
                    key={airport.id}
                    variant="outline"
                    size="sm"
                    onClick={() => onAirportChange(airport)}
                    className="rounded-full"
                    data-testid={`select-airport-${airport.code}`}
                  >
                    {airport.code} - {airport.city}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Plane, title: 'Airport Pickup', desc: 'Collect at your gate' },
              { icon: Gift, title: 'Duty Free', desc: 'Save on taxes' },
              { icon: Truck, title: 'Home Delivery', desc: 'Ship to your address' },
              { icon: Shield, title: 'Secure Payment', desc: '100% protected' },
            ].map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center space-x-4"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-medium mb-2">Shop by Category</h2>
              <p className="text-muted-foreground">Discover our curated collections</p>
            </div>
            <Link to="/shop" className="hidden sm:flex items-center text-sm font-medium hover:text-primary transition-colors">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, idx) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link 
                  to={`/shop?category=${category.name}`}
                  className="group block relative aspect-[3/4] overflow-hidden"
                  data-testid={`category-${category.name.toLowerCase()}`}
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="font-serif text-xl text-white font-medium mb-1">{category.name}</h3>
                    <p className="text-white/70 text-sm">{category.count} products</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-medium mb-2">Featured Products</h2>
              <p className="text-muted-foreground">Handpicked luxury items for travelers</p>
            </div>
            <Link to="/shop" className="hidden sm:flex items-center text-sm font-medium hover:text-primary transition-colors">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted rounded-sm mb-4" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product, idx) => (
                <ProductCard key={product.id} product={product} index={idx} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Brands */}
      {brands.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl sm:text-4xl font-medium mb-2">Featured Brands</h2>
              <p className="text-muted-foreground">Shop from world-renowned luxury brands</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
              {brands.slice(0, 5).map((brand, idx) => (
                <motion.div
                  key={brand.id}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Link
                    to={`/shop?brand=${brand.id}`}
                    className="group block text-center"
                    data-testid={`brand-${brand.id}`}
                  >
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted overflow-hidden group-hover:shadow-luxury transition-shadow">
                      <img
                        src={brand.logo_url}
                        alt={brand.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h4 className="font-medium group-hover:text-primary transition-colors">{brand.name}</h4>
                    <p className="text-xs text-muted-foreground">{brand.category}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Loyalty CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="max-w-xl">
              <div className="flex items-center space-x-2 mb-4">
                <Star className="h-5 w-5 text-amber-400" />
                <span className="text-sm font-medium text-primary-foreground/70 uppercase tracking-wider">Loyalty Program</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-medium mb-4">
                Join JetShop Rewards
              </h2>
              <p className="text-primary-foreground/70 mb-8">
                Earn points on every purchase, unlock exclusive benefits, and enjoy priority services at airports worldwide.
              </p>
              {!isAuthenticated ? (
                <Button 
                  onClick={() => navigate('/register')}
                  className="bg-white text-primary hover:bg-white/90 rounded-full px-8 py-6 text-lg"
                  data-testid="join-rewards-btn"
                >
                  Join Now - Get 100 Welcome Points
                </Button>
              ) : (
                <Button 
                  onClick={() => navigate('/loyalty')}
                  className="bg-white text-primary hover:bg-white/90 rounded-full px-8 py-6 text-lg"
                >
                  View Your Benefits
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-6">
              {[
                { tier: 'Bronze', points: '0+', benefit: '1x Points' },
                { tier: 'Silver', points: '500+', benefit: '1.5x Points' },
                { tier: 'Gold', points: '1000+', benefit: '2x Points' },
                { tier: 'Platinum', points: '2000+', benefit: '3x Points' },
              ].map((level) => (
                <div key={level.tier} className="text-center p-6 bg-primary-foreground/10 rounded-sm">
                  <h4 className="font-serif text-lg font-medium mb-1">{level.tier}</h4>
                  <p className="text-xs text-primary-foreground/50 mb-2">{level.points} pts</p>
                  <p className="text-sm text-primary-foreground/70">{level.benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
