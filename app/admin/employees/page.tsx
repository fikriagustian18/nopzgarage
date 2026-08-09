"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Users,
  User,
  Plus,
  Search,
  Edit,
  Loader2,
  RefreshCw,
  Phone,
  CheckCircle2,
  DollarSign,
  Wallet,
  Briefcase,
  Clock,
  Download,
  ChevronDown,
  Wrench,
  Trash2,
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
  getEmployees,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  reactivateEmployee,
  getEmployeeDetail,
  getEmployeeStats,
} from "@/lib/actions/employees";
import { getJabatans } from "@/lib/actions/jabatan";
import type { SalaryType } from "@prisma/client";

interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  salaryType: "DAILY" | "COMMISSION" | "MONTHLY";
  dailyRate: number;
  commissionRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  unpaidAmount: number;
  _count: {
    orders: number;
    payrolls: number;
    orderFees: number;
  };
}

export default function Page() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [jabatans, setJabatans] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({
    totalUnpaid: 0,
    unpaidCount: 0,
    workingMechanics: 0,
    standbyMechanics: 0,
    totalMechanics: 0,
  });

  // Dialog States
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [toggleStatusOpen, setToggleStatusOpen] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [detailedData, setDetailedData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    phone: "",
    salaryType: "COMMISSION" as "DAILY" | "COMMISSION" | "MONTHLY",
    dailyRate: 0,
    commissionRate: 0,
  });

  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  async function fetchData() {
    setLoading(true);
    try {
      const [empRes, jabRes, statsRes] = await Promise.all([
        getEmployees(),
        getJabatans(),
        getEmployeeStats(),
      ]);
      if (empRes.success && empRes.employees) {
        setEmployees(empRes.employees as unknown as Employee[]);
      } else {
        toast.error(empRes.error || "Gagal memuat data karyawan");
      }
      if (jabRes.success && jabRes.jabatans) {
        setJabatans(jabRes.jabatans);
      }
      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats);
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

  function formatMoneyShort(val: number) {
    return new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 0,
    }).format(val);
  }

  // Open Edit Form
  function openEdit(emp: Employee) {
    setSelectedEmployee(emp);
    setFormData({
      name: emp.name,
      role: emp.role,
      phone: emp.phone || "",
      salaryType: emp.salaryType,
      dailyRate: Number(emp.dailyRate) || 0,
      commissionRate: Number(emp.commissionRate) || 0,
    });
    setEditOpen(true);
  }

  // Open Detail View
  async function openDetail(emp: Employee) {
    setSelectedEmployee(emp);
    setDetailedData(null);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await getEmployeeDetail(emp.id);
      if (res.success && res.employee) {
        setDetailedData(res.employee);
      } else {
        toast.error(res.error || "Gagal memuat rincian karyawan");
      }
    } catch (error) {
      toast.error("Gagal terhubung ke server");
    } finally {
      setDetailLoading(false);
    }
  }

  // Open Deactivate / Reactivate
  function openToggleStatus(emp: Employee) {
    setSelectedEmployee(emp);
    setToggleStatusOpen(true);
  }

  // Handle Add Employee
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.role) {
      toast.error("Nama dan Jabatan wajib diisi");
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await createEmployee({
        name: formData.name,
        role: formData.role,
        phone: formData.phone || undefined,
        salaryType: formData.salaryType as SalaryType,
        dailyRate: Number(formData.dailyRate) || 0,
        commissionRate: Number(formData.commissionRate) || 0,
      });

      if (res.success) {
        toast.success(`Berhasil menambahkan karyawan ${formData.name}`);
        setCreateOpen(false);
        // Reset form
        setFormData({
          name: "",
          role: "",
          phone: "",
          salaryType: "COMMISSION",
          dailyRate: 0,
          commissionRate: 0,
        });
        fetchData();
      } else {
        toast.error(res.error || "Gagal menambahkan karyawan");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setSubmitLoading(false);
    }
  }

  // Handle Update Employee
  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEmployee) {
      return;
    }

    if (!formData.name || !formData.role) {
      toast.error("Nama dan Jabatan wajib diisi");
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await updateEmployee({
        id: selectedEmployee.id,
        name: formData.name,
        role: formData.role,
        phone: formData.phone || undefined,
        salaryType: formData.salaryType as SalaryType,
        dailyRate: Number(formData.dailyRate) || 0,
        commissionRate: Number(formData.commissionRate) || 0,
      });

      if (res.success) {
        toast.success("Data karyawan berhasil diperbarui");
        setEditOpen(false);
        fetchData();
      } else {
        toast.error(res.error || "Gagal memperbarui karyawan");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setSubmitLoading(false);
    }
  }

  // Handle Toggle Active/Inactive Status
  async function handleToggleStatus() {
    if (!selectedEmployee) {
      return;
    }

    setSubmitLoading(true);
    try {
      const res = selectedEmployee.isActive
        ? await deactivateEmployee(selectedEmployee.id)
        : await reactivateEmployee(selectedEmployee.id);

      if (res.success) {
        toast.success(
          `Karyawan berhasil ${
            selectedEmployee.isActive ? "dinonaktifkan" : "diaktifkan kembali"
          }`
        );
        setToggleStatusOpen(false);
        fetchData();
      } else {
        toast.error(res.error || "Gagal mengubah status karyawan");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setSubmitLoading(false);
    }
  }

  // Filter logic
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && emp.isActive) ||
      (statusFilter === "INACTIVE" && !emp.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <RoleGuard allowedRoles={["OWNER"]}>
      <div className="min-h-screen bg-background text-foreground p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Kelola Karyawan
            </h1>
            <p className="text-muted-foreground mt-1">
              Manajemen data karyawan, admin, dan mekanik beserta skema fee.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              size="default"
              onClick={fetchData}
              className="gap-2 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" /> Refresh Data
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={() => {
                router.push('/admin/employees/jabatan');
              }}
              className="gap-2 cursor-pointer"
            >
              <Briefcase className="h-4 w-4" /> Kelola Jabatan
            </Button>
            <Button
              size="default"
              onClick={() => {
                setFormData({
                  name: "",
                  role: jabatans.length > 0 ? jabatans[0].name : "",
                  phone: "",
                  salaryType: "COMMISSION",
                  dailyRate: 0,
                  commissionRate: 0,
                });
                setCreateOpen(true);
              }}
              className="gap-2 bg-primary hover:bg-primary/95 text-white"
            >
              <Plus className="h-4 w-4" /> Tambah Karyawan
            </Button>
          </div>
        </div>

        {/* Stats Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Total Personil */}
          <Card className="border border-border bg-card">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-muted-foreground">Total Personil</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-foreground">{employees.length}</span>
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  {employees.filter(e => e.isActive).length} aktif bekerja
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Users className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Status Mekanik */}
          <Card className="border border-border bg-card">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">Status Mekanik</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-foreground">{stats.totalMechanics}</span>
                  <span className="text-sm font-medium text-muted-foreground">Total</span>
                </div>
                <div className="flex gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs gap-1 font-semibold border-muted"
                  >
                    <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" /> {stats.standbyMechanics} Standby
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-xs gap-1 font-semibold border-muted"
                  >
                    <Wrench className="h-3 w-3 text-muted-foreground" /> {stats.workingMechanics} Kerja
                  </Badge>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Wrench className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Komisi Belum Dibayar */}
          <Card className="border border-border bg-card">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1 w-full">
                <div className="flex items-center justify-between w-full">
                  <p className="text-sm font-semibold text-muted-foreground">Komisi Belum Dibayar</p>
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-foreground">{formatMoney(stats.totalUnpaid)}</span>
                </div>
                <div className="flex items-center justify-between w-full pt-1">
                  <p className="text-xs text-muted-foreground">
                    {stats.unpaidCount} tagihan pending
                  </p>
                  <Link 
                    href="/admin/employees/approval" 
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Lihat Semua
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan nama, jabatan..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
            <div className="w-full md:w-40">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status Keaktifan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="ACTIVE">Aktif</SelectItem>
                  <SelectItem value="INACTIVE">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="outline" className="gap-2 cursor-pointer">
              <Download className="h-4 w-4" /> Export <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Card Grid representation */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-24 bg-card rounded-xl border border-border">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
            <p className="text-muted-foreground text-sm">Memuat data karyawan...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground bg-card rounded-xl border border-border">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-10" />
            <h3 className="font-bold text-lg text-foreground">Tidak Ada Karyawan</h3>
            <p className="text-sm max-w-xs mx-auto mt-1">
              Karyawan tidak ditemukan. Klik tombol "Tambah Karyawan" untuk menambahkan staff baru.
            </p>
          </div>
        ) : (() => {
          const itemsPerPage = 8;
          const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
          const paginatedEmployees = filteredEmployees.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
          );

          return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {paginatedEmployees.map((emp) => {
                  const firstLetter = emp.name.charAt(0).toUpperCase();
                  const shortId = emp.id.slice(-5);
                  
                  return (
                    <Card 
                      key={emp.id} 
                      className="border border-border bg-card overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => openDetail(emp)}
                    >
                      <CardContent className="p-6 space-y-4">
                        {/* Header: Name, ID, and Status */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                              {firstLetter}
                            </div>
                            <div>
                              <h3 className="font-bold text-sm text-foreground leading-tight">{emp.name}</h3>
                              <p className="text-xs text-muted-foreground font-mono mt-0.5">#{shortId}</p>
                            </div>
                          </div>
                          
                          <Badge
                            className={
                              emp.isActive
                                ? "bg-green-500/10 text-green-600 border-green-500/20 font-semibold"
                                : "bg-muted text-muted-foreground border-border font-semibold"
                            }
                            variant={emp.isActive ? "default" : "outline"}
                          >
                            {emp.isActive ? "Aktif" : "Non"}
                          </Badge>
                        </div>

                        {/* Details */}
                        <div className="space-y-2.5 pt-2 border-t border-border/50 text-xs">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Briefcase className="h-4 w-4 shrink-0 text-primary/70" />
                            <span className="font-medium text-foreground">{emp.role}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4 shrink-0 text-primary/70" />
                            <span className="text-foreground">{emp.phone || "-"}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Wallet className="h-4 w-4 shrink-0 text-primary/70" />
                            <span className="font-medium text-foreground">
                              Gaji: {formatMoneyShort(emp.salaryType === "DAILY" ? emp.dailyRate : emp.commissionRate)}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            className="flex-1 gap-1.5 h-9 font-bold text-xs cursor-pointer"
                            onClick={() => openEdit(emp)}
                          >
                            <Edit className="h-3.5 w-3.5" /> Edit
                          </Button>
                          <Button
                            variant="outline"
                            className={`h-9 w-9 p-0 cursor-pointer ${
                              emp.isActive
                                ? "text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                : "text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                            }`}
                            onClick={() => openToggleStatus(emp)}
                            title={emp.isActive ? "Nonaktifkan Karyawan" : "Aktifkan Karyawan"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination controls to match mockup */}
              {totalPages > 1 && (
                <div className="flex justify-end items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 cursor-pointer"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  >
                    &lt;
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 cursor-pointer"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  >
                    &gt;
                  </Button>
                </div>
              )}
            </div>
          );
        })()}

        {/* Add Employee Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle className="font-bold">Tambah Karyawan Baru</DialogTitle>
                <DialogDescription>
                  Masukkan detail informasi karyawan baru untuk didaftarkan ke sistem.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-xs font-semibold">Nama Lengkap</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Budi Santoso"
                    required
                  />
                </div>
                 <div className="space-y-1">
                  <Label htmlFor="role" className="text-xs font-semibold">Jabatan / Posisi</Label>
                  {jabatans.length === 0 ? (
                    <div className="text-xs text-muted-foreground py-2 border rounded px-3 bg-muted/20">
                      Belum ada data jabatan. Silakan tambahkan jabatan terlebih dahulu di menu Data Jabatan.
                    </div>
                  ) : (
                    <Select
                      value={formData.role}
                      onValueChange={(val) => setFormData({ ...formData, role: val })}
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Pilih Jabatan" />
                      </SelectTrigger>
                      <SelectContent>
                        {jabatans.map((j) => (
                          <SelectItem key={j.id} value={j.name}>
                            {j.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-xs font-semibold">Nomor Telepon (WhatsApp)</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Contoh: 08123456789"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="salaryType" className="text-xs font-semibold">Skema Gaji</Label>
                  <Select
                    value={formData.salaryType}
                    onValueChange={(val: any) => setFormData({ ...formData, salaryType: val })}
                  >
                    <SelectTrigger id="salaryType">
                      <SelectValue placeholder="Pilih Skema Gaji" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMMISSION">Komisi / Bagi Hasil (Mekanik)</SelectItem>
                      <SelectItem value="DAILY">Gaji Harian tetap</SelectItem>
                      <SelectItem value="MONTHLY">Bulanan (Standard)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.salaryType === "DAILY" && (
                  <div className="space-y-1">
                    <Label htmlFor="dailyRate" className="text-xs font-semibold">Rate Gaji Harian (IDR)</Label>
                    <Input
                      id="dailyRate"
                      type="number"
                      value={formData.dailyRate}
                      onChange={(e) => setFormData({ ...formData, dailyRate: Number(e.target.value) })}
                      placeholder="Contoh: 100000"
                    />
                  </div>
                )}
                {formData.salaryType === "COMMISSION" && (
                  <div className="space-y-1">
                    <Label htmlFor="commissionRate" className="text-xs font-semibold">Rate Komisi % / Nominal (IDR)</Label>
                    <Input
                      id="commissionRate"
                      type="number"
                      value={formData.commissionRate}
                      onChange={(e) => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
                      placeholder="Contoh: 25000"
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateOpen(false);
                  }}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-primary text-white"
                  disabled={submitLoading}
                >
                  {submitLoading ? "Menyimpan..." : "Simpan Karyawan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Employee Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <form onSubmit={handleUpdate}>
              <DialogHeader>
                <DialogTitle className="font-bold">Edit Data Karyawan</DialogTitle>
                <DialogDescription>
                  Perbarui rincian informasi dan skema penggajian staff terpilih.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-1">
                  <Label htmlFor="edit-name" className="text-xs font-semibold">Nama Lengkap</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                 <div className="space-y-1">
                  <Label htmlFor="edit-role" className="text-xs font-semibold">Jabatan / Posisi</Label>
                  {jabatans.length === 0 ? (
                    <div className="text-xs text-muted-foreground py-2 border rounded px-3 bg-muted/20">
                      Belum ada data jabatan.
                    </div>
                  ) : (
                    <Select
                      value={formData.role}
                      onValueChange={(val) => setFormData({ ...formData, role: val })}
                    >
                      <SelectTrigger id="edit-role">
                        <SelectValue placeholder="Pilih Jabatan" />
                      </SelectTrigger>
                      <SelectContent>
                        {jabatans.map((j) => (
                          <SelectItem key={j.id} value={j.name}>
                            {j.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-phone" className="text-xs font-semibold">Nomor Telepon</Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-salaryType" className="text-xs font-semibold">Skema Gaji</Label>
                  <Select
                    value={formData.salaryType}
                    onValueChange={(val: any) => setFormData({ ...formData, salaryType: val })}
                  >
                    <SelectTrigger id="edit-salaryType">
                      <SelectValue placeholder="Pilih Skema Gaji" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMMISSION">Komisi / Bagi Hasil (Mekanik)</SelectItem>
                      <SelectItem value="DAILY">Gaji Harian tetap</SelectItem>
                      <SelectItem value="MONTHLY">Bulanan (Standard)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.salaryType === "DAILY" && (
                  <div className="space-y-1">
                    <Label htmlFor="edit-dailyRate" className="text-xs font-semibold">Rate Gaji Harian (IDR)</Label>
                    <Input
                      id="edit-dailyRate"
                      type="number"
                      value={formData.dailyRate}
                      onChange={(e) => setFormData({ ...formData, dailyRate: Number(e.target.value) })}
                    />
                  </div>
                )}
                {formData.salaryType === "COMMISSION" && (
                  <div className="space-y-1">
                    <Label htmlFor="edit-commissionRate" className="text-xs font-semibold">Rate Komisi % / Nominal (IDR)</Label>
                    <Input
                      id="edit-commissionRate"
                      type="number"
                      value={formData.commissionRate}
                      onChange={(e) => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
                    />
                  </div>
                )}
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
                  disabled={submitLoading}
                >
                  {submitLoading ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Toggle Status Confirmation Dialog */}
        <Dialog open={toggleStatusOpen} onOpenChange={setToggleStatusOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="font-bold flex items-center gap-2">
                {selectedEmployee?.isActive ? (
                  <span className="text-red-600 flex items-center gap-2">Nonaktifkan Karyawan</span>
                ) : (
                  <span className="text-green-600 flex items-center gap-2">Aktifkan Karyawan</span>
                )}
              </DialogTitle>
              <DialogDescription className="pt-2">
                {selectedEmployee?.isActive ? (
                  <>
                    Apakah Anda yakin ingin menonaktifkan <strong>{selectedEmployee?.name}</strong>?
                    <br />
                    Karyawan nonaktif tidak akan muncul di opsi penunjukan mekanik order, namun data riwayat dan keuangannya tetap tersimpan.
                  </>
                ) : (
                  <>
                    Apakah Anda yakin ingin mengaktifkan kembali <strong>{selectedEmployee?.name}</strong>?
                    <br />
                    Karyawan akan dapat bertugas kembali dan muncul di opsi formulir antrian servis.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setToggleStatusOpen(false);
                }}
              >
                {selectedEmployee?.isActive ? "Batal" : "Batalkan"}
              </Button>
              <Button
                type="button"
                className={selectedEmployee?.isActive ? "bg-red-600 text-white hover:bg-red-700" : "bg-green-600 text-white hover:bg-green-700"}
                disabled={submitLoading}
                onClick={handleToggleStatus}
              >
                {submitLoading
                  ? "Memproses..."
                  : selectedEmployee?.isActive
                  ? "Nonaktifkan"
                  : "Ya, Aktifkan!"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Employee Profile Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-black">Profil & Rincian Karyawan</DialogTitle>
              <DialogDescription>
                Detail performa, statistik keuangan, tugas aktif, antrian, dan riwayat gaji.
              </DialogDescription>
            </DialogHeader>

            {detailLoading ? (
              <div className="flex flex-col items-center justify-center p-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Memuat detail profil...</p>
              </div>
            ) : !detailedData ? (
              <div className="text-center py-10 text-muted-foreground">Gagal memuat rincian.</div>
            ) : (
              <div className="space-y-6 py-4">
                {/* Profile Card Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border/80">
                  <div className="flex gap-4 items-center">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground leading-tight">{detailedData.name}</h2>
                      <p className="text-sm text-muted-foreground font-semibold mt-0.5">{detailedData.role}</p>
                      {detailedData.phone && (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                          <Phone className="h-3.5 w-3.5" /> {detailedData.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col text-right shrink-0 md:items-end w-full md:w-auto">
                    <Badge variant={detailedData.isActive ? "default" : "outline"} className={detailedData.isActive ? "bg-green-500/10 text-green-600 border-green-500/20" : ""}>
                      {detailedData.isActive ? "Aktif Bekerja" : "Nonaktif"}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono mt-1">
                      Terdaftar: {new Date(detailedData.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>

                {/* Performance & Wages Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="border border-border bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total Pendapatan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold text-foreground">
                        {formatMoney(detailedData.stats.totalEarned)}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Komisi + gaji terkumpul
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border border-border bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Telah Dibayar</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold text-green-600">
                        {formatMoney(detailedData.stats.totalPaid)}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Gaji sudah ditransfer/cash
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border border-border bg-card border-t-2 border-t-destructive">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-destructive font-bold uppercase tracking-wider">Belum Dibayar (Liability)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold text-destructive">
                        {formatMoney(detailedData.stats.totalUnpaid)}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Sisa komisi/gaji terhutang
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border border-border bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Jumlah Tugas Selesai</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold text-foreground">
                        {detailedData.stats.taskCount} Order
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Total menangani servis
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Job / Order Status Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Active Job */}
                  <Card className="border border-border bg-card">
                    <CardHeader className="bg-muted/30 pb-3 border-b">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-primary" /> Tugas Berjalan Saat Ini
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {detailedData.activeOrder ? (
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-foreground">{detailedData.activeOrder.vehicle}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Plat: {detailedData.activeOrder.plateNumber || "-"}</p>
                            </div>
                            <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-500/20">
                              {detailedData.activeOrder.status === "IN_PROGRESS" ? "Dikerjakan" : "Selesai Servis (Ready)"}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded border">
                            <span className="font-semibold block">Pelanggan:</span>
                            {detailedData.activeOrder.custName}
                          </div>
                          <div className="flex justify-end text-[10px] text-muted-foreground pt-1">
                            Mulai: {new Date(detailedData.activeOrder.createdAt).toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground text-sm flex flex-col items-center justify-center">
                          <Clock className="h-8 w-8 text-muted-foreground/30 mb-2" />
                          Sedang Standby / Tidak menangani servis aktif
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Queued Jobs */}
                  <Card className="border border-border bg-card">
                    <CardHeader className="bg-muted/30 pb-3 border-b">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" /> Daftar Antrean Kerja ({detailedData.queueOrders?.length || 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {detailedData.queueOrders && detailedData.queueOrders.length > 0 ? (
                        <div className="space-y-2 max-h-[160px] overflow-y-auto divide-y divide-border/60">
                          {detailedData.queueOrders.map((q: any, idx: number) => (
                            <div key={q.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-foreground">{idx + 1}. {q.vehicle}</span>
                                <span className="text-muted-foreground block text-[10px]">Pelanggan: {q.custName}</span>
                              </div>
                              <Badge variant="outline" className="text-[9px] scale-90">
                                {q.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground text-sm flex flex-col items-center justify-center">
                          <CheckCircle2 className="h-8 w-8 text-green-500/30 mb-2" />
                          Tidak ada antrean tertunjuk untuk mekanik ini
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* History Section: Commissions & Slips */}
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-foreground uppercase border-b pb-2">Histori Komisi Terakhir (Maksimal 20)</h3>
                  {detailedData.orderFees && detailedData.orderFees.length > 0 ? (
                    <div className="overflow-x-auto border rounded-lg max-h-[220px] overflow-y-auto">
                      <Table>
                        <TableHeader className="bg-muted/60 sticky top-0 z-10">
                          <TableRow className="text-xs">
                            <TableHead className="font-bold h-9">Tanggal</TableHead>
                            <TableHead className="font-bold h-9">Order / Unit</TableHead>
                            <TableHead className="font-bold h-9">Keterangan</TableHead>
                            <TableHead className="font-bold h-9 text-right">Jumlah Komisi</TableHead>
                            <TableHead className="font-bold h-9 text-center">Pembayaran</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y text-xs">
                          {detailedData.orderFees.map((fee: any) => (
                            <TableRow key={fee.id} className="hover:bg-muted/10">
                              <TableCell className="py-2.5">
                                {new Date(fee.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                              </TableCell>
                              <TableCell className="font-medium py-2.5">
                                {fee.order ? (
                                  <div>
                                    <span className="font-bold">{fee.order.vehicle}</span>
                                    <span className="text-[10px] text-muted-foreground block font-mono">{fee.order.plateNumber || "-"}</span>
                                  </div>
                                ) : (
                                  <span>Order dihapus</span>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground py-2.5">{fee.description || "-"}</TableCell>
                              <TableCell className="text-right font-bold text-foreground py-2.5">
                                {formatMoney(Number(fee.amount))}
                              </TableCell>
                              <TableCell className="text-center py-2.5">
                                <Badge
                                  className={
                                    fee.isPaid
                                      ? "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20 scale-90"
                                      : "bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20 scale-90"
                                  }
                                >
                                  {fee.isPaid ? "Lunas" : "Belum Bayar"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-muted-foreground border rounded-lg bg-muted/10">
                      Belum ada histori bagi hasil komisi untuk mekanik ini
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-2">
                  <h3 className="font-bold text-sm text-foreground uppercase border-b pb-2">Histori Slip Gaji & Payroll (Maksimal 20)</h3>
                  {detailedData.payrolls && detailedData.payrolls.length > 0 ? (
                    <div className="overflow-x-auto border rounded-lg max-h-[200px] overflow-y-auto">
                      <Table>
                        <TableHeader className="bg-muted/60 sticky top-0 z-10">
                          <TableRow className="text-xs">
                            <TableHead className="font-bold h-9">ID Slip</TableHead>
                            <TableHead className="font-bold h-9">Periode Gaji</TableHead>
                            <TableHead className="font-bold h-9 text-right">Gaji Pokok</TableHead>
                            <TableHead className="font-bold h-9 text-right">Bonus</TableHead>
                            <TableHead className="font-bold h-9 text-right font-bold">Total Gaji</TableHead>
                            <TableHead className="font-bold h-9 text-center">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y text-xs">
                          {detailedData.payrolls.map((pr: any) => (
                            <TableRow key={pr.id} className="hover:bg-muted/10">
                              <TableCell className="font-mono py-2.5">
                                #{pr.id.slice(-6).toUpperCase()}
                              </TableCell>
                              <TableCell className="py-2.5">
                                {new Date(pr.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} - {new Date(pr.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                              </TableCell>
                              <TableCell className="text-right py-2.5">{formatMoney(Number(pr.baseSalary))}</TableCell>
                              <TableCell className="text-right text-green-600 font-medium py-2.5">
                                {Number(pr.bonus) > 0 ? `+${formatMoney(Number(pr.bonus))}` : "-"}
                              </TableCell>
                              <TableCell className="text-right font-bold text-foreground py-2.5">
                                {formatMoney(Number(pr.totalEarned))}
                              </TableCell>
                              <TableCell className="text-center py-2.5">
                                <Badge
                                  className={
                                    pr.status === "PAID"
                                      ? "bg-green-500/10 text-green-600 border-green-500/20 scale-90"
                                      : pr.status === "PARTIAL"
                                      ? "bg-blue-500/10 text-blue-600 border-blue-500/20 scale-90"
                                      : "bg-red-500/10 text-red-600 border-red-500/20 scale-90"
                                  }
                                >
                                  {pr.status === "PAID" ? "Lunas" : pr.status === "PARTIAL" ? "Parsial" : "Belum Bayar"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-muted-foreground border rounded-lg bg-muted/10">
                      Belum ada periode slip gaji yang digenerate untuk karyawan ini
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter className="border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDetailOpen(false);
                }}
              >
                Tutup Profil
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}
