/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'Free';

export interface ProductInventory {
  [size: string]: {
    [color: string]: number;
  };
}

export interface SizeDefinition {
  id: string;
  name: string;
  code: string;
}

export interface ColorDefinition {
  id: string;
  name: string;
  hex: string;
}

export interface Staff {
  id: string;
  name: string;
  empId: string;
  password: string;
  role: 'Admin' | 'Cashier';
  active: boolean;
  createdAt: number;
}

export interface SubCategory {
  id: string;
  name: string;
}

export interface CategoryDefinition {
  id: string;
  name: string;
  subCategories: SubCategory[];
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  imageUrl?: string;
  subCategory?: string;
  purchasePrice: number;
  wholesalePrice: number;
  mrp: number;
  gstRate: number; // e.g., 5 or 12
  inventory: ProductInventory;
  totalStock: number;
  lowStockThreshold?: number;
  vendorId?: string;
  createdAt: number;
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  createdAt: number;
}

export interface Customer {
  id: string;
  name: string;
  businessName: string;
  gstin: string;
  phone: string;
  email: string;
  address: string;
  creditLimit: number;
  outstandingBalance: number;
  tier: 'Wholesale' | 'Retail' | 'Premium';
}

export interface SalesPerson {
  id: string;
  name: string;
  code: string;
  phone: string;
  active: boolean;
}

export interface TaxSetting {
  id: string;
  name: string; // e.g., 'CGST', 'SGST', 'IGST'
  rate: number; // percentage
  isDefault: boolean;
}

export interface BusinessSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  logoUrl?: string;
  taxPreference: 'inclusive' | 'exclusive';
  taxTypes: TaxSetting[];
  lowStockThreshold: number;
  sizes: SizeDefinition[];
  colors: ColorDefinition[];
  categories: CategoryDefinition[];
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  gstAmount: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  status: 'Paid' | 'Unpaid' | 'Partial' | 'Returned';
  paymentMethod?: 'Cash' | 'Card' | 'UPI' | 'Credit';
  salesPersonId?: string;
  createdAt: number;
}

export interface ReturnRecord {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  items: {
    productId: string;
    productName: string;
    variant: string; // "Size / Color"
    quantity: number;
    price: number;
    refundAmount: number;
  }[];
  totalRefund: number;
  reason: string;
  createdAt: number;
}

export interface SummaryStats {
  totalSales: number;
  totalReceivables: number;
  activeCustomers: number;
  lowStockItems: number;
}
