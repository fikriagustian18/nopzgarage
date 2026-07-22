// components/DeleteConfirmDialog.tsx
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
import { deleteOrder } from "@/app/actions/orders";
import { toast } from "@/hooks/useToast";
import { Loader2, AlertTriangle } from "lucide-react";
import { notifyOrderDeleted } from "@/hooks/useNotification";

type DeleteConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderInfo: {
    custName: string;
    vehicle: string;
  };
  onSuccess?: () => void;
};

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  orderId,
  orderInfo,
  onSuccess,
}: DeleteConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);

    try {
      const result = await deleteOrder(orderId);

      if (result.success) {
        toast({
          title: "✅ Berhasil Dihapus!",
          description: "Order telah berhasil dihapus dari sistem",
        });
        
        // Add notification
        notifyOrderDeleted(orderInfo.custName, orderId);
        
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "❌ Gagal Menghapus",
          description: result.error || "Terjadi kesalahan saat menghapus order",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: "Terjadi kesalahan pada sistem",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                Hapus Order?
              </DialogTitle>
              <DialogDescription className="mt-1">
                Tindakan ini tidak dapat dibatalkan
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-600">
            Anda akan menghapus order berikut:
          </p>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Pelanggan:</span>
              <span className="text-sm font-bold text-gray-900">{orderInfo.custName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Kendaraan:</span>
              <span className="text-sm font-bold text-gray-900">{orderInfo.vehicle}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Order ID:</span>
              <span className="text-sm font-mono text-gray-700">{orderId.slice(-8)}</span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800 font-medium">
              ⚠️ Data yang dihapus tidak dapat dikembalikan!
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Ya, Hapus Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
