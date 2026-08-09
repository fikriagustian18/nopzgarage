"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Users,
  DollarSign,
  Wallet,
  Search,
  Edit,
  Trash2,
  Loader2,
  RefreshCw,
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
import { Textarea } from "@/components/ui/Textarea";
import {
  getPayrolls,
  updatePayroll,
  deletePayroll,
} from "@/lib/actions/payroll";
import { getBankAccounts } from "@/lib/actions/bank";
import { createPayment } from "@/lib/actions/payments";

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

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  isActive: boolean;
}

interface RawPayroll extends Omit<Payroll, "detailsParsed"> {
  detailsParsed?: Payroll["detailsParsed"];
}

export default function Page() {
  const [loading, setLoading] = useState(true);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog States
  const [editOpen, setEditOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);

  // Form States for Bonus Edit
  const [bonusAmount, setBonusAmount] = useState<number | string>(0);
  const [bonusNote, setBonusNote] = useState<string>("");
  const [updating, setUpdating] = useState(false);

  // Form States for Payment (Cairkan)
  const [payAmount, setPayAmount] = useState<number | string>(0);
  const [payMethod, setPayMethod] = useState<"CASH" | "TRANSFER">("CASH");
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [payNote, setPayNote] = useState<string>("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [payrollRes, bankRes] = await Promise.all([
        getPayrolls(),
        getBankAccounts(),
      ]);

      if (payrollRes.success && payrollRes.payrolls) {
        const formatted: Payroll[] = (payrollRes.payrolls as RawPayroll[]).map((p) => {
          let detailsParsed = p.detailsParsed ?? null;
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
        // Filter down to pending ones (UNPAID or PARTIAL) for Approval dashboard
        setPayrolls(formatted.filter((p) => p.status !== "PAID"));
      }

      if (bankRes.success && bankRes.data) {
        setBanks(bankRes.data.filter((b: BankAccount) => b.isActive));
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data approval gaji");
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

  // Open Edit Dialog
  function openEdit(p: Payroll) {
    setSelectedPayroll(p);
    setBonusAmount(Number(p.bonus));
    setBonusNote(p.detailsParsed?.bonusNote ?? "");
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
        toast.success("Rincian bonus & slip gaji berhasil disesuaikan");
        setEditOpen(false);
        fetchData();
      } else {
        toast.error(res.error || "Gagal memperbarui rincian bonus");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan koneksi");
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
    setPayNote(
      `Pencairan Gaji/Komisi Periode ${formatDateStr(p.startDate)} - ${formatDateStr(
        p.endDate
      )}`
    );
    setPayOpen(true);
  }

  // Handle Payout Approval
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
      toast.error("Silakan pilih rekening bank asal transfer");
      return;
    }

    const unpaid = Number(selectedPayroll.totalEarned) - Number(selectedPayroll.totalPaid);
    if (payAmountNum > unpaid) {
      toast.error(`Jumlah pembayaran melebihi sisa gaji terhutang (Maks: ${formatMoney(unpaid)})`);
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
        toast.success(`Pencairan gaji sebesar ${formatMoney(payAmountNum)} berhasil disetujui & dicatat!`);
        setPayOpen(false);
        fetchData();
      } else {
        toast.error(res.error || "Gagal memproses pembayaran");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setPaying(false);
    }
  }

  // Handle Delete Payroll
  async function handleDelete(id: string) {
    if (
      !confirm(
        "Apakah Anda yakin ingin membatalkan/menghapus slip gaji ini? Opsi ini hanya bisa dilakukan jika belum ada pembayaran."
      )
    ) {
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
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    }
  }

  // Filter pending payrolls
  const filteredPayrolls = payrolls.filter((p) => {
    return (
      p.employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.employee.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Calculate totals
  const totalUnpaid = payrolls.reduce(
    (sum, p) => sum + (Number(p.totalEarned) - Number(p.totalPaid)),
    0
  );
  const pendingCount = payrolls.length;

  return (
    <RoleGuard allowedRoles={["OWNER"]}>
      <div className="min-h-screen bg-background text-foreground p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Persetujuan & Pencairan Gaji (Approval)
            </h1>
            <p className="text-muted-foreground mt-1">
              Setujui rincian bonus, proses pembayaran gaji tunai/transfer, dan kelola kewajiban utang gaji.
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
          </div>
        </div>

        {/* Recap widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border bg-card border-t-4 border-t-destructive shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase">
                Gaji Terhutang (Liability Bengkel)
              </CardTitle>
              <Wallet className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-destructive">
                {formatMoney(totalUnpaid)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total kewajiban gaji/komisi karyawan yang belum dibayarkan lunas
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card border-t-4 border-t-orange-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase">
                Menunggu Pembayaran / Persetujuan
              </CardTitle>
              <Users className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground">
                {pendingCount} Slip
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Jumlah slip gaji karyawan dengan status belum dibayar atau bayar sebagian
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Cari mekanik atau posisi karyawan..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table of pending payrolls */}
        <Card className="border-border bg-card overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-24">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                <p className="text-muted-foreground text-sm">Memuat data antrean persetujuan...</p>
              </div>
            ) : filteredPayrolls.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground bg-muted/5">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500/25" />
                <h3 className="font-bold text-lg text-foreground">Semua Gaji Bersih Terbayar</h3>
                <p className="text-sm max-w-xs mx-auto mt-1">
                  Tidak ada pengajuan gaji yang menunggu approval. Semua gaji aktif sudah lunas dibayarkan.
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
                      <TableHead className="font-bold text-right">Bonus Terkait</TableHead>
                      <TableHead className="font-bold text-right">Total Bersih</TableHead>
                      <TableHead className="font-bold text-right">Telah Dibayar</TableHead>
                      <TableHead className="font-bold text-right font-bold text-destructive">Sisa Terhutang</TableHead>
                      <TableHead className="font-bold text-center">Status</TableHead>
                      <TableHead className="font-bold text-center">Aksi Approval</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y">
                    {filteredPayrolls.map((p) => {
                      const sisa = Number(p.totalEarned) - Number(p.totalPaid);
                      return (
                        <TableRow key={p.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell className="font-semibold text-foreground py-4">
                            <div>
                              <p className="font-bold">{p.employee.name}</p>
                              <span className="text-[10px] uppercase text-muted-foreground">
                                {p.employee.salaryType === "DAILY" ? "Gaji Harian" : "Komisi / Hasil"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground font-medium">
                            {p.employee.role}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {formatDateStr(p.startDate)} - {formatDateStr(p.endDate)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatMoney(p.baseSalary)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {p.bonus > 0 ? (
                              <span className="text-green-600 font-bold">
                                +{formatMoney(p.bonus)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {formatMoney(p.totalEarned)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {p.totalPaid > 0 ? formatMoney(p.totalPaid) : "-"}
                          </TableCell>
                          <TableCell className="text-right font-bold text-destructive">
                            {formatMoney(sisa)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={
                                p.status === "PARTIAL"
                                  ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                  : "bg-red-500/10 text-red-600 border-red-500/20"
                              }
                            >
                              {p.status === "PARTIAL" ? "Sebagian" : "Belum Dibayar"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs gap-1"
                                onClick={() => openPay(p)}
                              >
                                <DollarSign className="h-3.5 w-3.5" /> Cairkan / Bayar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                title="Sesuaikan Bonus / Deskripsi"
                                onClick={() => openEdit(p)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {p.totalPaid === 0 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                  title="Batalkan Slip Gaji"
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

        {/* Adjust Bonus Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleEditBonus}>
              <DialogHeader>
                <DialogTitle className="font-bold">Sesuaikan Bonus Karyawan</DialogTitle>
                <DialogDescription>
                  Tambahkan atau sesuaikan bonus tambahan beserta catatan penjelasannya sebelum disetujui.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-1">
                  <Label htmlFor="bonus-amount" className="text-xs font-semibold">Nominal Bonus (IDR)</Label>
                  <Input
                    id="bonus-amount"
                    type="number"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bonus-note" className="text-xs font-semibold">Catatan Keterangan Bonus</Label>
                  <Textarea
                    id="bonus-note"
                    value={bonusNote}
                    onChange={(e) => setBonusNote(e.target.value)}
                    placeholder="Contoh: Bonus target bulanan selesai cepat, bonus kebaikan pelayanan dll."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditOpen(false);
                  }}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-primary text-white"
                  disabled={updating}
                >
                  {updating ? "Menyimpan..." : "Simpan Penyesuaian"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Payment Approval / Cairkan Dialog */}
        <Dialog open={payOpen} onOpenChange={setPayOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <form onSubmit={handlePayPayroll}>
              <DialogHeader>
                <DialogTitle className="font-bold">Pencairan Gaji & Komisi</DialogTitle>
                <DialogDescription>
                  Persetujuan pembayaran gaji terhutang. Transaksi ini akan tercatat dalam jurnal keuangan.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-1 bg-muted/30 p-3 rounded-lg border border-border">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-semibold">Karyawan:</span>
                    <span className="font-bold text-foreground">{selectedPayroll?.employee.name}</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1.5">
                    <span className="text-muted-foreground font-semibold">Sisa Utang Gaji:</span>
                    <span className="font-bold text-destructive">
                      {selectedPayroll &&
                        formatMoney(
                          Number(selectedPayroll.totalEarned) - Number(selectedPayroll.totalPaid)
                        )}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="pay-amount" className="text-xs font-semibold">Nominal Pembayaran (IDR)</Label>
                  <Input
                    id="pay-amount"
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    max={
                      selectedPayroll
                        ? Number(selectedPayroll.totalEarned) - Number(selectedPayroll.totalPaid)
                        : undefined
                    }
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="pay-method" className="text-xs font-semibold">Metode Pembayaran</Label>
                  <Select
                    value={payMethod}
                    onValueChange={(val: any) => {
                      setPayMethod(val);
                      if (val === "CASH") {
                        setSelectedBankId("");
                      }
                    }}
                  >
                    <SelectTrigger id="pay-method">
                      <SelectValue placeholder="Pilih Metode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Tunai / Kas Kecil</SelectItem>
                      <SelectItem value="TRANSFER">Transfer Bank / Rekening</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {payMethod === "TRANSFER" && (
                  <div className="space-y-1">
                    <Label htmlFor="bank-account" className="text-xs font-semibold">Rekening Bank Pengirim (Kas Bengkel)</Label>
                    <Select value={selectedBankId} onValueChange={setSelectedBankId}>
                      <SelectTrigger id="bank-account">
                        <SelectValue placeholder="Pilih Rekening Bank Asal" />
                      </SelectTrigger>
                      <SelectContent>
                        {banks.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.bankName} - {b.accountNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor="pay-note" className="text-xs font-semibold">Catatan Transaksi</Label>
                  <Textarea
                    id="pay-note"
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPayOpen(false);
                  }}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white font-bold"
                  disabled={paying}
                >
                  {paying ? "Memproses..." : "Setujui & Cairkan Gaji"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}
