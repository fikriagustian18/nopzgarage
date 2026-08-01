"use client";

import { useState, useEffect } from "react";
import { 
  Landmark, 
  Plus, 
  MoreVertical, 
  Trash2, 
  Edit,
  Building2
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/Select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { INDONESIAN_BANKS, getBankColor } from "@/lib/constants/banks";
import { getBankAccounts, createBankAccount, deleteBankAccount, updateBankAccount } from "@/lib/actions/bank";

interface BankAccountItem {
  id: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  currentBalance: number;
}

interface BankAccountFormData {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  currentBalance: string;
}

export function BankAccountsManager() {
  const [accounts, setAccounts] = useState<BankAccountItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccountItem | null>(null);
  const [formData, setFormData] = useState<BankAccountFormData>({
    bankCode: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
    currentBalance: "0"
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    setIsLoading(true);
    const result = await getBankAccounts();
    if (result.success) {
      setAccounts((result.data as BankAccountItem[]) || []);
    }
    setIsLoading(false);
  }

  function handleOpenCreate() {
    setFormData({ bankCode: "", bankName: "", accountNumber: "", accountName: "", currentBalance: "0" });
    setSelectedAccount(null);
    setIsDetailOpen(true);
  }

  function handleOpenEdit(account: BankAccountItem) {
    setFormData({
      bankCode: account.bankCode,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      currentBalance: account.currentBalance.toString()
    });
    setSelectedAccount(account);
    setIsDetailOpen(true);
  }

  function handleBankSelect(code: string) {
    const bank = INDONESIAN_BANKS.find(b => b.code === code);
    if (bank) {
      setFormData(prev => ({
        ...prev,
        bankCode: bank.code,
        bankName: bank.name
      }));
    }
  }

  async function handleSubmit() {
    if (!formData.bankCode || !formData.accountNumber || !formData.accountName) {
      toast.error("Mohon lengkapi data rekening");
      return;
    }

    const payload = {
      ...formData,
      currentBalance: Number(formData.currentBalance) || 0
    };

    if (selectedAccount) {
      const result = await updateBankAccount(selectedAccount.id, payload);
      if (result.success) {
        toast.success("Rekening berhasil diupdate");
        fetchAccounts();
        setIsDetailOpen(false);
      } else {
        toast.error((result as any).error || "Gagal mengupdate rekening");
      }
    } else {
      const result = await createBankAccount(payload);
      if (result.success) {
        toast.success("Rekening berhasil ditambahkan");
        fetchAccounts();
        setIsDetailOpen(false);
      } else {
        toast.error((result as any).error || "Gagal menambahkan rekening");
      }
    }
  }

  async function handleDelete() {
    if (!selectedAccount) {
      return;
    }
    
    const result = await deleteBankAccount(selectedAccount.id);
    if (result.success) {
      toast.success("Rekening berhasil dihapus");
      fetchAccounts();
      setIsConfirmDeleteOpen(false);
      setSelectedAccount(null);
    } else {
      toast.error((result as any).error || "Gagal menghapus rekening");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold">Rekening Bank</h3>
          <p className="text-sm text-muted-foreground">Kelola rekening bank usaha</p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Tambah Rekening
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="text-muted-foreground md:col-span-3 text-center py-8">Loading data...</p>
        ) : accounts.length === 0 ? (
          <div className="md:col-span-3 text-center py-12 border-2 border-dashed border-muted rounded-xl">
            <Landmark className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h4 className="font-semibold text-lg">Belum Ada Rekening</h4>
            <p className="text-muted-foreground mb-4">Tambahkan rekening bank untuk memantau saldo</p>
            <Button
              onClick={handleOpenCreate}
              variant="outline"
            >
              Tambah Sekarang
            </Button>
          </div>
        ) : (
          accounts.map((account) => (
            <Card
              key={account.id}
              className="relative overflow-hidden group"
            >
              <div
                className="absolute top-0 left-0 w-2 h-full"
                style={{ backgroundColor: getBankColor(account.bankCode) }}
              />
              <CardHeader className="pl-6 pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-muted rounded-md group-hover:bg-muted/80 transition-colors">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-sm font-bold">{account.bankCode}</CardTitle>
                      <CardDescription className="text-xs">{account.bankName}</CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenEdit(account)}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setSelectedAccount(account);
                          setIsConfirmDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pl-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-2xl font-bold tracking-tight">Rp {Number(account.currentBalance).toLocaleString("id-ID")}</p>
                    <p className="text-xs text-muted-foreground">Saldo Saat Ini</p>
                  </div>
                  <div className="pt-4 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
                    <span className="font-mono">{account.accountNumber}</span>
                    <span
                      className="truncate max-w-[120px]"
                      title={account.accountName}
                    >
                      {account.accountName}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* CREATE/EDIT DIALOG */}
      <Dialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedAccount ? "Edit Rekening" : "Tambah Rekening Baru"}</DialogTitle>
            <DialogDescription>
              Masukkan detail rekening bank anda.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Bank</Label>
              <Select 
                value={formData.bankCode} 
                onValueChange={handleBankSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Bank" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {INDONESIAN_BANKS.map(bank => (
                    <SelectItem
                      key={bank.code}
                      value={bank.code}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: bank.color }}
                        />
                        <span>{bank.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nomor Rekening</Label>
                <Input 
                  value={formData.accountNumber} 
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="Contoh: 1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label>Atas Nama</Label>
                <Input 
                  value={formData.accountName} 
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  placeholder="Nama Pemilik Rekening"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Saldo Awal (Current Balance)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">Rp</span>
                <Input 
                  className="pl-9"
                  type="number"
                  value={formData.currentBalance} 
                  onChange={(e) => setFormData({ ...formData, currentBalance: e.target.value })}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">Masukkan saldo riil yang ada di bank saat ini.</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailOpen(false)}
            >
              Batal
            </Button>
            <Button onClick={handleSubmit}>{selectedAccount ? "Simpan Perubahan" : "Buat Rekening"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog
        open={isConfirmDeleteOpen}
        onOpenChange={setIsConfirmDeleteOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Rekening?</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan. Rekening <strong>{selectedAccount?.bankName} - {selectedAccount?.accountNumber}</strong> akan dinonaktifkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsConfirmDeleteOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
