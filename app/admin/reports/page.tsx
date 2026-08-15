"use client";

// 1. External Libraries
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Layers,
  Wrench,
  Package,
  Wallet,
  CheckCircle,
  FileText,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// 2. Internal Components
import { RoleGuard } from "@/components/shared/RoleGuard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { ExportButton } from "@/components/export/ExportButton";
import { Toaster } from "@/components/ui/Toaster";
import { BankAccountsManager } from "@/components/admin/BankAccountsManager";
import { Badge } from "@/components/ui/Badge";

// 3. Utilities & Logic
import { getFinancialReports, getOperationalReports } from "@/lib/actions/finance";
import { exportCashFlow, exportCombinedFinancialReport } from "@/lib/export/reports/financialExport";

// 4. Types
import type { CashFlowData, CombinedFinancialExportData } from "@/lib/export/types";

interface OrderItem {
  id: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemType: string;
}

interface Order {
  id: string;
  custName: string;
  custPhone: string;
  vehicle: string;
  plateNumber: string | null;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  totalPrice: number;
  totalPaid: number;
  createdAt: string;
  orderItems: OrderItem[];
  mechanic?: { name: string } | null;
}

interface Expense {
  id: string;
  date: string;
  description: string;
  reference: string | null;
  amount: number;
  category: string;
  categoryCode: string;
  source: string;
}

interface IncomeStatementAccount {
  code: string;
  name: string;
  balance: number;
}

interface TrialBalanceAccount {
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
  balance: number;
}

interface BalanceSheetSection {
  assets: IncomeStatementAccount[];
  liabilities: IncomeStatementAccount[];
  equity: IncomeStatementAccount[];
  totalAsset: number;
  totalLiability: number;
  totalEquity: number;
}

interface CashFlowTransactionData {
  id: string;
  date: string;
  description: string;
  reference: string | null;
  inflow: number;
  outflow: number;
  classification: string;
  balance: number;
}

interface CashFlowStatementData {
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
  transactions: CashFlowTransactionData[];
}

interface FinancialReportData {
  trialBalance?: TrialBalanceAccount[];
  incomeStatement: {
    period?: {
      startDate?: string;
      endDate?: string;
    } | string;
    revenues: IncomeStatementAccount[];
    expenses: IncomeStatementAccount[];
    totalRevenue: number;
    totalExpense: number;
    netIncome: number;
  };
  balanceSheet?: BalanceSheetSection;
  cashFlowStatement?: CashFlowStatementData;
}

/**
 * Main Financial & Operational Reports Page for Admin Panel.
 * Displays cash flow summary, revenue breakdown, and operational expenses.
 */
export default function Page() {
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Data States
  const [reportData, setReportData] = useState<FinancialReportData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Filter States
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "SERVICE" | "PART" | "OTHER">("ALL");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<"ALL" | "CASH" | "TRANSFER" | "QRIS" | "CARD">("ALL");

  useEffect(() => {
    setIsMounted(true);
    
    // Set default dates: 1st of current month to today
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    
    setStartDate(toLocalDateString(start));
    setEndDate(toLocalDateString(now));
  }, []);

  useEffect(() => {
    if (isMounted && startDate && endDate) {
      fetchData(startDate, endDate);
    }
  }, [startDate, endDate, isMounted]);

  async function fetchData(start?: string, end?: string) {
    setLoading(true);
    setError("");
    try {
      const queryStart = start !== undefined ? start : startDate;
      const queryEnd = end !== undefined ? end : endDate;

      const [reportsRes, opRes] = await Promise.all([
        getFinancialReports(queryStart || undefined, queryEnd || undefined),
        getOperationalReports(),
      ]);

      if (reportsRes.success && reportsRes.data) {
        setReportData(reportsRes.data);
      } else {
        setError(reportsRes.error || "Gagal memuat laporan keuangan.");
      }

      if (opRes.success && opRes.data) {
        setOrders(opRes.data.orders as Order[]);
        setExpenses(opRes.data.expenses as Expense[]);
      } else {
        setError(opRes.error || "Gagal memuat laporan operasional.");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  }

  // Formatting currency helper
  function formatIDR(val: number): string {
    return `Rp ${Number(val).toLocaleString("id-ID")}`;
  }

  // Reset Filters
  function handleResetFilters() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    setStartDate(toLocalDateString(start));
    setEndDate(toLocalDateString(now));
    setFilterType("ALL");
    setFilterPaymentMethod("ALL");
  }

  function handleRetry() {
    fetchData(startDate, endDate);
  }

  // --- All useMemo hooks MUST be called before any early returns (Rules of Hooks) ---

  // --- Dynamic Filtering Logic (memoized) ---
  const filteredOrders = useMemo(() => orders.filter((order) => {
    const orderDate = toLocalDateString(order.createdAt);
    const inDateRange = (!startDate || orderDate >= startDate) && (!endDate || orderDate <= endDate);

    // Filter by type:
    // SERVICE: has only service items, PART: has only part items, OTHER: other
    const hasService = order.orderItems?.some((item) => item.itemType === "service");
    const hasPart = order.orderItems?.some((item) => item.itemType === "part");
    
    let matchesType = true;
    if (filterType === "SERVICE") {
      matchesType = hasService && !hasPart;
    } else if (filterType === "PART") {
      matchesType = hasPart && !hasService;
    } else if (filterType === "OTHER") {
      matchesType = !hasService && !hasPart;
    }

    // Filter by payment method
    let matchesPayment = true;
    if (filterPaymentMethod !== "ALL") {
      matchesPayment = order.paymentMethod === filterPaymentMethod;
    }

    return inDateRange && matchesType && matchesPayment;
  }), [orders, startDate, endDate, filterType, filterPaymentMethod]);

  const filteredExpenses = useMemo(() => expenses.filter((expense) => {
    const expenseDate = toLocalDateString(expense.date);
    const inDateRange = (!startDate || expenseDate >= startDate) && (!endDate || expenseDate <= endDate);
    return inDateRange;
  }), [expenses, startDate, endDate]);

  // --- Metrics Calculations (memoized) ---
  const { totalRevenue, totalExpense, netProfit, completedTransactionsCount } = useMemo(() => {
    const rev = filteredOrders.reduce((sum, o) => sum + o.totalPaid, 0);
    const exp = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    return {
      totalRevenue: rev,
      totalExpense: exp,
      netProfit: rev - exp,
      completedTransactionsCount: filteredOrders.filter((o) => o.status === "COMPLETED" || o.status === "READY").length,
    };
  }, [filteredOrders, filteredExpenses]);

  // --- Chart 1: Cash Flow Line Chart Data (memoized) ---
  const cashFlowChartData = useMemo(() => {
    const dailyDataMap: Record<string, { date: string; Pendapatan: number; Pengeluaran: number }> = {};
    
    // Fill all days between start and end date
    if (startDate && endDate) {
      const start = new Date(`${startDate}T00:00:00`);
      const end = new Date(`${endDate}T00:00:00`);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = toLocalDateString(d);
        const dateLabel = `${d.getDate()} ${d.toLocaleString("id-ID", { month: "short" })}`;
        dailyDataMap[dateStr] = {
          date: dateLabel,
          Pendapatan: 0,
          Pengeluaran: 0,
        };
      }
    }

    // Populate revenues
    filteredOrders.forEach((o) => {
      const dateStr = toLocalDateString(o.createdAt);
      if (dailyDataMap[dateStr]) {
        dailyDataMap[dateStr].Pendapatan += o.totalPaid;
      }
    });

    // Populate expenses
    filteredExpenses.forEach((e) => {
      const dateStr = toLocalDateString(e.date);
      if (dailyDataMap[dateStr]) {
        dailyDataMap[dateStr].Pengeluaran += e.amount;
      }
    });

    return Object.values(dailyDataMap);
  }, [filteredOrders, filteredExpenses, startDate, endDate]);

  // --- Chart 2: Donut Chart & Tables Data (memoized) ---
  const { serviceRevenue, partRevenue, otherRevenue, serviceTxCount, partTxCount, otherTxCount, categoryTotal, donutChartData } = useMemo(() => {
    let svcRev = 0;
    let prtRev = 0;
    let othRev = 0;
    let svcTx = 0;
    let prtTx = 0;
    let othTx = 0;

    filteredOrders.forEach((o) => {
      let hasService = false;
      let hasPart = false;

      o.orderItems.forEach((item) => {
        const val = item.totalPrice;
        if (item.itemType === "service") {
          svcRev += val;
          hasService = true;
        } else if (item.itemType === "part") {
          prtRev += val;
          hasPart = true;
        } else {
          othRev += val;
        }
      });

      if (hasService && hasPart) {
        svcTx++;
        prtTx++;
      } else if (hasPart) {
        prtTx++;
      } else if (hasService) {
        svcTx++;
      } else {
        othTx++;
      }
    });

    // Reconcile values to match actual cash receipts
    const calcTotal = svcRev + prtRev + othRev;
    if (totalRevenue > calcTotal && calcTotal > 0) {
      const diff = totalRevenue - calcTotal;
      svcRev += diff * 0.6;
      prtRev += diff * 0.3;
      othRev += diff * 0.1;
    } else if (calcTotal === 0 && totalRevenue > 0) {
      svcRev = totalRevenue;
      svcTx = filteredOrders.length;
    }

    const catTotal = svcRev + prtRev + othRev;
    const getPercentage = (val: number) => {
      if (catTotal === 0) {
        return 0;
      }
      return Math.round((val / catTotal) * 100);
    };

    const donut = [
      { name: "Servis", value: svcRev, color: "#111827", percent: getPercentage(svcRev) },
      { name: "Spare Part", value: prtRev, color: "#4b5563", percent: getPercentage(prtRev) },
      { name: "Lain-lain", value: othRev, color: "#9ca3af", percent: getPercentage(othRev) },
    ].filter((c) => c.value > 0);

    return {
      serviceRevenue: svcRev,
      partRevenue: prtRev,
      otherRevenue: othRev,
      serviceTxCount: svcTx,
      partTxCount: prtTx,
      otherTxCount: othTx,
      categoryTotal: catTotal,
      donutChartData: donut,
    };
  }, [filteredOrders, totalRevenue]);

  // --- Expenses breakdown (memoized) ---
  const { purchasePartExpense, purchasePartCount, operationalExpense, operationalCount, salaryExpense, salaryCount, otherExpense, otherCount } = useMemo(() => {
    let purchasePartExpense = 0;
    let purchasePartCount = 0;
    let operationalExpense = 0;
    let operationalCount = 0;
    let salaryExpense = 0;
    let salaryCount = 0;
    let otherExpense = 0;
    let otherCount = 0;

    filteredExpenses.forEach((e) => {
      const desc = e.description.toLowerCase();
      const cat = e.category.toLowerCase();
      const amt = e.amount;

      if (desc.includes("gaji") || desc.includes("payroll") || desc.includes("komisi") || cat.includes("gaji") || cat.includes("komisi")) {
        salaryExpense += amt;
        salaryCount++;
      } else if (desc.includes("spare") || desc.includes("part") || desc.includes("suku cadang") || cat.includes("spare") || cat.includes("part")) {
        purchasePartExpense += amt;
        purchasePartCount++;
      } else if (desc.includes("operasional") || desc.includes("listrik") || desc.includes("air") || cat.includes("operasional")) {
        operationalExpense += amt;
        operationalCount++;
      } else {
        otherExpense += amt;
        otherCount++;
      }
    });

    return {
      purchasePartExpense,
      purchasePartCount,
      operationalExpense,
      operationalCount,
      salaryExpense,
      salaryCount,
      otherExpense,
      otherCount,
    };
  }, [filteredExpenses]);

  // --- Memoized Export Data ---
  const combinedExportData = useMemo<CombinedFinancialExportData>(() => ({
    period: `${formatIndonesianDate(startDate)} - ${formatIndonesianDate(endDate)}`,
    totalRevenue,
    totalExpense,
    netIncome: netProfit,
    totalOrders: filteredOrders.length,
    orders: filteredOrders.map((o) => ({
      id: o.id,
      date: o.createdAt,
      customerName: o.custName,
      vehicle: o.vehicle,
      plateNumber: o.plateNumber || "-",
      serviceType: o.orderItems?.map((item) => item.itemName).join(", ") || "Lain-lain",
      mechanic: o.mechanic?.name || "-",
      status: o.status,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      totalAmount: o.totalPrice,
    })),
    expenses: filteredExpenses.map((e) => ({
      date: e.date,
      description: e.description,
      category: e.category,
      source: e.source,
      amount: e.amount,
    })),
    incomeStatementAccounts: reportData?.incomeStatement
      ? {
          revenues: reportData.incomeStatement.revenues.map((acc) => ({
            code: acc.code,
            name: acc.name,
            balance: acc.balance,
          })),
          expenses: reportData.incomeStatement.expenses.map((acc) => ({
            code: acc.code,
            name: acc.name,
            balance: acc.balance,
          })),
        }
      : undefined,
  }), [filteredOrders, filteredExpenses, totalRevenue, totalExpense, netProfit, startDate, endDate, reportData]);

  const cashFlowExportData = useMemo<CashFlowData | null>(() => {
    if (!reportData?.cashFlowStatement) {
      return null;
    }
    return {
      period: `${formatIndonesianDate(startDate)} - ${formatIndonesianDate(endDate)}`,
      beginningCash: reportData.cashFlowStatement.beginningCash,
      inflowRevenue: reportData.cashFlowStatement.inflowRevenue,
      inflowOther: reportData.cashFlowStatement.inflowOther,
      totalInflow: reportData.cashFlowStatement.totalInflow,
      outflowParts: reportData.cashFlowStatement.outflowParts,
      outflowOperating: reportData.cashFlowStatement.outflowOperating,
      outflowOther: reportData.cashFlowStatement.outflowOther,
      totalOutflow: reportData.cashFlowStatement.totalOutflow,
      netChange: reportData.cashFlowStatement.netChange,
      endingCash: reportData.cashFlowStatement.endingCash,
      transactions: reportData.cashFlowStatement.transactions.map((t) => ({
        date: t.date,
        description: t.description,
        reference: t.reference,
        inflow: t.inflow,
        outflow: t.outflow,
        classification: t.classification,
        balance: t.balance,
      })),
    };
  }, [reportData, startDate, endDate]);

  // --- Early returns (after all hooks) ---
  if (loading || !isMounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
        <p className="text-destructive font-medium">{error}</p>
        <Button
          onClick={handleRetry}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" /> Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={["OWNER"]}>
      <div className="min-h-screen bg-background text-foreground">
        <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">
        
          {/* Header & Breadcrumb */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-card/60 border border-border p-6 rounded-2xl shadow-sm backdrop-blur-sm">
            <div>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2 font-medium">
                <span>Beranda</span>
                <span>&gt;</span>
                <span className="text-foreground">Laporan Keuangan</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
                Laporan Keuangan
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Pantau seluruh ringkasan laba rugi, rincian pendapatan, pengeluaran operasional, dan arus kas dalam satu halaman.
              </p>
            </div>

            {/* Download Report Actions */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {cashFlowExportData && (
                <ExportButton
                  title={`Laporan_Arus_Kas_${startDate}_to_${endDate}`}
                  label="Unduh Arus Kas"
                  variant="outline"
                  tooltip="Unduh Laporan Mutasi & Arus Kas"
                  className="h-10 px-4 font-semibold text-xs shadow-sm"
                  onExport={async (format, orientation) => {
                    if (!cashFlowExportData) {
                      return new Blob([]);
                    }
                    return await exportCashFlow(cashFlowExportData, format, orientation);
                  }}
                />
              )}

              <ExportButton
                title={`Laporan_Keuangan_${startDate}_to_${endDate}`}
                label="Unduh Laporan Keuangan"
                variant="default"
                tooltip="Unduh Rekap Laporan Pendapatan & Pengeluaran"
                className="h-10 px-4 font-semibold text-xs shadow-sm"
                onExport={async (format, orientation) => {
                  return await exportCombinedFinancialReport(combinedExportData, format, orientation);
                }}
              />
            </div>
          </div>

          {/* Metrics Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Revenue */}
            <Card className="border border-border/60 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden rounded-xl">
              <CardContent className="p-5 flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Pendapatan</p>
                  <h3 className="text-2xl font-extrabold text-foreground mt-1">{formatIDR(totalRevenue)}</h3>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {filteredOrders.length} transaksi masuk
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Total Expenses */}
            <Card className="border border-border/60 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden rounded-xl">
              <CardContent className="p-5 flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Pengeluaran</p>
                  <h3 className="text-2xl font-extrabold text-foreground mt-1">{formatIDR(totalExpense)}</h3>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {filteredExpenses.length} transaksi keluar
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Net Profit */}
            <Card className="border border-border/60 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden rounded-xl">
              <CardContent className="p-5 flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Laba Rugi</p>
                  <h3 className={`text-2xl font-extrabold mt-1 ${netProfit >= 0 ? "text-foreground" : "text-rose-600"}`}>
                    {formatIDR(netProfit)}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {netProfit >= 0 ? "Surplus" : "Defisit"} periode ini
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>

            {/* Card 4: Total Transactions */}
            <Card className="border border-border/60 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden rounded-xl">
              <CardContent className="p-5 flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Transaksi</p>
                  <h3 className="text-3xl font-extrabold text-foreground mt-1">{completedTransactionsCount}</h3>
                  <p className="text-xs text-muted-foreground mt-1.5">Transaksi selesai</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Interactive Filter Row */}
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center bg-card border border-border p-4 rounded-xl shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              {/* Start Date */}
              <div className="flex-1 space-y-1">
                <Label className="text-xs font-bold text-muted-foreground">Mulai Tanggal</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-background border-input h-10 text-xs rounded-lg shadow-sm"
                />
              </div>

              {/* End Date */}
              <div className="flex-1 space-y-1">
                <Label className="text-xs font-bold text-muted-foreground">Sampai Tanggal</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-background border-input h-10 text-xs rounded-lg shadow-sm"
                />
              </div>
            </div>

            {/* Dropdown 1: Transaction Type */}
            <div className="w-full lg:w-48 space-y-1">
              <Label className="text-xs font-bold text-muted-foreground">Jenis Transaksi</Label>
              <Select
                value={filterType}
                onValueChange={(val: "ALL" | "SERVICE" | "PART" | "OTHER") => setFilterType(val)}
              >
                <SelectTrigger className="bg-background border-input h-10 text-xs rounded-lg">
                  <SelectValue placeholder="Semua Jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Jenis</SelectItem>
                  <SelectItem value="SERVICE">Servis saja</SelectItem>
                  <SelectItem value="PART">Spare Part saja</SelectItem>
                  <SelectItem value="OTHER">Lain-lain</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dropdown 2: Payment Method */}
            <div className="w-full lg:w-56 space-y-1">
              <Label className="text-xs font-bold text-muted-foreground">Metode Pembayaran</Label>
              <Select
                value={filterPaymentMethod}
                onValueChange={(val: "ALL" | "CASH" | "TRANSFER" | "QRIS" | "CARD") => setFilterPaymentMethod(val)}
              >
                <SelectTrigger className="bg-background border-input h-10 text-xs rounded-lg">
                  <SelectValue placeholder="Semua Metode Pembayaran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Metode Pembayaran</SelectItem>
                  <SelectItem value="CASH">Tunai</SelectItem>
                  <SelectItem value="TRANSFER">Transfer Bank</SelectItem>
                  <SelectItem value="QRIS">QRIS</SelectItem>
                  <SelectItem value="CARD">Kartu Kredit/Debit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2 pt-5">
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="h-10 px-4 rounded-lg flex items-center gap-2 border-input shadow-sm text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>

          {/* SECTION 1: Ikhtisar Laba Rugi */}
          <div className="space-y-4 pt-2">
            <SectionHeader
              icon={<FileText className="h-5 w-5" />}
              iconBg="bg-primary/10 text-primary"
              title="1. Ikhtisar Laba Rugi (Income Statement)"
              subtitle="Struktur akun pendapatan, beban operasional, dan kalkulasi laba bersih"
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Accounts Table */}
              <Card className="border border-border bg-card shadow-sm rounded-xl overflow-hidden">
                <CardHeader className="p-5 border-b border-border/60">
                  <CardTitle className="text-base font-bold text-foreground">Akun Pendapatan (Revenues)</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Saldo seluruh akun pendapatan pada periode terpilih</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border/80 font-bold text-muted-foreground">
                        <th className="px-5 py-3 text-left">Kode</th>
                        <th className="px-5 py-3 text-left">Nama Akun</th>
                        <th className="px-5 py-3 text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {reportData?.incomeStatement.revenues && reportData.incomeStatement.revenues.length > 0 ? (
                        reportData.incomeStatement.revenues.map((acc) => (
                          <tr key={acc.code} className="hover:bg-muted/10 font-medium">
                            <td className="px-5 py-3 text-primary font-semibold">{acc.code}</td>
                            <td className="px-5 py-3 text-foreground font-semibold">{acc.name}</td>
                            <td className="px-5 py-3 text-right text-emerald-600 font-bold">{formatIDR(acc.balance)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-5 py-8 text-center text-muted-foreground font-semibold">
                            Belum ada data pendapatan
                          </td>
                        </tr>
                      )}
                      <tr className="bg-muted/30 border-t border-border font-extrabold text-foreground">
                        <td colSpan={2} className="px-5 py-3">Total Pendapatan</td>
                        <td className="px-5 py-3 text-right text-emerald-600 dark:text-emerald-400">
                          {formatIDR(reportData?.incomeStatement.totalRevenue || 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Expense Accounts Table */}
              <Card className="border border-border bg-card shadow-sm rounded-xl overflow-hidden">
                <CardHeader className="p-5 border-b border-border/60">
                  <CardTitle className="text-base font-bold text-foreground">Akun Beban & Biaya (Expenses)</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Saldo seluruh akun beban operasional dan HPP pada periode terpilih</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border/80 font-bold text-muted-foreground">
                        <th className="px-5 py-3 text-left">Kode</th>
                        <th className="px-5 py-3 text-left">Nama Akun</th>
                        <th className="px-5 py-3 text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {reportData?.incomeStatement.expenses && reportData.incomeStatement.expenses.length > 0 ? (
                        reportData.incomeStatement.expenses.map((acc) => (
                          <tr key={acc.code} className="hover:bg-muted/10 font-medium">
                            <td className="px-5 py-3 text-primary font-semibold">{acc.code}</td>
                            <td className="px-5 py-3 text-foreground font-semibold">{acc.name}</td>
                            <td className="px-5 py-3 text-right text-rose-600 font-bold">{formatIDR(acc.balance)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-5 py-8 text-center text-muted-foreground font-semibold">
                            Belum ada data beban
                          </td>
                        </tr>
                      )}
                      <tr className="bg-muted/30 border-t border-border font-extrabold text-foreground">
                        <td colSpan={2} className="px-5 py-3">Total Beban</td>
                        <td className="px-5 py-3 text-right text-rose-600 dark:text-rose-400">
                          {formatIDR(reportData?.incomeStatement.totalExpense || 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>

            {/* Income Statement Summary Card */}
            <Card className="border border-border bg-card shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="p-5 border-b border-border/60 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-foreground">Ringkasan Laba Rugi Bersih (Net Income)</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Perhitungan Laba Bersih = Total Pendapatan - Total Beban</CardDescription>
                </div>
                <Badge
                  className={`font-extrabold text-xs px-3 py-1 ${
                    (reportData?.incomeStatement.netIncome || 0) >= 0
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                  }`}
                >
                  {(reportData?.incomeStatement.netIncome || 0) >= 0 ? "PROFIT (LABA)" : "LOSS (RUGI)"}
                </Badge>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center justify-around gap-6 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Total Pendapatan</p>
                    <p className="text-xl font-extrabold text-emerald-600 mt-1">{formatIDR(reportData?.incomeStatement.totalRevenue || 0)}</p>
                  </div>
                  <div className="text-2xl font-bold text-muted-foreground">-</div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Total Beban</p>
                    <p className="text-xl font-extrabold text-rose-600 mt-1">{formatIDR(reportData?.incomeStatement.totalExpense || 0)}</p>
                  </div>
                  <div className="text-2xl font-bold text-muted-foreground">=</div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold">Laba / (Rugi) Bersih</p>
                    <p className={`text-2xl font-extrabold mt-1 ${(reportData?.incomeStatement.netIncome || 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {formatIDR(reportData?.incomeStatement.netIncome || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SECTION 2: Laporan Pendapatan (Pemasukan) */}
          <div className="space-y-4 pt-4">
            <SectionHeader
              icon={<TrendingUp className="h-5 w-5" />}
              iconBg="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              title="2. Laporan Pendapatan & Pemasukan"
              subtitle="Komposisi kategori pendapatan dan riwayat transaksi order/servis masuk"
              badge={
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200/60 font-bold w-fit">
                  {filteredOrders.length} Transaksi Masuk ({formatIDR(totalRevenue)})
                </Badge>
              }
            />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Chart Left: Revenue by Category */}
              <Card className="lg:col-span-5 border border-border bg-card shadow-sm rounded-xl overflow-hidden">
                <CardHeader className="p-5 border-b border-border/60">
                  <CardTitle className="text-base font-bold text-foreground">Pendapatan per Kategori</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Rincian pendapatan berdasarkan jenis layanan</CardDescription>
                </CardHeader>
                <CardContent className="p-6 flex flex-col items-center justify-center">
                  {categoryTotal > 0 ? (
                    <div className="w-full flex flex-col items-center gap-6">
                      <div className="relative h-[180px] w-[180px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={donutChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {donutChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatIDR(Number(value))} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute text-center">
                          <p className="text-[10px] uppercase font-semibold text-muted-foreground">Total</p>
                          <p className="text-sm font-extrabold text-foreground mt-0.5">{formatIDR(categoryTotal)}</p>
                        </div>
                      </div>

                      {/* Legend Lists */}
                      <div className="w-full space-y-2.5 text-xs">
                        {donutChartData.map((entry, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                              <span className="font-semibold text-muted-foreground">{entry.name}</span>
                            </div>
                            <span className="font-bold text-foreground">{formatIDR(entry.value)} ({entry.percent}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-20 text-center text-muted-foreground text-xs font-semibold">
                      Belum ada data pendapatan
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Table Right: Revenue Summary per Category */}
              <Card className="lg:col-span-7 border border-border bg-card shadow-sm rounded-xl overflow-hidden">
                <CardHeader className="p-5 border-b border-border/60 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">Rincian Pendapatan per Kategori</CardTitle>
                    <CardDescription className="text-xs mt-0.5"> breakdown per-kategori jasa servis dan penjualan sparepart </CardDescription>
                  </div>
                  <Button
                    variant="link"
                    className="text-xs font-bold text-primary hover:cursor-pointer p-0 h-auto"
                    asChild
                  >
                    <Link href="/admin/transactions">Lihat Semua</Link>
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border/80 font-bold text-muted-foreground">
                        <th className="px-5 py-3 text-left">Jenis Pendapatan</th>
                        <th className="px-5 py-3 text-center">Jumlah Transaksi</th>
                        <th className="px-5 py-3 text-right">Total Pendapatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      <tr className="hover:bg-muted/10 font-semibold">
                        <td className="px-5 py-3 flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-muted-foreground" /> Servis
                        </td>
                        <td className="px-5 py-3 text-center text-muted-foreground">{serviceTxCount} transaksi</td>
                        <td className="px-5 py-3 text-right text-foreground">{formatIDR(serviceRevenue)}</td>
                      </tr>
                      <tr className="hover:bg-muted/10 font-semibold">
                        <td className="px-5 py-3 flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" /> Spare Part
                        </td>
                        <td className="px-5 py-3 text-center text-muted-foreground">{partTxCount} transaksi</td>
                        <td className="px-5 py-3 text-right text-foreground">{formatIDR(partRevenue)}</td>
                      </tr>
                      <tr className="hover:bg-muted/10 font-semibold">
                        <td className="px-5 py-3 flex items-center gap-2">
                          <Layers className="h-4 w-4 text-muted-foreground" /> Lain-lain
                        </td>
                        <td className="px-5 py-3 text-center text-muted-foreground">{otherTxCount} transaksi</td>
                        <td className="px-5 py-3 text-right text-foreground">{formatIDR(otherRevenue)}</td>
                      </tr>
                      <tr className="bg-muted/30 border-t border-border font-extrabold text-foreground">
                        <td className="px-5 py-3">Total</td>
                        <td className="px-5 py-3 text-center">{filteredOrders.length} transaksi</td>
                        <td className="px-5 py-3 text-right text-primary">{formatIDR(totalRevenue)}</td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>

            {/* Income Transactions Table */}
            <Card className="border border-border bg-card shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="p-5 border-b border-border/60">
                <CardTitle className="text-base font-bold text-foreground">Daftar Transaksi Pemasukan (Pendapatan)</CardTitle>
                <CardDescription className="text-xs mt-0.5">Daftar semua pesanan/servis masuk pada periode terpilih</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border/80 font-bold text-muted-foreground">
                        <th className="px-5 py-3 text-left">Tanggal</th>
                        <th className="px-5 py-3 text-left">ID Order</th>
                        <th className="px-5 py-3 text-left">Pelanggan</th>
                        <th className="px-5 py-3 text-left">Kendaraan</th>
                        <th className="px-5 py-3 text-center">Metode Bayar</th>
                        <th className="px-5 py-3 text-center">Status Bayar</th>
                        <th className="px-5 py-3 text-right">Total Transaksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredOrders.length > 0 ? (
                        filteredOrders.map((o) => (
                          <tr key={o.id} className="hover:bg-muted/10 font-medium">
                            <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                              {formatIndonesianDate(o.createdAt)}
                            </td>
                            <td className="px-5 py-3 font-semibold text-primary">
                              <Link href={`/admin/transactions?search=${o.id}`}>
                                {o.id.slice(-8).toUpperCase()}
                              </Link>
                            </td>
                            <td className="px-5 py-3 text-foreground font-semibold">
                              {o.custName}
                            </td>
                            <td className="px-5 py-3 text-muted-foreground">
                              {o.vehicle} {o.plateNumber ? `(${o.plateNumber})` : ""}
                            </td>
                            <td className="px-5 py-3 text-center">
                              <Badge variant="outline" className="bg-muted font-bold text-[10px] py-0.5 px-2">
                                {o.paymentMethod}
                              </Badge>
                            </td>
                            <td className="px-5 py-3 text-center">
                              <Badge
                                className={`font-bold text-[10px] py-0.5 px-2 ${
                                  o.paymentStatus === "PAID"
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50"
                                    : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50"
                                }`}
                              >
                                {o.paymentStatus === "PAID" ? "Lunas" : "Sebagian / Belum"}
                              </Badge>
                            </td>
                            <td className="px-5 py-3 text-right text-foreground font-bold">
                              {formatIDR(o.totalPaid)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground font-semibold">
                            Tidak ada transaksi pemasukan pada periode ini
                          </td>
                        </tr>
                      )}
                      <tr className="bg-muted/30 border-t border-border font-extrabold text-foreground">
                        <td colSpan={5} className="px-5 py-3">Total Pemasukan Kas</td>
                        <td className="px-5 py-3 text-center text-muted-foreground">{filteredOrders.length} transaksi</td>
                        <td className="px-5 py-3 text-right text-emerald-600 dark:text-emerald-400">
                          {formatIDR(totalRevenue)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SECTION 3: Laporan Pengeluaran */}
          <div className="space-y-4 pt-4">
            <SectionHeader
              icon={<TrendingDown className="h-5 w-5" />}
              iconBg="bg-rose-500/10 text-rose-600 dark:text-rose-400"
              title="3. Laporan Pengeluaran (Beban & Biaya)"
              subtitle="Rincian breakdown kategori pengeluaran dan daftar transaksi biaya operasional"
              badge={
                <Badge variant="outline" className="bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200/60 font-bold w-fit">
                  {filteredExpenses.length} Transaksi Keluar ({formatIDR(totalExpense)})
                </Badge>
              }
            />
            {/* Table Top: Expense Category Breakdown */}
            <Card className="border border-border bg-card shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="p-5 border-b border-border/60 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-foreground">Rincian Pengeluaran per Kategori</CardTitle>
                  <CardDescription className="text-xs mt-0.5"> breakdown pengeluaran operasional, pembelian sparepart, dan gaji karyawan </CardDescription>
                </div>
                <Button
                  variant="link"
                  className="text-xs font-bold text-primary hover:cursor-pointer p-0 h-auto"
                  asChild
                >
                  <Link href="/admin/expenses">Lihat Semua</Link>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/80 font-bold text-muted-foreground">
                      <th className="px-5 py-3 text-left">Jenis Pengeluaran</th>
                      <th className="px-5 py-3 text-center">Jumlah Transaksi</th>
                      <th className="px-5 py-3 text-right">Total Pengeluaran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    <tr className="hover:bg-muted/10 font-semibold">
                      <td className="px-5 py-3 flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" /> Pembelian Spare Part
                      </td>
                      <td className="px-5 py-3 text-center text-muted-foreground">{purchasePartCount} transaksi</td>
                      <td className="px-5 py-3 text-right text-foreground">{formatIDR(purchasePartExpense)}</td>
                    </tr>
                    <tr className="hover:bg-muted/10 font-semibold">
                      <td className="px-5 py-3 flex items-center gap-2">
                        <Layers className="h-4 w-4 text-muted-foreground" /> Operasional
                      </td>
                      <td className="px-5 py-3 text-center text-muted-foreground">{operationalCount} transaksi</td>
                      <td className="px-5 py-3 text-right text-foreground">{formatIDR(operationalExpense)}</td>
                    </tr>
                    <tr className="hover:bg-muted/10 font-semibold">
                      <td className="px-5 py-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" /> Gaji Karyawan
                      </td>
                      <td className="px-5 py-3 text-center text-muted-foreground">{salaryCount} transaksi</td>
                      <td className="px-5 py-3 text-right text-foreground">{formatIDR(salaryExpense)}</td>
                    </tr>
                    {otherExpense > 0 && (
                      <tr className="hover:bg-muted/10 font-semibold">
                        <td className="px-5 py-3 flex items-center gap-2">
                          <Layers className="h-4 w-4 text-muted-foreground" /> Lain-lain
                        </td>
                        <td className="px-5 py-3 text-center text-muted-foreground">{otherCount} transaksi</td>
                        <td className="px-5 py-3 text-right text-foreground">{formatIDR(otherExpense)}</td>
                      </tr>
                    )}
                    <tr className="bg-muted/30 border-t border-border font-extrabold text-foreground">
                      <td className="px-5 py-3">Total</td>
                      <td className="px-5 py-3 text-center">{filteredExpenses.length} transaksi</td>
                      <td className="px-5 py-3 text-right text-primary">{formatIDR(totalExpense)}</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Expense Detailed Table */}
            <Card className="border border-border bg-card shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="p-5 border-b border-border/60">
                <CardTitle className="text-base font-bold text-foreground">Daftar Transaksi Pengeluaran</CardTitle>
                <CardDescription className="text-xs mt-0.5">Daftar semua pengeluaran operasional, payroll, dan persediaan pada periode terpilih</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border/80 font-bold text-muted-foreground">
                        <th className="px-5 py-3 text-left">Tanggal</th>
                        <th className="px-5 py-3 text-left">Deskripsi</th>
                        <th className="px-5 py-3 text-left">Kategori</th>
                        <th className="px-5 py-3 text-left">Sumber Dana</th>
                        <th className="px-5 py-3 text-right">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredExpenses.length > 0 ? (
                        filteredExpenses.map((e) => (
                          <tr key={e.id} className="hover:bg-muted/10 font-medium">
                            <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                              {formatIndonesianDate(e.date)}
                            </td>
                            <td className="px-5 py-3 text-foreground font-semibold">
                              {e.description}
                            </td>
                            <td className="px-5 py-3">
                              <Badge variant="outline" className="font-bold text-[10px] py-0.5 px-2">
                                {e.category}
                              </Badge>
                            </td>
                            <td className="px-5 py-3 text-muted-foreground">
                              {e.source}
                            </td>
                            <td className="px-5 py-3 text-right text-rose-600 font-bold">
                              {formatIDR(e.amount)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground font-semibold">
                            Tidak ada transaksi pengeluaran pada periode ini
                          </td>
                        </tr>
                      )}
                      <tr className="bg-muted/30 border-t border-border font-extrabold text-foreground">
                        <td colSpan={3} className="px-5 py-3">Total Pengeluaran Kas</td>
                        <td className="px-5 py-3 text-center text-muted-foreground">{filteredExpenses.length} transaksi</td>
                        <td className="px-5 py-3 text-right text-rose-600 dark:text-rose-400">
                          {formatIDR(totalExpense)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SECTION 4: Laporan Arus Kas */}
          <div className="space-y-4 pt-4">
            <SectionHeader
              icon={<Wallet className="h-5 w-5" />}
              iconBg="bg-blue-500/10 text-blue-600 dark:text-blue-400"
              title="4. Laporan Arus Kas (Cash Flow Statement)"
              subtitle="Ringkasan arus kas, grafik pergerakan harian, dan mutasi saldo"
            />
            {/* Cash Flow Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border border-border bg-card/60 shadow-sm rounded-xl">
                <CardContent className="p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Saldo Awal Kas & Bank</p>
                  <h3 className="text-xl font-extrabold text-foreground mt-1">
                    {formatIDR(reportData?.cashFlowStatement?.beginningCash || 0)}
                  </h3>
                </CardContent>
              </Card>
              <Card className="border border-border bg-card/60 shadow-sm rounded-xl">
                <CardContent className="p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Total Kas Masuk</p>
                  <h3 className="text-xl font-extrabold text-emerald-600 mt-1">
                    {formatIDR(reportData?.cashFlowStatement?.totalInflow || 0)}
                  </h3>
                </CardContent>
              </Card>
              <Card className="border border-border bg-card/60 shadow-sm rounded-xl">
                <CardContent className="p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Total Kas Keluar</p>
                  <h3 className="text-xl font-extrabold text-rose-600 mt-1">
                    {formatIDR(reportData?.cashFlowStatement?.totalOutflow || 0)}
                  </h3>
                </CardContent>
              </Card>
              <Card className="border border-border bg-card/60 shadow-sm rounded-xl">
                <CardContent className="p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Saldo Akhir Kas & Bank</p>
                  <h3 className="text-xl font-extrabold text-blue-600 mt-1">
                    {formatIDR(reportData?.cashFlowStatement?.endingCash || 0)}
                  </h3>
                </CardContent>
              </Card>
            </div>

            {/* Line Chart & Cash Flow Statement Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Line Chart */}
              <Card className="lg:col-span-7 border border-border bg-card shadow-sm rounded-xl overflow-hidden">
                <CardHeader className="p-5 border-b border-border/60">
                  <CardTitle className="text-base font-bold text-foreground">Grafik Arus Kas Harian</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Perbandingan grafik pendapatan dan pengeluaran harian</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={cashFlowChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#e5e7eb"
                        />
                        <XAxis
                          dataKey="date"
                          stroke="#9ca3af"
                          fontSize={11}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="#9ca3af"
                          fontSize={11}
                          tickLine={false}
                          tickFormatter={(value) => (value >= 1000000 ? `${value / 1000000}jt` : value >= 1000 ? `${value / 1000}rb` : value)}
                        />
                        <Tooltip formatter={(value) => [formatIDR(Number(value)), ""]} contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
                        <Legend
                          verticalAlign="top"
                          height={36}
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ fontSize: "12px" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Pendapatan"
                          stroke="#111827"
                          strokeWidth={2.5}
                          activeDot={{ r: 6 }}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="Pengeluaran"
                          stroke="#9ca3af"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Right: Statement of Cash Flows (Direct Method) */}
              <Card className="lg:col-span-5 border border-border bg-card shadow-sm rounded-xl overflow-hidden">
                <CardHeader className="p-5 border-b border-border/60">
                  <CardTitle className="text-base font-bold text-foreground">Laporan Arus Kas (Metode Langsung)</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Klasifikasi arus kas masuk dan keluar dari aktivitas operasional</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4 text-xs font-semibold">
                  <div className="flex justify-between border-b pb-2 text-foreground font-bold">
                    <span>SALDO AWAL KAS & BANK</span>
                    <span>{formatIDR(reportData?.cashFlowStatement?.beginningCash || 0)}</span>
                  </div>

                  <div className="space-y-2">
                    <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Arus Kas Masuk (Inflow):</p>
                    <div className="flex justify-between pl-3 text-muted-foreground">
                      <span>Penerimaan Kas dari Pelanggan</span>
                      <span className="text-foreground">{formatIDR(reportData?.cashFlowStatement?.inflowRevenue || 0)}</span>
                    </div>
                    <div className="flex justify-between pl-3 text-muted-foreground border-b pb-1">
                      <span>Penerimaan Kas Lainnya</span>
                      <span className="text-foreground">{formatIDR(reportData?.cashFlowStatement?.inflowOther || 0)}</span>
                    </div>
                    <div className="flex justify-between pl-1 font-bold text-emerald-600">
                      <span>Total Arus Kas Masuk</span>
                      <span>{formatIDR(reportData?.cashFlowStatement?.totalInflow || 0)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Arus Kas Keluar (Outflow):</p>
                    <div className="flex justify-between pl-3 text-muted-foreground">
                      <span>Pembayaran Pembelian Spare Part</span>
                      <span className="text-foreground">({formatIDR(reportData?.cashFlowStatement?.outflowParts || 0)})</span>
                    </div>
                    <div className="flex justify-between pl-3 text-muted-foreground">
                      <span>Pembayaran Operasional & Beban</span>
                      <span className="text-foreground">({formatIDR(reportData?.cashFlowStatement?.outflowOperating || 0)})</span>
                    </div>
                    <div className="flex justify-between pl-3 text-muted-foreground border-b pb-1">
                      <span>Pengeluaran Kas Lainnya</span>
                      <span className="text-foreground">({formatIDR(reportData?.cashFlowStatement?.outflowOther || 0)})</span>
                    </div>
                    <div className="flex justify-between pl-1 font-bold text-rose-600">
                      <span>Total Arus Kas Keluar</span>
                      <span>({formatIDR(reportData?.cashFlowStatement?.totalOutflow || 0)})</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t flex justify-between text-foreground font-bold">
                    <span>Kenaikan / (Penurunan) Kas Bersih</span>
                    <span className={reportData?.cashFlowStatement?.netChange && reportData.cashFlowStatement.netChange >= 0 ? "text-emerald-600" : "text-rose-600"}>
                      {formatIDR(reportData?.cashFlowStatement?.netChange || 0)}
                    </span>
                  </div>

                  <div className="flex justify-between pt-3 border-t-2 border-double border-foreground text-foreground font-extrabold text-sm">
                    <span>SALDO AKHIR KAS & BANK</span>
                    <span className="text-primary">{formatIDR(reportData?.cashFlowStatement?.endingCash || 0)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Ledger of Cash Transactions (Mutasi Kas) */}
            <Card className="border border-border bg-card shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="p-5 border-b border-border/60">
                <CardTitle className="text-base font-bold text-foreground">Buku Pembantu Mutasi Kas</CardTitle>
                <CardDescription className="text-xs mt-0.5">Catatan historis penerimaan dan pengeluaran kas secara kronologis</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-background border-b border-border z-10 font-bold text-muted-foreground">
                      <tr className="bg-muted/40">
                        <th className="px-4 py-2.5 text-left">Tanggal</th>
                        <th className="px-4 py-2.5 text-left">Deskripsi</th>
                        <th className="px-4 py-2.5 text-center">Kategori</th>
                        <th className="px-4 py-2.5 text-right">Masuk</th>
                        <th className="px-4 py-2.5 text-right">Keluar</th>
                        <th className="px-4 py-2.5 text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {reportData?.cashFlowStatement?.transactions && reportData.cashFlowStatement.transactions.length > 0 ? (
                        reportData.cashFlowStatement.transactions.map((t) => (
                          <tr key={t.id} className="hover:bg-muted/10 font-medium">
                            <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                              {formatIndonesianDate(t.date)}
                            </td>
                            <td className="px-4 py-2 text-foreground font-semibold">
                              {t.description}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <Badge
                                variant="outline"
                                className={`font-bold text-[9px] py-0 px-1.5 ${
                                  t.classification === "REVENUE"
                                    ? "border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400"
                                    : t.classification === "PARTS"
                                    ? "border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400"
                                    : t.classification === "OPERATING"
                                    ? "border-rose-200 text-rose-700 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400"
                                    : "border-gray-200 text-gray-700 bg-gray-50 dark:bg-gray-900 dark:text-gray-400"
                                }`}
                              >
                                {t.classification === "REVENUE"
                                  ? "Pendapatan"
                                  : t.classification === "PARTS"
                                  ? "Spare Part"
                                  : t.classification === "OPERATING"
                                  ? "Operasional"
                                  : "Lain-lain"}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-right text-emerald-600 font-bold">
                              {t.inflow > 0 ? formatIDR(t.inflow) : "-"}
                            </td>
                            <td className="px-4 py-2 text-right text-rose-600 font-bold">
                              {t.outflow > 0 ? formatIDR(t.outflow) : "-"}
                            </td>
                            <td className="px-4 py-2 text-right text-foreground font-bold">
                              {formatIDR(t.balance)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground font-semibold">
                            Belum ada riwayat mutasi kas dalam periode ini
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* BANK ACCOUNTS MANAGER */}
          <div className="pt-4">
            <BankAccountsManager />
          </div>

          <Toaster />
        </div>
      </div>
    </RoleGuard>
);
}

// Reusable Section Header Component
interface SectionHeaderProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
}

function SectionHeader({ icon, iconBg, title, subtitle, badge }: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
      <div className="flex items-center gap-2.5">
        <div className={`p-2 rounded-lg ${iconBg}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {badge}
    </div>
  );
}

// Helper function for Indonesian date formatting
function formatIndonesianDate(dateString?: string | Date | null): string {
  if (!dateString) {
    return "-";
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return "-";
  }
  
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

// Helper function to format Date object to YYYY-MM-DD in local time
function toLocalDateString(dateInput: string | Date | null | undefined): string {
  if (!dateInput) {
    return "";
  }
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) {
    return "";
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}


