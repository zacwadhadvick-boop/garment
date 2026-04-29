import React, { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Package, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  CheckCircle
} from 'lucide-react';
import { storage } from '../db';
import { formatCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    sales: 0,
    receivables: 0,
    stock: 0,
    margin: 24.5
  });
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);

  useEffect(() => {
    const products = storage.getProducts();
    const customers = storage.getCustomers();
    const invoices = storage.getInvoices();
    const settings = storage.getSettings();
    const returns = storage.getReturns();
    
    const totalSales = invoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
    const totalReceivables = customers.reduce((acc, c) => acc + c.outstandingBalance, 0);
    const totalStock = products.reduce((acc, p) => acc + p.totalStock, 0);
    const totalReturns = returns.reduce((acc, r) => acc + r.totalRefund, 0);
    
    const lowStockCount = products.filter(p => {
      const threshold = p.lowStockThreshold ?? settings.lowStockThreshold;
      return p.totalStock < threshold;
    }).length;
    
    setStats({
      sales: totalSales,
      receivables: totalReceivables,
      stock: totalStock,
      margin: 24.5,
      lowStockCount,
      totalReturns
    });

    setRecentInvoices(invoices.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5));
    setRecentReturns(returns.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5));
  }, []);

  const [recentReturns, setRecentReturns] = useState<any[]>([]);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard 
          title="Total Sales" 
          value={formatCurrency(stats.sales)} 
          description="Lifetime wholesale revenue"
          icon={TrendingUp}
          trend="up"
          theme="blue"
        />
        <StatCard 
          title="Receivables" 
          value={formatCurrency(stats.receivables)} 
          description={`${stats.receivables > 0 ? 'Action required' : 'All clear'}`}
          icon={Users}
          trend={stats.receivables > 50000 ? "down" : "up"}
          theme="red"
        />
        <StatCard 
          title="Stock Value" 
          value={formatCurrency(stats.stock * 400)} 
          description={`${stats.stock.toLocaleString()} Units in hand`}
          icon={Package}
          trend="none"
          theme="blue"
        />
        <StatCard 
          title="Total Returns" 
          value={formatCurrency(stats.totalReturns || 0)} 
          description="In-Process Credit Memos"
          icon={RotateCcw}
          trend="none"
          theme="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">
        {/* Recent Invoices Table (as seen in theme) */}
        <div className="lg:col-span-2 glass-card p-6 lg:p-8 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Recent Bulk Invoices</h3>
            <button className="text-[10px] text-primary font-bold uppercase tracking-widest hover:underline">View All</button>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left min-w-[500px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-slate-400 border-b border-slate-100">
                  <th className="pb-4 font-bold">Invoice ID</th>
                  <th className="pb-4 font-bold">Client Name</th>
                  <th className="pb-4 font-bold">Units</th>
                  <th className="pb-4 font-bold">Amount</th>
                  <th className="pb-4 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400 italic">No invoices generated yet</td>
                  </tr>
                ) : (
                  recentInvoices.map(inv => (
                    <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 font-mono text-xs text-slate-500">{inv.invoiceNumber}</td>
                      <td className="py-4 font-bold text-slate-700 uppercase tracking-tight">{inv.customerName}</td>
                      <td className="py-4 text-slate-500">{inv.items.length} units</td>
                      <td className="py-4 font-bold text-primary">{formatCurrency(inv.grandTotal)}</td>
                      <td className="py-4 text-right">
                        <span className={cn(
                          "px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider border",
                          inv.status === 'Paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-orange-50 text-orange-600 border-orange-100"
                        )}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Returns with Reasons */}
        <div className="glass-card p-6 lg:p-8 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
               <RotateCcw size={16} className="text-red-500" />
               <h3 className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Merchandise Returns</h3>
            </div>
            <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Live Feed</p>
          </div>
          <div className="flex-1 space-y-4">
            {recentReturns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                <RotateCcw size={40} className="opacity-10 mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest">No returns in record</p>
              </div>
            ) : (
              recentReturns.map(ret => (
                <div key={ret.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-charcoal uppercase tracking-tighter">INV: {ret.invoiceNumber}</span>
                    <span className="text-[10px] font-bold text-primary">{formatCurrency(ret.totalRefund)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-600 rounded">REASON</div>
                    <p className="text-[10px] font-medium text-slate-500 truncate italic italic">"{ret.reason || 'No reason specified'}"</p>
                  </div>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest text-right">
                    {new Date(ret.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alert List */}
        <div className="lg:col-span-1 glass-card p-6 lg:p-8 flex flex-col min-h-[400px]">
           <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Restock Requirements</h3>
            <span className="h-5 w-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">{stats.lowStockCount}</span>
          </div>
          <div className="flex-1 space-y-3">
             {storage.getProducts()
               .filter(p => p.totalStock < (p.lowStockThreshold ?? storage.getSettings().lowStockThreshold))
               .slice(0, 6)
               .map(p => (
                 <div key={p.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                          <Package size={14} />
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] font-black uppercase text-charcoal truncate max-w-[120px]">{p.name}</p>
                        <p className="text-[9px] font-bold text-slate-400">Stock: {p.totalStock}</p>
                      </div>
                    </div>
                    <AlertCircle size={14} className="text-red-500" />
                 </div>
               ))
             }
             {stats.lowStockCount === 0 && (
               <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                 <CheckCircle size={40} className="text-emerald-500/20 mb-4" />
                 <p className="text-xs font-bold uppercase tracking-widest">Inventory Healthy</p>
               </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};

const MatrixItem: React.FC<{ label: string, value: string, unit: string, isLow?: boolean }> = ({ label, value, unit, isLow }) => (
  <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
    <span className="block text-[9px] uppercase tracking-widest text-white/30 font-bold mb-1">{label}</span>
    <span className={cn("text-xl font-bold", isLow && "text-red-400 italic")}>
      {value} <span className="text-[10px] font-normal text-white/40">{unit}</span>
    </span>
  </div>
);

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: any;
  trend: 'up' | 'down' | 'none';
  theme: 'blue' | 'red' | 'emerald';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon: Icon, trend, theme }) => {
  const themeMap = {
    blue: 'text-primary',
    red: 'text-red-500',
    emerald: 'text-emerald-500'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 border-transparent hover:border-slate-100"
    >
      <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1 block">{title}</span>
      <h4 className={cn("text-2xl font-bold tracking-tight mb-2 font-display", themeMap[theme])}>{value}</h4>
      <span className={cn(
        "text-[10px] font-bold",
        trend === 'up' ? "text-emerald-500" : trend === 'down' ? "text-red-500" : "text-gray-400"
      )}>
        {description}
      </span>
    </motion.div>
  );
};

export default Dashboard;
