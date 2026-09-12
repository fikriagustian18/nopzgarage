"use client";

import { useState, useEffect } from "react";
import { 
  Landmark, 
  Plus, 
  MoreVertical, 
  Trash2, 
  Edit,
  Building2,
  Power,
  Info,
  ShieldCheck,
  AlertCircle
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { INDONESIAN_BANKS, getBankColor } from "@/lib/constants/banks";
import { 
  getAllBankAccounts, 
  createBankAccount, 
  deactivateBankAccount, 
  deleteBankAccount, 
  updateBankAccount, 
  toggleBankAccount,
  type BankAccountAdminItem 
} from "@/lib/actions/bank";

interface BankAccountFormData {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  currentBalance: string;
}

export function BankAccountsManager() {
  const [accounts, setAccounts] = useState<BankAccountAdminItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isConfirmPermanentDeleteOpen, setIsConfirmPermanentDeleteOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccountAdminItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    const result = await getAllBankAccounts();
    if (result.success) {
      setAccounts((result.data as BankAccountAdminItem[]) || []);
    }
    setIsLoading(false);
  }

  function handleOpenCreate() {
    setFormData({ bankCode: "", bankName: "", accountNumber: "", accountName: "", currentBalance: "0" });
    setSelectedAccount(null);
    setIsDetailOpen(true);
  }

  function handleOpenEdit(account: BankAccountAdminItem) {
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
        toast.error(result.error || "Gagal mengupdate rekening");
      }
    } else {
      const result = await createBankAccount(payload);
      if (result.success) {
        toast.success("Rekening berhasil ditambahkan");
        fetchAccounts();
        setIsDetailOpen(false);
      } else {
        toast.error(result.error || "Gagal menambahkan rekening");
      }
    }
  }

  async function handleToggleStatus(account: BankAccountAdminItem) {
    const nextStatus = account.isActive === false ? true : false;
    const result = await toggleBankAccount(account.id, nextStatus);
    if (result.success) {
      toast.success(result.message || (nextStatus ? "Rekening diaktifkan" : "Rekening dinonaktifkan"));
      fetchAccounts();
    } else {
      toast.error(result.error || "Gagal mengubah status rekening");
    }
  }

  async function handleDelete() {
    if (!selectedAccount) {
      return;
    }
    
    setIsSubmitting(true);
    const result = await deactivateBankAccount(selectedAccount.id);
    setIsSubmitting(false);
    if (result.success) {
      toast.success("Rekening berhasil dinonaktifkan");
      fetchAccounts();
      setIsConfirmDeleteOpen(false);
      setSelectedAccount(null);
    } else {
      toast.error(result.error || "Gagal menonaktifkan rekening");
    }
  }

  async function handlePermanentDelete() {
    if (!selectedAccount) {
      return;
    }

    setIsSubmitting(true);
    const result = await deleteBankAccount(selectedAccount.id);
    setIsSubmitting(false);
    if (result.success) {
      toast.success(result.message || "Rekening berhasil dihapus permanen");
      fetchAccounts();
      setIsConfirmPermanentDeleteOpen(false);
      setSelectedAccount(null);
    } else {
      toast.error(result.error || "Gagal menghapus rekening bank");
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
              className={`relative overflow-hidden group transition-all ${
                account.isActive === false ? "opacity-75 border-dashed bg-muted/20" : ""
              }`}
            >
              <div
                className="absolute top-0 left-0 w-2 h-full"
                style={{ backgroundColor: account.isActive === false ? "#94a3b8" : getBankColor(account.bankCode) }}
              />
              <CardHeader className="pl-6 pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-muted rounded-md group-hover:bg-muted/80 transition-colors">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <CardTitle className="text-sm font-bold">{account.bankCode}</CardTitle>
                        {account.isActive === false && (
                          <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border">
                            Nonaktif
                          </span>
                        )}
                      </div>
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
                      {account.isActive === false ? (
                        <>
                          <DropdownMenuItem onClick={() => handleToggleStatus(account)}>
                            <Power className="h-4 w-4 mr-2 text-green-600" /> Aktifkan
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {account.canDeletePermanently ? (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setSelectedAccount(account);
                                setIsConfirmPermanentDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Hapus Permanen
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAccount(account);
                                setIsInfoOpen(true);
                              }}
                            >
                              <Info className="h-4 w-4 mr-2 text-muted-foreground" /> Alasan Tidak Bisa Dihapus
                            </DropdownMenuItem>
                          )}
                        </>
                      ) : (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSelectedAccount(account);
                            setIsConfirmDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Nonaktifkan
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pl-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-2xl font-bold tracking-tight">Rp {Number(account.currentBalance).toLocaleString("id-ID")}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Saldo Saat Ini</p>
                      {account.isActive === false && (
                        account.canDeletePermanently ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <ShieldCheck className="h-3 w-3" /> Siap dihapus
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                            <AlertCircle className="h-3 w-3" /> {account.transactionCount} transaksi
                          </span>
                        )
                      )}
                    </div>
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

      {/* DEACTIVATE CONFIRM DIALOG */}
      <Dialog
        open={isConfirmDeleteOpen}
        onOpenChange={setIsConfirmDeleteOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nonaktifkan Rekening?</DialogTitle>
            <DialogDescription>
              Rekening <strong>{selectedAccount?.bankName} - {selectedAccount?.accountNumber}</strong> akan dinonaktifkan dari sistem. Rekening ini tidak akan muncul pada pilihan pembayaran baru, tetapi riwayat transaksi lama tetap dipertahankan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              disabled={isSubmitting}
              onClick={() => setIsConfirmDeleteOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={isSubmitting}
              onClick={handleDelete}
            >
              {isSubmitting ? "Memproses..." : "Nonaktifkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PERMANENT DELETE CONFIRM DIALOG */}
      <Dialog
        open={isConfirmPermanentDeleteOpen}
        onOpenChange={setIsConfirmPermanentDeleteOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Hapus Rekening Permanen?
            </DialogTitle>
            <div className="space-y-2 pt-2 text-sm text-muted-foreground">
              <p>
                Rekening <strong>{selectedAccount?.bankName} - {selectedAccount?.accountNumber}</strong> ({selectedAccount?.accountName}) akan dihapus secara permanen dari basis data.
              </p>
              <div className="text-xs bg-muted p-3 rounded-md space-y-1">
                <p className="font-semibold text-foreground">Kriteria Keamanan Terpenuhi:</p>
                <p>✓ Status: Nonaktif</p>
                <p>✓ Saldo: Tepat Rp0</p>
                <p>✓ Riwayat Transaksi: 0 (tidak pernah digunakan)</p>
              </div>
              <p className="text-xs font-semibold text-destructive">
                Histori keuangan sistem tidak akan terganggu karena rekening ini tidak memiliki catatan transaksi. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              disabled={isSubmitting}
              onClick={() => setIsConfirmPermanentDeleteOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={isSubmitting}
              onClick={handlePermanentDelete}
            >
              {isSubmitting ? "Menghapus..." : "Hapus Permanen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REASONS INFO DIALOG */}
      <Dialog
        open={isInfoOpen}
        onOpenChange={setIsInfoOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-amber-500" /> Mengapa Rekening Tidak Dapat Dihapus?
            </DialogTitle>
            <div className="space-y-3 pt-2 text-sm">
              <p className="text-muted-foreground">
                Rekening <strong>{selectedAccount?.bankName} - {selectedAccount?.accountNumber}</strong> dilindungi oleh aturan keamanan keuangan:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-destructive text-xs">
                {selectedAccount?.reasons && selectedAccount.reasons.length > 0 ? (
                  selectedAccount.reasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))
                ) : (
                  <li>Rekening memiliki histori transaksi keuangan yang harus dipertahankan.</li>
                )}
              </ul>
              {selectedAccount?.usageByType && (
                <div className="text-xs bg-muted p-3 rounded-md space-y-1">
                  <p className="font-semibold text-foreground">Rincian Riwayat Transaksi:</p>
                  <p>• Pembayaran Order: {selectedAccount.usageByType.orderPayments}</p>
                  <p>• Pengeluaran Operasional: {selectedAccount.usageByType.expenses}</p>
                  <p>• Pembayaran Gaji: {selectedAccount.usageByType.payroll}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Untuk menjaga integritas pembukuan, laporan laba-rugi, dan audit historis, rekening yang memiliki transaksi tidak dihapus dan tetap berstatus <strong>Nonaktif</strong>.
              </p>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsInfoOpen(false)}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
