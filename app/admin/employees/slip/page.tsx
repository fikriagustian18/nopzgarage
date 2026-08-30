"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Users,
  DollarSign,
  Wallet,
  Plus,
  Search,
  Loader2,
  RefreshCw,
  Eye,
  Printer,
  CheckCircle,
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
import {
  getPayrolls,
  bulkGeneratePayroll,
} from "@/lib/actions/payroll";

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
    monthlyRate?: number;
    commissionRate?: number;
  } | null;
  createdAt: string;
  employee: {
    id: string;
    name: string;
    role: string;
    salaryType: "DAILY" | "COMMISSION" | "MONTHLY";
  };
}

interface RawPayroll extends Omit<Payroll, "detailsParsed"> {
  detailsParsed?: Payroll["detailsParsed"];
}

export default function Page() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const isOwner = userRole === "OWNER";

  const [loading, setLoading] = useState(true);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Form states for Bulk Generate
  const [generateOpen, setGenerateOpen] = useState(false);
  const [genStartDate, setGenStartDate] = useState("");
  const [genEndDate, setGenEndDate] = useState("");
  const [generating, setGenerating] = useState(false);

  // Detail View State
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  async function fetchData() {
    setLoading(true);
    try {
      const payrollRes = await getPayrolls();

      if (payrollRes.success && payrollRes.payrolls) {
        const formatted: Payroll[] = (payrollRes.payrolls as RawPayroll[]).map((p) => {
          let detailsParsed = p.detailsParsed || null;
          if (!detailsParsed && p.details) {
            try {
              detailsParsed = JSON.parse(p.details);
            } catch (error) {
              detailsParsed = { bonusNote: p.details };
            }
          }
          return {
            ...p,
            detailsParsed,
          };
        });
        setPayrolls(formatted);
      } else {
        toast.error(payrollRes.error || "Gagal memuat data slip gaji");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan koneksi");
    } finally {
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
      toast.error("Pilih rentang tanggal mulai dan akhir");
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
        toast.error(res.error || "Gagal melakukan generate slip gaji");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setGenerating(false);
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
              window.onload = () => {
                window.print();
                window.close();
              };
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
  const totalUnpaid = payrolls.reduce(
    (sum, p) => sum + (Number(p.totalEarned) - Number(p.totalPaid)),
    0
  );
  const totalPaid = payrolls.reduce((sum, p) => sum + Number(p.totalPaid), 0);
  const totalEarned = payrolls.reduce((sum, p) => sum + Number(p.totalEarned), 0);

  return (
    <RoleGuard allowedRoles={["OWNER", "ADMIN"]}>
      <div className="min-h-screen bg-background text-foreground p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              {isOwner ? "Manajemen Slip Gaji" : "Slip Gaji Saya"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isOwner
                ? "Generate slip gaji masal, pantau status pembayaran, dan cetak slip gaji karyawan."
                : "Riwayat rincian, pendapatan, dan pencetakan slip gaji Anda."}
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

        {/* Widgets Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-border bg-card border-t-4 border-t-destructive shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase">
                {isOwner ? "Gaji Terhutang (Liability)" : "Gaji Belum Dicairkan"}
              </CardTitle>
              <Wallet className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {formatMoney(totalUnpaid)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isOwner ? "Total slip gaji belum dicairkan lunas" : "Dana gaji Anda yang masih ditunda"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card border-t-4 border-t-green-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase">
                Total Terbayar
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {formatMoney(totalPaid)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isOwner ? "Akumulasi pengeluaran gaji lunas" : "Dana gaji yang sudah sukses Anda terima"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card border-t-4 border-t-primary shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase">
                Total Anggaran Gaji
              </CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatMoney(totalEarned)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isOwner ? "Gaji pokok + bonus + komisi kotor" : "Total seluruh pendapatan kotor Anda"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={isOwner ? "Cari mekanik atau posisi..." : "Cari berdasarkan posisi..."}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48 shrink-0">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status Pembayaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="UNPAID">Belum Dibayar</SelectItem>
                <SelectItem value="PARTIAL">Parsial</SelectItem>
                <SelectItem value="PAID">Lunas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table of Payrolls */}
        <Card className="border-border bg-card overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-24">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                <p className="text-muted-foreground text-sm">Memuat daftar slip gaji...</p>
              </div>
            ) : filteredPayrolls.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground bg-muted/5">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-10" />
                <h3 className="font-bold text-lg text-foreground">Tidak Ada Slip Gaji</h3>
                <p className="text-sm max-w-xs mx-auto mt-1">
                  Belum ada periode penggajian yang dibuat untuk filter terpilih.
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
                    {filteredPayrolls.map((p) => (
                      <TableRow key={p.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-semibold text-foreground py-4">
                          <div>
                            <p className="font-bold">{p.employee.name}</p>
                            <Badge variant="outline" className="text-[10px] uppercase font-mono mt-0.5">
                              {p.employee.salaryType === "DAILY"
                                ? "Gaji Harian"
                                : p.employee.salaryType === "MONTHLY"
                                ? "Gaji Bulanan"
                                : "Komisi / Hasil"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-medium">{p.employee.role}</TableCell>
                        <TableCell className="text-sm font-medium">
                          {formatDateStr(p.startDate)} - {formatDateStr(p.endDate)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">{formatMoney(p.baseSalary)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {p.bonus > 0 ? (
                            <span className="text-green-600 font-bold">+{formatMoney(p.bonus)}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold">{formatMoney(p.totalEarned)}</TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {p.totalPaid > 0 ? formatMoney(p.totalPaid) : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={
                              p.status === "PAID"
                                ? "bg-green-500/10 text-green-600 border-green-500/20"
                                : p.status === "PARTIAL"
                                ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                : "bg-red-500/10 text-red-600 border-red-500/20"
                            }
                          >
                            {p.status === "PAID" ? "Lunas" : p.status === "PARTIAL" ? "Parsial" : "Belum Dibayar"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            title="Tinjau & Cetak Slip Gaji"
                            onClick={() => {
                              setSelectedPayroll(p);
                              setDetailOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bulk Generate Payroll Dialog (Owner Only) */}
        {isOwner && (
          <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleBulkGenerate}>
                <DialogHeader>
                  <DialogTitle className="font-bold">Generate Slip Gaji Masal</DialogTitle>
                  <DialogDescription>
                    Membuat slip gaji bagi seluruh karyawan aktif berdasarkan data hari kerja atau komisi bagi hasil order pada rentang tanggal yang dipilih.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="gen-start" className="text-xs font-semibold">Tanggal Mulai</Label>
                      <Input
                        id="gen-start"
                        type="date"
                        value={genStartDate}
                        onChange={(e) => setGenStartDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="gen-end" className="text-xs font-semibold">Tanggal Akhir</Label>
                      <Input
                        id="gen-end"
                        type="date"
                        value={genEndDate}
                        onChange={(e) => setGenEndDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-[11px] text-muted-foreground border leading-relaxed">
                    <strong>Informasi:</strong>
                    <br />- Skema Harian (DAILY) dikalkulasi berdasarkan jumlah hari kerja (Minggu libur) dikali rate harian.
                    <br />- Skema Bulanan (MONTHLY) menggunakan rate bulanan tetap untuk periode payroll.
                    <br />- Skema Komisi (COMMISSION) memakai snapshot persentase subtotal jasa dari order lunas yang sudah selesai.
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setGenerateOpen(false);
                    }}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary text-white"
                    disabled={generating}
                  >
                    {generating ? "Memproses..." : "Generate Slip Gaji"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Detail Slip Gaji View Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-bold">Rincian Slip Gaji</DialogTitle>
              <DialogDescription>
                Tinjauan detail slip gaji dan pembagian hasil kerja karyawan.
              </DialogDescription>
            </DialogHeader>

            {selectedPayroll && (
              <div className="space-y-6">
                {/* Printable Slip Layout */}
                <div
                  id="payroll-slip-printable"
                  className="p-5 border border-dashed rounded-lg bg-muted/10 space-y-4"
                >
                  <div
                    className="header"
                    style={{
                      textAlign: "center",
                      borderBottom: "2px dashed #000000",
                      paddingBottom: "10px",
                      marginBottom: "12px",
                    }}
                  >
                    <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "bold" }}>
                      NOPZ GARAGE
                    </h2>
                    <p style={{ margin: "2px 0 0", fontSize: "10px", color: "#555555" }}>
                      Sistem Informasi Manajemen Bengkel
                    </p>
                    <h3
                      style={{
                        margin: "8px 0 0",
                        fontSize: "12px",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                      }}
                    >
                      SLIP GAJI KARYAWAN
                    </h3>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID Slip:</span>
                      <span className="font-mono font-bold">
                        #{selectedPayroll.id.toUpperCase().slice(-8)}
                      </span>
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
                        {formatDateStr(selectedPayroll.startDate)} -{" "}
                        {formatDateStr(selectedPayroll.endDate)}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      borderTop: "1px dashed #000000",
                      marginTop: "12px",
                      paddingTop: "10px",
                    }}
                  >
                    <h4 style={{ margin: "0 0 6px", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", color: "#555555" }}>
                      Rincian Pendapatan
                    </h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>
                          Gaji Pokok / Komisi
                          {selectedPayroll.employee.salaryType === "DAILY" ? (
                            <span className="text-[10px] text-muted-foreground block italic">
                              ({selectedPayroll.detailsParsed?.workDays || 0} Hari Kerja)
                            </span>
                          ) : selectedPayroll.employee.salaryType === "MONTHLY" ? (
                            <span className="text-[10px] text-muted-foreground block italic">
                              (Gaji Bulanan Tetap)
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground block italic">
                              ({selectedPayroll.detailsParsed?.motorCount || 0} Unit Selesai)
                            </span>
                          )}
                        </span>
                        <span className="font-semibold">
                          {formatMoney(selectedPayroll.baseSalary)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span>
                          Bonus Tambahan
                          {selectedPayroll.detailsParsed?.bonusNote && (
                            <span className="text-[10px] text-muted-foreground block italic leading-tight">
                              Catatan: {selectedPayroll.detailsParsed.bonusNote}
                            </span>
                          )}
                        </span>
                        <span className="font-semibold text-green-600">
                          {selectedPayroll.bonus > 0 ? `+${formatMoney(selectedPayroll.bonus)}` : "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="total-box"
                    style={{
                      borderTop: "2px dashed #000000",
                      borderBottom: "2px dashed #000000",
                      padding: "8px 0",
                      marginTop: "12px",
                    }}
                  >
                    <div className="flex justify-between font-bold text-sm">
                      <span>Total Gaji Bersih (Net):</span>
                      <span className="text-primary">
                        {formatMoney(selectedPayroll.totalEarned)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs mt-1 text-green-600 font-semibold">
                      <span>Total Terbayar:</span>
                      <span>{formatMoney(selectedPayroll.totalPaid)}</span>
                    </div>
                    <div className="flex justify-between text-xs mt-0.5 text-destructive font-bold">
                      <span>Sisa Terhutang:</span>
                      <span>
                        {formatMoney(
                          Number(selectedPayroll.totalEarned) - Number(selectedPayroll.totalPaid)
                        )}
                      </span>
                    </div>
                  </div>

                  <div
                    className="footer"
                    style={{
                      textAlign: "center",
                      marginTop: "20px",
                      fontSize: "9px",
                      color: "#666666",
                      borderTop: "1px dashed #cccccc",
                      paddingTop: "6px",
                    }}
                  >
                    Dokumen sah digital dikeluarkan otomatis oleh sistem NopzGarage.
                    <br />
                    Tanggal cetak: {new Date().toLocaleString("id-ID")}
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="flex justify-between gap-2">
                  <Button
                    variant="outline"
                    onClick={handlePrintSlip}
                    className="gap-2"
                  >
                    <Printer className="h-4 w-4" /> Cetak Slip
                  </Button>
                  <Button onClick={() => setDetailOpen(false)}>Tutup</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}
