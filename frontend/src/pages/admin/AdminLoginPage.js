import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Shield, Mail, Lock, ArrowRight, Store } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      toast.success(`Welcome, ${result.user.name}!`);
      
      // Redirect based on role
      if (result.role === 'super_admin') {
        navigate('/admin/dashboard');
      } else if (result.role === 'brand_admin') {
        navigate('/admin/brand-dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="admin-login-page">
      {/* Left Side - Gradient Background */}
      <div className="hidden lg:block lg:w-1/2 relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-12">
          <div className="flex items-center space-x-4 mb-8">
            <Shield className="h-16 w-16 opacity-80" />
            <Store className="h-16 w-16 opacity-80" />
          </div>
          <h2 className="font-serif text-4xl font-medium mb-4 text-center">
            Admin & Brand Portal
          </h2>
          <p className="text-white/70 text-center max-w-md mb-8">
            Unified login for administrators and brand partners. Manage your platform, products, and orders all in one place.
          </p>
          <div className="grid grid-cols-2 gap-6 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <Shield className="h-8 w-8 mx-auto mb-2 text-purple-300" />
              <p className="text-sm font-medium">Admin Access</p>
              <p className="text-xs text-white/60">Full platform control</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <Store className="h-8 w-8 mx-auto mb-2 text-indigo-300" />
              <p className="text-sm font-medium">Brand Access</p>
              <p className="text-xs text-white/60">Manage your store</p>
            </div>
          </div>
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
            <Shield className="h-6 w-6 text-purple-600" />
            <span className="font-serif text-xl font-semibold">JetShop Admin</span>
          </div>

          <h1 className="font-serif text-3xl font-medium mb-2">Welcome Back</h1>
          <p className="text-muted-foreground mb-8">
            Sign in to access your dashboard
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
                  data-testid="admin-email-input"
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
                  data-testid="admin-password-input"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700 rounded-full py-6"
              disabled={loading}
              data-testid="admin-login-btn"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </form>

          <div className="mt-8 p-4 bg-slate-50 rounded-xl">
            <p className="text-sm text-muted-foreground mb-3 font-medium">Demo Credentials:</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-purple-500" />
                <span className="text-muted-foreground">Admin:</span>
                <code className="bg-white px-2 py-0.5 rounded text-xs">admin1@jetshop.com / admin123</code>
              </div>
              <div className="flex items-center space-x-2">
                <Store className="h-4 w-4 text-indigo-500" />
                <span className="text-muted-foreground">Brand:</span>
                <code className="bg-white px-2 py-0.5 rounded text-xs">Use brand credentials</code>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to Main Site
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
