"use client";

import { useEffect, useState } from "react";
import { RoleGuard } from "@/components/RoleGuard";
import { 
    getExpenseCategories, 
    createExpense, 
    getExpensesList, 
    deleteExpense,
    CreateExpenseInput 
} from "@/app/actions/expenses";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle, 
    CardDescription 
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger 
} from "@/components/ui/Dialog";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/Table";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/Select";
import { Plus, Trash2, ArrowUpRight, Loader2, Search } from "lucide-react";
import { toast } from "@/hooks/useToast";

// ==================== Page Component ====================
export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form State
  const [formData, setFormData] = useState<CreateExpenseInput>({
    description: "",
    amount: 0,
    accountId: "",
    reference: ""
  });

  // Load Data
  async function loadData() {
    setLoading(true);
    const [expRes, catRes] = await Promise.all([
        getExpensesList(),
        getExpenseCategories()
    ]);

    if (expRes.success) setExpenses(expRes.expenses || []);
    if (catRes.success) setCategories(catRes.accounts || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  // Submit Handler
  const handleSubmit = async () => {
    if (!formData.accountId || formData.amount <= 0 || !formData.description) {
        toast({ variant: "destructive", title: "Data tidak lengkap" });
        return;
    }

    setIsSubmitting(true);
    const result = await createExpense(formData);
    
    if (result.success) {
        toast({ title: "Berhasil", description: "Pengeluaran tercatat." });
        setIsDialogOpen(false);
        setFormData({ description: "", amount: 0, accountId: "", reference: "" });
        loadData(); // Refresh table
    } else {
        toast({ variant: "destructive", title: "Gagal", description: result.error });
    }
    setIsSubmitting(false);
  };

  // Delete Handler
  const handleDelete = async (id: string) => {
      if(!confirm("Hapus data ini?")) return;
      await deleteExpense(id);
      loadData();
      toast({ description: "Data dihapus" });
  };

  // Stats
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Filter Logic
  const filteredExpenses = expenses.filter(expense => 
    expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (expense.reference || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <RoleGuard allowedRoles={["OWNER"]}>
      <div className="min-h-screen bg-background text-foreground">
        <div className="p-8 space-y-6">
        {/* Title Section */}
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Pengeluaran & Operasional</h2>
            <p className="text-muted-foreground">
            Catat belanja alat, sewa, listrik, dan biaya lainnya.
            </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-red-200 dark:border-red-900 bg-card shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Pengeluaran (Cash Out)</CardTitle>
                    <ArrowUpRight className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        Rp {totalExpense.toLocaleString('id-ID')}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Termasuk Aset, Gaji, dan Beban.
                    </p>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <CardTitle>Riwayat Transaksi</CardTitle>
                    <CardDescription>Daftar transaksi uang keluar dari KAS.</CardDescription>
                </div>
                <div className="flex flex-col md:flex-row gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Cari transaksi..." 
                            className="pl-9 w-full md:w-[250px]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-red-600 hover:bg-red-700 text-white shadow-sm">
                                <Plus className="h-4 w-4" /> Catat Pengeluaran
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Catat Pengeluaran Baru</DialogTitle>
                                <DialogDescription>
                                    Pilih kategori akuntansi (Beban/Aset) dan masukkan nominal.
                                </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Kategori (Akun)</Label>
                                    <Select 
                                        value={formData.accountId} 
                                        onValueChange={(v) => setFormData({...formData, accountId: v})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Kategori..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(c => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    {c.code} - {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Deskripsi / Keterangan</Label>
                                    <Input 
                                        placeholder="Contoh: Beli Oli Drum, Bayar Listrik, dll" 
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Nominal (Rp)</Label>
                                        <Input 
                                            type="number"
                                            placeholder="0" 
                                            value={formData.amount}
                                            onChange={(e) => setFormData({...formData, amount: parseInt(e.target.value) || 0})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ref / No. Nota (Opsional)</Label>
                                        <Input 
                                            placeholder="INV-001" 
                                            value={formData.reference || ''}
                                            onChange={(e) => setFormData({...formData, reference: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                                <Button 
                                    onClick={handleSubmit} 
                                    disabled={isSubmitting}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Simpan
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table className="min-w-[800px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Deskripsi</TableHead>
                                <TableHead>Ref</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead className="text-right">Nominal</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredExpenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        {searchQuery ? "Tidak ada yang cocok dengan pencarian" : "Belum ada data pengeluaran."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredExpenses.map((expense) => (
                                    <TableRow key={expense.id}>
                                        <TableCell className="font-mono text-xs">
                                            {format(new Date(expense.date), "dd/MM/yyyy", { locale: id })}
                                            <div className="text-[10px] text-muted-foreground">
                                                {format(new Date(expense.date), "HH:mm")}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{expense.description}</div>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground font-mono">
                                            {expense.reference ? expense.reference : "(-)"}
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                                                {expense.categoryCode} - {expense.category}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-red-600">
                                            - Rp {expense.amount.toLocaleString('id-ID')}
                                        </TableCell>
                                        <TableCell>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-muted-foreground hover:text-red-600"
                                                onClick={() => handleDelete(expense.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
    </RoleGuard>
  );
}
