import React, { useEffect, useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Package, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  CheckCircle,
  DollarSign,
  ShoppingCart,
  Boxes,
  Activity,
  MapPin,
  Clock,
  ChevronRight,
  FileText
} from 'lucide-react';
import { storage } from '../db';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Invoice, PurchaseVoucher, Customer, Vendor } from '../types';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const Dashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [purchases, setPurchases] = useState<PurchaseVoucher[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  
  useEffect(() => {
    setProducts(storage.getProducts());
    setInvoices(storage.getInvoices());
    setPurchases(storage.getPurchases());
    setCustomers(storage.getCustomers());
    setVendors(storage.getVendors());
  }, []);

  // 1. Sales Trend (Daily)
  const salesTrendData = useMemo(() => {
    const daily: Record<string, { date: string, sales: number, count: number }> = {};
    const last15Days = Array.from({ length: 15 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString();
    }).reverse();

    last15Days.forEach(date => {
      const parts = date.split('/');
      daily[date] = { date: `${parts[0]}/${parts[1]}`, sales: 0, count: 0 };
    });

    invoices.filter(inv => inv.status !== 'Draft').forEach(inv => {
      const date = new Date(inv.createdAt).toLocaleDateString();
      if (daily[date]) {
        daily[date].sales += inv.grandTotal;
        daily[date].count += 1;
      }
    });

    return Object.values(daily);
  }, [invoices]);

  // 2. Purchase vs Sales
  const comparisonData = useMemo(() => {
    const monthly: Record<number, { month: string, sales: number, purchase: number }> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    // Init months
    months.forEach((m, i) => {
      monthly[i] = { month: m, sales: 0, purchase: 0 };
    });

    invoices.filter(inv => inv.status !== 'Draft').forEach(inv => {
      const date = new Date(inv.createdAt);
      if (date.getFullYear() === currentYear) {
        monthly[date.getMonth()].sales += inv.grandTotal;
      }
    });

    purchases.filter(p => p.status === 'Received').forEach(p => {
      const date = new Date(p.createdAt);
      if (date.getFullYear() === currentYear) {
        monthly[date.getMonth()].purchase += p.grandTotal;
      }
    });

    return Object.values(monthly).slice(0, new Date().getMonth() + 1);
  }, [invoices, purchases]);

  // 3. Category Distribution
  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    products.forEach(p => {
      const cat = p.category || 'Uncategorized';
      cats[cat] = (cats[cat] || 0) + p.totalStock;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [products]);

  // 4. Low Stock Size-wise Alert
  const lowStockAlerts = useMemo(() => {
    const alerts: any[] = [];
    const threshold = storage.getSettings().lowStockThreshold;

    products.forEach(p => {
      Object.entries(p.inventory).forEach(([size, colors]) => {
        const sizeTotal = Object.values(colors).reduce((a, b) => a + b, 0);
        if (sizeTotal < (p.lowStockThreshold || threshold)) {
          alerts.push({
            id: `${p.id}-${size}`,
            name: p.name,
            sku: p.sku,
            size,
            stock: sizeTotal
          });
        }
      });
    });
    return alerts.sort((a, b) => a.stock - b.stock).slice(0, 6);
  }, [products]);

  // 5. Margin Analysis
  const marginAnalysis = useMemo(() => {
    let totalSales = 0;
    let totalCost = 0;
    
    invoices.filter(inv => inv.status !== 'Draft').forEach(inv => {
      inv.items.forEach(item => {
        totalSales += item.total;
        const product = products.find(p => p.id === item.productId);
        if (product) {
          totalCost += product.purchasePrice * item.quantity;
        }
      });
    });

    const profit = totalSales - totalCost;
    const margin = totalSales > 0 ? (profit / totalSales) * 100 : 0;

    return { profit, margin, totalSales, totalCost };
  }, [invoices, products]);

  // 6. Fast Moving Items
  const movingItems = useMemo(() => {
    const itemSales: Record<string, { id: string, name: string, qty: number, stock: number }> = {};
    
    invoices.filter(inv => inv.status !== 'Draft').forEach(inv => {
      inv.items.forEach(item => {
        if (!itemSales[item.productId]) {
          const p = products.find(prod => prod.id === item.productId);
          itemSales[item.productId] = { 
            id: item.productId, 
            name: item.productName, 
            qty: 0, 
            stock: p?.totalStock || 0 
          };
        }
        itemSales[item.productId].qty += item.quantity;
      });
    });

    return Object.values(itemSales).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [invoices, products]);

  const stats = useMemo(() => {
    const totalSales = invoices.filter(i => i.status !== 'Draft').reduce((acc, inv) => acc + inv.grandTotal, 0);
    const receivables = customers.reduce((acc, c) => acc + c.outstandingBalance, 0);
    const stockVal = products.reduce((acc, p) => acc + (p.totalStock * p.purchasePrice), 0);
    const totalPurchases = purchases.filter(p => p.status === 'Received').reduce((acc, p) => acc + p.grandTotal, 0);

    return {
      totalSales,
      receivables,
      stockVal,
      totalPurchases,
      lowStockCount: lowStockAlerts.length,
      profit: marginAnalysis.profit,
      margin: marginAnalysis.margin
    };
  }, [invoices, customers, products, purchases, lowStockAlerts, marginAnalysis]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header with quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Revenue (YT)" 
          value={formatCurrency(stats.totalSales)} 
          description={`${invoices.length} Orders processed`}
          icon={TrendingUp}
          theme="blue"
        />
        <StatCard 
          title="Receivables" 
          value={formatCurrency(stats.receivables)} 
          description="Pending merchant payments"
          icon={Users}
          theme="red"
        />
        <StatCard 
          title="Stock Valuation" 
          value={formatCurrency(stats.stockVal)} 
          description={`${products.length} Warehouse SKUs`}
          icon={Package}
          theme="blue"
        />
        <StatCard 
          title="Est. Profit" 
          value={formatCurrency(stats.profit)} 
          description={`Margin: ${stats.margin.toFixed(1)}% Avg`}
          icon={DollarSign}
          theme="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 glass-card p-8 flex flex-col h-[450px]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-black text-charcoal uppercase tracking-tighter">Growth Velocity</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Daily Sales Trend (Last 15 Days)</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
              <Activity size={12} />
              <span className="text-[10px] font-black">Live Pulse</span>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '1rem' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 900 }}
                  labelStyle={{ fontSize: '10px', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="glass-card p-8 flex flex-col h-[450px]">
          <h3 className="text-sm font-black text-charcoal uppercase tracking-tighter mb-1">Inventory Mix</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-8">Stock Distribution by Category</p>
          <div className="flex-1 min-h-0">
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
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 900 }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Purchase vs Sales Comparison */}
        <div className="lg:col-span-2 glass-card p-8 flex flex-col h-[450px]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-black text-charcoal uppercase tracking-tighter">Fiscal Balance</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Purchase Inward vs Sales Outward (Monthly)</p>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`}
                />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }} />
                <Bar dataKey="sales" name="Sales Revenue" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={20} />
                <Bar dataKey="purchase" name="Purchase Cost" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fast Moving Items */}
        <div className="glass-card p-8 flex flex-col h-[450px]">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black text-charcoal uppercase tracking-tighter">Fast Moving SKUs</h3>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                 <ShoppingCart size={16} />
              </div>
           </div>
           <div className="flex-1 space-y-4">
              {movingItems.length > 0 ? movingItems.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-4">
                   <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-[10px] text-slate-400">
                      #{idx + 1}
                   </div>
                   <div className="flex-1">
                      <p className="text-xs font-black text-charcoal truncate">{item.name}</p>
                      <div className="flex items-center gap-4 mt-1">
                         <p className="text-[9px] font-bold text-emerald-500 uppercase">Sold: {item.qty}</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase">Stock: {item.stock}</p>
                      </div>
                   </div>
                   <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden max-w-[60px]">
                      <div 
                        className="h-full bg-emerald-500" 
                        style={{ width: `${Math.min((item.qty / (movingItems[0]?.qty || 1)) * 100, 100)}%` }} 
                      />
                   </div>
                </div>
              )) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                   <Activity size={32} className="mb-2 opacity-20" />
                   <p className="text-[10px] font-bold uppercase tracking-widest">Waiting for data</p>
                </div>
              )}
           </div>
           <div className="mt-8 pt-8 border-t border-slate-100">
              <div className="flex items-center justify-between">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory Rotation</span>
                 <ArrowUpRight size={16} className="text-emerald-500" />
              </div>
           </div>
        </div>

        {/* Low Stock Size-wise Alert */}
        <div className="glass-card p-8 flex flex-col h-[450px]">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black text-charcoal uppercase tracking-tighter">Specific Stock Alert</h3>
              <div className="p-2 bg-red-50 text-red-500 rounded-lg">
                 <AlertCircle size={16} />
              </div>
           </div>
           <div className="flex-1 space-y-3 overflow-y-auto pr-2">
              {lowStockAlerts.map(alert => (
                <div key={alert.id} className="p-4 bg-red-50/30 border border-red-100 rounded-2xl flex flex-col gap-2">
                   <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-charcoal truncate w-40">{alert.name}</span>
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-[9px] font-black uppercase">{alert.size}</span>
                   </div>
                   <div className="flex justify-between items-end">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">SKU: {alert.sku}</p>
                      <p className="text-[10px] font-black text-red-600 uppercase">Only {alert.stock} left</p>
                   </div>
                </div>
              ))}
              {lowStockAlerts.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 py-10">
                   <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-4">
                      <CheckCircle size={32} />
                   </div>
                   <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Stock Levels Healthy</p>
                </div>
              )}
           </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="glass-card p-8 flex flex-col h-[450px]">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black text-charcoal uppercase tracking-tighter">Ageing Receivables</h3>
              <div className="p-2 bg-blue-50 text-primary rounded-lg">
                 <Clock size={16} />
              </div>
           </div>
           <div className="flex-1 space-y-4 overflow-y-auto pr-2">
              {customers
                .filter(c => c.outstandingBalance > 0)
                .sort((a, b) => b.outstandingBalance - a.outstandingBalance)
                .slice(0, 10)
                .map(c => (
                  <div key={c.id} className="flex flex-col gap-1">
                     <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-charcoal truncate flex-1 uppercase">{c.businessName}</span>
                        <span className="text-xs font-black text-primary">{formatCurrency(c.outstandingBalance)}</span>
                     </div>
                     <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${Math.min((c.outstandingBalance / (c.creditLimit || 1)) * 100, 100)}%` }} 
                        />
                     </div>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">
                        {c.creditLimit > 0 ? `${Math.round((c.outstandingBalance / c.creditLimit) * 100)}% of limit` : 'No Limit Set'}
                     </p>
                  </div>
                ))
              }
              {customers.filter(c => c.outstandingBalance > 0).length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-200">
                   <Users size={40} className="mb-2 opacity-10" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">All Accounts Balanced</p>
                </div>
              )}
           </div>
           <div className="mt-8 pt-8 border-t border-slate-100 flex justify-between items-center">
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Outstanding</p>
                 <p className="text-lg font-black text-red-500">{formatCurrency(stats.receivables)}</p>
              </div>
              <button className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-primary transition-colors">
                 <ChevronRight size={18} />
              </button>
           </div>
        </div>

        {/* Location Insights (Simplified) */}
        <div className="glass-card p-8 flex flex-col h-[450px]">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black text-charcoal uppercase tracking-tighter">Market Distribution</h3>
              <div className="p-2 bg-violet-50 text-violet-500 rounded-lg">
                 <MapPin size={16} />
              </div>
           </div>
           <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                 <span className="text-xs font-black text-charcoal uppercase">Delhi NCR</span>
                 <span className="text-xs font-bold text-violet-600">42% Vol</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl opacity-80">
                 <span className="text-xs font-black text-charcoal uppercase">Surat, GJ</span>
                 <span className="text-xs font-bold text-violet-600">28% Vol</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl opacity-60">
                 <span className="text-xs font-black text-charcoal uppercase">Mumbai, MH</span>
                 <span className="text-xs font-bold text-violet-600">15% Vol</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl opacity-40">
                 <span className="text-xs font-black text-charcoal uppercase">Ludhiana, PB</span>
                 <span className="text-xs font-bold text-violet-600">10% Vol</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl opacity-20">
                 <span className="text-xs font-black text-charcoal uppercase">Tiruppur, TN</span>
                 <span className="text-xs font-bold text-violet-600">5% Vol</span>
              </div>
           </div>
           <div className="mt-8">
              <p className="text-[10px] text-slate-400 font-bold uppercase italic">* Based on wholesale node data</p>
           </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: any;
  theme: 'blue' | 'red' | 'emerald';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon: Icon, theme }) => {
  const iconThemeMap = {
    blue: 'bg-primary text-white shadow-primary/20',
    red: 'bg-red-500 text-white shadow-red-500/20',
    emerald: 'bg-emerald-500 text-white shadow-emerald-500/20'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="glass-card p-6 border-slate-100 relative overflow-hidden"
    >
      <div className="flex justify-between items-start relative z-10">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1 block">{title}</span>
          <h4 className={cn("text-2xl font-black tracking-tight mb-2 font-display")}>{value}</h4>
        </div>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-lg", iconThemeMap[theme])}>
          <Icon size={20} />
        </div>
      </div>
      <div className={cn("mt-4 pt-4 border-t border-slate-50 flex items-center gap-2")}>
         <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", theme === 'red' ? 'bg-red-400' : 'bg-emerald-400')} />
         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
            {description}
         </span>
      </div>
    </motion.div>
  );
};

export default Dashboard;
