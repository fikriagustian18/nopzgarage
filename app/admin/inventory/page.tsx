// app/admin/inventory/page.tsx - Inventory Management
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RoleGuard } from "@/components/RoleGuard";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  TrendingDown,
  Box,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getSpareParts, deleteSparePart, addStock, reduceStock } from "@/app/actions/inventory"; 
import { SparepartDialog } from "@/components/SparepartDialog"; 
import { Toaster } from "@/components/ui/toaster";
import { ExportButton } from "@/components/export/ExportButton";
import { exportInventory } from "@/lib/export/reports/inventory-export";
import type { InventoryItemExport } from "@/lib/export/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

type SparePart = {
  id: string;
  code: string;
  name: string;
  stock: number;
  minStock: number;
  unit: string;
  buyPrice: number;
  sellPrice: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export default function InventoryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedPart, setSelectedPart] = useState<SparePart | undefined>();

  // Stock dialog states
  const [stockInOpen, setStockInOpen] = useState(false);
  const [stockOutOpen, setStockOutOpen] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);

  const [stockInForm, setStockInForm] = useState({
    qty: 1,
    supplier: "",
    buyPrice: 0,
    date: new Date().toISOString().split("T")[0]
  });

  const [stockOutForm, setStockOutForm] = useState({
    qty: 1,
    description: "",
    date: new Date().toISOString().split("T")[0]
  });

  useEffect(() => {
    if (selectedPart) {
      setStockInForm({
        qty: 1,
        supplier: "",
        buyPrice: Number(selectedPart.buyPrice),
        date: new Date().toISOString().split("T")[0]
      });
      setStockOutForm({
        qty: 1,
        description: "",
        date: new Date().toISOString().split("T")[0]
      });
    }
  }, [selectedPart]);

  const handleStockInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPart) return;
    setStockLoading(true);
    try {
      const res = await addStock(
        selectedPart.id,
        stockInForm.qty,
        stockInForm.supplier,
        stockInForm.buyPrice,
        stockInForm.date
      );

      if (res.success) {
        toast({
          title: "✅ Berhasil!",
          description: `Berhasil menambahkan stok masuk sebanyak ${stockInForm.qty} unit.`,
        });
        setStockInOpen(false);
        fetchSpareParts();
      } else {
        toast({
          variant: "destructive",
          title: "❌ Gagal",
          description: res.error || "Gagal memproses stok masuk",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: "Terjadi kesalahan sistem",
      });
    } finally {
      setStockLoading(false);
    }
  };

  const handleStockOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPart) return;
    setStockLoading(true);
    try {
      const res = await reduceStock(
        selectedPart.id,
        stockOutForm.qty,
        stockOutForm.description,
        stockOutForm.date
      );

      if (res.success) {
        toast({
          title: "✅ Berhasil!",
          description: `Berhasil mencatat stok keluar sebanyak ${stockOutForm.qty} unit.`,
        });
        setStockOutOpen(false);
        fetchSpareParts();
      } else {
        toast({
          variant: "destructive",
          title: "❌ Gagal",
          description: res.error || "Gagal memproses stok keluar",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: "Terjadi kesalahan sistem",
      });
    } finally {
      setStockLoading(false);
    }
  };

  // Fetch dari database
  useEffect(() => {
    fetchSpareParts();
  }, []);

  async function fetchSpareParts() {
    setIsLoading(true);
    try {
      const result = await getSpareParts();
      if (result.success && result.spareParts) {
        setSpareParts(result.spareParts as unknown as SparePart[]);
      }
    } catch (error) {
      console.error("Failed to fetch spare parts", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Apakah anda yakin ingin menghapus produk ini?")) {
      await deleteSparePart(id);
      fetchSpareParts();
    }
  };

  const filteredParts = spareParts.filter(
    (part) =>
      part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockItems = spareParts.filter((p) => p.stock <= p.minStock && p.isActive);
  const totalValue = spareParts.reduce(
    (sum, p) => sum + p.stock * Number(p.buyPrice),
    0
  );

  return (
    <RoleGuard allowedRoles={["OWNER", "ADMIN"]}>
      <div className="min-h-screen bg-background text-foreground">
        {/* Main Content */}
        <div className="p-8 space-y-6">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-foreground mb-2">
            Katalog Produk & Inventori
          </h2>
          <p className="text-muted-foreground">
            Kelola stok sparepart, harga, dan produk bengkel
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Item
              </CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {spareParts.filter((p) => p.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Item aktif
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Stok Rendah
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-500">
                {lowStockItems.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Perlu restock
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Nilai Aset
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                Rp {(totalValue / 1000000).toFixed(1)}jt
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total modal stok
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Unit
              </CardTitle>
              <Box className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {spareParts.reduce((sum, p) => sum + p.stock, 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Unit fisik
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Cari sparepart..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <ExportButton
              title="Laporan_Inventory"
              onExport={async (format, orientation) => {
                  const exportData: InventoryItemExport[] = filteredParts.map(part => ({
                      id: part.id,
                      sku: part.code,
                      name: part.name,
                      quantity: part.stock,
                      unit: part.unit,
                      unitPrice: part.buyPrice,
                      totalValue: part.stock * part.buyPrice,
                      lowStockThreshold: part.minStock
                  }));
                  return await exportInventory(exportData, format, orientation);
              }}
            />
            <Button 
              className="gap-2"
              onClick={() => {
                setDialogMode("create");
                setSelectedPart(undefined);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Tambah Produk
            </Button>
          </div>
        </div>

        {/* Inventory Table */}
        <Card className="border-border bg-card">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground animate-pulse" />
                <p className="text-muted-foreground">Memuat data inventory...</p>
              </div>
            ) : spareParts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  Belum ada produk/sparepart
                </p>
                <Button 
                  className="gap-2"
                  onClick={() => {
                    setDialogMode("create");
                    setSelectedPart(undefined);
                    setDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Tambah Produk Pertama
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Kode
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Nama Produk
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Stok
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Harga Beli
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Harga Jual
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredParts.map((part) => (
                      <tr key={part.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline">{part.code}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-foreground">
                            {part.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Unit: {part.unit}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-foreground font-medium">
                            {part.stock} {part.unit}
                          </div>
                          {part.stock <= part.minStock && (
                            <Badge className="bg-red-900/40 text-red-500 border-red-900 text-[10px] mt-1 hover:bg-red-900/60">
                              Stok Menipis
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-muted-foreground">
                            Rp {Number(part.buyPrice).toLocaleString("id-ID")}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-green-500">
                            Rp {Number(part.sellPrice).toLocaleString("id-ID")}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            className={
                              part.isActive
                                ? "bg-green-900/40 text-green-500 border-green-900"
                                : "bg-gray-800 text-gray-400 border-gray-700"
                            }
                          >
                            {part.isActive ? "Aktif" : "Non-Aktif"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-950/20 text-xs py-1 h-8"
                              onClick={() => {
                                setSelectedPart(part);
                                setStockInOpen(true);
                              }}
                            >
                              + Masuk
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/20 text-xs py-1 h-8"
                              onClick={() => {
                                setSelectedPart(part);
                                setStockOutOpen(true);
                              }}
                            >
                              - Keluar
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                setSelectedPart(part);
                                setDialogMode("edit");
                                setDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                              onClick={() => handleDelete(part.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <SparepartDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        sparepart={selectedPart}
        onSuccess={fetchSpareParts}
      />
      {/* Stok Masuk Dialog */}
      {selectedPart && (
        <Dialog open={stockInOpen} onOpenChange={setStockInOpen}>
          <DialogContent className="max-w-md bg-card border border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground font-black">
                <Box className="h-5 w-5 text-green-600" />
                Kelola Stok Masuk (Restock)
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Catat penambahan stok fisik barang yang masuk ke inventori.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleStockInSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-foreground">Nama Barang</Label>
                <Input value={selectedPart.name} disabled className="bg-muted text-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="in-qty" className="text-foreground">Jumlah Masuk</Label>
                  <Input 
                    id="in-qty" 
                    type="number" 
                    min={1} 
                    required 
                    value={stockInForm.qty}
                    onChange={(e) => setStockInForm({ ...stockInForm, qty: parseInt(e.target.value) || 0 })}
                    className="text-foreground bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Satuan</Label>
                  <Input value={selectedPart.unit} disabled className="bg-muted text-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="in-supplier" className="text-foreground">Supplier / Penyuplai</Label>
                <Input 
                  id="in-supplier" 
                  type="text" 
                  placeholder="Nama Vendor / Supplier" 
                  required
                  value={stockInForm.supplier}
                  onChange={(e) => setStockInForm({ ...stockInForm, supplier: e.target.value })}
                  className="text-foreground bg-background"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="in-price" className="text-foreground">Harga Beli Baru (Rp)</Label>
                  <Input 
                    id="in-price" 
                    type="number" 
                    min={0}
                    required
                    value={stockInForm.buyPrice}
                    onChange={(e) => setStockInForm({ ...stockInForm, buyPrice: parseInt(e.target.value) || 0 })}
                    className="text-foreground bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="in-date" className="text-foreground">Tanggal Masuk</Label>
                  <Input 
                    id="in-date" 
                    type="date" 
                    required
                    value={stockInForm.date}
                    onChange={(e) => setStockInForm({ ...stockInForm, date: e.target.value })}
                    className="text-foreground bg-background"
                  />
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStockInOpen(false)}
                  disabled={stockLoading}
                  className="text-foreground"
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={stockLoading}
                  className="bg-green-600 hover:bg-green-700 text-white gap-2"
                >
                  {stockLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Simpan Stok Masuk
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Stok Keluar Dialog */}
      {selectedPart && (
        <Dialog open={stockOutOpen} onOpenChange={setStockOutOpen}>
          <DialogContent className="max-w-md bg-card border border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground font-black">
                <Box className="h-5 w-5 text-orange-600" />
                Kelola Stok Keluar (Penyesuaian)
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Catat pengurangan stok fisik barang untuk keperluan internal atau penyesuaian.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleStockOutSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-foreground">Nama Barang</Label>
                <Input value={selectedPart.name} disabled className="bg-muted text-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="out-qty" className="text-foreground">Jumlah Keluar</Label>
                  <Input 
                    id="out-qty" 
                    type="number" 
                    min={1} 
                    max={selectedPart.stock}
                    required 
                    value={stockOutForm.qty}
                    onChange={(e) => setStockOutForm({ ...stockOutForm, qty: parseInt(e.target.value) || 0 })}
                    className="text-foreground bg-background"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">Sisa stok: {selectedPart.stock} {selectedPart.unit}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Satuan</Label>
                  <Input value={selectedPart.unit} disabled className="bg-muted text-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="out-desc" className="text-foreground">Keperluan / Pelanggan</Label>
                <Input 
                  id="out-desc" 
                  type="text" 
                  placeholder="Contoh: Dipakai servis motor budi, Stok pecah/rusak" 
                  required
                  value={stockOutForm.description}
                  onChange={(e) => setStockOutForm({ ...stockOutForm, description: e.target.value })}
                  className="text-foreground bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="out-date" className="text-foreground">Tanggal Keluar</Label>
                <Input 
                  id="out-date" 
                  type="date" 
                  required
                  value={stockOutForm.date}
                  onChange={(e) => setStockOutForm({ ...stockOutForm, date: e.target.value })}
                  className="text-foreground bg-background"
                />
              </div>

              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStockOutOpen(false)}
                  disabled={stockLoading}
                  className="text-foreground"
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={stockLoading}
                  className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
                >
                  {stockLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Simpan Stok Keluar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      <Toaster />
      </div>
    </RoleGuard>
  );
}
