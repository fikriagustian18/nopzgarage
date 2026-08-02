"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Users,
  DollarSign,
  Wallet,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  RefreshCw,
  CheckCircle,
  Printer,
  Eye,
} from "lucide-react";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { ExportButton } from "@/components/export/ExportButton";
import {
  getPayrolls,
  bulkGeneratePayroll,
  updatePayroll,
  deletePayroll,
} from "@/lib/actions/payroll";
import { getBankAccounts } from "@/lib/actions/bank";
import { createPayment } from "@/lib/actions/payments";
import type { PayrollSummary } from "@/lib/export/types";

interface Payroll {
  id: string;
  startDate: string;
  endDate: string;
  employeeId: string;
  baseSalary: number;
  bonus: number;
  totalEarned: number;
  totalPaid: number;
  status: "UNPAID" | "PARTIAL" | "PAID";
  details: string | null;
  detailsParsed?: {
    workDays?: number;
    motorCount?: number;
    bonusNote?: string;
  } | null;
  createdAt: string;
  employee: {
    id: string;
    name: string;
    role: string;
    salaryType: "DAILY" | "COMMISSION";
  };
}

export default function Page() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const isOwner = userRole === "OWNER";
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Form states for Bulk Generate
  const [generateOpen, setGenerateOpen] = useState(false);
  const [genStartDate, setGenStartDate] = useState("");
  const [genEndDate, setGenEndDate] = useState("");
  const [generating, setGenerating] = useState(false);

  // Form states for Edit Bonus
  const [editOpen, setEditOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [bonusAmount, setBonusAmount] = useState<number | string>(0);
  const [bonusNote, setBonusNote] = useState<string>("");
  const [updating, setUpdating] = useState(false);

  // Form states for Payment
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number | string>(0);
  const [payMethod, setPayMethod] = useState<"CASH" | "TRANSFER">("CASH");
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [payNote, setPayNote] = useState<string>("");
  const [paying, setPaying] = useState(false);

  // Detail View State
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [session]);

  async function fetchData() {
    setLoading(true);
    try {
      const [payrollRes, bankRes] = await Promise.all([
        getPayrolls(),
        getBankAccounts(),
      ]);

      if (payrollRes.success && payrollRes.payrolls) {
        const formatted = payrollRes.payrolls.map((p: any) => {
          let detailsParsed = p.detailsParsed || null;
          if (!detailsParsed && p.details) {
            try {
              detailsParsed = JSON.parse(p.details);
            } catch (e) {
              detailsParsed = { bonusNote: p.details };
            }
          }
          return {
            ...p,
            detailsParsed,
          };
        });
        setPayrolls(formatted as Payroll[]);
      }

      if (bankRes.success && bankRes.data) {
        setBanks(bankRes.data.filter((b: any) => b.isActive));
      }
    } catch (error) {
      console.error("Failed to load payroll data", error);
      toast.error("Gagal memuat data payroll");
    } fontally: {
      setLoading(false);
    }
  }

  // Format currency helper
  function formatMoney(val: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  }

  // Date format helper
  function formatDateStr(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  // Bulk Generate handler
  async function handleBulkGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!genStartDate || !genEndDate) {
      toast.error("Pilih tanggal mulai dan akhir periode");
      return;
    }

    setGenerating(true);
    try {
      const res = await bulkGeneratePayroll(
        new Date(genStartDate),
        new Date(genEndDate)
      );

      if (res.success) {
        toast.success(`Berhasil membuat slip gaji untuk ${res.results?.length || 0} karyawan`);
        setGenerateOpen(false);
        fetchData();
      } else {
        toast.error(res.error || "Gagal melakukan generate payroll");
      }
    } catch (error: any) {
      toast.error("Terjadi kesalahan: " + error.message);
    } finally {
      setGenerating(false);
    }
  }

  // Open Edit Dialog
  function openEdit(p: Payroll) {
    setSelectedPayroll(p);
    setBonusAmount(Number(p.bonus));
    const parsed = p.detailsParsed;
    setBonusNote(parsed?.bonusNote || "");
    setEditOpen(true);
  }

  // Handle Edit Bonus
  async function handleEditBonus(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPayroll) {
      return;
    }

    setUpdating(true);
    try {
      const res = await updatePayroll(selectedPayroll.id, {
        bonusAmount: Number(bonusAmount),
        bonusNote: bonusNote,
      });

      if (res.success) {
        toast.success("Rincian bonus & slip gaji berhasil diperbarui");
        setEditOpen(false);
        fetchData();
      } else {
        toast.error(res.error || "Gagal memperbarui payroll");
      }
    } catch (error: any) {
      toast.error("Terjadi kesalahan: " + error.message);
    } finally {
      setUpdating(false);
    }
  }

  // Open Pay Dialog
  function openPay(p: Payroll) {
    setSelectedPayroll(p);
    const unpaid = Number(p.totalEarned) - Number(p.totalPaid);
    setPayAmount(unpaid > 0 ? unpaid : 0);
    setPayMethod("CASH");
    setSelectedBankId("");
    setPayNote(`Pencairan Gaji/Komisi Periode ${formatDateStr(p.startDate)} - ${formatDateStr(p.endDate)}`);
    setPayOpen(true);
  }

  // Handle Payroll Payment
  async function handlePayPayroll(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPayroll) {
      return;
    }
    const payAmountNum = Number(payAmount) || 0;
    if (payAmountNum <= 0) {
      toast.error("Jumlah pembayaran harus lebih besar dari 0");
      return;
    }

    if (payMethod === "TRANSFER" && !selectedBankId) {
      toast.error("Silakan pilih rekening bank tujuan transfer");
      return;
    }

    const unpaid = Number(selectedPayroll.totalEarned) - Number(selectedPayroll.totalPaid);
    if (payAmountNum > unpaid) {
      toast.error(`Jumlah pembayaran melebihi sisa gaji terhutang (Maksimal: ${formatMoney(unpaid)})`);
      return;
    }

    setPaying(true);
    try {
      const res = await createPayment({
        amount: payAmountNum,
        note: payNote,
        payrollId: selectedPayroll.id,
        paymentMethod: payMethod,
        bankAccountId: payMethod === "TRANSFER" ? selectedBankId : undefined,
      });

      if (res.success) {
        toast.success(`Berhasil mencairkan gaji sebesar ${formatMoney(payAmountNum)}`);
        setPayOpen(false);
        fetchData();
      } else {
        toast.error(res.error || "Gagal memproses pembayaran");
      }
    } catch (error: any) {
      toast.error("Terjadi kesalahan: " + error.message);
    } finally {
      setPaying(false);
    }
  }

  // Handle Delete Payroll
  async function handleDelete(id: string) {
    if (!confirm("Apakah Anda yakin ingin menghapus slip gaji ini? Fitur ini hanya berlaku jika belum ada transaksi pembayaran pada slip ini.")) {
      return;
    }

    try {
      const res = await deletePayroll(id);
      if (res.success) {
        toast.success("Slip gaji berhasil dihapus");
        fetchData();
      } else {
        toast.error(res.error || "Gagal menghapus slip gaji");
      }
    } catch (error: any) {
      toast.error("Terjadi kesalahan: " + error.message);
    }
  }

  // Print slip gaji via browser printer
  function handlePrintSlip() {
    if (!selectedPayroll) {
      return;
    }
    const printContent = document.getElementById("payroll-slip-printable");
    if (!printContent) {
      return;
    }

    const printWindow = window.open("", "", "width=800,height=600");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Slip Gaji #${selectedPayroll.id.slice(-6).toUpperCase()}</title>
            <style>
              body { font-family: monospace; padding: 1.25rem; color: #000000; font-size: 0.875rem; line-height: 1.5; }
              .header { text-align: center; margin-bottom: 1.25rem; border-bottom: 0.125rem dashed #000000; padding-bottom: 0.625rem; }
              .section { margin-bottom: 0.9375rem; }
              .row { display: flex; justify-content: space-between; margin-bottom: 0.3125rem; }
              .bold { font-weight: bold; }
              .total-box { border-top: 0.0625rem dashed #000000; border-bottom: 0.0625rem dashed #000000; padding: 0.625rem 0; margin-top: 0.9375rem; }
              .footer { text-align: center; margin-top: 1.875rem; border-top: 0.0625rem dashed #000000; padding-top: 0.625rem; font-size: 0.6875rem; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }

  // Filters logic
  const filteredPayrolls = payrolls.filter((p) => {
    const matchesSearch =
      p.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.employee.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate totals
  const totalUnpaid = payrolls.reduce((sum, p) => sum + (Number(p.totalEarned) - Number(p.totalPaid)), 0);
  const totalPaid = payrolls.reduce((sum, p) => sum + Number(p.totalPaid), 0);
  const totalEarned = payrolls.reduce((sum, p) => sum + Number(p.totalEarned), 0);
  const pendingCount = payrolls.filter((p) => p.status !== "PAID").length;

  return (
    <RoleGuard allowedRoles={["OWNER", "ADMIN"]}>
      <div className="min-h-screen bg-background text-foreground p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              {isOwner ? "Gaji & Payroll" : "Slip Gaji Saya"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isOwner 
                ? "Manajemen gaji harian, bagi hasil komisi mekanik, persetujuan dan slip pembayaran." 
                : "Riwayat dan rincian slip gaji Anda."}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              size="default"
              onClick={fetchData}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Refresh Data
            </Button>
            {isOwner && (
              <Button
                size="default"
                onClick={() => setGenerateOpen(true)}
                className="gap-2 bg-primary hover:bg-primary/95 text-white"
              >
                <Plus className="h-4 w-4" /> Generate Gaji
              </Button>
            )}
          </div>
        </div>

        {/* Financial Recap Widgets */}
        <div className={`grid grid-cols-1 ${isOwner ? "md:grid-cols-4" : "md:grid-cols-3"} gap-6`}>
          <Card className="border-border bg-card border-t-4 border-t-destructive">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Gaji Terhutang (Liability)</CardTitle>
              <Wallet className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatMoney(totalUnpaid)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {isOwner ? "Total gaji belum dicairkan" : "Gaji Anda yang belum dicairkan"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card border-t-4 border-t-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Terbayar</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{formatMoney(totalPaid)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {isOwner ? "Akumulasi gaji keluar" : "Total gaji yang sudah diterima"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card border-t-4 border-t-primary">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Anggaran Gaji</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatMoney(totalEarned)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {isOwner ? "Pokok + bonus + komisi" : "Total pendapatan kotor Anda"}
              </p>
            </CardContent>
          </Card>

          {isOwner && (
            <Card className="border-border bg-card border-t-4 border-t-orange-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Menunggu Pembayaran</CardTitle>
                <Users className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{pendingCount} Karyawan</div>
                <p className="text-xs text-muted-foreground mt-1">Belum lunas / parsial</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Filter and Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border">
          <div className="flex flex-1 flex-col md:flex-row gap-4 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Cari mekanik atau posisi..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status Pembayaran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="UNPAID">Belum Dibayar</SelectItem>
                  <SelectItem value="PARTIAL">Dibayar Sebagian</SelectItem>
                  <SelectItem value="PAID">Lunas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
            <ExportButton
              title={`Rekap_Gaji_Mekanik_${new Date().toISOString().slice(0, 10)}`}
              onExport={async (format, orientation) => {
                const summaryData: PayrollSummary = {
                  period: `Periode Rekap Gaji`,
                  startDate: filteredPayrolls.length > 0 ? filteredPayrolls[filteredPayrolls.length - 1].startDate : new Date(),
                  endDate: filteredPayrolls.length > 0 ? filteredPayrolls[0].endDate : new Date(),
                  entries: filteredPayrolls.map((p) => ({
                    employeeId: p.employeeId.slice(-6).toUpperCase(),
                    employeeName: p.employee.name,
                    position: p.employee.role,
                    basicSalary: Number(p.baseSalary),
                    allowances: Number(p.bonus),
                    deductions: 0,
                    netSalary: Number(p.totalEarned),
                  })),
                  totalSalary: filteredPayrolls.reduce((sum, p) => sum + Number(p.totalEarned), 0),
                };
                const { exportPayrollSummary } = await import("@/lib/export/reports/payrollExport");
                return await exportPayrollSummary(summaryData, format, orientation);
              }}
            />
          </div>
        </div>

        {/* Table of Payrolls */}
        <Card className="border-border bg-card overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-24">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                <p className="text-muted-foreground text-sm">Memuat data gaji...</p>
              </div>
            ) : filteredPayrolls.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-10" />
                <h3 className="font-bold text-lg text-foreground">Tidak Ada Data Gaji</h3>
                <p className="text-sm max-w-xs mx-auto mt-1">
                  Belum ada data penggajian untuk filter terpilih. Silakan klik tombol "Generate Gaji" untuk membuat periode baru.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50 border-b">
                    <TableRow>
                      <TableHead className="font-bold">Karyawan</TableHead>
                      <TableHead className="font-bold">Posisi</TableHead>
                      <TableHead className="font-bold">Periode Kerja</TableHead>
                      <TableHead className="font-bold text-right">Gaji Pokok</TableHead>
                      <TableHead className="font-bold text-right">Bonus</TableHead>
                      <TableHead className="font-bold text-right">Total Bersih</TableHead>
                      <TableHead className="font-bold text-right">Telah Dibayar</TableHead>
                      <TableHead className="font-bold text-center">Status</TableHead>
                      <TableHead className="font-bold text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y">
                    {filteredPayrolls.map((p) => {
                      return (
                        <TableRow
                          key={p.id}
                          className="hover:bg-muted/20 transition-colors"
                        >
                          <TableCell className="font-semibold text-foreground py-4">
                            <div>
                              <p className="font-bold">{p.employee.name}</p>
                              <Badge
                                variant="outline"
                                className="text-[10px] uppercase font-mono mt-0.5"
                              >
                                {p.employee.salaryType === "DAILY" ? "Gaji Harian" : "Komisi / Hasil"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground font-medium">{p.employee.role}</TableCell>
                          <TableCell className="text-sm">
                            <span className="font-medium">
                              {formatDateStr(p.startDate)} - {formatDateStr(p.endDate)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium text-foreground">
                            {formatMoney(p.baseSalary)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-foreground">
                            {p.bonus > 0 ? (
                              <span className="text-green-600 font-bold">+{formatMoney(p.bonus)}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-bold text-foreground">
                            {formatMoney(p.totalEarned)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {p.totalPaid > 0 ? formatMoney(p.totalPaid) : "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                p.status === "PAID"
                                  ? "default"
                                  : p.status === "PARTIAL"
                                  ? "secondary"
                                  : "destructive"
                              }
                              className={
                                p.status === "PAID"
                                  ? "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20"
                                  : p.status === "PARTIAL"
                                  ? "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20"
                                  : "bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20"
                              }
                            >
                              {p.status === "PAID"
                                ? "Lunas"
                                : p.status === "PARTIAL"
                                ? "Parsial"
                                : "Belum Dibayar"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                title="Lihat & Cetak Slip Gaji"
                                onClick={() => {
                                  setSelectedPayroll(p);
                                  setDetailOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              {isOwner && p.status !== "PAID" && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="h-8 bg-green-600 hover:bg-green-700 text-white font-bold text-xs"
                                  onClick={() => openPay(p)}
                                >
                                  Cairkan / Bayar
                                </Button>
                              )}

                              {isOwner && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0"
                                  title="Edit Bonus"
                                  onClick={() => openEdit(p)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}

                              {isOwner && p.totalPaid === 0 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                  title="Hapus Slip Gaji"
                                  onClick={() => handleDelete(p.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generate Payroll Dialog */}
        <Dialog
          open={generateOpen}
          onOpenChange={setGenerateOpen}
        >
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleBulkGenerate}>
              <DialogHeader>
                <DialogTitle>Generate Slip Gaji Masal</DialogTitle>
                <DialogDescription>
                  Membuat rincian & slip gaji untuk seluruh karyawan aktif pada rentang periode yang ditentukan.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gen-start">Tanggal Mulai</Label>
                    <Input
                      id="gen-start"
                      type="date"
                      value={genStartDate}
                      onChange={(e) => setGenStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gen-end">Tanggal Akhir</Label>
                    <Input
                      id="gen-end"
                      type="date"
                      value={genEndDate}
                      onChange={(e) => setGenEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground border">
                  DAILY (Harian) akan dihitung berdasarkan jumlah hari kerja dikali rate harian.
                  <br />
                  COMMISSION (Komisi) dihitung berdasarkan total unit sepeda motor selesai dikerjakan dikali rate bagi hasil.
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setGenerateOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={generating}
                  className="bg-primary text-white"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Memproses...
                    </>
                  ) : (
                    "Proses Gaji"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Bonus Dialog */}
        <Dialog
          open={editOpen}
          onOpenChange={setEditOpen}
        >
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleEditBonus}>
              <DialogHeader>
                <DialogTitle>Koreksi Bonus & Catatan</DialogTitle>
                <DialogDescription>
                  Tambahkan bonus nominal uang dan catatan alasan penambahan pada slip gaji.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {selectedPayroll && (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Nama: {selectedPayroll.employee.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Gaji Pokok Terhitung: {formatMoney(selectedPayroll.baseSalary)}
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="bonus-amount">Jumlah Bonus (Rupiah)</Label>
                  <Input
                    id="bonus-amount"
                    type="number"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(e.target.value)}
                    min={0}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bonus-note">Catatan / Alasan Bonus</Label>
                  <Textarea
                    id="bonus-note"
                    placeholder="Contoh: Lembur proyek motor sport, bonus target mingguan..."
                    value={bonusNote}
                    onChange={(e) => setBonusNote(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={updating}
                  className="bg-primary text-white"
                >
                  {updating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    "Simpan Koreksi"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Pay Dialog */}
        <Dialog
          open={payOpen}
          onOpenChange={setPayOpen}
        >
          <DialogContent className="sm:max-w-[450px]">
            <form onSubmit={handlePayPayroll}>
              <DialogHeader>
                <DialogTitle>Approval & Pencairan Gaji</DialogTitle>
                <DialogDescription>
                  Proses persetujuan dan pencairan pembayaran gaji karyawan.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {selectedPayroll && (
                  <div className="p-3 bg-muted/40 rounded-lg border space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Penerima:</span>
                      <span className="font-bold text-foreground">{selectedPayroll.employee.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Posisi:</span>
                      <span className="font-semibold text-foreground">{selectedPayroll.employee.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Gaji Bersih:</span>
                      <span className="font-bold text-foreground">{formatMoney(selectedPayroll.totalEarned)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1.5 font-bold">
                      <span className="text-destructive">Sisa Terhutang:</span>
                      <span className="text-destructive">
                        {formatMoney(Number(selectedPayroll.totalEarned) - Number(selectedPayroll.totalPaid))}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="pay-amount">Jumlah Pencairan (Nominal Terbayar)</Label>
                  <Input
                    id="pay-amount"
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    min={1}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pay-method">Metode Pembayaran</Label>
                    <Select
                      value={payMethod}
                      onValueChange={(val: "CASH" | "TRANSFER") => {
                        setPayMethod(val);
                        if (val === "CASH") {
                          setSelectedBankId("");
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Metode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Tunai (Kas)</SelectItem>
                        <SelectItem value="TRANSFER">Transfer Bank</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {payMethod === "TRANSFER" && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <Label htmlFor="pay-bank">Rekening Sumber</Label>
                      <Select
                        value={selectedBankId}
                        onValueChange={setSelectedBankId}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Bank" />
                        </SelectTrigger>
                        <SelectContent>
                          {banks.map((bank) => (
                            <SelectItem
                              key={bank.id}
                              value={bank.id}
                            >
                              {bank.bankName} ({bank.accountNumber.slice(-4)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pay-note">Catatan Penjelas</Label>
                  <Input
                    id="pay-note"
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPayOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={paying}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold"
                >
                  {paying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Memproses...
                    </>
                  ) : (
                    "Approve"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Detail Slip Gaji View Dialog */}
        <Dialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
        >
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Tinjau Slip Gaji</DialogTitle>
              <DialogDescription>Rincian data penggajian mekanik secara mendalam.</DialogDescription>
            </DialogHeader>

            {selectedPayroll && (
              <div className="space-y-6">
                {/* Printable Area */}
                <div
                  id="payroll-slip-printable"
                  className="p-6 border border-dashed rounded-lg bg-muted/10 space-y-4"
                >
                  <div
                    className="header"
                    style={{ textAlign: "center", borderBottom: "2px dashed #333", paddingBottom: "12px", marginBottom: "15px" }}
                  >
                    <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>NOPZ GARAGE</h2>
                    <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#666" }}>
                      Sistem Manajemen Antrian & Keuangan Bengkel
                    </p>
                    <h3 style={{ margin: "10px 0 0", fontSize: "14px", fontWeight: "bold", textTransform: "uppercase" }}>
                      SLIP GAJI KARYAWAN
                    </h3>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID Slip:</span>
                      <span className="font-mono font-bold">#{selectedPayroll.id.toUpperCase().slice(-8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nama Karyawan:</span>
                      <span className="font-bold">{selectedPayroll.employee.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Posisi:</span>
                      <span className="font-semibold">{selectedPayroll.employee.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Periode:</span>
                      <span>
                        {formatDateStr(selectedPayroll.startDate)} - {formatDateStr(selectedPayroll.endDate)}
                      </span>
                    </div>
                  </div>

                  <div style={{ borderTop: "1px dashed #333", marginTop: "15px", paddingTop: "12px" }}>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2">Rincian Pendapatan</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>
                          Gaji Pokok / Komisi 
                          {selectedPayroll.employee.salaryType === "DAILY" ? (
                            <span className="text-xs text-muted-foreground"> ({selectedPayroll.detailsParsed?.workDays || 0} Hari Kerja)</span>
                          ) : (
                            <span className="text-xs text-muted-foreground"> ({selectedPayroll.detailsParsed?.motorCount || 0} Unit Selesai)</span>
                          )}
                        </span>
                        <span className="font-medium">{formatMoney(selectedPayroll.baseSalary)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span>
                          Bonus 
                          {selectedPayroll.detailsParsed?.bonusNote && (
                            <span className="text-xs text-muted-foreground block italic">Note: {selectedPayroll.detailsParsed.bonusNote}</span>
                          )}
                        </span>
                        <span className="font-medium text-green-600">
                          {selectedPayroll.bonus > 0 ? `+${formatMoney(selectedPayroll.bonus)}` : "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="total-box"
                    style={{ borderTop: "2px dashed #333", borderBottom: "2px dashed #333", padding: "10px 0", marginTop: "15px" }}
                  >
                    <div className="flex justify-between font-bold text-base">
                      <span>Total Gaji Bersih (Net):</span>
                      <span className="text-primary">{formatMoney(selectedPayroll.totalEarned)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1 text-green-600 font-semibold">
                      <span>Total Terbayar:</span>
                      <span>{formatMoney(selectedPayroll.totalPaid)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-0.5 text-destructive font-bold">
                      <span>Sisa Terhutang:</span>
                      <span>{formatMoney(Number(selectedPayroll.totalEarned) - Number(selectedPayroll.totalPaid))}</span>
                    </div>
                  </div>

                  <div
                    className="footer"
                    style={{ textAlign: "center", marginTop: "25px", fontSize: "10px", color: "#888", borderTop: "1px dashed #ccc", paddingTop: "8px" }}
                  >
                    Tanda bukti pembayaran sah yang dikeluarkan oleh NopzGarage secara digital.<br />
                    Dicetak pada: {new Date().toLocaleString("id-ID")}
                  </div>
                </div>

                {/* Dialog Footer Actions */}
                <div className="flex justify-between gap-2">
                  <Button
                    variant="outline"
                    onClick={handlePrintSlip}
                    className="gap-2"
                  >
                    <Printer className="h-4 w-4" /> Cetak Slip Fisik
                  </Button>
                  <Button onClick={() => setDetailOpen(false)}>Selesai</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}
