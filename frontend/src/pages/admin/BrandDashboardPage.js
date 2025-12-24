import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { 
  Store, Package, ShoppingCart, BarChart3, Settings, LogOut,
  Plus, Search, Edit, Trash2, AlertTriangle, Box,
  Clock, Menu, X, Banknote, Truck, Bell
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function BrandDashboardPage() {
  const navigate = useNavigate();
  const { user, brand, logout, isAuthenticated, isBrand, loading: authLoading } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [analytics, setAnalytics] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [bankDetails, setBankDetails] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated && isBrand) {
      fetchDashboardData();
    }
  }, [isAuthenticated, isBrand, activeTab]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, productsRes, ordersRes, inventoryRes, bankRes] = await Promise.all([
        axios.get(`${API_URL}/api/brand-admin/analytics/dashboard`),
        axios.get(`${API_URL}/api/brand-admin/products?limit=50`),
        axios.get(`${API_URL}/api/brand-admin/orders?limit=50`),
        axios.get(`${API_URL}/api/brand-admin/inventory`),
        axios.get(`${API_URL}/api/brand-admin/banking`).catch(() => ({ data: null }))
      ]);
      
      setAnalytics(analyticsRes.data);
      setProducts(productsRes.data.products || []);
      setOrders(ordersRes.data.orders || []);
      setInventory(inventoryRes.data || []);
      setBankDetails(bankRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
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
    { id: 'products', label: 'Products', icon: Package },
    { id: 'inventory', label: 'Inventory', icon: Box },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'banking', label: 'Banking', icon: Banknote },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="brand-dashboard-new">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b">
            <Link to="/admin/brand-dashboard" className="flex items-center space-x-2">
              <Store className="h-6 w-6 text-indigo-600" />
              <span className="font-semibold text-lg">Brand Portal</span>
            </Link>
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Brand Info */}
          <div className="px-6 py-4 border-b bg-indigo-50">
            <p className="font-medium text-indigo-900 truncate">{brand?.name}</p>
            <p className="text-xs text-indigo-600">{brand?.category}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-indigo-600">{user?.name?.charAt(0)}</span>
              </div>
              <span className="text-sm font-medium hidden sm:block">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {activeTab === 'overview' && (
            <OverviewTab analytics={analytics} orders={orders} inventory={inventory} loading={loading} />
          )}
          {activeTab === 'products' && (
            <ProductsTab products={products} onRefresh={fetchDashboardData} />
          )}
          {activeTab === 'inventory' && (
            <InventoryTab inventory={inventory} onRefresh={fetchDashboardData} />
          )}
          {activeTab === 'orders' && (
            <OrdersTab orders={orders} onRefresh={fetchDashboardData} />
          )}
          {activeTab === 'banking' && (
            <BankingTab bankDetails={bankDetails} onRefresh={fetchDashboardData} />
          )}
          {activeTab === 'settings' && (
            <SettingsTab brand={brand} />
          )}
        </main>
      </div>
    </div>
  );
}

// Overview Tab
function OverviewTab({ analytics, orders, inventory, loading }) {
  if (loading) {
    return <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
      </div>
    </div>;
  }

  const stats = [
    { label: 'Total Products', value: analytics?.total_products || 0, icon: Package, color: 'bg-blue-500' },
    { label: 'Total Orders', value: analytics?.total_orders || 0, icon: ShoppingCart, color: 'bg-green-500' },
    { label: 'Pending Orders', value: analytics?.pending_orders || 0, icon: Clock, color: 'bg-amber-500' },
    { label: 'Low Stock Items', value: analytics?.low_stock_count || 0, icon: AlertTriangle, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
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
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b">
          <h2 className="font-semibold">Recent Orders</h2>
        </div>
        <div className="divide-y">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No orders yet</div>
          ) : (
            orders.slice(0, 5).map((order) => (
              <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-medium">Order #{order.order_id?.slice(0, 8).toUpperCase()}</p>
                  <p className="text-sm text-gray-500">{order.items?.length} item(s)</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  order.order_status === 'delivered' ? 'bg-green-100 text-green-700' :
                  order.order_status === 'processing' ? 'bg-blue-100 text-blue-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {order.order_status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Products Tab
function ProductsTab({ products, onRefresh }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
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
        <Button onClick={() => setShowAddModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="aspect-video bg-gray-100">
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium line-clamp-1">{product.name}</h3>
                <span className="text-lg font-bold text-indigo-600">${product.price}</span>
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
          </div>
        ))}
      </div>

      {showAddModal && (
        <AddProductModal onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); onRefresh(); }} />
      )}
    </div>
  );
}

// Add Product Modal
function AddProductModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
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
      await axios.post(`${API_URL}/api/brand-admin/products`, {
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
            <label className="text-sm font-medium">Product Name</label>
            <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea className="w-full border rounded-md p-2 text-sm" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Price ($)</label>
              <Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">SKU</label>
              <Input value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Stock</label>
              <Input type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Input value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} required />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Image URL</label>
            <Input value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} />
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" checked={formData.is_duty_free} onChange={(e) => setFormData({...formData, is_duty_free: e.target.checked})} className="rounded" />
            <label className="text-sm">Duty Free Product</label>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
              {loading ? 'Creating...' : 'Create Product'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Inventory Tab
function InventoryTab({ inventory, onRefresh }) {
  const lowStock = inventory.filter(item => item.quantity <= item.min_stock_level);
  
  return (
    <div className="space-y-6">
      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-800">Low Stock Alert</p>
            <p className="text-sm text-red-600">{lowStock.length} item(s) running low</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Min Level</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {inventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded">
                        {item.product?.image_url && <img src={item.product.image_url} alt="" className="w-full h-full object-cover rounded" />}
                      </div>
                      <span className="font-medium">{item.product?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-medium">{item.quantity}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-500">{item.min_stock_level}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.quantity > item.min_stock_level ? 'bg-green-100 text-green-700' :
                      item.quantity > 0 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {item.quantity > item.min_stock_level ? 'In Stock' : item.quantity > 0 ? 'Low Stock' : 'Out of Stock'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {inventory.length === 0 && <div className="p-8 text-center text-gray-500">No inventory items</div>}
      </div>
    </div>
  );
}

// Orders Tab with Status Update
function OrdersTab({ orders, onRefresh }) {
  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API_URL}/api/brand-admin/orders/${orderId}/status?status=${status}`);
      toast.success('Order status updated');
      onRefresh();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const updateTracking = async (orderId, status, message) => {
    try {
      await axios.put(`${API_URL}/api/brand-admin/orders/${orderId}/tracking?status=${status}&message=${encodeURIComponent(message)}`);
      toast.success('Tracking updated');
      onRefresh();
    } catch (error) {
      toast.error('Failed to update tracking');
    }
  };

  const statuses = ['accepted', 'preparing', 'ready_for_pickup', 'shipped', 'out_for_delivery', 'delivered'];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Order Management</h2>
          <p className="text-sm text-gray-500">Update order status and tracking</p>
        </div>
        <div className="divide-y">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No orders yet</div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-medium">Order #{order.order_id?.slice(0, 8).toUpperCase()}</p>
                    <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.order_status === 'delivered' ? 'bg-green-100 text-green-700' :
                    order.order_status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                    order.order_status === 'processing' ? 'bg-indigo-100 text-indigo-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {order.order_status}
                  </span>
                </div>
                
                {/* Items */}
                <div className="space-y-2 mb-4">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-3 text-sm">
                      <div className="w-8 h-8 bg-gray-100 rounded">
                        {item.product?.image_url && <img src={item.product.image_url} alt="" className="w-full h-full object-cover rounded" />}
                      </div>
                      <span>{item.product?.name} x {item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Status Update */}
                <div className="flex flex-wrap items-center gap-2 pt-4 border-t">
                  <span className="text-sm text-gray-500">Update Status:</span>
                  {statuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => updateOrderStatus(order.order_id, status)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        order.order_status === status 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Banking Tab
function BankingTab({ bankDetails, onRefresh }) {
  const [showAddBank, setShowAddBank] = useState(false);
  const [formData, setFormData] = useState({
    account_holder_name: '',
    account_number: '',
    bank_name: '',
    ifsc_code: '',
    branch_name: '',
    account_type: 'current'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/brand-admin/banking`, formData);
      toast.success('Bank details saved');
      onRefresh();
      setShowAddBank(false);
    } catch (error) {
      toast.error('Failed to save bank details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-lg">Bank Account Details</h2>
          {!bankDetails && (
            <Button onClick={() => setShowAddBank(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Bank Account
            </Button>
          )}
        </div>

        {bankDetails ? (
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-sm text-gray-500">Account Holder</p><p className="font-medium">{bankDetails.account_holder_name}</p></div>
            <div><p className="text-sm text-gray-500">Bank Name</p><p className="font-medium">{bankDetails.bank_name}</p></div>
            <div><p className="text-sm text-gray-500">Account Number</p><p className="font-medium">{bankDetails.account_number}</p></div>
            <div><p className="text-sm text-gray-500">IFSC Code</p><p className="font-medium">{bankDetails.ifsc_code}</p></div>
          </div>
        ) : !showAddBank ? (
          <div className="text-center py-8">
            <Banknote className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Add your bank account to receive payouts</p>
          </div>
        ) : null}

        {showAddBank && (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-sm font-medium">Account Holder</label><Input value={formData.account_holder_name} onChange={(e) => setFormData({...formData, account_holder_name: e.target.value})} required /></div>
              <div className="space-y-2"><label className="text-sm font-medium">Bank Name</label><Input value={formData.bank_name} onChange={(e) => setFormData({...formData, bank_name: e.target.value})} required /></div>
              <div className="space-y-2"><label className="text-sm font-medium">Account Number</label><Input value={formData.account_number} onChange={(e) => setFormData({...formData, account_number: e.target.value})} required /></div>
              <div className="space-y-2"><label className="text-sm font-medium">IFSC Code</label><Input value={formData.ifsc_code} onChange={(e) => setFormData({...formData, ifsc_code: e.target.value})} required /></div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => setShowAddBank(false)}>Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">{loading ? 'Saving...' : 'Save'}</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// Settings Tab
function SettingsTab({ brand }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold text-lg mb-6">Brand Profile</h2>
        <div className="grid grid-cols-2 gap-6">
          <div><p className="text-sm text-gray-500">Brand Name</p><p className="font-medium">{brand?.name}</p></div>
          <div><p className="text-sm text-gray-500">Category</p><p className="font-medium">{brand?.category}</p></div>
          <div className="col-span-2"><p className="text-sm text-gray-500">Description</p><p className="font-medium">{brand?.description}</p></div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${brand?.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {brand?.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
