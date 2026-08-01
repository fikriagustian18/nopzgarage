"use client";

import { useState, useEffect } from "react";
import { Loader2, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"; 
import { toast } from "@/hooks/useToast";
import { notifyPaymentReceived } from "@/hooks/useNotification"; 
import { createPayment } from "@/lib/actions/payments";

interface Order {
  id: string;
  custName: string;
  totalPrice: number;
  totalPaid: number;
  paymentStatus: string;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onSuccess?: () => void;
}

export function PaymentDialog({
  open,
  onOpenChange,
  order,
  onSuccess,
}: PaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const remaining = Number(order.totalPrice) - Number(order.totalPaid);
  
  const [amount, setAmount] = useState<number | string>(remaining > 0 ? remaining : 0);
  const [note, setNote] = useState("");
  
  // Payment Method State
  const [method, setMethod] = useState<"CASH" | "TRANSFER" | "QRIS" | "CARD">("CASH");
  const [banks, setBanks] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState("");
  
  // Cash Payment States
  const [cashReceived, setCashReceived] = useState<number | string>(remaining > 0 ? remaining : 0);
  
  // Pay Commission State
  const [payCommission, setPayCommission] = useState(false);

  // Sync cashReceived with amount changes
  useEffect(() => {
    setCashReceived(amount);
  }, [amount]);

  // Reset states when dialog is opened or order changes
  useEffect(() => {
    if (open && order) {
      const remainingVal = Number(order.totalPrice) - Number(order.totalPaid);
      const initialAmount = remainingVal > 0 ? remainingVal : 0;
      setAmount(initialAmount);
      setCashReceived(initialAmount);
      setNote("");
      setMethod("CASH");
      setSelectedBankId("");
      setPayCommission(false);
    }
  }, [open, order?.id]);

  // Load Bank Accounts when dialog opens
  useEffect(() => {
    if (open) {
      loadBanks();
    }
  }, [open]);

  async function loadBanks() {
    const { getBankAccounts } = await import("@/lib/actions/bank");
    const res = await getBankAccounts();
    if (res.success && res.data) {
      setBanks(res.data.filter((b: any) => b.isActive));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const numAmount = Number(amount) || 0;
    const numCashReceived = Number(cashReceived) || 0;

    try {
      if (numAmount <= 0) {
        toast({
          variant: "destructive",
          title: "❌ Invalid Amount",
          description: "Jumlah pembayaran harus lebih dari 0",
        });
        setLoading(false);
        return;
      }

      if (["TRANSFER", "QRIS", "CARD"].includes(method) && !selectedBankId && banks.length > 0) {
        toast({
          variant: "destructive",
          title: "Pilih Rekening Bank",
          description: "Harap pilih rekening bank tujuan untuk mencatat transaksi.",
        });
        setLoading(false);
        return;
      }

      if (method === "CASH" && numCashReceived < numAmount) {
        toast({
          variant: "destructive",
          title: "Uang Diterima Kurang",
          description: "Jumlah uang tunai yang diterima kurang dari nominal tagihan.",
        });
        setLoading(false);
        return;
      }

      const result = await createPayment({
        amount: numAmount,
        note: note || "Pembayaran Order",
        orderId: order.id,
        paymentMethod: method,
        bankAccountId: selectedBankId || undefined,
        payCommissionNow: payCommission
      });

      if (result.success) {
        toast({
          title: "✅ Pembayaran Berhasil!",
          description: `Pembayaran sebesar Rp ${numAmount.toLocaleString("id-ID")} berhasil dicatat.`,
        });
        
        notifyPaymentReceived(order.custName, numAmount, order.id);
        
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
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
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
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

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
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
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-4">
            {/* Payment Method Selector */}
            <div className="space-y-2">
              <Label className="text-foreground">Metode Bayar</Label>
              <div className="grid grid-cols-4 bg-muted rounded-md p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setMethod("CASH")}
                  className={`text-xs font-semibold py-2 rounded-sm transition-all ${
                    method === "CASH" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Tunai
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("TRANSFER")}
                  className={`text-xs font-semibold py-2 rounded-sm transition-all ${
                    method === "TRANSFER" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Transfer
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("QRIS")}
                  className={`text-xs font-semibold py-2 rounded-sm transition-all ${
                    method === "QRIS" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  QRIS
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("CARD")}
                  className={`text-xs font-semibold py-2 rounded-sm transition-all ${
                    method === "CARD" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Kartu
                </button>
              </div>
            </div>

            {/* Conditional Input Fields */}
            {method === "CASH" && (
              <div className="grid grid-cols-2 gap-4 border border-border p-3 rounded-lg bg-muted/20">
                <div className="space-y-2">
                  <Label htmlFor="cash-received">Uang Diterima</Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rp</span>
                    <Input 
                      id="cash-received"
                      type="number"
                      min={Number(amount) || 0}
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      className="pl-8 text-sm font-semibold"
                    />
                  </div>
                </div>
                <div className="space-y-2 flex flex-col justify-end">
                  <span className="text-xs text-muted-foreground">Kembalian:</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    Rp {Math.max(0, (Number(cashReceived) || 0) - (Number(amount) || 0)).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            )}

            {["TRANSFER", "QRIS", "CARD"].includes(method) && (
              <div className="space-y-3 border border-border p-3 rounded-lg bg-muted/20">
                {banks.length > 0 && (
                  <div className="space-y-1.5 animate-in fade-in-50">
                    <Label className="text-xs">Pilih Rekening Tujuan / EDC</Label>
                    <Select
                      value={selectedBankId}
                      onValueChange={setSelectedBankId}
                    >
                      <SelectTrigger className="h-9 text-xs border-border">
                        <SelectValue placeholder="-- Pilih Bank / Kas --" />
                      </SelectTrigger>
                      <SelectContent>
                        {banks.map((bank) => (
                          <SelectItem
                            key={bank.id}
                            value={bank.id}
                          >
                            {bank.bankName} - {bank.accountNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {method === "QRIS" && (
                  <div className="flex flex-col items-center justify-center p-4 border border-dashed border-border rounded bg-background/50">
                    <div className="w-32 h-32 bg-foreground/10 border-4 border-foreground/20 rounded flex items-center justify-center p-2 mb-2 relative">
                      <div className="grid grid-cols-4 gap-1 w-full h-full opacity-80">
                        {Array.from({ length: 16 }).map((_, i) => (
                          <div
                            key={i}
                            className={`rounded-sm ${(i * 3 + 7) % 5 === 0 || i === 0 || i === 3 || i === 12 || i === 15 ? "bg-foreground" : "bg-transparent"}`}
                          />
                        ))}
                      </div>
                      <span className="absolute text-[8px] bg-background px-1 py-0.5 rounded font-black border border-border">QRIS MOCK</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center font-medium">Scan QR Code di atas menggunakan dompet digital atau aplikasi mobile banking pelanggan.</p>
                  </div>
                )}

                {method === "CARD" && (
                  <div className="p-3 bg-background/50 border border-border rounded flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center font-bold text-xs text-primary border border-primary/20">EDC</div>
                    <div className="text-[10px] text-muted-foreground leading-relaxed">
                      Silakan swipe / insert kartu debit atau kredit pelanggan pada mesin EDC tujuan. Klik <b>Bayar & Selesaikan</b> untuk mengonfirmasi struk EDC berhasil keluar.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Catatan (Opsional)</Label>
            <Textarea
              id="note"
              placeholder={method === "TRANSFER" ? "Nama Pengirim / No. Ref Transfer" : method === "QRIS" ? "ID Transaksi QRIS" : method === "CARD" ? "No. Struk EDC" : "Catatan tambahan..."}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          
          {/* Option: Pay Employee Commission */}
          {remaining > 0 && Number(amount) >= remaining && (
            <div className="flex items-center space-x-2 bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <input
                type="checkbox"
                id="payslip"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={payCommission}
                onChange={(e) => setPayCommission(e.target.checked)}
              />
              <label
                htmlFor="payslip"
                className="text-sm font-medium leading-none cursor-pointer"
              >
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
