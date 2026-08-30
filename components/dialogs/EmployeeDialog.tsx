"use client";

import { useState, useEffect } from "react";
import { Loader2, Briefcase, User, Phone, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { toast } from "@/hooks/useToast";
import { notifyEmployeeCreated, notifyEmployeeUpdated } from "@/hooks/useNotification";
import { createEmployee, updateEmployee } from "@/lib/actions/employees";

interface EmployeeData {
  id: string;
  name: string;
  role: string;
  phone?: string | null;
  salaryType?: "DAILY" | "COMMISSION" | "MONTHLY" | string | null;
  dailyRate?: number | null;
  monthlyRate?: number | null;
  commissionRate?: number | null;
}

interface EmployeeFormState {
  name: string;
  role: string;
  phone: string;
  salaryType: string;
  dailyRate: number | string;
  monthlyRate: number | string;
  commissionRate: number | string;
}

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  employee?: EmployeeData | null;
  onSuccess?: () => void;
}

export function EmployeeDialog({
  open,
  onOpenChange,
  mode,
  employee,
  onSuccess,
}: EmployeeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EmployeeFormState>({
    name: "",
    role: "Mekanik",
    phone: "",
    salaryType: "COMMISSION",
    dailyRate: 0,
    monthlyRate: 0,
    commissionRate: 0,
  });

  useEffect(() => {
    if (open) {
      if (mode === "edit" && employee) {
        setFormData({
          name: employee.name || "",
          role: employee.role || "Mekanik",
          phone: employee.phone || "",
          salaryType: employee.salaryType || "COMMISSION",
          dailyRate: Number(employee.dailyRate) || 0,
          monthlyRate: Number(employee.monthlyRate) || 0,
          commissionRate: Number(employee.commissionRate) || 0,
        });
      } else {
        setFormData({
          name: "",
          role: "Mekanik",
          phone: "",
          salaryType: "COMMISSION",
          dailyRate: 0,
          monthlyRate: 0,
          commissionRate: 0,
        });
      }
    }
  }, [open, mode, employee]);

  async function handleSubmit() {
    if (!formData.name || !formData.role) {
      toast({
        variant: "destructive",
        title: "Data tidak lengkap",
        description: "Nama dan Jabatan wajib diisi.",
      });
      return;
    }

    setLoading(true);

    try {
      let result: any;
      
      const payload = {
        name: formData.name,
        role: formData.role,
        phone: formData.phone,
        salaryType: formData.salaryType as "DAILY" | "COMMISSION" | "MONTHLY",
        dailyRate: Number(formData.dailyRate) || 0,
        monthlyRate: Number(formData.monthlyRate) || 0,
        commissionRate: Number(formData.commissionRate) || 0,
      };

      if (mode === "create") {
        result = await createEmployee(payload);
      } else if (employee) {
        result = await updateEmployee({
          id: employee.id,
          ...payload,
        });
      }

      if (result && result.success) {
        toast({
          title: mode === "create" ? "Karyawan Ditambahkan" : "Data Diperbarui",
          description: `Data ${formData.name} berhasil disimpan.`,
        });
        
        if (mode === "create" && result.employee) {
          notifyEmployeeCreated(formData.name, result.employee.id);
        } else if (mode === "edit" && employee) {
          notifyEmployeeUpdated(formData.name, employee.id);
        }
        
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          variant: "destructive",
          title: "Gagal",
          description: result?.error || "Gagal menyimpan data",
        });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Terjadi kesalahan sistem" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Tambah Karyawan Baru" : "Edit Data Karyawan"}
          </DialogTitle>
          <DialogDescription>
            Isi data lengkap karyawan beserta skema gaji dan komisinya.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="name"
                placeholder="Nama Karyawan"
                className="pl-9"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Jabatan / Role</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData({ ...formData, role: v })}
              >
                <SelectTrigger>
                  <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Pilih Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Mekanik">Mekanik</SelectItem>
                  <SelectItem value="Owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">No. Telepon</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  placeholder="08..."
                  className="pl-9"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2 border-t pt-4">
            <Label>Skema Gaji</Label>
            <Select
              value={formData.salaryType}
              onValueChange={(v) => setFormData({ ...formData, salaryType: v })}
            >
              <SelectTrigger>
                <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Tipe Gaji" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY">Gaji Harian (Fix)</SelectItem>
                <SelectItem value="MONTHLY">Gaji Bulanan (Fix)</SelectItem>
                <SelectItem value="COMMISSION">Komisi (Persentase/Borongan)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic Rate Inputs */}
          {formData.salaryType === "DAILY" && (
            <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
              <Label>Rate Harian (Rp)</Label>
              <Input
                type="number"
                placeholder="Contoh: 150000"
                value={formData.dailyRate}
                onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
              />
              <p className="text-[10px] text-gray-500">Gaji tetap per kehadiran.</p>
            </div>
          )}

          {formData.salaryType === "MONTHLY" && (
            <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
              <Label>Rate Bulanan (Rp)</Label>
              <Input
                type="number"
                placeholder="Contoh: 2500000"
                value={formData.monthlyRate}
                onChange={(e) => setFormData({ ...formData, monthlyRate: e.target.value })}
              />
              <p className="text-[10px] text-gray-500">Gaji pokok tetap per periode bulanan.</p>
            </div>
          )}

          {formData.salaryType === "COMMISSION" && (
            <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
              <Label>Rate Komisi (%)</Label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="Contoh: 25"
                  min="0"
                  max="100"
                  value={formData.commissionRate}
                  onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                  className="pr-8"
                />
                <span className="absolute right-3 top-2.5 text-gray-500 text-sm">%</span>
              </div>
              <p className="text-[10px] text-gray-500">Persentase fee mekanik dari total subtotal jasa (0-100%).</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "create" ? "Simpan Karyawan" : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
