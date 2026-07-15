// app/admin/reports/page.tsx - Laporan Keuangan
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleGuard } from "@/components/RoleGuard";
import { getFinancialReports, getGeneralLedger, getOperationalReports } from "@/app/actions/finance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  RefreshCw,
  Calendar,
  Layers,
  Wrench,
  Package,
  Printer,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import { ExportButton } from "@/components/export/ExportButton";
import { exportBalanceSheet } from "@/lib/export/reports/balance-sheet-export";
import { exportIncomeStatement } from "@/lib/export/reports/financial-export";
import type { BalanceSheetData, IncomeStatementData } from "@/lib/export/types";

export default function ReportsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "income" | "balance" | "ledger" | "trial" | "op_revenue" | "op_parts" | "op_expenses" | "op_inventory" | "op_services"
  >("income");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  
  // Data State
  const [reportData, setReportData] = useState<any>(null);
  const [ledgerData, setLedgerData] = useState<any[]>([]);
  const [opData, setOpData] = useState<{
    orders: any[];
    expenses: any[];
    spareParts: any[];
    stockLogs: any[];
  } | null>(null);

  // Period filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
        const [reportsRes, ledgerRes, opRes] = await Promise.all([
            getFinancialReports(),
            getGeneralLedger(),
            getOperationalReports(),
        ]);

        if (reportsRes.success) {
            setReportData(reportsRes.data);
        } else {
            setError(reportsRes.error || "Gagal memuat laporan.");
        }

        if (ledgerRes.success) {
            setLedgerData(ledgerRes.journals || []);
        }

        if (opRes.success && opRes.data) {
            setOpData(opRes.data);
        }
    } catch (err) {
        console.error(err);
        setError("Terjadi kesalahan sistem.");
    }
    setLoading(false);
  }

  const formatIDR = (val: any) => 
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(Number(val) || 0);

  if (loading) {
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
            <Button onClick={fetchData} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" /> Coba Lagi
            </Button>
        </div>
    )
  }

  return (
    <RoleGuard allowedRoles={["OWNER"]}>
      <div className="min-h-screen bg-background p-4 md:p-8 text-foreground">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground">Laporan Keuangan</h1>
            <p className="text-sm md:text-base text-muted-foreground">Overview performa bisnis dan akuntansi</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" onClick={fetchData} className="gap-2 flex-1 md:flex-none">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <ExportButton
            title={`Laporan_${activeTab === "income" ? "Laba_Rugi" : activeTab === "balance" ? "Neraca" : "Keuangan"}`}
            onExport={async (format, orientation) => {
              if (activeTab === "income" && reportData) {
                 const incomeData: IncomeStatementData = {
                    period: "Current Period", // You might want to get actual period range if available
                    revenues: reportData.incomeStatement.revenues.map((acc: any) => ({
                       code: acc.code,
                       name: acc.name,
                       balance: acc.balance
                    })),
                    totalRevenue: reportData.incomeStatement.totalRevenue,
                    expenses: reportData.incomeStatement.expenses.map((acc: any) => ({
                       code: acc.code,
                       name: acc.name,
                       balance: acc.balance
                    })),
                    totalExpense: reportData.incomeStatement.totalExpense,
                    netIncome: reportData.incomeStatement.netIncome
                 };
                 return await exportIncomeStatement(incomeData, format, orientation);
              }
              
              if (activeTab === "balance" && reportData) {
                // Prepare balance sheet data
                const balanceSheetData: BalanceSheetData = {
                  date: new Date(),
                  assets: [
                    {
                      title: "Aset Lancar",
                      accounts: reportData.balanceSheet.assets.map((acc: any) => ({
                        code: acc.code,
                        name: acc.name,
                        balance: acc.balance,
                      })),
                      total: reportData.balanceSheet.totalAsset,
                    },
                  ],
                  liabilities: [
                    {
                      title: "Kewajiban",
                      accounts: reportData.balanceSheet.liabilities.map((acc: any) => ({
                        code: acc.code,
                        name: acc.name,
                        balance: acc.balance,
                      })),
                      total: reportData.balanceSheet.totalLiability,
                    },
                  ],
                  equity: [
                    {
                      title: "Ekuitas",
                      accounts: [
                        ...reportData.balanceSheet.equity.map((acc: any) => ({
                          code: acc.code,
                          name: acc.name,
                          balance: acc.balance,
                        })),
                        {
                          code: "-",
                          name: "Laba Tahun Berjalan",
                          balance: reportData.balanceSheet.netIncome,
                        },
                      ],
                      total: reportData.balanceSheet.totalEquity,
                    },
                  ],
                };
                return await exportBalanceSheet(balanceSheetData, format, orientation);
              }
              // For other tabs, return empty blob for now
              return new Blob([]);
            }}
            variant="default"
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="space-y-4 mb-6">
        <div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Laporan Keuangan & Akuntansi</span>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeTab === "income" ? "default" : "outline"}
              onClick={() => { setActiveTab("income"); setSearchQuery(""); }}
              className="rounded-full whitespace-nowrap text-xs h-8 px-4"
            >
              Laba Rugi
            </Button>
            <Button
              variant={activeTab === "balance" ? "default" : "outline"}
              onClick={() => { setActiveTab("balance"); setSearchQuery(""); }}
              className="rounded-full whitespace-nowrap text-xs h-8 px-4"
            >
              Neraca (Balance Sheet)
            </Button>
            <Button
              variant={activeTab === "trial" ? "default" : "outline"}
              onClick={() => { setActiveTab("trial"); setSearchQuery(""); }}
              className="rounded-full whitespace-nowrap text-xs h-8 px-4"
            >
              Neraca Saldo (COA)
            </Button>
            <Button
              variant={activeTab === "ledger" ? "default" : "outline"}
              onClick={() => { setActiveTab("ledger"); setSearchQuery(""); }}
              className="rounded-full whitespace-nowrap text-xs h-8 px-4"
            >
              Jurnal Umum
            </Button>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Laporan Operasional Bengkel (Sesuai Flowchart)</span>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeTab === "op_revenue" ? "default" : "outline"}
              onClick={() => { setActiveTab("op_revenue"); setSearchQuery(""); }}
              className="rounded-full whitespace-nowrap text-xs h-8 px-4"
            >
              1. Laporan Pendapatan Servis
            </Button>
            <Button
              variant={activeTab === "op_parts" ? "default" : "outline"}
              onClick={() => { setActiveTab("op_parts"); setSearchQuery(""); }}
              className="rounded-full whitespace-nowrap text-xs h-8 px-4"
            >
              2. Penjualan Suku Cadang
            </Button>
            <Button
              variant={activeTab === "op_expenses" ? "default" : "outline"}
              onClick={() => { setActiveTab("op_expenses"); setSearchQuery(""); }}
              className="rounded-full whitespace-nowrap text-xs h-8 px-4"
            >
              3. Laporan Pengeluaran
            </Button>
            <Button
              variant={activeTab === "op_inventory" ? "default" : "outline"}
              onClick={() => { setActiveTab("op_inventory"); setSearchQuery(""); }}
              className="rounded-full whitespace-nowrap text-xs h-8 px-4"
            >
              4. Laporan Persediaan (Inventory)
            </Button>
            <Button
              variant={activeTab === "op_services" ? "default" : "outline"}
              onClick={() => { setActiveTab("op_services"); setSearchQuery(""); }}
              className="rounded-full whitespace-nowrap text-xs h-8 px-4"
            >
              5. Laporan Pengerjaan Servis
            </Button>
          </div>
        </div>
      </div>

      {/* Date Filter Card (Only visible when activeTab is operational) */}
      {activeTab.startsWith("op_") && (
        <Card className="mb-6 bg-card border-border">
          <CardHeader className="py-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> Filter Periode Tanggal Laporan
            </CardTitle>
          </CardHeader>
          <CardContent className="py-3">
            <div className="flex flex-col sm:flex-row items-end gap-4">
              <div className="space-y-1.5 flex-1">
                <Label htmlFor="start-date" className="text-xs text-foreground font-medium">Tanggal Mulai</Label>
                <Input 
                  id="start-date" 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  className="text-xs text-foreground bg-background"
                />
              </div>
              <div className="space-y-1.5 flex-1">
                <Label htmlFor="end-date" className="text-xs text-foreground font-medium">Tanggal Selesai</Label>
                <Input 
                  id="end-date" 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  className="text-xs text-foreground bg-background"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => { setStartDate(""); setEndDate(""); }}
                  className="text-xs h-9 text-foreground"
                >
                  Reset Filter
                </Button>
                <Button 
                  type="button"
                  onClick={() => window.print()}
                  className="text-xs h-9 bg-primary text-primary-foreground gap-1.5"
                >
                  <Printer className="h-4 w-4" /> Cetak Laporan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      <div className="space-y-6">
        {activeTab === "income" && reportData && (
          <div className="grid gap-6 animate-fade-in">
            <Card className="border-t-4 border-t-primary bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Laba Rugi (Income Statement)</CardTitle>
                <p className="text-sm text-muted-foreground">Periode: Current</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Revenue */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-chart-1">
                      <TrendingUp className="h-5 w-5" /> Pendapatan
                    </h3>
                    <div className="overflow-x-auto">
                      <Table className="min-w-[1000px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px] text-muted-foreground">Kode</TableHead>
                            <TableHead className="text-muted-foreground">Nama Akun</TableHead>
                            <TableHead className="text-right text-muted-foreground">Jumlah</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.incomeStatement.revenues.map((acc: any) => (
                            <TableRow key={acc.code} className="hover:bg-muted/50">
                              <TableCell className="w-[100px] font-mono text-muted-foreground">{acc.code}</TableCell>
                              <TableCell className="text-foreground">{acc.name}</TableCell>
                              <TableCell className="text-right font-medium text-foreground">
                                {formatIDR(acc.balance)}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-chart-1/10 font-bold hover:bg-chart-1/20">
                            <TableCell colSpan={2} className="text-foreground">Total Pendapatan</TableCell>
                            <TableCell className="text-right text-chart-1">
                              {formatIDR(reportData.incomeStatement.totalRevenue)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Expense */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-destructive">
                      <TrendingDown className="h-5 w-5" /> Beban & Biaya
                    </h3>
                    <div className="overflow-x-auto">
                      <Table className="min-w-[1000px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px] text-muted-foreground">Kode</TableHead>
                            <TableHead className="text-muted-foreground">Nama Akun</TableHead>
                            <TableHead className="text-right text-muted-foreground">Jumlah</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.incomeStatement.expenses.map((acc: any) => (
                            <TableRow key={acc.code} className="hover:bg-muted/50">
                              <TableCell className="w-[100px] font-mono text-muted-foreground">{acc.code}</TableCell>
                              <TableCell className="text-foreground">{acc.name}</TableCell>
                              <TableCell className="text-right font-medium text-foreground">
                                {formatIDR(acc.balance)}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-destructive/10 font-bold hover:bg-destructive/20">
                            <TableCell colSpan={2} className="text-foreground">Total Beban</TableCell>
                            <TableCell className="text-right text-destructive">
                              {formatIDR(reportData.incomeStatement.totalExpense)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Net Income */}
                  <div className="flex justify-between items-center bg-muted p-4 rounded-lg border border-border">
                    <span className="text-lg font-bold text-foreground">Laba Bersih (Net Income)</span>
                    <span className={`text-2xl font-bold ${
                      reportData.incomeStatement.netIncome >= 0 ? "text-chart-1" : "text-destructive"
                    }`}>
                      {formatIDR(reportData.incomeStatement.netIncome)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "balance" && reportData && (
          <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
            {/* Assets */}
            <Card className="border-t-4 border-t-chart-1 h-fit bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Aktiva (Assets)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px] text-muted-foreground">Kode</TableHead>
                        <TableHead className="text-muted-foreground">Nama Akun</TableHead>
                        <TableHead className="text-right text-muted-foreground">Jumlah</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.balanceSheet.assets.map((acc: any) => (
                        <TableRow key={acc.code} className="hover:bg-muted/50">
                          <TableCell className="font-mono text-xs text-muted-foreground">{acc.code}</TableCell>
                          <TableCell className="text-foreground">{acc.name}</TableCell>
                          <TableCell className="text-right text-foreground">
                            {formatIDR(acc.balance)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted font-bold hover:bg-muted/80">
                        <TableCell colSpan={2} className="text-foreground">Total Aset</TableCell>
                        <TableCell className="text-right text-chart-1">
                          {formatIDR(reportData.balanceSheet.totalAsset)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Liability & Equity */}
            <div className="space-y-6">
              <Card className="border-t-4 border-t-destructive bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Kewajiban (Liabilities)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px] text-muted-foreground">Kode</TableHead>
                          <TableHead className="text-muted-foreground">Nama Akun</TableHead>
                          <TableHead className="text-right text-muted-foreground">Jumlah</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.balanceSheet.liabilities.map((acc: any) => (
                          <TableRow key={acc.code} className="hover:bg-muted/50">
                            <TableCell className="font-mono text-xs text-muted-foreground">{acc.code}</TableCell>
                            <TableCell className="text-foreground">{acc.name}</TableCell>
                            <TableCell className="text-right text-foreground">
                              {formatIDR(acc.balance)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted font-bold hover:bg-muted/80">
                          <TableCell colSpan={2} className="text-foreground">Total Kewajiban</TableCell>
                          <TableCell className="text-right text-destructive">
                            {formatIDR(reportData.balanceSheet.totalLiability)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-t-4 border-t-primary bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Ekuitas (Equity)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px] text-muted-foreground">Kode</TableHead>
                          <TableHead className="text-muted-foreground">Nama Akun</TableHead>
                          <TableHead className="text-right text-muted-foreground">Jumlah</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.balanceSheet.equity.map((acc: any) => (
                          <TableRow key={acc.code} className="hover:bg-muted/50">
                            <TableCell className="font-mono text-xs text-muted-foreground">{acc.code}</TableCell>
                            <TableCell className="text-foreground">{acc.name}</TableCell>
                            <TableCell className="text-right text-foreground">
                              {formatIDR(acc.balance)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Laba Berjalan */}
                        <TableRow className="hover:bg-muted/50">
                          <TableCell className="font-mono text-xs text-muted-foreground">-</TableCell>
                          <TableCell className="text-foreground">Laba Tahun Berjalan</TableCell>
                          <TableCell className="text-right font-medium text-foreground">
                             {formatIDR(reportData.balanceSheet.netIncome)}
                          </TableCell>
                        </TableRow>

                        <TableRow className="bg-muted font-bold hover:bg-muted/80">
                          <TableCell colSpan={2} className="text-foreground">Total Ekuitas</TableCell>
                          <TableCell className="text-right text-primary">
                            {formatIDR(reportData.balanceSheet.totalEquity)}
                          </TableCell>
                        </TableRow>

                        <TableRow className="bg-primary text-primary-foreground font-bold hover:bg-primary/90">
                          <TableCell colSpan={2}>Total Kewajiban + Ekuitas</TableCell>
                          <TableCell className="text-right">
                            {formatIDR(
                              reportData.balanceSheet.totalLiability + 
                              reportData.balanceSheet.totalEquity
                            )}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "trial" && reportData && (
          <Card className="animate-fade-in bg-card border-border">
            <CardHeader>
               <CardTitle className="text-foreground">Neraca Saldo (Chart of Accounts)</CardTitle>
               <div className="flex gap-2">
                 <Input 
                    className="max-w-sm" 
                    placeholder="Cari akun..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                 />
               </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="min-w-[1000px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-muted-foreground">Kode</TableHead>
                      <TableHead className="text-muted-foreground">Nama Akun</TableHead>
                      <TableHead className="text-muted-foreground">Type</TableHead>
                      <TableHead className="text-right text-muted-foreground">Debit</TableHead>
                      <TableHead className="text-right text-muted-foreground">Kredit</TableHead>
                      <TableHead className="text-right text-muted-foreground">Saldo Akhir</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.trialBalance
                       .filter((acc: any) => 
                          acc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          acc.code.toLowerCase().includes(searchQuery.toLowerCase())
                       )
                       .map((acc: any) => (
                      <TableRow key={acc.code} className="hover:bg-muted/50">
                        <TableCell className="font-mono font-bold text-foreground">{acc.code}</TableCell>
                        <TableCell className="text-foreground">{acc.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{acc.type}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {acc.totalDebit > 0 ? formatIDR(acc.totalDebit) : "-"}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {acc.totalCredit > 0 ? formatIDR(acc.totalCredit) : "-"}
                        </TableCell>
                        <TableCell className={`text-right font-bold ${acc.balance < 0 ? "text-destructive" : "text-foreground"}`}>
                          {formatIDR(acc.balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "ledger" && (
          <Card className="animate-fade-in bg-card border-border">
            <CardHeader>
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-foreground">Jurnal Umum (General Ledger)</CardTitle>
                    <p className="text-xs text-muted-foreground">100 Transaksi Terakhir</p>
                  </div>
                  <Input 
                      className="max-w-sm" 
                      placeholder="Cari transaksi..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <Table className="min-w-[1000px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-muted-foreground">No. Jurnal</TableHead>
                      <TableHead className="text-muted-foreground">Tanggal</TableHead>
                      <TableHead className="text-muted-foreground">Keterangan</TableHead>
                      <TableHead className="text-muted-foreground">Ref</TableHead>
                      <TableHead className="text-muted-foreground">Akun</TableHead>
                      <TableHead className="text-right text-muted-foreground">Debit</TableHead>
                      <TableHead className="text-right text-muted-foreground">Kredit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ledgerData
                      .filter((journal: any) => 
                         journal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (journal.reference || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                         journal.id.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((journal: any) => (
                      journal.items.map((item: any, idx: number) => (
                        <TableRow key={`${journal.id}-${item.id}`} className={idx === 0 ? "border-t border-border" : "border-0 hover:bg-muted/30"}>
                          {idx === 0 ? (
                            <>
                              <TableCell rowSpan={journal.items.length} className="font-mono align-top text-xs py-4 text-muted-foreground border-r border-border/50">
                                {journal.id.slice(-8)}
                              </TableCell>
                              <TableCell rowSpan={journal.items.length} className="align-top py-4 text-xs w-[120px] text-foreground border-r border-border/50">
                                {new Date(journal.date).toLocaleDateString("id-ID", {
                                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                              </TableCell>
                              <TableCell rowSpan={journal.items.length} className="align-top font-medium py-4 text-foreground border-r border-border/50">
                                {journal.description}
                              </TableCell>
                              <TableCell rowSpan={journal.items.length} className="align-top text-xs py-4 text-muted-foreground border-r border-border/50">
                                {journal.reference || "-"}
                              </TableCell>
                            </>
                          ) : null}
                          
                          <TableCell className={`py-1 ${item.credit > 0 ? "pl-8 text-muted-foreground" : "text-foreground font-medium"}`}>
                            <span className="font-mono text-[10px] text-muted-foreground mr-2">{item.account.code}</span>
                            {item.account.name}
                          </TableCell>
                          <TableCell className="text-right py-1 text-xs text-foreground">
                            {item.debit > 0 ? formatIDR(item.debit) : ""}
                          </TableCell>
                          <TableCell className="text-right py-1 text-xs text-foreground">
                            {item.credit > 0 ? formatIDR(item.credit) : ""}
                          </TableCell>
                        </TableRow>
                      ))
                    ))}
                    {ledgerData.length === 0 && (
                       <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            Belum ada transaksi jurnal
                          </TableCell>
                       </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 1. Laporan Pendapatan Servis */}
        {activeTab === "op_revenue" && opData && (() => {
          const filteredOrders = opData.orders.filter(o => {
            const date = new Date(o.createdAt);
            if (startDate && date < new Date(startDate)) return false;
            if (endDate && date > new Date(endDate + "T23:59:59")) return false;
            return true;
          });

          // Calculate total service revenue
          let totalServiceRevenue = 0;
          const serviceRows: any[] = [];

          filteredOrders.forEach(o => {
            o.orderItems.forEach((item: any) => {
              if (item.itemType === 'service') {
                totalServiceRevenue += item.totalPrice;
                serviceRows.push({
                  orderId: o.id,
                  date: o.createdAt,
                  custName: o.custName,
                  vehicle: o.vehicle,
                  serviceName: item.itemName,
                  price: item.totalPrice,
                });
              }
            });
          });

          return (
            <div className="space-y-6 animate-fade-in">
              <Card className="border-t-4 border-t-green-600 bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Laporan Pendapatan Jasa Servis</CardTitle>
                  <p className="text-xs text-muted-foreground">Menampilkan rangkuman total pemasukan dari pengerjaan jasa servis kendaraan.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-green-950/20 border border-green-900/30 p-6 rounded-lg flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-semibold text-green-500 uppercase tracking-wider">Total Pendapatan Jasa</h4>
                      <p className="text-3xl font-black text-green-400 mt-1">{formatIDR(totalServiceRevenue)}</p>
                    </div>
                    <DollarSign className="h-10 w-10 text-green-500 opacity-60" />
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="text-muted-foreground">ID Order</TableHead>
                          <TableHead className="text-muted-foreground">Tanggal</TableHead>
                          <TableHead className="text-muted-foreground">Pelanggan</TableHead>
                          <TableHead className="text-muted-foreground">Kendaraan</TableHead>
                          <TableHead className="text-muted-foreground">Layanan Jasa</TableHead>
                          <TableHead className="text-right text-muted-foreground">Biaya Layanan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {serviceRows.map((row, idx) => (
                          <TableRow key={idx} className="hover:bg-muted/30">
                            <TableCell className="font-mono text-xs text-muted-foreground">#{row.orderId.slice(-6)}</TableCell>
                            <TableCell className="text-xs text-foreground">
                              {new Date(row.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                            </TableCell>
                            <TableCell className="font-semibold text-foreground">{row.custName}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{row.vehicle}</TableCell>
                            <TableCell className="text-foreground font-medium">{row.serviceName}</TableCell>
                            <TableCell className="text-right font-semibold text-green-500">{formatIDR(row.price)}</TableCell>
                          </TableRow>
                        ))}
                        {serviceRows.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              Tidak ada transaksi pendapatan jasa pada periode ini.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })()}

        {/* 2. Laporan Penjualan Suku Cadang */}
        {activeTab === "op_parts" && opData && (() => {
          const filteredOrders = opData.orders.filter(o => {
            const date = new Date(o.createdAt);
            if (startDate && date < new Date(startDate)) return false;
            if (endDate && date > new Date(endDate + "T23:59:59")) return false;
            return true;
          });

          // Aggregate parts sold
          const partsAggregation: { [key: string]: { code: string, name: string, qty: number, unit: string, totalPrice: number } } = {};
          let totalPartsRevenue = 0;

          filteredOrders.forEach(o => {
            o.orderItems.forEach((item: any) => {
              if (item.itemType === 'part') {
                const partId = item.sparePartId || 'unknown';
                const partCode = item.sparePart?.code || 'COA-PART';
                const partName = item.itemName;
                const partUnit = item.sparePart?.unit || 'pcs';
                
                totalPartsRevenue += item.totalPrice;

                if (!partsAggregation[partId]) {
                  partsAggregation[partId] = {
                    code: partCode,
                    name: partName,
                    qty: 0,
                    unit: partUnit,
                    totalPrice: 0,
                  };
                }
                partsAggregation[partId].qty += item.quantity;
                partsAggregation[partId].totalPrice += item.totalPrice;
              }
            });
          });

          const partsRows = Object.values(partsAggregation);

          return (
            <div className="space-y-6 animate-fade-in">
              <Card className="border-t-4 border-t-blue-600 bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Laporan Penjualan Suku Cadang (Sparepart)</CardTitle>
                  <p className="text-xs text-muted-foreground">Menampilkan rangkuman total volume penjualan suku cadang dan total penerimaannya.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-950/20 border border-blue-900/30 p-6 rounded-lg flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Total Penjualan Sparepart</h4>
                      <p className="text-3xl font-black text-blue-400 mt-1">{formatIDR(totalPartsRevenue)}</p>
                    </div>
                    <Package className="h-10 w-10 text-blue-500 opacity-60" />
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="text-muted-foreground">Kode Part</TableHead>
                          <TableHead className="text-muted-foreground">Nama Suku Cadang</TableHead>
                          <TableHead className="text-right text-muted-foreground">Jumlah Terjual</TableHead>
                          <TableHead className="text-muted-foreground">Satuan</TableHead>
                          <TableHead className="text-right text-muted-foreground">Harga Jual Rata-rata</TableHead>
                          <TableHead className="text-right text-muted-foreground">Total Pendapatan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {partsRows.map((row, idx) => (
                          <TableRow key={idx} className="hover:bg-muted/30">
                            <TableCell className="font-mono text-xs text-muted-foreground"><Badge variant="outline">{row.code}</Badge></TableCell>
                            <TableCell className="font-semibold text-foreground">{row.name}</TableCell>
                            <TableCell className="text-right font-medium text-foreground">{row.qty}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{row.unit}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{formatIDR(row.totalPrice / row.qty)}</TableCell>
                            <TableCell className="text-right font-semibold text-blue-500">{formatIDR(row.totalPrice)}</TableCell>
                          </TableRow>
                        ))}
                        {partsRows.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              Tidak ada penjualan sparepart pada periode ini.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })()}

        {/* 3. Laporan Pengeluaran */}
        {activeTab === "op_expenses" && opData && (() => {
          const filteredExpenses = opData.expenses.filter(e => {
            const date = new Date(e.date);
            if (startDate && date < new Date(startDate)) return false;
            if (endDate && date > new Date(endDate + "T23:59:59")) return false;
            return true;
          });

          const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

          return (
            <div className="space-y-6 animate-fade-in">
              <Card className="border-t-4 border-t-red-600 bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Laporan Pengeluaran Operasional</CardTitle>
                  <p className="text-xs text-muted-foreground">Menampilkan seluruh catatan pengeluaran kas operasional bengkel.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-red-950/20 border border-red-900/30 p-6 rounded-lg flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wider">Total Pengeluaran</h4>
                      <p className="text-3xl font-black text-red-400 mt-1">{formatIDR(totalExpenses)}</p>
                    </div>
                    <TrendingDown className="h-10 w-10 text-red-500 opacity-60" />
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="text-muted-foreground">ID Pengeluaran</TableHead>
                          <TableHead className="text-muted-foreground">Tanggal</TableHead>
                          <TableHead className="text-muted-foreground">Kategori</TableHead>
                          <TableHead className="text-muted-foreground">Keterangan / Keperluan</TableHead>
                          <TableHead className="text-right text-muted-foreground">Jumlah Pengeluaran</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredExpenses.map((row, idx) => (
                          <TableRow key={idx} className="hover:bg-muted/30">
                            <TableCell className="font-mono text-xs text-muted-foreground">#{row.id.slice(-6)}</TableCell>
                            <TableCell className="text-xs text-foreground">
                              {new Date(row.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                            </TableCell>
                            <TableCell><Badge variant="secondary">{row.category}</Badge></TableCell>
                            <TableCell className="text-foreground font-medium">{row.description}</TableCell>
                            <TableCell className="text-right font-semibold text-red-500">{formatIDR(row.amount)}</TableCell>
                          </TableRow>
                        ))}
                        {filteredExpenses.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              Tidak ada catatan pengeluaran pada periode ini.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })()}

        {/* 4. Laporan Persediaan (Inventory) */}
        {activeTab === "op_inventory" && opData && (() => {
          // Calculate stock in, stock out within period
          const inventoryRows = opData.spareParts.map((part: any) => {
            let stockIn = 0;
            let stockOut = 0;

            // Stock logs filter
            opData.stockLogs.forEach((log: any) => {
              const date = new Date(log.createdAt);
              if (startDate && date < new Date(startDate)) return;
              if (endDate && date > new Date(endDate + "T23:59:59")) return;

              if (log.metadata?.sparePartId === part.id) {
                if (log.action === "STOCK_IN") {
                  stockIn += log.metadata?.quantity || 0;
                } else if (log.action === "STOCK_OUT") {
                  stockOut += log.metadata?.quantity || 0;
                }
              }
            });

            // Count parts sold from orders
            opData.orders.forEach((o: any) => {
              const date = new Date(o.createdAt);
              if (startDate && date < new Date(startDate)) return;
              if (endDate && date > new Date(endDate + "T23:59:59")) return;

              o.orderItems.forEach((item: any) => {
                if (item.itemType === 'part' && item.sparePartId === part.id) {
                  stockOut += item.quantity || 0;
                }
              });
            });

            const stockEnd = part.stock;
            const stockStart = stockEnd - stockIn + stockOut;

            return {
              code: part.code,
              name: part.name,
              unit: part.unit,
              stockStart,
              stockIn,
              stockOut,
              stockEnd,
            };
          });

          return (
            <div className="space-y-6 animate-fade-in">
              <Card className="border-t-4 border-t-purple-600 bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Laporan Mutasi Persediaan (Inventory)</CardTitle>
                  <p className="text-xs text-muted-foreground">Menampilkan mutasi stok fisik suku cadang meliputi stok awal, masuk, keluar, dan stok akhir.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="text-muted-foreground">Kode</TableHead>
                          <TableHead className="text-muted-foreground">Nama Suku Cadang</TableHead>
                          <TableHead className="text-right text-muted-foreground">Stok Awal</TableHead>
                          <TableHead className="text-right text-muted-foreground">Stok Masuk</TableHead>
                          <TableHead className="text-right text-muted-foreground">Stok Keluar</TableHead>
                          <TableHead className="text-right text-muted-foreground">Stok Akhir</TableHead>
                          <TableHead className="text-muted-foreground">Satuan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventoryRows.map((row, idx) => (
                          <TableRow key={idx} className="hover:bg-muted/30">
                            <TableCell className="font-mono text-xs text-muted-foreground"><Badge variant="outline">{row.code}</Badge></TableCell>
                            <TableCell className="font-semibold text-foreground">{row.name}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{row.stockStart}</TableCell>
                            <TableCell className="text-right text-green-500 font-medium">+{row.stockIn}</TableCell>
                            <TableCell className="text-right text-orange-500 font-medium">-{row.stockOut}</TableCell>
                            <TableCell className="text-right text-foreground font-bold">{row.stockEnd}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{row.unit}</TableCell>
                          </TableRow>
                        ))}
                        {inventoryRows.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              Tidak ada data inventory yang terdaftar.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })()}

        {/* 5. Laporan Pengerjaan Servis */}
        {activeTab === "op_services" && opData && (() => {
          const filteredOrders = opData.orders.filter(o => {
            const date = new Date(o.createdAt);
            if (startDate && date < new Date(startDate)) return false;
            if (endDate && date > new Date(endDate + "T23:59:59")) return false;
            return true;
          });

          return (
            <div className="space-y-6 animate-fade-in">
              <Card className="border-t-4 border-t-orange-600 bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Laporan Pengerjaan Pelayanan Servis</CardTitle>
                  <p className="text-xs text-muted-foreground">Menampilkan seluruh catatan pelayanan servis kendaraan, mekanik penanggung jawab, dan statusnya.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="text-muted-foreground">ID Order</TableHead>
                          <TableHead className="text-muted-foreground">Tanggal</TableHead>
                          <TableHead className="text-muted-foreground">Pelanggan</TableHead>
                          <TableHead className="text-muted-foreground">Kendaraan</TableHead>
                          <TableHead className="text-muted-foreground">Teknisi / Mekanik</TableHead>
                          <TableHead className="text-muted-foreground">Status Pengerjaan</TableHead>
                          <TableHead className="text-right text-muted-foreground">Total Tagihan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((row, idx) => (
                          <TableRow key={idx} className="hover:bg-muted/30">
                            <TableCell className="font-mono text-xs text-muted-foreground">#{row.id.slice(-6)}</TableCell>
                            <TableCell className="text-xs text-foreground">
                              {new Date(row.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                            </TableCell>
                            <TableCell className="font-semibold text-foreground">{row.custName}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{row.vehicle} ({row.plateNumber || "-"})</TableCell>
                            <TableCell className="text-foreground font-medium">{row.mechanic?.name || "Belum Ditunjuk"}</TableCell>
                            <TableCell>
                              <Badge className={
                                row.status === "COMPLETED" ? "bg-green-900/40 text-green-500 border-green-900" :
                                row.status === "IN_PROGRESS" ? "bg-blue-900/40 text-blue-500 border-blue-900 animate-pulse" :
                                "bg-gray-800 text-gray-400 border-gray-700"
                              }>
                                {row.status === "COMPLETED" ? "Selesai" : row.status === "IN_PROGRESS" ? "Sedang Dikerjakan" : "Menunggu Servis"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-bold text-foreground">{formatIDR(row.totalPrice)}</TableCell>
                          </TableRow>
                        ))}
                        {filteredOrders.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              Tidak ada pelayanan pengerjaan servis pada periode ini.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })()}
      </div>
    </div>
    </RoleGuard>
  );
}
