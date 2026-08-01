// app/admin/finance/page.tsx - Keuangan Management
"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Wallet, Calendar } from "lucide-react";

import { RoleGuard } from "@/components/shared/RoleGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BankAccountsManager } from "@/components/admin/BankAccountsManager";

import { getFinancialReports } from "@/lib/actions/finance";

interface FinanceSummary {
  income: number;
  expense: number;
  balance: number;
}

/**
 * Halaman Utama Keuangan & Akuntansi Admin Bengkel.
 * Menampilkan ringkasan pendapatan, beban, dan laba rugi realtime.
 */
export default function Page() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FinanceSummary>({
    income: 0,
    expense: 0,
    balance: 0,
  });

  async function fetchData() {
    try {
      setLoading(true);
      const reportRes = await getFinancialReports();

      if (reportRes.success && reportRes.data) {
        setSummary({
          income: reportRes.data.incomeStatement.totalRevenue,
          expense: reportRes.data.incomeStatement.totalExpense,
          balance: reportRes.data.incomeStatement.netIncome,
        });
      }
    } catch (error) {
      console.error("Failed to fetch finance data", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <RoleGuard allowedRoles={["OWNER"]}>
      <div className="min-h-screen bg-background text-foreground">
        {/* Main Content */}
        <div className="p-8 space-y-6">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-foreground mb-2">Keuangan & Akuntansi</h2>
            <p className="text-muted-foreground">
              Laporan keuangan realtime dari transaksi bengkel
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Pendapatan
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-8 w-36 bg-muted animate-pulse rounded my-1" />
                ) : (
                  <div className="text-2xl font-bold text-green-500">
                    Rp {summary.income.toLocaleString("id-ID")}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  Total Revenue (Akun 4xx)
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Beban
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-8 w-36 bg-muted animate-pulse rounded my-1" />
                ) : (
                  <div className="text-2xl font-bold text-red-500">
                    Rp {summary.expense.toLocaleString("id-ID")}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  Total Expense (Akun 5xx)
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Laba Rugi
                </CardTitle>
                <Wallet className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-8 w-36 bg-muted animate-pulse rounded my-1" />
                ) : (
                  <div
                    className={`text-2xl font-bold ${summary.balance >= 0 ? "text-blue-500" : "text-red-500"}`}
                  >
                    Rp {Math.abs(summary.balance).toLocaleString("id-ID")}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.balance >= 0 ? "Profit" : "Loss"} Periode Ini
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Action Bar */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Periode: Semua Waktu
              </Button>
            </div>
          </div>

          {/* BANK ACCOUNTS MANAGER */}
          <div className="mb-8">
            <BankAccountsManager />
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
