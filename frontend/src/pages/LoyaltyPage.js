import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Star, 
  Gift, 
  Truck, 
  Percent, 
  Award,
  ChevronRight,
  Lock
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function LoyaltyPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchLoyaltyData();
    }
  }, [isAuthenticated]);

  const fetchLoyaltyData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/loyalty`);
      setLoyaltyData(response.data);
    } catch (error) {
      console.error('Failed to fetch loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <Star className="h-10 w-10 text-amber-600" />
          </div>
          <h2 className="font-serif text-2xl font-medium mb-2">Join JetShop Rewards</h2>
          <p className="text-muted-foreground mb-6">
            Create an account to earn points on every purchase and unlock exclusive benefits
          </p>
          <Button onClick={() => navigate('/register')} className="rounded-full">
            Sign Up Now
          </Button>
        </div>
      </div>
    );
  }

  const tiers = [
    { name: 'Bronze', minPoints: 0, color: 'bg-amber-600', benefits: ['1x Points on purchases', 'Access to member-only deals'] },
    { name: 'Silver', minPoints: 500, color: 'bg-gray-400', benefits: ['1.5x Points', '5% discount on all orders', 'Free shipping over $150'] },
    { name: 'Gold', minPoints: 1000, color: 'bg-yellow-500', benefits: ['2x Points', '10% discount', 'Free shipping over $100', 'Lounge access coupons'] },
    { name: 'Platinum', minPoints: 2000, color: 'bg-slate-800', benefits: ['3x Points', '15% discount', 'Free shipping always', 'Priority delivery', 'VIP lounge access'] },
  ];

  const currentTierIndex = tiers.findIndex(t => t.name === loyaltyData?.tier);
  const nextTier = currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : null;
  const progressToNext = nextTier 
    ? Math.min(100, ((user?.loyalty_points || 0) / nextTier.minPoints) * 100)
    : 100;

  return (
    <div className="min-h-screen py-8" data-testid="loyalty-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center space-x-2 bg-secondary px-4 py-2 rounded-full mb-4">
            <Star className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium">JetShop Rewards</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium mb-2">Your Loyalty Status</h1>
          <p className="text-muted-foreground">Earn points, unlock benefits, enjoy exclusive perks</p>
        </motion.div>

        {/* Points Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-primary text-primary-foreground rounded-sm p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-primary-foreground/70 text-sm mb-1">Your Points Balance</p>
              <p className="text-5xl font-bold mb-2">{user?.loyalty_points || 0}</p>
              <p className="text-sm text-primary-foreground/70">
                Loyalty ID: <span className="font-mono">{loyaltyData?.loyalty_id}</span>
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                loyaltyData?.tier === 'Platinum' ? 'bg-slate-600' :
                loyaltyData?.tier === 'Gold' ? 'bg-yellow-500' :
                loyaltyData?.tier === 'Silver' ? 'bg-gray-400' : 'bg-amber-600'
              }`}>
                <Award className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{loyaltyData?.tier || 'Bronze'}</p>
                <p className="text-sm text-primary-foreground/70">Member</p>
              </div>
            </div>
          </div>

          {nextTier && (
            <div className="mt-8">
              <div className="flex justify-between text-sm mb-2">
                <span>{loyaltyData?.points_to_next_tier || 0} points to {nextTier.name}</span>
                <span>{progressToNext.toFixed(0)}%</span>
              </div>
              <Progress value={progressToNext} className="h-2" />
            </div>
          )}
        </motion.div>

        {/* Current Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-sm shadow-luxury p-6 mb-8"
        >
          <h2 className="font-serif text-xl font-medium mb-6">Your Benefits</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-sm">
              <Star className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Points Multiplier</p>
                <p className="text-sm text-muted-foreground">{loyaltyData?.benefits?.points_multiplier || 1}x on all purchases</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-sm">
              <Percent className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Member Discount</p>
                <p className="text-sm text-muted-foreground">{loyaltyData?.benefits?.discount || 0}% off all orders</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-sm">
              <Truck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Free Shipping</p>
                <p className="text-sm text-muted-foreground">
                  {loyaltyData?.benefits?.free_shipping_threshold === 0 
                    ? 'Always free' 
                    : `Orders over $${loyaltyData?.benefits?.free_shipping_threshold || 200}`}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-sm">
              <Gift className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Exclusive Offers</p>
                <p className="text-sm text-muted-foreground">Member-only deals & early access</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tier Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-sm shadow-luxury p-6"
        >
          <h2 className="font-serif text-xl font-medium mb-6">All Tiers</h2>
          <div className="space-y-4">
            {tiers.map((tier, idx) => {
              const isCurrentTier = tier.name === loyaltyData?.tier;
              const isLocked = idx > currentTierIndex;
              
              return (
                <div 
                  key={tier.name}
                  className={`p-4 rounded-sm border transition-colors ${
                    isCurrentTier ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tier.color}`}>
                        {isLocked ? (
                          <Lock className="h-5 w-5 text-white" />
                        ) : (
                          <Award className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{tier.name}</p>
                        <p className="text-xs text-muted-foreground">{tier.minPoints}+ points</p>
                      </div>
                    </div>
                    {isCurrentTier && (
                      <span className="px-3 py-1 bg-primary text-primary-foreground text-xs rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <ul className="space-y-1">
                    {tier.benefits.map((benefit, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-center space-x-2">
                        <ChevronRight className="h-3 w-3" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8"
        >
          <Button onClick={() => navigate('/shop')} className="rounded-full">
            Shop & Earn Points
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
