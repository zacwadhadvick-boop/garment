import React, { useState, useEffect } from 'react';
import { storage } from '../db';
import { Product, BusinessSettings, Vendor } from '../types';
import { Plus, Search, Filter, MoreHorizontal, Package, QrCode, FileDown, Printer, AlertTriangle, Upload, Shirt, CheckCircle2, Trash2, X } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { exportToExcel } from '../lib/exports';

const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings] = useState<BusinessSettings>(storage.getSettings());
  const [vendors] = useState<Vendor[]>(storage.getVendors());
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedForBulk, setSelectedForBulk] = useState<Set<string>>(new Set());
  const [stockModalProduct, setStockModalProduct] = useState<Product | null>(null);
  const [qrModalProduct, setQrModalProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    sku: '',
    brand: '',
    category: '',
    subCategory: '',
    vendorId: '',
    purchasePrice: 0,
    wholesalePrice: 0,
    mrp: 0,
    gstRate: 5,
    inventory: {},
    lowStockThreshold: undefined,
    imageUrl: undefined
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct({ ...newProduct, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const selectedCategory = settings.categories.find(c => c.name === newProduct.category);

  useEffect(() => {
    setProducts(storage.getProducts());
  }, []);

  const handleExport = () => {
    const data = products.map(p => ({
      'Product Name': p.name,
      'SKU': p.sku,
      'Brand': p.brand,
      'Category': p.category,
      'Wholesale Price': p.wholesalePrice,
      'MRP': p.mrp,
      'Total Stock': p.totalStock
    }));
    exportToExcel(data, `Inventory_Report_${new Date().toISOString().split('T')[0]}`);
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.sku) return;
    const p: Product = {
      ...newProduct as Product,
      id: Date.now().toString(),
      totalStock: 0,
      createdAt: Date.now(),
      category: newProduct.category || (settings.categories[0]?.name || 'General'),
      inventory: {} // Start empty
    };
    const updated = [...products, p];
    setProducts(updated);
    storage.saveProducts(updated);
    setIsModalOpen(false);
    setNewProduct({
      name: '', sku: '', brand: '', category: '', subCategory: '', vendorId: '',
      purchasePrice: 0, wholesalePrice: 0, mrp: 0, gstRate: 5,
      lowStockThreshold: undefined,
      imageUrl: undefined
    });
  };

  const handlePrintBulkQr = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const selectedProductsData = products.filter(p => selectedForBulk.has(p.id));
    
    let html = `
      <html>
        <head>
          <title>Bulk Product Labels</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap" rel="stylesheet">
          <style>
            @media print {
              @page { size: auto; margin: 0; }
              body { margin: 1cm; background: white; -webkit-print-color-adjust: exact; }
            }
            body { font-family: 'Inter', sans-serif; background: #f8fafc; padding: 20px; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
            .label { 
              background: white;
              border: 1px solid #e2e8f0; 
              padding: 12px; 
              display: flex; 
              flex-direction: column; 
              align-items: center;
              text-align: center;
              border-radius: 8px;
              page-break-inside: avoid;
              position: relative;
            }
            .name { font-weight: 800; font-size: 10px; text-transform: uppercase; margin-bottom: 2px; color: #1e293b; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .sku { font-size: 8px; color: #64748b; font-family: monospace; letter-spacing: 0.5px; }
            .matrix { font-size: 9px; font-weight: 900; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; margin: 5px 0; display: inline-block; color: #2563eb; }
            .qr-wrapper { margin: 8px 0; }
            .price { font-weight: 900; font-size: 12px; color: #0f172a; margin-top: 4px; }
            .vendor { font-size: 7px; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-top: 4px; border-top: 1px solid #f1f5f9; width: 100%; padding-top: 4px; }
          </style>
        </head>
        <body>
          <div class="grid">
    `;

    selectedProductsData.forEach(p => {
      const vendor = vendors.find(v => v.id === p.vendorId);
      
      // Look for variants. If no variants added yet, print 1 generic label
      const hasVariants = Object.keys(p.inventory).length > 0;

      if (!hasVariants) {
        const qrData = JSON.stringify({ id: p.id, sku: p.sku });
        html += `
          <div class="label">
            <div class="name">${p.name}</div>
            <div class="sku">${p.sku}</div>
            <div class="matrix">UNIT: GENERAL / BASIC</div>
            <div class="qr-wrapper">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}" width="80" height="80" />
            </div>
            <div class="price">₹${p.mrp.toFixed(2)}</div>
            ${vendor ? `<div class="vendor">VND: ${vendor.name}</div>` : ''}
          </div>
        `;
      } else {
        Object.entries(p.inventory).forEach(([size, colors]) => {
          Object.entries(colors).forEach(([color, qty]) => {
            // Only print if there's stock or we can just print 1 per variant
            const qrData = JSON.stringify({
              id: p.id,
              sku: p.sku,
              sz: size,
              cl: color,
              v: vendor?.name || 'N/A'
            });
            
            html += `
              <div class="label">
                <div class="name">${p.name}</div>
                <div class="sku">${p.sku}</div>
                <div class="matrix">SZ: ${size} | CL: ${color}</div>
                <div class="qr-wrapper">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}" width="80" height="80" />
                </div>
                <div class="price">₹${p.mrp.toFixed(2)}</div>
                ${vendor ? `<div class="vendor">VND: ${vendor.name}</div>` : ''}
              </div>
            `;
          });
        });
      }
    });

    html += `
          </div>
          <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 800); }</script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const printQrTag = (product: Product) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const vendor = vendors.find(v => v.id === product.vendorId);
    const qrData = JSON.stringify({ 
      id: product.id, 
      sku: product.sku,
      v: vendor?.name || 'N/A'
    });

    const html = `
      <html>
        <head>
          <title>Asset Tag - ${product.sku}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap" rel="stylesheet">
          <style>
            @media print {
              @page { size: 50mm 25mm; margin: 0; }
              body { margin: 0; background: white; -webkit-print-color-adjust: exact; }
            }
            body { 
              font-family: 'Inter', sans-serif; 
              margin: 0; 
              display: flex; 
              align-items: center; 
              justify-content: center;
              height: 25mm;
              width: 50mm;
              padding: 4mm;
              box-sizing: border-box;
            }
            .tag {
              display: flex;
              width: 100%;
              height: 100%;
              align-items: center;
              gap: 4mm;
              border: 1px solid #f1f5f9;
              border-radius: 8px;
              padding: 2mm;
            }
            .qr-container { width: 18mm; height: 18mm; flex-shrink: 0; }
            .info { flex: 1; display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
            .name { font-weight: 800; font-size: 8pt; text-transform: uppercase; margin-bottom: 1pt; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #0f172a; }
            .sku { font-size: 6pt; color: #64748b; font-family: monospace; letter-spacing: 0.5px; }
            .price { font-size: 11pt; font-weight: 900; margin-top: 3pt; color: #2563eb; }
            .v { font-size: 5pt; text-transform: uppercase; color: #94a3b8; font-weight: 700; border-top: 1px solid #f1f5f9; padding-top: 2pt; margin-top: 2pt; }
            img { width: 100%; height: 100%; display: block; }
          </style>
        </head>
        <body>
          <div class="tag">
            <div class="qr-container">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}" />
            </div>
            <div class="info">
              <div class="name">${product.name}</div>
              <div class="sku">${product.sku}</div>
              <div class="price">₹${product.mrp.toFixed(2)}</div>
              ${vendor ? `<div class="v">SUPP: ${vendor.name}</div>` : ''}
            </div>
          </div>
          <script>
            window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleUpdateStock = (productId: string, size: string, color: string, quantity: number) => {
    const updatedProducts = products.map(p => {
      if (p.id === productId) {
        const newInventory = { ...p.inventory };
        if (!newInventory[size]) newInventory[size] = {};
        newInventory[size][color] = quantity;
        
        // Recalculate total stock
        let total = 0;
        Object.values(newInventory).forEach(sizeObj => {
          Object.values(sizeObj).forEach(q => {
            total += (Number(q) || 0);
          });
        });
        
        return { ...p, inventory: newInventory, totalStock: total };
      }
      return p;
    });
    setProducts(updatedProducts);
    storage.saveProducts(updatedProducts);
    if (stockModalProduct?.id === productId) {
      setStockModalProduct(updatedProducts.find(p => p.id === productId) || null);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h2 className="text-2xl font-black text-charcoal uppercase tracking-tighter">Inventory Corpus</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">StitchFlow Real-time Management</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedForBulk.size > 0 && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handlePrintBulkQr}
              className="btn-primary bg-accent text-white py-2 gap-2 shadow-lg shadow-orange-500/20"
            >
              <QrCode size={16} />
              Print Selected ({selectedForBulk.size})
            </motion.button>
          )}
          <button 
            onClick={handleExport}
            className="btn-secondary flex-1 sm:flex-none py-2 gap-2"
          >
            <FileDown size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex-1 sm:flex-none py-2 gap-2"
          >
            <Plus size={16} />
            Add <span className="hidden sm:inline">Product</span>
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search SKU, Brand, Category or Product..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-bold"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-charcoal mb-6 uppercase tracking-tight">Onboard New Product</h3>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group">
                  {newProduct.imageUrl ? (
                    <img src={newProduct.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Upload size={20} className="text-gray-300" />
                      <span className="text-[8px] font-bold text-gray-400 mt-2 uppercase tracking-widest text-center">Optional<br/>Photo</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={handleImageUpload}
                    accept="image/*"
                  />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-charcoal uppercase tracking-widest">Product Imagery</h4>
                  <p className="text-[9px] text-gray-400 mt-1 leading-tight">Visual identifier for billing catalogs (SVG / PNG / JPG)</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Full Product Name</label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-primary/30 font-bold"
                    value={newProduct.name}
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Department</label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-primary/30 text-sm font-bold"
                    value={newProduct.category}
                    onChange={e => setNewProduct({...newProduct, category: e.target.value, subCategory: ''})}
                  >
                    <option value="">Select Category</option>
                    {settings.categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Classification</label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-primary/30 text-sm font-bold"
                    value={newProduct.subCategory}
                    disabled={!selectedCategory}
                    onChange={e => setNewProduct({...newProduct, subCategory: e.target.value})}
                  >
                    <option value="">Select Sub-Category</option>
                    {selectedCategory?.subCategories.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Supplier (Vendor)</label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-primary/30 text-sm font-bold"
                    value={newProduct.vendorId}
                    onChange={e => setNewProduct({...newProduct, vendorId: e.target.value})}
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Brand / Label</label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-primary/30 font-bold"
                    value={newProduct.brand}
                    onChange={e => setNewProduct({...newProduct, brand: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">SKU / Code</label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-primary/30 font-mono text-xs font-bold"
                    value={newProduct.sku}
                    onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Gst Rate (%)</label>
                  <input 
                    type="number" 
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-primary/30 font-bold"
                    value={newProduct.gstRate}
                    onChange={e => setNewProduct({...newProduct, gstRate: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Wholesale (₹)</label>
                  <input 
                    type="number" 
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-primary/30"
                    value={newProduct.wholesalePrice}
                    onChange={e => setNewProduct({...newProduct, wholesalePrice: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">MRP (₹)</label>
                  <input 
                    type="number" 
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-primary/30"
                    value={newProduct.mrp}
                    onChange={e => setNewProduct({...newProduct, mrp: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Custom Alert Threshold (Global: {settings.lowStockThreshold})</label>
                <input 
                  type="number" 
                  placeholder="Leave empty to use global"
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-primary/30"
                  value={newProduct.lowStockThreshold === undefined ? '' : newProduct.lowStockThreshold}
                  onChange={e => setNewProduct({...newProduct, lowStockThreshold: e.target.value ? Number(e.target.value) : undefined})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="btn-secondary py-3 uppercase tracking-widest text-[10px]"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddProduct}
                className="btn-primary py-3 uppercase tracking-widest text-[10px]"
              >
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Management Modal */}
      {stockModalProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-charcoal uppercase tracking-tight">Stock Management: {stockModalProduct.name}</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Update quantities for each size/color variant</p>
              </div>
              <button onClick={() => setStockModalProduct(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            <div className="overflow-x-auto max-h-[60vh] pr-2 custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-2 text-[10px] uppercase font-bold text-slate-400">Variant (Size / Color)</th>
                    {settings.colors.map(color => (
                      <th key={color.id} className="py-2 text-[10px] uppercase font-bold text-slate-400 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: color.hex }}></div>
                          {color.name}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {settings.sizes.map(sizeDef => (
                    <tr key={sizeDef.id}>
                      <td className="py-4">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">{sizeDef.name} ({sizeDef.code})</span>
                      </td>
                      {settings.colors.map(colorDef => (
                        <td key={colorDef.id} className="py-4 px-2">
                          <input 
                            type="number"
                            className="w-16 mx-auto p-2 bg-slate-50 border border-slate-100 rounded text-center text-xs font-bold focus:border-primary/30 outline-none block"
                            value={stockModalProduct.inventory[sizeDef.code]?.[colorDef.name] ?? 0}
                            onChange={(e) => handleUpdateStock(stockModalProduct.id, sizeDef.code, colorDef.name, parseInt(e.target.value) || 0)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-8 flex justify-end">
               <button 
                 onClick={() => setStockModalProduct(null)}
                 className="btn-primary py-3 px-10 uppercase tracking-widest text-[10px]"
               >
                 Done & Sync
               </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Details Modal */}
      {qrModalProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="flex justify-between items-center mb-6">
              <div className="w-10 h-10"></div>
              <h3 className="text-sm font-black text-charcoal uppercase tracking-widest border-b-2 border-primary/20 pb-1">Asset Tag</h3>
              <button 
                onClick={() => setQrModalProduct(null)}
                className="p-2 text-slate-400 hover:text-charcoal transition-colors hover:bg-slate-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-col items-center gap-4 mb-8">
               {qrModalProduct.imageUrl && (
                 <img src={qrModalProduct.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover border border-slate-100 bg-slate-50" />
               )}
               <div>
                  <h4 className="text-xl font-black text-charcoal uppercase tracking-tighter text-charcoal">{qrModalProduct.name}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                    SKU: <span className="text-primary">{qrModalProduct.sku}</span> | BRAND: <span className="text-charcoal">{qrModalProduct.brand}</span>
                  </p>
               </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-[2rem] flex justify-center mb-8 border border-slate-100 relative group">
              <QRCodeSVG 
                value={JSON.stringify({ 
                  id: qrModalProduct.id, 
                  sku: qrModalProduct.sku,
                  v: vendors.find(v => v.id === qrModalProduct.vendorId)?.name || 'N/A'
                })} 
                size={180}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">M.R.P PRICE</p>
                <p className="text-sm font-black text-charcoal">₹{qrModalProduct.mrp.toFixed(2)}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">VENDOR</p>
                <p className="text-[10px] font-bold text-charcoal truncate">
                  {vendors.find(v => v.id === qrModalProduct.vendorId)?.name || 'N/A'}
                </p>
              </div>
            </div>

            <button 
              onClick={() => printQrTag(qrModalProduct)}
              className="w-full mt-6 btn-primary py-4 uppercase tracking-widest text-[10px] gap-3 shadow-lg shadow-primary/20"
            >
              <Printer size={18} />
              Print Smart Tag
            </button>
          </div>
        </div>
      )}

      <div className="glass-card overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-white border-b border-slate-50">
                <th className="px-8 py-6 w-10">
                   <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-200 text-primary focus:ring-primary h-4 w-4"
                      checked={selectedForBulk.size === filteredProducts.length && filteredProducts.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedForBulk(new Set(filteredProducts.map(p => p.id)));
                        else setSelectedForBulk(new Set());
                      }}
                   />
                </th>
                <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-bold text-gray-400">Product Info</th>
                <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-bold text-gray-400">Pricing Analysis</th>
                <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-bold text-gray-400">Inventory Grid</th>
                <th className="px-8 py-6 text-[10px] uppercase tracking-widest font-bold text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredProducts.map((product) => (
                <tr key={product.id} className={cn(
                  "hover:bg-slate-50/50 transition-colors group",
                  selectedForBulk.has(product.id) && "bg-primary/5 shadow-inner"
                )}>
                  <td className="px-8 py-6">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-200 text-primary focus:ring-primary"
                      checked={selectedForBulk.has(product.id)}
                      onChange={(e) => {
                        const next = new Set(selectedForBulk);
                        if (e.target.checked) next.add(product.id);
                        else next.delete(product.id);
                        setSelectedForBulk(next);
                      }}
                    />
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      {product.imageUrl ? (
                         <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 shrink-0">
                           <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                         </div>
                      ) : (
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-all shrink-0">
                          <Shirt size={24} />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-charcoal uppercase tracking-tight">{product.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{product.sku} | <span className="text-primary/60">{product.brand}</span></p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-bold text-primary">{formatCurrency(product.wholesalePrice)}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">MRP: {formatCurrency(product.mrp)} • GST: {product.gstRate}%</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex gap-2">
                      {settings.sizes.map(sizeDef => {
                        const size = sizeDef.code;
                        const colors = product.inventory[size] || {};
                        const sizeInStock: number = Object.values(colors).reduce<number>((acc, val) => acc + (Number(val) || 0), 0);
                        const isLow = sizeInStock < (product.lowStockThreshold ?? settings.lowStockThreshold);
                        return (
                          <div key={size} className="flex flex-col items-center">
                            <span className="text-[9px] text-gray-400 font-bold mb-1">{size}</span>
                            <span className={cn(
                              "text-[10px] px-2 py-1 rounded font-bold min-w-[28px] text-center transition-all border",
                              sizeInStock > 0 ? (isLow ? "bg-orange-50 text-orange-600 border-orange-100" : "bg-emerald-50 text-emerald-600 border-emerald-100") : "bg-slate-50 text-slate-300 border-slate-100"
                            )}>
                              {sizeInStock}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {product.totalStock < (product.lowStockThreshold ?? settings.lowStockThreshold) && (
                      <div className="mt-2 flex items-center gap-1 text-[8px] font-black uppercase text-orange-500 tracking-tighter">
                        <AlertTriangle size={10} />
                        Replenishment Recommended
                      </div>
                    )}
                  </td>

                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setStockModalProduct(product)}
                        className="p-2 text-gray-300 hover:text-primary transition-colors"
                        title="Manage Stock"
                      >
                        <Package size={18} />
                      </button>
                      <button 
                        onClick={() => setQrModalProduct(product)}
                        className="p-2 text-gray-300 hover:text-primary transition-colors"
                        title="View QR Code"
                      >
                        <QrCode size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
