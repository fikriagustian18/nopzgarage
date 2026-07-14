"use client";

import { useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { 
  DollarSign, 
  Wrench, 
  CheckCircle, 
  Clock, 
  User, 
  Calendar,
  LogOut,
  ChevronRight,
  ClipboardList, Loader2
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface EmployeeDashboardClientProps {
  employee: any;
  user: any;
}

export function EmployeeDashboardClient({ employee, user }: EmployeeDashboardClientProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const { updateOrderStatus } = await import("@/app/actions/orders");
      const res = await updateOrderStatus(orderId, newStatus as any);
      if (res.success) {
        toast.success("Status berhasil diperbarui!");
        router.refresh();
      } else {
        toast.error("Gagal memperbarui status: " + res.error);
      }
    } catch (err: any) {
      toast.error("Terjadi kesalahan: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (!employee) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-bold mb-2">Data tidak ditemukan</h2>
        <p className="text-muted-foreground mb-4">
          Data karyawan Anda tidak dapat dimuat. Hubungi Admin.
        </p>
        <Button onClick={() => signOut()}>Logout</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header Mobile / Desktop */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Avatar className="h-9 w-9 border border-primary/20">
                <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=random`} />
                <AvatarFallback>{employee.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
             </Avatar>
             <div>
                <h1 className="font-bold text-sm md:text-base leading-none">{employee.name}</h1>
                <p className="text-xs text-muted-foreground">{employee.role}</p>
             </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/kanban" target="_blank">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-muted-foreground gap-1 md:gap-2 h-8"
              >
                <ClipboardList className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Papan Antrian</span>
              </Button>
            </Link>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-red-500 h-8"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Keluar</span>
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container max-w-5xl mx-auto px-4 py-6 space-y-6">
        
        <Tabs defaultValue="overview" className="space-y-6" onValueChange={setActiveTab}>
          <div className="flex overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="overview" className="gap-2">
                <ClipboardList className="h-4 w-4" /> Overview
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <Clock className="h-4 w-4" /> Riwayat
              </TabsTrigger>
              <TabsTrigger value="payrolls" className="gap-2">
                <DollarSign className="h-4 w-4" /> Slip Gaji
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" /> Profil
              </TabsTrigger>
            </TabsList>
          </div>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2">
             
             {/* Greetings */}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                   <h2 className="text-2xl font-black tracking-tight">Dashboard</h2>
                   <p className="text-muted-foreground">
                      Ringkasan performa & pekerjaan Anda hari ini.
                   </p>
                </div>
                {/* Time or Status could go here */}
             </div>

             {/* Stats Grid */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="col-span-2 md:col-span-2 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                  <CardContent className="p-6">
                     <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-muted-foreground">Total Pendapatan</span>
                        <div className="text-3xl font-black text-primary">
                           Rp {employee.stats.totalEarned.toLocaleString("id-ID")}
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs font-medium bg-background/50 w-fit px-2 py-1 rounded-full border">
                           <Wrench className="h-3 w-3" />
                           {employee.stats.taskCount} pekerjaan selesai
                        </div>
                     </div>
                  </CardContent>
                </Card>

                <Card className="col-span-1 bg-green-500/5 border-green-500/10">
                   <CardContent className="p-4 flex flex-col justify-center h-full">
                      <span className="text-xs font-medium text-muted-foreground mb-1">Sudah Dibayar</span>
                      <div className="text-lg md:text-xl font-bold text-green-600">
                         Rp {employee.stats.totalPaid.toLocaleString("id-ID")}
                      </div>
                   </CardContent>
                </Card>

                <Card className="col-span-1 bg-orange-500/5 border-orange-500/10">
                   <CardContent className="p-4 flex flex-col justify-center h-full">
                      <span className="text-xs font-medium text-muted-foreground mb-1">Pending</span>
                      <div className="text-lg md:text-xl font-bold text-orange-600">
                         Rp {employee.stats.totalUnpaid.toLocaleString("id-ID")}
                      </div>
                   </CardContent>
                </Card>
             </div>

             {/* Active Job */}
             {employee.activeOrder ? (
                <Card className="border-primary shadow-lg shadow-primary/5 overflow-hidden">
                   <div className="absolute top-0 left-0 w-1 h-full bg-primary animate-pulse"></div>
                   <CardHeader className="bg-primary/5 pb-4">
                      <div className="flex justify-between items-start">
                         <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                               <Wrench className="h-5 w-5 text-primary" />
                               Sedang Dikerjakan
                            </CardTitle>
                            <CardDescription>Order ID: #{employee.activeOrder.id.slice(-5)}</CardDescription>
                         </div>
                         <Badge className={employee.activeOrder.status === 'READY' ? "bg-green-500 hover:bg-green-600" : "animate-pulse"}>
                            {employee.activeOrder.status === 'READY' ? 'SIAP BAYAR' : 'DIKERJAKAN'}
                         </Badge>
                      </div>
                   </CardHeader>
                   <CardContent className="pt-6">
                      <div className="grid md:grid-cols-2 gap-6">
                         <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Customer</p>
                            <p className="font-bold text-lg">{employee.activeOrder.custName}</p>
                            <div className="flex items-center gap-2 mt-1">
                               <Badge variant="outline">{employee.activeOrder.vehicle}</Badge>
                               <Badge variant="outline">{employee.activeOrder.plateNumber || "No Plate"}</Badge>
                            </div>
                         </div>
                         <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Item Pekerjaan:</p>
                            <ul className="space-y-1">
                               {Array.isArray(employee.activeOrder.items) && 
                                  (employee.activeOrder.items as any[]).map((item: any, idx: number) => (
                                  <li key={idx} className="text-sm flex items-center gap-2">
                                     <CheckCircle className="h-3 w-3 text-muted-foreground" />
                                     {item.name}
                                  </li>
                               ))}
                            </ul>
                            {employee.activeOrder.status === 'IN_PROGRESS' && (
                               <div className="mt-4 pt-4 border-t flex justify-end">
                                  <Button 
                                     onClick={() => handleUpdateStatus(employee.activeOrder.id, 'READY')}
                                     disabled={updatingId === employee.activeOrder.id}
                                     className="bg-green-600 hover:bg-green-700 text-white font-bold gap-2 w-full md:w-auto"
                                  >
                                     {updatingId === employee.activeOrder.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                     ) : (
                                        <CheckCircle className="h-4 w-4" />
                                     )}
                                     Selesaikan Pekerjaan
                                  </Button>
                               </div>
                            )}
                         </div>
                      </div>
                   </CardContent>
                </Card>
             ) : (
                <Card className="border-dashed">
                   <CardContent className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                         <Wrench className="h-6 w-6 opacity-50" />
                      </div>
                      <p className="font-medium">Tidak ada pekerjaan aktif</p>
                      <p className="text-sm">Anda sedang standby menunggu order masuk.</p>
                   </CardContent>
                </Card>
             )}

             {/* Order Queue */}
             {employee.queueOrders && employee.queueOrders.length > 0 && (
                <div className="space-y-3">
                   <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Clock className="h-4 w-4" /> 
                      Antrian Pekerjaan ({employee.queueOrders.length})
                   </h3>
                   <div className="grid gap-3 md:grid-cols-2">
                      {employee.queueOrders.map((order: any) => (
                         <Card key={order.id} className="opacity-80 hover:opacity-100 transition-opacity">
                            <CardContent className="p-4">
                               <div className="flex justify-between items-start mb-2">
                                  <div>
                                     <div className="font-bold">{order.custName}</div>
                                     <div className="text-sm text-muted-foreground flex gap-2">
                                        <span>{order.vehicle}</span>
                                        <span>•</span>
                                        <span>{order.plateNumber}</span>
                                     </div>
                                  </div>
                                  <Badge variant="secondary">PENDING</Badge>
                               </div>
                               <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                                  {Array.isArray(order.items) ? (
                                      <ul className="list-disc pl-3 space-y-1">
                                          {(order.items as any[]).slice(0, 2).map((item: any, idx: number) => (
                                              <li key={idx} className="truncate">{item.name}</li>
                                          ))}
                                          {(order.items as any[]).length > 2 && <li>...</li>}
                                      </ul>
                                  ) : "Detail items tidak tersedia"}
                               </div>
                                <div className="flex justify-end mt-3 pt-2 border-t border-dashed">
                                   <Button 
                                      size="sm"
                                      onClick={() => handleUpdateStatus(order.id, 'IN_PROGRESS')}
                                      disabled={updatingId !== null}
                                      className="font-semibold gap-1 w-full"
                                   >
                                      {updatingId === order.id ? (
                                         <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                         <Wrench className="h-3 w-3" />
                                      )}
                                      Mulai Pekerjaan
                                   </Button>
                                </div>
                            </CardContent>
                         </Card>
                      ))}
                   </div>
                </div>
             )}
          </TabsContent>

          {/* HISTORY TAB */}
          <TabsContent value="history" className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2">
             <Card>
                <CardHeader>
                   <CardTitle>Riwayat Pekerjaan</CardTitle>
                   <CardDescription>20 Pekerjaan terakhir Anda</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                   <div className="divide-y divide-border">
                      {employee.orderFees && employee.orderFees.length > 0 ? (
                         employee.orderFees.map((fee: any) => (
                            <div key={fee.id} className="p-4 hover:bg-muted/50 transition-colors flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                               <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                     <span className="font-bold">{fee.order.custName}</span>
                                     <span className="text-xs text-muted-foreground">#{fee.order.id.slice(-5)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                     <span>{fee.order.vehicle}</span>
                                     <span>•</span>
                                     <span>{fee.order.plateNumber}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                     <Clock className="h-3 w-3" />
                                     {formatDistanceToNow(new Date(fee.createdAt), { addSuffix: true, locale: idLocale })}
                                  </p>
                               </div>
                               
                               <div className="flex items-center justify-between w-full md:w-auto gap-4">
                                  <Badge variant={fee.isPaid ? "default" : "secondary"}>
                                     {fee.isPaid ? "LUNAS" : "PENDING"}
                                  </Badge>
                                  <span className="font-bold font-mono text-primary">
                                     Rp {fee.amount.toLocaleString("id-ID")}
                                  </span>
                               </div>
                            </div>
                         ))
                      ) : (
                         <div className="p-8 text-center text-muted-foreground">
                            Belum ada riwayat pekerjaan.
                         </div>
                      )}
                   </div>
                </CardContent>
             </Card>
          </TabsContent>

          {/* PAYROLL TAB */}
          <TabsContent value="payrolls" className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2">
             <Card>
                <CardHeader>
                   <CardTitle>Slip Gaji & Pembayaran</CardTitle>
                   <CardDescription>Riwayat slip gaji yang telah diproses oleh admin</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                   <div className="divide-y divide-border">
                      {employee.payrolls && employee.payrolls.length > 0 ? (
                         employee.payrolls.map((payroll: any) => (
                            <div key={payroll.id} className="p-4 hover:bg-muted/50 transition-colors flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                               <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                     <span className="font-bold text-sm md:text-base">
                                        Periode: {format(new Date(payroll.startDate), "dd MMM yyyy")} - {format(new Date(payroll.endDate), "dd MMM yyyy")}
                                     </span>
                                     <span className="text-xs text-muted-foreground">ID: #{payroll.id.slice(-5)}</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground space-y-0.5">
                                     <p>Gaji Pokok: Rp {payroll.baseSalary.toLocaleString("id-ID")} • Bonus: Rp {payroll.bonus.toLocaleString("id-ID")}</p>
                                     {payroll.details && <p className="italic">Ket: {payroll.details}</p>}
                                  </div>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                     <Calendar className="h-3 w-3" />
                                     Dibuat {formatDistanceToNow(new Date(payroll.createdAt), { addSuffix: true, locale: idLocale })}
                                  </p>
                               </div>
                               
                               <div className="flex items-center justify-between w-full md:w-auto gap-4">
                                  <Badge variant={payroll.status === "PAID" ? "default" : payroll.status === "PARTIAL" ? "secondary" : "destructive"}>
                                     {payroll.status === "PAID" ? "DIBAYAR" : payroll.status === "PARTIAL" ? "SEBAGIAN" : "BELUM DIBAYAR"}
                                  </Badge>
                                  <span className="font-bold font-mono text-primary text-base">
                                     Rp {payroll.totalPaid.toLocaleString("id-ID")}
                                  </span>
                               </div>
                            </div>
                         ))
                      ) : (
                         <div className="p-8 text-center text-muted-foreground">
                            Belum ada riwayat slip gaji yang dicatat.
                         </div>
                      )}
                   </div>
                </CardContent>
             </Card>
          </TabsContent>

          {/* PROFILE TAB */}
          <TabsContent value="profile" className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2">
             <Card>
                <CardHeader>
                   <CardTitle>Profil Karyawan</CardTitle>
                   <CardDescription>Informasi akun Anda</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20 border-2 border-primary/20">
                         <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=random&size=128`} />
                         <AvatarFallback className="text-2xl">{employee.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                         <h3 className="text-xl font-bold">{employee.name}</h3>
                         <Badge variant="outline" className="mt-1">{employee.role}</Badge>
                      </div>
                   </div>

                   <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                      <div className="space-y-1">
                         <label className="text-xs font-medium text-muted-foreground uppercase">Email Login</label>
                         <p className="font-medium">{user.email}</p>
                      </div>
                      <div className="space-y-1">
                         <label className="text-xs font-medium text-muted-foreground uppercase">Role Access</label>
                         <p className="font-medium">{user.role}</p>
                      </div>
                      <div className="space-y-1">
                         <label className="text-xs font-medium text-muted-foreground uppercase">Tipe Gaji</label>
                         <p className="font-medium">{employee.salaryType === 'COMMISSION' ? 'Komisi / Bagi Hasil' : 'Gaji Harian'}</p>
                      </div>
                      {employee.salaryType === 'COMMISSION' && (
                         <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase">Persentase Komisi</label>
                            <p className="font-medium">{employee.commissionRate}%</p>
                         </div>
                      )}
                      {employee.salaryType === 'DAILY' && (
                         <div className="space-y-1">
                             <label className="text-xs font-medium text-muted-foreground uppercase">Gaji Harian</label>
                             <p className="font-medium">Rp {employee.dailyRate.toLocaleString("id-ID")}</p>
                         </div>
                      )}
                   </div>
                </CardContent>
             </Card>
          </TabsContent>
          
        </Tabs>
      </main>
    </div>
  );
}
