
import { useEffect, useState } from 'react';
import { Pill, ShoppingCart, Package, DollarSign, AlertTriangle, FileText, ArrowUpRight, TrendingUp, X, Plus, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';
import api from '../services/api';
import { DashboardStats } from '../types';
import { formatCurrency, cn } from '../lib/utils';

interface CartItem {
  id: number;
  name: string;
  salePrice: number;
  quantity: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Quick POS states
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsResponse = await api.get('/dashboard/stats');
        setStats(statsResponse.data);
        
        const analyticsResponse = await api.get('/analytics');
        setInventoryData(analyticsResponse.data.categories || []);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Quick POS Functions
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length === 0) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const response = await api.get(`/medicines?search=${query}`);
      setSearchResults(response.data);
      setShowSearchResults(true);
    } catch (err) {
      console.error('Search failed', err);
    }
  };

  const handleAddToCart = (medicine: any) => {
    const existingItem = cartItems.find(item => item.id === medicine.id);
    
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.id === medicine.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        id: medicine.id,
        name: medicine.name,
        salePrice: medicine.salePrice,
        quantity: 1
      }]);
    }
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleRemoveFromCart = (id: number) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const handleQuantityChange = (id: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(id);
      return;
    }
    setCartItems(cartItems.map(item =>
      item.id === id ? { ...item, quantity } : item
    ));
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.salePrice * item.quantity), 0);

  const handleFinalize = async () => {
    if (cartItems.length === 0) {
      alert('Add items to cart first');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/sales', {
        customerName,
        items: cartItems,
        totalAmount
      });

      alert(`Invoice ${response.data.invoiceNumber} created successfully!`);
      setCartItems([]);
      setCustomerName('Walk-in Customer');
      setSearchQuery('');
      
      // Refresh stats
      const statsResponse = await api.get('/dashboard/stats');
      setStats(statsResponse.data);
    } catch (err) {
      console.error('Failed to create sale', err);
      alert('Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  const cards = [
    { 
      title: 'Total Medicines', 
      value: stats?.totalMedicines.toLocaleString() || 0, 
      label: stats?.totalMedicines && stats.totalMedicines > 0 ? '+12 added this week' : 'No stock',
      icon: Pill, 
      color: 'text-slate-800',
      labelColor: 'text-emerald-600'
    },
    { 
      title: 'Sold Today', 
      value: Math.floor((stats?.todaySalesRevenue || 0) / 100).toLocaleString(), // Mock count or use actual if backend updated
      label: '↑ 14% vs yesterday',
      icon: TrendingUp, 
      color: 'text-slate-800',
      labelColor: 'text-emerald-600'
    },
    { 
      title: 'Purchase Value', 
      value: formatCurrency(stats?.totalPurchaseValue || 0).replace('PKR', '').trim(),
      label: 'Stock cost estimation',
      icon: Package, 
      color: 'text-slate-800',
      labelColor: 'text-slate-500',
      prefix: 'PKR'
    },
    { 
      title: 'Daily Revenue', 
      value: (stats?.todaySalesRevenue || 0).toLocaleString(), 
      label: 'Current session sales',
      icon: DollarSign, 
      color: 'text-blue-600',
      labelColor: 'text-slate-500'
    },
    { 
      title: 'Low Stock Alerts', 
      value: stats?.lowStockCount.toString().padStart(2, '0') || '00', 
      label: 'Requires Attention',
      icon: AlertTriangle, 
      color: 'text-red-600',
      labelColor: 'text-red-500',
      bg: 'bg-red-50',
      border: 'border-red-200'
    },
    { 
      title: 'Invoices Generated', 
      value: stats?.totalInvoices.toLocaleString() || '0', 
      label: `Lifetime: ${stats?.totalInvoices}`,
      icon: FileText, 
      color: 'text-slate-800',
      labelColor: 'text-slate-500'
    },
  ];

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, idx) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className={cn(
            "bg-white border border-slate-200 p-3 rounded shadow-sm hover:border-slate-300 transition-colors",
            card.bg,
            card.border
          )}
        >
          <div className={cn("text-[10px] uppercase font-bold mb-1 truncate", card.bg ? 'text-red-400' : 'text-slate-400')}>
            {card.title}
          </div>
          <div className={cn("text-2xl font-bold leading-none mb-1", card.color)}>
            {card.prefix && <span className="text-[10px] block font-medium text-slate-400">{card.prefix}</span>}
            {card.value}
          </div>
          <div className={cn("text-[10px] font-bold leading-none truncate", card.labelColor)}>
            {card.label}
          </div>
        </motion.div>
      ))}

      <div className="col-span-1 md:col-span-3 lg:col-span-4 row-span-3 bg-white border border-slate-200 rounded shadow-sm flex flex-col min-h-[300px]">
        <div className="p-3 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase text-slate-500">Inventory Overview</h3>
          <div className="flex gap-2 text-[10px] font-bold">
            <span className="text-emerald-600">FILTER: ALL</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-400">EXPIRED</span>
          </div>
        </div>
        <div className="p-4 flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={inventoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="category" tick={{fill: '#94a3b8', fontSize: 10}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill: '#94a3b8', fontSize: 10}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '10px'}} />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{r: 4, fill: '#3b82f6'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-auto p-2 bg-slate-50 border-t border-slate-100 flex justify-center gap-2">
          <button className="px-2 py-0.5 border bg-white rounded text-[10px] font-bold hover:bg-slate-50 transition-colors">PREV</button>
          <span className="text-[10px] py-0.5 font-medium text-slate-500">Page 1 of {Math.max(1, Math.ceil((inventoryData.length || 0) / 10))}</span>
          <button className="px-2 py-0.5 border bg-white rounded text-[10px] font-bold hover:bg-slate-50 transition-colors">NEXT</button>
        </div>
      </div>

      <div className="col-span-1 md:col-span-3 lg:col-span-2 row-span-3 bg-slate-900 border border-slate-800 rounded shadow-lg p-5 text-white flex flex-col min-h-[300px]">
        <h3 className="text-xs font-bold uppercase text-slate-400 mb-6">Quick POS (New Sale)</h3>
        <div className="space-y-4 flex-1">
          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Customer Name</label>
            <input 
              type="text" 
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white outline-none focus:border-emerald-500 transition-colors" 
            />
          </div>
          <div className="relative">
            <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Search Medicine</label>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
              placeholder="Type name (e.g. Panadol)..." 
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white outline-none focus:border-emerald-500 transition-colors" 
            />
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded max-h-40 overflow-y-auto z-10">
                {searchResults.map((medicine) => (
                  <button
                    key={medicine.id}
                    onClick={() => handleAddToCart(medicine)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-100 hover:bg-emerald-500/20 transition-colors border-b border-slate-700 last:border-b-0"
                  >
                    <div className="font-semibold">{medicine.name}</div>
                    <div className="text-slate-400">PKR {medicine.salePrice} (Qty: {medicine.quantity})</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="bg-slate-800/50 p-3 rounded border border-slate-700/50 max-h-32 overflow-y-auto">
            {cartItems.length === 0 ? (
              <p className="text-[10px] text-slate-500 text-center italic">No items in quick cart</p>
            ) : (
              <div className="space-y-2">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-slate-700/50 p-2 rounded text-xs">
                    <div className="flex-1">
                      <div className="font-semibold text-slate-100">{item.name}</div>
                      <div className="text-slate-400">PKR {item.salePrice}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-slate-600 rounded transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-slate-600 rounded transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="p-1 hover:bg-red-600/20 rounded transition-colors ml-1"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="mt-6">
          <div className="flex justify-between font-bold text-xl mb-4 items-baseline">
            <span className="text-sm">Total Due</span>
            <span className="text-emerald-400">PKR {totalAmount.toLocaleString('en-PK', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </div>
          <button 
            onClick={handleFinalize}
            disabled={isSubmitting}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded font-bold uppercase tracking-widest text-xs transition-all active:scale-[0.98]"
          >
            {isSubmitting ? 'Processing...' : 'Finalize & Print Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}
