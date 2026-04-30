import { Product, Customer, Invoice, BusinessSettings, Staff, ReturnRecord, SalesPerson, Vendor, Carton, PurchaseVoucher, Transaction, ExpenseRecord, Warehouse, WarehouseTransfer, Campaign } from './types';

const KEYS = {
  PRODUCTS: 'stitchflow_products',
  CUSTOMERS: 'stitchflow_customers',
  INVOICES: 'stitchflow_invoices',
  SETTINGS: 'stitchflow_settings',
  RETURNS: 'stitchflow_returns',
  SALES_PERSONS: 'stitchflow_sales_persons',
  STAFF: 'stitchflow_staff',
  SESSION: 'stitchflow_session',
  CARTONS: 'stitchflow_cartons',
  PURCHASES: 'stitchflow_purchases',
  TRANSACTIONS: 'stitchflow_transactions',
  EXPENSES: 'stitchflow_expenses',
  WAREHOUSES: 'stitchflow_warehouses',
  TRANSFERS: 'stitchflow_transfers',
  CAMPAIGNS: 'stitchflow_campaigns'
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
    },
    { 
      id: '3', 
      name: 'Ladies Suits', 
      subCategories: [
        { id: '3-1', name: 'Anarkali' },
        { id: '3-2', name: 'Straight Cut' },
        { id: '3-3', name: 'Sharara' }
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
  getCartons: (): Carton[] => {
    const data = localStorage.getItem(KEYS.CARTONS);
    return data ? JSON.parse(data) : [];
  },
  saveCartons: (cartons: Carton[]) => {
    localStorage.setItem(KEYS.CARTONS, JSON.stringify(cartons));
  },
  getPurchases: (): PurchaseVoucher[] => {
    const data = localStorage.getItem(KEYS.PURCHASES);
    return data ? JSON.parse(data) : [];
  },
  savePurchases: (purchases: PurchaseVoucher[]) => {
    localStorage.setItem(KEYS.PURCHASES, JSON.stringify(purchases));
  },
  getTransactions: (): Transaction[] => {
    const data = localStorage.getItem(KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  },
  saveTransactions: (transactions: Transaction[]) => {
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },
  getExpenses: (): ExpenseRecord[] => {
    const data = localStorage.getItem(KEYS.EXPENSES);
    return data ? JSON.parse(data) : [];
  },
  saveExpenses: (expenses: ExpenseRecord[]) => {
    localStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));
  },
  getWarehouses: (): Warehouse[] => {
    const data = localStorage.getItem(KEYS.WAREHOUSES);
    return data ? JSON.parse(data) : [];
  },
  saveWarehouses: (warehouses: Warehouse[]) => {
    localStorage.setItem(KEYS.WAREHOUSES, JSON.stringify(warehouses));
  },
  getTransfers: (): WarehouseTransfer[] => {
    const data = localStorage.getItem(KEYS.TRANSFERS);
    return data ? JSON.parse(data) : [];
  },
  saveTransfers: (transfers: WarehouseTransfer[]) => {
    localStorage.setItem(KEYS.TRANSFERS, JSON.stringify(transfers));
  },
  getCampaigns: (): Campaign[] => {
    const data = localStorage.getItem(KEYS.CAMPAIGNS);
    return data ? JSON.parse(data) : [];
  },
  saveCampaigns: (campaigns: Campaign[]) => {
    localStorage.setItem(KEYS.CAMPAIGNS, JSON.stringify(campaigns));
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
        password: '12345', // In a real app this would be hashed
        role: 'Admin',
        active: true,
        createdAt: Date.now()
      }
    ];
    storage.saveStaff(initialStaff);
  } else {
    // Migration: Update default admin password to the new requested one if it's still 'admin'
    const staff = storage.getStaff();
    const adminIdx = staff.findIndex(s => s.empId === 'admin');
    if (adminIdx !== -1) {
      staff[adminIdx].password = '12345';
      storage.saveStaff(staff);
    }
  }

  if (storage.getTransactions().length === 0) {
    const initialTransactions: Transaction[] = [
      {
        id: 't1',
        type: 'Payment_In',
        category: 'Sales',
        amount: 5000,
        entityId: 'c1',
        entityName: 'Sharma Garments',
        paymentMethod: 'Cash',
        description: 'Partial payment for INV-001',
        date: Date.now() - 86400000 * 2,
        createdAt: Date.now()
      }
    ];
    storage.saveTransactions(initialTransactions);
  }

  if (storage.getExpenses().length === 0) {
    const initialExpenses: ExpenseRecord[] = [
      {
        id: 'e1',
        category: 'Transport',
        amount: 450,
        paymentMethod: 'Cash',
        description: 'Local delivery to Railway station',
        date: Date.now() - 86400000,
        createdAt: Date.now()
      }
    ];
    storage.saveExpenses(initialExpenses);
  }

  if (storage.getWarehouses().length === 0) {
    const initialWarehouses: Warehouse[] = [
      { id: 'wh1', name: 'Main Depot', location: 'Okhla, Delhi', isMain: true },
      { id: 'wh2', name: 'North Branch', location: 'Rohini, Delhi' },
      { id: 'wh3', name: 'South Hub', location: 'Gurgaon' }
    ];
    storage.saveWarehouses(initialWarehouses);
  }
};
