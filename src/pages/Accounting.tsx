import React, { useState, useMemo } from 'react';
import { storage } from '../db';
import { Transaction, ExpenseRecord, Customer, Vendor, BusinessSettings } from '../types';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  PieChart, 
  Wallet, 
  Building2, 
  FileText, 
  Plus, 
  Search,
  Filter,
  ArrowRightLeft,
  Calendar,
  IndianRupee,
  Activity,
  Calculator,
  Download,
  Landmark,
  TrendingUp,
  Receipt,
  Trash2,
  X
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const Accounting: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'expenses' | 'gst' | 'statements'>('overview');
  const [transactions, setTransactions] = useState<Transaction[]>(storage.getTransactions());
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(storage.getExpenses());
  const [customers] = useState<Customer[]>(storage.getCustomers());
  const [vendors] = useState<Vendor[]>(storage.getVendors());
  const [settings] = useState<BusinessSettings>(storage.getSettings());

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month'>('all');

  // --- DERIVED DATA ---
  
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();

    const currentTxs = transactions.filter(t => {
      const d = new Date(t.date);
      if (dateFilter === 'today') return d.toISOString().split('T')[0] === today;
      if (dateFilter === 'month') return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      return true;
    });

    const income = currentTxs.reduce((acc, t) => (t.type === 'Income' || t.type === 'Payment_In' ? acc + t.amount : acc), 0);
    const outflow = currentTxs.reduce((acc, t) => (t.type === 'Expense' || t.type === 'Payment_Out' ? acc + t.amount : acc), 0);
    const expenseTotal = expenses.reduce((acc, e) => acc + e.amount, 0);

    const cashBalance = currentTxs.reduce((acc, t) => t.paymentMethod === 'Cash' ? (t.type === 'Income' || t.type === 'Payment_In' ? acc + t.amount : acc - t.amount) : acc, 0);
    const bankBalance = currentTxs.reduce((acc, t) => (t.paymentMethod === 'Bank' || t.paymentMethod === 'UPI' || t.paymentMethod === 'Card') ? (t.type === 'Income' || t.type === 'Payment_In' ? acc + t.amount : acc - t.amount) : acc, 0);

    return { income, outflow, expenseTotal, cashBalance, bankBalance, net: income - outflow - expenseTotal };
  }, [transactions, expenses, dateFilter]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.entityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => b.date - a.date);
  }, [transactions, searchTerm]);

  // --- CHART DATA ---
  const dailyFlowData = useMemo(() => {
    const data: Record<string, { income: number, expense: number }> = {};
    transactions.slice(-15).forEach(t => {
      const label = new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      if (!data[label]) data[label] = { income: 0, expense: 0 };
      if (t.type === 'Income' || t.type === 'Payment_In') data[label].income += t.amount;
      else data[label].expense += t.amount;
    });
    return Object.entries(data).map(([name, vals]) => ({ name, ...vals }));
  }, [transactions]);

  const expenseCategoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    expenses.forEach(e => {
      cats[e.category] = (cats[e.category] || 0) + e.amount;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  // --- ACTIONS ---
  const handleAddTransaction = (newTx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const tx: Transaction = {
      ...newTx,
      id: `TR-${Date.now()}`,
      createdAt: Date.now()
    };
    const updated = [...transactions, tx];
    storage.saveTransactions(updated);
    setTransactions(updated);
    setIsTxModalOpen(false);

    // Update Entity balance if necessary
    if (tx.entityId) {
      if (tx.type === 'Payment_In') {
        const custs = storage.getCustomers();
        const updatedCusts = custs.map(c => c.id === tx.entityId ? { ...c, outstandingBalance: c.outstandingBalance - tx.amount } : c);
        storage.saveCustomers(updatedCusts);
      }
      // Vendors would be Payment_Out -> reduce balance (not fully implemented vendor balance yet)
    }
  };

  const handleAddExpense = (newExp: Omit<ExpenseRecord, 'id' | 'createdAt'>) => {
    const exp: ExpenseRecord = {
      ...newExp,
      id: `EXP-${Date.now()}`,
      createdAt: Date.now()
    };
    const updated = [...expenses, exp];
    storage.saveExpenses(updated);
    setExpenses(updated);
    setIsExpenseModalOpen(false);

    // Also record as a transaction
    const tx: Transaction = {
      id: `TR-EXP-${Date.now()}`,
      type: 'Expense',
      category: exp.category,
      amount: exp.amount,
      paymentMethod: exp.paymentMethod,
      description: exp.description,
      date: exp.date,
      createdAt: Date.now(),
      referenceType: 'Expense',
      referenceId: exp.id
    };
    const updatedTxs = [...transactions, tx];
    storage.saveTransactions(updatedTxs);
    setTransactions(updatedTxs);
  };

  const renderOverview = () => (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-8 bg-emerald-50/50 border-emerald-100">
           <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                <ArrowUpRight size={24} />
             </div>
             <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-100 px-2 py-1 rounded-lg">Cash In</span>
           </div>
           <p className="text-3xl font-black text-emerald-900">{formatCurrency(stats.income)}</p>
           <p className="text-[10px] font-bold text-emerald-600 uppercase mt-2">Revenue & Receipts</p>
        </div>

        <div className="glass-card p-8 bg-red-50/50 border-red-100">
           <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                <ArrowDownLeft size={24} />
             </div>
             <span className="text-[10px] font-black text-red-600 uppercase tracking-widest bg-red-100 px-2 py-1 rounded-lg">Outflow</span>
           </div>
           <p className="text-3xl font-black text-red-900">{formatCurrency(stats.outflow + stats.expenseTotal)}</p>
           <p className="text-[10px] font-bold text-red-600 uppercase mt-2">Purchases & Expenses</p>
        </div>

        <div className="glass-card p-8 bg-primary/5 border-primary/10">
           <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                <Wallet size={24} />
             </div>
             <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded-lg">Liquid</span>
           </div>
           <p className="text-3xl font-black text-charcoal">{formatCurrency(stats.cashBalance)}</p>
           <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Cash on Hand</p>
        </div>

        <div className="glass-card p-8 bg-violet-50 border-violet-100">
           <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-violet-100 text-violet-600 rounded-2xl">
                <Landmark size={24} />
             </div>
             <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest bg-violet-100 px-2 py-1 rounded-lg">Vault</span>
           </div>
           <p className="text-3xl font-black text-charcoal">{formatCurrency(stats.bankBalance)}</p>
           <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Bank & UPI Deposit</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-8">
          <h3 className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-8 flex items-center gap-2">
            <Activity size={14} className="text-primary" />
            Liquidity Velocity (Last 15 Records)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyFlowData}>
                <defs>
                   <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                   </linearGradient>
                   <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                   </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#incGrad)" strokeWidth={3} />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#expGrad)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8">
          <h3 className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-8 flex items-center gap-2">
            <Receipt size={14} className="text-orange-500" />
            Expense Breakdown
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                 <Pie
                  data={expenseCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                 >
                   {expenseCategoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                 </Pie>
                 <Tooltip />
                 <Legend verticalAlign="bottom" height={36}/>
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLedger = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
           <h3 className="text-xs font-black text-charcoal uppercase tracking-widest flex items-center gap-2">
             <FileText size={16} className="text-primary" />
             Master Transaction Journal
           </h3>
           <div className="flex items-center gap-4">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Reference, Entity, Desc..."
                  className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-4 focus:ring-primary/5 w-64"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setIsTxModalOpen(true)}
                className="p-2.5 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Plus size={18} />
              </button>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className="text-left p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Date</th>
                <th className="text-left p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Description</th>
                <th className="text-left p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Entity</th>
                <th className="text-center p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Type</th>
                <th className="text-center p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Mode</th>
                <th className="text-right p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(tx => (
                <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-[10px] font-bold text-slate-500 uppercase">{new Date(tx.date).toLocaleDateString()}</td>
                  <td className="p-4">
                    <p className="text-[10px] font-black text-charcoal uppercase tracking-tighter">{tx.description}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">{tx.referenceNumber || tx.id}</p>
                  </td>
                  <td className="p-4">
                    <span className="text-[10px] font-bold text-primary uppercase">{tx.entityName || 'General'}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                      tx.type === 'Income' || tx.type === 'Payment_In' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                    )}>
                      {tx.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{tx.paymentMethod}</span>
                  </td>
                  <td className={cn(
                    "p-4 text-right text-xs font-black",
                    tx.type === 'Income' || tx.type === 'Payment_In' ? "text-emerald-600" : "text-red-600"
                  )}>
                    {tx.type === 'Income' || tx.type === 'Payment_In' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderExpenses = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
       <div className="flex justify-between items-center mb-6">
         <div>
            <h3 className="text-lg font-black text-charcoal uppercase tracking-tighter">Overhead Tracking</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Log non-inventory business costs</p>
         </div>
         <button 
          onClick={() => setIsExpenseModalOpen(true)}
          className="flex items-center gap-3 bg-primary text-white py-3.5 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
         >
           <Plus size={18} />
           Log Expense
         </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {expenses.sort((a,b) => b.date - a.date).map(exp => (
           <div key={exp.id} className="glass-card p-6 group hover:border-primary/20 transition-all">
             <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                   <Receipt size={20} />
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-300 uppercase">{new Date(exp.date).toDateString()}</p>
                  <p className="text-xl font-black text-charcoal mt-1">{formatCurrency(exp.amount)}</p>
                </div>
             </div>
             <div className="mb-4">
                <p className="text-xs font-black text-charcoal uppercase tracking-tighter mb-1">{exp.description}</p>
                <div className="flex gap-2">
                   <span className="px-2 py-0.5 bg-slate-100 rounded text-[8px] font-black text-slate-500 uppercase tracking-widest">{exp.category}</span>
                   <span className="px-2 py-0.5 bg-slate-100 rounded text-[8px] font-black text-slate-500 uppercase tracking-widest">{exp.paymentMethod}</span>
                </div>
             </div>
             <button className="w-full py-2 bg-slate-50 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
               Delete Record
             </button>
           </div>
         ))}
       </div>
    </div>
  );

  const renderGSTReport = () => {
    const invoices = storage.getInvoices().filter(inv => inv.status !== 'Draft');
    const cgstTotal = invoices.reduce((acc, inv) => acc + (inv.cgstTotal || 0), 0);
    const sgstTotal = invoices.reduce((acc, inv) => acc + (inv.sgstTotal || 0), 0);
    const igstTotal = invoices.reduce((acc, inv) => acc + (inv.igstTotal || 0), 0);
    const taxLiability = cgstTotal + sgstTotal + igstTotal;

    return (
      <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
        <div className="glass-card p-8 border-primary/20 bg-primary/5">
           <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-lg font-black text-charcoal uppercase tracking-tighter">GST Compliance Monitor</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GSTR-1 & GSTR-3B Summary Estimates</p>
              </div>
              <div className="p-4 bg-primary text-white rounded-2xl">
                <Calculator size={24} />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Total CGST</p>
                <p className="text-2xl font-black text-charcoal">{formatCurrency(cgstTotal)}</p>
              </div>
              <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Total SGST</p>
                <p className="text-2xl font-black text-charcoal">{formatCurrency(sgstTotal)}</p>
              </div>
              <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Total IGST</p>
                <p className="text-2xl font-black text-charcoal">{formatCurrency(igstTotal)}</p>
              </div>
              <div className="p-6 bg-primary text-white rounded-3xl shadow-xl shadow-primary/20">
                <p className="text-[9px] font-black text-white/60 uppercase mb-2">Tax Liability</p>
                <p className="text-2xl font-black">{formatCurrency(taxLiability)}</p>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-card p-8">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">B2B vs B2C Invoice Split</h4>
            <div className="h-[250px]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={[{ name: 'B2B (GSTIN)', val: invoices.filter(inv => !!(customers.find(c => c.id === inv.customerId)?.gstin)).length }, { name: 'B2C (Unreg)', val: invoices.filter(inv => !(customers.find(c => c.id === inv.customerId)?.gstin)).length }]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="val" fill="#2563eb" radius={[8, 8, 0, 0]} barSize={50} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
          </div>
          <div className="glass-card p-8">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Tax Percentage Distribution</h4>
             <div className="h-[250px]">
               <ResponsiveContainer width="100%" height="100%">
                 <RePieChart>
                    <Pie
                      data={[
                        { name: '5% Block', value: invoices.reduce((acc, inv) => acc + (inv.taxTotal / 0.05), 0) },
                        { name: '12% Block', value: invoices.reduce((acc, inv) => acc + (inv.taxTotal / 0.12), 0) },
                      ]}
                      cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value"
                    >
                      <Cell fill="#2563eb" /><Cell fill="#10b981" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                 </RePieChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStatements = () => {
    // Advanced P&L calculation linked to transaction data
    const salesRevenue = transactions
      .filter(t => (t.type === 'Income' || t.type === 'Payment_In') && t.category === 'Sales')
      .reduce((acc, t) => acc + t.amount, 0);
    
    const otherIncome = transactions
      .filter(t => (t.type === 'Income' || t.type === 'Payment_In') && t.category !== 'Sales')
      .reduce((acc, t) => acc + t.amount, 0);

    const cogs = transactions
      .filter(t => (t.type === 'Expense' || t.type === 'Payment_Out') && t.category === 'Purchase')
      .reduce((acc, t) => acc + t.amount, 0);

    // Group expenses by category
    const expByCategory = expenses.reduce((acc: Record<string, number>, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    const totalOpExpenses = Object.values(expByCategory).reduce((acc: number, val: number) => acc + val, 0);
    
    const grossProfit = salesRevenue - cogs;
    const netProfit = (salesRevenue + otherIncome) - (cogs + totalOpExpenses);

    // Balance Sheet data
    const inventoryValue = storage.getProducts().reduce((acc: number, p) => acc + (p.totalStock * p.purchasePrice), 0);
    const receivables = customers.reduce((acc: number, c) => acc + c.outstandingBalance, 0);
    const cashBank = stats.cashBalance + stats.bankBalance;
    const totalAssets = inventoryValue + receivables + cashBank;
    
    const taxLiability = storage.getInvoices()
      .filter(inv => inv.status !== 'Draft')
      .reduce((acc: number, inv) => acc + (inv.taxTotal || 0), 0);
    
    const payables = transactions
      .filter(t => t.type === 'Payment_Out' && t.category === 'Purchase' && t.paymentMethod === 'Cash') // Rough estimate of unpaid or similar? 
      // Actually payables should be tracked separately, but we'll use a placeholder or derived value for now
      .reduce((acc: number, t) => acc + (t.amount * 0.1), 0); // Placeholder for 10% of purchases as recent payables

    return (
      <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
         <div className="glass-card p-10 bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[120px] rounded-full -mr-32 -mt-32" />
            <div className="relative z-10">
               <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">Financial Health Score</h3>
               <div className="flex items-end gap-6 mb-10">
                  <p className="text-6xl font-black tracking-tighter">{((netProfit / (salesRevenue || 1)) * 100).toFixed(1)}%</p>
                  <div className="pb-2">
                    <p className="text-xs font-bold text-slate-400 uppercase">Net Margin Portfolio</p>
                    <p className="text-[10px] font-black text-emerald-400 uppercase flex items-center gap-1">
                      <TrendingUp size={10} />
                      {netProfit > 0 ? "Profitable Growth" : "Monitoring Required"}
                    </p>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8 border-t border-white/10">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Income</p>
                    <p className="text-xl font-black">{formatCurrency(salesRevenue + otherIncome)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Burn</p>
                    <p className="text-xl font-black text-red-400">{formatCurrency(cogs + totalOpExpenses)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Net Cash Flow</p>
                    <p className="text-xl font-black text-emerald-400">{formatCurrency(netProfit)}</p>
                  </div>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-card p-8">
               <div className="flex justify-between items-center mb-8">
                  <div>
                    <h4 className="text-xs font-black text-charcoal uppercase tracking-widest">Profit & Loss Statement</h4>
                    <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">Fiscal Year 2024-25</p>
                  </div>
                  <Download size={14} className="text-slate-300 cursor-pointer hover:text-primary transition-colors" />
               </div>
               <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 text-[10px] font-bold text-slate-500 uppercase">
                      <span>Sales Revenue</span>
                      <span className="text-emerald-500">{formatCurrency(salesRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 text-[10px] font-bold text-slate-500 uppercase">
                      <span>Cost of Goods Sold (Purchases)</span>
                      <span className="text-red-500">-{formatCurrency(cogs)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-t border-slate-100 mt-2 font-black text-charcoal">
                      <span>Gross Profit</span>
                      <span>{formatCurrency(grossProfit)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4">
                    <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-2">Operating Expenses</p>
                    {Object.entries(expByCategory).map(([cat, amt]: [string, number]) => (
                      <div key={cat} className="flex justify-between items-center py-1 text-[10px] font-bold text-slate-500 uppercase">
                        <span>{cat}</span>
                        <span className="text-red-400">-{formatCurrency(amt)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center py-1 text-[10px] font-bold text-slate-500 uppercase">
                      <span>Other Income</span>
                      <span className="text-emerald-400">+{formatCurrency(otherIncome)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t-2 border-primary mt-4 pt-4 text-primary font-black text-lg">
                    <span>Net Profit / Loss</span>
                    <span className={netProfit < 0 ? 'text-red-500' : 'text-emerald-600'}>
                      {formatCurrency(netProfit)}
                    </span>
                  </div>
               </div>
            </div>
            
            <div className="glass-card p-8">
               <div className="flex justify-between items-center mb-8">
                  <div>
                    <h4 className="text-xs font-black text-charcoal uppercase tracking-widest">Balance Sheet</h4>
                    <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">Real-time Snapshot</p>
                  </div>
                  <Download size={14} className="text-slate-300 cursor-pointer hover:text-primary transition-colors" />
               </div>
               <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-4">
                     <p className="text-[9px] font-black text-primary uppercase border-b border-primary/10 pb-2">Assets</p>
                     <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                           <span>Cash & Bank</span>
                           <span className="text-charcoal">{formatCurrency(cashBank)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                           <span>Inventory (At Cost)</span>
                           <span className="text-charcoal">{formatCurrency(inventoryValue)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                           <span>Accounts Receivable</span>
                           <span className="text-charcoal">{formatCurrency(receivables)}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-50 flex justify-between text-[10px] font-black text-charcoal uppercase">
                           <span>Total Assets</span>
                           <span>{formatCurrency(totalAssets)}</span>
                        </div>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <p className="text-[9px] font-black text-red-500 uppercase border-b border-red-500/10 pb-2">Liabilities</p>
                     <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                           <span>Accounts Payable</span>
                           <span className="text-charcoal">{formatCurrency(payables)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                           <span>GST Payable</span>
                           <span className="text-charcoal">{formatCurrency(taxLiability)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                           <span>Other Liabilities</span>
                           <span className="text-charcoal">₹0.00</span>
                        </div>
                        <div className="pt-2 border-t border-slate-50 flex justify-between text-[10px] font-black text-charcoal uppercase">
                           <span>Total Liab.</span>
                           <span>{formatCurrency(payables + taxLiability)}</span>
                        </div>
                     </div>
                  </div>
               </div>
               <div className="mt-10 pt-6 border-t border-slate-200 flex justify-between items-center bg-slate-50 -mx-8 -mb-8 px-8 py-6 rounded-b-3xl">
                  <div>
                    <p className="text-[10px] font-black text-charcoal uppercase tracking-tighter">Business Net Worth</p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">(Equity & Retained Earnings)</p>
                  </div>
                  <p className="text-3xl font-black text-primary">{formatCurrency(totalAssets - (payables + taxLiability))}</p>
               </div>
            </div>
         </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
       <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm print:hidden">
        <div>
          <h2 className="text-2xl font-black text-charcoal uppercase tracking-tighter">Finance Hub</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Real-time ledger & Fiscal reports</p>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 shadow-inner">
            {(['overview', 'ledger', 'expenses', 'gst', 'statements'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === tab ? "bg-white text-primary shadow-md scale-[1.05]" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-3 bg-white border border-slate-200 text-slate-400 py-3.5 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            <Download size={18} />
            Fiscal Report
          </button>
        </div>
      </div>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'ledger' && renderLedger()}
      {activeTab === 'expenses' && renderExpenses()}
      {activeTab === 'gst' && renderGSTReport()}
      {activeTab === 'statements' && renderStatements()}

      {/* Manual Transaction Modal */}
      <AnimatePresence>
        {isTxModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.95, opacity: 0 }}
               className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden flex flex-col shadow-2xl"
             >
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                   <h3 className="text-xl font-black text-charcoal uppercase tracking-tighter">New Journal Entry</h3>
                   <button onClick={() => setIsTxModalOpen(false)} className="text-slate-400 hover:text-charcoal transition-colors"><X/></button>
                </div>
                <form className="p-8 space-y-4" onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleAddTransaction({
                    type: formData.get('type') as any,
                    category: formData.get('category') as any,
                    amount: Number(formData.get('amount')),
                    description: formData.get('description') as string,
                    paymentMethod: formData.get('method') as any,
                    date: new Date(formData.get('date') as string).getTime(),
                    entityId: formData.get('entityId') as string || undefined,
                    entityName: formData.get('entityId') ? customers.find(c => c.id === formData.get('entityId'))?.businessName : undefined
                  });
                }}>
                   <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Record Type</label>
                     <select name="type" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-primary/20">
                        <option value="Payment_In">Payment In (Receipt)</option>
                        <option value="Payment_Out">Payment Out (Voucher)</option>
                        <option value="Income">Direct Income</option>
                        <option value="Expense">Direct Expense</option>
                     </select>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Amount (₹)</label>
                        <input name="amount" type="number" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-primary/20" placeholder="0.00"/>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Method</label>
                        <select name="method" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-primary/20">
                           <option value="Cash">Cash</option>
                           <option value="Bank">Bank Transfer</option>
                           <option value="UPI">UPI / GPay</option>
                           <option value="Card">Card</option>
                        </select>
                      </div>
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Date</label>
                     <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-primary/20"/>
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Description</label>
                     <input name="description" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-primary/20" placeholder="Monthly Rent, Labor, etc."/>
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Link Project/Entity (Opt)</label>
                     <select name="entityId" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-primary/20">
                        <option value="">No Entity...</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.businessName}</option>)}
                     </select>
                   </div>
                   <button type="submit" className="w-full bg-primary text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 mt-4">Confirm Entry</button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Expense Modal */}
      <AnimatePresence>
        {isExpenseModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.95, opacity: 0 }}
               className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden flex flex-col shadow-2xl"
             >
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                   <h3 className="text-xl font-black text-charcoal uppercase tracking-tighter">Expense Voucher</h3>
                   <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-charcoal transition-colors"><X/></button>
                </div>
                <form className="p-8 space-y-4" onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleAddExpense({
                    category: formData.get('category') as any,
                    amount: Number(formData.get('amount')),
                    description: formData.get('description') as string,
                    paymentMethod: formData.get('method') as any,
                    date: new Date(formData.get('date') as string).getTime()
                  });
                }}>
                   <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Category</label>
                     <select name="category" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-primary/20">
                        <option value="Transport">Transport / Freight</option>
                        <option value="Labor">Labor Charges</option>
                        <option value="Salary">Staff Salary</option>
                        <option value="Rent">Shop/Warehouse Rent</option>
                        <option value="Utility">Electricity/Water/Web</option>
                        <option value="Marketing">Marketing & Ads</option>
                        <option value="Other">Miscellaneous</option>
                     </select>
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Amount (₹)</label>
                     <input name="amount" type="number" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-primary/20" placeholder="0.00"/>
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Description</label>
                     <input name="description" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-primary/20" placeholder="Detail of expense..."/>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Mode</label>
                        <select name="method" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-primary/20">
                           <option value="Cash">Cash</option>
                           <option value="Bank">Bank</option>
                           <option value="UPI">UPI</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Date</label>
                        <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-primary/20"/>
                      </div>
                   </div>
                   <button type="submit" className="w-full bg-primary text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 mt-4">Record Expense</button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Accounting;
