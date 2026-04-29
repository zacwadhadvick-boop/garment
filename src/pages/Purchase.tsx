import React, { useState, useMemo } from 'react';
import { storage } from '../db';
import { Product, PurchaseVoucher, PurchaseItem, Vendor, BusinessSettings, Transaction } from '../types';
import { 
  Plus, 
  Search, 
  Truck, 
  Trash2, 
  PlusCircle,
  FileText,
  Clock,
  CheckCircle,
  X,
  History,
  AlertCircle,
  TrendingDown,
  ArrowRightLeft,
  ChevronRight,
  ShieldCheck,
  Calculator,
  ArrowDownLeft,
  Building2,
  Phone,
  Mail,
  MoreVertical
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const Purchase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vouchers' | 'vendors' | 'analysis'>('vouchers');
  const [products] = useState<Product[]>(storage.getProducts());
  const [vendors, setVendors] = useState<Vendor[]>(storage.getVendors());
  const [purchases, setPurchases] = useState<PurchaseVoucher[]>(storage.getPurchases());
  const [settings] = useState<BusinessSettings>(storage.getSettings());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Voucher State
  const [currentVoucher, setCurrentVoucher] = useState<Partial<PurchaseVoucher>>({
    voucherNumber: `PUR-${Date.now().toString().slice(-6)}`,
    items: [],
    status: 'Pending',
    subtotal: 0,
    transportCost: 0,
    otherCharges: 0,
    taxTotal: 0,
    grandTotal: 0
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [itemPrice, setItemPrice] = useState(0);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [selectedVendorId, setSelectedVendorId] = useState('');

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => 
      p.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => b.createdAt - a.createdAt);
  }, [purchases, searchTerm]);

  const addItemToVoucher = () => {
    if (!selectedProduct || !selectedSize || !selectedColor || itemQuantity <= 0) return;

    const total = itemPrice * itemQuantity;
    const newItem: PurchaseItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      sku: selectedProduct.sku,
      size: selectedSize,
      color: selectedColor,
      quantity: itemQuantity,
      purchasePrice: itemPrice,
      total: total
    };

    const updatedItems = [...(currentVoucher.items || []), newItem];
    recalculateVoucher(updatedItems, currentVoucher.transportCost || 0, currentVoucher.otherCharges || 0);

    // Reset Fields
    setSelectedSize('');
    setSelectedColor('');
    setItemPrice(0);
    setItemQuantity(1);
  };

  const recalculateVoucher = (items: PurchaseItem[], transport: number, other: number) => {
    const subtotal = items.reduce((acc, item) => acc + item.total, 0);
    const taxTotal = subtotal * 0.12; // Standard 12% for estimate
    const grandTotal = subtotal + taxTotal + transport + other;

    // Calculate Landed Cost for each item
    const itemsWithLandedCost = items.map(item => {
      const shareOfCharges = subtotal > 0 ? (item.total / subtotal) : 0;
      const additionalCostPerUnit = (transport + other) * shareOfCharges / item.quantity;
      return {
        ...item,
        landedCost: item.purchasePrice + additionalCostPerUnit
      };
    });

    setCurrentVoucher({
      ...currentVoucher,
      items: itemsWithLandedCost,
      subtotal,
      transportCost: transport,
      otherCharges: other,
      taxTotal,
      grandTotal
    });
  };

  const handleSaveVoucher = () => {
    const vendor = vendors.find(v => v.id === selectedVendorId);
    if (!vendor || !currentVoucher.items?.length) return;

    const newVoucher: PurchaseVoucher = {
      ...currentVoucher as PurchaseVoucher,
      id: Date.now().toString(),
      vendorId: vendor.id,
      vendorName: vendor.name,
      createdAt: Date.now()
    };

    const updatedPurchases = [...purchases, newVoucher];
    storage.savePurchases(updatedPurchases);
    setPurchases(updatedPurchases);
    setIsModalOpen(false);
    
    // Reset
    setCurrentVoucher({
      voucherNumber: `PUR-${(Date.now() + 1).toString().slice(-6)}`,
      items: [],
      status: 'Pending',
      subtotal: 0,
      transportCost: 0,
      otherCharges: 0,
      taxTotal: 0,
      grandTotal: 0
    });
  };

  const receiveVoucher = (voucherId: string) => {
    const voucher = purchases.find(p => p.id === voucherId);
    if (!voucher || voucher.status === 'Received') return;

    // Update product inventory & prices
    const currentProducts = storage.getProducts();
    const updatedProducts = currentProducts.map(p => {
      const voucherItems = voucher.items.filter(item => item.productId === p.id);
      if (voucherItems.length === 0) return p;

      const newInventory = { ...p.inventory };
      voucherItems.forEach(item => {
        if (!newInventory[item.size]) newInventory[item.size] = {};
        const currentQty = newInventory[item.size][item.color] || 0;
        newInventory[item.size][item.color] = currentQty + item.quantity;
      });

      const newTotalStock = Object.values(newInventory).reduce(
        (acc, sizes) => acc + Object.values(sizes).reduce((s, q) => s + q, 0), 0
      );

      // Update purchase price to the latest landed cost
      const latestItem = voucherItems[voucherItems.length - 1];
      
      return {
        ...p,
        purchasePrice: latestItem.landedCost || latestItem.purchasePrice,
        inventory: newInventory,
        totalStock: newTotalStock
      };
    });

    storage.saveProducts(updatedProducts);

    const updatedPurchases = purchases.map(p => 
      p.id === voucherId ? { ...p, status: 'Received' as const } : p
    );
    storage.savePurchases(updatedPurchases);
    setPurchases(updatedPurchases);

    // Record Transaction
    const transactions = storage.getTransactions();
    const newTransaction: Transaction = {
      id: `TR-PUR-${Date.now()}`,
      type: 'Payment_Out',
      category: 'Purchase',
      amount: voucher.grandTotal,
      entityId: voucher.vendorId,
      entityName: voucher.vendorName,
      referenceType: 'Purchase',
      referenceId: voucher.id,
      paymentMethod: 'Bank', // Assume bank for purchase usually
      description: `Stock Intake Voucher ${voucher.voucherNumber}`,
      date: Date.now(),
      createdAt: Date.now()
    };
    storage.saveTransactions([...transactions, newTransaction]);
  };

  const handleReturnVoucher = (voucherId: string) => {
    const updatedPurchases = purchases.map(p => 
      p.id === voucherId ? { ...p, status: 'Returned' as const } : p
    );
    storage.savePurchases(updatedPurchases);
    setPurchases(updatedPurchases);
  };

  // --- Analysis Helpers ---
  const rateComparisonData = useMemo(() => {
    const rates: Record<string, { product: string, vendors: { vendor: string, price: number }[] }> = {};
    
    purchases.forEach(p => {
      p.items.forEach(item => {
        if (!rates[item.productId]) {
          rates[item.productId] = { product: item.productName, vendors: [] };
        }
        // Only keep most recent per vendor for brevity
        const existing = rates[item.productId].vendors.find(v => v.vendor === p.vendorName);
        if (!existing) {
          rates[item.productId].vendors.push({ vendor: p.vendorName, price: item.purchasePrice });
        }
      });
    });

    return Object.values(rates);
  }, [purchases]);

  const renderVouchersTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom duration-500">
      {filteredPurchases.map(purchase => (
        <motion.div 
          layout
          key={purchase.id}
          className={cn(
            "glass-card p-6 border-l-4 group hover:scale-[1.01] transition-all",
            purchase.status === 'Received' ? "border-l-emerald-500" : 
            purchase.status === 'Returned' ? "border-l-red-500" : "border-l-orange-400"
          )}
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-charcoal">{purchase.voucherNumber}</h3>
                {purchase.status === 'Returned' && <AlertCircle size={14} className="text-red-500" />}
              </div>
              <p className="text-sm font-black text-primary uppercase tracking-tighter mt-1">{purchase.vendorName}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={cn(
                  "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                  purchase.status === 'Received' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                  purchase.status === 'Returned' ? "bg-red-50 text-red-600 border-red-100" :
                  "bg-orange-50 text-orange-600 border-orange-100"
                )}>
                  {purchase.status}
                </span>
                <span className="text-[9px] font-bold text-slate-300 uppercase">{new Date(purchase.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
              purchase.status === 'Received' ? "bg-emerald-50 text-emerald-500" : 
              purchase.status === 'Returned' ? "bg-red-50 text-red-500" : "bg-orange-50 text-orange-500"
            )}>
              {purchase.status === 'Received' ? <ShieldCheck size={24} /> : 
               purchase.status === 'Returned' ? <ArrowRightLeft size={24} /> : <Clock size={24} />}
            </div>
          </div>

          <div className="space-y-2 mb-6 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
            {purchase.items.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-[10px] p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                <div className="font-bold text-charcoal">
                  {item.productName}
                  <span className="text-[8px] text-slate-400 block tracking-widest">{item.sku} | {item.size}/{item.color}</span>
                </div>
                <div className="text-right">
                  <p className="font-black text-primary">{item.quantity}u</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Landed: {formatCurrency(item.landedCost || item.purchasePrice)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4 pt-4 border-t border-slate-100">
             <div className="flex justify-between items-end">
               <div className="text-left">
                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Intake Valuation</p>
                 <p className="text-xl font-black text-charcoal">{formatCurrency(purchase.grandTotal)}</p>
               </div>
               <div className="flex gap-2">
                 {purchase.status === 'Pending' && (
                   <button 
                    onClick={() => receiveVoucher(purchase.id)}
                    className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all"
                    title="GRN - Recieve & Add to Stock"
                   >
                     <CheckCircle size={18} />
                   </button>
                 )}
                 {purchase.status === 'Received' && (
                    <button 
                      onClick={() => handleReturnVoucher(purchase.id)}
                      className="p-3 bg-white border border-red-100 text-red-400 rounded-xl hover:bg-red-50 transition-all"
                      title="Initiate Return"
                    >
                      <ArrowRightLeft size={18} />
                    </button>
                 )}
                 <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all">
                    <FileText size={18} />
                 </button>
               </div>
             </div>
             {purchase.transportCost ? (
               <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase">
                  <Truck size={10} />
                  Transport: {formatCurrency(purchase.transportCost)}
               </div>
             ) : null}
          </div>
        </motion.div>
      ))}

      {filteredPurchases.length === 0 && (
        <div className="col-span-full py-20 text-center glass-card border-dashed">
           <Truck size={48} className="mx-auto text-slate-200 mb-4" />
           <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Queue is Empty</p>
        </div>
      )}
    </div>
  );

  const renderVendorsTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom duration-500">
      {vendors.map(vendor => (
        <div key={vendor.id} className="glass-card p-8 group hover:bg-primary/5 transition-all">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-3xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl shadow-inner">
              {vendor.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-black text-charcoal uppercase tracking-tighter">{vendor.name}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{vendor.contactPerson}</p>
            </div>
          </div>
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
              <Phone size={14} className="text-slate-300" />
              {vendor.phone}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
              <Mail size={14} className="text-slate-300" />
              {vendor.email}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
               <Building2 size={14} className="text-slate-300" />
               <span className="truncate">{vendor.address}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">
              History
            </button>
            <button className="flex-1 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
              Create PO
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderAnalysisTab = () => (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
      <div className="glass-card p-8">
        <h3 className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-8 flex items-center gap-2">
          <Calculator size={14} className="text-primary" />
          Rate Comparison Index
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Article / SKU</th>
                <th className="text-left p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Suppliers</th>
                <th className="text-right p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Price Variation</th>
                <th className="text-right p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Best Rate</th>
              </tr>
            </thead>
            <tbody>
              {rateComparisonData.map((item, i) => {
                const minPrice = Math.min(...item.vendors.map(v => v.price));
                const maxPrice = Math.max(...item.vendors.map(v => v.price));
                const bestVendor = item.vendors.find(v => v.price === minPrice);
                return (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-all">
                    <td className="p-4">
                      <p className="text-xs font-black text-charcoal uppercase">{item.product}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {item.vendors.map((v, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-100 rounded text-[8px] font-bold text-slate-500 uppercase">
                            {v.vendor}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <p className="text-[10px] font-black text-charcoal">
                        {formatCurrency(minPrice)} - {formatCurrency(maxPrice)}
                      </p>
                    </td>
                    <td className="p-4 text-right">
                      <p className="text-xs font-black text-emerald-600 uppercase">
                        {formatCurrency(minPrice)}
                        <span className="text-[8px] block text-slate-300">by {bestVendor?.vendor}</span>
                      </p>
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-charcoal uppercase tracking-tighter">Procurement Matrix</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Vendor Network & Intake Logistics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 shadow-inner">
            {(['vouchers', 'vendors', 'analysis'] as const).map(tab => (
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
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-3 bg-primary text-white py-3.5 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus size={18} />
            Initialize Intake
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder={activeTab === 'vendors' ? "Search Registered Suppliers..." : "Search Vouchers / Manifests..."}
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm font-bold shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {activeTab === 'vouchers' && renderVouchersTab()}
      {activeTab === 'vendors' && renderVendorsTab()}
      {activeTab === 'analysis' && renderAnalysisTab()}

      {/* Intake Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-black text-charcoal uppercase tracking-tighter">Initialize Inventory Intake</h3>
                  <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">Reference Voucher: {currentVoucher.voucherNumber}</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-3 text-slate-400 hover:text-charcoal transition-colors hover:bg-slate-100 rounded-2xl"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Addition Pane */}
                <div className="space-y-6">
                  <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">Select Prime Vendor</label>
                    <select 
                      className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 text-sm font-bold shadow-sm appearance-none cursor-pointer"
                      value={selectedVendorId}
                      onChange={(e) => setSelectedVendorId(e.target.value)}
                    >
                      <option value="">Authorized Supplier Network...</option>
                      {vendors.map(v => (
                        <option key={v.id} value={v.id}>{v.name} ({v.contactPerson})</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Item Configuration</h4>
                    
                    <select 
                      className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none text-sm font-bold shadow-sm"
                      value={selectedProduct?.id || ''}
                      onChange={(e) => {
                        const p = products.find(prod => prod.id === e.target.value);
                        setSelectedProduct(p || null);
                        setSelectedSize('');
                        setSelectedColor('');
                      }}
                    >
                      <option value="">SKU Catalog Selection...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                      ))}
                    </select>

                    {selectedProduct && (
                      <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
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
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Unit Base Price</label>
                        <input 
                          type="number" 
                          className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none text-sm font-bold shadow-sm"
                          value={itemPrice || ''}
                          placeholder="0.00"
                          onChange={(e) => setItemPrice(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Intake Volume (Pcs)</label>
                        <input 
                          type="number" 
                          className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none text-sm font-bold shadow-sm"
                          value={itemQuantity || ''}
                          placeholder="1"
                          onChange={(e) => setItemQuantity(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <button 
                      disabled={!selectedProduct || !selectedSize || !selectedColor || !selectedVendorId}
                      onClick={addItemToVoucher}
                      className="w-full bg-primary text-white py-5 rounded-2xl shadow-xl shadow-primary/20 disabled:opacity-50 font-black text-[10px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <PlusCircle size={18} />
                      Append to Manifest
                    </button>
                  </div>
                </div>

                {/* Voucher Preview */}
                <div className="bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col overflow-hidden shadow-inner">
                   <div className="p-8 border-b border-slate-200 bg-white/50 backdrop-blur-sm flex justify-between items-center">
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Inward Manifest Preview</h4>
                        <p className="text-xl font-black text-charcoal">{currentVoucher.voucherNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest px-2 py-1 bg-emerald-50 rounded-lg inline-block">Estimated Verification</p>
                      </div>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                      {currentVoucher.items?.map((item, idx) => (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          key={idx} 
                          className="flex justify-between items-center p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
                        >
                          <div className="absolute left-0 top-0 w-1 h-full bg-primary/20" />
                          <div className="flex-1">
                             <p className="text-xs font-black text-charcoal uppercase tracking-tighter">{item.productName}</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                               {item.size} / {item.color} | SKU: {item.sku}
                             </p>
                          </div>
                          <div className="flex items-center gap-6">
                             <div className="text-right">
                               <p className="text-xs font-black text-charcoal">{item.quantity} units</p>
                               <p className="text-[9px] font-black text-primary uppercase">Landed: {formatCurrency(item.landedCost || item.purchasePrice)}</p>
                             </div>
                             <button 
                              onClick={() => {
                                const updated = (currentVoucher.items || []).filter((_, i) => i !== idx);
                                recalculateVoucher(updated, currentVoucher.transportCost || 0, currentVoucher.otherCharges || 0);
                              }}
                              className="p-3 text-slate-300 hover:text-red-500 transition-colors hover:bg-red-50 rounded-2xl"
                             >
                                <Trash2 size={18} />
                             </button>
                          </div>
                        </motion.div>
                      ))}
                      {(!currentVoucher.items || currentVoucher.items.length === 0) && (
                        <div className="h-full flex flex-col items-center justify-center opacity-30 py-24">
                           <Truck size={48} className="mb-4 text-slate-300" />
                           <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Manifest Data...</p>
                        </div>
                      )}
                   </div>

                   <div className="p-8 bg-white border-t border-slate-200">
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="group">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Transport & Freight</label>
                           <input 
                            type="number"
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="0.00"
                            value={currentVoucher.transportCost || ''}
                            onChange={(e) => recalculateVoucher(currentVoucher.items || [], Number(e.target.value) || 0, currentVoucher.otherCharges || 0)}
                           />
                        </div>
                        <div className="group">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Misc. Charges</label>
                           <input 
                            type="number"
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="0.00"
                            value={currentVoucher.otherCharges || ''}
                            onChange={(e) => recalculateVoucher(currentVoucher.items || [], currentVoucher.transportCost || 0, Number(e.target.value) || 0)}
                           />
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-end mb-8 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Intake Val.</p>
                            <p className="text-3xl font-black text-primary tracking-tighter">{formatCurrency(currentVoucher.grandTotal || 0)}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Base</p>
                            <p className="text-xs font-bold text-charcoal">{formatCurrency(currentVoucher.subtotal || 0)}</p>
                         </div>
                      </div>

                      <button 
                        onClick={handleSaveVoucher}
                        disabled={!currentVoucher.items?.length || !selectedVendorId}
                        className="w-full bg-primary text-white py-6 rounded-[1.5rem] shadow-2xl shadow-primary/30 disabled:opacity-50 font-black text-[10px] uppercase tracking-[0.3em] hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                      >
                         Generate GRN Manifest
                         <ArrowDownLeft size={20} />
                      </button>
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

export default Purchase;
