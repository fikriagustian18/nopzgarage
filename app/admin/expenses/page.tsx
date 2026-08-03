"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Plus, Trash2, ArrowUpRight, Loader2, Search } from "lucide-react";

import { RoleGuard } from "@/components/shared/RoleGuard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

import { toast } from "@/hooks/useToast";
import {
  getExpenseCategories,
  createExpense,
  getExpenses,
  deleteExpense,
} from "@/lib/actions/expenses";

interface Expense {
  id: string;
  date: string;
  description: string;
  reference?: string | null;
  category: string;
  categoryCode: string;
  amount: number;
}

interface ExpenseCategory {
  id: string;
  code: string;
  name: string;
}

interface ExpenseFormData {
  description: string;
  amount: string;
  category: string;
  reference: string;
}

/**
 * Admin Expenses Management Page component.
 */
export default function Page() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState<ExpenseFormData>({
    description: "",
    amount: "",
    category: "Beban Operasional",
    reference: "",
  });

  // Load expense and category records from server
  async function loadData() {
    setLoading(true);
    const [expenseRes, categoryRes] = await Promise.all([
      getExpenses(),
      getExpenseCategories(),
    ]);

    if (expenseRes.success) {
      setExpenses((expenseRes.expenses as Expense[]) ?? []);
    }
    if (categoryRes.success) {
      setCategories((categoryRes.accounts as ExpenseCategory[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  // Handle new expense form submission
  async function handleSubmit() {
    const amountNum = Number(formData.amount) || 0;
    if (amountNum <= 0 || !formData.description || !formData.category) {
      toast({
        variant: "destructive",
        title: "Data tidak lengkap",
        description: "Mohon isi kategori, deskripsi, dan nominal.",
      });
      return;
    }

    setIsSubmitting(true);
    const result = await createExpense({
      description: formData.description,
      amount: amountNum,
      category: formData.category,
      reference: formData.reference ? formData.reference : undefined,
    });

    if (result.success) {
      toast({
        title: "Berhasil",
        description: "Pengeluaran berhasil dicatat.",
      });
      setIsDialogOpen(false);
      setFormData({
        description: "",
        amount: "",
        category: "Beban Operasional",
        reference: "",
      });
      loadData();
      setIsSubmitting(false);
      return;
    }

    toast({
      variant: "destructive",
      title: "Gagal",
      description: result.error,
    });
    setIsSubmitting(false);
  }

  // Handle deleting existing expense record
  async function handleDelete(id: string) {
    if (!confirm("Hapus data ini?")) {
      return;
    }
    await deleteExpense(id);
    loadData();
    toast({ description: "Data dihapus" });
  }

  // Calculate total expense sum
  const totalExpense = expenses.reduce(
    (total, expense) => total + expense.amount,
    0
  );

  // Filter expenses matching search query
  const filteredExpenses = expenses.filter(
    (expense) =>
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (expense.reference ?? "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <RoleGuard allowedRoles={["OWNER"]}>
      <div className="min-h-screen bg-background text-foreground">
        <div className="p-8 space-y-6">
          {/* Header section */}
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Pengeluaran & Operasional
            </h2>
            <p className="text-muted-foreground">
              Catat belanja alat, sewa, listrik, dan biaya operasional lainnya.
            </p>
          </div>

          {/* Stat cards section */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-red-200 dark:border-red-900 bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Pengeluaran (Cash Out)
                </CardTitle>
                <ArrowUpRight className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  Rp {totalExpense.toLocaleString("id-ID")}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Termasuk Aset, Gaji, dan Beban Operasional.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Expenses table section */}
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Riwayat Transaksi</CardTitle>
                <CardDescription>
                  Daftar catatan uang keluar / pengeluaran operasional.
                </CardDescription>
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari pengeluaran..."
                    className="pl-9 w-full md:w-[250px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Dialog
                  open={isDialogOpen}
                  onOpenChange={setIsDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="gap-2 bg-red-600 hover:bg-red-700 text-white shadow-sm">
                      <Plus className="h-4 w-4" /> Catat Pengeluaran
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Catat Pengeluaran Baru</DialogTitle>
                      <DialogDescription>
                        Masukkan data pengeluaran operasional secara manual.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Kategori Pengeluaran</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(val) =>
                            setFormData({ ...formData, category: val })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Kategori..." />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem
                                key={category.id}
                                value={category.name}
                              >
                                {category.name}
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
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nominal (Rp)</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={formData.amount}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                amount: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ref / No. Nota (Opsional)</Label>
                          <Input
                            placeholder="INV-001"
                            value={formData.reference ?? ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                reference: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Batal
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {isSubmitting && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
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
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8"
                        >
                          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : filteredExpenses.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          {searchQuery
                            ? "Tidak ada yang cocok dengan pencarian"
                            : "Belum ada data pengeluaran."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredExpenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="font-mono text-xs">
                            {format(new Date(expense.date), "dd/MM/yyyy", {
                              locale: id,
                            })}
                            <div className="text-[10px] text-muted-foreground">
                              {format(new Date(expense.date), "HH:mm")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {expense.description}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {expense.reference ?? "(-)"}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                              {expense.category}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-bold text-red-600">
                            - Rp {expense.amount.toLocaleString("id-ID")}
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
