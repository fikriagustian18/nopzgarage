"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, 
  Phone, 
  Wrench, 
  CheckCircle, 
  Clock, 
  Bike,
  CreditCard,
  Wallet,
  Activity,
  User,
  DollarSign
} from "lucide-react";
import { getEmployeeDetail } from "@/app/actions/employees";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { PaymentConfirmDialog } from "./PaymentConfirmDialog";

interface EmployeeDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string | null;
}

export function EmployeeDetailDialog({ 
  open, 
  onOpenChange, 
  employeeId 
}: EmployeeDetailDialogProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && employeeId) {
      fetchDetail();
    } else {
      setData(null);
    }
  }, [open, employeeId]);

  async function fetchDetail() {
    if (!employeeId) return;
    setLoading(true);
    try {
      const res = await getEmployeeDetail(employeeId);
      if (res.success) {
        setData(res.employee);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // Handling Payment
  const [payLoading, setPayLoading] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    type: 'BULK' | 'SINGLE';
    fee?: any;
    title: string;
    desc: string;
    amount: number;
    count?: number;
  }>({
    open: false,
    type: 'BULK',
    title: "",
    desc: "",
    amount: 0
  });

  function openBulkConfirm() {
      if (!data) return;
      setConfirmState({
          open: true,
          type: 'BULK',
          title: "Cairkan Komisi",
          desc: "Pembayaran komisi akumulatif",
          amount: data.stats.totalUnpaid,
          count: data.stats.taskCount 
      });
  }

  function openSingleConfirm(fee: any) {
      setConfirmState({
          open: true,
          type: 'SINGLE',
          fee: fee,
          title: "Bayar Komisi",
          desc: `Pembayaran komisi untuk ${fee.order?.vehicle}`,
          amount: fee.amount
      });
  }
  
  async function handleConfirmPayment() {
    if (!employeeId) return;
    
    // setPayLoading(true); // Handled by Dialog
    try {
        if (confirmState.type === 'BULK') {
            const { payAllCommissions } = await import("@/app/actions/employees");
            const res = await payAllCommissions(employeeId);
            if (res.success) {
                // alert(`Berhasil membayar Rp ${res.amount?.toLocaleString()} untuk ${res.count} order.`);
                fetchDetail(); 
            } else if ('error' in res) {
                alert("Gagal: " + res.error);
            }
        } else {
            if (!confirmState.fee) return;
            const { payCommission } = await import("@/app/actions/employees");
            const res = await payCommission(confirmState.fee.id);
            if (res.success) {
                fetchDetail();
            } else if ('error' in res) {
                alert("Gagal: " + res.error);
            }
        }
    } catch (err: any) {
        alert("Error: " + err.message);
    }
  }

  // Helper formats
  const formatMoney = (val: number) => 
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  const getJobDesc = (order: any) => {
    if (!order) return "";
    try {
        const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        if (Array.isArray(items) && items.length > 0) {
            return items.map((i:any) => i.name).join(", ");
        }
        return "Service Umum";
    } catch {
        return "Service";
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[95vw] md:max-w-[1200px] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        
        {/* Header Fixed */}
        <div className="p-6 border-b bg-muted/10 shrink-0 flex items-center justify-between">
          <div>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              Detail & Performa Karyawan
            </DialogTitle>
            <DialogDescription className="mt-1">
              Dashboard performa, status pekerjaan, dan analisis keuangan.
            </DialogDescription>
          </div>
          {data && (
            <Badge variant={data.isActive ? "default" : "destructive"} className="text-sm px-3 py-1">
              {data.isActive ? "Status: AKTIF" : "Status: NON-AKTIF"}
            </Badge>
          )}
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto bg-muted/5">
          {loading || !data ? (
             <div className="p-8 space-y-8 animate-pulse">
               <div className="flex gap-6">
                 <div className="h-24 w-24 bg-muted/20 rounded-full" />
                 <div className="space-y-4 flex-1">
                    <div className="h-8 w-1/3 bg-muted/20 rounded" />
                    <div className="h-4 w-1/4 bg-muted/20 rounded" />
                 </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted/20 rounded-xl" />)}
               </div>
               <div className="h-60 bg-muted/20 rounded-xl" />
             </div>
          ) : (
            <div className="p-6 space-y-6">
              
              {/* Row 1: Profile & Active Job */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Profile Widget */}
                <div className="bg-card border rounded-xl p-5 shadow-sm flex items-start gap-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <User className="h-24 w-24" />
                  </div>
                  <div className="h-20 w-20 shrink-0 bg-primary/10 rounded-full flex items-center justify-center text-3xl font-black text-primary border-2 border-primary/20 z-10">
                    {data.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0 z-10">
                    <h2 className="text-3xl font-bold truncate">{data.name}</h2>
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      <span className="font-medium">{data.role}</span>
                    </div>
                    {data.phone && (
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" /> {data.phone}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Widget */}
                <div className={`rounded-xl p-5 border shadow-sm transition-all relative overflow-hidden flex flex-col justify-between ${data.activeOrder ? 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800' : 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'}`}>
                   <div className="flex items-center justify-between mb-4 z-10 relative">
                      <h3 className={`font-bold flex items-center gap-2 ${data.activeOrder ? 'text-orange-700 dark:text-orange-400' : 'text-green-700 dark:text-green-400'}`}>
                        {data.activeOrder ? <Clock className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                        {data.activeOrder ? "SEDANG SIBUK" : "STATUS AVAILABLE"}
                      </h3>
                      {data.activeOrder && <span className="animate-ping absolute right-0 top-0 h-3 w-3 rounded-full bg-orange-400 opacity-75"></span>}
                   </div>

                   {data.activeOrder ? (
                     <div className="bg-background/80 backdrop-blur rounded-lg p-3 border border-orange-100 dark:border-orange-900/50 z-10">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-lg font-bold text-foreground line-clamp-1">{data.activeOrder.vehicle}</p>
                            <p className="font-mono text-xs text-muted-foreground">{data.activeOrder.plateNumber}</p>
                          </div>
                          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                             {format(new Date(data.activeOrder.createdAt), "HH:mm", { locale: id })}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-dashed">
                          <Wrench className="h-3.5 w-3.5 text-orange-600" />
                          <span className="text-xs font-medium text-orange-900 dark:text-orange-200 line-clamp-1">
                            {getJobDesc(data.activeOrder)}
                          </span>
                        </div>
                     </div>
                   ) : (
                     <p className="text-sm text-muted-foreground z-10">
                       Tidak ada pekerjaan aktif. Mekanik siap menerima order baru.
                     </p>
                   )}
                </div>
              </div>

              {/* Row 2: Financial Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                 <div className="bg-card p-5 rounded-xl border shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                       <Activity className="h-4 w-4" /> <span className="text-xs font-bold uppercase tracking-wider">Total Unit</span>
                    </div>
                    <p className="text-3xl font-black">{data.stats.taskCount}</p>
                 </div>

                 <div className="bg-card p-5 rounded-xl border shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                       <Wallet className="h-4 w-4" /> <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sudah Dibayar</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600 truncate">{formatMoney(data.stats.totalPaid)}</p>
                 </div>

                 <div className="bg-card p-5 rounded-xl border shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-destructive mb-2">
                       <CreditCard className="h-4 w-4" /> <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Belum Dibayar</span>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-destructive truncate">{formatMoney(data.stats.totalUnpaid)}</p>
                        {data.stats.totalUnpaid > 0 && (
                            <button 
                                onClick={openBulkConfirm}
                                disabled={payLoading}
                                className="mt-2 text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 w-full py-1.5 rounded font-bold transition-colors disabled:opacity-50">
                                {payLoading ? "Processing..." : "CAIRKAN SEKARANG"}
                            </button>
                        )}
                    </div>
                 </div>

                 <div className="bg-primary/5 p-5 rounded-xl border border-primary/20 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-primary mb-2">
                       <DollarSign className="h-4 w-4" /> <span className="text-xs font-bold uppercase tracking-wider">Total Pendapatan</span>
                    </div>
                    <p className="text-2xl font-bold text-primary truncate">{formatMoney(data.stats.totalEarned)}</p>
                 </div>
              </div>

              {/* Row 3: History (Full Width) */}
              <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                 <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                    <h3 className="font-bold flex items-center gap-2 text-lg">
                       <Bike className="h-5 w-5 text-muted-foreground" />
                       Riwayat Pekerjaan
                    </h3>
                    <Badge variant="outline">20 Terakhir</Badge>
                 </div>
                 
                 <div className="divide-y max-h-[400px] overflow-y-auto">
                    {data.orderFees.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                         <Bike className="h-12 w-12 mx-auto mb-3 opacity-20" />
                         <p>Belum ada riwayat pekerjaan</p>
                      </div>
                    ) : (
                      data.orderFees.map((fee: any) => (
                         <div key={fee.id} className="p-4 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                              <div className="flex flex-1 gap-4 items-start">
                                 <div className="h-10 w-10 shrink-0 bg-muted rounded-lg flex items-center justify-center font-bold text-sm text-muted-foreground border">
                                    {(fee.order?.vehicle || "?").substring(0,2).toUpperCase()}
                                 </div>
                                 <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-bold text-base truncate">{fee.order?.vehicle || "Unknown"}</span>
                                      <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0 h-5">
                                        {fee.order?.plateNumber}
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3">
                                       <span>Customer: <b>{fee.order?.custName}</b></span>
                                       <span>•</span>
                                       <span>{format(new Date(fee.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}</span>
                                    </div>
                                 </div>
                              </div>
                              
                              <div className="flex items-center gap-4 justify-between sm:justify-end min-w-[200px]">
                                 <div className="text-right">
                                    <div className="font-bold text-sm">{formatMoney(fee.amount)}</div>
                                    <div className="text-[10px] text-muted-foreground">Komisi</div>
                                 </div>
                                 {fee.isPaid ? (
                                    <Badge className="bg-green-100 text-green-700 border-green-200">
                                        LUNAS
                                    </Badge>
                                 ) : (
                                     <div className="flex gap-2">
                                         <Badge className="bg-red-100 text-red-700 border-red-200">
                                            HUTANG
                                         </Badge>
                                         <button 
                                            onClick={() => openSingleConfirm(fee)}
                                            disabled={payLoading}
                                            className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded shadow hover:bg-primary/90 disabled:opacity-50">
                                            Bayar
                                         </button>
                                     </div>
                                 )}
                              </div>
                         </div>
                      ))
                    )}
                 </div>
              </div>

            </div>
          )}

          {/* Render Confirm Dialog */}
          <PaymentConfirmDialog
             open={confirmState.open}
             onOpenChange={(v) => setConfirmState(prev => ({ ...prev, open: v }))}
             title={confirmState.title}
             description={confirmState.desc}
             details={[
                 { label: "Total Pembayaran", value: formatMoney(confirmState.amount || 0) },
                 { label: "Penerima", value: data?.name || "-" },
             ]}
             confirmLabel={confirmState.type === 'BULK' ? "Cairkan Semua" : "Bayar Sekarang"}
             onConfirm={handleConfirmPayment}
          />
          
        </div>
      </DialogContent>
    </Dialog>
  );
}
