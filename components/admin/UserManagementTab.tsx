// components/UserManagementTab.tsx
"use client";

import { useState, useEffect } from "react";
import { getUsers, createUser, updateUser, resetUserPassword, deleteUser } from "@/lib/actions/auth";
import { getEmployees } from "@/lib/actions/employees";
import type { SalaryType } from "@prisma/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
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
import { toast } from "sonner";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Key, 
  Loader2, 
  User, 
  Search, 
  RotateCcw, 
  Eye, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface ManagedUser {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  employeeId: string | null;
  employee?: {
    id: string;
    name: string;
    role: string;
    phone?: string | null;
    salaryType?: SalaryType | string | null;
    dailyRate?: number | null;
    monthlyRate?: number | null;
    commissionRate?: number | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export function UserManagementTab() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "EMPLOYEE" as "OWNER" | "ADMIN" | "EMPLOYEE",
    employeeId: "",
    name: "",
    phone: "",
    salaryType: "COMMISSION" as SalaryType,
    dailyRate: 0,
    monthlyRate: 0,
    commissionRate: 0,
    isActive: true,
  });

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [usersRes, employeesRes] = await Promise.all([
      getUsers(),
      getEmployees(true)
    ]);

    if (usersRes.success && usersRes.users) {
      setUsers(usersRes.users as any);
    }
    if (employeesRes.success && employeesRes.employees) {
      setEmployees(employeesRes.employees);
    }
    setLoading(false);
  }

  async function handleCreateUser() {
    if (!formData.email || !formData.password) {
      toast.error("Email dan password harus diisi");
      return;
    }
    try {
      const res = await createUser({
        ...formData,
        dailyRate: Number(formData.dailyRate) || 0,
        monthlyRate: Number(formData.monthlyRate) || 0,
        commissionRate: Number(formData.commissionRate) || 0,
      });
      if (res.success) {
        toast.success("User berhasil dibuat");
        setCreateDialogOpen(false);
        // Reset form
        setFormData({
          email: "",
          password: "",
          role: "EMPLOYEE",
          employeeId: "",
          name: "",
          phone: "",
          salaryType: "COMMISSION",
          dailyRate: 0,
          monthlyRate: 0,
          commissionRate: 0,
          isActive: true,
        });
        loadData();
      } else {
        toast.error(res.error || "Gagal membuat user");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan");
    }
  }

  async function handleUpdateUser() {
    if (!selectedUser) {
      return;
    }
    try {
      const res = await updateUser({
        id: selectedUser.id,
        email: formData.email,
        role: formData.role,
        name: formData.name,
        phone: formData.phone,
        salaryType: formData.salaryType,
        dailyRate: Number(formData.dailyRate) || 0,
        monthlyRate: Number(formData.monthlyRate) || 0,
        commissionRate: Number(formData.commissionRate) || 0,
      });
      if (res.success) {
        toast.success("User berhasil diperbarui");
        setEditDialogOpen(false);
        loadData();
      } else {
        toast.error(res.error || "Gagal memperbarui user");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan");
    }
  }

  async function handleResetPassword() {
    if (!selectedUser) {
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }
    try {
      const res = await resetUserPassword(selectedUser.id, newPassword);
      if (res.success) {
        toast.success("Password berhasil di-reset");
        setResetPasswordDialogOpen(false);
      } else {
        toast.error(res.error || "Gagal reset password");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan");
    }
  }

  async function handleDeleteUser() {
    if (!selectedUser) {
      return;
    }
    try {
      const res = await deleteUser(selectedUser.id);
      if (res.success) {
        toast.success("User berhasil dihapus");
        setDeleteDialogOpen(false);
        loadData();
      } else {
        toast.error(res.error || "Gagal menghapus user");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan");
    }
  }

  async function handleToggleStatus() {
    if (!selectedUser) {
      return;
    }
    try {
      const res = await updateUser({
        id: selectedUser.id,
        isActive: !selectedUser.isActive
      });
      if (res.success) {
        toast.success(`User berhasil ${selectedUser.isActive ? "dinonaktifkan" : "diaktifkan"}`);
        setStatusDialogOpen(false);
        loadData();
      } else {
        toast.error(res.error || "Gagal mengubah status");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan");
    }
  }

  function openEditDialog(user: ManagedUser) {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: "",
      role: user.role as any,
      employeeId: user.employeeId || "",
      name: user.employee?.name || "",
      phone: user.employee?.phone || "",
      salaryType: (user.employee?.salaryType as any) || "COMMISSION",
      dailyRate: Number(user.employee?.dailyRate) || 0,
      monthlyRate: Number(user.employee?.monthlyRate) || 0,
      commissionRate: Number(user.employee?.commissionRate) || 0,
      isActive: user.isActive,
    });
    setEditDialogOpen(true);
  }

  function openViewDialog(user: ManagedUser) {
    setSelectedUser(user);
    setViewDialogOpen(true);
  }

  function openResetPasswordDialog(user: ManagedUser) {
    setSelectedUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setResetPasswordDialogOpen(true);
  }

  function openDeleteDialog(user: ManagedUser) {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  }

  function openStatusToggleDialog(user: ManagedUser) {
    setSelectedUser(user);
    setStatusDialogOpen(true);
  }

  function getRoleLabel(role: string) {
    switch (role) {
      case "OWNER":
        return "Owner";
      case "ADMIN":
        return "Administrator";
      case "EMPLOYEE":
        return "Mekanik";
      default:
        return role;
    }
  }

  function getRoleBadgeStyle(role: string) {
    switch (role) {
      case "OWNER":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 border-purple-200";
      case "ADMIN":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border-blue-200";
      case "EMPLOYEE":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border-amber-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  }

  function handleResetFilters() {
    setSearchQuery("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
  }

  function getSalaryTypeLabel(salaryType?: string | null) {
    switch (salaryType) {
      case "MONTHLY":
        return "Gaji Bulanan";
      case "DAILY":
        return "Gaji Harian";
      case "COMMISSION":
        return "Komisi";
      default:
        return "-";
    }
  }

  // Filtered logic
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = u.employee?.name?.toLowerCase().includes(q) || false;
    const emailMatch = u.email.toLowerCase().includes(q);
    const usernameMatch = u.email.split("@")[0].toLowerCase().includes(q);
    const matchesSearch = !searchQuery || nameMatch || emailMatch || usernameMatch;

    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;

    const matchesStatus = statusFilter === "ALL" || 
      (statusFilter === "ACTIVE" && u.isActive) ||
      (statusFilter === "INACTIVE" && !u.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* BREADCRUMBS & TITLE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="text-xs font-semibold text-muted-foreground mb-1 tracking-wide uppercase">
            Beranda &gt; Pengguna
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">Manajemen Pengguna</h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Kelola data pengguna, peran, skema gaji (Harian, Bulanan, Komisi), dan rate komisi.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2 font-bold h-11 px-5 rounded-xl shadow-lg shadow-primary/10">
          <Plus className="h-4 w-4" />
          <span>Tambah Pengguna</span>
        </Button>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col md:flex-row gap-3 bg-card p-4 rounded-xl border border-border shadow-sm">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, email, atau username..."
            className="pl-9 h-11 bg-background/50 border-input"
          />
        </div>

        {/* Role Filter */}
        <div className="w-full md:w-[180px]">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Semua Peran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Peran</SelectItem>
              <SelectItem value="OWNER">Owner</SelectItem>
              <SelectItem value="ADMIN">Administrator</SelectItem>
              <SelectItem value="EMPLOYEE">Mekanik</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-[180px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Status Aktif" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value="ACTIVE">Status Aktif</SelectItem>
              <SelectItem value="INACTIVE">Status Nonaktif</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reset Filter Button */}
        <Button
          variant="outline"
          onClick={handleResetFilters}
          className="gap-2 h-11 px-4 border-border rounded-xl"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reset</span>
        </Button>
      </div>

      {/* USERS TABLE */}
      <Card className="border border-border shadow-sm rounded-2xl overflow-hidden bg-card">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-muted/40 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                <th className="p-4 pl-5">No.</th>
                <th className="p-4">Nama Lengkap</th>
                <th className="p-4">Username</th>
                <th className="p-4">Email</th>
                <th className="p-4 text-center">Skema Gaji</th>
                <th className="p-4 text-center">Rate / Fee</th>
                <th className="p-4 text-center">Peran</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4">Terakhir Aktif</th>
                <th className="p-4 pr-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user, idx) => {
                const username = user.email.split("@")[0];
                return (
                  <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                    {/* No */}
                    <td className="p-4 pl-5 font-semibold text-muted-foreground">{idx + 1}</td>

                    {/* Nama Lengkap */}
                    <td className="p-4 font-bold text-foreground">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <User className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <span>{user.employee?.name || getRoleLabel(user.role)}</span>
                          {user.employee?.phone && (
                            <p className="text-[10px] text-muted-foreground font-normal">{user.employee.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Username */}
                    <td className="p-4 text-muted-foreground font-mono">{username}</td>

                    {/* Email */}
                    <td className="p-4 text-muted-foreground font-mono">{user.email}</td>

                    {/* Skema Gaji */}
                    <td className="p-4 text-center">
                      {user.employee ? (
                        <Badge variant="outline" className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted">
                          {getSalaryTypeLabel(user.employee.salaryType)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>

                    {/* Rate / Fee */}
                    <td className="p-4 text-center font-semibold">
                      {user.employee ? (
                        (user.employee.salaryType as string) === "COMMISSION" ? (
                          <span className="text-primary font-mono font-bold">
                            {Number(user.employee.commissionRate || 0)}%
                          </span>
                        ) : (user.employee.salaryType as string) === "MONTHLY" ? (
                          <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                            Rp {Number(user.employee.monthlyRate || 0).toLocaleString("id-ID")} <span className="text-[10px] font-normal text-muted-foreground">/ bln</span>
                          </span>
                        ) : (
                          <span className="text-chart-1 font-mono">
                            Rp {Number(user.employee.dailyRate || 0).toLocaleString("id-ID")} <span className="text-[10px] font-normal text-muted-foreground">/ hr</span>
                          </span>
                        )
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>

                    {/* Peran */}
                    <td className="p-4 text-center">
                      <Badge variant="outline" className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${getRoleBadgeStyle(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </td>

                    {/* Status */}
                    <td className="p-4 text-center">
                      <span 
                        onClick={() => openStatusToggleDialog(user)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                          user.isActive 
                            ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" 
                            : "bg-slate-500/10 text-slate-600 hover:bg-slate-500/20"
                        }`}
                      >
                        {user.isActive ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        <span>{user.isActive ? "Aktif" : "Nonaktif"}</span>
                      </span>
                    </td>

                    {/* Terakhir Aktif */}
                    <td className="p-4 text-muted-foreground">
                      {format(new Date(user.updatedAt || user.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}
                    </td>

                    {/* Aksi */}
                    <td className="p-4 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-primary rounded-lg"
                          onClick={() => openViewDialog(user)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-primary rounded-lg"
                          onClick={() => openEditDialog(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive rounded-lg"
                          onClick={() => openDeleteDialog(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-muted-foreground">
                    <ShieldAlert className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
                    <span>Tidak ditemukan user yang cocok.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION PANEL */}
        <div className="p-4 border-t border-border flex justify-end bg-muted/10">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 rounded"
              disabled
            >
              &lt;
            </Button>
            <span className="h-7 w-7 flex items-center justify-center bg-primary text-primary-foreground font-black rounded">1</span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 rounded"
              disabled
            >
              &gt;
            </Button>
          </div>
        </div>
      </Card>

      {/* View User Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md max-h-[90vh] flex flex-col p-6">
          <DialogHeader>
            <DialogTitle>Detail Pengguna</DialogTitle>
            <DialogDescription>
              Rincian informasi akun pengguna dan skema gaji
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-xs leading-relaxed flex-1 overflow-y-auto pr-1">
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold text-muted-foreground">Nama Lengkap</span>
              <span className="font-bold text-foreground">{selectedUser?.employee?.name || getRoleLabel(selectedUser?.role || "")}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold text-muted-foreground">Username</span>
              <span className="font-bold text-foreground">{selectedUser?.email.split("@")[0]}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold text-muted-foreground">Email</span>
              <span className="font-bold text-foreground">{selectedUser?.email}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold text-muted-foreground">No. Telepon</span>
              <span className="font-bold text-foreground">{selectedUser?.employee?.phone || "-"}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold text-muted-foreground">Role / Hak Akses</span>
              <span className="font-bold text-foreground">{getRoleLabel(selectedUser?.role || "")}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold text-muted-foreground">Skema Gaji</span>
              <span className="font-bold text-foreground">
                {selectedUser?.employee ? getSalaryTypeLabel(selectedUser.employee.salaryType) : "-"}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold text-muted-foreground">Rate Komisi / Nominal Gaji</span>
              <span className="font-bold text-foreground">
                {selectedUser?.employee ? (
                  (selectedUser.employee.salaryType as string) === "COMMISSION"
                    ? `${Number(selectedUser.employee.commissionRate || 0)}%`
                    : (selectedUser.employee.salaryType as string) === "MONTHLY"
                    ? `Rp ${Number(selectedUser.employee.monthlyRate || 0).toLocaleString("id-ID")} / bulan`
                    : `Rp ${Number(selectedUser.employee.dailyRate || 0).toLocaleString("id-ID")} / hari`
                ) : "-"}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold text-muted-foreground">Status Akun</span>
              <span className={`font-bold ${selectedUser?.isActive ? "text-green-600" : "text-slate-500"}`}>
                {selectedUser?.isActive ? "Aktif" : "Nonaktif"}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold text-muted-foreground">Dibuat Pada</span>
              <span className="font-medium text-foreground">
                {selectedUser?.createdAt ? format(new Date(selectedUser.createdAt), "dd MMMM yyyy, HH:mm", { locale: id }) : "-"}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setViewDialogOpen(false)} className="rounded-xl">Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md max-h-[90vh] flex flex-col p-6">
          <DialogHeader>
            <DialogTitle>Tambah User Baru</DialogTitle>
            <DialogDescription>
              Buat akun user baru untuk akses sistem beserta profil karyawan &amp; skema gajinya
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-xs flex-1 overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label htmlFor="email">Email (Username)</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 6 karakter"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: any) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWNER">Owner</SelectItem>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                  <SelectItem value="EMPLOYEE">Mekanik</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee">Link ke Karyawan (Opsional)</Label>
              <Select
                value={formData.employeeId || "none"}
                onValueChange={(value) => setFormData({ ...formData, employeeId: value === "none" ? "" : value })}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Pilih karyawan..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada (Buat Profil Baru)</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} - {emp.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {!formData.employeeId && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input
                    id="name"
                    placeholder="Nama Pengguna Baru"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">No. WhatsApp/HP</Label>
                  <Input
                    id="phone"
                    placeholder="08xxxxxxxxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="h-11 rounded-xl"
                  />
                </div>
              </>
            )}

            {/* Skema Gaji & Rate */}
            <div className="space-y-3 pt-3 border-t">
              <div className="space-y-2">
                <Label>Skema Gaji</Label>
                <Select
                  value={formData.salaryType}
                  onValueChange={(v) => setFormData({ ...formData, salaryType: v as SalaryType })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Pilih Tipe Gaji" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMMISSION">Komisi (Persentase/Borongan)</SelectItem>
                    <SelectItem value="DAILY">Gaji Harian (Fix)</SelectItem>
                    <SelectItem value="MONTHLY">Gaji Bulanan (Fix)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.salaryType === "COMMISSION" && (
                <div className="space-y-2">
                  <Label htmlFor="commissionRate">Rate Komisi (%)</Label>
                  <Input
                    id="commissionRate"
                    type="number"
                    placeholder="Contoh: 10"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value as any })}
                    className="h-11 rounded-xl"
                  />
                </div>
              )}

              {formData.salaryType === "DAILY" && (
                <div className="space-y-2">
                  <Label htmlFor="dailyRate">Rate Gaji Harian (Rp)</Label>
                  <Input
                    id="dailyRate"
                    type="number"
                    placeholder="Contoh: 150000"
                    value={formData.dailyRate}
                    onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value as any })}
                    className="h-11 rounded-xl"
                  />
                </div>
              )}

              {formData.salaryType === "MONTHLY" && (
                <div className="space-y-2">
                  <Label htmlFor="monthlyRate">Rate Gaji Bulanan (Rp)</Label>
                  <Input
                    id="monthlyRate"
                    type="number"
                    placeholder="Contoh: 3000000"
                    value={formData.monthlyRate}
                    onChange={(e) => setFormData({ ...formData, monthlyRate: e.target.value as any })}
                    className="h-11 rounded-xl"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status Awal</Label>
              <Select
                value={formData.isActive ? "active" : "inactive"}
                onValueChange={(value) => setFormData({ ...formData, isActive: value === "active" })}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              className="rounded-xl"
            >
              Batal
            </Button>
            <Button onClick={handleCreateUser} className="rounded-xl">Buat User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md max-h-[90vh] flex flex-col p-6">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update informasi user &amp; skema gajinya
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-xs flex-1 overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email (Username)</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nama Lengkap</Label>
              <Input
                id="edit-name"
                placeholder="Nama Pengguna"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">No. WhatsApp/HP</Label>
              <Input
                id="edit-phone"
                placeholder="08xxxxxxxxxx"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role / Hak Akses</Label>
              <Select
                value={formData.role}
                onValueChange={(value: any) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWNER">Owner</SelectItem>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                  <SelectItem value="EMPLOYEE">Mekanik</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Skema Gaji & Rate Edit */}
            <div className="space-y-3 pt-3 border-t">
              <div className="space-y-2">
                <Label>Skema Gaji</Label>
                <Select
                  value={formData.salaryType}
                  onValueChange={(v) => setFormData({ ...formData, salaryType: v as SalaryType })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Pilih Tipe Gaji" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMMISSION">Komisi (Persentase/Borongan)</SelectItem>
                    <SelectItem value="DAILY">Gaji Harian (Fix)</SelectItem>
                    <SelectItem value="MONTHLY">Gaji Bulanan (Fix)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.salaryType === "COMMISSION" && (
                <div className="space-y-2">
                  <Label htmlFor="edit-commissionRate">Rate Komisi (%)</Label>
                  <Input
                    id="edit-commissionRate"
                    type="number"
                    placeholder="Contoh: 10"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value as any })}
                    className="h-11 rounded-xl"
                  />
                </div>
              )}

              {formData.salaryType === "DAILY" && (
                <div className="space-y-2">
                  <Label htmlFor="edit-dailyRate">Rate Gaji Harian (Rp)</Label>
                  <Input
                    id="edit-dailyRate"
                    type="number"
                    placeholder="Contoh: 150000"
                    value={formData.dailyRate}
                    onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value as any })}
                    className="h-11 rounded-xl"
                  />
                </div>
              )}

              {formData.salaryType === "MONTHLY" && (
                <div className="space-y-2">
                  <Label htmlFor="edit-monthlyRate">Rate Gaji Bulanan (Rp)</Label>
                  <Input
                    id="edit-monthlyRate"
                    type="number"
                    placeholder="Contoh: 3000000"
                    value={formData.monthlyRate}
                    onChange={(e) => setFormData({ ...formData, monthlyRate: e.target.value as any })}
                    className="h-11 rounded-xl"
                  />
                </div>
              )}
            </div>

            {/* Quick Link to Reset Password */}
            <div className="pt-2 border-t mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                type="button" 
                className="w-full gap-2 text-xs h-10 rounded-xl"
                onClick={() => {
                  setEditDialogOpen(false);
                  if (selectedUser) openResetPasswordDialog(selectedUser);
                }}
              >
                <Key className="h-3.5 w-3.5 text-primary" />
                <span>Reset Password Akun Ini</span>
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="rounded-xl"
            >
              Batal
            </Button>
            <Button onClick={handleUpdateUser} className="rounded-xl">Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Buat password baru untuk user {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-xs">
            <div className="space-y-2">
              <Label htmlFor="new-password">Password Baru</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Minimal 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Konfirmasi Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Ketik ulang password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetPasswordDialogOpen(false)}
              className="rounded-xl"
            >
              Batal
            </Button>
            <Button onClick={handleResetPassword} className="rounded-xl">Reset Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus User</DialogTitle>
            <DialogDescription className="text-xs">
              Apakah Anda yakin ingin menghapus user <strong>{selectedUser?.email}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="rounded-xl"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              className="rounded-xl"
            >
              Hapus User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toggle Status User Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Konfirmasi Perubahan Status</DialogTitle>
            <DialogDescription className="text-xs">
              Apakah Anda yakin ingin <strong>{selectedUser?.isActive ? "menonaktifkan" : "mengaktifkan"}</strong> user <strong>{selectedUser?.email}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusDialogOpen(false)}
              className="rounded-xl"
            >
              Batal
            </Button>
            <Button 
              variant={selectedUser?.isActive ? "destructive" : "default"} 
              onClick={handleToggleStatus}
              className="rounded-xl"
            >
              Ya, Ubah Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
