
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Filter, Trash2, Edit3, AlertCircle, X, Check, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../services/api';
import { Medicine } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { format, isPast, isBefore, addMonths } from 'date-fns';

export default function Medicines() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<{open: boolean, id: number | null}>({open: false, id: null});
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    category: '',
    manufacturer: '',
    purchasePrice: 0,
    salePrice: 0,
    quantity: 0,
    expiryDate: '',
    description: ''
  });

  const categories = ['Antibiotic', 'Painkiller', 'Vitamin', 'Syrup', 'Tablet', 'Injection', 'Other'];

  const fetchMedicines = async () => {
    try {
      const response = await api.get('/medicines', { params: { search, category: categoryFilter } });
      setMedicines(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [search, categoryFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/medicines', formData);
      setIsModalOpen(false);
      setFormData({
        name: '',
        genericName: '',
        category: '',
        manufacturer: '',
        purchasePrice: 0,
        salePrice: 0,
        quantity: 0,
        expiryDate: '',
        description: ''
      });
      fetchMedicines();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (isDeleteModalOpen.id) {
       try {
         await api.delete(`/medicines/${isDeleteModalOpen.id}`);
         setIsDeleteModalOpen({open: false, id: null});
         fetchMedicines();
       } catch (err) {
         console.error(err);
       }
    }
  };

  const getStockStatus = (qty: number) => {
    if (qty === 0) return { label: 'Out of Stock', class: 'bg-red-50 text-red-600 border-red-100' };
    if (qty < 10) return { label: 'Low Stock', class: 'bg-amber-50 text-amber-600 border-amber-100' };
    return { label: 'In Stock', class: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
  };

  const getExpiryStatus = (date: string) => {
    const d = new Date(date);
    if (isPast(d)) return 'expired';
    if (isBefore(d, addMonths(new Date(), 3))) return 'expiring-soon';
    return 'safe';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight uppercase">Medicine Inventory</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Manage stock records</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-2 items-center bg-white p-2 rounded border border-slate-200 shadow-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search catalog..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded outline-none focus:border-emerald-500 transition-all text-xs font-medium"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="flex-1 md:w-40 px-3 py-2 bg-slate-50 border border-slate-100 rounded outline-none focus:border-emerald-500 transition-all text-xs font-bold uppercase cursor-pointer"
          >
            <option value="">Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 border-b font-bold text-slate-500 uppercase tracking-wider">Product Info</th>
                <th className="px-4 py-3 border-b font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 border-b font-bold text-slate-500 uppercase tracking-wider text-center">Stock</th>
                <th className="px-4 py-3 border-b font-bold text-slate-500 uppercase tracking-wider">Sale Price</th>
                <th className="px-4 py-3 border-b font-bold text-slate-500 uppercase tracking-wider">Expiry</th>
                <th className="px-4 py-3 border-b font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {medicines.map((med) => {
                const status = getStockStatus(med.quantity);
                const expiryStatus = getExpiryStatus(med.expiryDate);
                
                return (
                  <tr key={med.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 leading-tight">{med.name}</div>
                      <div className="text-[10px] font-medium text-slate-400 italic font-mono mt-0.5">{med.genericName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {med.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                        <div className={cn("font-mono font-bold inline-block px-1.5 py-0.5 rounded", 
                            med.quantity < 10 ? "text-red-600 bg-red-50" : "text-slate-800"
                        )}>
                            {med.quantity.toString().padStart(2, '0')}
                        </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-600">
                        {formatCurrency(med.salePrice).replace('PKR', '').trim()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "font-medium",
                        expiryStatus === 'expired' ? "text-red-500 font-bold" : 
                        expiryStatus === 'expiring-soon' ? "text-amber-500 font-bold" : "text-slate-500"
                      )}>
                        {med.expiryDate ? format(new Date(med.expiryDate), 'MM/yyyy') : '--/----'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                       <button 
                          onClick={() => setIsDeleteModalOpen({open: true, id: med.id})}
                          className="text-blue-500 font-bold hover:underline"
                       >
                          EDIT
                       </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-center gap-2">
            <button className="px-2 py-0.5 border bg-white rounded text-[10px] font-bold hover:bg-slate-50 transition-colors">PREV</button>
            <span className="text-[10px] py-0.5 font-medium text-slate-500 uppercase tracking-widest">Page 1 of 1</span>
            <button className="px-2 py-0.5 border bg-white rounded text-[10px] font-bold hover:bg-slate-50 transition-colors">NEXT</button>
        </div>
      </div>

      {/* Add Medicine Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
               onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-3xl shadow-2xl z-[101] overflow-hidden"
            >
               <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
                  <h2 className="text-2xl font-bold text-slate-900">Add New Medicine</h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                     <X className="w-6 h-6 text-slate-400" />
                  </button>
               </div>
               <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Medicine Name</label>
                        <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="e.g. Panadol" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Generic Name</label>
                        <input type="text" value={formData.genericName} onChange={(e) => setFormData({...formData, genericName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="e.g. Paracetamol" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Category</label>
                        <select required value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                            <option value="">Select Category</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Manufacturer</label>
                        <input type="text" value={formData.manufacturer} onChange={(e) => setFormData({...formData, manufacturer: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="e.g. GSK" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Purchase Price</label>
                        <input required type="number" step="0.01" value={formData.purchasePrice} onChange={(e) => setFormData({...formData, purchasePrice: parseFloat(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Sale Price</label>
                        <input required type="number" step="0.01" value={formData.salePrice} onChange={(e) => setFormData({...formData, salePrice: parseFloat(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Initial Stock</label>
                        <input required type="number" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Expiry Date</label>
                        <input required type="date" value={formData.expiryDate} onChange={(e) => setFormData({...formData, expiryDate: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                    </div>
                  </div>
                  <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Description (Optional)</label>
                        <textarea rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none" placeholder="Enter medicine details..." />
                  </div>
                  <div className="flex gap-4 pt-4 sticky bottom-0 bg-white">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-4 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all border border-slate-200">
                          Cancel
                      </button>
                      <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl py-4 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2">
                          <Save className="w-5 h-5" />
                          Save Medicine
                      </button>
                  </div>
               </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen.open && (
           <>
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200]"
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
               className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-3xl shadow-2xl z-[201] p-8 text-center"
            >
               <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-10 h-10" />
               </div>
               <h3 className="text-2xl font-bold text-slate-900 mb-2">Delete Medicine?</h3>
               <p className="text-slate-500 mb-8 font-medium">This action cannot be undone. All records for this item will be removed.</p>
               <div className="flex gap-4">
                  <button onClick={() => setIsDeleteModalOpen({open: false, id: null})} className="flex-1 py-3 text-slate-600 font-bold rounded-xl hover:bg-slate-50 border border-slate-100">Cancel</button>
                  <button onClick={handleDelete} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200">Delete</button>
               </div>
            </motion.div>
           </>
        )}
      </AnimatePresence>
    </div>
  );
}
