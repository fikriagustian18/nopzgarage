"use client";

import { useState, useEffect } from "react";
import { 
  getBankAccounts, 
  createBankAccount, 
  deleteBankAccount, 
  toggleBankAccount 
} from "@/app/actions/bank";
import { 
  Trash2, 
  Plus, 
  CreditCard,
  Building2,
  Power
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Switch } from "@/components/ui/Switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/Dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function BankAccountsTab() {
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form State
  const [newBank, setNewBank] = useState({
      bankName: "", accountNumber: "", accountName: ""
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    loadBanks();
  }, []);

  async function loadBanks() {
    const res = await getBankAccounts();
    if (res.success && res.data) {
        setBanks(res.data);
    }
    setLoading(false);
  }

  async function handleCreate() {
      if (!newBank.bankName || !newBank.accountNumber || !newBank.accountName) {
          toast.error("Semua field harus diisi");
          return;
      }
      setSubmitLoading(true);
      const res = await createBankAccount({ ...newBank, bankCode: "OTHER" });
      setSubmitLoading(false);
      
      if (res.success) {
          toast.success("Rekening berhasil ditambahkan");
          setIsDialogOpen(false);
          setNewBank({ bankName: "", accountNumber: "", accountName: "" });
          loadBanks();
      } else if ('error' in res) {
          toast.error(res.error);
      }
  }

  async function handleDelete(id: string) {
      if (!confirm("Yakin ingin menghapus rekening ini?")) return;
      const res = await deleteBankAccount(id);
      if (res.success) {
          toast.success("Rekening dihapus");
          loadBanks();
      } else if ('error' in res) {
          toast.error(res.error);
      }
  }

  async function handleToggle(id: string, currentStatus: boolean) {
      const res = await toggleBankAccount(id, !currentStatus);
      if (res.success) {
          toast.success("Status diupdate");
          loadBanks();
      }
  }

  if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Rekening Bank & Metode Pembayaran</CardTitle>
          <CardDescription>Kelola daftar rekening untuk menerima pembayaran transfer.</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Tambah Rekening
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Tambah Rekening Baru</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Nama Bank</Label>
                        <Input 
                            placeholder="Contoh: BCA, Mandiri"
                            value={newBank.bankName}
                            onChange={(e) => setNewBank({...newBank, bankName: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Nomor Rekening</Label>
                        <Input 
                            placeholder="Contoh: 1234567890"
                            value={newBank.accountNumber}
                            onChange={(e) => setNewBank({...newBank, accountNumber: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Atas Nama</Label>
                        <Input 
                            placeholder="Contoh: CV NopzGarage"
                            value={newBank.accountName}
                            onChange={(e) => setNewBank({...newBank, accountName: e.target.value})}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleCreate} disabled={submitLoading}>
                        {submitLoading ? "Menyimpan..." : "Simpan Rekening"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {banks.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
                <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Belum ada rekening bank terdaftar.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {banks.map((bank) => (
                    <div key={bank.id} className="flex flex-col p-4 border rounded-lg bg-card/50 hover:bg-accent/5 transaction-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg">{bank.bankName}</h4>
                                    <p className="text-sm text-muted-foreground">{bank.accountNumber}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(bank.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-auto pt-4 border-t border-border">
                            <span className="text-sm font-medium">{bank.accountName}</span>
                            <div className="flex items-center gap-2">
                                <Switch 
                                    checked={bank.isActive} 
                                    onCheckedChange={() => handleToggle(bank.id, bank.isActive)}
                                />
                                <span className={`text-xs ${bank.isActive ? 'text-green-500' : 'text-muted-foreground'}`}>
                                    {bank.isActive ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
