import { Product, Customer, Invoice, BusinessSettings, Staff, ReturnRecord, SalesPerson, Vendor } from './types';

const KEYS = {
  PRODUCTS: 'stitchflow_products',
  CUSTOMERS: 'stitchflow_customers',
  INVOICES: 'stitchflow_invoices',
  SETTINGS: 'stitchflow_settings',
  RETURNS: 'stitchflow_returns',
  SALES_PERSONS: 'stitchflow_sales_persons',
  STAFF: 'stitchflow_staff',
  SESSION: 'stitchflow_session'
};

const DEFAULT_SETTINGS: BusinessSettings = {
  name: 'GarmentPro Wholesaling Solutions',
  address: 'Industrial Area Phase 2, Delhi',
  phone: '+91 98765 43210',
  email: 'sales@stitchflow.com',
  gstin: '07SAMPLE1234Z5',
  taxPreference: 'exclusive',
  taxTypes: [
    { id: '1', name: 'CGST', rate: 2.5, isDefault: true },
    { id: '2', name: 'SGST', rate: 2.5, isDefault: true },
    { id: '3', name: 'IGST', rate: 5, isDefault: false },
  ],
  lowStockThreshold: 50,
  sizes: [
    { id: '1', name: 'Extra Small', code: 'XS' },
    { id: '2', name: 'Small', code: 'S' },
    { id: '3', name: 'Medium', code: 'M' },
    { id: '4', name: 'Large', code: 'L' },
    { id: '5', name: 'Extra Large', code: 'XL' }
  ],
  colors: [
    { id: '1', name: 'Jet Black', hex: '#000000' },
    { id: '2', name: 'Pure White', hex: '#FFFFFF' },
    { id: '3', name: 'Navy Blue', hex: '#000080' }
  ],
  categories: [
    { 
      id: '1', 
      name: 'T-Shirts', 
      subCategories: [
        { id: '1-1', name: 'Round Neck' },
        { id: '1-2', name: 'Polo' }
      ] 
    },
    { 
      id: '2', 
      name: 'Jeans', 
      subCategories: [
        { id: '2-1', name: 'Slim Fit' },
        { id: '2-2', name: 'Loose Fit' }
      ] 
    }
  ]
};

export const storage = {
  getProducts: (): Product[] => {
    const data = localStorage.getItem(KEYS.PRODUCTS);
    return data ? JSON.parse(data) : [];
  },
  saveProducts: (products: Product[]) => {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },
  getCustomers: (): Customer[] => {
    const data = localStorage.getItem(KEYS.CUSTOMERS);
    return data ? JSON.parse(data) : [];
  },
  saveCustomers: (customers: Customer[]) => {
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
  },
  getInvoices: (): Invoice[] => {
    const data = localStorage.getItem(KEYS.INVOICES);
    return data ? JSON.parse(data) : [];
  },
  saveInvoices: (invoices: Invoice[]) => {
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));
  },
  getSettings: (): BusinessSettings => {
    const data = localStorage.getItem(KEYS.SETTINGS);
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  },
  saveSettings: (settings: BusinessSettings) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },
  getReturns: (): ReturnRecord[] => {
    const data = localStorage.getItem(KEYS.RETURNS);
    return data ? JSON.parse(data) : [];
  },
  saveReturns: (returns: ReturnRecord[]) => {
    localStorage.setItem(KEYS.RETURNS, JSON.stringify(returns));
  },
  getSalesPersons: (): SalesPerson[] => {
    const data = localStorage.getItem(KEYS.SALES_PERSONS);
    if (!data) {
      const initial: SalesPerson[] = [
        { id: 'sp1', name: 'Rahul Sharma', code: 'RS001', phone: '9988776655', active: true },
        { id: 'sp2', name: 'Anjali Gupta', code: 'AG002', phone: '9988776644', active: true }
      ];
      localStorage.setItem(KEYS.SALES_PERSONS, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  },
  saveSalesPersons: (persons: SalesPerson[]) => {
    localStorage.setItem(KEYS.SALES_PERSONS, JSON.stringify(persons));
  },
  getVendors: (): Vendor[] => {
    const data = localStorage.getItem('stitchflow_vendors');
    return data ? JSON.parse(data) : [];
  },
  saveVendors: (vendors: Vendor[]) => {
    localStorage.setItem('stitchflow_vendors', JSON.stringify(vendors));
  },
  getStaff: (): Staff[] => {
    const data = localStorage.getItem(KEYS.STAFF);
    return data ? JSON.parse(data) : [];
  },
  saveStaff: (staff: Staff[]) => {
    localStorage.setItem(KEYS.STAFF, JSON.stringify(staff));
  },
  getSession: (): Staff | null => {
    const data = localStorage.getItem(KEYS.SESSION);
    return data ? JSON.parse(data) : null;
  },
  setSession: (staff: Staff | null) => {
    if (staff) {
      localStorage.setItem(KEYS.SESSION, JSON.stringify(staff));
    } else {
      localStorage.removeItem(KEYS.SESSION);
    }
  }
};

// Seed initial data if empty
export const seedInitialData = () => {
  if (storage.getProducts().length === 0) {
    const initialProducts: Product[] = [
      {
        id: '1',
        sku: 'TSH-001',
        name: 'Classic Cotton T-Shirt',
        brand: 'Comfort Style',
        category: 'T-Shirts',
        purchasePrice: 150,
        wholesalePrice: 250,
        mrp: 500,
        gstRate: 5,
        totalStock: 120,
        createdAt: Date.now(),
        inventory: {
          'M': { 'Navy': 50, 'Black': 20 },
          'L': { 'Navy': 30, 'White': 20 }
        }
      },
      {
        id: '2',
        sku: 'JN-501',
        name: 'Heavy Denim Jeans',
        brand: 'Denim Co',
        category: 'Jeans',
        purchasePrice: 600,
        wholesalePrice: 850,
        mrp: 1499,
        gstRate: 12,
        totalStock: 45,
        createdAt: Date.now(),
        inventory: {
          '32': { 'Blue': 25 },
          '34': { 'Blue': 20 }
        }
      }
    ];
    storage.saveProducts(initialProducts);
  }

  if (storage.getCustomers().length === 0) {
    const initialCustomers: Customer[] = [
      {
        id: 'c1',
        name: 'Rahul Sharma',
        businessName: 'Sharma Garments',
        gstin: '07AAAAA0000A1Z5',
        phone: '9876543210',
        email: 'rahul@example.com',
        address: 'Main Market, Delhi',
        creditLimit: 50000,
        outstandingBalance: 12500,
        tier: 'Wholesale'
      }
    ];
    storage.saveCustomers(initialCustomers);
  }

  if (storage.getStaff().length === 0) {
    const initialStaff: Staff[] = [
      {
        id: 'admin1',
        name: 'System Admin',
        empId: 'admin',
        password: '987654', // In a real app this would be hashed
        role: 'Admin',
        active: true,
        createdAt: Date.now()
      }
    ];
    storage.saveStaff(initialStaff);
  } else {
    // Migration: Update default admin password to the new requested one if it's still 'admin'
    const staff = storage.getStaff();
    const adminIdx = staff.findIndex(s => s.empId === 'admin' && s.password === 'admin');
    if (adminIdx !== -1) {
      staff[adminIdx].password = '987654';
      storage.saveStaff(staff);
    }
  }
};
