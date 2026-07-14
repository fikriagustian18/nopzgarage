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
    Loader2
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

  const expenseBreakdown = [
    { name: 'Operasional', value: stats.financial.expenseMonth * 0.6, color: '#ef4444' },
    { name: 'HPP', value: stats.financial.expenseMonth * 0.4, color: '#f97316' },
  ];

  return (
    <RoleGuard allowedRoles={["OWNER"]}>
      <div className="min-h-screen bg-background text-foreground">
        <div className="p-2 md:p-8 space-y-4 md:space-y-8">
        
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight">Dashboard</h2>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">Overview performa bisnis dan operasional</p>
                </div>
                <Link href="/admin/finance">
                    <Button size="sm" variant="outline" className="gap-2 hidden md:flex">
                        <Settings className="h-4 w-4" />
                        Atur Keuangan
                    </Button>
                </Link>
            </div>

            {/* FINANCIAL ACCOUNTS SCROLL */}
            <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2 md:mx-0 md:px-0 hide-scrollbar">
                {/* 1. KAS TUNAI CARD */}
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

                {/* 2. BANK ACCOUNTS LOOP */}
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

                {/* 3. ADD BANK CTA */}
                <Link href="/admin/finance" className="min-w-[90px] flex items-center justify-center">
                    <div className="h-[180px] w-full border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer p-3 text-center">
                        <div className="p-1.5 bg-muted rounded-full">
                            <Plus className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-medium">Tambah Akun</span>
                    </div>
                </Link>
            </div>
        </div>

        {/* KEY METRICS - Compact Cards with Vibrant Charts */}
        <div className="grid gap-2 md:gap-3 grid-cols-2 lg:grid-cols-4">
            {/* Revenue Card */}
            <Card className="border-l-4 border-l-[#DE73FF] shadow-sm">
                <CardHeader className="pb-1 p-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xs font-medium text-muted-foreground">Pendapatan</CardTitle>
                            <CardDescription className="text-[10px]">Bulan Ini</CardDescription>
                        </div>
                        <div className="p-1.5 bg-[#DE73FF]/10 rounded-md">
                            <TrendingUp className="h-3 w-3 text-[#DE73FF]" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                    <div className="text-lg md:text-xl font-bold text-[#DE73FF]">Rp {(stats.financial.revenueMonth / 1000000).toFixed(1)}jt</div>
                    <div className="h-[90px] md:h-[110px] w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueChartData}>
                                <defs>
                                    <linearGradient id="colorRevenueMetric" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#DE73FF" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#DE73FF" stopOpacity={0.05}/>
                                    </linearGradient>
                                </defs>
                                <Area 
                                    type="monotone" 
                                    dataKey="revenue" 
                                    stroke="#DE73FF" 
                                    strokeWidth={2.5}
                                    fillOpacity={1} 
                                    fill="url(#colorRevenueMetric)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                        <span className="text-[#DE73FF] font-medium">+{(stats.financial.todayRevenue / 1000).toFixed(0)}k</span> hari ini
                    </p>
                </CardContent>
            </Card>

            {/* Expenses Card */}
            <Card className="border-l-4 border-l-[#FE6804] shadow-sm">
                <CardHeader className="pb-1 p-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xs font-medium text-muted-foreground">Pengeluaran</CardTitle>
                            <CardDescription className="text-[10px]">Bulan Ini</CardDescription>
                        </div>
                        <div className="p-1.5 bg-[#FE6804]/10 rounded-md">
                            <TrendingDown className="h-3 w-3 text-[#FE6804]" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                    <div className="text-lg md:text-xl font-bold text-[#FE6804]">Rp {(stats.financial.expenseMonth / 1000000).toFixed(1)}jt</div>
                    <div className="h-[90px] md:h-[110px] w-full mt-2 flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={expenseBreakdown}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="55%"
                                    outerRadius="85%"
                                    paddingAngle={3}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    <Cell fill="#DE73FF" />
                                    <Cell fill="#FE6804" />
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ 
                                        borderRadius: '8px', 
                                        fontSize: '10px', 
                                        backgroundColor: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border))',
                                        color: 'hsl(var(--foreground))'
                                    }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    formatter={(value: any) => `Rp ${(Number(value)/1000000).toFixed(1)}jt`}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute text-center">
                            <span className="text-[10px] font-bold text-muted-foreground">Exp</span>
                        </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 text-center">
                        <span className="text-[#DE73FF]">●</span> Ops 60% <span className="text-[#FE6804]">●</span> HPP 40%
                    </p>
                </CardContent>
            </Card>

            {/* Profit Card */}
            <Card className="border-l-4 border-l-[#22c55e] shadow-sm">
                <CardHeader className="pb-1 p-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xs font-medium text-muted-foreground">Net Profit</CardTitle>
                            <CardDescription className="text-[10px]">Estimasi</CardDescription>
                        </div>
                        <div className="p-1.5 bg-[#22c55e]/10 rounded-md">
                            <DollarSign className="h-3 w-3 text-[#22c55e]" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                    <div className="text-lg md:text-xl font-bold text-[#22c55e]">
                        Rp {(stats.financial.netProfit / 1000000).toFixed(1)}jt
                    </div>
                    <div className="h-[90px] md:h-[110px] w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { name: 'Rev', value: stats.financial.revenueMonth },
                                { name: 'Exp', value: stats.financial.expenseMonth }
                            ]} barGap={8}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={35}>
                                    <Cell fill="#DE73FF" />
                                    <Cell fill="#FE6804" />
                                </Bar>
                                <Tooltip 
                                    cursor={{fill: 'transparent'}}
                                    contentStyle={{ 
                                        borderRadius: '8px', 
                                        fontSize: '10px',
                                        backgroundColor: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border))',
                                        color: 'hsl(var(--foreground))'
                                    }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    formatter={(value: any) => `Rp ${(Number(value)/1000000).toFixed(1)}jt`}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 text-center">
                        <span className="text-[#DE73FF]">●</span> Pendapatan <span className="text-[#FE6804]">●</span> Pengeluaran
                    </p>
                </CardContent>
            </Card>

            {/* Active Orders Card */}
            <Card className="border-l-4 border-l-[#DE73FF] shadow-sm">
                <CardHeader className="pb-1 p-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xs font-medium text-muted-foreground">Order Aktif</CardTitle>
                            <CardDescription className="text-[10px]">Sedang Proses</CardDescription>
                        </div>
                        <div className="p-1.5 bg-[#DE73FF]/10 rounded-md">
                            <Activity className="h-3 w-3 text-[#DE73FF]" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                    <div className="text-lg md:text-xl font-bold text-[#DE73FF]">{stats.operational.activeOrders}</div>
                    <div className="h-[90px] md:h-[110px] w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueChartData.map((d: any) => ({ ...d, orders: Math.max(1, Math.floor(d.revenue / 100000)) }))}>
                                <defs>
                                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#DE73FF" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#DE73FF" stopOpacity={0.05}/>
                                    </linearGradient>
                                </defs>
                                <Area 
                                    type="monotone" 
                                    dataKey="orders" 
                                    stroke="#DE73FF" 
                                    strokeWidth={2.5}
                                    fill="url(#colorOrders)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                        Activity Trend (7 hari)
                    </p>
                </CardContent>
            </Card>
        </div>

        {/* CHARTS ROW */}
        <div className="grid gap-3 md:gap-4 md:grid-cols-7">
            {/* Revenue Trend Chart */}
            <Card className="col-span-full md:col-span-4 bg-card border-border shadow-md">
                <CardHeader className="p-3 md:p-4">
                    <CardTitle className="text-sm md:text-base font-bold">Tren Pendapatan Mingguan</CardTitle>
                    <CardDescription className="text-xs">Analisis performa penjualan 7 hari terakhir</CardDescription>
                </CardHeader>
                <CardContent className="p-3 md:p-4 pt-0">
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
                                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`}
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
                                    activeDot={{ r: 5, strokeWidth: 0, fill: '#DE73FF' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Inventory Status */}
            <Card className="col-span-3 bg-card border-border">
                <CardHeader className="p-3 md:p-6">
                    <CardTitle className="text-sm md:text-base">Status Inventori</CardTitle>
                    <CardDescription className="text-xs">Ringkasan stok gudang</CardDescription>
                </CardHeader>
                <CardContent className="p-3 md:p-6 pt-0 space-y-2 md:space-y-4">
                    <div className="flex items-center justify-between p-2 md:p-3 bg-muted/40 rounded-lg border border-border">
                        <div className="flex items-center gap-2 md:gap-3">
                            <Package className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                            <div>
                                <p className="text-xs md:text-sm font-medium">Total Item</p>
                                <p className="text-[10px] md:text-xs text-muted-foreground">Sparepart</p>
                            </div>
                        </div>
                        <div className="font-bold text-base md:text-lg">{stats.inventory.totalItems}</div>
                    </div>

                    <div className="flex items-center justify-between p-2 md:p-3 bg-muted/40 rounded-lg border border-border">
                        <div className="flex items-center gap-2 md:gap-3">
                            <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-yellow-600" />
                            <div>
                                <p className="text-xs md:text-sm font-medium">Stok Menipis</p>
                                <p className="text-[10px] md:text-xs text-muted-foreground">Perlu restock</p>
                            </div>
                        </div>
                        <div className="font-bold text-base md:text-lg text-yellow-600">{stats.inventory.lowStockCount}</div>
                    </div>

                    <div className="flex items-center justify-between p-2 md:p-3 bg-muted/40 rounded-lg border border-border">
                        <div className="flex items-center gap-2 md:gap-3">
                            <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-chart-1" />
                            <div>
                                <p className="text-xs md:text-sm font-medium">Nilai Aset</p>
                                <p className="text-[10px] md:text-xs text-muted-foreground">Modal</p>
                            </div>
                        </div>
                        <div className="font-bold text-base md:text-lg">{(stats.inventory.totalAssetValue / 1000000).toFixed(1)}jt</div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* DATA PREVIEWS - Enhanced Tables */}
        <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
            
            {/* Karyawan - Table Style */}
            <Card className="bg-card border-border overflow-hidden">
                <CardHeader className="p-3 md:p-6 bg-gradient-to-br from-primary/5 to-transparent border-b border-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-sm md:text-lg">Karyawan</CardTitle>
                                <CardDescription className="text-xs">Tim aktif</CardDescription>
                            </div>
                        </div>
                        <Badge variant="secondary" className="text-xs font-bold">{activeEmployees.length}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {activeEmployees.length === 0 ? (
                        <div className="p-8 text-center">
                            <User className="h-12 w-12 text-muted-foreground/20 mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">Belum ada karyawan</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {activeEmployees.slice(0, 3).map((emp: any, idx: number) => (
                                <div 
                                    key={emp.id} 
                                    className="flex items-center justify-between p-3 md:p-4 hover:bg-muted/30 transition-colors group"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="p-2 bg-primary/5 group-hover:bg-primary/10 rounded-full transition-colors">
                                            <User className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs md:text-sm font-semibold truncate">{emp.name}</p>
                                            <p className="text-[10px] md:text-xs text-muted-foreground">{emp.role}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] md:text-xs shrink-0 ml-2">
                                        {emp.salaryType === 'DAILY' ? 'Harian' : 'Komisi'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="p-3 md:p-4 border-t border-border bg-muted/20">
                        <Link href="/admin/employees">
                            <Button variant="ghost" size="sm" className="w-full gap-2 text-xs hover:bg-primary/10">
                                Lihat Semua ({employees.length}) <ArrowRight className="h-3 w-3" />
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Orders - Table Style */}
            <Card className="bg-card border-border overflow-hidden">
                <CardHeader className="p-3 md:p-6 bg-gradient-to-br from-chart-1/5 to-transparent border-b border-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-chart-1/10 rounded-lg">
                                <ClipboardList className="h-4 w-4 md:h-5 md:w-5 text-chart-1" />
                            </div>
                            <div>
                                <CardTitle className="text-sm md:text-lg">Order Terbaru</CardTitle>
                                <CardDescription className="text-xs">5 pesanan terakhir</CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {recentOrders.length === 0 ? (
                        <div className="p-8 text-center">
                            <ClipboardList className="h-12 w-12 text-muted-foreground/20 mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">Belum ada order</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {recentOrders.map((order: any) => (
                                <div 
                                    key={order.id} 
                                    className="flex items-center justify-between p-3 md:p-4 hover:bg-muted/30 transition-colors group"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className={`p-2 rounded-full transition-colors ${
                                            order.status === 'COMPLETED' ? 'bg-chart-1/10 group-hover:bg-chart-1/20' :
                                            order.status === 'IN_PROGRESS' ? 'bg-orange-500/10 group-hover:bg-orange-500/20' :
                                            'bg-muted group-hover:bg-muted/80'
                                        }`}>
                                            <ClipboardList className={`h-3 w-3 md:h-4 md:w-4 ${
                                                order.status === 'COMPLETED' ? 'text-chart-1' :
                                                order.status === 'IN_PROGRESS' ? 'text-orange-500' :
                                                'text-muted-foreground'
                                            }`} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs md:text-sm font-semibold truncate">{order.custName}</p>
                                            <p className="text-[10px] md:text-xs text-muted-foreground truncate">{order.vehicle}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-2">
                                        <Badge 
                                            variant={order.status === 'COMPLETED' ? 'default' : 'secondary'} 
                                            className="text-[10px] mb-1 block"
                                        >
                                            {order.status}
                                        </Badge>
                                        <p className="text-[10px] md:text-xs font-bold text-chart-1">
                                            {(order.totalPrice / 1000).toFixed(0)}k
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="p-3 md:p-4 border-t border-border bg-muted/20">
                        <Link href="/admin/orders">
                            <Button variant="ghost" size="sm" className="w-full gap-2 text-xs hover:bg-chart-1/10">
                                Lihat Semua ({orders.length}) <ArrowRight className="h-3 w-3" />
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Low Stock - Table Style */}
            <Card className="bg-card border-border overflow-hidden">
                <CardHeader className="p-3 md:p-6 bg-gradient-to-br from-yellow-500/5 to-transparent border-b border-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-yellow-500/10 rounded-lg">
                                <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-yellow-600" />
                            </div>
                            <div>
                                <CardTitle className="text-sm md:text-lg">Stok Menipis</CardTitle>
                                <CardDescription className="text-xs">Perlu restocking</CardDescription>
                            </div>
                        </div>
                        <Badge variant="destructive" className="text-xs font-bold">{lowStockItems.length}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {lowStockItems.length === 0 ? (
                        <div className="p-8 text-center">
                            <CheckCircle2 className="h-12 w-12 text-chart-1/50 mx-auto mb-2" />
                            <p className="text-xs font-medium text-chart-1">Semua Stok Aman</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Tidak ada item yang perlu restock</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {lowStockItems.map((item: any) => (
                                <div 
                                    key={item.id} 
                                    className="flex items-center justify-between p-3 md:p-4 hover:bg-yellow-50/50 dark:hover:bg-yellow-950/10 transition-colors group"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="p-2 bg-yellow-500/10 group-hover:bg-yellow-500/20 rounded-full transition-colors">
                                            <Package className="h-3 w-3 md:h-4 md:w-4 text-yellow-600" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs md:text-sm font-semibold truncate">{item.name}</p>
                                            <p className="text-[10px] md:text-xs text-muted-foreground">
                                                Min: {item.minStock} {item.unit}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-2">
                                        <p className="text-sm md:text-base font-bold text-yellow-600">
                                            {item.stock}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">{item.unit}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="p-3 md:p-4 border-t border-border bg-muted/20">
                        <Link href="/admin/inventory">
                            <Button variant="ghost" size="sm" className="w-full gap-2 text-xs hover:bg-yellow-500/10">
                                Lihat Katalog ({inventory.length}) <ArrowRight className="h-3 w-3" />
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Links - Keuangan */}
            <Card className="bg-card border-border">
                <CardHeader className="p-3 md:p-6">
                    <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                        <CardTitle className="text-sm md:text-lg">Keuangan</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Transaksi & COA</CardDescription>
                </CardHeader>
                <CardContent className="p-3 md:p-6 pt-0 space-y-2">
                    <Link href="/admin/expenses">
                        <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
                            <ArrowUpRight className="h-3 w-3 text-destructive" />
                            Pengeluaran
                        </Button>
                    </Link>
                    <Link href="/admin/income">
                        <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
                            <DollarSign className="h-3 w-3 text-chart-1" />
                            Pemasukan
                        </Button>
                    </Link>
                    <Link href="/admin/journal">
                        <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
                            <FileText className="h-3 w-3 text-primary" />
                            Jurnal Umum
                        </Button>
                    </Link>
                    <Link href="/admin/finance">
                        <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
                            <Wallet className="h-3 w-3 text-primary" />
                            Chart of Accounts
                        </Button>
                    </Link>
                </CardContent>
            </Card>

            {/* Quick Links - Laporan */}
            <Card className="bg-card border-border">
                <CardHeader className="p-3 md:p-6">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                        <CardTitle className="text-sm md:text-lg">Laporan</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Analisis keuangan</CardDescription>
                </CardHeader>
                <CardContent className="p-3 md:p-6 pt-0 space-y-2">
                    <Link href="/admin/reports">
                        <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
                            <FileText className="h-3 w-3" />
                            Laba Rugi & Neraca
                        </Button>
                    </Link>
                    <p className="text-[10px] md:text-xs text-muted-foreground p-2 md:p-3 bg-muted/30 rounded-lg">
                        Trial Balance, General Ledger, dll
                    </p>
                </CardContent>
            </Card>

            {/* Quick Links - Sistem */}
            <Card className="bg-card border-border">
                <CardHeader className="p-3 md:p-6">
                    <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                        <CardTitle className="text-sm md:text-lg">Sistem</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Konfigurasi</CardDescription>
                </CardHeader>
                <CardContent className="p-3 md:p-6 pt-0 space-y-2">
                    <Link href="/admin/content">
                        <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
                            <Globe className="h-3 w-3" />
                            Website
                        </Button>
                    </Link>
                    <Link href="/admin/settings">
                        <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
                            <Settings className="h-3 w-3" />
                            Pengaturan
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>

        {/* Activity Log */}
        <Card className="bg-card border-border">
            <CardHeader className="p-3 md:p-6">
                <CardTitle className="text-sm md:text-base">Aktivitas Terbaru</CardTitle>
                <CardDescription className="text-xs">Log sistem</CardDescription>
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
                <div className="space-y-3 md:space-y-4">
                    {stats.recentActivities.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">Belum ada aktivitas</p>
                    ) : (
                        stats.recentActivities.map((act: any) => (
                            <div key={act.id} className="flex items-center justify-between border-b last:border-0 pb-2 md:pb-3 last:pb-0">
                                <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                                    <div className={`p-1.5 md:p-2 rounded-full ${act.type === 'ORDER' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                                        {act.type === 'ORDER' ? <ClipboardList className="h-3 w-3 md:h-4 md:w-4" /> : <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-xs md:text-sm truncate">{act.description}</p>
                                        <p className="text-[10px] md:text-xs text-muted-foreground">
                                            {format(new Date(act.date), "dd MMM HH:mm", { locale: id })}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right ml-2">
                                    {act.type === 'ORDER' ? (
                                        <Badge variant={act.status === 'COMPLETED' ? 'default' : 'secondary'} className="text-[10px]">{act.status}</Badge>
                                    ) : (
                                        <span className="text-[10px] font-mono text-muted-foreground">EXP</span>
                                    )}
                                    {act.amount !== 0 && (
                                        <div className={`font-bold text-xs md:text-sm mt-1 ${act.type === 'ORDER' ? 'text-chart-1' : 'text-destructive'}`}>
                                            {act.type === 'EXPENSE' ? '-' : '+'}{(Math.abs(act.amount) / 1000).toFixed(0)}k
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
    </div>
  </RoleGuard>
  );
}
