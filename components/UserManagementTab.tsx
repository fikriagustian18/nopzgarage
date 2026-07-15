// components/UserManagementTab.tsx - User Management Component
"use client";

import { useState, useEffect } from "react";
import { getUsers, createUser, updateUser, resetUserPassword, deleteUser } from "@/app/actions/auth";
import { getEmployees } from "@/app/actions/employees";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Key, Loader2, Mail, Shield, User } from "lucide-react";

type UserType = {
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
  } | null;
  createdAt: Date;
};

export function UserManagementTab() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "EMPLOYEE" as "OWNER" | "ADMIN" | "EMPLOYEE",
    employeeId: "",
    name: "",
    phone: "",
    isActive: true,
  });
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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
  };

  const handleCreateUser = async () => {
    if (!formData.email || !formData.password) {
      toast.error("Email dan password harus diisi");
      return;
    }

    const result = await createUser(formData);
    
    if (result.success) {
      toast.success("User berhasil dibuat");
      setCreateDialogOpen(false);
      setFormData({ email: "", password: "", role: "EMPLOYEE", employeeId: "", name: "", phone: "", isActive: true });
      loadData();
    } else {
      toast.error(result.error || "Gagal membuat user");
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    const result = await updateUser({
      id: selectedUser.id,
      email: formData.email,
      role: formData.role,
      name: formData.name,
      phone: formData.phone,
    });

    if (result.success) {
      toast.success("User berhasil diupdate");
      setEditDialogOpen(false);
      loadData();
    } else {
      toast.error(result.error || "Gagal update user");
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) return;

    const result = await updateUser({
      id: selectedUser.id,
      isActive: !selectedUser.isActive,
    });

    if (result.success) {
      toast.success(`Status user berhasil ${!selectedUser.isActive ? "diaktifkan" : "dinonaktifkan"}`);
      setStatusDialogOpen(false);
      loadData();
    } else {
      toast.error(result.error || "Gagal mengubah status user");
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    
    if (newPassword !== confirmPassword) {
      toast.error("Password tidak cocok");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    const result = await resetUserPassword(selectedUser.id, newPassword);

    if (result.success) {
      toast.success("Password berhasil direset");
      setResetPasswordDialogOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } else {
      toast.error(result.error || "Gagal reset password");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    const result = await deleteUser(selectedUser.id);

    if (result.success) {
      toast.success("User berhasil dihapus");
      setDeleteDialogOpen(false);
      loadData();
    } else {
      toast.error(result.error || "Gagal hapus user");
    }
  };

  const openEditDialog = (user: UserType) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: "",
      role: user.role as any,
      employeeId: user.employeeId || "",
      name: user.employee?.name || "",
      phone: user.employee?.phone || "",
      isActive: user.isActive,
    });
    setEditDialogOpen(true);
  };

  const openResetPasswordDialog = (user: UserType) => {
    setSelectedUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setResetPasswordDialogOpen(true);
  };

  const openDeleteDialog = (user: UserType) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const openStatusToggleDialog = (user: UserType) => {
    setSelectedUser(user);
    setStatusDialogOpen(true);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "OWNER":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "ADMIN":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "EMPLOYEE":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Manajemen User & Akses
              </CardTitle>
              <CardDescription>
                Kelola akun user, email, password, dan role akses sistem
              </CardDescription>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.email}</p>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                      {!user.isActive && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    {user.employee && (
                      <div className="text-sm text-muted-foreground mt-0.5">
                        <p className="font-medium text-foreground/80">{user.employee.name} - {user.employee.role}</p>
                        {user.employee.phone && <p className="text-xs font-mono text-muted-foreground">WA: {user.employee.phone}</p>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={user.isActive ? "text-amber-600 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20" : "text-emerald-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"}
                    onClick={() => openStatusToggleDialog(user)}
                  >
                    {user.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(user)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openResetPasswordDialog(user)}
                  >
                    <Key className="h-3 w-3 mr-1" />
                    Reset Password
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => openDeleteDialog(user)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Shield className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">Belum ada user terdaftar</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah User Baru</DialogTitle>
            <DialogDescription>
              Buat akun user baru untuk akses sistem
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email (Username)</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: any) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWNER">Owner</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee">Link ke Karyawan (Opsional)</Label>
              <Select
                value={formData.employeeId || "none"}
                onValueChange={(value) => setFormData({ ...formData, employeeId: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih karyawan..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada (Buat Profil Karyawan Baru)</SelectItem>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">No. WhatsApp/HP</Label>
                  <Input
                    id="phone"
                    placeholder="08xxxxxxxxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="status">Status Awal</Label>
              <Select
                value={formData.isActive ? "active" : "inactive"}
                onValueChange={(value) => setFormData({ ...formData, isActive: value === "active" })}
              >
                <SelectTrigger>
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
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleCreateUser}>Buat User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update informasi user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email (Username)</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nama Lengkap</Label>
              <Input
                id="edit-name"
                placeholder="Nama Pengguna"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">No. WhatsApp/HP</Label>
              <Input
                id="edit-phone"
                placeholder="08xxxxxxxxxx"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role / Hak Akses</Label>
              <Select
                value={formData.role}
                onValueChange={(value: any) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWNER">Owner</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdateUser}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Buat password baru untuk user {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Password Baru</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Minimal 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleResetPassword}>Reset Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus User</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus user <strong>{selectedUser?.email}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Hapus User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toggle Status User Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Perubahan Status</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin <strong>{selectedUser?.isActive ? "menonaktifkan" : "mengaktifkan"}</strong> user <strong>{selectedUser?.email}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Batal
            </Button>
            <Button 
              variant={selectedUser?.isActive ? "destructive" : "default"} 
              onClick={handleToggleStatus}
            >
              Ya, {selectedUser?.isActive ? "Ubah Status" : "Ubah Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
