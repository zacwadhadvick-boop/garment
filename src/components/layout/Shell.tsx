import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  History, 
  PlusCircle, 
  Settings, 
  LogOut,
  Shirt,
  BarChart3,
  Menu,
  X,
  Box,
  Truck,
  Wallet,
  Megaphone,
  Warehouse as WarehouseIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';

import { storage } from '../../db';
import { Staff } from '../../types';

interface ShellProps {
  children: React.ReactNode;
  user: Staff;
  onLogout: () => void;
}

const Shell: React.FC<ShellProps> = ({ children, user, onLogout }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = user.role === 'Admin';

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/', hidden: !isAdmin },
    { name: 'Inventory', icon: Package, path: '/inventory', hidden: !isAdmin },
    { name: 'Customers', icon: Users, path: '/customers', hidden: !isAdmin },
    { name: 'New Invoice', icon: PlusCircle, path: '/billing' },
    { name: 'Invoices', icon: History, path: '/invoices', hidden: !isAdmin },
    { name: 'Marketing', icon: Megaphone, path: '/marketing', hidden: !isAdmin },
    { name: 'Warehouse', icon: WarehouseIcon, path: '/warehouse', hidden: !isAdmin },
    { name: 'Purchase', icon: Truck, path: '/purchase' },
    { name: 'Accounting', icon: Wallet, path: '/accounting', hidden: !isAdmin },
    { name: 'Packaging', icon: Box, path: '/packaging' },
    { name: 'Reports', icon: BarChart3, path: '/reports', hidden: !isAdmin },
    { name: 'Settings', icon: Settings, path: '/settings', hidden: !isAdmin },
  ].filter(item => !item.hidden);

  const SidebarContent = () => (
    <>
      <div className="p-8 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-2">
            <div className="w-5 h-5 border-2 border-primary" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-white tracking-tight uppercase leading-tight">GarmentPro</h1>
            <p className="text-[9px] text-blue-200/40 uppercase tracking-[0.2em] font-bold">Integrated CRM</p>
          </div>
        </div>
      </div>

      <div className="px-6 mb-4 flex-1">
        <p className="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-4 px-2">Menu</p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "nav-link",
                  isActive && "nav-link-active"
                )}
              >
                <span className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  isActive ? "bg-emerald-400 scale-125" : "bg-blue-300/30"
                )} />
                <span className="flex-1">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto px-6 py-6 border-t border-white/5 bg-black/5">
        <button 
          onClick={() => {
            storage.setSession(null);
            onLogout();
          }}
          className="nav-link w-full text-blue-200/50 hover:bg-white/5 hover:text-white mb-6"
        >
          <LogOut size={16} />
          <span className="text-[10px]">End Session</span>
        </button>
        <div className="px-2">
          <p className="text-[10px] text-blue-200/40 uppercase tracking-tight leading-tight">
            Developed by<br />
            <span className="font-black text-blue-100 text-[10px] bg-white/10 px-2 py-0.5 rounded-md mt-1 inline-block">Digital Communique Private Limited</span>
          </p>
          <p className="text-[9px] text-blue-200/30 uppercase tracking-widest font-black mt-3">
            Garment Billing Specialist 2026
          </p>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-bg overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-primary flex-col z-20 shadow-xl shadow-blue-900/20">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-primary flex flex-col z-40 transition-transform duration-300 lg:hidden shadow-2xl",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <button 
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute top-4 right-4 text-white p-2"
        >
          <X size={24} />
        </button>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth flex flex-col">
        <header className="sticky top-0 z-10 bg-slate-bg/80 backdrop-blur-md px-6 lg:px-10 py-6 lg:py-8 flex items-center lg:items-end justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 bg-white rounded-lg shadow-sm text-primary"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-xl lg:text-3xl font-light text-charcoal">
                {navItems.find(item => item.path === location.pathname)?.name.split(' ')[0] || 'View'}{' '}
                <span className="font-bold">
                  {navItems.find(item => item.path === location.pathname)?.name.split(' ').slice(1).join(' ') || 'Overview'}
                </span>
              </h2>
              <p className="hidden sm:block text-[10px] lg:text-xs text-slate-500 mt-1 uppercase tracking-wider font-medium">
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} | Hub: North Main
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 lg:gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold truncate max-w-[100px]">{user.name}</span>
              <span className="text-[10px] text-slate-500">{user.role} Member</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-primary font-bold shadow-sm uppercase">
              {user.name.substring(0, 2)}
            </div>
          </div>
        </header>
        
        <div className="p-6 lg:p-10 pb-16 flex-1">
          {children}
        </div>

        <footer className="px-6 lg:px-10 py-6 border-t border-slate-100 bg-white/50 backdrop-blur-sm mt-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Architecture by</p>
              <p className="text-sm font-black text-primary uppercase tracking-tighter bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                Digital Communique Private Limited
              </p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enterprise Application</p>
              <p className="text-xs font-black text-charcoal uppercase mt-1">Billing Software for Garment Industries</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Shell;
