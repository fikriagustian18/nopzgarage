// app/admin/employees/page.tsx - Karyawan Management
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RoleGuard } from "@/components/RoleGuard";
import {
  Users,
  DollarSign,
  Wrench,
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Briefcase,
  Loader2,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { getEmployees, reactivateEmployee, getEmployeeStats } from "@/app/actions/employees";
import { EmployeeDialog } from "@/components/EmployeeDialog";
import { EmployeeDeleteDialog } from "@/components/EmployeeDeleteDialog";
import { EmployeeDetailDialog } from "@/components/EmployeeDetailDialog";
import { Toaster } from "@/components/ui/Toaster";
import { toast } from "sonner";
import { 
  useNotification, 
  notifyEmployeeCreated, 
  notifyEmployeeUpdated, 
  notifyEmployeeDeleted 
} from "@/hooks/useNotification";
import { ExportButton } from "@/components/export/ExportButton";
import { exportEmployees } from "@/lib/export/reports/employeeExport";
import type { EmployeeExport } from "@/lib/export/types";

type Employee = {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  email?: string | null;
  address?: string | null;
  isActive: boolean;
  joinDate: Date | string;
  salaryType: "DAILY" | "COMMISSION";
  dailyRate: number | null;
  commissionRate: number | null;
  unpaidAmount?: number;
};

export default function EmployeesPage() {
  const router = useRouter();
  const { notify } = useNotification();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [dailyRecapDate, setDailyRecapDate] = useState<Date | undefined>(new Date());
  
  const [dailyRecapData, setDailyRecapData] = useState<any>(null);
  const [dailyRecapLoading, setDailyRecapLoading] = useState(false);
  const [dailyRecapOpen, setDailyRecapOpen] = useState(false);
  
  // Dashboard Stats State
  const [showUnpaidOnly, setShowUnpaidOnly] = useState(false);

  const [stats, setStats] = useState({
      totalUnpaid: 0,
      unpaidCount: 0,
      workingMechanics: 0,
      standbyMechanics: 0,
      totalMechanics: 0
  });

  // Dialog States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);

  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [employeeToReactivate, setEmployeeToReactivate] = useState<Employee | null>(null);

  const activeEmployees = employees.filter(e => e.isActive).length;

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch = employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          employee.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUnpaid = !showUnpaidOnly || (employee.unpaidAmount && employee.unpaidAmount > 0);
    return matchesSearch && matchesUnpaid;
  });

  const fetchEmployees = async () => {
    setLoading(true);
    const [empRes, statsRes] = await Promise.all([
        getEmployees(false),
        getEmployeeStats()
    ]);
    
    if (empRes.success && empRes.employees) {
      setEmployees(empRes.employees as unknown as Employee[]);
    }
    
    if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const openCreateDialog = () => {
    setDialogMode("create");
    setSelectedEmployee(null);
    setDialogOpen(true);
  };

  const openEditDialog = (employee: Employee) => {
    setDialogMode("edit");
    setSelectedEmployee(employee);
    setDialogOpen(true);
  };

  const openDeleteDialog = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
  };

  const openReactivateDialog = (employee: Employee) => {
    setEmployeeToReactivate(employee);
    setReactivateDialogOpen(true);
  };

  const openDetailDialog = (employeeId: string) => {
    setSelectedDetailId(employeeId);
    setDetailDialogOpen(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleReactivateConfirm = async () => {
    if (!employeeToReactivate) return;
    
    const res = await reactivateEmployee(employeeToReactivate.id);
    if (res.success) {
      notifyEmployeeUpdated(employeeToReactivate.name, employeeToReactivate.id); // Reusing updated for reactivation
      toast.success("Karyawan berhasil diaktifkan kembali");
      setReactivateDialogOpen(false);
      fetchEmployees();
    } else {
      toast.error(res.error || "Gagal mengaktifkan karyawan");
    }
  };
  
  // Helper for formatting money
  const formatMoney = (val: number) => 
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);


  return (
    <RoleGuard allowedRoles={["OWNER"]}>
      <div className="min-h-screen bg-background text-foreground">
        <Toaster />
      
      {/* Main Content */}
      <div className="p-4 md:p-8 space-y-6">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-foreground mb-2">
            Kelola Karyawan
          </h2>
          <p className="text-muted-foreground">
            Manajemen data karyawan, admin, dan mekanik beserta skema fee.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-t-4 border-t-primary bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Personil
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {employees.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {activeEmployees} aktif bekerja
              </p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-secondary bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Status Mekanik
              </CardTitle>
              <Wrench className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                 <div className="text-3xl font-bold text-foreground">{stats.totalMechanics}</div>
                 <span className="text-sm text-muted-foreground mb-1">Total</span>
              </div>
              <div className="flex gap-3 mt-2 text-xs">
                 <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                    <CheckCircle className="h-3 w-3" />
                    {stats.standbyMechanics} Standby
                 </span>
                 <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                    <RefreshCw className="h-3 w-3 animate-spin duration-3000" />
                    {stats.workingMechanics} Kerja
                 </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-chart-1 bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Komisi Belum Dibayar
              </CardTitle>
              <DollarSign className="h-4 w-4 text-chart-1" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-1 truncate">
                 {formatMoney(stats.totalUnpaid)}
              </div>
              <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    {stats.unpaidCount} tagihan pending
                  </p>
                  <Button 
                    variant="link" 
                    size="sm"
                    className={`h-auto p-0 text-xs font-bold ${showUnpaidOnly ? "text-primary underline" : "text-foreground"}`} 
                    onClick={() => setShowUnpaidOnly(!showUnpaidOnly)}
                  >
                    {showUnpaidOnly ? "Tampilkan Semua" : "Lihat Semua"}
                  </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan nama, jabatan..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
             <ExportButton
                title="Daftar_Karyawan"
                onExport={async (format, orientation) => {
                    const exportData: EmployeeExport[] = filteredEmployees.map(emp => ({
                        id: emp.id,
                        name: emp.name,
                        email: emp.email || "-",
                        phone: emp.phone || "-",
                        position: emp.role,
                        status: emp.isActive ? "Active" : "Inactive",
                        joinDate: emp.joinDate,
                        department: "-" // Add if available
                    }));
                    return await exportEmployees(exportData, format, orientation);
                }}
             />
             <Button className="gap-2 flex-1" onClick={openCreateDialog}>
               <Plus className="h-4 w-4" />
               Tambah Karyawan
             </Button>
          </div>
        </div>

        {/* Employees Grid */}
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {filteredEmployees.map((employee) => (
              <Card 
                key={employee.id} 
                className={`group hover:shadow-lg transition-all cursor-pointer border-t-4 ${employee.isActive ? 'border-t-primary' : 'border-t-muted'} bg-card`}
                onClick={() => openDetailDialog(employee.id)}
              >
                <CardContent className="p-3 md:p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 mb-3 md:mb-4">
                    <div className="flex items-center gap-2 md:gap-3 w-full overflow-hidden">
                      <Avatar className={`h-8 w-8 md:h-12 md:w-12 shrink-0 ${employee.isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        <AvatarFallback className="font-bold text-xs md:text-base">
                          {getInitials(employee.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm md:text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {employee.name}
                        </h3>
                        <p className="text-[10px] md:text-xs text-muted-foreground font-mono truncate">#{employee.id.slice(-4)}</p>
                      </div>
                    </div>
                    <Badge variant={employee.isActive ? "default" : "secondary"} className="text-[10px] md:text-xs px-1.5 py-0 h-5 md:h-6 shrink-0">
                      {employee.isActive ? "Aktif" : "Non"}
                    </Badge>
                  </div>

                  <div className="space-y-1 md:space-y-3 mb-3 md:mb-6 bg-muted/50 p-2 md:p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-xs md:text-sm text-foreground">
                      <Briefcase className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium truncate">{employee.role}</span>
                    </div>
                    {/* Hide Phone on mobile to save space, or keep simpler */}
                    <div className="hidden md:flex items-center gap-2 text-sm text-foreground">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{employee.phone || "-"}</span>
                    </div>
                    
                    {employee.salaryType === "COMMISSION" ? (
                       <div className="flex items-center gap-2 text-xs md:text-sm text-primary">
                         <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-primary shrink-0" />
                         <span className="truncate">Komisi: <b>{Number(employee.commissionRate)}%</b></span>
                       </div>
                    ) : (
                       <div className="flex items-center gap-2 text-xs md:text-sm text-chart-1">
                         <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-chart-1 shrink-0" />
                         <span className="truncate">Gaji: <b>{Number(employee.dailyRate).toLocaleString("id-ID")}</b></span>
                       </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 h-7 md:h-9 text-xs md:text-sm px-0 md:px-4" 
                        onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(employee);
                        }}
                    >
                      <Edit className="h-3 w-3 md:mr-1" />
                      <span className="hidden md:inline">Edit</span>
                    </Button>
                    {employee.isActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 md:h-9 px-2 md:px-3 text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                        onClick={(e) => {
                            e.stopPropagation();
                            openDeleteDialog(employee);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 md:h-9 px-2 md:px-3 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                        onClick={(e) => {
                            e.stopPropagation();
                            openReactivateDialog(employee);
                        }}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredEmployees.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/30">
            <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">Tidak ada karyawan yang ditemukan</p>
          </div>
        )}
      </div>

      {/* REACTIVATE CONFIRM DIALOG */}
      <Dialog open={reactivateDialogOpen} onOpenChange={setReactivateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
               <CheckCircle className="h-6 w-6" />
               Aktifkan Kembali?
            </DialogTitle>
            <DialogDescription>
               Apakah Anda yakin ingin mengaktifkan kembali karyawan <b>{employeeToReactivate?.name}</b>?
               <br/>
               Karyawan akan dapat menerima pekerjaan kembali.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
             <Button variant="outline" onClick={() => setReactivateDialogOpen(false)}>Batal</Button>
             <Button className="bg-green-600 hover:bg-green-700" onClick={handleReactivateConfirm}>
               Ya, Aktifkan
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Dialogs */}
      <EmployeeDetailDialog 
        open={detailDialogOpen} 
        onOpenChange={setDetailDialogOpen} 
        employeeId={selectedDetailId} 
      />

      <EmployeeDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        employee={selectedEmployee}
        onSuccess={fetchEmployees}
      />

      {employeeToDelete && (
        <EmployeeDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          employeeId={employeeToDelete.id}
          employeeName={employeeToDelete.name}
          onSuccess={fetchEmployees}
        />
      )}
    </div>
    </RoleGuard>
  );
}
