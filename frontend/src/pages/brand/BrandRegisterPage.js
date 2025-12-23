import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useBrandAuth } from '../../context/BrandAuthContext';
import { Store, Mail, Lock, User, Phone, Building, ArrowRight, MapPin } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function BrandRegisterPage() {
  const navigate = useNavigate();
  const { register } = useBrandAuth();
  const [loading, setLoading] = useState(false);
  const [airports, setAirports] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    brand_name: '',
    brand_description: '',
    brand_category: '',
    airport_id: '',
    gst_number: '',
    pan_number: ''
  });

  useEffect(() => {
    fetchAirports();
  }, []);

  const fetchAirports = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/airports`);
      setAirports(response.data || []);
    } catch (error) {
      console.error('Failed to fetch airports:', error);
    }
  };

  const categories = [
    'Perfumes', 'Spirits', 'Chocolates', 'Accessories', 'Fashion', 
    'Beauty & Skincare', 'Leather Goods', 'Luxury Jewelry', 'Electronics',
    'Local Specialties', 'Handicrafts', 'Books & Stationery', 'Food & Beverage'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await register(formData);
      toast.success('Brand registration successful!');
      navigate('/brand/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="brand-register-page">
      {/* Left Side */}
      <div className="hidden lg:block lg:w-1/2 relative bg-gradient-to-br from-indigo-600 to-purple-700">
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-12">
          <Store className="h-20 w-20 mb-6 opacity-80" />
          <h2 className="font-serif text-4xl font-medium mb-4 text-center">
            Join JetShop Marketplace
          </h2>
          <p className="text-white/70 text-center max-w-md mb-8">
            Reach millions of travelers. Showcase your products at premium airport locations.
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-2xl font-bold">500K+</p>
              <p className="text-white/70">Monthly Visitors</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-2xl font-bold">7</p>
              <p className="text-white/70">Airport Partners</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg py-8"
        >
          <div className="flex items-center space-x-2 mb-8">
            <Store className="h-6 w-6 text-indigo-600" />
            <span className="font-serif text-xl font-semibold">JetShop Partner</span>
          </div>

          <h1 className="font-serif text-3xl font-medium mb-2">Register Your Brand</h1>
          <p className="text-muted-foreground mb-8">
            Complete the form to become a JetShop partner
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Personal Details */}
            <div className="space-y-4 pb-4 border-b">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Admin Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Mobile</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="+91..."
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="admin@yourbrand.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Min 8 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Brand Details */}
            <div className="space-y-4 pb-4 border-b">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Brand Details</h3>
              
              <div className="space-y-2">
                <Label>Brand Name</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Your brand name"
                    value={formData.brand_name}
                    onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Brand Description</Label>
                <textarea
                  placeholder="Brief description of your brand..."
                  value={formData.brand_description}
                  onChange={(e) => setFormData({ ...formData, brand_description: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select 
                    value={formData.brand_category} 
                    onValueChange={(value) => setFormData({ ...formData, brand_category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Airport Location</Label>
                  <Select 
                    value={formData.airport_id} 
                    onValueChange={(value) => setFormData({ ...formData, airport_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select airport" />
                    </SelectTrigger>
                    <SelectContent>
                      {airports.map((airport) => (
                        <SelectItem key={airport.id} value={airport.id}>
                          {airport.code} - {airport.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Business Details */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Business Details (Optional)</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>GST Number</Label>
                  <Input
                    placeholder="GST number"
                    value={formData.gst_number}
                    onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>PAN Number</Label>
                  <Input
                    placeholder="PAN number"
                    value={formData.pan_number}
                    onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-full py-6"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register Brand'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already registered?{' '}
              <Link to="/brand/login" className="text-indigo-600 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
