import React, { useState, useEffect } from 'react';
import { storage } from '../db';
import { Customer, Campaign } from '../types';
import { 
  Megaphone, 
  Users, 
  MessageSquare, 
  Send, 
  Plus, 
  Search, 
  Calendar, 
  Filter, 
  CheckCircle2, 
  Clock, 
  MoreHorizontal,
  Mail,
  Smartphone,
  Gift
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const Marketing: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState<'campaigns' | 'customers'>('campaigns');
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState<Partial<Campaign>>({
    name: '',
    type: 'WhatsApp',
    offerDetails: '',
    targetSegment: 'All'
  });

  useEffect(() => {
    setCustomers(storage.getCustomers());
    setCampaigns(storage.getCampaigns());
  }, []);

  const handleCreateCampaign = () => {
    if (!newCampaign.name || !newCampaign.offerDetails) return;
    const campaign: Campaign = {
      id: `CMP-${Date.now()}`,
      name: newCampaign.name,
      type: newCampaign.type as any,
      offerDetails: newCampaign.offerDetails,
      targetSegment: newCampaign.targetSegment as any,
      status: 'Scheduled',
      createdAt: Date.now()
    };
    const updated = [...campaigns, campaign];
    setCampaigns(updated);
    storage.saveCampaigns(updated);
    setIsCampaignModalOpen(false);
    setNewCampaign({ name: '', type: 'WhatsApp', offerDetails: '', targetSegment: 'All' });
  };

  const handleSendCampaign = (id: string) => {
    const updated = campaigns.map(c => c.id === id ? { ...c, status: 'Sent' as const } : c);
    setCampaigns(updated);
    storage.saveCampaigns(updated);
    // Simulate API call
    alert(`Bulk ${campaigns.find(c => c.id === id)?.type} promotion sent successfully!`);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h2 className="text-2xl font-black text-charcoal uppercase tracking-tighter">Growth & Promotion</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">CRM & Marketing Automation</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setTab('campaigns')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
              tab === 'campaigns' ? "bg-white text-charcoal shadow-sm" : "text-gray-400 hover:text-charcoal"
            )}
          >
            Campaigns
          </button>
          <button 
            onClick={() => setTab('customers')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
              tab === 'customers' ? "bg-white text-charcoal shadow-sm" : "text-gray-400 hover:text-charcoal"
            )}
          >
            Audience
          </button>
        </div>
      </div>

      {tab === 'campaigns' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-xl shadow-blue-500/20">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Megaphone size={20} />
                </div>
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-indigo-600 bg-slate-200 flex items-center justify-center text-[8px] font-bold">U{i}</div>
                  ))}
                </div>
              </div>
              <h3 className="text-xl font-bold mb-1">Festival Rush</h3>
              <p className="text-xs text-white/80 font-medium mb-6">Reach 450+ wholesale clients instantly via WhatsApp and SMS.</p>
              <button 
                onClick={() => setIsCampaignModalOpen(true)}
                className="w-full bg-white text-blue-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-lg"
              >
                Launch New Campaign
              </button>
            </div>

            <div className="glass-card p-6 border-slate-100 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Outreach</p>
                <div className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[8px] font-bold uppercase">Automated</div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-charcoal">Order Confirmations</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">WhatsApp Auto-Send</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-charcoal">Payment Reminders</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">SMS Alerts (Due date + 2d)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 border-slate-100 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loyalty Reward Points</p>
                <Gift className="text-primary" size={18} />
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-charcoal tracking-tighter">₹24,500</p>
                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-1">Total Rewards Provisioned</p>
                <div className="h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-primary w-[65%] rounded-full shadow-[0_0_8px_rgba(255,90,31,0.4)]"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h3 className="font-black text-charcoal uppercase tracking-tighter">Campaign History</h3>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Campaign Details</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic font-medium">No campaigns found. Create your first promotion above.</td>
                  </tr>
                ) : (
                  campaigns.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-charcoal">{c.name}</p>
                        <p className="text-[10px] text-gray-400 truncate max-w-[200px]">{c.offerDetails}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {c.type === 'WhatsApp' && <MessageSquare size={14} className="text-green-500" />}
                          {c.type === 'SMS' && <Smartphone size={14} className="text-blue-500" />}
                          <span className="text-xs font-bold text-charcoal">{c.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-500">{c.targetSegment}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn(
                          "px-2 py-1 rounded text-[8px] font-black uppercase inline-flex items-center gap-1",
                          c.status === 'Sent' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                        )}>
                          {c.status === 'Sent' ? <CheckCircle2 size={10} /> : <Calendar size={10} />}
                          {c.status}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {c.status !== 'Sent' && (
                          <button 
                            onClick={() => handleSendCampaign(c.id)}
                            className="bg-primary text-white text-[9px] font-bold uppercase tracking-widest py-1 px-3 rounded-lg hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                          >
                            Send Now
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Search by name, business or phone..."
                 className="w-full pl-10 pr-4 py-2 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-bold"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
             <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all">
               <Filter size={18} />
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map(customer => (
              <motion.div 
                key={customer.id} 
                layout
                className="glass-card p-6 border-slate-100 hover:shadow-xl transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-all">
                    <Users size={24} />
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="px-2 py-1 bg-amber-50 text-amber-600 rounded text-[8px] font-black uppercase tracking-widest mb-1">
                      {customer.tier} Partner
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                      <Gift size={12} className="text-primary" />
                      {customer.loyaltyPoints || 0} pts
                    </div>
                  </div>
                </div>
                <h4 className="font-bold text-charcoal uppercase tracking-tight">{customer.businessName}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-4">{customer.name}</p>
                
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-gray-400 uppercase tracking-widest">Active Orders</span>
                    <span className="text-charcoal font-black">12</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-gray-400 uppercase tracking-widest">Total Value</span>
                    <span className="text-charcoal font-black">₹4.2L</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button className="py-2 px-3 bg-green-50 text-green-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-green-100 transition-all flex items-center justify-center gap-2">
                    <MessageSquare size={12} /> WhatsApp
                  </button>
                  <button className="py-2 px-3 bg-slate-50 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                    <Calendar size={12} /> Follow-up
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* New Campaign Modal */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-charcoal mb-6 uppercase tracking-tight">Design Promo Outbound</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Campaign Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Diwali Dhamaka 2024"
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-primary/30 font-bold"
                  value={newCampaign.name}
                  onChange={e => setNewCampaign({...newCampaign, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Outreach Channel</label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-primary/30 text-xs font-bold"
                    value={newCampaign.type}
                    onChange={e => setNewCampaign({...newCampaign, type: e.target.value as any})}
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="SMS">SMS Alert</option>
                    <option value="BulkEmail">Newsletter</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Audience Segment</label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-primary/30 text-xs font-bold"
                    value={newCampaign.targetSegment}
                    onChange={e => setNewCampaign({...newCampaign, targetSegment: e.target.value as any})}
                  >
                    <option value="All">All Audience</option>
                    <option value="Wholesale">Wholesale Only</option>
                    <option value="Premium">Premium (Top 20%)</option>
                    <option value="Retail">Direct Retailers</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Message Content / Offer Details</label>
                <textarea 
                  rows={4}
                  placeholder="Paste your promo text here..."
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-primary/30 font-medium text-xs leading-relaxed"
                  value={newCampaign.offerDetails}
                  onChange={e => setNewCampaign({...newCampaign, offerDetails: e.target.value})}
                />
                <p className="text-[8px] text-gray-400 font-bold uppercase mt-1">Hint: Use {`{name}`} to personalize messages</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button 
                onClick={() => setIsCampaignModalOpen(false)}
                className="btn-secondary py-3 uppercase tracking-widest text-[10px]"
              >
                Draft Save
              </button>
              <button 
                onClick={handleCreateCampaign}
                className="btn-primary py-3 uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
              >
                Schedule Blast
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketing;
