import React, { useState, useEffect } from 'react';
import { storage } from '../db';
import { Customer, Product, Invoice, OrderItem, SalesPerson } from '../types';
import { Search, Plus, Trash2, Save, Printer, User, QrCode, MessageSquare, CheckCircle, FileText, X } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { printInvoice, shareInvoiceWhatsApp } from '../lib/exports';
import { Html5Qrcode } from 'html5-qrcode';

const Billing: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedSalesPerson, setSelectedSalesPerson] = useState<SalesPerson | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [settings, setSettings] = useState(storage.getSettings());
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'UPI' | 'Credit'>('Cash');
  const [successInvoice, setSuccessInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    setCustomers(storage.getCustomers());
    setProducts(storage.getProducts());
    setSalesPersons(storage.getSalesPersons().filter(p => p.active));
    setSettings(storage.getSettings());
    setInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
  }, []);

  const handleScan = (decodedText: string) => {
    try {
      const data = JSON.parse(decodedText);
      if (data.type === 'product' && data.sku) {
        setProductSearch(data.sku);
        setIsScanning(false);
        if (scanner) {
          scanner.stop().catch(console.error);
        }
      }
    } catch (e) {
      // Not a JSON QR, try as plain text SKU
      setProductSearch(decodedText);
      setIsScanning(false);
      if (scanner) {
        scanner.stop().catch(console.error);
      }
    }
  };

  const startScanner = async () => {
    setIsScanning(true);
    setTimeout(async () => {
      const html5QrCode = new Html5Qrcode("reader");
      setScanner(html5QrCode);
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          handleScan,
          () => {}
        );
      } catch (err) {
        console.error("Camera access error:", err);
        setIsScanning(false);
      }
    }, 100);
  };

  const stopScanner = async () => {
    if (scanner) {
      await scanner.stop();
      setScanner(null);
    }
    setIsScanning(false);
  };

  const addToCart = (product: Product, size: string, color: string, qty: number) => {
    const wholesalePrice = product.wholesalePrice;
    const gstRate = product.gstRate;
    
    let price = wholesalePrice;
    let gstAmount = 0;
    let total = 0;

    if (settings.taxPreference === 'inclusive') {
      total = wholesalePrice * qty;
      gstAmount = total - (total / (1 + gstRate / 100));
      price = (total - gstAmount) / qty;
    } else {
      price = wholesalePrice;
      const subtotal = price * qty;
      gstAmount = subtotal * (gstRate / 100);
      total = subtotal + gstAmount;
    }

    const newItem: OrderItem = {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      size,
      color,
      quantity: qty,
      price,
      gstAmount,
      total
    };

    setCart([...cart, newItem]);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const taxTotal = cart.reduce((acc, item) => acc + item.gstAmount, 0);
    return { subtotal, taxTotal, grandTotal: subtotal + taxTotal };
  };

  const handlePrintDraft = () => {
    if (!selectedCustomer || cart.length === 0) return;
    const { subtotal, taxTotal, grandTotal } = calculateTotals();
    const mockInvoice: Invoice = {
      id: 'draft',
      invoiceNumber: `DRAFT-${invoiceNumber}`,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.businessName,
      items: cart,
      subtotal,
      taxTotal,
      grandTotal,
      status: 'Unpaid',
      createdAt: Date.now()
    };
    printInvoice(mockInvoice, selectedCustomer, settings, selectedSalesPerson);
  };

  const saveInvoice = () => {
    if (!selectedCustomer || cart.length === 0) return;
    
    const { subtotal, taxTotal, grandTotal } = calculateTotals();
    const newInvoice: Invoice = {
      id: Date.now().toString(),
      invoiceNumber,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.businessName,
      items: cart,
      subtotal,
      taxTotal,
      grandTotal,
      status: paymentMethod === 'Credit' ? 'Unpaid' : 'Paid',
      paymentMethod,
      salesPersonId: selectedSalesPerson?.id,
      createdAt: Date.now()
    };

    const invoices = storage.getInvoices();
    storage.saveInvoices([...invoices, newInvoice]);
    
    // Automatically print on save
    printInvoice(newInvoice, selectedCustomer, settings, selectedSalesPerson);

    // Show success modal
    setSuccessInvoice(newInvoice);
    
    // Reset fields but keep success modal
    setCart([]);
    setSelectedCustomer(null);
    setInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
  };

  const totals = calculateTotals();

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredCustomers = customers.filter(c => 
    c.businessName.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const currentCustomerForShare = successInvoice ? storage.getCustomers().find(c => c.id === successInvoice.customerId) : null;

  return (
    <div className="flex flex-col xl:flex-row gap-8 items-start relative pb-20 lg:pb-0">
      {/* Hidden Capture Area for WhatsApp Share */}
      {successInvoice && currentCustomerForShare && (
        <div className="fixed -left-[2000px] top-0">
          <div id="invoice-capture" className="w-[500px] p-10 bg-white text-charcoal">
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
                   <p className="text-[10px] font-bold text-primary">{successInvoice.invoiceNumber}</p>
                   <p className="text-[10px] font-bold text-slate-400">{new Date(successInvoice.createdAt).toLocaleDateString()}</p>
                   <p className="text-[10px] font-bold text-slate-400">{new Date(successInvoice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
             </div>
             
             <div className="mb-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Billed To</p>
                <p className="text-sm font-bold uppercase">{currentCustomerForShare.businessName}</p>
                <p className="text-[10px] font-medium text-slate-500">{currentCustomerForShare.address}</p>
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
                   {successInvoice.items.map((item, i) => (
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
                   <span>{formatCurrency(successInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                   <span>Tax (GST)</span>
                   <span>{formatCurrency(successInvoice.taxTotal)}</span>
                </div>
                <div className="flex justify-between text-lg font-black text-primary pt-2">
                   <span className="uppercase tracking-tighter">Grand Total</span>
                   <span>{formatCurrency(successInvoice.grandTotal)}</span>
                </div>
             </div>

             <div className="mt-10 pt-6 border-t border-slate-100 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Powered by StitchFlow POS</p>
             </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successInvoice && currentCustomerForShare && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
             <div className="p-8 text-center border-b border-slate-50">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                   <CheckCircle size={40} strokeWidth={3} />
                </div>
                <h3 className="text-2xl font-black text-charcoal uppercase tracking-tighter">Invoice Dispatched</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">
                   {successInvoice.invoiceNumber} • {formatCurrency(successInvoice.grandTotal)}
                </p>
                <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest mt-1">
                   {new Date(successInvoice.createdAt).toLocaleString()}
                </p>
             </div>
             <div className="p-8 space-y-3">
                <button 
                   onClick={() => shareInvoiceWhatsApp('invoice-capture', successInvoice, currentCustomerForShare, settings)}
                   className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                >
                   <MessageSquare size={16} />
                   WhatsApp Bill Photo
                </button>
                <div className="grid grid-cols-2 gap-3">
                   <button 
                      onClick={() => printInvoice(successInvoice, currentCustomerForShare, settings)}
                      className="bg-slate-100 text-slate-600 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
                   >
                      <Printer size={16} />
                      Print
                   </button>
                   <button 
                      onClick={() => setSuccessInvoice(null)}
                      className="bg-charcoal text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-black transition-all"
                   >
                      <X size={16} />
                      Close
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
      {/* Selection Area */}
      <div className="flex-1 w-full space-y-6">
        {/* Customer Select */}
        <div className="glass-card p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center font-bold">C</div>
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Merchant Selection</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Merchant Entity</label>
              <div className="relative flex flex-col gap-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input 
                    type="text"
                    placeholder="Filter businesses..."
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-charcoal tracking-tight text-sm"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                </div>
                <select 
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-xl outline-none appearance-none font-bold text-charcoal tracking-tight text-sm"
                  onChange={(e) => setSelectedCustomer(customers.find(c => c.id === e.target.value) || null)}
                  value={selectedCustomer?.id || ''}
                >
                  <option value="">Select B2B Entity</option>
                  {filteredCustomers.map(c => (
                    <option key={c.id} value={c.id}>{c.businessName} — {c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sales Associate</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <select 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-xl outline-none appearance-none font-bold text-charcoal tracking-tight text-sm h-[115px]"
                  onChange={(e) => setSelectedSalesPerson(salesPersons.find(s => s.id === e.target.value) || null)}
                  value={selectedSalesPerson?.id || ''}
                >
                  <option value="">Select Executive...</option>
                  {salesPersons.map(sp => (
                    <option key={sp.id} value={sp.id}>{sp.name} ({sp.code})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {selectedCustomer && (
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <div>
                <p className="text-[9px] text-emerald-600/60 uppercase font-black tracking-widest mb-1">GSTIN</p>
                <p className="font-mono text-xs sm:text-sm font-bold text-emerald-800 tracking-wider truncate max-w-[150px] sm:max-w-none">{selectedCustomer.gstin}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-[9px] text-emerald-600/60 uppercase font-black tracking-widest mb-1">Status</p>
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-[10px] sm:text-xs uppercase tracking-tight">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Verified Merchant
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Product Matrix / Grid */}
        <div className="glass-card p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div className="flex-1">
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-4">Inventory Matrix Allocation</h3>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="text" 
                    placeholder="Filter items by name or SKU..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg outline-none text-xs font-bold text-charcoal"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>
                <button 
                  onClick={startScanner}
                  className="p-2.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all group"
                  title="Scan Product QR"
                >
                  <QrCode size={18} />
                </button>
              </div>
            </div>
            <span className="text-[10px] text-primary font-bold uppercase tracking-widest mt-auto">Pricing: Wholesale</span>
          </div>
          <div className="space-y-8">
            {filteredProducts.map(product => (
              <div key={product.id} className="border-b border-slate-50 last:border-0 pb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                  <div>
                    <p className="font-bold text-charcoal uppercase tracking-tight text-base">{product.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.sku} | <span className="text-primary/60">{product.brand}</span></p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-bold text-primary tracking-tight">{formatCurrency(product.wholesalePrice)}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">Qty Available: {product.totalStock}u</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(product.inventory).map(([size, colors]) => (
                    Object.entries(colors).map(([color, stock]) => (
                      <button
                        key={`${size}-${color}`}
                        onClick={() => addToCart(product, size, color, 1)}
                        className="group flex items-center gap-3 px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg hover:border-accent hover:bg-accent/5 transition-all"
                      >
                        <div className="w-6 h-6 bg-white rounded border border-slate-100 flex items-center justify-center font-bold text-[10px] text-charcoal">
                          {size}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal/70">{color}</span>
                        <span className="text-[10px] font-black opacity-30 group-hover:opacity-100 group-hover:text-accent transition-all">
                          {stock}
                        </span>
                      </button>
                    ))
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart / Invoice Summary */}
      <div className="w-full xl:w-96 sticky top-32">
        <div className="glass-card flex flex-col h-fit max-h-[calc(100vh-200px)] lg:max-h-[calc(100vh-160px)]">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-400 flex items-center justify-between">
              Current Dispatch Summary
              <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[9px]">{invoiceNumber}</span>
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[150px]">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-10 text-slate-300">
                <Plus className="mb-2 opacity-20" size={32} />
                <p className="text-[10px] uppercase tracking-widest font-bold">Select items to begin</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start gap-4 animate-in slide-in-from-right-2 duration-300">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-charcoal truncate max-w-[150px] uppercase tracking-tight">{item.productName}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Sz: {item.size} / {item.color} x {item.quantity}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-primary">{formatCurrency(item.total)}</p>
                    <button 
                      onClick={() => removeFromCart(idx)} 
                      className="text-red-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-8 bg-slate-50 rounded-b-xl space-y-4 border-t border-slate-100">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-gray-400">
                <span>Value</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-gray-400">
                <span>Tax (GST)</span>
                <span>{formatCurrency(totals.taxTotal)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-primary pt-3 border-t border-slate-200">
                <span className="uppercase tracking-tighter">Total Bill</span>
                <span>{formatCurrency(totals.grandTotal)}</span>
              </div>
            </div>

            <div className="pt-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Settlement Method</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['Cash', 'Card', 'UPI', 'Credit'] as const).map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={cn(
                      "py-2 rounded-lg text-[9px] font-bold uppercase transition-all border",
                      paymentMethod === method 
                        ? "bg-primary border-primary text-white shadow-md" 
                        : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                onClick={handlePrintDraft}
                className="btn-secondary py-3 flex-1"
                disabled={cart.length === 0 || !selectedCustomer}
              >
                <Printer size={14} />
                <span className="text-[9px]">Draft</span>
              </button>
              <button 
                className="btn-primary py-3 flex-1"
                onClick={saveInvoice}
                disabled={cart.length === 0 || !selectedCustomer}
              >
                <Save size={14} />
                <span className="text-[9px]">Issue</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {isScanning && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-charcoal uppercase tracking-widest">Inventory Scanner</h3>
              <button 
                onClick={stopScanner}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                Cancel
              </button>
            </div>
            <div className="p-8">
              <div id="reader" className="w-full bg-slate-100 rounded-2xl overflow-hidden aspect-square border-4 border-slate-50"></div>
              <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-6">
                Point camera at product QR code
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
