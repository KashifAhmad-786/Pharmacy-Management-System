
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'motion/react';
import api from '../services/api';
import { TrendingUp, Users, Package, DollarSign, Download, Calendar } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

export default function Reports() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get('/analytics');
        setData(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const handleExportCSV = () => {
    if (!data) return;

    // Prepare CSV data
    const headers = ['Date', 'Daily Revenue (PKR)'];
    const rows = data.dailyRevenue.map((item: any) => [
      item.day,
      item.revenue
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map((row: any[]) => row.join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pharmacy-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight uppercase">Analytics & Reports</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Business Intelligence</p>
        </div>
        <button onClick={handleExportCSV} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-all shadow-sm uppercase tracking-wider">
           <Download className="w-4 h-4" />
           Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        {/* Daily Sales Revenue */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-4 bg-white p-4 rounded border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Daily Sales Trend (30 Days)</h3>
              <Calendar className="text-slate-300 w-4 h-4" />
          </div>
          <div className="h-[240px] min-h-0">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.dailyRevenue}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <Tooltip 
                     contentStyle={{borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '10px'}}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{r: 3, fill: '#10b981'}} activeDot={{r: 5}} />
                </LineChart>
             </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Selling */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 bg-white p-4 rounded border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-6">Top Performers</h3>
          <div className="flex-1 space-y-3">
             {data.topSelling.slice(0, 5).map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                   <div className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{item.medicineName}</div>
                   <div className="flex items-center gap-2">
                       <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${(item.totalQty / data.topSelling[0].totalQty) * 100}%` }}></div>
                       </div>
                       <span className="text-[10px] font-mono font-bold text-slate-500">{item.totalQty}</span>
                   </div>
                </div>
             ))}
          </div>
        </motion.div>

        {/* Category Dist */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="lg:col-span-3 bg-white p-4 rounded border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-4">Stock Distribution</h3>
          <div className="h-[200px] min-h-0">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categories}
                    innerRadius={50}
                    outerRadius={70}
                    dataKey="count"
                    nameKey="category"
                  >
                    {data.categories.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip labelStyle={{fontSize: '10px'}} />
                  <Legend iconSize={8} wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
                </PieChart>
             </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Financial Recap */}
        <div className="lg:col-span-3 bg-slate-900 p-6 rounded border border-slate-800 text-white flex flex-col justify-center relative overflow-hidden">
           <div className="relative z-10 space-y-6">
              <div>
                  <h3 className="text-slate-500 font-bold uppercase tracking-widest text-[9px] mb-1">Estimated Asset Value</h3>
                  <div className="text-3xl font-bold font-mono tracking-tighter">
                     {formatCurrency(data.categories.length * 12500).replace('PKR', '').trim()} <span className="text-emerald-500 text-xs">PKR</span>
                  </div>
              </div>
              <div className="flex gap-8">
                  <div>
                      <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mb-1">Monthly Yield</p>
                      <p className="text-lg font-bold font-mono">{formatCurrency(data.dailyRevenue.reduce((s:any,c:any)=>s+c.revenue, 0)).replace('PKR', '').trim()}</p>
                  </div>
                  <div>
                      <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mb-1">Active SKUs</p>
                      <p className="text-lg font-bold font-mono">{data.topSelling.length}</p>
                  </div>
              </div>
           </div>
           <DollarSign className="absolute -right-8 -bottom-8 w-40 h-40 text-slate-800/20 rotate-12" />
        </div>
      </div>
    </div>
  );
}
