import React, { useState, useEffect } from 'react';
import { storage } from '../db';
import { Customer } from '../types';
import { Plus, Search, Mail, Phone, MapPin, IndianRupee, Tag } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '',
    businessName: '',
    gstin: '',
    phone: '',
    email: '',
    address: '',
    creditLimit: 0,
    tier: 'Retail'
  });

  useEffect(() => {
    setCustomers(storage.getCustomers());
  }, []);

  const handleAddCustomer = () => {
    const c: Customer = {
      ...newCustomer as Customer,
      id: Date.now().toString(),
      outstandingBalance: 0
    };
    const updated = [...customers, c];
    setCustomers(updated);
    storage.saveCustomers(updated);
    setIsModalOpen(false);
    setNewCustomer({
      name: '', businessName: '', gstin: '', phone: '',
      email: '', address: '', creditLimit: 0, tier: 'Retail'
    });
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.businessName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search B2B Customers..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary py-2.5"
        >
          <Plus size={18} />
          Add Business
        </button>
      </div>

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold text-charcoal mb-6 uppercase tracking-tight">Onboard New Merchant</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Entity / Business Name</label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-primary/30"
                    value={newCustomer.businessName}
                    onChange={e => setNewCustomer({...newCustomer, businessName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Point of Contact</label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-primary/30"
                    value={newCustomer.name}
                    onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">GSTIN Number</label>
                <input 
                  type="text" 
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-primary/30"
                  value={newCustomer.gstin}
                  onChange={e => setNewCustomer({...newCustomer, gstin: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Mobile Number</label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-primary/30"
                    value={newCustomer.phone}
                    onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Business Email</label>
                  <input 
                    type="email" 
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-primary/30"
                    value={newCustomer.email}
                    onChange={e => setNewCustomer({...newCustomer, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Credit Limit (₹)</label>
                  <input 
                    type="number" 
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-primary/30"
                    value={newCustomer.creditLimit}
                    onChange={e => setNewCustomer({...newCustomer, creditLimit: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Merchant Tier</label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-primary/30"
                    value={newCustomer.tier}
                    onChange={e => setNewCustomer({...newCustomer, tier: e.target.value as any})}
                  >
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Registered Address</label>
                <textarea 
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-primary/30 h-20"
                  value={newCustomer.address}
                  onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                ></textarea>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="btn-secondary py-3 uppercase tracking-widest text-[10px]"
              >
                Cancel Process
              </button>
              <button 
                onClick={handleAddCustomer}
                className="btn-primary py-3 uppercase tracking-widest text-[10px]"
              >
                Save Business
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {filtered.map(customer => (
          <div key={customer.id} className="glass-card p-8 flex flex-col group hover:border-primary/20 transition-all border-transparent">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h4 className="font-bold text-lg text-charcoal uppercase tracking-tight">{customer.businessName}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{customer.name} | GST: {customer.gstin}</p>
              </div>
              <span className={cn(
                "px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-widest border",
                customer.tier === 'Wholesale' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
              )}>
                {customer.tier}
              </span>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4 text-[11px] text-gray-500 font-medium uppercase tracking-wide">
                <Phone size={14} className="text-gray-300" />
                {customer.phone}
              </div>
              <div className="flex items-center gap-4 text-[11px] text-gray-500 font-medium uppercase tracking-wide">
                <Mail size={14} className="text-gray-300" />
                {customer.email}
              </div>
              <div className="flex items-center gap-4 text-[11px] text-gray-500 font-medium uppercase tracking-wide leading-relaxed">
                <MapPin size={14} className="text-gray-300 shrink-0" />
                {customer.address}
              </div>
            </div>

            <div className="mt-auto grid grid-cols-2 gap-8 pt-6 border-t border-slate-50">
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest mb-1">Receivables</p>
                <p className={cn(
                  "text-lg font-bold font-display",
                  customer.outstandingBalance > 30000 ? "text-red-500" : "text-emerald-500"
                )}>
                  {formatCurrency(customer.outstandingBalance)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest mb-1">Credit Limit</p>
                <p className="text-lg font-bold text-charcoal font-display">{formatCurrency(customer.creditLimit)}</p>
              </div>
            </div>
            
            <button className="btn-secondary mt-8 w-full">
              Full Statement
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Customers;
