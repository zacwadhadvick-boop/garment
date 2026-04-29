import React, { useState, useEffect } from 'react';
import { storage } from '../db';
import { BusinessSettings, TaxSetting, SalesPerson, Staff, Vendor } from '../types';
import { Save, Plus, Trash2, Building, Receipt, ShieldCheck, Upload, Globe, Users, Shield, Truck } from 'lucide-react';
import { cn } from '../lib/utils';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<BusinessSettings>(storage.getSettings());
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>(storage.getSalesPersons());
  const [staff, setStaff] = useState<Staff[]>(storage.getStaff());
  const [vendors, setVendors] = useState<Vendor[]>(storage.getVendors());
  const [activeTab, setActiveTab] = useState<'profile' | 'tax' | 'sales' | 'inventory' | 'staff' | 'vendors'>('profile');
  const [activeInventorySubTab, setActiveInventorySubTab] = useState<'sizes' | 'colors' | 'categories'>('sizes');

  const handleSave = () => {
    storage.saveSettings(settings);
    storage.saveSalesPersons(salesPersons);
    storage.saveStaff(staff);
    storage.saveVendors(vendors);
    alert('Settings updated successfully!');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const addTaxType = () => {
    const newTax: TaxSetting = {
      id: Date.now().toString(),
      name: 'New Tax',
      rate: 0,
      isDefault: false
    };
    setSettings({
      ...settings,
      taxTypes: [...settings.taxTypes, newTax]
    });
  };

  const updateTax = (id: string, updates: Partial<TaxSetting>) => {
    setSettings({
      ...settings,
      taxTypes: settings.taxTypes.map(t => t.id === id ? { ...t, ...updates } : t)
    });
  };

  const deleteTax = (id: string) => {
    setSettings({
      ...settings,
      taxTypes: settings.taxTypes.filter(t => t.id !== id)
    });
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-2xl font-bold text-charcoal uppercase tracking-tight">System Configuration</h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Manage infrastructure and tax compliance</p>
        </div>
        <button 
          onClick={handleSave}
          className="btn-primary py-3 px-6 gap-2"
        >
          <Save size={18} />
          Save Changes
        </button>
      </div>

      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
            activeTab === 'profile' ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-400 border border-slate-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <Building size={14} />
            Business Profile
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('tax')}
          className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
            activeTab === 'tax' ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-400 border border-slate-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <Receipt size={14} />
            Tax & Compliance
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('sales')}
          className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
            activeTab === 'sales' ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-400 border border-slate-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users size={14} />
            Sales Team
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
            activeTab === 'inventory' ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-400 border border-slate-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <Globe size={14} />
            Inventory Masters
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('staff')}
          className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
            activeTab === 'staff' ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-400 border border-slate-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <Shield size={14} />
            Staff Control
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('vendors')}
          className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
            activeTab === 'vendors' ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-400 border border-slate-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <Truck size={14} />
            Suppliers
          </div>
        </button>
      </div>

      {activeTab === 'profile' ? (
        <div className="space-y-6">
          <div className="glass-card p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-24 h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <>
                    <Upload size={20} className="text-gray-300" />
                    <span className="text-[8px] font-bold text-gray-400 mt-2 uppercase tracking-widest">Logo</span>
                  </>
                )}
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={handleLogoUpload}
                  accept="image/*"
                />
              </div>
              <div>
                <h4 className="text-sm font-bold text-charcoal uppercase tracking-tight">Organization Identity</h4>
                <p className="text-xs text-gray-400 mt-1">This information appears on generated tax invoices</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Legal Business Name</label>
                <input 
                  type="text" 
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-primary/30 font-bold"
                  value={settings.name}
                  onChange={e => setSettings({...settings, name: e.target.value})}
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Headquarters Address</label>
                <textarea 
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-primary/30 h-24 font-medium"
                  value={settings.address}
                  onChange={e => setSettings({...settings, address: e.target.value})}
                ></textarea>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">GSTIN / Tax ID</label>
                <input 
                  type="text" 
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-primary/30 font-mono text-xs"
                  value={settings.gstin}
                  onChange={e => setSettings({...settings, gstin: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Phone Number</label>
                <input 
                  type="text" 
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-primary/30"
                  value={settings.phone}
                  onChange={e => setSettings({...settings, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Business Email</label>
                <input 
                  type="email" 
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-primary/30 text-sm"
                  value={settings.email}
                  onChange={e => setSettings({...settings, email: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'tax' ? (
        <div className="space-y-6">
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h4 className="text-sm font-bold text-charcoal uppercase tracking-tight">Tax Matrix Configuration</h4>
                <p className="text-xs text-gray-400 mt-1">Configure individual tax components (IGST, SGST, CGST)</p>
              </div>
              <button 
                onClick={addTaxType}
                className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {settings.taxTypes.map(tax => (
                <div key={tax.id} className="flex gap-4 items-end p-4 bg-slate-50 rounded-xl border border-slate-100 animate-in slide-in-from-top-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Tax Name</label>
                    <input 
                      type="text" 
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-primary/30 text-xs font-bold"
                      value={tax.name}
                      onChange={e => updateTax(tax.id, { name: e.target.value })}
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Rate (%)</label>
                    <input 
                      type="number" 
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-primary/30 text-xs font-bold"
                      value={tax.rate}
                      onChange={e => updateTax(tax.id, { rate: Number(e.target.value) })}
                    />
                  </div>
                  <div className="flex items-center gap-2 pb-2">
                    <button 
                      onClick={() => updateTax(tax.id, { isDefault: !tax.isDefault })}
                      className={`p-2 rounded-lg transition-all ${tax.isDefault ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}
                      title={tax.isDefault ? "Default Applied" : "Set as Default"}
                    >
                      <ShieldCheck size={18} />
                    </button>
                    <button 
                      onClick={() => deleteTax(tax.id)}
                      className="p-2 text-slate-300 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-10 border-t border-slate-100">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 block">Pricing Protocol</h4>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setSettings({...settings, taxPreference: 'exclusive'})}
                  className={`p-6 rounded-2xl border transition-all text-left group ${
                    settings.taxPreference === 'exclusive' 
                      ? 'border-primary bg-primary/5 shadow-inner' 
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <p className={`text-xs font-bold uppercase tracking-tight mb-2 ${settings.taxPreference === 'exclusive' ? 'text-primary' : 'text-charcoal'}`}>Tax Exclusive</p>
                  <p className="text-[10px] text-gray-400 leading-relaxed font-medium">Wholesale price does not include GST. Tax is added separately during billing.</p>
                </button>
                <button 
                  onClick={() => setSettings({...settings, taxPreference: 'inclusive'})}
                  className={`p-6 rounded-2xl border transition-all text-left ${
                    settings.taxPreference === 'inclusive' 
                      ? 'border-primary bg-primary/5 shadow-inner' 
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <p className={`text-xs font-bold uppercase tracking-tight mb-2 ${settings.taxPreference === 'inclusive' ? 'text-primary' : 'text-charcoal'}`}>Tax Inclusive</p>
                  <p className="text-[10px] text-gray-400 leading-relaxed font-medium">Wholesale price already includes all applicable taxes. Ideal for retail environments.</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'sales' ? (
        <div className="space-y-6">
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h4 className="text-sm font-bold text-charcoal uppercase tracking-tight">Sales Force Management</h4>
                <p className="text-xs text-gray-400 mt-1">Assign sales codes to track departmental performance</p>
              </div>
              <button 
                onClick={() => setSalesPersons([...salesPersons, { id: Date.now().toString(), name: 'New Executive', code: 'SP' + Math.floor(Math.random() * 1000), phone: '', active: true }])}
                className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {salesPersons.map(sp => (
                <div key={sp.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                  <button 
                    onClick={() => setSalesPersons(salesPersons.filter(x => x.id !== sp.id))}
                    className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="space-y-4">
                    <div className="flex gap-2 text-[10px] font-bold text-primary uppercase tracking-widest mb-4">
                      Code: {sp.code}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Full Name</label>
                      <input 
                        type="text" 
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none text-xs font-bold"
                        value={sp.name}
                        onChange={e => setSalesPersons(salesPersons.map(x => x.id === sp.id ? { ...x, name: e.target.value } : x))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Sales Code</label>
                        <input 
                          type="text" 
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none text-xs font-bold uppercase"
                          value={sp.code}
                          onChange={e => setSalesPersons(salesPersons.map(x => x.id === sp.id ? { ...x, code: e.target.value } : x))}
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-5">
                        <button 
                          onClick={() => setSalesPersons(salesPersons.map(x => x.id === sp.id ? { ...x, active: !x.active } : x))}
                          className={cn(
                            "w-full py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all",
                            sp.active ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-200 text-slate-500 border border-slate-300"
                          )}
                        >
                          {sp.active ? 'Active' : 'Disabled'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeTab === 'vendors' ? (
        <div className="space-y-6">
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h4 className="text-sm font-bold text-charcoal uppercase tracking-tight">Supply Chain Partners</h4>
                <p className="text-xs text-gray-400 mt-1">Maintain vendor contact database and address records</p>
              </div>
              <button 
                onClick={() => setVendors([...vendors, { id: Date.now().toString(), name: 'New Vendor', contactPerson: '', email: '', phone: '', address: '', createdAt: Date.now() }])}
                className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {vendors.map(v => (
                <div key={v.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                  <button 
                    onClick={() => setVendors(vendors.filter(x => x.id !== v.id))}
                    className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Full Business Name</label>
                        <input 
                          type="text" 
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none text-xs font-bold"
                          value={v.name}
                          onChange={e => setVendors(vendors.map(x => x.id === v.id ? { ...x, name: e.target.value } : x))}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Contact Person</label>
                        <input 
                          type="text" 
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none text-xs font-bold"
                          value={v.contactPerson}
                          onChange={e => setVendors(vendors.map(x => x.id === v.id ? { ...x, contactPerson: e.target.value } : x))}
                        />
                      </div>
                    </div>
                    <div className="md:col-span-1 space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Phone / Mobile</label>
                        <input 
                          type="text" 
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none text-xs font-bold"
                          value={v.phone}
                          onChange={e => setVendors(vendors.map(x => x.id === v.id ? { ...x, phone: e.target.value } : x))}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Email Address</label>
                        <input 
                          type="email" 
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none text-xs font-bold"
                          value={v.email}
                          onChange={e => setVendors(vendors.map(x => x.id === v.id ? { ...x, email: e.target.value } : x))}
                        />
                      </div>
                    </div>
                    <div className="md:col-span-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Physical Address</label>
                      <textarea 
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none text-xs font-medium h-[110px]"
                        value={v.address}
                        onChange={e => setVendors(vendors.map(x => x.id === v.id ? { ...x, address: e.target.value } : x))}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {vendors.length === 0 && (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Truck size={40} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">No vendors registered yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'staff' ? (
        <div className="space-y-6">
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h4 className="text-sm font-bold text-charcoal uppercase tracking-tight">Staff & Access Control</h4>
                <p className="text-xs text-gray-400 mt-1">Manage system users, passwords and role privileges</p>
              </div>
              <button 
                onClick={() => setStaff([...staff, { id: Date.now().toString(), name: 'New Staff', empId: 'EMP' + Math.floor(Math.random() * 1000), password: 'password', role: 'Cashier', active: true, createdAt: Date.now() }])}
                className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {staff.map(s => (
                <div key={s.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                  <button 
                    onClick={() => setStaff(staff.filter(x => x.id !== s.id))}
                    className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded",
                        s.role === 'Admin' ? "bg-primary text-white" : "bg-blue-100 text-primary"
                      )}>
                        {s.role}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">ID: {s.empId}</span>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Staff Name</label>
                      <input 
                        type="text" 
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none text-xs font-bold"
                        value={s.name}
                        onChange={e => setStaff(staff.map(x => x.id === s.id ? { ...x, name: e.target.value } : x))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Emp ID</label>
                        <input 
                          type="text" 
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none text-xs font-bold"
                          value={s.empId}
                          onChange={e => setStaff(staff.map(x => x.id === s.id ? { ...x, empId: e.target.value } : x))}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Password</label>
                        <input 
                          type="text" 
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none text-xs font-bold"
                          value={s.password}
                          onChange={e => setStaff(staff.map(x => x.id === s.id ? { ...x, password: e.target.value } : x))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Access Tier</label>
                        <select 
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none text-xs font-bold"
                          value={s.role}
                          onChange={e => setStaff(staff.map(x => x.id === s.id ? { ...x, role: e.target.value as 'Admin' | 'Cashier' } : x))}
                        >
                          <option value="Admin">System Admin</option>
                          <option value="Cashier">Cashier / Billing</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2 pt-5">
                        <button 
                          onClick={() => setStaff(staff.map(x => x.id === s.id ? { ...x, active: !x.active } : x))}
                          className={cn(
                            "w-full py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all",
                            s.active ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-200 text-slate-500 border border-slate-300"
                          )}
                        >
                          {s.active ? 'Authenticated' : 'Locked'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h4 className="text-sm font-bold text-charcoal uppercase tracking-tight">Product Attributes Master</h4>
                <p className="text-xs text-gray-400 mt-1">Define global sizes, colors, and product categories</p>
              </div>
              <div className="flex p-1 bg-slate-100 rounded-lg">
                {(['sizes', 'colors', 'categories'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveInventorySubTab(tab)}
                    className={cn(
                      "px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all",
                      activeInventorySubTab === tab ? "bg-white text-primary shadow-sm" : "text-gray-400"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Global Low Stock Threshold</label>
               <input 
                 type="number" 
                 className="max-w-[120px] p-2 bg-white border border-slate-200 rounded-lg outline-none text-xs font-bold"
                 value={settings.lowStockThreshold}
                 onChange={e => setSettings({...settings, lowStockThreshold: parseInt(e.target.value) || 0})}
               />
               <p className="text-[9px] text-gray-400 mt-2">Inventory items below this count will trigger system alerts.</p>
            </div>

            {activeInventorySubTab === 'sizes' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Size Definitions</h5>
                  <button 
                    onClick={() => setSettings({...settings, sizes: [...settings.sizes, { id: Date.now().toString(), name: 'New Size', code: 'CODE' }]})}
                    className="p-1.5 bg-primary text-white rounded-md"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {settings.sizes.map(size => (
                    <div key={size.id} className="p-4 bg-white border border-slate-100 rounded-xl flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="text-[8px] font-bold text-gray-400 uppercase mb-1 block">Name</label>
                        <input 
                          type="text" 
                          className="w-full p-2 bg-slate-50 border border-transparent rounded-md text-xs font-bold"
                          value={size.name}
                          onChange={e => setSettings({...settings, sizes: settings.sizes.map(s => s.id === size.id ? { ...s, name: e.target.value } : s)})}
                        />
                      </div>
                      <div className="w-20">
                        <label className="text-[8px] font-bold text-gray-400 uppercase mb-1 block">Code</label>
                        <input 
                          type="text" 
                          className="w-full p-2 bg-slate-50 border border-transparent rounded-md text-xs font-bold uppercase"
                          value={size.code}
                          onChange={e => setSettings({...settings, sizes: settings.sizes.map(s => s.id === size.id ? { ...s, code: e.target.value } : s)})}
                        />
                      </div>
                      <button 
                        onClick={() => setSettings({...settings, sizes: settings.sizes.filter(s => s.id !== size.id)})}
                        className="p-2 text-slate-300 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeInventorySubTab === 'colors' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Color Palette</h5>
                  <button 
                    onClick={() => setSettings({...settings, colors: [...settings.colors, { id: Date.now().toString(), name: 'New Color', hex: '#000000' }]})}
                    className="p-1.5 bg-primary text-white rounded-md"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {settings.colors.map(color => (
                    <div key={color.id} className="p-4 bg-white border border-slate-100 rounded-xl flex gap-3 items-end">
                      <div className="w-10 h-10 rounded-md border border-slate-200 shrink-0" style={{ backgroundColor: color.hex }}></div>
                      <div className="flex-1">
                        <label className="text-[8px] font-bold text-gray-400 uppercase mb-1 block">Color Name</label>
                        <input 
                          type="text" 
                          className="w-full p-2 bg-slate-50 border border-transparent rounded-md text-xs font-bold"
                          value={color.name}
                          onChange={e => setSettings({...settings, colors: settings.colors.map(c => c.id === color.id ? { ...c, name: e.target.value } : c)})}
                        />
                      </div>
                      <div className="w-24">
                        <label className="text-[8px] font-bold text-gray-400 uppercase mb-1 block">Hex Code</label>
                        <input 
                          type="text" 
                          className="w-full p-2 bg-slate-50 border border-transparent rounded-md text-xs font-mono"
                          value={color.hex}
                          onChange={e => setSettings({...settings, colors: settings.colors.map(c => c.id === color.id ? { ...c, hex: e.target.value } : c)})}
                        />
                      </div>
                      <button 
                        onClick={() => setSettings({...settings, colors: settings.colors.filter(c => c.id !== color.id)})}
                        className="p-2 text-slate-300 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeInventorySubTab === 'categories' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Classifications</h5>
                  <button 
                    onClick={() => setSettings({...settings, categories: [...settings.categories, { id: Date.now().toString(), name: 'New Category', subCategories: [] }]})}
                    className="p-1.5 bg-primary text-white rounded-md"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="space-y-4">
                  {settings.categories.map(cat => (
                    <div key={cat.id} className="p-6 bg-white border border-slate-100 rounded-2xl">
                      <div className="flex gap-4 items-end mb-6 pb-6 border-b border-slate-50">
                        <div className="flex-1">
                           <label className="text-[8px] font-bold text-gray-400 uppercase mb-1 block">Department Name</label>
                           <input 
                             type="text" 
                             className="w-full p-2 bg-slate-50 border border-transparent rounded-md text-sm font-black uppercase tracking-tight"
                             value={cat.name}
                             onChange={e => setSettings({...settings, categories: settings.categories.map(c => c.id === cat.id ? { ...c, name: e.target.value } : c)})}
                           />
                        </div>
                        <button 
                          onClick={() => setSettings({...settings, categories: settings.categories.filter(c => c.id !== cat.id)})}
                          className="p-2 text-slate-300 hover:text-red-500"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      
                      <div className="space-y-3 pl-6 border-l-2 border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-300">Sub-Categories</span>
                           <button 
                             onClick={() => setSettings({
                               ...settings, 
                               categories: settings.categories.map(c => c.id === cat.id ? { ...c, subCategories: [...c.subCategories, { id: Date.now().toString(), name: 'New Sub' }] } : c)
                             })}
                             className="text-primary hover:text-primary-dark transition-colors"
                           >
                             <Plus size={16} />
                           </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {cat.subCategories.map(sub => (
                            <div key={sub.id} className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg group">
                              <input 
                                type="text"
                                className="bg-transparent border-none outline-none text-[10px] font-bold text-charcoal flex-1"
                                value={sub.name}
                                onChange={e => setSettings({
                                  ...settings,
                                  categories: settings.categories.map(c => c.id === cat.id ? { ...c, subCategories: c.subCategories.map(s => s.id === sub.id ? { ...s, name: e.target.value } : s) } : c)
                                })}
                              />
                              <button 
                                onClick={() => setSettings({
                                  ...settings,
                                  categories: settings.categories.map(c => c.id === cat.id ? { ...c, subCategories: c.subCategories.filter(s => s.id !== sub.id) } : c)
                                })}
                                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all px-1"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
