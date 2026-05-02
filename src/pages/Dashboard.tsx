
import { useEffect, useState } from 'react';
import { Pill, ShoppingCart, Package, DollarSign, AlertTriangle, FileText, ArrowUpRight, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';
import api from '../services/api';
import { DashboardStats } from '../types';
import { formatCurrency, cn } from '../lib/utils';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
            <input type="text" placeholder="Walk-in Customer" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white outline-none focus:border-emerald-500 transition-colors" />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Search Medicine</label>
            <input type="text" placeholder="Type name (e.g. Panadol)..." className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white outline-none focus:border-emerald-500 transition-colors" />
          </div>
          <div className="bg-slate-800/50 p-3 rounded border border-slate-700/50">
             <p className="text-[10px] text-slate-500 text-center italic">No items in quick cart</p>
          </div>
        </div>
        <div className="mt-6">
          <div className="flex justify-between font-bold text-xl mb-4 items-baseline">
            <span className="text-sm">Total Due</span>
            <span className="text-emerald-400">PKR 0.00</span>
          </div>
          <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-3 rounded font-bold uppercase tracking-widest text-xs transition-all active:scale-[0.98]">Finalize & Print Invoice</button>
        </div>
      </div>
    </div>
  );
}
