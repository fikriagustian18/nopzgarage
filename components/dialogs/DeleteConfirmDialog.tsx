// components/dialogs/DeleteConfirmDialog.tsx — Cancel Booking Confirmation
"use client";

import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

import { cancelOrder } from "@/lib/actions/orders";
import { toast } from "@/hooks/useToast";
import { notifyOrderCancelled } from "@/hooks/useNotification";

interface CancelConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderInfo: {
    custName: string;
    vehicle: string;
  };
  onSuccess?: () => void;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  orderId,
  orderInfo,
  onSuccess,
}: CancelConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    setLoading(true);

    try {
      const result = await cancelOrder(orderId);

      if (result.success) {
        toast({
          title: "✅ Booking Dibatalkan!",
          description: "Booking telah berhasil dibatalkan",
        });
        
        // Add notification
        notifyOrderCancelled(orderInfo.custName, orderId);
        
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          variant: "destructive",
          title: "❌ Gagal Membatalkan",
          description: result.error || "Terjadi kesalahan saat membatalkan booking",
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
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-rose-100 dark:bg-rose-950/40 rounded-full">
              <AlertCircle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                Batalkan Booking?
              </DialogTitle>
              <DialogDescription className="mt-1">
                Status booking akan diubah menjadi Dibatalkan.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Anda akan membatalkan booking berikut:
          </p>
          
          <div className="bg-muted/50 border border-border/60 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Pelanggan:</span>
              <span className="text-sm font-bold text-foreground">{orderInfo.custName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Kendaraan:</span>
              <span className="text-sm font-bold text-foreground">{orderInfo.vehicle}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Order ID:</span>
              <span className="text-sm font-mono text-foreground font-semibold">{`ORD-${orderId.slice(-6).toUpperCase()}`}</span>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-lg p-3">
            <p className="text-sm text-amber-800 dark:text-amber-400 font-medium">
              ⚠️ Status order akan berubah menjadi <strong>CANCELLED</strong> (Dibatalkan).
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
            onClick={handleCancel}
            disabled={loading}
            className="gap-2 bg-rose-600 hover:bg-rose-700 text-white"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Ya, Batalkan Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

