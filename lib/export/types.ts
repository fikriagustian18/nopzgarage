// lib/export/types.ts

export type ExportFormat = "pdf" | "excel";
export type PageOrientation = "portrait" | "landscape";

export interface ExportOptions {
  format: ExportFormat;
  orientation: PageOrientation;
  filename: string;
  title: string;
  includeLetterhead?: boolean;
}

export interface LetterheadConfig {
  companyName: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  website?: string;
  logoUrl?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
}

// Journal Entry Types
export interface JournalEntryItem {
  account: {
    name: string;
    code: string;
  };
  debit: number;
  credit: number;
}

export interface JournalEntryExport {
  id: string;
  date: Date | string;
  description: string;
  reference?: string;
  items: JournalEntryItem[];
}

// Balance Sheet Types
export interface BalanceSheetAccount {
  code: string;
  name: string;
  balance: number;
}

export interface BalanceSheetSection {
  title: string;
  accounts: BalanceSheetAccount[];
  total: number;
}

export interface BalanceSheetData {
  date: Date | string;
  assets: BalanceSheetSection[];
  liabilities: BalanceSheetSection[];
  equity: BalanceSheetSection[];
}

export interface IncomeStatementData {
    period: string;
    revenues: {
        code: string;
        name: string;
        balance: number;
    }[];
    totalRevenue: number;
    expenses: {
        code: string;
        name: string;
        balance: number;
    }[];
    totalExpense: number;
    netIncome: number;
}

// Payroll Types
export interface PayrollEntry {
  employeeId: string;
  employeeName: string;
  position: string;
  basicSalary: number;
  allowances?: number;
  deductions?: number;
  netSalary: number;
}

export interface PayrollSummary {
  period: string;
  startDate: Date | string;
  endDate: Date | string;
  entries: PayrollEntry[];
  totalSalary: number;
}

// Employee Types
export interface EmployeeExport {
  id: string;
  name: string;
  email: string;
  phone?: string;
  position: string;
  department?: string;
  status: string;
  joinDate: Date | string;
}

// Inventory Types
export interface InventoryItemExport {
  id: string;
  sku?: string;
  name: string;
  category?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalValue: number;
  supplier?: string;
  lowStockThreshold?: number;
}

// Order List Export Types
export interface OrderListExport {
  id: string;
  date: Date | string;
  customerName: string;
  vehicle: string;
  plateNumber: string;
  serviceType: string;
  mechanic: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
}

// Order/Invoice Types
export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceExport {
  invoiceNumber: string;
  invoiceDate: Date | string;
  dueDate?: Date | string;
  customerName: string;
  customerAddress?: string;
  items: InvoiceLineItem[];
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  paymentStatus?: string;
  notes?: string;
}
