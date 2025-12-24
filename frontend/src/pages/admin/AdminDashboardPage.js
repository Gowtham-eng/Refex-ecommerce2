import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { 
  Shield, Package, ShoppingCart, BarChart3, Settings, LogOut,
  Plus, Search, Edit, Trash2, Eye, Users, Store, Box,
  DollarSign, TrendingUp, Clock, CheckCircle2, XCircle,
  ChevronRight, Bell, Menu, X, ChevronDown, Building2
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user, role, logout, isAuthenticated, isAdmin, loading: authLoading } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [stats, setStats] = useState(null);
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [airports, setAirports] = useState([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login');
    }
    if (!authLoading && !isAdmin) {
      navigate('/admin/brand-dashboard');
    }
  }, [authLoading, isAuthenticated, isAdmin, navigate]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchDashboardData();
    }
  }, [isAuthenticated, isAdmin, activeTab]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, brandsRes, productsRes, ordersRes, airportsRes] = await Promise.all([
        axios.get(`${API_URL}/api/super-admin/dashboard`),
        axios.get(`${API_URL}/api/super-admin/brands?limit=50`),
        axios.get(`${API_URL}/api/super-admin/products?limit=50`),
        axios.get(`${API_URL}/api/super-admin/orders?limit=50`),
        axios.get(`${API_URL}/api/super-admin/airports`).catch(() => ({ data: [] }))
      ]);
      
      setStats(statsRes.data);
      setBrands(brandsRes.data.brands || []);
      setProducts(productsRes.data.products || []);
      setOrders(ordersRes.data.orders || []);
      setAirports(airportsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'brands', label: 'Brands', icon: Store },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-dashboard">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-700">
            <Link to="/admin/dashboard" className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-purple-400" />
              <span className="font-semibold text-lg">Admin Panel</span>
            </Link>
            <button className="lg:hidden text-slate-400" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Admin Info */}
          <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50">
            <p className="font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-purple-400">Super Admin</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id 
                    ? 'bg-purple-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-slate-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`${sidebarOpen ? 'lg:ml-64' : ''} transition-all duration-200`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-40 h-16 bg-white border-b flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-semibold text-lg capitalize">{activeTab}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-full relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-purple-600">{user?.name?.charAt(0)}</span>
              </div>
              <span className="text-sm font-medium hidden sm:block">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {activeTab === 'overview' && (
            <OverviewTab stats={stats} brands={brands} orders={orders} loading={loading} />
          )}
          {activeTab === 'brands' && (
            <BrandsTab brands={brands} airports={airports} onRefresh={fetchDashboardData} />
          )}
          {activeTab === 'products' && (
            <ProductsTab products={products} brands={brands} onRefresh={fetchDashboardData} />
          )}
          {activeTab === 'orders' && (
            <OrdersTab orders={orders} onRefresh={fetchDashboardData} />
          )}
          {activeTab === 'users' && (
            <UsersTab />
          )}
          {activeTab === 'settings' && (
            <SettingsTab />
          )}
        </main>
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ stats, brands, orders, loading }) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Brands', value: stats?.total_brands || 0, icon: Store, color: 'bg-blue-500', change: '+12%' },
    { label: 'Total Products', value: stats?.total_products || 0, icon: Package, color: 'bg-green-500', change: '+8%' },
    { label: 'Total Orders', value: stats?.total_orders || 0, icon: ShoppingCart, color: 'bg-purple-500', change: '+23%' },
    { label: 'Total Revenue', value: `$${(stats?.total_revenue || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-amber-500', change: '+18%' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">{stat.change}</span>
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Brands */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="font-semibold">Recent Brands</h2>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <div className="divide-y">
            {brands.slice(0, 5).map((brand) => (
              <div key={brand.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden">
                    {brand.logo_url ? (
                      <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-full h-full p-2 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{brand.name}</p>
                    <p className="text-xs text-gray-500">{brand.category}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${brand.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {brand.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="font-semibold">Recent Orders</h2>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <div className="divide-y">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-medium">#{order.id?.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-gray-500">{order.customer?.name || 'Customer'}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${order.total?.toFixed(2)}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.order_status === 'delivered' ? 'bg-green-100 text-green-700' :
                    order.order_status === 'processing' ? 'bg-blue-100 text-blue-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {order.order_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Brands Tab Component
function BrandsTab({ brands, airports, onRefresh }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBrands = brands.filter(b => 
    b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Brand Account
        </Button>
      </div>

      {/* Brands Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Products</th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Orders</th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredBrands.map((brand) => (
                <tr key={brand.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden">
                        {brand.logo_url ? (
                          <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-cover" />
                        ) : (
                          <Store className="w-full h-full p-2 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{brand.name}</p>
                        <p className="text-xs text-gray-500">{brand.description?.slice(0, 50)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{brand.category}</td>
                  <td className="px-6 py-4 text-center text-sm font-medium">{brand.product_count || 0}</td>
                  <td className="px-6 py-4 text-center text-sm font-medium">{brand.order_count || 0}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${brand.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {brand.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center space-x-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <Eye className="h-4 w-4 text-gray-500" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <Edit className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredBrands.length === 0 && (
          <div className="p-8 text-center text-gray-500">No brands found</div>
        )}
      </div>

      {/* Create Brand Modal */}
      {showCreateModal && (
        <CreateBrandModal 
          airports={airports} 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={() => {
            setShowCreateModal(false);
            onRefresh();
          }} 
        />
      )}
    </div>
  );
}

// Create Brand Modal
function CreateBrandModal({ airports, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    brand_name: '',
    brand_description: '',
    brand_category: '',
    airport_id: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/super-admin/brands/create-account`, formData);
      toast.success('Brand account created successfully!');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create brand account');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Perfumes', 'Spirits', 'Chocolates', 'Accessories', 'Electronics', 'Fashion', 'Watches', 'Cosmetics'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">Create Brand Account</h2>
            <p className="text-sm text-gray-500">Create a new brand/retailer account</p>
          </div>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Admin Info */}
          <div>
            <h3 className="font-medium text-sm text-gray-700 mb-3 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Admin User Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  type="email"
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="john@brand.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Mobile</Label>
                <Input 
                  value={formData.mobile} 
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  placeholder="+91 9876543210"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input 
                  type="password"
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Minimum 8 characters"
                  required
                />
              </div>
            </div>
          </div>

          {/* Brand Info */}
          <div>
            <h3 className="font-medium text-sm text-gray-700 mb-3 flex items-center">
              <Store className="h-4 w-4 mr-2" />
              Brand Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Brand Name</Label>
                <Input 
                  value={formData.brand_name} 
                  onChange={(e) => setFormData({...formData, brand_name: e.target.value})}
                  placeholder="Brand Name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select 
                  className="w-full border rounded-md p-2 h-10"
                  value={formData.brand_category}
                  onChange={(e) => setFormData({...formData, brand_category: e.target.value})}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Description</Label>
                <textarea 
                  className="w-full border rounded-md p-2 text-sm"
                  value={formData.brand_description} 
                  onChange={(e) => setFormData({...formData, brand_description: e.target.value})}
                  placeholder="Brief description of the brand..."
                  rows={3}
                  required
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Airport</Label>
                <select 
                  className="w-full border rounded-md p-2 h-10"
                  value={formData.airport_id}
                  onChange={(e) => setFormData({...formData, airport_id: e.target.value})}
                  required
                >
                  <option value="">Select airport</option>
                  {airports.map(airport => (
                    <option key={airport.id} value={airport.id}>{airport.name} ({airport.code})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700">
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Products Tab Component
function ProductsTab({ products, brands, onRefresh }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-sm overflow-hidden"
          >
            <div className="aspect-video bg-gray-100 relative">
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              {!product.is_active && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-medium">Inactive</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium line-clamp-1">{product.name}</h3>
                  <p className="text-xs text-gray-500">{product.brand_name}</p>
                </div>
                <span className="text-lg font-bold text-purple-600">${product.price}</span>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  product.stock > 20 ? 'bg-green-100 text-green-700' :
                  product.stock > 5 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  Stock: {product.stock}
                </span>
                <div className="flex space-x-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Edit className="h-4 w-4 text-gray-500" />
                  </button>
                  <button className="p-2 hover:bg-red-50 rounded-lg">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No products found</p>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <AddProductModal 
          brands={brands}
          onClose={() => setShowAddModal(false)} 
          onSuccess={() => {
            setShowAddModal(false);
            onRefresh();
          }} 
        />
      )}
    </div>
  );
}

// Add Product Modal
function AddProductModal({ brands, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    brand_id: '',
    name: '',
    description: '',
    price: '',
    sku: '',
    stock: '100',
    category: '',
    image_url: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500',
    loyalty_points_earn: '5',
    is_duty_free: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/super-admin/products`, {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        loyalty_points_earn: parseInt(formData.loyalty_points_earn)
      });
      toast.success('Product created successfully');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="font-semibold text-lg">Add New Product</h2>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Brand</label>
            <select 
              className="w-full border rounded-md p-2"
              value={formData.brand_id}
              onChange={(e) => setFormData({...formData, brand_id: e.target.value})}
              required
            >
              <option value="">Select brand</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Product Name</label>
            <Input 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea 
              className="w-full border rounded-md p-2 text-sm"
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Price ($)</label>
              <Input 
                type="number"
                step="0.01"
                value={formData.price} 
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">SKU</label>
              <Input 
                value={formData.sku} 
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Stock</label>
              <Input 
                type="number"
                value={formData.stock} 
                onChange={(e) => setFormData({...formData, stock: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Input 
                value={formData.category} 
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Image URL</label>
            <Input 
              value={formData.image_url} 
              onChange={(e) => setFormData({...formData, image_url: e.target.value})}
            />
          </div>
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox"
              checked={formData.is_duty_free}
              onChange={(e) => setFormData({...formData, is_duty_free: e.target.checked})}
              className="rounded"
            />
            <label className="text-sm">Duty Free Product</label>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700">
              {loading ? 'Creating...' : 'Create Product'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Orders Tab Component
function OrdersTab({ orders, onRefresh }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          order.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.order_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API_URL}/api/super-admin/orders/${orderId}/status?status=${status}`);
      toast.success('Order status updated');
      onRefresh();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const statuses = ['pending', 'confirmed', 'processing', 'ready_for_pickup', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="border rounded-md px-4 py-2"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          {statuses.map(s => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium">#{order.id?.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium">{order.customer?.name || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{order.customer?.email}</p>
                  </td>
                  <td className="px-6 py-4 text-center">{order.items?.length || 0}</td>
                  <td className="px-6 py-4 text-center font-medium">${order.total?.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <select
                      className={`text-xs px-2 py-1 rounded-full border-0 ${
                        order.order_status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.order_status === 'processing' ? 'bg-blue-100 text-blue-700' :
                        order.order_status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}
                      value={order.order_status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    >
                      {statuses.map(s => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Eye className="h-4 w-4 text-gray-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && (
          <div className="p-8 text-center text-gray-500">No orders found</div>
        )}
      </div>
    </div>
  );
}

// Users Tab Component
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/super-admin/users?limit=50`);
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl" />)}
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-purple-600">{user.name?.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'brand_admin' ? 'bg-indigo-100 text-indigo-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role || 'customer'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${user.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="p-8 text-center text-gray-500">No users found</div>
        )}
      </div>
    </div>
  );
}

// Settings Tab Component
function SettingsTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold text-lg mb-6">Platform Settings</h2>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium">Platform Commission</p>
            <p className="text-sm text-gray-500">Default commission rate for all brands: 10%</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium">Payout Schedule</p>
            <p className="text-sm text-gray-500">Weekly payouts to brand accounts</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium">Delivery Options</p>
            <p className="text-sm text-gray-500">Airport delivery & Home delivery enabled</p>
          </div>
        </div>
      </div>
    </div>
  );
}
