"use client";

import { useState, useEffect } from "react";
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
import { createEmployee, updateEmployee } from "@/lib/actions/employees";
import { toast } from "@/hooks/useToast";
import { Loader2, Briefcase, User, Phone, DollarSign } from "lucide-react";
import { notifyEmployeeCreated, notifyEmployeeUpdated } from "@/hooks/useNotification";

type EmployeeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  employee?: any; // Menggunakan any untuk fleksibilitas tipe dari server action
  onSuccess?: () => void;
};

export function EmployeeDialog({
  open,
  onOpenChange,
  mode,
  employee,
  onSuccess,
}: EmployeeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    role: "Mekanik",
    phone: "",
    salaryType: "COMMISSION",
    dailyRate: 0,
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
          commissionRate: Number(employee.commissionRate) || 0,
        });
      } else {
        // Reset form for create mode
        setFormData({
          name: "",
          role: "Mekanik",
          phone: "",
          salaryType: "COMMISSION",
          dailyRate: 0,
          commissionRate: 0,
        });
      }
    }
  }, [open, mode, employee]);

  const handleSubmit = async () => {
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
      let result;
      
      const payload = {
        name: formData.name,
        role: formData.role,
        phone: formData.phone,
        salaryType: formData.salaryType as "DAILY" | "COMMISSION",
        dailyRate: formData.dailyRate,
        commissionRate: formData.commissionRate,
      };

      if (mode === "create") {
         result = await createEmployee(payload);
      } else {
         result = await updateEmployee({
           id: employee.id,
           ...payload,
         });
      }

      if (result.success) {
        toast({
          title: mode === "create" ? "Karyawan Ditambahkan" : "Data Diperbarui",
          description: `Data ${formData.name} berhasil disimpan.`,
        });
        
        // Add notification
        if (mode === "create" && result.employee) {
          notifyEmployeeCreated(formData.name, result.employee.id);
        } else if (mode === "edit" && employee) {
          notifyEmployeeUpdated(formData.name, employee.id);
        }
        
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "Gagal",
          description: result.error,
        });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Terjadi kesalahan sistem" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              onValueChange={(v) => setFormData({ ...formData, salaryType: v, dailyRate: 0, commissionRate: 0 })}
            >
              <SelectTrigger>
                <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Tipe Gaji" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY">Gaji Harian (Fix)</SelectItem>
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
                 onChange={(e) => setFormData({ ...formData, dailyRate: parseFloat(e.target.value) || 0 })}
               />
               <p className="text-[10px] text-gray-500">Gaji tetap per kehadiran.</p>
             </div>
           )}

           {formData.salaryType === "COMMISSION" && (
             <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
               <Label>Rate Komisi (%)</Label>
               <div className="relative">
                 <Input
                   type="number"
                   placeholder="Contoh: 10" // 10%
                   value={formData.commissionRate}
                   onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || 0 })}
                   className="pr-8"
                 />
                 <span className="absolute right-3 top-2.5 text-gray-500 text-sm">%</span>
               </div>
               <p className="text-[10px] text-gray-500">Persentase fee administasi/mekanik dari total jasa.</p>
             </div>
           )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "create" ? "Simpan Karyawan" : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
