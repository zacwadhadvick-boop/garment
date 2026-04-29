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
  warehouseId?: string;
  rackLocation?: string;
  createdAt: number;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  isMain?: boolean;
}

export interface WarehouseTransfer {
  id: string;
  transferNumber: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  items: {
    productId: string;
    productName: string;
    sku: string;
    variant: string;
    quantity: number;
  }[];
  status: 'Draft' | 'Sent' | 'Received' | 'Cancelled';
  createdAt: number;
}

export interface Campaign {
  id: string;
  name: string;
  type: 'WhatsApp' | 'SMS' | 'BulkEmail';
  offerDetails: string;
  status: 'Scheduled' | 'Sent' | 'Draft';
  targetSegment: 'All' | 'Wholesale' | 'Premium' | 'Retail';
  createdAt: number;
}

export interface BoxItem {
  productId: string;
  productName: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
}

export interface Carton {
  id: string;
  cartonNumber: string;
  items: BoxItem[];
  totalQuantity: number;
  weight?: string;
  status: 'Draft' | 'Finalized' | 'Shipped';
  notes?: string;
  createdAt: number;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  purchasePrice: number;
  landedCost?: number; // Calculated cost including transport
  total: number;
}

export interface PurchaseVoucher {
  id: string;
  voucherNumber: string;
  vendorId: string;
  vendorName: string;
  items: PurchaseItem[];
  subtotal: number;
  transportCost?: number;
  otherCharges?: number;
  taxTotal: number;
  grandTotal: number;
  status: 'Pending' | 'Received' | 'Cancelled' | 'Returned';
  billNumber?: string;
  billDate?: number;
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
  loyaltyPoints?: number;
  notes?: string;
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
  cgst?: number;
  sgst?: number;
  igst?: number;
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
  cgstTotal?: number;
  sgstTotal?: number;
  igstTotal?: number;
  taxTotal: number;
  discountTotal?: number;
  grandTotal: number;
  status: 'Paid' | 'Unpaid' | 'Partial' | 'Returned' | 'Draft';
  paymentMethod?: 'Cash' | 'Card' | 'UPI' | 'Credit';
  salesPersonId?: string;
  isInterState?: boolean;
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

export interface Transaction {
  id: string;
  type: 'Income' | 'Expense' | 'Payment_In' | 'Payment_Out';
  category: 'Sales' | 'Purchase' | 'Transport' | 'Labor' | 'Rent' | 'Utility' | 'Salary' | 'Marketing' | 'Other';
  amount: number;
  entityId?: string; // CustomerId or VendorId
  entityName?: string;
  referenceType?: 'Invoice' | 'Purchase' | 'Expense' | 'Return';
  referenceId?: string;
  referenceNumber?: string;
  paymentMethod: 'Cash' | 'Bank' | 'UPI' | 'Card';
  description: string;
  date: number;
  createdAt: number;
}

export interface ExpenseRecord {
  id: string;
  category: 'Transport' | 'Labor' | 'Rent' | 'Utility' | 'Salary' | 'Marketing' | 'Other';
  amount: number;
  paymentMethod: 'Cash' | 'Bank' | 'UPI' | 'Card';
  description: string;
  date: number;
  createdAt: number;
}

export interface SummaryStats {
  totalSales: number;
  totalReceivables: number;
  activeCustomers: number;
  lowStockItems: number;
}
