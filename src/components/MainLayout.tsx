
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Pill, ShoppingCart, BarChart3, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  onLogout: () => void;
}

export default function MainLayout({ onLogout }: Props) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Medicine Inventory', path: '/medicines', icon: Pill },
    { name: 'Point of Sale', path: '/sales', icon: ShoppingCart },
    { name: 'Sales Reports', path: '/reports', icon: BarChart3 },
  ];

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const item = navItems.find(i => i.path === location.pathname);
    return item ? item.name : 'Medisys Admin';
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-56 bg-slate-900 text-white flex-col shrink-0">
        <div className="p-4 border-b border-slate-700 flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center text-white font-bold">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold tracking-tight uppercase text-sm">MedTrack Pro</span>
        </div>

        <nav className="flex-1 py-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-2 transition-all duration-200 text-sm",
                location.pathname === item.path
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700 text-[10px] text-slate-500 font-mono">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 mt-4 hover:text-red-400 transition-colors uppercase font-bold"
          >
            <LogOut className="w-3 h-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-base font-bold text-slate-800 tracking-tight">{getPageTitle()}</h2>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hidden sm:block">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              to="/sales" 
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2"
            >
              <ShoppingCart className="w-3 h-3" />
              New Sale
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase hidden md:inline">Admin</span>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <div className="flex-1 overflow-auto p-4">
          <Outlet />
        </div>
      </main>

      {/* Mobile Toggle (Floated) */}
      <button 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
        className="md:hidden fixed bottom-6 right-6 w-12 h-12 bg-slate-900 text-white rounded-full shadow-lg z-50 flex items-center justify-center"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed inset-0 z-40 bg-slate-900 md:hidden pt-8 px-6 flex flex-col text-white"
          >
             <div className="flex items-center justify-between mb-12">
               <span className="font-bold tracking-tight uppercase text-lg">MedTrack Pro</span>
               <button onClick={() => setIsMobileMenuOpen(false)}><X /></button>
             </div>
             <nav className="flex-1 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-4 py-3 px-4 rounded-lg text-sm font-bold uppercase tracking-wide",
                    location.pathname === item.path ? "bg-emerald-600" : "text-slate-400"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
