"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { OrderStatus as PrismaOrderStatus, ServiceType } from "@prisma/client";
import {
  Search,
  Edit,
  Trash2,
  XCircle,
  Eye,
  CheckCircle,
  Clock,
  Wrench,
  FileText,
  ClipboardList,
  Printer,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  Plus,
  CreditCard,
} from "lucide-react";

import { RoleGuard } from "@/components/shared/RoleGuard";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { OrderDialog } from "@/components/dialogs/OrderDialog";
import { DeleteConfirmDialog } from "@/components/dialogs/DeleteConfirmDialog";
import { ProcessOrderDialog } from "@/components/dialogs/ProcessOrderDialog";
import { PaymentDialog } from "@/components/dialogs/PaymentDialog";
import { Toaster } from "@/components/ui/Toaster";
import { ExportButton } from "@/components/export/ExportButton";

import { getAdminOrders, finishOrder, closeOrder, confirmOrder, getOrderDetail } from "@/lib/actions/orders";
import { getMechanics } from "@/lib/actions/employees";
import { toast } from "@/hooks/useToast";
import { exportInvoice } from "@/lib/export/reports/invoiceExport";

import type { InvoiceExport } from "@/lib/export/types";

interface Order {
  id: string;
  custName: string;
  custPhone: string;
  vehicle: string;
  plateNumber: string | null;
  serviceType: ServiceType;
  status: PrismaOrderStatus;
  totalPrice: number;
  totalPaid: number;
  createdAt: string;
  updatedAt: string;
  scheduledAt: string | null;
  complaint: string;
  items: any[];
  mechanic?: {
    id: string;
    name: string;
    role: string;
  } | null;
  payments: any[];
  paymentStatus: string;
  queueNumber?: string;
}

interface Mechanic {
  id: string;
  name: string;
  role: string;
}

export default function Page() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "WAITING" | "WORKING" | "FINISHED">("ALL");
  const [filterMechanic, setFilterMechanic] = useState<string>("ALL");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Dialog States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "view">("create");
  const [selectedOrder, setSelectedOrder] = useState<Order | undefined>();
  
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const [finishDialogOpen, setFinishDialogOpen] = useState(false);
  const [orderToFinish, setOrderToFinish] = useState<Order | null>(null);
  const [finishLoading, setFinishLoading] = useState(false);
  
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [orderToClose, setOrderToClose] = useState<Order | null>(null);
  const [closeLoading, setCloseLoading] = useState(false);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [orderToConfirm, setOrderToConfirm] = useState<Order | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Load Data
  useEffect(() => {
    fetchData();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const query = params.get("search");
      if (query) {
        setSearchQuery(query);
      }
    }
  }, []);

  async function fetchData() {
    setIsLoading(true);
    try {
      const [ordersRes, mechRes] = await Promise.all([
        getAdminOrders({ limit: 100 }),
        getMechanics()
      ]);

      if (ordersRes.success && ordersRes.orders) {
        setOrders(ordersRes.orders as Order[]);
      }
      if (mechRes.success && mechRes.mechanics) {
        setMechanics(mechRes.mechanics as Mechanic[]);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: "Gagal memuat data pelayanan",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Handle confirmation booking
  async function handleConfirmOrder() {
    if (!orderToConfirm) {
      return;
    }
    setConfirmLoading(true);
    try {
      const result = await confirmOrder(orderToConfirm.id);
      if (result.success) {
        toast({
          title: "✅ Berhasil!",
          description: "Booking berhasil dikonfirmasi ke status Menunggu Servis",
        });
        setConfirmDialogOpen(false);
        fetchData();
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

  // Reset Filters
  function handleResetFilters() {
    setSearchQuery("");
    setFilterStatus("ALL");
    setFilterMechanic("ALL");
    setCurrentPage(1);
  }

  // Helper formatting dates in Indonesian
  function formatIndonesianDate(dateString?: string | Date | null) {
    if (!dateString) {
      return { dateStr: "-", timeStr: "-" };
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return { dateStr: "-", timeStr: "-" };
    }
    
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    
    return {
      dateStr: `${day} ${month} ${year}`,
      timeStr: `${hours}:${minutes}`
    };
  }

  // Get service names string from order items
  function getServiceTypeLabel(order: Order) {
    const services = order.items
      ?.filter((i: any) => i.type === "service")
      .map((i: any) => i.name);
    
    if (services && services.length > 0) {
      return services.join(", ");
    }
    
    return order.serviceType === "LIGHT_SERVICE" ? "Servis Ringan" : "Modifikasi";
  }

  // Metrics Cards Calculation
  const totalCount = orders.length;
  
  const waitingCount = orders.filter((o) => 
    ["PENDING", "ESTIMATED", "CONFIRMED", "QUEUE"].includes(o.status)
  ).length;
  
  const workingCount = orders.filter((o) => o.status === "IN_PROGRESS").length;
  
  const finishedCount = orders.filter((o) => 
    ["READY", "COMPLETED"].includes(o.status)
  ).length;

  const filteredOrders = orders.filter((order) => {
    // Search Query filter
    const matchesSearch = 
      order.id.toLowerCase() === searchQuery.toLowerCase() ||
      `ORD-${order.id.slice(-6)}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.custName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.vehicle.toLowerCase().includes(searchQuery.toLowerCase());

    // Status Filter
    let matchesStatus = true;
    if (filterStatus === "WAITING") {
      matchesStatus = ["PENDING", "ESTIMATED", "CONFIRMED", "QUEUE"].includes(order.status);
    } else if (filterStatus === "WORKING") {
      matchesStatus = order.status === "IN_PROGRESS";
    } else if (filterStatus === "FINISHED") {
      matchesStatus = ["READY", "COMPLETED"].includes(order.status);
    }

    // Mechanic Filter
    const matchesMechanic = 
      filterMechanic === "ALL" || 
      order.mechanic?.id === filterMechanic;

    return matchesSearch && matchesStatus && matchesMechanic;
  });

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

  function getStatusBadge(order: Order) {
    switch (order.status) {
      case "PENDING":
        return (
          <Badge className="bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800/50 flex items-center w-fit gap-1 font-semibold px-2.5 py-0.5 rounded-full text-xs">
            <Clock className="h-3 w-3" />
            Menunggu Penyerahan Kendaraan
          </Badge>
        );
      case "ESTIMATED":
      case "CONFIRMED":
      case "QUEUE":
        return (
          <Badge className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 border-indigo-300 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-800/50 flex items-center w-fit gap-1 font-semibold px-2.5 py-0.5 rounded-full text-xs">
            <Clock className="h-3 w-3" />
            Menunggu Antrean
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge className="bg-cyan-100 hover:bg-cyan-200 text-cyan-800 border-cyan-300 dark:bg-cyan-950/20 dark:text-cyan-400 dark:border-cyan-800/50 flex items-center w-fit gap-1 font-semibold px-2.5 py-0.5 rounded-full text-xs">
            <Wrench className="h-3 w-3" />
            Sedang Dikerjakan
          </Badge>
        );
      case "READY":
      case "COMPLETED":
        if (order.paymentStatus === "PAID") {
          return (
            <Badge className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/50 flex items-center w-fit gap-1 font-semibold px-2.5 py-0.5 rounded-full text-xs">
              <CheckCircle className="h-3 w-3" />
              Siap Diambil
            </Badge>
          );
        }
        return (
          <Badge className="bg-teal-100 hover:bg-teal-200 text-teal-800 border-teal-300 dark:bg-teal-950/20 dark:text-teal-400 dark:border-emerald-800/50 flex items-center w-fit gap-1 font-semibold px-2.5 py-0.5 rounded-full text-xs">
            <Clock className="h-3 w-3" />
            Menunggu Pembayaran
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-300 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-800/50 flex items-center w-fit gap-1 font-semibold px-2.5 py-0.5 rounded-full text-xs">
            Dibatalkan
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-800 border-slate-300 font-semibold px-2.5 py-0.5 rounded-full text-xs">
            {order.status}
          </Badge>
        );
    }
  }

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="min-h-screen bg-background text-foreground">
        <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
          
          {/* Breadcrumb & Title */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2 font-medium">
                <span>Beranda</span>
                <span>&gt;</span>
                <span className="text-foreground">Pelayanan</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
                Pelayanan
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Kelola proses pelayanan servis kendaraan dari pengerjaan hingga selesai.
              </p>
            </div>
            
            <Button
              className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold flex items-center gap-2 shadow-sm rounded-lg"
              onClick={() => {
                setDialogMode("create");
                setSelectedOrder(undefined);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-5 w-5" />
              Buat Pelayanan Baru
            </Button>
          </div>

          {/* Metrics Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card Semua */}
            <Card className="border border-border/60 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden rounded-xl">
              <CardContent className="p-5 flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Semua</p>
                  <h3 className="text-3xl font-extrabold text-foreground mt-1">{totalCount}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Layanan</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-muted/60 flex items-center justify-center">
                  <ClipboardList className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            {/* Card Menunggu */}
            <Card className="border border-border/60 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden rounded-xl">
              <CardContent className="p-5 flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Menunggu Pengerjaan</p>
                  <h3 className="text-3xl font-extrabold text-foreground mt-1">{waitingCount}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Layanan</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </CardContent>
            </Card>

            {/* Card Sedang Dikerjakan */}
            <Card className="border border-border/60 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden rounded-xl">
              <CardContent className="p-5 flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sedang Dikerjakan</p>
                  <h3 className="text-3xl font-extrabold text-foreground mt-1">{workingCount}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Layanan</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-cyan-50 dark:bg-cyan-950/20 flex items-center justify-center">
                  <Wrench className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                </div>
              </CardContent>
            </Card>

            {/* Card Selesai */}
            <Card className="border border-border/60 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden rounded-xl">
              <CardContent className="p-5 flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Selesai</p>
                  <h3 className="text-3xl font-extrabold text-foreground mt-1">{finishedCount}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Layanan</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nomor order, nama pelanggan, atau kendaraan..."
                className="pl-10 text-foreground bg-card border-input h-10 rounded-lg shadow-sm"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Select Status */}
            <div className="w-full lg:w-48">
              <Select
                value={filterStatus}
                onValueChange={(val: any) => {
                  setFilterStatus(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="bg-card border-input h-10 rounded-lg shadow-sm">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="WAITING">Menunggu Pengerjaan</SelectItem>
                  <SelectItem value="WORKING">Sedang Dikerjakan</SelectItem>
                  <SelectItem value="FINISHED">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Select Mechanic */}
            <div className="w-full lg:w-56">
              <Select
                value={filterMechanic}
                onValueChange={(val) => {
                  setFilterMechanic(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="bg-card border-input h-10 rounded-lg shadow-sm">
                  <SelectValue placeholder="Semua Mekanik" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Mekanik</SelectItem>
                  {mechanics.map((mech) => (
                    <SelectItem key={mech.id} value={mech.id}>
                      {mech.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reset Button */}
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="h-10 px-4 rounded-lg flex items-center gap-2 border-input shadow-sm text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>

          {/* Data Table */}
          <Card className="border border-border/60 bg-card shadow-sm rounded-xl overflow-hidden">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Wrench className="h-10 w-10 text-primary animate-spin mb-3" />
                  <p className="text-sm text-muted-foreground">Memuat data pelayanan...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border/80 text-muted-foreground font-semibold">
                        <th className="px-6 py-4 text-left w-12">No.</th>
                        <th className="px-6 py-4 text-left">No. Order</th>
                        <th className="px-6 py-4 text-left">Pelanggan</th>
                        <th className="px-6 py-4 text-left">Kendaraan</th>
                        <th className="px-6 py-4 text-left">Jenis Layanan</th>
                        <th className="px-6 py-4 text-left">Mekanik</th>
                        <th className="px-6 py-4 text-left">Status</th>
                        <th className="px-6 py-4 text-left">Estimasi Selesai</th>
                        <th className="px-6 py-4 text-center w-40">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {currentItems.map((order, index) => {
                        const globalIndex = indexOfFirstItem + index + 1;
                        const serviceTypeLabel = getServiceTypeLabel(order);
                        const estSelesai = formatIndonesianDate(order.scheduledAt || order.createdAt);
                        
                        const isSelesai = ["READY", "COMPLETED"].includes(order.status);
                        
                        return (
                          <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                            {/* No. */}
                            <td className="px-6 py-4 align-middle text-muted-foreground font-medium">
                              {globalIndex}
                            </td>
                            {/* No. Order */}
                            <td className="px-6 py-4 align-middle font-semibold text-foreground">
                              {`ORD-${order.id.slice(-6).toUpperCase()}`}
                            </td>
                            {/* Pelanggan */}
                            <td className="px-6 py-4 align-middle font-medium text-foreground">
                              {order.custName}
                            </td>
                            {/* Kendaraan */}
                            <td className="px-6 py-4 align-middle">
                              <div className="font-semibold text-foreground">{order.vehicle}</div>
                              {order.plateNumber && (
                                <div className="text-xs font-semibold text-muted-foreground uppercase font-mono mt-0.5">{order.plateNumber}</div>
                              )}
                            </td>
                            {/* Jenis Layanan */}
                            <td className="px-6 py-4 align-middle text-muted-foreground font-medium">
                              {serviceTypeLabel}
                            </td>
                            {/* Mekanik */}
                            <td className="px-6 py-4 align-middle text-foreground font-medium">
                              {order.mechanic?.name || "-"}
                            </td>
                            {/* Status */}
                            <td className="px-6 py-4 align-middle">
                              {getStatusBadge(order)}
                            </td>
                            {/* Estimasi Selesai */}
                            <td className="px-6 py-4 align-middle">
                              <div className="font-semibold text-foreground">{estSelesai.dateStr}</div>
                              <div className="text-xs font-semibold text-muted-foreground mt-0.5">{estSelesai.timeStr}</div>
                            </td>
                            {/* Aksi */}
                            <td className="px-6 py-4 text-center align-middle">
                              <div className="flex justify-center items-center gap-1.5">
                                {/* Eye/Detail */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted hover:cursor-pointer"
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setDialogMode("view");
                                    setDialogOpen(true);
                                  }}
                                  title="Lihat Detail"
                                >
                                  <Eye className="h-4.5 w-4.5" />
                                </Button>

                                {/* Edit Order */}
                                {!isSelesai && order.status !== "CANCELLED" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted hover:cursor-pointer"
                                    onClick={() => {
                                      setSelectedOrder(order);
                                      setDialogMode("edit");
                                      setDialogOpen(true);
                                    }}
                                    title="Edit Order"
                                  >
                                    <Edit className="h-4.5 w-4.5" />
                                  </Button>
                                )}

                                {/* Konfirmasi (For PENDING) */}
                                {order.status === "PENDING" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-indigo-650 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:cursor-pointer"
                                    onClick={() => {
                                      setOrderToConfirm(order);
                                      setConfirmDialogOpen(true);
                                    }}
                                    title="Konfirmasi Booking"
                                  >
                                    <CheckCircle className="h-4.5 w-4.5" />
                                  </Button>
                                )}

                                {/* Proses (For PENDING, CONFIRMED, QUEUE, ESTIMATED) */}
                                {["PENDING", "CONFIRMED", "QUEUE", "ESTIMATED"].includes(order.status) && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:cursor-pointer"
                                    onClick={() => {
                                      setSelectedOrder(order);
                                      setProcessDialogOpen(true);
                                    }}
                                    title="Proses Pekerjaan"
                                  >
                                    <Wrench className="h-4.5 w-4.5" />
                                  </Button>
                                )}

                                {/* Selesai (For IN_PROGRESS) */}
                                {order.status === "IN_PROGRESS" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-emerald-600 hover:text-emerald-705 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:cursor-pointer"
                                    onClick={() => {
                                      setOrderToFinish(order);
                                      setFinishDialogOpen(true);
                                    }}
                                    title="Selesaikan Pekerjaan"
                                  >
                                    <CheckCircle className="h-4.5 w-4.5" />
                                  </Button>
                                )}

                                {/* Bayar (For READY / COMPLETED and unpaid) */}
                                {isSelesai && order.paymentStatus !== "PAID" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:cursor-pointer"
                                    onClick={() => {
                                      setSelectedOrder(order);
                                      setPaymentDialogOpen(true);
                                    }}
                                    title="Bayar Order"
                                  >
                                    <CreditCard className="h-4.5 w-4.5" />
                                  </Button>
                                )}

                                {/* Serah Terima (For READY) */}
                                {order.status === "READY" && order.paymentStatus === "PAID" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-600 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-950/20 hover:cursor-pointer"
                                    onClick={() => {
                                      setOrderToClose(order);
                                      setCloseDialogOpen(true);
                                    }}
                                    title="Serah Terima"
                                  >
                                    <CheckCircle className="h-4.5 w-4.5" />
                                  </Button>
                                )}

                                {/* Printer / Invoice */}
                                {isSelesai && (
                                  <ExportButton
                                    title={`Invoice_${order.id.slice(-6)}`}
                                    tooltip="Cetak Invoice"
                                    variant="ghost"
                                    size="sm"
                                    hideLabel={true}
                                    icon={<FileText className="h-4.5 w-4.5 text-muted-foreground hover:text-foreground hover:cursor-pointer" />}
                                    onExport={async (format, orientation) => {
                                      const res = await getOrderDetail(order.id);
                                      if (!res.success || !res.order) {
                                        toast({ title: "Gagal", description: "Gagal mengambil data invoice", variant: "destructive" });
                                        return new Blob([]);
                                      }
                                      const fullOrder = res.order;
                                      
                                      const invoiceData: InvoiceExport = {
                                        invoiceNumber: `INV-${fullOrder.id.slice(-6).toUpperCase()}`,
                                        invoiceDate: fullOrder.createdAt,
                                        dueDate: new Date(new Date(fullOrder.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000),
                                        customerName: fullOrder.custName,
                                        customerAddress: "-",
                                        items: fullOrder.orderItems.map((item: any) => ({
                                          description: item.itemName,
                                          quantity: item.quantity,
                                          unitPrice: Number(item.unitPrice),
                                          total: Number(item.totalPrice)
                                        })),
                                        subtotal: Number(fullOrder.totalPrice),
                                        tax: 0,
                                        total: Number(fullOrder.totalPrice),
                                        notes: `Kendaraan: ${fullOrder.vehicle} (${fullOrder.plateNumber || '-'})`
                                      };
                                      return await exportInvoice(invoiceData, format, orientation);
                                    }}
                                  />
                                )}

                                {/* Batalkan Booking button */}
                                {order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:cursor-pointer"
                                    onClick={() => {
                                      setSelectedOrder(order);
                                      setDeleteDialogOpen(true);
                                    }}
                                    title="Batalkan Booking"
                                  >
                                    <XCircle className="h-4.5 w-4.5" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {filteredOrders.length === 0 && (
                    <div className="text-center py-16">
                      <ClipboardList className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground font-medium">Tidak ada data pelayanan yang ditemukan</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination Controls */}
          {filteredOrders.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 px-1">
              <span className="text-xs text-muted-foreground font-medium">
                Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredOrders.length)} dari {filteredOrders.length} data
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-md"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-md"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page numbers */}
                {Array.from({ length: totalPages }).map((unusedItem, i) => {
                  const pageNum = i + 1;
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    Math.abs(pageNum - currentPage) <= 1
                  ) {
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        className={`h-8 w-8 rounded-md text-xs font-semibold ${
                          currentPage === pageNum ? "bg-black hover:bg-black/90 text-white dark:bg-white dark:text-black" : ""
                        }`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                  if (pageNum === 2 && currentPage > 3) {
                    return <span key="dots-start" className="text-muted-foreground text-xs px-1">...</span>;
                  }
                  if (pageNum === totalPages - 1 && currentPage < totalPages - 2) {
                    return <span key="dots-end" className="text-muted-foreground text-xs px-1">...</span>;
                  }
                  return null;
                })}

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-md"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-md"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Action Dialogs */}
          <OrderDialog 
            open={dialogOpen} 
            onOpenChange={setDialogOpen}
            mode={dialogMode}
            order={selectedOrder}
            onSuccess={fetchData}
          />

          {selectedOrder && (
            <ProcessOrderDialog
              open={processDialogOpen}
              onOpenChange={setProcessDialogOpen}
              order={selectedOrder}
              onSuccess={fetchData}
            />
          )}

          {selectedOrder && (
            <PaymentDialog
              open={paymentDialogOpen}
              onOpenChange={setPaymentDialogOpen}
              order={selectedOrder}
              onSuccess={fetchData}
            />
          )}

          {selectedOrder && (
            <DeleteConfirmDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              orderId={selectedOrder.id}
              orderInfo={{
                custName: selectedOrder.custName,
                vehicle: selectedOrder.vehicle,
              }}
              onSuccess={fetchData}
            />
          )}

          {/* Finish Order Confirmation Dialog */}
          {orderToFinish && (
            <Dialog open={finishDialogOpen} onOpenChange={setFinishDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 font-bold">
                    <CheckCircle className="h-5 w-5 text-emerald-650" />
                    Konfirmasi Selesai Pengerjaan
                  </DialogTitle>
                  <DialogDescription>
                    Pastikan pekerjaan mekanik sudah 100% selesai sebelum melakukan konfirmasi.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="p-3.5 bg-muted/60 rounded-xl space-y-2.5 border border-border/40">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pelanggan</span>
                      <span className="font-bold text-foreground">{orderToFinish.custName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Kendaraan</span>
                      <span className="font-semibold text-foreground">{orderToFinish.vehicle}</span>
                    </div>
                    {orderToFinish.plateNumber && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Plat Nomor</span>
                        <span className="font-semibold font-mono text-foreground uppercase">{orderToFinish.plateNumber}</span>
                      </div>
                    )}
                    {orderToFinish.mechanic && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Mekanik</span>
                        <span className="font-semibold text-foreground">{orderToFinish.mechanic.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-emerald-850 dark:text-emerald-300">Total Tagihan</span>
                      <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400">
                        Rp {Number(orderToFinish.totalPrice).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/40">
                    <p className="text-xs text-amber-850 dark:text-amber-400 leading-relaxed font-medium">
                      Setelah dikonfirmasi, status pelayanan akan berubah menjadi <strong>Selesai</strong> dan pelanggan dapat melakukan pembayaran.
                    </p>
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button 
                    variant="outline" 
                    onClick={() => setFinishDialogOpen(false)}
                    disabled={finishLoading}
                    className="rounded-lg font-medium"
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
                            title: "✅ Pengerjaan Selesai!",
                            description: `Pengerjaan untuk ${orderToFinish.custName} telah diselesaikan.`,
                          });
                          setFinishDialogOpen(false);
                          fetchData();
                        } else {
                          toast({
                            variant: "destructive",
                            title: "❌ Gagal",
                            description: result.error || "Gagal menyelesaikan order",
                          });
                        }
                      } catch (error) {
                        toast({
                          variant: "destructive",
                          title: "❌ Error",
                          description: "Terjadi kesalahan sistem",
                        });
                      } finally {
                        setFinishLoading(false);
                      }
                    }}
                    disabled={finishLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 hover:cursor-pointer"
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
                  <DialogTitle className="flex items-center gap-2 font-bold">
                    <CheckCircle className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    Serah Terima Kendaraan?
                  </DialogTitle>
                  <DialogDescription>
                    Pastikan admin telah menerima pembayaran dan kendaraan diserahkan ke pelanggan.
                  </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                  <div className="p-3.5 bg-muted/60 rounded-xl border border-border/40 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pelanggan</span>
                      <span className="font-bold text-foreground">{orderToClose.custName}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-muted-foreground">Status Pembayaran</span>
                      <span className="font-semibold text-foreground">
                        {orderToClose.paymentStatus === "PAID" ? (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400">Lunas</Badge>
                        ) : orderToClose.paymentStatus === "PARTIAL" ? (
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400">Sebagian</Badge>
                        ) : (
                          <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400">Belum Lunas</Badge>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  {orderToClose.paymentStatus !== 'PAID' && (
                    <div className="p-3 bg-rose-50 text-rose-605 text-xs rounded-xl border border-rose-200 font-medium leading-relaxed dark:bg-rose-950/10 dark:text-rose-400 dark:border-rose-900/40">
                      Peringatan: Transaksi ini <strong>BELUM LUNAS</strong>. Apakah Anda yakin ingin menyerahkan kendaraan?
                    </div>
                  )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button 
                    variant="outline" 
                    onClick={() => setCloseDialogOpen(false)}
                    disabled={closeLoading}
                    className="rounded-lg font-medium"
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
                            title: "✅ Order Selesai & Ditutup!",
                            description: `Kendaraan telah berhasil diserahterimakan kepada pelanggan.`,
                          });
                          setCloseDialogOpen(false);
                          fetchData();
                        } else {
                          toast({ variant: "destructive", title: "❌ Gagal", description: "Gagal menutup order" });
                        }
                      } catch (error) {
                        toast({ variant: "destructive", title: "❌ Error", description: "Terjadi kesalahan" });
                      } finally {
                        setCloseLoading(false);
                      }
                    }}
                    disabled={closeLoading}
                    className="bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-semibold flex items-center gap-1.5 dark:bg-slate-805 dark:hover:bg-slate-700 hover:cursor-pointer"
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
                  <DialogTitle className="flex items-center gap-2 font-bold">
                    <CheckCircle className="h-5 w-5 text-indigo-600" />
                    Konfirmasi Booking Pelayanan
                  </DialogTitle>
                  <DialogDescription>
                    Apakah Anda yakin ingin menyetujui booking ini dan mengubah statusnya menjadi <strong>Menunggu Servis</strong>?
                  </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                  <div className="p-3.5 bg-muted/60 rounded-xl space-y-2 border border-border/40">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pelanggan</span>
                      <span className="font-bold text-foreground">{orderToConfirm.custName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Kendaraan</span>
                      <span className="font-semibold text-foreground">{orderToConfirm.vehicle}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Jenis Layanan</span>
                      <span className="font-semibold capitalize text-foreground">{orderToConfirm.serviceType.replace('_', ' ').toLowerCase()}</span>
                    </div>
                    {orderToConfirm.plateNumber && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Plat Nomor</span>
                        <span className="font-semibold font-mono text-foreground uppercase">{orderToConfirm.plateNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button 
                    variant="outline" 
                    onClick={() => setConfirmDialogOpen(false)}
                    disabled={confirmLoading}
                    className="rounded-lg font-medium"
                  >
                    Batal
                  </Button>
                  <Button 
                    onClick={handleConfirmOrder}
                    disabled={confirmLoading}
                    className="bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center gap-1.5 hover:cursor-pointer"
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
      </div>
    </RoleGuard>
  );
}
