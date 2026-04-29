import React, { useState, useEffect } from 'react';
import { storage } from '../db';
import { Invoice } from '../types';
import { Search, Printer, Eye, Download, CheckCircle, Clock, FileDown, RotateCcw, AlertTriangle, MessageSquare } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { exportToExcel, generateInvoicePDF, printInvoice, shareInvoiceWhatsApp } from '../lib/exports';

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [salesPersons, setSalesPersons] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [settings, setSettings] = useState(storage.getSettings());
  const [returnModalTarget, setReturnModalTarget] = useState<Invoice | null>(null);
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [returnReason, setReturnReason] = useState('');
  const [shareTarget, setShareTarget] = useState<Invoice | null>(null);

  useEffect(() => {
    setInvoices(storage.getInvoices());
    setCustomers(storage.getCustomers());
    setSalesPersons(storage.getSalesPersons());
    setSettings(storage.getSettings());
  }, []);

  const handleWhatsAppShare = (inv: Invoice) => {
    const customer = customers.find(c => c.id === inv.customerId);
    if (!customer) return;
    
    // Set share target to render the capture area
    setShareTarget(inv);
    
    // Wait for render then share
    setTimeout(() => {
      shareInvoiceWhatsApp('invoice-capture-history', inv, customer, settings);
      setShareTarget(null);
    }, 100);
  };

  const handleReturnAction = () => {
    if (!returnModalTarget) return;

    const returnItems = returnModalTarget.items.map((item, idx) => ({
      productId: item.productId,
      productName: item.productName,
      variant: `${item.size} / ${item.color}`,
      sku: item.sku,
      quantity: returnQuantities[idx] || 0,
      price: item.price,
      refundAmount: (item.price + (item.gstAmount / item.quantity)) * (returnQuantities[idx] || 0)
    })).filter(i => i.quantity > 0);

    if (returnItems.length === 0) return;

    const totalRefund = returnItems.reduce((sum, item) => sum + item.refundAmount, 0);

    // 1. Save Return Record
    const returnRec: any = {
      id: Date.now().toString(),
      invoiceId: returnModalTarget.id,
      invoiceNumber: returnModalTarget.invoiceNumber,
      customerId: returnModalTarget.customerId,
      items: returnItems,
      totalRefund,
      reason: returnReason,
      createdAt: Date.now()
    };
    storage.saveReturns([...storage.getReturns(), returnRec]);

    // 2. Update Inventory
    const products = storage.getProducts();
    returnItems.forEach(ret => {
      const pIdx = products.findIndex(p => p.id === ret.productId);
      if (pIdx !== -1) {
        const [size, color] = ret.variant.split(' / ');
        if (products[pIdx].inventory[size] && products[pIdx].inventory[size][color] !== undefined) {
          products[pIdx].inventory[size][color] += ret.quantity;
          products[pIdx].totalStock += ret.quantity;
        }
      }
    });
    storage.saveProducts(products);

    // 3. Update Customer Outstanding if Credit (optional logic)
    // For now we just mark invoice as having a return or potentially adjust status
    const updatedInvoices = invoices.map(inv => 
      inv.id === returnModalTarget.id ? { ...inv, status: 'Returned' as const } : inv
    );
    storage.saveInvoices(updatedInvoices);
    setInvoices(updatedInvoices);

    setReturnModalTarget(null);
    setReturnQuantities({});
    setReturnReason('');
    alert(`Return processed! Refund amount: ${formatCurrency(totalRefund)}`);
  };

  const handleExportExcel = () => {
    const data = invoices.map(inv => ({
      'Invoice #': inv.invoiceNumber,
      'Date': new Date(inv.createdAt).toLocaleDateString(),
      'Customer': inv.customerName,
      'Units': inv.items.length,
      'Amount': inv.grandTotal,
      'Status': inv.status
    }));
    exportToExcel(data, `Invoices_Export_${new Date().toISOString().split('T')[0]}`);
  };

  const handlePrint = (inv: Invoice) => {
    const customer = customers.find(c => c.id === inv.customerId);
    const salesPerson = salesPersons.find(s => s.id === inv.salesPersonId);
    if (customer) printInvoice(inv, customer, settings, salesPerson);
  };

  const handleDownloadPDF = (inv: Invoice) => {
    const customer = customers.find(c => c.id === inv.customerId);
    const salesPerson = salesPersons.find(s => s.id === inv.salesPersonId);
    if (customer) generateInvoicePDF(inv, customer, settings, salesPerson);
  };

  const filtered = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Hidden Capture Area for WhatsApp Share */}
      {shareTarget && (
        <div className="fixed -left-[2000px] top-0">
          <div id="invoice-capture-history" className="w-[500px] p-10 bg-white text-charcoal">
             <div className="border-b-2 border-slate-100 pb-6 mb-6 flex justify-between items-start">
                <div className="flex items-start gap-4">
                   {settings.logoUrl && (
                     <img src={settings.logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
                   )}
                   <div>
                      <h1 className="text-xl font-black uppercase tracking-tighter text-primary">{settings.name}</h1>
                      <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest max-w-[200px]">{settings.address}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">GSTIN: {settings.gstin}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">PH: {settings.phone}</p>
                   </div>
                </div>
                <div className="text-right">
                   <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 border-b border-primary/20 pb-1 mb-2 inline-block">Tax Invoice</h2>
                   <p className="text-[10px] font-bold text-primary">{shareTarget.invoiceNumber}</p>
                   <p className="text-[10px] font-bold text-slate-400">{new Date(shareTarget.createdAt).toLocaleDateString()}</p>
                   <p className="text-[10px] font-bold text-slate-400">{new Date(shareTarget.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
             </div>
             
             <div className="mb-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Billed To</p>
                <p className="text-sm font-bold uppercase">{shareTarget.customerName}</p>
                <p className="text-[10px] font-medium text-slate-500">{customers.find(c => c.id === shareTarget.customerId)?.address || 'N/A'}</p>
             </div>

             <table className="w-full text-left mb-8">
                <thead>
                   <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="py-2">Description</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-right">Amount</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {shareTarget.items.map((item, i) => (
                      <tr key={i} className="text-xs">
                         <td className="py-3">
                            <p className="font-bold uppercase tracking-tight">{item.productName}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Sz: {item.size} / {item.color}</p>
                         </td>
                         <td className="py-3 text-center font-bold">{item.quantity}</td>
                         <td className="py-3 text-right font-bold text-primary">{formatCurrency(item.total)}</td>
                      </tr>
                   ))}
                </tbody>
             </table>

             <div className="border-t-2 border-slate-100 pt-6 space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                   <span>Subtotal</span>
                   <span>{formatCurrency(shareTarget.subtotal)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                   <span>Tax (GST)</span>
                   <span>{formatCurrency(shareTarget.taxTotal)}</span>
                </div>
                <div className="flex justify-between text-lg font-black text-primary pt-2">
                   <span className="uppercase tracking-tighter">Grand Total</span>
                   <span>{formatCurrency(shareTarget.grandTotal)}</span>
                </div>
             </div>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search Invoice #, Business, or Item Name..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportExcel}
            className="btn-secondary flex-1 sm:flex-none"
          >
            <FileDown size={18} />
            Export Excel
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-loose">Invoice & Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-loose">Customer</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-loose">Items</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-loose">Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-loose">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right leading-loose">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">No invoices found in database</td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-slate-800 text-sm tracking-tight">{inv.invoiceNumber}</p>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 border",
                          inv.status === 'Paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                          inv.status === 'Returned' ? "bg-red-50 text-red-600 border-red-100" :
                          "bg-orange-50 text-orange-600 border-orange-100"
                        )}>
                          {inv.status === 'Paid' ? <CheckCircle size={10} /> : 
                           inv.status === 'Returned' ? <RotateCcw size={10} /> : 
                           <Clock size={10} />}
                          {inv.status}
                        </span>
                        {inv.paymentMethod && (
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">
                            {inv.paymentMethod}
                          </span>
                        )}
                        {inv.salesPersonId && (
                          <span className="text-[9px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-1.5 py-0.5 rounded">
                            {salesPersons.find(s => s.id === inv.salesPersonId)?.code || 'N/A'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-charcoal uppercase tracking-tight">
                      {inv.customerName}
                    </td>
                    <td className="px-6 py-4 text-[10px] text-slate-500 font-bold">
                      {inv.items.length} units ordered
                    </td>
                    <td className="px-6 py-4 font-bold text-primary text-sm">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="px-6 py-4 text-[10px] text-slate-400 font-bold uppercase">
                      {new Date(inv.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleWhatsAppShare(inv)}
                          className="p-2 text-slate-300 hover:text-[#25D366] transition-colors"
                          title="WhatsApp Bill Photo"
                        >
                          <MessageSquare size={16} />
                        </button>
                        <button 
                          onClick={() => handleDownloadPDF(inv)}
                          className="p-2 text-slate-300 hover:text-primary transition-colors"
                          title="View PDF"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handlePrint(inv)}
                          className="p-2 text-slate-300 hover:text-primary transition-colors"
                          title="Print Invoice"
                        >
                          <Printer size={16} />
                        </button>
                        <button 
                          onClick={() => setReturnModalTarget(inv)}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                          title="Return Items"
                          disabled={inv.status === 'Returned'}
                        >
                          <RotateCcw size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Items Modal */}
      {returnModalTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-charcoal uppercase tracking-tight">Return Merchandise Authorization</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Invoice: {returnModalTarget.invoiceNumber}</p>
              </div>
              <button onClick={() => setReturnModalTarget(null)} className="text-gray-400 hover:text-charcoal">&times;</button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl mb-6 flex items-start gap-3">
                <AlertTriangle className="text-orange-600 shrink-0" size={18} />
                <p className="text-[11px] text-orange-800 font-medium leading-relaxed">
                  Initiating a return will restock inventory and generate a credit memo. Please verify physical item condition before processing.
                </p>
              </div>

              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest font-black text-gray-400">
                    <th className="pb-4">Product Details</th>
                    <th className="pb-4 text-center">Purchased</th>
                    <th className="pb-4 text-right">Return Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {returnModalTarget.items.map((item, idx) => (
                    <tr key={idx} className="py-4 block md:table-row">
                      <td className="py-4">
                        <p className="text-xs font-bold text-charcoal uppercase">{item.productName}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{item.size} / {item.color}</p>
                      </td>
                      <td className="py-4 text-center text-xs font-bold text-slate-500">
                        {item.quantity}
                      </td>
                      <td className="py-4 text-right">
                        <input 
                          type="number" 
                          min="0"
                          max={item.quantity}
                          className="w-16 p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs text-center font-bold"
                          value={returnQuantities[idx] || 0}
                          onChange={(e) => setReturnQuantities({ ...returnQuantities, [idx]: Math.min(item.quantity, Math.max(0, parseInt(e.target.value) || 0)) })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-8">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Reason for Return</label>
                <textarea 
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-primary/30 h-20 text-xs font-medium"
                  placeholder="e.g. Size mismatch, Manufacturing defect..."
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                ></textarea>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex items-center justify-between">
              <div className="text-left">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Estimated Refund</p>
                <p className="text-xl font-black text-primary">
                  {formatCurrency(returnModalTarget.items.reduce((sum, item, idx) => {
                    const qty = returnQuantities[idx] || 0;
                    const unitPriceWithTax = (item.total / item.quantity);
                    return sum + (unitPriceWithTax * qty);
                  }, 0))}
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setReturnModalTarget(null)}
                  className="btn-secondary py-3 px-6 uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleReturnAction}
                  className="btn-primary py-3 px-8 uppercase tracking-widest text-[10px] bg-red-600 hover:bg-red-700 border-red-600"
                >
                  Process Return
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
