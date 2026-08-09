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
  total: number;
  paymentStatus?: string;
  notes?: string;
}

// Cash Flow Types
export interface CashFlowTransaction {
  date: string;
  description: string;
  reference: string | null;
  inflow: number;
  outflow: number;
  classification: string;
  balance: number;
}

export interface CashFlowData {
  period: string;
  beginningCash: number;
  inflowRevenue: number;
  inflowOther: number;
  totalInflow: number;
  outflowParts: number;
  outflowOperating: number;
  outflowOther: number;
  totalOutflow: number;
  netChange: number;
  endingCash: number;
  transactions: CashFlowTransaction[];
}

// Detailed Expense Export Types
export interface ExpenseExportItem {
  date: string;
  description: string;
  category: string;
  source: string;
  amount: number;
}

export interface ExpenseExportData {
  period: string;
  expenses: ExpenseExportItem[];
  totalExpense: number;
}

