// app/admin/page.tsx - Enhanced Dashboard with Charts & Mobile Optimization
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { RoleGuard } from "@/components/RoleGuard";
import { getDashboardStats } from "@/app/actions/dashboard";
import { getEmployees } from "@/app/actions/employees";
import { getAdminOrders } from "@/app/actions/orders";
import { getSpareParts } from "@/app/actions/inventory";
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle, 
    CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    DollarSign, 
    TrendingUp, 
    TrendingDown, 
    Package, 
    AlertTriangle, 
    ClipboardList, 
    Activity,
    CreditCard,
    Landmark,
    Plus,
    ArrowUpRight,
    Users,
    FileText,
    Globe,
    Settings,
    ArrowRight,
    Wallet,
    User,
    CheckCircle2,
    Loader2,
    Calendar,
    Wrench
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from "recharts";
import { getBankColor } from "@/lib/constants/banks";

export default function AdminDashboard() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const [stats, setStats] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [statsRes, employeesRes, ordersRes, inventoryRes] = await Promise.all([
      getDashboardStats(),
      getEmployees(),
      getAdminOrders({ limit: 5 }),
      getSpareParts(),
    ]);
    
    if (statsRes.success && statsRes.data) setStats(statsRes.data);
    if (employeesRes.success) setEmployees(employeesRes.employees || []);
    if (ordersRes.success) setOrders(ordersRes.orders || []);
    if (inventoryRes.success) setInventory(inventoryRes.spareParts || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <h2 className="text-xl font-bold">Gagal memuat dashboard</h2>
      </div>
    );
  }

  const activeEmployees = employees.filter((e: any) => e.isActive);
  const recentOrders = orders.slice(0, 5);
  const lowStockItems = inventory.filter((i: any) => i.stock <= i.minStock).slice(0, 5);

  // Chart data
  const revenueChartData = stats.chartData.map((d: any) => ({
    date: d.date,
    revenue: d.revenue,
  }));

  const pendingCount = stats.operational.pendingCount || 0;
  const inProgressCount = stats.operational.inProgressCount || 0;
  const completedCount = stats.operational.completedCount || 0;
  const totalStatusCount = pendingCount + inProgressCount + completedCount;

  const statusPieData = [
    { name: "Menunggu", value: pendingCount, color: "#94a3b8" },
    { name: "Diproses", value: inProgressCount, color: "#fe6804" },
    { name: "Selesai", value: completedCount, color: "#22c55e" }
  ];

  return (
    <RoleGuard allowedRoles={["OWNER", "ADMIN"]}>
      <div className="min-h-screen bg-background text-foreground">
        <div className="p-4 md:p-6 space-y-6">
        
          {/* FINANCIAL ACCOUNTS SCROLL */}
          {userRole === "OWNER" && (
            <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2 md:mx-0 md:px-0 hide-scrollbar">
              <Card className="bg-primary text-primary-foreground border-none shadow-lg min-w-[180px] md:min-w-[220px] relative overflow-hidden transition-transform hover:scale-[1.02]">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Wallet className="h-16 w-16 transform translate-x-3 -translate-y-3" />
                </div>
                <CardContent className="p-4 flex flex-col justify-between h-full relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] opacity-70 font-medium tracking-wider uppercase">Saldo Kas</p>
                      <p className="text-xs font-semibold opacity-90">Akun 101</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xl font-bold tracking-tight">Rp {stats.financial.cashBalance.toLocaleString('id-ID')}</p>
                    <p className="text-[9px] opacity-60 mt-0.5">Cash on Hand</p>
                  </div>
                </CardContent>
              </Card>

              {stats.bankAccounts?.map((bank: any) => (
                <Card 
                  key={bank.id} 
                  style={{ backgroundColor: getBankColor(bank.bankCode) }} 
                  className="text-white border-none shadow-lg min-w-[180px] md:min-w-[220px] relative overflow-hidden transition-transform hover:scale-[1.02]"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Landmark className="h-16 w-16 transform translate-x-3 -translate-y-3" />
                  </div>
                  <CardContent className="p-4 flex flex-col justify-between h-full relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                        <Landmark className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] opacity-70 font-medium tracking-wider uppercase">{bank.bankCode}</p>
                        <p className="text-xs font-semibold opacity-90 truncate max-w-[130px]">{bank.bankName}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xl font-bold tracking-tight">Rp {bank.currentBalance.toLocaleString('id-ID')}</p>
                      <div className="flex justify-between items-end mt-0.5">
                        <p className="text-[9px] opacity-60 font-mono tracking-wide">{bank.accountNumber}</p>
                        <p className="text-[9px] opacity-60 truncate max-w-[90px]">{bank.accountName}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Link href="/admin/finance" className="min-w-[90px] flex items-center justify-center">
                <div className="h-[108px] w-full border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer p-3 text-center">
                  <div className="p-1.5 bg-muted rounded-full">
                    <Plus className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-medium">Tambah Akun</span>
                </div>
              </Link>
            </div>
          )}

          {/* 5 KEY METRICS CARDS */}
          <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-5">
            {/* 1. Total Booking */}
            <Card className="shadow-sm bg-card border-border">
              <CardHeader className="pb-1 p-4 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Booking</CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Calendar className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-3xl font-black tracking-tight">{stats.operational.bookingsToday}</div>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Hari ini</p>
                <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${stats.operational.bookingsTodayChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                  <TrendingUp className="h-3 w-3" />
                  <span>{stats.operational.bookingsTodayChange >= 0 ? "+" : ""}{stats.operational.bookingsTodayChange}% dari kemarin</span>
                </div>
              </CardContent>
            </Card>

            {/* 2. Order Servis */}
            <Card className="shadow-sm bg-card border-border">
              <CardHeader className="pb-1 p-4 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order Servis</CardTitle>
                <div className="p-2 bg-[#FE6804]/10 rounded-lg text-[#FE6804]">
                  <Wrench className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-3xl font-black tracking-tight">{stats.operational.ordersInProgress}</div>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Sedang Diproses</p>
                <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${stats.operational.ordersInProgressChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                  <TrendingUp className="h-3 w-3" />
                  <span>{stats.operational.ordersInProgressChange >= 0 ? "+" : ""}{stats.operational.ordersInProgressChange}% dari kemarin</span>
                </div>
              </CardContent>
            </Card>

            {/* 3. Selesai Hari Ini */}
            <Card className="shadow-sm bg-card border-border">
              <CardHeader className="pb-1 p-4 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Selesai Hari Ini</CardTitle>
                <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-3xl font-black tracking-tight">{stats.operational.completedToday}</div>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Order Selesai</p>
                <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${stats.operational.completedTodayChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                  <TrendingUp className="h-3 w-3" />
                  <span>{stats.operational.completedTodayChange >= 0 ? "+" : ""}{stats.operational.completedTodayChange}% dari kemarin</span>
                </div>
              </CardContent>
            </Card>

            {/* 4. Total Transaksi */}
            <Card className="shadow-sm bg-card border-border">
              <CardHeader className="pb-1 p-4 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Transaksi</CardTitle>
                <div className="p-2 bg-[#DE73FF]/10 rounded-lg text-[#DE73FF]">
                  <DollarSign className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-lg font-black tracking-tight truncate">
                  Rp {stats.financial.todayRevenue.toLocaleString('id-ID')}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Hari ini</p>
                <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${stats.financial.revenueTodayChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                  <TrendingUp className="h-3 w-3" />
                  <span>{stats.financial.revenueTodayChange >= 0 ? "+" : ""}{stats.financial.revenueTodayChange}% dari kemarin</span>
                </div>
              </CardContent>
            </Card>

            {/* 5. Stok Menipis */}
            <Card className="shadow-sm bg-card border-border">
              <CardHeader className="pb-1 p-4 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stok Menipis</CardTitle>
                <div className="p-2 bg-yellow-600/10 rounded-lg text-yellow-600">
                  <Package className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-3xl font-black tracking-tight text-yellow-600">{stats.inventory.lowStockCount}</div>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Item</p>
                <div className="mt-2.5">
                  <Link href="/admin/inventory" className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1">
                    Lihat Detail <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CHARTS ROW */}
          <div className="grid gap-4 md:grid-cols-7">
            {/* Revenue Trend Chart */}
            <Card className="col-span-full md:col-span-4 lg:col-span-5 bg-card border-border shadow-md">
              <CardHeader className="p-4">
                <CardTitle className="text-sm md:text-base font-bold">Grafik Pendapatan (7 Hari Terakhir)</CardTitle>
                <CardDescription className="text-xs">Analisis performa penjualan 7 hari terakhir</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="h-[240px] md:h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenueMain" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#DE73FF" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#DE73FF" stopOpacity={0.02}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={(value) => `${(value / 1000000).toFixed(1)}jt`}
                        dx={-10}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '11px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          color: 'hsl(var(--foreground))'
                        }}
                        itemStyle={{ color: '#DE73FF' }}
                        formatter={(value: any) => [`Rp ${value.toLocaleString('id-ID')}`, 'Revenue']}
                        cursor={{ stroke: '#DE73FF', strokeWidth: 1, strokeDasharray: '5 5' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#DE73FF" 
                        strokeWidth={2.5}
                        fillOpacity={1} 
                        fill="url(#colorRevenueMain)" 
                        dot={{ r: 4, fill: '#DE73FF', strokeWidth: 0 }}
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#DE73FF' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Order Status Donut Chart */}
            <Card className="col-span-full md:col-span-3 lg:col-span-2 bg-card border-border shadow-md">
              <CardHeader className="p-4">
                <CardTitle className="text-sm md:text-base font-bold">Order Servis Berdasarkan Status</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-center justify-center gap-4 h-[240px] md:h-[280px]">
                  <div className="w-1/2 h-full flex items-center justify-center relative min-h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius="60%"
                          outerRadius="85%"
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {statusPieData.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '8px', 
                            fontSize: '11px', 
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            color: 'hsl(var(--foreground))'
                          }}
                          itemStyle={{ color: 'hsl(var(--foreground))' }}
                          formatter={(value: any, name: any) => [`${value} order`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute text-center flex flex-col justify-center items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total</span>
                      <span className="text-2xl font-black tracking-tight text-foreground">{totalStatusCount}</span>
                    </div>
                  </div>

                  <div className="w-1/2 flex flex-col justify-center gap-3 text-xs">
                    {statusPieData.map((item, idx) => {
                      const percentage = totalStatusCount === 0 ? 0 : Math.round((item.value / totalStatusCount) * 100);
                      return (
                        <div key={idx} className="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5 last:border-0 last:pb-0">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                            <span className="font-semibold text-muted-foreground">{item.name}</span>
                          </div>
                          <div className="text-right font-black">
                            <span>{item.value}</span>
                            <span className="text-muted-foreground text-[10px] ml-1">({percentage}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* TABLES ROW */}
          <div className="grid gap-4 md:grid-cols-7">
            {/* Orders - Table Style */}
            <Card className="col-span-full md:col-span-4 lg:col-span-5 bg-card border-border shadow-md overflow-hidden flex flex-col justify-between">
              <div>
                <CardHeader className="p-4 bg-gradient-to-br from-primary/5 to-transparent border-b border-border">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm md:text-base font-bold">Order Servis Terbaru</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {recentOrders.length === 0 ? (
                    <div className="p-8 text-center">
                      <ClipboardList className="h-12 w-12 text-muted-foreground/20 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Belum ada order</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-muted/40 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                            <th className="p-3 pl-4">No. Order</th>
                            <th className="p-3">Pelanggan</th>
                            <th className="p-3">Motor</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 pr-4">Waktu</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {recentOrders.map((order: any) => {
                            let statusLabel = order.status;
                            let statusColor = "bg-muted text-muted-foreground";
                            if (order.status === 'PENDING' || order.status === 'QUEUE' || order.status === 'CONFIRMED' || order.status === 'ESTIMATED') {
                              statusLabel = "Menunggu";
                              statusColor = "bg-yellow-500/10 text-yellow-600";
                            } else if (order.status === 'IN_PROGRESS') {
                              statusLabel = "Diproses";
                              statusColor = "bg-blue-500/10 text-blue-600";
                            } else if (order.status === 'COMPLETED' || order.status === 'READY') {
                              statusLabel = "Selesai";
                              statusColor = "bg-green-500/10 text-green-600";
                            }
                            return (
                              <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                                <td className="p-3 pl-4 font-semibold text-primary">
                                  #ORD-{order.id.slice(-8).toUpperCase()}
                                </td>
                                <td className="p-3 font-semibold text-foreground">{order.custName}</td>
                                <td className="p-3 text-muted-foreground">{order.vehicle}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusColor}`}>
                                    {statusLabel}
                                  </span>
                                </td>
                                <td className="p-3 pr-4 text-muted-foreground">
                                  {format(new Date(order.createdAt), "dd MMM yyyy HH:mm", { locale: id })}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </div>
              <div className="p-3 border-t border-border flex justify-center bg-muted/10">
                <Link href="/admin/orders">
                  <Button variant="outline" size="sm" className="gap-2 text-xs">
                    Lihat Semua Order
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Low Stock - Table Style */}
            <Card className="col-span-full md:col-span-3 lg:col-span-2 bg-card border-border shadow-md overflow-hidden flex flex-col justify-between">
              <div>
                <CardHeader className="p-4 bg-gradient-to-br from-yellow-500/5 to-transparent border-b border-border">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm md:text-base font-bold">Stok Barang Menipis</CardTitle>
                    <Badge variant="destructive" className="text-[10px] font-bold">{lowStockItems.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {lowStockItems.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center justify-center">
                      <CheckCircle2 className="h-10 w-10 text-green-500/55 mb-2" />
                      <p className="text-xs font-semibold text-green-600">Semua Stok Aman</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-muted/40 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                            <th className="p-3 pl-4">Nama Barang</th>
                            <th className="p-3 pr-4 text-right">Stok Tersedia</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {lowStockItems.map((item: any) => (
                            <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                              <td className="p-3 pl-4 font-semibold text-foreground truncate max-w-[150px]">{item.name}</td>
                              <td className="p-3 pr-4 text-right font-black text-yellow-600">
                                {item.stock} <span className="text-[10px] text-muted-foreground font-normal ml-0.5">{item.unit}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </div>
              <div className="p-3 border-t border-border flex justify-center bg-muted/10">
                <Link href="/admin/inventory">
                  <Button variant="outline" size="sm" className="gap-2 text-xs">
                    Lihat Semua Inventory
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

        </div>
      </div>
    </RoleGuard>
  );
}
