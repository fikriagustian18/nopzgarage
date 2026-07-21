// components/DashboardOverview.tsx - Dashboard Statistics Overview
"use client";

import { useEffect, useState } from "react";
import { getDashboardStats } from "@/app/actions/dashboard";
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle, 
    CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    DollarSign, 
    TrendingUp, 
    TrendingDown, 
    Package, 
    AlertTriangle, 
    ClipboardList, 
    Activity,
    CreditCard,
    ArrowUpRight,
    Loader2
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export function DashboardOverview() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    setError("");
    const statsRes = await getDashboardStats();
    
    if (statsRes.success && statsRes.data) {
      setStats(statsRes.data);
    } else {
      setError(statsRes.error || "Gagal memuat statistik");
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <h2 className="text-xl font-bold">Gagal memuat dashboard</h2>
        <p>{error || "Terjadi kesalahan sistem."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cash Balance Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Card className="bg-primary text-primary-foreground border-none shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-full">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs opacity-80">Saldo Kas Tunai (101)</p>
                <p className="text-xl font-bold">Rp {stats.financial.cashBalance.toLocaleString('id-ID')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* KEY METRICS GRID */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendapatan (Bulan Ini)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {stats.financial.revenueMonth.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <span className="text-green-500 font-medium">+Hari ini:</span> 
              Rp {stats.financial.todayRevenue.toLocaleString('id-ID')}
            </p>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pengeluaran (Bulan Ini)</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {stats.financial.expenseMonth.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Operasional & HPP
            </p>
          </CardContent>
        </Card>

        {/* Profit */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estimasi Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.financial.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              Rp {stats.financial.netProfit.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Net (Pendapatan - Beban)
            </p>
          </CardContent>
        </Card>

        {/* Active Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Order Aktif</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.operational.activeOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sedang dikerjakan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* MIDDLE SECTION */}
      <div className="grid gap-4 md:grid-cols-7">
        {/* CHART SECTION (4 cols) */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Tren Pendapatan Mingguan</CardTitle>
            <CardDescription>Performa penjualan 7 hari terakhir.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[200px] w-full flex items-end justify-between px-4 gap-2">
              {stats.chartData.map((d: any, i: number) => {
                const maxVal = Math.max(...stats.chartData.map((d: any) => d.revenue)) || 1;
                const heightPercent = Math.max((d.revenue / maxVal) * 100, 5);
                
                return (
                  <div key={i} className="flex flex-col items-center flex-1 group">
                    <div className="relative w-full flex justify-center items-end h-[150px]">
                      <div 
                        className="w-full max-w-[40px] bg-primary/80 hover:bg-primary rounded-t-md transition-all duration-300"
                        style={{ height: `${heightPercent}%` }}
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded shadow-sm whitespace-nowrap z-10 pointer-events-none">
                          Rp {d.revenue.toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-2 md:text-xs truncate max-w-full">{d.date}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* INVENTORY SUMMARY (3 cols) */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Status Inventori</CardTitle>
            <CardDescription>Ringkasan stok dan aset gudang.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-md">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Total Item Produk</p>
                  <p className="text-xs text-muted-foreground">Sparepart & Jasa terdaftar</p>
                </div>
              </div>
              <div className="font-bold text-lg">{stats.inventory.totalItems}</div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 rounded-md">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Stok Menipis</p>
                  <p className="text-xs text-muted-foreground">Perlu restocking segera</p>
                </div>
              </div>
              <div className="font-bold text-lg text-yellow-600">{stats.inventory.lowStockCount}</div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-md">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Nilai Aset Stok</p>
                  <p className="text-xs text-muted-foreground">Total modal tertanam</p>
                </div>
              </div>
              <div className="font-bold text-lg">{(stats.inventory.totalAssetValue / 1000000).toFixed(1)}jt</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RECENT ACTIVITY */}
      <Card>
        <CardHeader>
          <CardTitle>Aktivitas Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentActivities.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Belum ada aktivitas.</p>
            ) : (
              stats.recentActivities.map((act: any) => (
                <div key={act.id} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${act.type === 'ORDER' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                      {act.type === 'ORDER' ? <ClipboardList className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{act.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(act.date), "dd MMM yyyy HH:mm", { locale: id })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {act.type === 'ORDER' ? (
                      <Badge variant={act.status === 'COMPLETED' ? 'default' : 'secondary'}>{act.status}</Badge>
                    ) : (
                      <span className="text-xs font-mono text-muted-foreground">EXPENSE</span>
                    )}
                    {act.amount !== 0 && (
                      <div className={`font-bold text-sm mt-1 ${act.type === 'ORDER' ? 'text-green-600' : 'text-red-600'}`}>
                        {act.type === 'EXPENSE' ? '- ' : '+ '}
                        Rp {Math.abs(act.amount).toLocaleString('id-ID')}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
