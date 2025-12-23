import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBrandAuth } from '../../context/BrandAuthContext';
import { Store, Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';

export default function BrandLoginPage() {
  const navigate = useNavigate();
  const { login } = useBrandAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      toast.success('Welcome to Brand Dashboard!');
      navigate('/brand/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="brand-login-page">
      {/* Left Side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative bg-gradient-to-br from-indigo-600 to-purple-700">
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-12">
          <Store className="h-20 w-20 mb-6 opacity-80" />
          <h2 className="font-serif text-4xl font-medium mb-4 text-center">
            Brand Partner Portal
          </h2>
          <p className="text-white/70 text-center max-w-md">
            Manage your products, inventory, orders, and analytics all in one place.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center space-x-2 mb-12">
            <Store className="h-6 w-6 text-indigo-600" />
            <span className="font-serif text-xl font-semibold">JetShop Partner</span>
          </div>

          <h1 className="font-serif text-3xl font-medium mb-2">Brand Admin Login</h1>
          <p className="text-muted-foreground mb-8">
            Sign in to manage your store
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-12 h-12"
                  required
                  data-testid="brand-email-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-12 h-12"
                  required
                  data-testid="brand-password-input"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-full py-6"
              disabled={loading}
              data-testid="brand-login-btn"
            >
              {loading ? 'Signing in...' : 'Sign In to Dashboard'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Want to become a partner?{' '}
              <Link to="/brand/register" className="text-indigo-600 font-medium hover:underline">
                Register your brand
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to Main Site
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
