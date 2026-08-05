"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { OrderStatus as PrismaOrderStatus, ServiceType } from "@prisma/client";
import {
  Search,
  CheckCircle,
  Clock,
  Wrench,
  ClipboardList,
  Printer,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  Plus,
  CreditCard,
  TrendingUp,
  DollarSign,
  Wallet,
  Download,
} from "lucide-react";

import { RoleGuard } from "@/components/shared/RoleGuard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
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
import { Label } from "@/components/ui/Label";
import { PaymentDialog } from "@/components/dialogs/PaymentDialog";
import { Toaster } from "@/components/ui/Toaster";
import { ExportButton } from "@/components/export/ExportButton";

import { getAdminOrders, getOrderDetail } from "@/lib/actions/orders";
import { getPaymentHistory, createPayment } from "@/lib/actions/payments";
import { getBankAccounts } from "@/lib/actions/bank";
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

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export default function Page() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "SERVICE" | "PART" | "BOTH">("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PAID" | "UNPAID">("ALL");

  // Selection state
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Dialog States
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [createTransactionOpen, setCreateTransactionOpen] = useState(false);

  // Form States for New Transaction Dialog
  const [newTxOrderId, setNewTxOrderId] = useState("");
  const [newTxAmount, setNewTxAmount] = useState<number | string>(0);
  const [newTxMethod, setNewTxMethod] = useState<"CASH" | "TRANSFER" | "QRIS" | "CARD">("CASH");
  const [newTxBankId, setNewTxBankId] = useState("");
  const [newTxNote, setNewTxNote] = useState("");
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);

  // Load Data
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setIsLoading(true);
    try {
      const [ordersRes, paymentsRes, bankRes] = await Promise.all([
        getAdminOrders({ limit: 100 }),
        getPaymentHistory(),
        getBankAccounts()
      ]);

      if (ordersRes.success && ordersRes.orders) {
        const orderData = ordersRes.orders as Order[];
        setOrders(orderData);
        if (orderData.length > 0 && !selectedOrderId) {
          setSelectedOrderId(orderData[0].id);
        }
      }
      if (paymentsRes.success && paymentsRes.payments) {
        setPayments(paymentsRes.payments);
      }
      if (bankRes.success && bankRes.data) {
        setBankAccounts(bankRes.data as BankAccount[]);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: "Gagal memuat data transaksi",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Handle Reset Filters
  function handleResetFilters() {
    setSearchQuery("");
    setFilterType("ALL");
    setFilterStatus("ALL");
    setCurrentPage(1);
  }

  // Helper formatting dates
  function formatIndonesianDate(dateString?: string | Date | null, includeTime: boolean = false) {
    if (!dateString) {
      return "-";
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "-";
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
    
    if (includeTime) {
      return `${day} ${month} ${year}, ${hours}:${minutes}`;
    }
    return `${day} ${month} ${year}`;
  }

  // Helper payment methods translating
  function getMethodLabel(method: string) {
    switch (method) {
      case "CASH": {
        return "Tunai";
      }
      case "TRANSFER": {
        return "Transfer Bank";
      }
      case "QRIS": {
        return "QRIS";
      }
      case "CARD": {
        return "Kartu Kredit/Debit";
      }
      default: {
        return method;
      }
    }
  }

  // Calculate Order Type: Servis, Part, or Servis + Part
  function getOrderType(order: Order) {
    const hasService = order.items?.some((i: any) => i.type === "service");
    const hasPart = order.items?.some((i: any) => i.type === "part");
    
    if (hasService && hasPart) {
      return "Servis + Part";
    }
    if (hasPart) {
      return "Part";
    }
    return "Servis";
  }

  // Metrics Calculations
  const totalCount = orders.length;

  // Monthly revenue calculation
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyRevenue = payments
    .filter((p: any) => {
      const pDate = new Date(p.date);
      return p.orderId && pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
    })
    .reduce((sum: number, p: any) => sum + p.amount, 0);

  const unpaidCount = orders.filter((o) => o.paymentStatus !== "PAID").length;
  const paidCount = orders.filter((o) => o.paymentStatus === "PAID").length;

  // Filters logic
  const filteredOrders = orders.filter((order) => {
    const invoiceCode = `INV-${order.id.slice(-6).toUpperCase()}`;
    const matchesSearch = 
      invoiceCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.custName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.vehicle.toLowerCase().includes(searchQuery.toLowerCase());

    const oType = getOrderType(order);
    let matchesType = true;
    if (filterType === "SERVICE") {
      matchesType = oType === "Servis";
    } else if (filterType === "PART") {
      matchesType = oType === "Part";
    } else if (filterType === "BOTH") {
      matchesType = oType === "Servis + Part";
    }

    let matchesStatus = true;
    if (filterStatus === "PAID") {
      matchesStatus = order.paymentStatus === "PAID";
    } else if (filterStatus === "UNPAID") {
      matchesStatus = order.paymentStatus !== "PAID";
    }

    return matchesSearch && matchesType && matchesStatus;
  });

  // Selected Order Object
  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || filteredOrders[0];

  // Get payments for the selected order
  const selectedOrderPayments = payments.filter((p: any) => p.orderId === selectedOrder?.id);
  const latestPayment = selectedOrderPayments.length > 0 ? selectedOrderPayments[0] : null;

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

  // Handle Select Order from New Transaction Dialog
  function handleNewTxOrderChange(orderId: string) {
    setNewTxOrderId(orderId);
    const orderObj = orders.find((o) => o.id === orderId);
    if (orderObj) {
      setNewTxAmount(Number(orderObj.totalPrice) - Number(orderObj.totalPaid));
    }
  }

  // Submit New Transaction
  async function handleSaveTransaction(e: React.FormEvent) {
    e.preventDefault();
    const txAmountNum = Number(newTxAmount) || 0;
    if (!newTxOrderId || txAmountNum <= 0) {
      toast({ variant: "destructive", title: "Gagal", description: "Pilih order dan isi jumlah pembayaran dengan benar" });
      return;
    }

    setIsSubmittingTx(true);
    try {
      const res = await createPayment({
        orderId: newTxOrderId,
        amount: txAmountNum,
        paymentMethod: newTxMethod,
        bankAccountId: ["TRANSFER", "QRIS", "CARD"].includes(newTxMethod) && newTxBankId ? newTxBankId : undefined,
        note: newTxNote || "Pembayaran dari halaman Transaksi & Pembayaran"
      });

      if (res.success) {
        toast({ title: "✅ Transaksi Berhasil", description: `Pembayaran Rp ${txAmountNum.toLocaleString("id-ID")} berhasil dicatat.` });
        setCreateTransactionOpen(false);
        setNewTxOrderId("");
        setNewTxAmount(0);
        setNewTxMethod("CASH");
        setNewTxBankId("");
        setNewTxNote("");
        
        fetchData();
      } else {
        toast({ variant: "destructive", title: "❌ Gagal mencatat pembayaran", description: res.error || "Gagal" });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "❌ Error", description: "Terjadi kesalahan sistem" });
    } finally {
      setIsSubmittingTx(false);
    }
  }

  return (
    <RoleGuard allowedRoles={["ADMIN", "OWNER"]}>
      <div className="min-h-screen bg-background text-foreground">
        <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2 font-medium">
                <span>Beranda</span>
                <span>&gt;</span>
                <span className="text-foreground">Transaksi & Pembayaran</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
                Transaksi & Pembayaran
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Kelola transaksi servis, penjualan sparepart, dan pembayaran pelanggan.
              </p>
            </div>
            
            <Button
              className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold flex items-center gap-2 shadow-sm rounded-lg"
              onClick={() => {
                const unpaid = orders.find(o => o.paymentStatus !== "PAID" && (o.status === "READY" || o.status === "COMPLETED"));
                if (unpaid) {
                  setNewTxOrderId(unpaid.id);
                  setNewTxAmount(Number(unpaid.totalPrice) - Number(unpaid.totalPaid));
                }
                setCreateTransactionOpen(true);
              }}
            >
              <Plus className="h-5 w-5" />
              Buat Transaksi Baru
            </Button>
          </div>

          {/* Metrics Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Transaksi */}
            <Card className="border border-border/60 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden rounded-xl">
              <CardContent className="p-5 flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Transaksi</p>
                  <h3 className="text-3xl font-extrabold text-foreground mt-1">{totalCount}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Semua transaksi</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-muted/60 flex items-center justify-center">
                  <ClipboardList className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Total Pendapatan Bulan Ini */}
            <Card className="border border-border/60 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden rounded-xl">
              <CardContent className="p-5 flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Pendapatan</p>
                  <h3 className="text-2xl font-extrabold text-foreground mt-1">Rp {monthlyRevenue.toLocaleString("id-ID")}</h3>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    Bulan Ini
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Belum Dibayar */}
            <Card className="border border-border/60 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden rounded-xl">
              <CardContent className="p-5 flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Belum Dibayar</p>
                  <h3 className="text-3xl font-extrabold text-foreground mt-1">{unpaidCount}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Total Invoice</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-amber-605 dark:text-amber-400" />
                </div>
              </CardContent>
            </Card>

            {/* Card 4: Lunas */}
            <Card className="border border-border/60 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden rounded-xl">
              <CardContent className="p-5 flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lunas</p>
                  <h3 className="text-3xl font-extrabold text-foreground mt-1">{paidCount}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Transaksi</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search & Filter bar */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari no. invoice / order, pelanggan, atau kendaraan..."
                className="pl-10 text-foreground bg-card border-input h-10 rounded-lg shadow-sm"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Select Type */}
            <div className="w-full md:w-44">
              <Select
                value={filterType}
                onValueChange={(val: any) => {
                  setFilterType(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="bg-card border-input h-10 rounded-lg shadow-sm">
                  <SelectValue placeholder="Semua Jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Jenis</SelectItem>
                  <SelectItem value="SERVICE">Servis</SelectItem>
                  <SelectItem value="PART">Part</SelectItem>
                  <SelectItem value="BOTH">Servis + Part</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Select Status */}
            <div className="w-full md:w-44">
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
                  <SelectItem value="PAID">Lunas</SelectItem>
                  <SelectItem value="UNPAID">Belum Dibayar</SelectItem>
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

          {/* Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Transaction list */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="border border-border/60 bg-card shadow-sm rounded-xl overflow-hidden">
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Wrench className="h-10 w-10 text-primary animate-spin mb-3" />
                      <p className="text-sm text-muted-foreground">Memuat data transaksi...</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/40 border-b border-border/80 text-muted-foreground font-semibold">
                            <th className="px-6 py-4 text-left w-12">No.</th>
                            <th className="px-6 py-4 text-left">No. Invoice</th>
                            <th className="px-6 py-4 text-left">Tanggal</th>
                            <th className="px-6 py-4 text-left">Pelanggan</th>
                            <th className="px-6 py-4 text-left">Jenis</th>
                            <th className="px-6 py-4 text-left">Total</th>
                            <th className="px-6 py-4 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {currentItems.map((order, index) => {
                            const globalIndex = indexOfFirstItem + index + 1;
                            const invoiceCode = `INV-${order.id.slice(-6).toUpperCase()}`;
                            const isSelected = order.id === selectedOrderId;
                            const oType = getOrderType(order);
                            const orderDate = formatIndonesianDate(order.createdAt, true);
                            
                            return (
                              <tr 
                                key={order.id} 
                                className={`transition-colors hover:bg-muted/20 hover:cursor-pointer ${
                                  isSelected ? "bg-muted/30 font-medium" : ""
                                }`}
                                onClick={() => setSelectedOrderId(order.id)}
                              >
                                <td className="px-6 py-4 align-middle text-muted-foreground">
                                  {globalIndex}
                                </td>
                                <td className="px-6 py-4 align-middle font-semibold text-foreground">
                                  {invoiceCode}
                                </td>
                                <td className="px-6 py-4 align-middle text-muted-foreground">
                                  {orderDate}
                                </td>
                                <td className="px-6 py-4 align-middle text-foreground">
                                  {order.custName}
                                </td>
                                <td className="px-6 py-4 align-middle text-muted-foreground">
                                  {oType}
                                </td>
                                <td className="px-6 py-4 align-middle font-semibold text-foreground">
                                  Rp {Number(order.totalPrice).toLocaleString("id-ID")}
                                </td>
                                <td className="px-6 py-4 align-middle">
                                  {order.paymentStatus === "PAID" ? (
                                    <Badge className="bg-emerald-100 hover:bg-emerald-250 text-emerald-800 border-emerald-300 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-850/50 font-bold px-2.5 py-0.5 rounded-full text-xs">
                                      Lunas
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-amber-100 hover:bg-amber-250 text-amber-800 border-amber-300 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-850/50 font-bold px-2.5 py-0.5 rounded-full text-xs">
                                      Belum Dibayar
                                    </Badge>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {filteredOrders.length === 0 && (
                        <div className="text-center py-16">
                          <ClipboardList className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                          <p className="text-muted-foreground font-medium">Tidak ada data transaksi yang ditemukan</p>
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

                    {Array.from({ length: totalPages }).map((_, i) => {
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
            </div>

            {/* Right Column: Transaction Details */}
            <div className="lg:col-span-5">
              {selectedOrder ? (
                <Card className="border border-border bg-card shadow-sm rounded-xl overflow-hidden sticky top-6">
                  <CardHeader className="bg-muted/30 border-b border-border/80 p-5 flex flex-row justify-between items-center">
                    <div>
                      <CardTitle className="text-lg font-bold text-foreground">Detail Transaksi</CardTitle>
                      <CardDescription className="text-xs font-mono font-bold mt-1 text-primary">
                        {`INV-${selectedOrder.id.slice(-6).toUpperCase()}`}
                      </CardDescription>
                    </div>
                    {selectedOrder.paymentStatus === "PAID" ? (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 px-3 py-1 font-bold rounded-full text-xs">
                        Lunas
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-300 dark:border-amber-800 px-3 py-1 font-bold rounded-full text-xs">
                        Belum Dibayar
                      </Badge>
                    )}
                  </CardHeader>
                  
                  <CardContent className="p-5 space-y-6">
                    {/* Metadata details */}
                    <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 text-xs font-medium border-b border-border/60 pb-5">
                      <div>
                        <p className="text-muted-foreground">Pelanggan</p>
                        <p className="text-foreground font-bold text-sm mt-1">{selectedOrder.custName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">No. Order</p>
                        <p className="text-foreground font-semibold mt-1">{`ORD-${selectedOrder.id.slice(-6).toUpperCase()}`}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tanggal</p>
                        <p className="text-foreground font-semibold mt-1">{formatIndonesianDate(selectedOrder.createdAt, true)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Jenis</p>
                        <p className="text-foreground font-semibold mt-1">{getOrderType(selectedOrder)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Mekanik</p>
                        <p className="text-foreground font-semibold mt-1">{selectedOrder.mechanic?.name || "-"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status Pengerjaan</p>
                        <p className="text-foreground font-semibold mt-1">
                          {selectedOrder.status === "COMPLETED" ? "Selesai & Diambil" : selectedOrder.status === "READY" ? "Siap Diambil" : selectedOrder.status === "IN_PROGRESS" ? "Dikerjakan" : "Menunggu Pengerjaan"}
                        </p>
                      </div>
                    </div>

                    {/* Item list */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Rincian Item</h4>
                      <div className="border border-border/60 rounded-xl overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-muted/40 border-b border-border/80 font-semibold text-muted-foreground">
                              <th className="px-4 py-2.5 text-left">Item</th>
                              <th className="px-4 py-2.5 text-center w-12">Qty</th>
                              <th className="px-4 py-2.5 text-right w-24">Harga</th>
                              <th className="px-4 py-2.5 text-right w-24">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {selectedOrder.items && selectedOrder.items.length > 0 ? (
                              selectedOrder.items
                                .filter((item: any) => item.type !== "internal_fee")
                                .map((item: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-muted/10">
                                    <td className="px-4 py-2.5 text-foreground font-medium">{item.name}</td>
                                    <td className="px-4 py-2.5 text-center text-muted-foreground">{item.qty || item.quantity || 1}</td>
                                    <td className="px-4 py-2.5 text-right text-muted-foreground">
                                      Rp {Number(item.price || item.unitPrice || 0).toLocaleString("id-ID")}
                                    </td>
                                    <td className="px-4 py-2.5 text-right text-foreground font-medium">
                                      Rp {Number((item.qty || item.quantity || 1) * (item.price || item.unitPrice || 0)).toLocaleString("id-ID")}
                                    </td>
                                  </tr>
                                ))
                            ) : (
                              <tr>
                                <td colSpan={4} className="px-4 py-3 text-center text-muted-foreground">
                                  Belum ada rincian pengerjaan
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Calculations summary */}
                      <div className="mt-3.5 space-y-1.5 text-xs border-b border-border/60 pb-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-semibold">Subtotal</span>
                          <span className="font-semibold text-foreground">Rp {Number(selectedOrder.totalPrice).toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between text-sm font-extrabold pt-1">
                          <span className="text-foreground">Total</span>
                          <span className="text-primary">Rp {Number(selectedOrder.totalPrice).toLocaleString("id-ID")}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payments details */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Pembayaran</h4>
                      {selectedOrder.paymentStatus === "PAID" ? (
                        <div className="bg-muted/40 border border-border/40 p-3.5 rounded-xl space-y-2.5 text-xs font-medium">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Metode Pembayaran</span>
                            <span className="font-semibold text-foreground">{latestPayment ? getMethodLabel(latestPayment.paymentMethod) : "Tunai"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Dibayar</span>
                            <span className="font-semibold text-foreground">Rp {Number(selectedOrder.totalPaid).toLocaleString("id-ID")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Kembalian</span>
                            <span className="font-semibold text-foreground">
                              Rp {Math.max(0, Number(selectedOrder.totalPaid) - Number(selectedOrder.totalPrice)).toLocaleString("id-ID")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tanggal Bayar</span>
                            <span className="font-semibold text-foreground">
                              {latestPayment ? formatIndonesianDate(latestPayment.date, true) : formatIndonesianDate(selectedOrder.updatedAt, true)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {selectedOrder.paymentStatus === "PARTIAL" && (
                            <div className="bg-muted/40 border border-border/40 p-3.5 rounded-xl space-y-2 text-xs font-medium">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground font-semibold">Telah Dibayar (DP)</span>
                                <span className="font-bold text-foreground">Rp {Number(selectedOrder.totalPaid).toLocaleString("id-ID")}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground font-semibold">Sisa Tagihan</span>
                                <span className="font-bold text-amber-600">
                                  Rp {Math.max(0, Number(selectedOrder.totalPrice) - Number(selectedOrder.totalPaid)).toLocaleString("id-ID")}
                                </span>
                              </div>
                            </div>
                          )}

                          {selectedOrder.status === "READY" || selectedOrder.status === "COMPLETED" ? (
                            <div className="bg-rose-50/50 border border-rose-100 dark:bg-rose-950/10 dark:border-rose-950/30 p-4 rounded-xl flex flex-col items-center justify-center gap-3">
                              <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                                {selectedOrder.paymentStatus === "PARTIAL" ? "Pembayaran Belum Lunas" : "Belum Ada Catatan Pembayaran"}
                              </p>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 shadow-sm rounded-lg hover:cursor-pointer"
                                onClick={() => setPaymentDialogOpen(true)}
                              >
                                <CreditCard className="h-4 w-4" />
                                {selectedOrder.paymentStatus === "PARTIAL" ? "Catat Pelunasan" : "Catat Pembayaran"}
                              </Button>
                            </div>
                          ) : (
                            <div className="bg-muted/30 border border-border/60 p-4 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 text-xs">
                              <Clock className="h-5 w-5 text-amber-500 mb-1" />
                              <p className="font-bold text-foreground">
                                Status Pelayanan: {selectedOrder.status === "IN_PROGRESS" ? "Sedang Dikerjakan" : "Dalam Antrian"}
                              </p>
                              <p className="text-muted-foreground">
                                Pembayaran belum dapat dicatat karena pelayanan masih berjalan. Ubah status menjadi "Siap Diambil/Selesai" untuk melakukan transaksi.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Print Actions buttons at bottom */}
                    {selectedOrder.paymentStatus === "PAID" && (
                      <div className="flex gap-3 pt-2">
                        {/* Cetak Invoice */}
                        <ExportButton
                          title={`Invoice_${selectedOrder.id.slice(-6)}`}
                          variant="outline"
                          className="flex-1 font-semibold border-input shadow-sm flex items-center justify-center gap-1.5 hover:bg-muted"
                          label="Cetak Invoice"
                          icon={<Printer className="h-4 w-4 text-muted-foreground" />}
                          onExport={async (format, orientation) => {
                            const res = await getOrderDetail(selectedOrder.id);
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
                              notes: `Kendaraan: ${fullOrder.vehicle} (${fullOrder.plateNumber || "-"})`
                            };
                            return await exportInvoice(invoiceData, format, orientation);
                          }}
                        />

                        {/* Unduh PDF */}
                        <ExportButton
                          title={`Invoice_${selectedOrder.id.slice(-6)}`}
                          variant="outline"
                          className="flex-1 font-semibold border-input shadow-sm flex items-center justify-center gap-1.5 hover:bg-muted"
                          label="Unduh PDF"
                          icon={<Download className="h-4 w-4 text-muted-foreground" />}
                          onExport={async (format, orientation) => {
                            const res = await getOrderDetail(selectedOrder.id);
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
                              notes: `Kendaraan: ${fullOrder.vehicle} (${fullOrder.plateNumber || "-"})`
                            };
                            return await exportInvoice(invoiceData, "pdf", orientation);
                          }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="h-[400px] border border-dashed rounded-xl flex items-center justify-center text-muted-foreground bg-muted/10 font-medium">
                  Pilih transaksi untuk menampilkan rincian
                </div>
              )}
            </div>
          </div>

          {/* Create Transaction Dialog */}
          <Dialog
            open={createTransactionOpen}
            onOpenChange={setCreateTransactionOpen}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-bold text-foreground">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Buat Transaksi Baru
                </DialogTitle>
                <DialogDescription>
                  Pilih order aktif yang belum lunas dan catat pembayarannya.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSaveTransaction} className="space-y-4 py-2">
                {/* Order Selector */}
                <div className="space-y-2">
                  <Label htmlFor="order-select" className="font-semibold">Pilih Order Pelanggan</Label>
                  <Select
                    value={newTxOrderId}
                    onValueChange={handleNewTxOrderChange}
                  >
                    <SelectTrigger id="order-select" className="bg-card border-input h-10 rounded-lg">
                      <SelectValue placeholder="Pilih order..." />
                    </SelectTrigger>
                    <SelectContent>
                      {orders
                        .filter((o) => o.paymentStatus !== "PAID" && (o.status === "READY" || o.status === "COMPLETED"))
                        .map((o) => {
                          const outstanding = Number(o.totalPrice) - Number(o.totalPaid);
                          return (
                            <SelectItem key={o.id} value={o.id}>
                              {`ORD-${o.id.slice(-6).toUpperCase()} - ${o.custName} (${o.vehicle}) - Kurang: Rp ${outstanding.toLocaleString("id-ID")}`}
                            </SelectItem>
                          );
                        })}
                      {orders.filter((o) => o.paymentStatus !== "PAID" && (o.status === "READY" || o.status === "COMPLETED")).length === 0 && (
                        <SelectItem value="none" disabled>Semua order siap bayar telah lunas</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount input */}
                <div className="space-y-2">
                  <Label htmlFor="amount-input" className="font-semibold">Jumlah Bayar (Rp)</Label>
                  <Input
                    id="amount-input"
                    type="number"
                    value={newTxAmount}
                    onChange={(e) => setNewTxAmount(e.target.value)}
                    placeholder="Masukkan nominal bayar..."
                    className="bg-card border-input h-10 rounded-lg text-foreground font-semibold"
                    required
                  />
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2">
                  <Label htmlFor="method-select" className="font-semibold">Metode Pembayaran</Label>
                  <Select
                    value={newTxMethod}
                    onValueChange={(val: any) => setNewTxMethod(val)}
                  >
                    <SelectTrigger id="method-select" className="bg-card border-input h-10 rounded-lg">
                      <SelectValue placeholder="Pilih metode..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Tunai</SelectItem>
                      <SelectItem value="TRANSFER">Transfer Bank</SelectItem>
                      <SelectItem value="QRIS">QRIS</SelectItem>
                      <SelectItem value="CARD">Kartu Kredit/Debit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Bank Account Selection */}
                {["TRANSFER", "QRIS", "CARD"].includes(newTxMethod) && (
                  <div className="space-y-2">
                    <Label htmlFor="bank-select" className="font-semibold">Rekening Bank Tujuan</Label>
                    <Select
                      value={newTxBankId}
                      onValueChange={(val) => setNewTxBankId(val)}
                      required
                    >
                      <SelectTrigger id="bank-select" className="bg-card border-input h-10 rounded-lg">
                        <SelectValue placeholder="Pilih rekening bank..." />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map((bank) => (
                          <SelectItem key={bank.id} value={bank.id}>
                            {`${bank.bankName} - ${bank.accountNumber} a/n ${bank.accountName}`}
                          </SelectItem>
                        ))}
                        {bankAccounts.length === 0 && (
                          <SelectItem value="none" disabled>Tidak ada rekening bank aktif</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Notes input */}
                <div className="space-y-2">
                  <Label htmlFor="note-input" className="font-semibold">Catatan (Opsional)</Label>
                  <Input
                    id="note-input"
                    value={newTxNote}
                    onChange={(e) => setNewTxNote(e.target.value)}
                    placeholder="Catatan transaksi..."
                    className="bg-card border-input h-10 rounded-lg text-foreground"
                  />
                </div>

                <DialogFooter className="gap-2 sm:gap-0 pt-2">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => setCreateTransactionOpen(false)}
                    disabled={isSubmittingTx}
                    className="rounded-lg font-medium"
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isSubmittingTx}
                    className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold flex items-center gap-1.5 shadow-sm rounded-lg hover:cursor-pointer"
                  >
                    {isSubmittingTx && <Clock className="h-4 w-4 animate-spin" />}
                    Simpan Transaksi
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Payment Dialog */}
          {selectedOrder && (
            <PaymentDialog
              open={paymentDialogOpen}
              onOpenChange={setPaymentDialogOpen}
              order={selectedOrder}
              onSuccess={fetchData}
            />
          )}

          <Toaster />
        </div>
      </div>
    </RoleGuard>
  );
}
