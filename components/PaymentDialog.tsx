'use client';

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPayment } from "@/app/actions/payments";
import { toast } from "@/hooks/use-toast";
import { Loader2, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils"; 
import { notifyPaymentReceived } from "@/hooks/useNotification"; 

type Order = {
  id: string;
  custName: string;
  totalPrice: number;
  totalPaid: number; // Note: Need to verify if totalPrice/totalPaid are numbers or Decimals in the frontend object
  paymentStatus: string;
};

type PaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onSuccess?: () => void;
};

export function PaymentDialog({
  open,
  onOpenChange,
  order,
  onSuccess,
}: PaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const remaining = Number(order.totalPrice) - Number(order.totalPaid);
  
  const [amount, setAmount] = useState<number>(remaining > 0 ? remaining : 0);
  const [note, setNote] = useState("");
  
  // Payment Method State
  const [method, setMethod] = useState<"CASH" | "TRANSFER">("CASH");
  const [bankList, setBankList] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState("");
  
  // Pay Commission State
  const [payCommission, setPayCommission] = useState(false);

  // Load Bank Accounts only when dialog opens
  useEffect(() => {
      if (open) {
          loadBanks();
      }
  }, [open]);

  async function loadBanks() {
      // Import dynamically to avoid server action import issues in client component if not configured properly, 
      // but here we use standard import at top level usually. Let's assume we can fetch bank list.
      // Since getBankAccounts is a server action, let's assume we can import it.
      // Actually we need to import it at the top. Let's add import.
      const { getBankAccounts } = await import("@/app/actions/bank");
      const res = await getBankAccounts();
      if (res.success && res.data) {
          setBankList(res.data.filter((b: any) => b.isActive));
      }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (amount <= 0) {
        toast({
          variant: "destructive",
          title: "❌ Invalid Amount",
          description: "Jumlah pembayaran harus lebih dari 0",
        });
        setLoading(false);
        return;
      }

      if (method === "TRANSFER" && !selectedBankId) {
          toast({
              variant: "destructive",
              title: "Pilih Bank",
              description: "Harap pilih rekening bank tujuan transfer.",
          });
          setLoading(false);
          return;
      }

      const result = await createPayment({
        amount: amount,
        note: note || "Pembayaran Order",
        orderId: order.id,
        paymentMethod: method,
        bankAccountId: selectedBankId || undefined,
        payCommissionNow: payCommission
      });

      if (result.success) {
        toast({
          title: "✅ Pembayaran Berhasil!",
          description: `Pembayaran sebesar Rp ${amount.toLocaleString("id-ID")} berhasil dicatat.`,
        });
        
        // Add notification
        notifyPaymentReceived(order.custName, amount, order.id);
        
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "❌ Gagal",
          description: result.error || "Terjadi kesalahan saat memproses pembayaran",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: "Terjadi kesalahan sistem",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            Pembayaran Order
          </DialogTitle>
          <DialogDescription>
            Input pembayaran untuk Order #{order.id.slice(-6)} a.n {order.custName}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/40 border border-border p-4 rounded-lg space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Tagihan:</span>
            <span className="font-semibold text-foreground">Rp {Number(order.totalPrice).toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sudah Dibayar:</span>
            <span className="font-semibold text-green-600 dark:text-green-400">Rp {Number(order.totalPaid).toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-border pt-2 mt-2">
            <span className="text-foreground font-medium">Sisa Tagihan:</span>
            <span className="font-bold text-destructive">Rp {remaining.toLocaleString("id-ID")}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Jumlah Pembayaran</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rp</span>
              <Input
                id="amount"
                type="number"
                min="0"
                className="pl-10 text-lg font-semibold"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
               {/* Payment Method */}
               <div className="space-y-2">
                   <Label>Metode Bayar</Label>
                   <div className="flex bg-muted rounded-md p-1">
                       <button
                           type="button"
                           onClick={() => setMethod("CASH")}
                           className={`flex-1 text-sm font-medium py-1.5 rounded-sm transition-all ${
                               method === "CASH" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                           }`}
                       >
                           Tunai (Cash)
                       </button>
                       <button
                           type="button"
                           onClick={() => setMethod("TRANSFER")}
                           className={`flex-1 text-sm font-medium py-1.5 rounded-sm transition-all ${
                               method === "TRANSFER" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                           }`}
                       >
                           Transfer
                       </button>
                   </div>
               </div>

               {/* Bank List (Only if Transfer) */}
               {method === "TRANSFER" && (
                   <div className="space-y-2">
                       <Label>Bank Tujuan</Label>
                       <select 
                           className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                           value={selectedBankId}
                           onChange={(e) => setSelectedBankId(e.target.value)}
                       >
                           <option value="">Pilih Bank...</option>
                           {bankList.map((bank) => (
                               <option key={bank.id} value={bank.id}>
                                   {bank.bankName} - {bank.accountNumber}
                               </option>
                           ))}
                       </select>
                   </div>
               )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Catatan (Opsional)</Label>
            <Textarea
              id="note"
              placeholder={method === "TRANSFER" ? "Nama Pengirim / No. Ref Transfer" : "Catatan tambahan..."}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          
          {/* Option: Pay Employee Commission */}
          {remaining > 0 && amount >= remaining && (
              <div className="flex items-center space-x-2 bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <input
                      type="checkbox"
                      id="payslip"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={payCommission}
                      onChange={(e) => setPayCommission(e.target.checked)}
                  />
                  <label htmlFor="payslip" className="text-sm font-medium leading-none cursor-pointer">
                      Cairkan komisi karyawan otomatis?
                      <p className="text-[10px] text-muted-foreground mt-1 font-normal">
                          Jika dicentang, status komisi karyawan untuk order ini akan berubah jadi "LUNAS". Gunakan jika uang tips/komisi langsung diberikan saat ini juga.
                      </p>
                  </label>
              </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Bayar & Selesaikan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
