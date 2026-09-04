// lib/export/types.ts

export type ExportFormat = "pdf" | "excel";
export type PageOrientation = "portrait" | "landscape";

/**
 * Options for configuring document exports (PDF / Excel).
 */
export interface ExportOptions {
  format: ExportFormat;
  orientation: PageOrientation;
  filename: string;
  title: string;
  includeLetterhead?: boolean;
}

/**
 * Social media handles for business letterhead.
 */
export interface SocialMediaConfig {
  instagram?: string;
  facebook?: string;
  twitter?: string;
}

/**
 * Company letterhead configuration for official document header.
 */
export interface LetterheadConfig {
  companyName: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  website?: string;
  logoUrl?: string;
  socialMedia?: SocialMediaConfig;
}

/**
 * Balance sheet account line item.
 */
export interface BalanceSheetAccount {
  code: string;
  name: string;
  balance: number;
}

/**
 * Balance sheet category section (Assets, Liabilities, Equity).
 */
export interface BalanceSheetSection {
  title: string;
  accounts: BalanceSheetAccount[];
  total: number;
}

/**
 * Complete balance sheet report data structure.
 */
export interface BalanceSheetData {
  date: Date | string;
  assets: BalanceSheetSection[];
  liabilities: BalanceSheetSection[];
  equity: BalanceSheetSection[];
}

/**
 * Income statement account line item.
 */
export interface IncomeStatementAccountItem {
  code: string;
  name: string;
  balance: number;
}

/**
 * Income statement report data structure.
 */
export interface IncomeStatementData {
  period: string;
  revenues: IncomeStatementAccountItem[];
  totalRevenue: number;
  expenses: IncomeStatementAccountItem[];
  totalExpense: number;
  netIncome: number;
}

/**
 * Employee payroll line item entry.
 */
export interface PayrollEntry {
  employeeId: string;
  employeeName: string;
  position: string;
  basicSalary: number;
  allowances?: number;
  deductions?: number;
  netSalary: number;
}

/**
 * Summary data structure for payroll exports.
 */
export interface PayrollSummary {
  period: string;
  startDate: Date | string;
  endDate: Date | string;
  entries: PayrollEntry[];
  totalSalary: number;
}

/**
 * Employee master data structure for export.
 */
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

/**
 * Inventory spare part item structure for export.
 */
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

/**
 * Order list export item structure.
 */
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

/**
 * Invoice line item entry.
 */
export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

/**
 * Invoice document export data structure.
 */
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

/**
 * Individual cash flow transaction ledger entry.
 */
export interface CashFlowTransaction {
  date: string;
  description: string;
  reference: string | null;
  inflow: number;
  outflow: number;
  classification: string;
  balance: number;
}

/**
 * Complete cash flow statement report data structure.
 */
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
  letterhead?: Partial<LetterheadConfig>;
}

/**
 * Individual expense line item for export.
 */
export interface ExpenseExportItem {
  date: string;
  description: string;
  category: string;
  source: string;
  amount: number;
}

/**
 * Expense report export data structure.
 */
export interface ExpenseExportData {
  period: string;
  expenses: ExpenseExportItem[];
  totalExpense: number;
}

/**
 * Revenue transaction line item for combined report.
 */
export interface RevenueExportItem {
  id: string;
  date: string;
  customerName: string;
  vehicle: string;
  plateNumber: string;
  serviceType: string;
  mechanic: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
}

/**
 * Accounts summary section for income statement in combined report.
 */
export interface CombinedIncomeStatementAccounts {
  revenues: IncomeStatementAccountItem[];
  expenses: IncomeStatementAccountItem[];
}

/**
 * Combined financial report (Pendapatan & Pengeluaran) export data structure.
 */
export interface CombinedFinancialExportData {
  period: string;
  totalRevenue: number;
  totalExpense: number;
  netIncome: number;
  totalOrders: number;
  orders: RevenueExportItem[];
  expenses: ExpenseExportItem[];
  incomeStatementAccounts?: CombinedIncomeStatementAccounts;
  letterhead?: Partial<LetterheadConfig>;
}
