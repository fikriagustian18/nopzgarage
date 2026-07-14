// app/admin/reports/page.tsx - Laporan Keuangan
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleGuard } from "@/components/RoleGuard";
import { getFinancialReports, getGeneralLedger } from "@/app/actions/finance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { ExportButton } from "@/components/export/ExportButton";
import { exportBalanceSheet } from "@/lib/export/reports/balance-sheet-export";
import { exportIncomeStatement } from "@/lib/export/reports/financial-export";
import type { BalanceSheetData, IncomeStatementData } from "@/lib/export/types";

export default function ReportsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"income" | "balance" | "ledger" | "trial">("income");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  
  // Data State
  const [reportData, setReportData] = useState<any>(null);
  const [ledgerData, setLedgerData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
        const [reportsRes, ledgerRes] = await Promise.all([
            getFinancialReports(),
            getGeneralLedger(),
        ]);

        if (reportsRes.success) {
            setReportData(reportsRes.data);
        } else {
            setError(reportsRes.error || "Gagal memuat laporan.");
        }

        if (ledgerRes.success) {
            setLedgerData(ledgerRes.journals || []);
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
      <div className="flex gap-2 mb-6 border-b border-border pb-1 overflow-x-auto">
        <Button
          variant={activeTab === "income" ? "default" : "ghost"}
          onClick={() => { setActiveTab("income"); setSearchQuery(""); }}
          className="rounded-full whitespace-nowrap"
        >
          Laba Rugi
        </Button>
        <Button
          variant={activeTab === "balance" ? "default" : "ghost"}
          onClick={() => { setActiveTab("balance"); setSearchQuery(""); }}
          className="rounded-full whitespace-nowrap"
        >
          Neraca (Balance Sheet)
        </Button>
        <Button
          variant={activeTab === "trial" ? "default" : "ghost"}
          onClick={() => { setActiveTab("trial"); setSearchQuery(""); }}
          className="rounded-full whitespace-nowrap"
        >
          Neraca Saldo (COA)
        </Button>
        <Button
          variant={activeTab === "ledger" ? "default" : "ghost"}
          onClick={() => { setActiveTab("ledger"); setSearchQuery(""); }}
          className="rounded-full whitespace-nowrap"
        >
          Jurnal Umum
        </Button>
      </div>

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
      </div>
    </div>
    </RoleGuard>
  );
}
