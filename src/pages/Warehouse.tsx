import React, { useState, useEffect } from 'react';
import { storage } from '../db';
import { Warehouse, WarehouseTransfer, Product } from '../types';
import { 
  Warehouse as WarehouseIcon, 
  MapPin, 
  MoveHorizontal, 
  Plus, 
  ArrowRight, 
  Box, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  History,
  ClipboardList,
  Truck,
  PackageCheck,
  Search
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const WarehouseManagement: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [transfers, setTransfers] = useState<WarehouseTransfer[]>([]);
  const [products] = useState<Product[]>(storage.getProducts());
  const [tab, setTab] = useState<'inventory' | 'transfers'>('inventory');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [newTransfer, setNewTransfer] = useState<Partial<WarehouseTransfer>>({
    fromWarehouseId: '',
    toWarehouseId: '',
    items: []
  });

  useEffect(() => {
    setWarehouses(storage.getWarehouses());
    setTransfers(storage.getTransfers());
  }, []);

  const handleCreateTransfer = () => {
    if (!newTransfer.fromWarehouseId || !newTransfer.toWarehouseId || !newTransfer.items?.length) return;
    const transfer: WarehouseTransfer = {
      id: `TRF-${Date.now()}`,
      transferNumber: `TRF-${transfers.length + 1001}`,
      fromWarehouseId: newTransfer.fromWarehouseId,
      toWarehouseId: newTransfer.toWarehouseId,
      items: newTransfer.items,
      status: 'Sent',
      createdAt: Date.now()
    };
    const updated = [...transfers, transfer];
    setTransfers(updated);
    storage.saveTransfers(updated);
    setIsTransferModalOpen(false);
    setNewTransfer({ fromWarehouseId: '', toWarehouseId: '', items: [] });
  };

  const handleUpdateStatus = (id: string, status: WarehouseTransfer['status']) => {
    const updated = transfers.map(t => t.id === id ? { ...t, status } : t);
    setTransfers(updated);
    storage.saveTransfers(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h2 className="text-2xl font-black text-charcoal uppercase tracking-tighter">Unified Warehousing</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Multi-site Logistics & Rack Mgmt</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setTab('inventory')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
              tab === 'inventory' ? "bg-white text-charcoal shadow-sm" : "text-gray-400 hover:text-charcoal"
            )}
          >
            Site Overview
          </button>
          <button 
            onClick={() => setTab('transfers')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
              tab === 'transfers' ? "bg-white text-charcoal shadow-sm" : "text-gray-400 hover:text-charcoal"
            )}
          >
            Inter-site Transfers
          </button>
        </div>
      </div>

      {tab === 'inventory' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {warehouses.map(wh => (
              <div key={wh.id} className="glass-card p-6 border-slate-100 group hover:border-primary/20 transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-all">
                      <WarehouseIcon size={24} />
                    </div>
                    <div>
                      <h3 className="font-black text-charcoal uppercase tracking-tight">{wh.name}</h3>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        <MapPin size={10} /> {wh.location}
                      </div>
                    </div>
                  </div>
                  {wh.isMain && (
                     <span className="px-2 py-1 bg-primary/10 text-primary text-[8px] font-black uppercase rounded">Primary Hub</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock Vol</p>
                    <p className="text-lg font-black text-charcoal">4.2k <span className="text-[10px] text-gray-400 font-bold italic">Units</span></p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Capacity</p>
                    <p className="text-lg font-black text-charcoal">85%</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-gray-400 uppercase tracking-widest">Pick-Pack-Ship</span>
                    <span className="text-charcoal">12 Pending</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[75%] rounded-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-card p-6 border-slate-100">
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-black text-charcoal uppercase tracking-tighter">Rack & Bin Occupancy</h3>
               <div className="flex gap-2">
                 <div className="flex items-center gap-1 text-[8px] font-bold text-gray-400 uppercase">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Used
                 </div>
                 <div className="flex items-center gap-1 text-[8px] font-bold text-gray-400 uppercase">
                    <div className="w-2 h-2 rounded-full bg-slate-200"></div> Free
                 </div>
               </div>
             </div>
             <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-3">
                {Array.from({length: 48}).map((_, i) => (
                   <div 
                    key={i} 
                    className={cn(
                      "aspect-square rounded-lg flex items-center justify-center text-[8px] font-black border transition-all cursor-pointer",
                      i % 3 === 0 ? "bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100" : "bg-slate-50 border-slate-100 text-slate-300 hover:border-primary/20"
                    )}
                   >
                     R-{Math.floor(i/12) + 1}B-{i%12 + 1}
                   </div>
                ))}
             </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-charcoal uppercase tracking-tighter">Transfer Logs</h3>
            <button 
              onClick={() => setIsTransferModalOpen(true)}
              className="btn-primary py-2 px-4 gap-2 text-[10px] uppercase tracking-widest"
            >
              <MoveHorizontal size={16} /> New Transfer
            </button>
          </div>

          <div className="glass-card overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Movement</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Items</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transfers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic font-medium">No transfer records found.</td>
                  </tr>
                ) : (
                  transfers.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-primary">{t.transferNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-bold text-charcoal">{warehouses.find(w => w.id === t.fromWarehouseId)?.name}</span>
                           <ArrowRight size={14} className="text-gray-300" />
                           <span className="text-xs font-bold text-charcoal">{warehouses.find(w => w.id === t.toWarehouseId)?.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-500">{t.items.length} Product Types</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn(
                          "px-2 py-1 rounded text-[8px] font-black uppercase inline-flex items-center gap-1",
                          t.status === 'Received' ? "bg-emerald-50 text-emerald-600" : (t.status === 'Sent' ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-400")
                        )}>
                          {t.status === 'Received' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                          {t.status}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {t.status === 'Sent' && (
                          <button 
                            onClick={() => handleUpdateStatus(t.id, 'Received')}
                            className="bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-widest py-1 px-3 rounded-lg hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                          >
                            Mark Received
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
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-charcoal mb-6 uppercase tracking-tight">Schedule Stock Transfer</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Origin Source</label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-primary/30 text-xs font-bold"
                    value={newTransfer.fromWarehouseId}
                    onChange={e => setNewTransfer({...newTransfer, fromWarehouseId: e.target.value})}
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Destination</label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-primary/30 text-xs font-bold"
                    value={newTransfer.toWarehouseId}
                    onChange={e => setNewTransfer({...newTransfer, toWarehouseId: e.target.value})}
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Items to Move</label>
                 <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                    {/* Simplified item selection for demo */}
                    <div className="flex gap-2">
                       <select className="flex-1 p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold">
                         <option>Select Product SKU...</option>
                         {products.map(p => <option key={p.id}>{p.sku} - {p.name}</option>)}
                       </select>
                       <input type="number" placeholder="Qty" className="w-20 p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold" />
                       <button 
                        onClick={() => setNewTransfer({...newTransfer, items: [...(newTransfer.items || []), { productId: '1', productName: 'Tshirt', sku: 'TSH-001', variant: 'M/Red', quantity: 10 }]})}
                        className="p-2 bg-primary text-white rounded-lg"
                       >
                         <Plus size={16} />
                       </button>
                    </div>
                    {newTransfer.items?.map((item, idx) => (
                       <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg text-xs font-bold">
                          <span>{item.sku} ({item.variant})</span>
                          <span className="text-primary">{item.quantity} units</span>
                       </div>
                    ))}
                 </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button 
                onClick={() => setIsTransferModalOpen(false)}
                className="btn-secondary py-3 uppercase tracking-widest text-[10px]"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateTransfer}
                className="btn-primary py-3 uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
              >
                Dispatch Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseManagement;
