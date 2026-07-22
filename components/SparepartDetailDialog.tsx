"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { addStock, reduceStock } from "@/app/actions/inventory";
import { toast } from "@/hooks/useToast";
import { Loader2, Package, ArrowUpRight, ArrowDownLeft } from "lucide-react";

type SparePart = {
  id: string;
  code: string;
  name: string;
  category?: string;
  stock: number;
  minStock: number;
  unit: string;
  buyPrice: number;
  sellPrice: number;
  isActive: boolean;
};

type SparepartDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sparepart?: SparePart;
  onSuccess?: () => void;
};

export function SparepartDetailDialog({
  open,
  onOpenChange,
  sparepart,
  onSuccess,
}: SparepartDetailDialogProps) {
  const [activeTab, setActiveTab] = useState<"detail" | "stockIn" | "stockOut">("detail");
  const [loading, setLoading] = useState(false);

  const [stockInForm, setStockInForm] = useState({
    qty: 1,
    supplier: "",
    buyPrice: sparepart ? Number(sparepart.buyPrice) : 0,
    date: new Date().toISOString().split("T")[0],
  });

  const [stockOutForm, setStockOutForm] = useState({
    qty: 1,
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  if (!sparepart) return null;

  const handleStockInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await addStock(
        sparepart.id,
        stockInForm.qty,
        stockInForm.supplier,
        stockInForm.buyPrice || Number(sparepart.buyPrice),
        stockInForm.date
      );

      if (res.success) {
        toast({
          title: "✅ Stok Masuk Berhasil!",
          description: `Berhasil menambahkan ${stockInForm.qty} ${sparepart.unit}.`,
        });
        setActiveTab("detail");
        if (onSuccess) onSuccess();
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
      setLoading(false);
    }
  };

  const handleStockOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await reduceStock(
        sparepart.id,
        stockOutForm.qty,
        stockOutForm.description,
        stockOutForm.date
      );

      if (res.success) {
        toast({
          title: "✅ Stok Keluar Berhasil!",
          description: `Berhasil mencatat pengeluaran ${stockOutForm.qty} ${sparepart.unit}.`,
        });
        setActiveTab("detail");
        if (onSuccess) onSuccess();
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
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (sparepart.stock === 0) {
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Stok Habis</Badge>;
    }
    if (sparepart.stock <= sparepart.minStock) {
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">Stok Menipis</Badge>;
    }
    return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Tersedia</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Detail Barang
            </DialogTitle>
            {getStatusBadge()}
          </div>
          <DialogDescription>
            Rincian informasi barang dan pengolahan stok persediaan.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Selector */}
        <div className="flex border-b border-border gap-2 mt-2">
          <button
            type="Button"
            className={`pb-2 px-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "detail"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("detail")}
          >
            Rincian
          </button>
          <button
            type="Button"
            className={`pb-2 px-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "stockIn"
                ? "border-emerald-600 text-emerald-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("stockIn")}
          >
            + Stok Masuk
          </button>
          <button
            type="Button"
            className={`pb-2 px-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "stockOut"
                ? "border-orange-600 text-orange-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("stockOut")}
          >
            - Stok Keluar
          </button>
        </div>

        {/* Content: Rincian */}
        {activeTab === "detail" && (
          <div className="space-y-4 py-3">
            <div className="bg-muted/40 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Kode Barang</span>
                  <span className="font-mono font-bold text-foreground">{sparepart.code}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Kategori</span>
                  <span className="font-medium text-foreground">{sparepart.category || "Oli"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-muted-foreground block">Nama Barang</span>
                  <span className="font-semibold text-base text-foreground">{sparepart.name}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 border rounded-md bg-background">
                <span className="text-xs text-muted-foreground block">Stok Saat Ini</span>
                <span className="text-xl font-bold text-foreground">{sparepart.stock}</span>
                <span className="text-[10px] text-muted-foreground block">{sparepart.unit}</span>
              </div>
              <div className="p-3 border rounded-md bg-background">
                <span className="text-xs text-muted-foreground block">Stok Minimum</span>
                <span className="text-xl font-bold text-foreground">{sparepart.minStock}</span>
                <span className="text-[10px] text-muted-foreground block">{sparepart.unit}</span>
              </div>
              <div className="p-3 border rounded-md bg-background">
                <span className="text-xs text-muted-foreground block">Satuan</span>
                <span className="text-xl font-bold text-foreground">{sparepart.unit}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 border rounded-md bg-muted/20">
              <div>
                <span className="text-xs text-muted-foreground block">Harga Beli (Modal)</span>
                <span className="text-base font-bold text-foreground">
                  Rp {Number(sparepart.buyPrice).toLocaleString("id-ID")}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Harga Jual</span>
                <span className="text-base font-bold text-emerald-600">
                  Rp {Number(sparepart.sellPrice).toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                onClick={() => setActiveTab("stockIn")}
              >
                <ArrowDownLeft className="h-4 w-4 mr-1 text-emerald-600" />
                Input Stok Masuk
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-orange-700 border-orange-300 hover:bg-orange-50"
                onClick={() => setActiveTab("stockOut")}
              >
                <ArrowUpRight className="h-4 w-4 mr-1 text-orange-600" />
                Input Stok Keluar
              </Button>
            </div>
          </div>
        )}

        {/* Content: Stok Masuk */}
        {activeTab === "stockIn" && (
          <form onSubmit={handleStockInSubmit} className="space-y-4 py-3">
            <div className="p-3 bg-emerald-50 text-emerald-900 rounded-md text-xs">
              Mencatat barang masuk dari supplier / restock. Jurnal otomatis akan dibuat.
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="stockInQty" className="text-xs">Jumlah Masuk ({sparepart.unit})</Label>
                <Input
                  id="stockInQty"
                  type="number"
                  min="1"
                  value={stockInForm.qty}
                  onChange={(e) => setStockInForm({ ...stockInForm, qty: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="stockInPrice" className="text-xs">Harga Beli Per Unit (Rp)</Label>
                <Input
                  id="stockInPrice"
                  type="number"
                  min="0"
                  value={stockInForm.buyPrice}
                  onChange={(e) => setStockInForm({ ...stockInForm, buyPrice: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="stockInSupplier" className="text-xs">Supplier / Catatan</Label>
              <Input
                id="stockInSupplier"
                placeholder="Contoh: PT Federal Oil Jaya"
                value={stockInForm.supplier}
                onChange={(e) => setStockInForm({ ...stockInForm, supplier: e.target.value })}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="Button" variant="outline" className="flex-1" onClick={() => setActiveTab("detail")}>
                Batal
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Simpan Stok Masuk
              </Button>
            </div>
          </form>
        )}

        {/* Content: Stok Keluar */}
        {activeTab === "stockOut" && (
          <form onSubmit={handleStockOutSubmit} className="space-y-4 py-3">
            <div className="p-3 bg-orange-50 text-orange-900 rounded-md text-xs">
              Mencatat pengeluaran barang untuk kebutuhan bengkel / barang rusak.
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="stockOutQty" className="text-xs">Jumlah Keluar ({sparepart.unit})</Label>
                <Input
                  id="stockOutQty"
                  type="number"
                  min="1"
                  max={sparepart.stock}
                  value={stockOutForm.qty}
                  onChange={(e) => setStockOutForm({ ...stockOutForm, qty: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="stockOutDate" className="text-xs">Tanggal</Label>
                <Input
                  id="stockOutDate"
                  type="date"
                  value={stockOutForm.date}
                  onChange={(e) => setStockOutForm({ ...stockOutForm, date: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="stockOutDesc" className="text-xs">Keterangan / Alasan Keluar</Label>
              <Input
                id="stockOutDesc"
                placeholder="Contoh: Digunakan untuk servis motor internal / rusak"
                value={stockOutForm.description}
                onChange={(e) => setStockOutForm({ ...stockOutForm, description: e.target.value })}
                required
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="Button" variant="outline" className="flex-1" onClick={() => setActiveTab("detail")}>
                Batal
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Simpan Stok Keluar
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
