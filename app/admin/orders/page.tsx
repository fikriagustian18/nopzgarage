"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RoleGuard } from "@/components/RoleGuard";
import {
  LayoutDashboard,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  Wrench,
  FileText,
  ClipboardList
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { getAdminOrders, finishOrder, closeOrder, confirmOrder } from "@/app/actions/orders";
import { OrderStatus as PrismaOrderStatus, ServiceType } from "@prisma/client";
import { OrderDialog } from "@/components/OrderDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { ProcessOrderDialog } from "@/components/ProcessOrderDialog";
import { PaymentDialog } from "@/components/PaymentDialog"; 
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/hooks/use-toast";
import { ExportButton } from "@/components/export/ExportButton";
import { exportOrderList } from "@/lib/export/reports/order-list-export";
import { exportInvoice } from "@/lib/export/reports/invoice-export";
import { getOrderDetail } from "@/app/actions/orders";
import type { OrderListExport, InvoiceExport } from "@/lib/export/types";
import { Printer } from "lucide-react";

type Order = {
  id: string;
  custName: string;
  custPhone: string;
  vehicle: string;
  plateNumber: string | null;
  serviceType: ServiceType;
  status: PrismaOrderStatus;
  totalPrice: number;
  totalPaid: number;
  createdAt: Date;
  complaint: string;
  mechanic?: {
    id: string;
    name: string;
    role: string;
  } | null;
  payments: any[];
  paymentStatus: string;
};

export default function OrdersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<PrismaOrderStatus | "ALL">("ALL");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "view">("create");
  const [selectedOrder, setSelectedOrder] = useState<Order | undefined>();
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [orderToFinish, setOrderToFinish] = useState<Order | null>(null);
  const [finishLoading, setFinishLoading] = useState(false);
  
  // Close/Handover dialog states
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [orderToClose, setOrderToClose] = useState<Order | null>(null);
  const [closeLoading, setCloseLoading] = useState(false);
  
  // Delete dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<{ id: string; custName: string; vehicle: string } | null>(null);

  // Confirm dialog states
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [orderToConfirm, setOrderToConfirm] = useState<Order | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  async function handleConfirmOrder() {
    if (!orderToConfirm) return;
    setConfirmLoading(true);
    try {
      const result = await confirmOrder(orderToConfirm.id);
      if (result.success) {
        toast({
          title: "✅ Berhasil!",
          description: "Booking berhasil dikonfirmasi ke status Menunggu Servis",
        });
        setConfirmDialogOpen(false);
        fetchOrders();
      } else {
        toast({
          variant: "destructive",
          title: "❌ Gagal",
          description: result.error || "Gagal mengonfirmasi booking",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: "Terjadi kesalahan sistem",
      });
    } finally {
      setConfirmLoading(false);
    }
  }

  // Fetch orders when search or filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, filterStatus]);

  async function fetchOrders() {
    setIsLoading(true);
    try {
      const result = await getAdminOrders({
        status: filterStatus === "ALL" ? undefined : filterStatus,
        search: searchQuery,
        limit: 50
      });
      if (result.success && result.orders) {
        setOrders(result.orders as Order[]);
      }
    } catch (error) {
      // Error handled silently
    } finally {
      setIsLoading(false);
    }
  }

  const getStatusBadge = (status: PrismaOrderStatus) => {
    const statusConfig: Record<PrismaOrderStatus, {
      label: string;
      className: string;
      icon: any;
    }> = {
      PENDING: {
        label: "Menunggu",
        className: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700",
        icon: Clock,
      },
      ESTIMATED: {
        label: "Estimasi Dibuat",
        className: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700",
        icon: FileText,
      },
      CONFIRMED: {
        label: "Menunggu Servis",
        className: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-700",
        icon: CheckCircle,
      },
      QUEUE: {
        label: "Antrian",
        className: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700",
        icon: Clock,
      },
      IN_PROGRESS: {
        label: "Dikerjakan",
        className: "bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700",
        icon: Wrench,
      },
      READY: {
        label: "Siap Diambil",
        className: "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-700",
        icon: CheckCircle,
      },
      COMPLETED: {
        label: "Selesai",
        className: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700",
        icon: CheckCircle,
      },
      CANCELLED: {
        label: "Dibatalkan",
        className: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700",
        icon: XCircle,
      },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700">Lunas</Badge>;
      case "PARTIAL":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700">Sebagian</Badge>;
      default:
        return <Badge className="bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700">Belum Bayar</Badge>;
    }
  };

  // Filtered orders is now just the orders from server
  const filteredOrders = orders;

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="min-h-screen bg-background text-foreground">
        {/* Main Content */}
        <div className="p-8 space-y-6">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-foreground mb-2">
            Kelola Order
          </h2>
          <p className="text-muted-foreground">
            Kelola semua order servis kendaraan pelanggan
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan nama, plat nomor, atau ID order..."
              className="pl-10 text-foreground bg-background border-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => router.push("/admin/orders/kanban")}
            >
              <LayoutDashboard className="h-4 w-4" />
              Kanban View
            </Button>
            <Button 
              className="gap-2"
              onClick={() => {
                setDialogMode("create");
                setSelectedOrder(undefined);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Order Baru
            </Button>
          </div>
        </div>

        {/* Export List Button */}
        <div className="flex justify-end mb-4">
             <ExportButton
                title="Daftar_Order"
                onExport={async (format, orientation) => {
                    const exportData: OrderListExport[] = filteredOrders.map(o => ({
                        id: o.id,
                        date: o.createdAt,
                        customerName: o.custName,
                        vehicle: o.vehicle,
                        plateNumber: o.plateNumber || '-',
                        serviceType: o.serviceType,
                        mechanic: o.mechanic?.name || '-',
                        status: o.status,
                        paymentStatus: o.paymentStatus,
                        totalAmount: o.totalPrice
                    }));
                    return await exportOrderList(exportData, format, orientation);
                }}
                variant="outline"
                label="Export Data Order"
             />
        </div>

        {/* Filter Tabs */}


        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant={filterStatus === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("ALL")}
          >
            Semua ({orders.length})
          </Button>
          <Button
            variant={filterStatus === "PENDING" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("PENDING")}
          >
            Menunggu ({orders.filter((o) => o.status === "PENDING").length})
          </Button>
          <Button
            variant={filterStatus === "IN_PROGRESS" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("IN_PROGRESS")}
          >
            Dikerjakan ({orders.filter((o) => o.status === "IN_PROGRESS").length})
          </Button>
          <Button
            variant={filterStatus === "ESTIMATED" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("ESTIMATED")}
          >
            Estimasi ({orders.filter((o) => o.status === "ESTIMATED").length})
          </Button>
          <Button
            variant={filterStatus === "COMPLETED" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("COMPLETED")}
          >
            Selesai ({orders.filter((o) => o.status === "COMPLETED").length})
          </Button>
        </div>

        {/* Orders Table */}
        <Card className="border-border bg-card">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12">
                <Wrench className="h-12 w-12 mx-auto mb-3 text-muted-foreground animate-spin" />
                <p className="text-muted-foreground">Memuat data orders...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      No. Antrian
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Pelanggan
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Kendaraan
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status Bayar
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">
                          {order.id.slice(-8)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString("id-ID")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.status === "CANCELLED" ? (
                          <span className="text-sm text-muted-foreground">-</span>
                        ) : (
                          <Badge variant="secondary" className="font-mono font-bold text-xs bg-primary/10 text-primary border-primary/20">
                            {(order as any).queueNumber || "-"}
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">
                          {order.custName}
                        </div>
                        {order.mechanic && (
                          <div className="text-xs text-muted-foreground">
                            Mekanik: {order.mechanic.name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">
                          {order.vehicle}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.plateNumber || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentBadge(order.paymentStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-foreground">
                          Rp {Number(order.totalPrice).toLocaleString("id-ID")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                        {order.status === "PENDING" && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                            onClick={() => {
                              setSelectedOrder(order);
                              setProcessDialogOpen(true);
                            }}
                          >
                            <Wrench className="h-4 w-4 mr-1" /> Proses
                          </Button>
                        )}
                        {order.status === "IN_PROGRESS" && (
                          <Button 
                            variant="default" 
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => {
                              setOrderToFinish(order);
                              setFinishDialogOpen(true);
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> Selesai
                          </Button>
                        )}
                        
                        {/* Tombol Bayar */}
                        {(order.status === "READY" || order.status === "COMPLETED") && order.paymentStatus !== 'PAID' && (
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => {
                              setSelectedOrder(order);
                              setPaymentDialogOpen(true);
                            }}
                          >
                            <CreditCard className="h-4 w-4 mr-1" /> Bayar
                          </Button>
                        )}

                        {/* Tombol Serah Terima / Close Order */}
                        {order.status === "READY" && (
                           <Button
                            variant="default"
                            size="sm"
                            className="bg-gray-700 hover:bg-gray-800 text-white"
                            onClick={() => {
                              setOrderToClose(order);
                              setCloseDialogOpen(true);
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> Serah Terima
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setDialogMode("view");
                            setDialogOpen(true);
                          }}
                        >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setDialogMode("edit");
                              setDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setOrderToDelete({
                                id: order.id,
                                custName: order.custName,
                                vehicle: order.vehicle
                              });
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                          
                          {/* Invoice Export Button */}
                          <ExportButton
                            title={`Invoice_${order.id.slice(-6)}`}
                            variant="ghost"
                            size="sm"
                            hideLabel={true}
                            icon={<Printer className="h-4 w-4" />}
                            onExport={async (format, orientation) => {
                                // Fetch full details first
                                const res = await getOrderDetail(order.id);
                                if (!res.success || !res.order) {
                                    toast({ title: "Gagal", description: "Gagal mengambil data invoice", variant: "destructive" });
                                    return new Blob([]);
                                }
                                const fullOrder = res.order;
                                
                                const invoiceData: InvoiceExport = {
                                    invoiceNumber: `INV-${fullOrder.id.slice(-6).toUpperCase()}`,
                                    invoiceDate: fullOrder.createdAt,
                                    dueDate: new Date(new Date(fullOrder.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000), // Est 7 days
                                    customerName: fullOrder.custName,
                                    customerAddress: "-", // Add if available
                                    items: fullOrder.orderItems.map((item: any) => ({
                                        description: item.itemName,
                                        quantity: item.quantity,
                                        unitPrice: item.unitPrice,
                                        total: item.totalPrice
                                    })),
                                    subtotal: fullOrder.totalPrice, // Assuming no tax/discount logic yet or included
                                    tax: 0,
                                    discount: 0,
                                    total: fullOrder.totalPrice,
                                    notes: `Kendaraan: ${fullOrder.vehicle} (${fullOrder.plateNumber || '-'})`
                                };
                                return await exportInvoice(invoiceData, format, orientation);
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredOrders.length === 0 && (
                <div className="text-center py-12">
                  <ClipboardList className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">Tidak ada order yang ditemukan</p>
                </div>
              )}
            </div>
            )}
          </CardContent>
        </Card>
      </div>

      <OrderDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        order={selectedOrder}
        onSuccess={fetchOrders}
      />

      {selectedOrder && (
        <ProcessOrderDialog
          open={processDialogOpen}
          onOpenChange={setProcessDialogOpen}
          order={selectedOrder}
          onSuccess={fetchOrders}
        />
      )}

      {selectedOrder && (
        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          order={selectedOrder}
          onSuccess={fetchOrders}
        />
      )}

      {orderToDelete && (
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          orderId={orderToDelete.id}
          orderInfo={orderToDelete}
          onSuccess={fetchOrders}
        />
      )}
      
      {/* Finish Order Confirmation Dialog */}
      {orderToFinish && (
        <Dialog open={finishDialogOpen} onOpenChange={setFinishDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Konfirmasi Selesai Pengerjaan
              </DialogTitle>
              <DialogDescription>
                Pastikan pekerjaan sudah 100% selesai sebelum melanjutkan.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-bold">{orderToFinish.custName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Kendaraan</span>
                  <span className="font-medium">{orderToFinish.vehicle}</span>
                </div>
                {orderToFinish.plateNumber && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Plat Nomor</span>
                    <span className="font-medium font-mono">{orderToFinish.plateNumber}</span>
                  </div>
                )}
                {orderToFinish.mechanic && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Dikerjakan Oleh</span>
                    <span className="font-medium">{orderToFinish.mechanic.name}</span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Tagihan</span>
                  <span className="text-xl font-black text-green-700 dark:text-green-400">
                    Rp {Number(orderToFinish.totalPrice).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-xs text-yellow-800 dark:text-yellow-400">
                  Setelah dikonfirmasi, status akan berubah ke <strong>READY (Siap Diambil)</strong> dan customer akan bisa melakukan pembayaran.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setFinishDialogOpen(false)}
                disabled={finishLoading}
              >
                Batal
              </Button>
              <Button 
                onClick={async () => {
                  setFinishLoading(true);
                  try {
                    const result = await finishOrder(orderToFinish.id);
                    if (result.success) {
                      toast({
                        title: "Order Selesai!",
                        description: `Pengerjaan ${orderToFinish.vehicle} untuk ${orderToFinish.custName} telah selesai.`,
                      });
                      setFinishDialogOpen(false);
                      fetchOrders();
                    } else {
                      toast({
                        variant: "destructive",
                        title: "Gagal",
                        description: result.error || "Gagal menyelesaikan order",
                      });
                    }
                  } catch (error) {
                    toast({
                      variant: "destructive",
                      title: "Error",
                      description: "Terjadi kesalahan sistem",
                    });
                  } finally {
                    setFinishLoading(false);
                  }
                }}
                disabled={finishLoading}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                {finishLoading && <Clock className="h-4 w-4 animate-spin" />}
                Ya, Selesaikan Pengerjaan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Close/Handover Dialog */}
      {orderToClose && (
        <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-gray-600" />
                Serah Terima Kendaraan?
              </DialogTitle>
              <DialogDescription>
                Pastikan admin telah menerima pembayaran dan kendaraan diserahkan ke pelanggan.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
               <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Customer</span>
                    <span className="font-bold">{orderToClose.custName}</span>
                  </div>
                   <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status Bayar</span>
                    <span>{getPaymentBadge(orderToClose.paymentStatus)}</span>
                  </div>
               </div>
               
               {orderToClose.paymentStatus !== 'PAID' && (
                 <div className="p-3 bg-red-50 text-red-600 text-xs rounded border border-red-200">
                    Peringatan: Order ini <b>BELUM LUNAS</b>. Apakah Anda yakin ingin menyerahkan kendaraan?
                 </div>
               )}
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setCloseDialogOpen(false)}
                disabled={closeLoading}
              >
                Batal
              </Button>
              <Button 
                onClick={async () => {
                  setCloseLoading(true);
                  try {
                    const result = await closeOrder(orderToClose.id);
                    if (result.success) {
                      toast({
                        title: "Order Ditutup!",
                        description: `Order selesai dan kendaraan telah diserahkan.`,
                      });
                      setCloseDialogOpen(false);
                      fetchOrders();
                    } else {
                      toast({ variant: "destructive", title: "Gagal", description: "Gagal menutup order" });
                    }
                  } catch (error) {
                    toast({ variant: "destructive", title: "Error", description: "Terjadi kesalahan" });
                  } finally {
                    setCloseLoading(false);
                  }
                }}
                disabled={closeLoading}
                className="gap-2 bg-gray-800 hover:bg-gray-900"
              >
                {closeLoading && <Clock className="h-4 w-4 animate-spin" />}
                Ya, Serahkan Unit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Confirm Booking Dialog */}
      {orderToConfirm && (
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-indigo-600" />
                Konfirmasi Booking Pelayanan
              </DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin menyetujui booking ini dan mengubah statusnya menjadi <strong>Menunggu Servis</strong>?
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pelanggan</span>
                  <span className="font-bold">{orderToConfirm.custName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Kendaraan</span>
                  <span className="font-medium">{orderToConfirm.vehicle}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Jenis Layanan</span>
                  <span className="font-medium capitalize">{orderToConfirm.serviceType.replace('_', ' ')}</span>
                </div>
                {orderToConfirm.plateNumber && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Plat Nomor</span>
                    <span className="font-medium font-mono">{orderToConfirm.plateNumber}</span>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setConfirmDialogOpen(false)}
                disabled={confirmLoading}
              >
                Batal
              </Button>
              <Button 
                onClick={handleConfirmOrder}
                disabled={confirmLoading}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {confirmLoading && <Clock className="h-4 w-4 animate-spin" />}
                Konfirmasi Booking
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      <Toaster />
      </div>
    </RoleGuard>
  );
}
