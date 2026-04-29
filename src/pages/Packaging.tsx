import React, { useState, useMemo } from 'react';
import { storage } from '../db';
import { Product, Carton, BoxItem, BusinessSettings } from '../types';
import { 
  Plus, 
  Search, 
  Box, 
  Printer, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Archive,
  QrCode,
  X,
  History
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const Packaging: React.FC = () => {
  const [products] = useState<Product[]>(storage.getProducts());
  const [cartons, setCartons] = useState<Carton[]>(storage.getCartons());
  const [settings] = useState<BusinessSettings>(storage.getSettings());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCarton, setCurrentCarton] = useState<Partial<Carton>>({
    cartonNumber: `CRT-${Date.now().toString().slice(-6)}`,
    items: [],
    status: 'Draft',
    totalQuantity: 0
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const filteredCartons = useMemo(() => {
    return cartons.filter(c => 
      c.cartonNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.items.some(i => i.productName.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => b.createdAt - a.createdAt);
  }, [cartons, searchTerm]);

  const activeCartons = filteredCartons.filter(c => c.status === 'Draft');
  const finalizedCartons = filteredCartons.filter(c => c.status !== 'Draft');

  const addItemToCarton = () => {
    if (!selectedProduct || !selectedSize || !selectedColor || quantity <= 0) return;

    const newItem: BoxItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      sku: selectedProduct.sku,
      size: selectedSize,
      color: selectedColor,
      quantity: quantity
    };

    const updatedItems = [...(currentCarton.items || []), newItem];
    const totalQty = updatedItems.reduce((acc, item) => acc + item.quantity, 0);

    setCurrentCarton({
      ...currentCarton,
      items: updatedItems,
      totalQuantity: totalQty
    });

    // Reset selection
    setSelectedSize('');
    setSelectedColor('');
    setQuantity(1);
  };

  const removeItemFromCarton = (index: number) => {
    const updatedItems = (currentCarton.items || []).filter((_, i) => i !== index);
    const totalQty = updatedItems.reduce((acc, item) => acc + item.quantity, 0);
    setCurrentCarton({
      ...currentCarton,
      items: updatedItems,
      totalQuantity: totalQty
    });
  };

  const handleCreateCarton = () => {
    if (!currentCarton.items || currentCarton.items.length === 0) return;

    const newCarton: Carton = {
      ...currentCarton as Carton,
      id: Date.now().toString(),
      createdAt: Date.now()
    };

    const updatedCartons = [...cartons, newCarton];
    storage.saveCartons(updatedCartons);
    setCartons(updatedCartons);
    
    // If they clicked "Fix & Print", automatically print the label
    if (currentCarton.status === 'Finalized') {
      printCartonLabel(newCarton);
    }
    
    setIsModalOpen(false);
    
    // Reset for next
    setCurrentCarton({
      cartonNumber: `CRT-${(Date.now() + 1).toString().slice(-6)}`,
      items: [],
      status: 'Draft',
      totalQuantity: 0
    });
  };

  const finalizeCarton = (cartonId: string) => {
    const updated = cartons.map(c => 
      c.id === cartonId ? { ...c, status: 'Finalized' as const } : c
    );
    storage.saveCartons(updated);
    setCartons(updated);
  };

  const printCartonLabel = (carton: Carton) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const qrData = JSON.stringify({
      id: carton.id,
      no: carton.cartonNumber,
      qty: carton.totalQuantity,
      items: carton.items.map(i => `${i.sku}-${i.size}-${i.color}(${i.quantity})`).join('|')
    });

    const html = `
      <html>
        <head>
          <title>Carton Label - ${carton.cartonNumber}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap" rel="stylesheet">
          <style>
            @media print {
              @page { size: 100mm 150mm; margin: 0; }
              body { margin: 0; background: white; -webkit-print-color-adjust: exact; }
            }
            body { font-family: 'Inter', sans-serif; padding: 10mm; display: flex; flex-direction: column; height: 130mm; box-sizing: border-box; }
            .header { border-bottom: 3pt solid black; padding-bottom: 5mm; margin-bottom: 5mm; text-align: center; }
            .company { font-weight: 900; font-size: 14pt; text-transform: uppercase; letter-spacing: 1pt; }
            .label-type { font-weight: 700; font-size: 10pt; color: #666; text-transform: uppercase; margin-top: 2mm; }
            
            .carton-info { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5mm; }
            .carton-no { font-weight: 900; font-size: 24pt; border: 2pt solid black; padding: 2mm 5mm; }
            
            .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; margin-bottom: 8mm; }
            .stat-box { border: 1pt solid #ccc; padding: 3mm; border-radius: 4mm; }
            .stat-label { font-size: 8pt; font-weight: 700; color: #888; text-transform: uppercase; margin-bottom: 1mm; }
            .stat-value { font-size: 14pt; font-weight: 900; }

            .items-table { flex: 1; border: 1pt solid black; border-collapse: collapse; margin-bottom: 8mm; width: 100%; }
            .items-table th { background: #f0f0f0; border: 0.5pt solid black; padding: 2mm; font-size: 8pt; text-align: left; }
            .items-table td { border: 0.5pt solid black; padding: 2mm; font-size: 8pt; font-weight: 700; }
            
            .footer { display: flex; gap: 5mm; align-items: center; border-top: 2pt solid black; padding-top: 5mm; }
            .qr-code { width: 30mm; height: 30mm; flex-shrink: 0; }
            .qr-code img { width: 100%; height: 100%; }
            .meta { flex: 1; font-size: 7pt; line-height: 1.4; color: #444; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company">${settings.name}</div>
            <div class="label-type">Logistics Master Carton Label</div>
          </div>
          
          <div class="carton-info">
            <div>
              <div class="stat-label">Carton Identification</div>
              <div class="carton-no">${carton.cartonNumber}</div>
            </div>
            <div style="text-align: right">
              <div class="stat-label">Creation Date</div>
              <div style="font-weight: 800; font-size: 10pt">${new Date(carton.createdAt).toLocaleDateString()}</div>
              <div style="font-weight: 800; font-size: 10pt">${new Date(carton.createdAt).toLocaleTimeString()}</div>
            </div>
          </div>

          <div class="stats">
            <div class="stat-box">
              <div class="stat-label">Total Units</div>
              <div class="stat-value">${carton.totalQuantity} PCS</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Gross Weight</div>
              <div class="stat-value">${carton.weight || '---'} KG</div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th width="50%">Product / SKU</th>
                <th width="20%">Size/Col</th>
                <th width="30%">Qty (Pcs)</th>
              </tr>
            </thead>
            <tbody>
              ${carton.items.map(item => `
                <tr>
                  <td>${item.productName.substring(0, 20)}<br/><span style="font-size: 6pt; color: #666">${item.sku}</span></td>
                  <td>${item.size}/${item.color}</td>
                  <td style="font-size: 10pt">${item.quantity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <div class="qr-code">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}" />
            </div>
            <div class="meta">
              <strong>MASTER SCAN READY</strong><br/>
              Finalized by Enterprise Operations<br/>
              Packaged at: ${settings.address.substring(0, 50)}...<br/>
              Scan QR for localized inventory breakdown.
            </div>
          </div>

          <script>
            window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 800); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-charcoal uppercase tracking-tighter">Packaging Console</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Smart Carton Management & Logistics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
            <button 
              onClick={() => setActiveTab('active')}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'active' ? "bg-white text-primary shadow-sm" : "text-slate-400"
              )}
            >
              Active Drafts
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'history' ? "bg-white text-primary shadow-sm" : "text-slate-400"
              )}
            >
              Master Archive
            </button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary py-3 px-6 shadow-xl shadow-primary/20"
          >
            <Plus size={18} />
            Initialize Carton
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search Carton ID or Contents..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm font-bold shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'active' ? (
          activeCartons.map(carton => (
            <motion.div 
              layout
              key={carton.id}
              className="glass-card p-6 border-l-4 border-l-orange-400"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black text-charcoal">{carton.cartonNumber}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Status: <span className="text-orange-500">{carton.status}</span></p>
                </div>
                <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center">
                  <Archive size={24} />
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {carton.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg">
                    <div className="font-bold text-charcoal truncate flex-1">
                      {item.productName}
                      <span className="text-[9px] text-gray-400 block tracking-widest">{item.sku} | {item.size} / {item.color}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-black text-primary border border-slate-100 ml-2">
                      {item.quantity}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-3">
                 <div className="text-left">
                   <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Total units</p>
                   <p className="text-lg font-black text-charcoal">{carton.totalQuantity}</p>
                 </div>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => finalizeCarton(carton.id)}
                      className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                      title="Finalize Carton"
                    >
                      <CheckCircle2 size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        const updated = cartons.filter(c => c.id !== carton.id);
                        storage.saveCartons(updated);
                        setCartons(updated);
                      }}
                      className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                    >
                      <Trash2 size={18} />
                    </button>
                 </div>
              </div>
            </motion.div>
          ))
        ) : (
          finalizedCartons.map(carton => (
            <motion.div 
              layout
              key={carton.id}
              className="glass-card p-6 border-l-4 border-l-primary"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black text-charcoal">{carton.cartonNumber}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Status: <span className="text-primary">{carton.status}</span></p>
                </div>
                <div className="w-12 h-12 bg-blue-50 text-primary rounded-xl flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl mb-6">
                 <div className="flex items-center gap-3 mb-2">
                    <Archive size={14} className="text-slate-400" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Load Manifest</p>
                 </div>
                 <div className="text-xs font-bold text-charcoal">
                    {carton.items.length} Distinct SKUs | {carton.totalQuantity} Total Units
                 </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Finalized on {new Date(carton.createdAt).toLocaleDateString()}
                </p>
                <button 
                  onClick={() => printCartonLabel(carton)}
                  className="btn-primary py-2 px-4 text-[10px] gap-2 shadow-lg shadow-primary/20"
                >
                  <QrCode size={14} />
                  Print Label
                </button>
              </div>
            </motion.div>
          ))
        )}

        {((activeTab === 'active' && activeCartons.length === 0) || (activeTab === 'history' && finalizedCartons.length === 0)) && (
          <div className="col-span-full py-20 text-center glass-card border-dashed">
             <Archive size={48} className="mx-auto text-slate-200 mb-4" />
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No cartons found in this category</p>
          </div>
        )}
      </div>

      {/* Initialize Carton Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-black text-charcoal uppercase tracking-tighter">Initialize Master Carton</h3>
                  <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">Carton Identity: {currentCarton.cartonNumber}</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-3 text-slate-400 hover:text-charcoal transition-colors hover:bg-slate-100 rounded-2xl"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Side: Addition */}
                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Load Product into Box</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Select Product</label>
                        <select 
                          className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 text-sm font-bold shadow-sm"
                          value={selectedProduct?.id || ''}
                          onChange={(e) => {
                            const p = products.find(prod => prod.id === e.target.value);
                            setSelectedProduct(p || null);
                            setSelectedSize('');
                            setSelectedColor('');
                          }}
                        >
                          <option value="">Select SKU...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                          ))}
                        </select>
                      </div>

                      {selectedProduct && (
                        <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                           <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Select Size</label>
                            <select 
                              className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none text-sm font-bold shadow-sm"
                              value={selectedSize}
                              onChange={(e) => setSelectedSize(e.target.value)}
                            >
                              <option value="">Size...</option>
                              {Object.keys(selectedProduct.inventory).map(size => (
                                <option key={size} value={size}>{size}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Select Color</label>
                            <select 
                              className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none text-sm font-bold shadow-sm"
                              value={selectedColor}
                              onChange={(e) => setSelectedColor(e.target.value)}
                            >
                              <option value="">Color...</option>
                              {selectedSize && Object.keys(selectedProduct.inventory[selectedSize] || {}).map(color => (
                                <option key={color} value={color}>{color}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Quantity (Pcs)</label>
                          <input 
                            type="number" 
                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none text-sm font-bold shadow-sm"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Gross Weight (kg)</label>
                          <input 
                            type="text" 
                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none text-sm font-bold shadow-sm"
                            placeholder="e.g. 12.5"
                            value={currentCarton.weight || ''}
                            onChange={(e) => setCurrentCarton({...currentCarton, weight: e.target.value})}
                          />
                        </div>
                        <div className="flex items-end col-span-2">
                           <button 
                            onClick={addItemToCarton}
                            disabled={!selectedProduct || !selectedSize || !selectedColor}
                            className="w-full btn-primary py-4 rounded-2xl disabled:opacity-50 gap-2 shadow-lg"
                           >
                              <Plus size={18} />
                              Append
                           </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10">
                    <div className="flex items-start gap-4">
                       <div className="p-3 bg-white rounded-2xl text-primary shadow-sm">
                          <Archive size={24} />
                       </div>
                       <div>
                          <h4 className="text-sm font-black text-primary uppercase tracking-tighter">Packaging Logic</h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed mt-1">
                            Finalizing a carton generates a logistics master label. Contents are immutable once finalized for shipment integrity.
                          </p>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Manifest */}
                <div className="flex flex-col h-full space-y-4">
                   <div className="flex-1 bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden flex flex-col p-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Load Manifest</h4>
                      <div className="flex-1 overflow-y-auto space-y-3">
                         {currentCarton.items?.map((item, idx) => (
                           <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={idx} 
                            className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center group"
                           >
                             <div className="flex-1">
                               <p className="text-xs font-black text-charcoal">{item.productName}</p>
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                 {item.size} / {item.color} | SKU: {item.sku}
                               </p>
                             </div>
                             <div className="flex items-center gap-4">
                                <span className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center font-black text-primary border border-slate-100">
                                  {item.quantity}
                                </span>
                                <button 
                                  onClick={() => removeItemFromCarton(idx)}
                                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                             </div>
                           </motion.div>
                         ))}
                         {(!currentCarton.items || currentCarton.items.length === 0) && (
                           <div className="h-full flex flex-col items-center justify-center opacity-30">
                              <Archive size={40} className="mb-2" />
                              <p className="text-[10px] font-black uppercase tracking-widest">Ready for load</p>
                           </div>
                         )}
                      </div>
                      
                      <div className="mt-6 pt-6 border-t border-slate-200 flex justify-between items-end">
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Box Aggregate</p>
                            <p className="text-2xl font-black text-charcoal uppercase tracking-tighter">{currentCarton.totalQuantity} PCS</p>
                         </div>
                         <div className="flex gap-3">
                           <button 
                            onClick={handleCreateCarton}
                            disabled={!currentCarton.items || currentCarton.items.length === 0}
                            className="btn-primary py-4 px-6 rounded-2xl bg-slate-800 border-slate-800 disabled:opacity-50"
                           >
                              Save Draft
                           </button>
                           <button 
                            onClick={() => {
                              setCurrentCarton({...currentCarton, status: 'Finalized'});
                              // Wait for state to catch up for the print logic in handleCreateCarton
                              setTimeout(handleCreateCarton, 0);
                            }}
                            disabled={!currentCarton.items || currentCarton.items.length === 0}
                            className="btn-primary py-4 px-8 rounded-2xl shadow-2xl shadow-primary/30 disabled:opacity-50 gap-2"
                           >
                              <QrCode size={18} />
                              Fix & Print Label
                           </button>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Packaging;
