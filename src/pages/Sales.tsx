
import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Trash2, Printer, Check, X, User, Plus, Minus, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../services/api';
import { Medicine } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { format } from 'date-fns';

export default function Sales() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const response = await api.get('/medicines', { params: { search } });
        setMedicines(response.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMedicines();
  }, [search]);

  const addToCart = (med: Medicine) => {
    const existing = cart.find((item: any) => item.id === med.id);
    if (existing) {
      if (existing.quantity >= med.quantity) return; // Stock limit
      setCart(cart.map((item: any) => item.id === med.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      if (med.quantity <= 0) return;
      setCart([...cart, { ...med, quantity: 1 }]);
    }
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter((item: any) => item.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(cart.map((item: any) => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        const originalMed = medicines.find((m: Medicine) => m.id === id);
        if (newQty > 0 && originalMed && newQty <= originalMed.quantity) {
          return { ...item, quantity: newQty };
        }
      }
      return item;
    }));
  };

  const totalAmount = cart.reduce((sum: number, item: any) => sum + (item.salePrice * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const response = await api.post('/sales', {
        customerName,
        items: cart,
        totalAmount
      });
      setInvoiceData({
        ...response.data,
        customerName,
        items: cart,
        totalAmount,
        date: new Date().toISOString()
      });
      setIsInvoiceModalOpen(true);
      setCart([]);
      setCustomerName('');
      // Refresh medicines stock
      const medRes = await api.get('/medicines');
      setMedicines(medRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    // Add small delay to ensure modal is fully rendered
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
      {/* Left: Inventory Search */}
      <div className="flex-1 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Point of Sale</h1>
          <p className="text-slate-500 font-medium tracking-tight">Search and add medicines to create a sale.</p>
        </div>

        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Quick search by medicine name..." 
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
            className="w-full pl-14 pr-4 py-4 bg-white border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-lg shadow-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {medicines.map((med: Medicine) => (
            <motion.div 
               whileHover={{ y: -4 }}
               key={med.id} 
               onClick={() => addToCart(med)}
               className={cn(
                  "bg-white p-5 rounded-3xl border border-slate-100 shadow-sm cursor-pointer transition-all hover:border-emerald-500 group",
                  med.quantity <= 0 && "opacity-60 grayscale cursor-not-allowed border-dashed bg-slate-50"
               )}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{med.name}</h4>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{med.category}</p>
                </div>
                <div className="text-right">
                   <div className="text-lg font-bold text-emerald-600 font-mono tracking-tight">{formatCurrency(med.salePrice)}</div>
                   <div className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 uppercase tracking-tighter", med.quantity < 10 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500")}>
                      Stock: {med.quantity}
                   </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-slate-400 font-medium italic">{med.genericName}</span>
                  <div className="p-2 bg-slate-50 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                     <Plus className="w-5 h-5" />
                  </div>
              </div>
            </motion.div>
          ))}
          {medicines.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 font-medium">
                  No medicines found matching your search.
              </div>
          )}
        </div>
      </div>

      {/* Right: Cart & Checkout */}
      <div className="w-full lg:w-96 space-y-6">
        <div className="bg-white rounded-4xl border border-slate-100 shadow-xl shadow-slate-200/40 p-1 flex flex-col h-[calc(100vh-160px)] sticky top-8">
            <div className="p-6 pb-2">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                        <ShoppingCart className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Current Sale</h2>
                </div>
                
                <div className="relative mb-6">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                       type="text" 
                       placeholder="Customer Name (Optional)" 
                       value={customerName}
                       onChange={(e) => setCustomerName(e.target.value)}
                       className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-sm"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 space-y-4">
               {cart.length === 0 && (
                   <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 space-y-4 grayscale-0 py-10 opacity-60">
                       <ShoppingCart className="w-12 h-12 mb-2" />
                       <p className="font-medium text-sm">Your cart is empty.<br/>Select items from the left to start.</p>
                   </div>
               )}
               
               <AnimatePresence>
                 {cart.map((item) => (
                   <motion.div 
                      layout
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                      key={item.id} 
                      className="group bg-slate-50 p-4 rounded-2xl border border-transparent hover:border-slate-200 transition-all"
                   >
                     <div className="flex justify-between items-start mb-3">
                       <div>
                         <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">{item.category}</p>
                       </div>
                       <button onClick={() => removeFromCart(item.id)} className="p-1 text-slate-300 hover:text-red-500 transition-colors">
                          <X className="w-4 h-4" />
                       </button>
                     </div>
                     <div className="flex items-center justify-between">
                        <div className="flex items-center bg-white rounded-xl border border-slate-100 p-1">
                            <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-slate-400 hover:text-emerald-500 transition-colors"><Minus className="w-4 h-4" /></button>
                            <span className="w-8 text-center font-bold text-sm text-slate-700">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-slate-400 hover:text-emerald-500 transition-colors"><Plus className="w-4 h-4" /></button>
                        </div>
                        <div className="text-right">
                           <div className="text-xs text-slate-400 font-medium">{formatCurrency(item.salePrice)} × {item.quantity}</div>
                           <div className="font-bold text-slate-900">{formatCurrency(item.salePrice * item.quantity)}</div>
                        </div>
                     </div>
                   </motion.div>
                 ))}
               </AnimatePresence>
            </div>

            <div className="p-6 mt-2 border-t border-slate-100 space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-slate-500 text-sm font-medium">
                        <span>Subtotal</span>
                        <span>{formatCurrency(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-slate-900 text-xl font-black font-display tracking-tight">
                        <span>Grand Total</span>
                        <span className="text-emerald-600">{formatCurrency(totalAmount)}</span>
                    </div>
                </div>

                <button 
                  disabled={cart.length === 0 || loading}
                  onClick={handleCheckout}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:scale-100"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                        <Check className="w-6 h-6" />
                        Complete Sale
                    </>
                  )}
                </button>
            </div>
        </div>
      </div>

      {/* Invoice Modal */}
      <AnimatePresence>
        {isInvoiceModalOpen && invoiceData && (
           <>
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-500 print:hidden"
               onClick={() => setIsInvoiceModalOpen(false)}
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-3xl shadow-2xl z-501 overflow-hidden flex flex-col max-h-[90vh] print:fixed print:inset-0 print:m-0 print:shadow-none print:rounded-none print:max-h-full print:w-full print:top-0 print:left-0 print:translate-x-0 print:translate-y-0 print-modal-content"
            >
               <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white print:hidden">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                     <FileText className="text-emerald-600" />
                     Sale Completed
                  </h2>
                  <button onClick={() => setIsInvoiceModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                     <X className="w-6 h-6 text-slate-400" />
                  </button>
               </div>
               
               <div ref={printRef} className="flex-1 overflow-y-auto p-10 bg-white print:p-0">
                  <div className="text-center mb-8 border-b-2 border-dashed border-slate-100 pb-8">
                      <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Medical Store</h1>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Pharmacy & Healthcare</p>
                      <div className="mt-6 flex flex-col gap-1 text-xs font-mono font-bold text-slate-500 uppercase">
                          <div>Invoice: {invoiceData.invoiceNumber}</div>
                          <div>Date: {format(new Date(invoiceData.date), 'MMM d, yyyy HH:mm')}</div>
                          {invoiceData.customerName && <div>Patient: {invoiceData.customerName}</div>}
                      </div>
                  </div>

                  <table className="w-full mb-8">
                      <thead>
                          <tr className="border-b border-slate-200">
                              <th className="py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item Description</th>
                              <th className="py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qty</th>
                              <th className="py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price</th>
                              <th className="py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                          {invoiceData.items.map((item: any) => (
                              <tr key={item.id} className="text-sm">
                                  <td className="py-4 font-bold text-slate-800">{item.name}</td>
                                  <td className="py-4 text-center font-mono">{item.quantity}</td>
                                  <td className="py-4 text-right font-mono">{item.salePrice.toFixed(0)}</td>
                                  <td className="py-4 text-right font-mono font-bold">{(item.salePrice * item.quantity).toFixed(0)}</td>
                              </tr>
                          ))}
                      </tbody>
                      <tfoot>
                          <tr className="border-t-2 border-double border-slate-200">
                              <td colSpan={3} className="py-6 text-right font-bold text-lg text-slate-500 uppercase tracking-tighter">Grand Total</td>
                              <td className="py-6 text-right font-black text-2xl text-emerald-600 font-display">
                                 {formatCurrency(invoiceData.totalAmount)}
                              </td>
                          </tr>
                      </tfoot>
                  </table>

                  <div className="text-center mt-12 border-t border-slate-100 pt-8 opacity-60">
                      <p className="text-sm font-bold text-slate-900">Thank you for your visit!</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1">Please keep this slip for your records. Expired items are non-refundable.</p>
                      <div className="mt-6 font-mono text-[8px] text-slate-300">MedTrack v1.0.0-PROD</div>
                  </div>
               </div>

               <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4 print:hidden">
                  <button onClick={() => setIsInvoiceModalOpen(false)} className="flex-1 py-4 text-slate-600 font-bold rounded-2xl hover:bg-white border border-slate-200 transition-all">Close Slip</button>
                  <button onClick={handlePrint} className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 shadow-lg shadow-slate-200 flex items-center justify-center gap-2 transition-all">
                     <Printer className="w-5 h-5" />
                     Print Slip
                  </button>
               </div>
            </motion.div>
           </>
        )}
      </AnimatePresence>
      
      <style>{`
        @media print {
          body, html {
            margin: 0;
            padding: 0;
          }
          * { 
            visibility: hidden;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .print-modal-content,
          .print-modal-content * {
            visibility: visible !important;
          }
          .print-modal-content {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            transform: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            z-index: 9999 !important;
            max-width: 100% !important;
            max-height: 100% !important;
            overflow: visible !important;
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}
