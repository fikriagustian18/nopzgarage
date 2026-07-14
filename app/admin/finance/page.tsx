// app/admin/finance/page.tsx - Keuangan Management
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RoleGuard } from "@/components/RoleGuard";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Calendar,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getFinancialReports, getGeneralLedger } from "@/app/actions/finance";
import BankAccountsManager from "@/components/admin/BankAccountsManager";
import { ExportButton } from "@/components/export/ExportButton";
import { exportJournalEntries } from "@/lib/export/reports/journal-export";
import type { JournalEntryExport } from "@/lib/export/types";

type JournalEntry = {
  id: string;
  date: Date;
  description: string;
  items: {
    account: {
      name: string;
      code: string;
    };
    debit: number;
    credit: number;
  }[];
};

export default function FinancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    income: 0,
    expense: 0,
    balance: 0,
  });
  const [journals, setJournals] = useState<JournalEntry[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [reportRes, ledgerRes] = await Promise.all([
        getFinancialReports(),
        getGeneralLedger(),
      ]);

      if (reportRes.success && reportRes.data) {
        setSummary({
          income: reportRes.data.incomeStatement.totalRevenue,
          expense: reportRes.data.incomeStatement.totalExpense,
          balance: reportRes.data.incomeStatement.netIncome,
        });
      }

      if (ledgerRes.success && ledgerRes.journals) {
        setJournals(ledgerRes.journals as unknown as JournalEntry[]);
      }
    } catch (error) {
      console.error("Failed to fetch finance data", error);
    } finally {
      setLoading(false);
    }
  }

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Pendapatan
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                Rp {summary.income.toLocaleString("id-ID")}
              </div>
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
              <div className="text-2xl font-bold text-red-500">
                Rp {summary.expense.toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                Total Expense (Akun 5xx)
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Laba Bersih
              </CardTitle>
              <Wallet className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${summary.balance >= 0 ? "text-blue-500" : "text-red-500"}`}
              >
                Rp {Math.abs(summary.balance).toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.balance >= 0 ? "Profit" : "Loss"} Periode Ini
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Transaksi Jurnal
              </CardTitle>
              <CreditCard className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {journals.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Entries tercatat
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
            <div className="flex gap-2">
            <ExportButton
              title="Laporan_Keuangan_Overview"
              onExport={async (format, orientation) => {
                const exportData: JournalEntryExport[] = journals.map(j => ({
                  id: j.id,
                  date: j.date,
                  description: j.description,
                  reference: '-',
                  items: j.items.map(i => ({
                    account: {
                      code: i.account.code,
                      name: i.account.name
                    },
                    debit: i.debit,
                    credit: i.credit
                  }))
                }));
                return await exportJournalEntries(exportData, format, orientation);
              }}
              label="Export Data Jurnal"
            />
            </div>
        </div>

        {/* BANK ACCOUNTS MANAGER */}
        <div className="mb-8">
            <BankAccountsManager />
        </div>

        {/* Jurnal Umum (General Ledger) */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Jurnal Umum Terkini</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
               <div className="p-8 text-center text-muted-foreground">Loading data keuangan...</div>
            ) : journals.length === 0 ? (
               <div className="p-8 text-center text-muted-foreground">Belum ada data transaksi keuangan.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 font-medium text-muted-foreground">Tanggal</th>
                      <th className="px-6 py-3 font-medium text-muted-foreground">Keterangan</th>
                      <th className="px-6 py-3 font-medium text-muted-foreground">Akun</th>
                      <th className="px-6 py-3 font-medium text-muted-foreground text-right">Debit</th>
                      <th className="px-6 py-3 font-medium text-muted-foreground text-right">Kredit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {journals.map((journal) => (
                      <tr key={journal.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap align-top text-foreground">
                          {new Date(journal.date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </td>
                        <td className="px-6 py-4 align-top font-medium text-foreground">
                          {journal.description}
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="space-y-1">
                            {journal.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between w-64">
                                <span className="text-muted-foreground">
                                  {item.account.code} - {item.account.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top text-right text-foreground">
                          <div className="space-y-1">
                            {journal.items.map((item, idx) => (
                              <div key={idx} className={item.debit > 0 ? "font-medium" : "text-transparent"}>
                                {item.debit > 0 ? `Rp ${item.debit.toLocaleString("id-ID")}` : "-"}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top text-right text-foreground">
                          <div className="space-y-1">
                            {journal.items.map((item, idx) => (
                              <div key={idx} className={item.credit > 0 ? "font-medium" : "text-transparent"}>
                                {item.credit > 0 ? `Rp ${item.credit.toLocaleString("id-ID")}` : "-"}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </RoleGuard>
  );
}
