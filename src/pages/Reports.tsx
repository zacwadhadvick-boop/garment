import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { storage } from '../db';
import { formatCurrency, cn } from '../lib/utils';
import { PieChart as PieIcon, BarChart3, TrendingUp, DollarSign, Package, Users, Printer, Calendar, Filter } from 'lucide-react';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Reports: React.FC = () => {
  const [filterType, setFilterType] = useState<'day' | 'month' | 'year' | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const allInvoices = useMemo(() => storage.getInvoices(), []);
  const products = useMemo(() => storage.getProducts(), []);
  const customers = useMemo(() => storage.getCustomers(), []);
  const salesPersons = useMemo(() => storage.getSalesPersons(), []);

  const filteredInvoices = useMemo(() => {
    return allInvoices.filter(inv => {
      const d = new Date(inv.createdAt);
      if (filterType === 'day') {
        return d.toISOString().split('T')[0] === selectedDate;
      }
      if (filterType === 'month') {
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      }
      if (filterType === 'year') {
        return d.getFullYear() === selectedYear;
      }
      return true;
    });
  }, [allInvoices, filterType, selectedDate, selectedMonth, selectedYear]);

  // 1. Sales Trends (By Day/Month)
  const salesTrendData = useMemo(() => {
    const daily: Record<string, number> = {};
    filteredInvoices.forEach(inv => {
      const date = new Date(inv.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      daily[date] = (daily[date] || 0) + inv.grandTotal;
    });
    return Object.entries(daily).map(([name, total]) => ({ name, total }));
  }, [filteredInvoices]);

  // Performance by Associate
  const salesPersonPerformance = useMemo(() => {
    const performance: Record<string, number> = {};
    filteredInvoices.forEach(inv => {
      if (inv.salesPersonId) {
        const sp = salesPersons.find(s => s.id === inv.salesPersonId);
        const name = sp ? sp.name : 'Unknown';
        performance[name] = (performance[name] || 0) + inv.grandTotal;
      }
    });
    return Object.entries(performance)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [filteredInvoices, salesPersons]);

  // 2. Category Share
  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    products.forEach(p => {
      cats[p.category] = (cats[p.category] || 0) + p.totalStock;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [products]);

  // 3. Brand Performance (Wholesale Value)
  const brandData = useMemo(() => {
    const brands: Record<string, number> = {};
    products.forEach(p => {
      brands[p.brand] = (brands[p.brand] || 0) + (p.wholesalePrice * p.totalStock);
    });
    return Object.entries(brands)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [products]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
            {(['all', 'day', 'month', 'year'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  filterType === type ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {filterType === 'day' && (
              <input 
                type="date" 
                className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold uppercase outline-none focus:border-primary/30"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
              />
            )}
            {filterType === 'month' && (
              <div className="flex gap-2">
                <select 
                  className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold uppercase outline-none focus:border-primary/30"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(Number(e.target.value))}
                >
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                    <option key={m} value={i}>{m}</option>
                  ))}
                </select>
                <select 
                  className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold uppercase outline-none focus:border-primary/30"
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                >
                  {[2024, 2025, 2026].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}
            {filterType === 'year' && (
              <select 
                className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold uppercase outline-none focus:border-primary/30"
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
              >
                {[2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Report</p>
            <p className="text-xs font-black text-charcoal flex items-center justify-end gap-1 uppercase">
              <Calendar size={12} className="text-primary" />
              {filterType === 'all' ? 'Across All History' : 
               filterType === 'day' ? `Summary for ${new Date(selectedDate).toLocaleDateString()}` :
               filterType === 'month' ? `Performance: ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][selectedMonth]} ${selectedYear}` :
               `Annual Audit ${selectedYear}`}
            </p>
          </div>
          <button 
            onClick={() => window.print()}
            className="btn-primary py-3 px-6 shadow-lg shadow-primary/20"
          >
            <Printer size={18} />
            <span className="hidden sm:inline">Export Analysis</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-8 group hover:bg-primary/5 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded">
              <TrendingUp size={16} />
            </div>
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Inventory Liquidity</h3>
          </div>
          <p className="text-3xl font-display font-bold text-charcoal">₹{formatCurrency(products.reduce((acc, p) => acc + (p.wholesalePrice * p.totalStock), 0))}</p>
          <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">Total Wholesale Valuation</p>
        </div>

        <div className="glass-card p-8 group hover:bg-emerald-50/50 transition-all border-emerald-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded">
              <DollarSign size={16} />
            </div>
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Filtered Sales</h3>
          </div>
          <p className="text-3xl font-display font-bold text-charcoal">₹{formatCurrency(filteredInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0))}</p>
          <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">Revenue in Current Period</p>
        </div>

        <div className="glass-card p-8 group hover:bg-emerald-50/50 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded">
              <DollarSign size={16} />
            </div>
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Total Receivables</h3>
          </div>
          <p className="text-3xl font-display font-bold text-charcoal">₹{formatCurrency(customers.reduce((acc, c) => acc + c.outstandingBalance, 0))}</p>
          <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">Pending Balance from Merchants</p>
        </div>

        <div className="glass-card p-8 group hover:bg-accent/5 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-accent/10 text-accent rounded">
              <Package size={16} />
            </div>
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Stock Velocity</h3>
          </div>
          <p className="text-3xl font-display font-bold text-charcoal">{products.reduce((acc, p) => acc + p.totalStock, 0)}</p>
          <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">Units Across Inventory</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Revenue Stream (Last 30 Days)</h3>
            <span className="text-[10px] text-primary font-bold uppercase tracking-widest">Growth: +12%</span>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData.length > 0 ? salesTrendData : [{ name: 'No Data', total: 0 }]}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: number) => [formatCurrency(val), 'Revenue']}
                />
                <Area type="monotone" dataKey="total" stroke="#2563eb" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Inventory Distribution</h3>
            <PieIcon size={16} className="text-gray-300" />
          </div>
          <div className="h-[300px] flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-1/3 space-y-3">
              {categoryData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Top Performing Brands (Wholesale Volume)</h3>
          <BarChart3 size={16} className="text-gray-300" />
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={brandData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
              <Tooltip cursor={{fill: '#f8fafc'}} />
              <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Sales Personnel Performance</h3>
          <Users size={16} className="text-gray-300" />
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesPersonPerformance.length > 0 ? salesPersonPerformance : [{ name: 'No Data', total: 0 }]} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={100} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(val: number) => [formatCurrency(val), 'Sales Revenue']}
              />
              <Bar dataKey="total" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Reports;
