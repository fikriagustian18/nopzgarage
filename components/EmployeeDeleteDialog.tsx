"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { deactivateEmployee } from "@/app/actions/employees";
import { toast } from "@/hooks/useToast";
import { Loader2, AlertTriangle } from "lucide-react";
import { notifyEmployeeDeleted } from "@/hooks/useNotification";

type EmployeeDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  onSuccess?: () => void;
};

export function EmployeeDeleteDialog({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  onSuccess,
}: EmployeeDeleteDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const result = await deactivateEmployee(employeeId);
      
      if (result.success) {
        toast({
          title: "Karyawan Dinonaktifkan",
          description: `Data ${employeeName} berhasil dinonaktifkan.`,
        });
        
        // Add notification
        notifyEmployeeDeleted(employeeName, employeeId);
        
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
      toast({ variant: "destructive", title: "Error sistem" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="mx-auto bg-red-100 p-3 rounded-full mb-4 w-fit">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <DialogTitle className="text-center">Nonaktifkan Karyawan?</DialogTitle>
          <DialogDescription className="text-center">
            Anda yakin ingin menonaktifkan <b>{employeeName}</b>? 
            Karyawan ini tidak bisa dipilih lagi untuk pengerjaan order.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="sm:justify-center gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Nonaktifkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
