import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend,
  ComposedChart
} from 'recharts';
import { storage } from '../db';
import { formatCurrency, cn } from '../lib/utils';
import { 
  PieChart as PieIcon, BarChart3, TrendingUp, DollarSign, Package, Users, 
  Printer, Calendar, Filter, MapPin, Activity, AlertTriangle, ChevronRight,
  Download, FileText, ShoppingBag, Landmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'financial' | 'insights'>('sales');
  const [filterType, setFilterType] = useState<'day' | 'month' | 'year' | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const allInvoices = useMemo(() => storage.getInvoices().filter(inv => inv.status !== 'Draft'), []);
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

  // --- SALES ANALYTICS ---
  
  // 1. Sales Trends
  const salesTrendData = useMemo(() => {
    const data: Record<string, number> = {};
    filteredInvoices.forEach(inv => {
      const label = new Date(inv.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      data[label] = (data[label] || 0) + inv.grandTotal;
    });
    return Object.entries(data).map(([name, total]) => ({ name, total }));
  }, [filteredInvoices]);

  // 2. Brand-wise Sales
  const brandSalesData = useMemo(() => {
    const brands: Record<string, number> = {};
    filteredInvoices.forEach(inv => {
      inv.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const brand = product?.brand || 'Other';
        brands[brand] = (brands[brand] || 0) + item.total;
      });
    });
    return Object.entries(brands).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [filteredInvoices, products]);

  // 3. Customer-wise Sales
  const customerSalesData = useMemo(() => {
    const custs: Record<string, number> = {};
    filteredInvoices.forEach(inv => {
      custs[inv.customerName] = (custs[inv.customerName] || 0) + inv.grandTotal;
    });
    return Object.entries(custs)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredInvoices]);

  // 4. Region/State-wise
  const regionSalesData = useMemo(() => {
    const regions: Record<string, number> = {};
    filteredInvoices.forEach(inv => {
      const customer = customers.find(c => c.id === inv.customerId);
      const state = customer?.address.split(',').pop()?.trim() || 'Unspecified';
      regions[state] = (regions[state] || 0) + inv.grandTotal;
    });
    return Object.entries(regions).map(([name, value]) => ({ name, value }));
  }, [filteredInvoices, customers]);

  // 5. Size Demand Analysis
  const sizeDemandData = useMemo(() => {
    const sizes: Record<string, number> = {};
    filteredInvoices.forEach(inv => {
      inv.items.forEach(item => {
        sizes[item.size] = (sizes[item.size] || 0) + item.quantity;
      });
    });
    return Object.entries(sizes).map(([size, qty]) => ({ size, qty }));
  }, [filteredInvoices]);

  // --- INVENTORY ANALYTICS ---

  // 1. Stock Status Analysis
  const stockMetrics = useMemo(() => {
    const fastMovingThreshold = 20; // items sold > 20 in period
    const productSales: Record<string, number> = {};
    
    allInvoices.forEach(inv => {
      inv.items.forEach(item => {
        productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
      });
    });

    const fastMoving = products.filter(p => (productSales[p.id] || 0) >= fastMovingThreshold);
    const slowMoving = products.filter(p => (productSales[p.id] || 0) > 0 && (productSales[p.id] || 0) < 5);
    const deadStock = products.filter(p => !productSales[p.id] && p.totalStock > 0);

    return { fastMoving, slowMoving, deadStock };
  }, [products, allInvoices]);

  // --- FINANCIAL ANALYTICS ---

  // 1. Profit Margin per Product
  const profitMarginData = useMemo(() => {
    const margins = products.map(p => {
      const cost = p.purchasePrice;
      const sale = p.wholesalePrice;
      const profit = sale - cost;
      const marginPercent = sale > 0 ? (profit / sale) * 100 : 0;
      return {
        name: p.name,
        sku: p.sku,
        margin: marginPercent,
        profit
      };
    }).sort((a,b) => b.margin - a.margin).slice(0, 10);
    return margins;
  }, [products]);

  // 2. Tax Report
  const taxReport = useMemo(() => {
    let cgst = 0, sgst = 0, igst = 0;
    filteredInvoices.forEach(inv => {
      cgst += inv.cgstTotal || 0;
      sgst += inv.sgstTotal || 0;
      igst += inv.igstTotal || 0;
    });
    return { cgst, sgst, igst, total: cgst + sgst + igst };
  }, [filteredInvoices]);

  // --- FORECASTING (Simple AI Mimic) ---
  const forecastingData = useMemo(() => {
    if (salesTrendData.length < 5) return [];
    
    // Simple linear projection
    const last5 = salesTrendData.slice(-5);
    const avgGrowth = last5.reduce((acc, curr, idx, arr) => {
      if (idx === 0) return acc;
      return acc + (curr.total - arr[idx-1].total);
    }, 0) / 4;

    const lastVal = last5[last5.length - 1].total;
    return Array.from({ length: 5 }).map((_, i) => ({
      name: `Next ${i+1}`,
      expected: Math.max(0, lastVal + (avgGrowth * (i + 1)))
    }));
  }, [salesTrendData]);

  const renderSalesTab = () => (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-8">
          <h3 className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-8 flex items-center gap-2">
            <TrendingUp size={14} className="text-primary" />
            Revenue Velocity
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} />
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke="#2563eb" fill="url(#salesGrad)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8">
          <h3 className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-8 flex items-center gap-2">
            <PieIcon size={14} className="text-orange-500" />
            Region-wise Market Share
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={regionSalesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {regionSalesData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-8">
          <h3 className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-8">Brand Performance Ranking</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={brandSalesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" fontSize={10} axisLine={false} tickLine={false} width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8">
          <h3 className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-8">Size Demand Matrix</h3>
          <div className="space-y-4">
            {sizeDemandData.map((item, idx) => (
              <div key={item.size} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-xs text-charcoal">
                  {item.size}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Units Sold</span>
                    <span className="text-[10px] font-black text-charcoal">{item.qty} pcs</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.qty / (Math.max(...sizeDemandData.map(s => s.qty)) || 1)) * 100}%` }}
                      className="h-full bg-primary" 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderInventoryTab = () => (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 bg-emerald-50/30 border-emerald-100">
          <div className="flex items-center gap-3 mb-4">
            <Activity size={18} className="text-emerald-500" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Fast Moving</h4>
          </div>
          <p className="text-2xl font-black text-emerald-900">{stockMetrics.fastMoving.length} SKUs</p>
          <p className="text-[9px] font-bold text-emerald-600/60 uppercase mt-1">High inventory turnover</p>
        </div>
        <div className="glass-card p-6 bg-orange-50/30 border-orange-100">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle size={18} className="text-orange-500" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-700">Slow Moving</h4>
          </div>
          <p className="text-2xl font-black text-orange-900">{stockMetrics.slowMoving.length} SKUs</p>
          <p className="text-[9px] font-bold text-orange-600/60 uppercase mt-1">Below target velocity</p>
        </div>
        <div className="glass-card p-6 bg-red-50/30 border-red-100">
          <div className="flex items-center gap-3 mb-4">
            <Package size={18} className="text-red-500" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-red-700">Dead Stock</h4>
          </div>
          <p className="text-2xl font-black text-red-900">{stockMetrics.deadStock.length} SKUs</p>
          <p className="text-[9px] font-bold text-red-600/60 uppercase mt-1">Zero sales in period</p>
        </div>
      </div>

      <div className="glass-card p-8">
        <h3 className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-8">Stock Summary Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Article</th>
                <th className="text-left p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Category</th>
                <th className="text-right p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Stock</th>
                <th className="text-right p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Valuation</th>
                <th className="text-right p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, 10).map(p => {
                const isDead = stockMetrics.deadStock.some(ds => ds.id === p.id);
                const isFast = stockMetrics.fastMoving.some(fm => fm.id === p.id);
                return (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <p className="text-xs font-black text-charcoal uppercase">{p.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{p.sku}</p>
                    </td>
                    <td className="p-4 text-[10px] font-bold text-slate-500 uppercase">{p.category}</td>
                    <td className="p-4 text-right text-xs font-black text-charcoal">{p.totalStock}u</td>
                    <td className="p-4 text-right text-xs font-black text-primary">{formatCurrency(p.totalStock * p.purchasePrice)}</td>
                    <td className="p-4 text-right">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[8px] font-black uppercase",
                        isFast ? "bg-emerald-100 text-emerald-600" :
                        isDead ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"
                      )}>
                        {isFast ? 'Hot' : isDead ? 'Dead' : 'Active'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderFinancialTab = () => (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-8">
          <h3 className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-8 flex items-center gap-2">
            <Landmark size={14} className="text-emerald-500" />
            Tax Compliance Summary
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-6 bg-slate-50 rounded-2xl">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-2">CGST + SGST</p>
              <p className="text-xl font-black text-charcoal">{formatCurrency(taxReport.cgst + taxReport.sgst)}</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-2">IGST Total</p>
              <p className="text-xl font-black text-charcoal">{formatCurrency(taxReport.igst)}</p>
            </div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ name: 'CGST', val: taxReport.cgst }, { name: 'SGST', val: taxReport.sgst }, { name: 'IGST', val: taxReport.igst }]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="val" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8">
          <h3 className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-8">Profitability Benchmark (Top 10)</h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={profitMarginData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} unit="%" />
                <Tooltip />
                <Bar dataKey="margin" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                <Line type="monotone" dataKey="margin" stroke="#ef4444" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-card p-8">
        <h3 className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-8">Highest Outstanding Debts</h3>
        <div className="space-y-4">
          {customers
            .filter(c => c.outstandingBalance > 0)
            .sort((a,b) => b.outstandingBalance - a.outstandingBalance)
            .slice(0, 5)
            .map(cust => (
              <div key={cust.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center font-black text-xs text-slate-400">
                    {cust.businessName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-black text-charcoal uppercase">{cust.businessName}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{cust.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-red-500">{formatCurrency(cust.outstandingBalance)}</p>
                  <p className="text-[9px] font-bold text-slate-300 uppercase">Limit: {formatCurrency(cust.creditLimit)}</p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  const renderInsightsTab = () => (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
      <div className="glass-card p-8 border-violet-100 bg-violet-50/10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-[10px] uppercase tracking-widest font-black text-violet-600 mb-1">Growth Forecast</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">AI-Enabled Adaptive Linear Projection</p>
          </div>
          <div className="p-3 bg-violet-100 text-violet-600 rounded-2xl">
            <Activity size={20} />
          </div>
        </div>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[...salesTrendData.slice(-5), ...forecastingData]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" name="Actual Performance" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
              <Line type="monotone" dataKey="expected" name="Projected Velocity" stroke="#8b5cf6" strokeDasharray="5 5" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-8 p-4 bg-violet-100/50 rounded-2xl border border-violet-100">
          <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest mb-1">Observation</p>
          <p className="text-xs font-bold text-violet-800 italic">"Based on last 5 days of data, we anticipate a recovery in sales volume. Stock up on fast-moving articles to avoid stockouts."</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Dynamic Filter Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 shadow-inner">
            {(['all', 'day', 'month', 'year'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  "px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  filterType === type ? "bg-white text-primary shadow-md scale-[1.05]" : "text-slate-400 hover:text-slate-600"
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
                className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold uppercase outline-none focus:ring-2 focus:ring-primary/20"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
              />
            )}
            {filterType === 'month' && (
              <div className="flex gap-2">
                <select 
                  className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold uppercase outline-none appearance-none cursor-pointer"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(Number(e.target.value))}
                >
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                    <option key={m} value={i}>{m}</option>
                  ))}
                </select>
                <select 
                  className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold uppercase outline-none"
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
                className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold uppercase outline-none"
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
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Scope</p>
            <p className="text-xs font-black text-charcoal flex items-center justify-end gap-2 uppercase mt-1">
              <Calendar size={14} className="text-primary" />
              {filterType === 'all' ? 'All Time' : 
               filterType === 'day' ? selectedDate :
               filterType === 'month' ? `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][selectedMonth]} ${selectedYear}` :
               selectedYear}
            </p>
          </div>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-3 bg-primary text-white py-3.5 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Download size={18} />
            Export Data
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit print:hidden">
        {(['sales', 'inventory', 'financial', 'insights'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === tab ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'sales' && renderSalesTab()}
          {activeTab === 'inventory' && renderInventoryTab()}
          {activeTab === 'financial' && renderFinancialTab()}
          {activeTab === 'insights' && renderInsightsTab()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Reports;
