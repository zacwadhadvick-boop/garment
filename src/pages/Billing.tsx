import React, { useState, useEffect, useMemo } from 'react';
import { storage } from '../db';
import { Customer, Product, Invoice, OrderItem, SalesPerson, Transaction } from '../types';
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
  const [pricingTier, setPricingTier] = useState<'mrp' | 'wholesale' | 'seasonal' | 'special'>('wholesale');
  const [activeScheme, setActiveScheme] = useState<'none' | 'buy10get1' | 'flat5'>('none');
  const [matrixProduct, setMatrixProduct] = useState<Product | null>(null);
  const [matrixEntries, setMatrixEntries] = useState<Record<string, Record<string, number>>>({});
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);

  const stopScanner = () => {
    if (scanner) {
      scanner.stop();
      setIsScanning(false);
    }
  };

  const startScanner = (inputId: string) => {
    setIsScanning(true);
    const html5QrCode = new Html5Qrcode("reader");
    setScanner(html5QrCode);
    
    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        // Find product with SKU
        const product = products.find(p => p.sku === decodedText);
        if (product) {
          openMatrix(product);
          stopScanner();
        }
      },
      () => {}
    );
  };

  const isInterState = useMemo(() => {
    if (!selectedCustomer || !settings.address) return false;
    // Simple logic: if state exists in address and doesn't match
    const bizState = settings.address.split(',').pop()?.trim().toLowerCase();
    const custState = selectedCustomer.address.split(',').pop()?.trim().toLowerCase();
    return bizState !== custState && !!bizState && !!custState;
  }, [selectedCustomer, settings]);

  useEffect(() => {
    setCustomers(storage.getCustomers());
    setProducts(storage.getProducts());
    setSalesPersons(storage.getSalesPersons().filter(p => p.active));
    setSettings(storage.getSettings());
    setInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
  }, []);

  const openMatrix = (product: Product) => {
    setMatrixProduct(product);
    const initial: Record<string, Record<string, number>> = {};
    Object.keys(product.inventory).forEach(size => {
      initial[size] = {};
      Object.keys(product.inventory[size]).forEach(color => {
        initial[size][color] = 0;
      });
    });
    setMatrixEntries(initial);
  };

  const handleMatrixChange = (size: string, color: string, qty: number) => {
    setMatrixEntries(prev => ({
      ...prev,
      [size]: { ...prev[size], [color]: qty }
    }));
  };

  const addMatrixToCart = () => {
    if (!matrixProduct) return;
    
    const newItems: OrderItem[] = [];
    Object.entries(matrixEntries).forEach(([size, colors]) => {
      Object.entries(colors).forEach(([color, qty]) => {
        if (qty > 0) {
          const item = createCartItem(matrixProduct, size, color, qty);
          newItems.push(item);
        }
      });
    });

    setCart([...cart, ...newItems]);
    setMatrixProduct(null);
  };

  const createCartItem = (product: Product, size: string, color: string, qty: number): OrderItem => {
    let basePrice = product.wholesalePrice;
    
    if (pricingTier === 'mrp') basePrice = product.mrp;
    else if (pricingTier === 'seasonal') basePrice = product.wholesalePrice * 0.95; // 5% Seasonal Discount
    else if (pricingTier === 'special') basePrice = product.wholesalePrice * 0.9; // 10% special
    
    const gstRate = product.gstRate || 12;
    let price = basePrice;

    // Apply Schemes
    if (activeScheme === 'buy10get1' && qty >= 11) {
      const billableQty = qty - Math.floor(qty / 11);
      price = (basePrice * billableQty) / qty;
    } else if (activeScheme === 'flat5') {
      price = basePrice * 0.95;
    }

    let gstAmount = 0;
    let total = 0;

    if (settings.taxPreference === 'inclusive') {
      total = price * qty;
      gstAmount = total - (total / (1 + gstRate / 100));
      price = (total - gstAmount) / qty;
    } else {
      const subtotal = price * qty;
      gstAmount = subtotal * (gstRate / 100);
      total = subtotal + gstAmount;
    }

    const cgst = isInterState ? 0 : gstAmount / 2;
    const sgst = isInterState ? 0 : gstAmount / 2;
    const igst = isInterState ? gstAmount : 0;

    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      size,
      color,
      quantity: qty,
      price,
      gstAmount,
      cgst,
      sgst,
      igst,
      total
    };
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const cgstTotal = cart.reduce((acc, item) => acc + (item.cgst || 0), 0);
    const sgstTotal = cart.reduce((acc, item) => acc + (item.sgst || 0), 0);
    const igstTotal = cart.reduce((acc, item) => acc + (item.igst || 0), 0);
    const taxTotal = cgstTotal + sgstTotal + igstTotal;
    const grandTotal = subtotal + taxTotal - invoiceDiscount;
    
    return { subtotal, cgstTotal, sgstTotal, igstTotal, taxTotal, grandTotal };
  };

  const handlePrintDraft = () => {
    if (cart.length === 0) return;
    
    const { subtotal, cgstTotal, sgstTotal, igstTotal, taxTotal, grandTotal } = calculateTotals();
    const draftInvoice: Invoice = {
      id: Date.now().toString(),
      invoiceNumber: `DRAFT-${invoiceNumber}`,
      customerId: selectedCustomer?.id || 'walk-in',
      customerName: selectedCustomer?.businessName || 'QUICK DRAFT / WALK-IN',
      items: cart,
      subtotal,
      taxTotal,
      cgstTotal,
      sgstTotal,
      igstTotal,
      discountTotal: invoiceDiscount,
      grandTotal,
      status: 'Draft',
      salesPersonId: selectedSalesPerson?.id,
      createdAt: Date.now(),
      isInterState
    };

    // Save to storage as a draft
    const invoices = storage.getInvoices();
    storage.saveInvoices([...invoices, draftInvoice]);

    const dummyCustomer: Customer = selectedCustomer || {
      id: 'walk-in',
      name: 'Walk-in',
      businessName: 'QUICK DRAFT / WALK-IN',
      gstin: 'N/A',
      phone: '',
      email: '',
      address: '---',
      creditLimit: 0,
      outstandingBalance: 0,
      tier: 'Retail'
    };

    printInvoice(draftInvoice, dummyCustomer, settings, selectedSalesPerson);
    
    setSuccessInvoice(draftInvoice);
    setCart([]);
    setSelectedCustomer(null);
    setInvoiceNumber(`INV-${(Date.now() + 1).toString().slice(-6)}`);
    setInvoiceDiscount(0);
  };

  const saveInvoice = () => {
    if (!selectedCustomer || cart.length === 0) return;
    
    const { subtotal, cgstTotal, sgstTotal, igstTotal, taxTotal, grandTotal } = calculateTotals();
    const newInvoice: Invoice = {
      id: Date.now().toString(),
      invoiceNumber,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.businessName,
      items: cart,
      subtotal,
      taxTotal,
      cgstTotal,
      sgstTotal,
      igstTotal,
      discountTotal: invoiceDiscount,
      grandTotal,
      status: paymentMethod === 'Credit' ? 'Unpaid' : 'Paid',
      paymentMethod,
      salesPersonId: selectedSalesPerson?.id,
      createdAt: Date.now(),
      isInterState
    };

    const invoices = storage.getInvoices();
    storage.saveInvoices([...invoices, newInvoice]);

    // Update Customer Balance if credit
    if (paymentMethod === 'Credit') {
      const customers = storage.getCustomers();
      const updatedCustomers = customers.map(c => 
        c.id === selectedCustomer.id 
          ? { ...c, outstandingBalance: c.outstandingBalance + grandTotal }
          : c
      );
      storage.saveCustomers(updatedCustomers);
    }

    // Record Transaction
    const transactions = storage.getTransactions();
    const newTransaction: Transaction = {
      id: `TR-${Date.now()}`,
      type: paymentMethod === 'Credit' ? 'Income' : 'Payment_In', // Income for credit (as revenue), Payment_In for others
      category: 'Sales',
      amount: grandTotal,
      entityId: selectedCustomer.id,
      entityName: selectedCustomer.businessName,
      referenceType: 'Invoice',
      referenceId: newInvoice.id,
      referenceNumber: newInvoice.invoiceNumber,
      paymentMethod: paymentMethod === 'Credit' ? 'Card' : paymentMethod, // Placeholder for credit
      description: `Sales Invoice ${newInvoice.invoiceNumber}`,
      date: Date.now(),
      createdAt: Date.now()
    };
    storage.saveTransactions([...transactions, newTransaction]);
    
    // Automatically print on save
    printInvoice(newInvoice, selectedCustomer, settings, selectedSalesPerson);

    // Show success modal
    setSuccessInvoice(newInvoice);
    
    // Reset fields
    setCart([]);
    setSelectedCustomer(null);
    setInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
    setInvoiceDiscount(0);
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
                {successInvoice.igstTotal > 0 ? (
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span>IGST</span>
                    <span>{formatCurrency(successInvoice.igstTotal)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      <span>CGST</span>
                      <span>{formatCurrency(successInvoice.cgstTotal || 0)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      <span>SGST</span>
                      <span>{formatCurrency(successInvoice.sgstTotal || 0)}</span>
                    </div>
                  </>
                )}
                {successInvoice.discountTotal > 0 && (
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-red-500">
                    <span>Discount</span>
                    <span>-{formatCurrency(successInvoice.discountTotal)}</span>
                  </div>
                )}
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
      {/* Matrix Allocation Modal */}
      {matrixProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-charcoal uppercase tracking-tighter">Bulk Matrix Entry</h3>
                <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">{matrixProduct.name} — {matrixProduct.sku}</p>
              </div>
              <button 
                onClick={() => setMatrixProduct(null)}
                className="p-3 text-slate-400 hover:text-charcoal transition-colors hover:bg-slate-100 rounded-2xl"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-x-auto p-8">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Color \ Size</th>
                    {Object.keys(matrixProduct.inventory).map(size => (
                      <th key={size} className="p-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">{size}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from(new Set(Object.values(matrixProduct.inventory).flatMap(colors => Object.keys(colors)))).map(color => (
                    <tr key={color} className="group hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-xs font-black text-charcoal border-b border-slate-50 uppercase tracking-tight">{color}</td>
                      {Object.keys(matrixProduct.inventory).map(size => {
                        const hasStock = matrixProduct.inventory[size]?.[color] !== undefined;
                        return (
                          <td key={size} className="p-2 border-b border-slate-50 text-center">
                            {hasStock ? (
                              <div className="space-y-1">
                                <input 
                                  type="number" 
                                  min="0"
                                  className="w-16 p-2 bg-white border border-slate-200 rounded-lg text-center text-xs font-black outline-none focus:ring-2 focus:ring-primary/20"
                                  placeholder="0"
                                  value={matrixEntries[size]?.[color] || ''}
                                  onChange={(e) => handleMatrixChange(size, color, parseInt(e.target.value) || 0)}
                                />
                                <p className="text-[8px] font-bold text-slate-300">Avl: {matrixProduct.inventory[size][color]}</p>
                              </div>
                            ) : (
                              <div className="w-16 h-8 bg-slate-100/50 rounded-lg mx-auto" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-8 border-t border-slate-100 flex justify-end gap-4 bg-slate-50/50">
              <button 
                onClick={() => setMatrixProduct(null)}
                className="btn-secondary py-3 px-6"
              >
                Cancel
              </button>
              <button 
                onClick={addMatrixToCart}
                className="btn-primary py-3 px-8 shadow-xl shadow-primary/20"
              >
                Append to Batch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selection Area */}
      <div className="flex-1 w-full space-y-6">
        {/* Customer Select */}
        <div className="glass-card p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center font-bold">C</div>
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Merchant Selection</h3>
            </div>
            {isInterState && (
              <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[9px] font-black uppercase border border-orange-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                Inter-state IGST Applied
              </span>
            )}
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
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-charcoal tracking-tight text-sm shadow-sm"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                </div>
                <select 
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-xl outline-none appearance-none font-bold text-charcoal tracking-tight text-sm shadow-sm"
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
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-xl outline-none appearance-none font-bold text-charcoal tracking-tight text-sm h-[115px] shadow-sm"
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
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
              <div>
                <p className="text-[9px] text-emerald-600/60 uppercase font-black tracking-widest mb-1">State & GSTIN</p>
                <div className="flex items-center gap-3">
                  <p className="font-mono text-sm font-bold text-emerald-800 tracking-wider">{selectedCustomer.gstin}</p>
                  <span className="w-1 h-1 rounded-full bg-emerald-300" />
                  <p className="text-[10px] font-black text-emerald-600 uppercase italic whitespace-nowrap">{selectedCustomer.address.split(',').pop()?.trim()}</p>
                </div>
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
          <div className="flex flex-col sm:flex-row items-start lg:items-center justify-between mb-8 gap-6 pb-6 border-b border-slate-100">
            <div className="flex-1 w-full lg:w-auto">
              <h3 className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-4">Inventory Matrix Allocation</h3>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search Article or SKU..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none text-xs font-bold text-charcoal shadow-inner"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>
                <button 
                  onClick={startScanner}
                  className="p-3 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all group shadow-sm"
                  title="Scan Product"
                >
                  <QrCode size={20} />
                </button>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 w-full lg:w-auto">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Pricing & Schemes</label>
              <div className="flex flex-wrap lg:flex-nowrap gap-2">
                <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
                  {(['wholesale', 'mrp', 'seasonal', 'special'] as const).map(tier => (
                    <button
                      key={tier}
                      onClick={() => setPricingTier(tier)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all",
                        pricingTier === tier 
                          ? "bg-white text-primary shadow-sm scale-[1.05]" 
                          : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
                <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
                  {(['none', 'buy10get1', 'flat5'] as const).map(scheme => (
                    <button
                      key={scheme}
                      onClick={() => setActiveScheme(scheme)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all",
                        activeScheme === scheme 
                          ? "bg-primary text-white shadow-sm" 
                          : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      {scheme === 'none' ? 'No Scheme' : scheme === 'buy10get1' ? '10+1 Free' : 'Flat 5%'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {filteredProducts.map(product => (
              <div key={product.id} className="p-4 bg-white border border-slate-100 rounded-2xl hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all group">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-black text-charcoal uppercase tracking-tighter text-base group-hover:text-primary transition-colors">{product.name}</p>
                      <span className="text-[10px] bg-slate-50 text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">{product.category}</span>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">SKU: {product.sku} | <span className="text-primary/60">{product.brand}</span></p>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-lg font-black text-primary tracking-tighter">
                        {formatCurrency(pricingTier === 'mrp' ? product.mrp : pricingTier === 'special' ? (product.wholesalePrice * 0.9) : product.wholesalePrice)}
                      </p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Stock: {product.totalStock} PCS</p>
                    </div>
                    <button 
                      onClick={() => openMatrix(product)}
                      className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                      title="Bulk Allocation"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
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

          <div className="p-6 bg-slate-50/80 space-y-4 border-t border-slate-100 backdrop-blur-sm">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] uppercase tracking-widest font-black text-slate-400">
                <span>Value</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              
              {isInterState ? (
                <div className="flex justify-between text-[10px] uppercase tracking-widest font-black text-slate-400 italic">
                  <span>IGST Total</span>
                  <span>{formatCurrency(totals.igstTotal)}</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between text-[10px] uppercase tracking-widest font-black text-slate-400">
                    <span>CGST</span>
                    <span>{formatCurrency(totals.cgstTotal)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] uppercase tracking-widest font-black text-slate-400">
                    <span>SGST</span>
                    <span>{formatCurrency(totals.sgstTotal)}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 py-2 border-y border-slate-100/50">
                <label className="text-[9px] font-black uppercase tracking-widest text-orange-400">Disc</label>
                <input 
                  type="number" 
                  className="flex-1 bg-transparent text-right text-xs font-black outline-none text-orange-600"
                  placeholder="0.00"
                  value={invoiceDiscount || ''}
                  onChange={(e) => setInvoiceDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="flex justify-between text-xl font-black text-primary pt-3">
                <span className="uppercase tracking-tighter">Total Bill</span>
                <span className="drop-shadow-sm">{formatCurrency(totals.grandTotal)}</span>
              </div>
            </div>

            <div className="pt-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Settlement Strategy</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['Cash', 'Card', 'UPI', 'Credit'] as const).map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={cn(
                      "py-2 rounded-xl text-[9px] font-black uppercase transition-all border shadow-sm",
                      paymentMethod === method 
                        ? "bg-primary border-primary text-white scale-[1.02]" 
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
                className="bg-white border border-slate-200 text-slate-400 py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
                disabled={cart.length === 0}
              >
                <Printer size={14} />
                Challan
              </button>
              <button 
                className="bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95Disabled:opacity-50"
                onClick={saveInvoice}
                disabled={cart.length === 0 || !selectedCustomer}
              >
                <Save size={14} />
                Issue Bill
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
