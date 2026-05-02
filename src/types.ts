
export interface Medicine {
  id: number;
  name: string;
  genericName: string;
  category: string;
  manufacturer: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  expiryDate: string;
  description?: string;
  createdAt: string;
}

export interface Sale {
  id: number;
  invoiceNumber: string;
  customerName?: string;
  totalAmount: number;
  date: string;
}

export interface SaleItem {
  id: number;
  saleId: number;
  medicineId: number;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface DashboardStats {
  totalMedicines: number;
  lowStockCount: number;
  todaySalesRevenue: number;
  totalRevenue: number;
  totalPurchaseValue: number;
  totalInvoices: number;
}
