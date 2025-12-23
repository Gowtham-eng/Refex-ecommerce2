import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowRight, 
  Plane, 
  Gift, 
  Truck, 
  Shield, 
  Star,
  ChevronRight,
  Sparkles,
  Crown,
  Globe
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
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    {
      title: "Luxury Shopping,",
      subtitle: "Elevated",
      description: "Discover exclusive duty-free products from the world's finest brands.",
      image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=80",
      cta: "Shop Collection"
    },
    {
      title: "Tax-Free",
      subtitle: "Indulgence",
      description: "Save up to 40% on premium fragrances, spirits & accessories.",
      image: "https://images.unsplash.com/photo-1587304946976-cbbbafce2133?w=1920&q=80",
      cta: "Explore Duty Free"
    },
    {
      title: "VIP Travel",
      subtitle: "Experience",
      description: "Earn rewards, unlock perks, and shop like royalty.",
      image: "https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1920&q=80",
      cta: "Join Rewards"
    }
  ];

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(interval);
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
    { name: 'Perfumes', image: 'https://images.unsplash.com/photo-1587304946976-cbbbafce2133?w=400', count: 45, icon: Sparkles },
    { name: 'Spirits', image: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400', count: 32, icon: Crown },
    { name: 'Chocolates', image: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=400', count: 28, icon: Gift },
    { name: 'Accessories', image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400', count: 56, icon: Globe },
  ];

  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Hero Section - Enhanced */}
      <section className="relative h-[90vh] min-h-[700px] overflow-hidden bg-primary">
        {/* Animated Background Slides */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${heroSlides[currentSlide].image})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/70 to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 right-20 w-32 h-32 bg-white/5 rounded-full blur-xl"
          />
          <motion.div
            animate={{ y: [0, 30, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-40 right-40 w-48 h-48 bg-secondary/20 rounded-full blur-2xl"
          />
          <motion.div
            animate={{ x: [0, 20, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-40 left-1/3 w-24 h-24 bg-white/5 rounded-full blur-lg"
          />
        </div>

        {/* Content */}
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
          <div className="max-w-2xl">
            {/* Welcome Badge */}
            {isAuthenticated && user && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-8"
              >
                <span className="inline-flex items-center space-x-3 bg-white/10 backdrop-blur-sm px-5 py-3 rounded-full border border-white/20">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <Crown className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-white/90">
                    Welcome back, <strong className="text-white">{user.name}</strong>
                  </span>
                  <span className="h-4 w-px bg-white/30" />
                  <span className="flex items-center space-x-1 text-secondary">
                    <Star className="h-4 w-4" />
                    <strong>{user.loyalty_points}</strong>
                    <span className="text-white/70">pts</span>
                  </span>
                </span>
              </motion.div>
            )}
            
            {/* Main Title */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tight text-white mb-2">
                  {heroSlides[currentSlide].title}
                </h1>
                <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tight text-secondary italic mb-8">
                  {heroSlides[currentSlide].subtitle}
                </h1>
                
                <p className="text-lg sm:text-xl text-white/70 mb-10 max-w-lg leading-relaxed">
                  {heroSlides[currentSlide].description}
                </p>
              </motion.div>
            </AnimatePresence>
            
            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-4"
            >
              <Button 
                onClick={() => navigate('/shop')}
                className="bg-white text-primary hover:bg-white/90 rounded-full px-10 py-7 text-lg font-medium shadow-2xl hover:shadow-white/20 transition-all duration-300 hover:scale-105"
                data-testid="shop-now-btn"
              >
                {heroSlides[currentSlide].cta}
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/brands')}
                className="rounded-full px-8 py-7 text-lg border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300"
              >
                View All Brands
              </Button>
            </motion.div>

            {/* Slide Indicators */}
            <div className="flex space-x-3 mt-12">
              {heroSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    idx === currentSlide ? 'w-12 bg-white' : 'w-6 bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Side Stats */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="hidden lg:flex flex-col space-y-6 absolute right-8 top-1/2 -translate-y-1/2"
          >
            {[
              { value: '500+', label: 'Premium Products' },
              { value: '50+', label: 'Luxury Brands' },
              { value: '5', label: 'Airports' },
            ].map((stat, idx) => (
              <div key={idx} className="text-right p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-white/60">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-3 bg-white rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* Airport Selection Banner */}
      {!selectedAirport && airports.length > 0 && (
        <motion.section 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-secondary py-5 border-b"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <Plane className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">Select your departure airport</p>
                  <p className="text-sm text-muted-foreground">For personalized shopping experience</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {airports.slice(0, 4).map((airport) => (
                  <Button
                    key={airport.id}
                    variant="outline"
                    size="sm"
                    onClick={() => onAirportChange(airport)}
                    className="rounded-full bg-white hover:bg-primary hover:text-white transition-all"
                    data-testid={`select-airport-${airport.code}`}
                  >
                    {airport.code} - {airport.city}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Features - Enhanced */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Plane, title: 'Airport Pickup', desc: 'Collect at your gate or lounge', color: 'bg-blue-50 text-blue-600' },
              { icon: Gift, title: 'Duty Free', desc: 'Tax-free luxury shopping', color: 'bg-amber-50 text-amber-600' },
              { icon: Truck, title: 'Home Delivery', desc: 'Ship anywhere worldwide', color: 'bg-green-50 text-green-600' },
              { icon: Shield, title: 'Secure Payment', desc: '100% encrypted checkout', color: 'bg-purple-50 text-purple-600' },
            ].map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group text-center p-8 rounded-2xl bg-card hover:shadow-luxury-hover transition-all duration-300"
              >
                <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-7 w-7" />
                </div>
                <h4 className="font-medium text-lg mb-2">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories - Enhanced */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-secondary rounded-full text-sm font-medium mb-4">
              Browse Collections
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl font-medium mb-4">Shop by Category</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Discover our curated selection of premium duty-free products
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, idx) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link 
                  to={`/shop?category=${category.name}`}
                  className="group block relative aspect-[3/4] overflow-hidden rounded-2xl"
                  data-testid={`category-${category.name.toLowerCase()}`}
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  
                  {/* Icon Badge */}
                  <div className="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <category.icon className="h-5 w-5 text-primary" />
                  </div>
                  
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="font-serif text-2xl text-white font-medium mb-1">{category.name}</h3>
                    <p className="text-white/60 text-sm">{category.count} products</p>
                    <div className="flex items-center text-secondary mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-sm font-medium">Explore</span>
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products - Enhanced */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-end justify-between mb-12"
          >
            <div>
              <span className="inline-block px-4 py-2 bg-secondary rounded-full text-sm font-medium mb-4">
                Bestsellers
              </span>
              <h2 className="font-serif text-4xl sm:text-5xl font-medium mb-2">Featured Products</h2>
              <p className="text-muted-foreground text-lg">Handpicked luxury items for discerning travelers</p>
            </div>
            <Link to="/shop" className="hidden sm:flex items-center text-sm font-medium hover:text-primary transition-colors group">
              View All 
              <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted rounded-xl mb-4" />
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
        <section className="py-20 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="inline-block px-4 py-2 bg-secondary rounded-full text-sm font-medium mb-4">
                Our Partners
              </span>
              <h2 className="font-serif text-4xl sm:text-5xl font-medium mb-4">Featured Brands</h2>
              <p className="text-muted-foreground text-lg">Shop from world-renowned luxury brands</p>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
              {brands.slice(0, 5).map((brand, idx) => (
                <motion.div
                  key={brand.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Link
                    to={`/shop?brand=${brand.id}`}
                    className="group block text-center p-6 bg-card rounded-2xl hover:shadow-luxury-hover transition-all"
                    data-testid={`brand-${brand.id}`}
                  >
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted overflow-hidden group-hover:scale-110 transition-transform">
                      <img
                        src={brand.logo_url}
                        alt={brand.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h4 className="font-medium group-hover:text-primary transition-colors">{brand.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{brand.category}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Loyalty CTA - Enhanced */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary rounded-full translate-x-1/3 translate-y-1/3" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="max-w-xl"
            >
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full mb-6">
                <Crown className="h-5 w-5 text-secondary" />
                <span className="text-sm font-medium">JetShop Rewards</span>
              </div>
              <h2 className="font-serif text-4xl sm:text-5xl font-medium mb-6">
                Earn Points.<br />
                <span className="text-secondary">Unlock Luxury.</span>
              </h2>
              <p className="text-primary-foreground/70 text-lg mb-8 leading-relaxed">
                Join our exclusive loyalty program and earn points on every purchase. 
                Unlock VIP perks, free shipping, and lounge access.
              </p>
              {!isAuthenticated ? (
                <Button 
                  onClick={() => navigate('/register')}
                  className="bg-white text-primary hover:bg-white/90 rounded-full px-10 py-7 text-lg shadow-2xl hover:scale-105 transition-all"
                  data-testid="join-rewards-btn"
                >
                  <Gift className="mr-3 h-5 w-5" />
                  Join Now - Get 100 Free Points
                </Button>
              ) : (
                <Button 
                  onClick={() => navigate('/loyalty')}
                  className="bg-white text-primary hover:bg-white/90 rounded-full px-10 py-7 text-lg shadow-2xl hover:scale-105 transition-all"
                >
                  View Your Rewards
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
              )}
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { tier: 'Bronze', points: '0+', benefit: '1x Points', color: 'from-amber-600 to-amber-700' },
                { tier: 'Silver', points: '500+', benefit: '1.5x Points', color: 'from-gray-400 to-gray-500' },
                { tier: 'Gold', points: '1000+', benefit: '2x Points', color: 'from-yellow-500 to-yellow-600' },
                { tier: 'Platinum', points: '2000+', benefit: '3x Points', color: 'from-slate-600 to-slate-700' },
              ].map((level, idx) => (
                <motion.div 
                  key={level.tier}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className={`relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br ${level.color}`}
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <Star className="h-6 w-6 text-white/80 mb-3" />
                  <h4 className="font-serif text-xl font-medium text-white mb-1">{level.tier}</h4>
                  <p className="text-xs text-white/60 mb-2">{level.points} pts</p>
                  <p className="text-sm text-white/80">{level.benefit}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
