"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
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
import { toast } from "@/hooks/useToast";
import { notifySparepartAdded, notifySparepartUpdated } from "@/hooks/useNotification";
import {
  createSparePart,
  updateSparePart,
  generateNextSparePartCode,
} from "@/lib/actions/inventory";
import type { CreateSparePartInput } from "@/lib/actions/inventory";

interface SparePart {
  id: string;
  code: string;
  name: string;
  category?: string;
  stock: number;
  minStock: number;
  unit: string;
  buyPrice: number;
  sellPrice: number;
}

interface SparepartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  sparepart?: SparePart | null;
  onSuccess?: () => void;
}

interface FormState {
  code: string;
  name: string;
  category: string;
  stock: string | number;
  minStock: string | number;
  unit: string;
  buyPrice: string | number;
  sellPrice: string | number;
}

export function SparepartDialog({
  open,
  onOpenChange,
  mode,
  sparepart,
  onSuccess,
}: SparepartDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormState>({
    code: "",
    name: "",
    category: "Oli",
    stock: 0,
    minStock: 5,
    unit: "Pcs",
    buyPrice: 0,
    sellPrice: 0,
  });

  useEffect(() => {
    let isMounted = true;
    if (open) {
      if (sparepart && mode === "edit") {
        setFormData({
          code: sparepart.code,
          name: sparepart.name,
          category: sparepart.category || "Oli",
          stock: sparepart.stock,
          minStock: sparepart.minStock,
          unit: sparepart.unit,
          buyPrice: sparepart.buyPrice,
          sellPrice: sparepart.sellPrice,
        });
      } else {
        setFormData({
          code: "Memuat...",
          name: "",
          category: "Oli",
          stock: 0,
          minStock: 5,
          unit: "Pcs",
          buyPrice: 0,
          sellPrice: 0,
        });
        generateNextSparePartCode().then((res) => {
          if (isMounted && res.success && res.code) {
            setFormData((prev) => ({ ...prev, code: res.code }));
          }
        });
      }
    }
    return () => {
      isMounted = false;
    };
  }, [sparepart, mode, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const stock = formData.stock === "" ? Number.NaN : Number(formData.stock);
      const minStock = formData.minStock === "" ? Number.NaN : Number(formData.minStock);
      const buyPrice = formData.buyPrice === "" ? Number.NaN : Number(formData.buyPrice);
      const sellPrice = formData.sellPrice === "" ? Number.NaN : Number(formData.sellPrice);

      if (
        !Number.isInteger(stock) || stock < 0 ||
        !Number.isInteger(minStock) || minStock < 0 ||
        !Number.isFinite(buyPrice) || buyPrice < 0 ||
        !Number.isFinite(sellPrice) || sellPrice < 0
      ) {
        toast({
          variant: "destructive",
          title: "❌ Data tidak valid",
          description: "Semua field angka wajib diisi. Stok harus bilangan bulat dan seluruh nilai tidak boleh negatif.",
        });
        setLoading(false);
        return;
      }

      const payload: CreateSparePartInput = {
        code: formData.code,
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        stock,
        minStock,
        buyPrice,
        sellPrice,
      };

      const result =
        mode === "create"
          ? await createSparePart(payload)
          : sparepart
          ? await updateSparePart(sparepart.id, payload)
          : null;

      if (!result || !result.success) {
        toast({
          variant: "destructive",
          title: "❌ Gagal",
          description: result?.error || "Terjadi kesalahan",
        });
        return;
      }

      toast({
        title: "✅ Berhasil!",
        description:
          mode === "create"
            ? "Produk berhasil ditambahkan"
            : "Produk berhasil diupdate",
      });

      if (mode === "create" && result.sparePart) {
        notifySparepartAdded(formData.name, result.sparePart.id);
      } else if (mode === "edit" && sparepart) {
        notifySparepartUpdated(formData.name, sparepart.id);
      }

      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
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
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {mode === "create" && "➕ Tambah Barang Baru"}
            {mode === "edit" && "✏️ Edit Barang"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" && "Masukkan data suku cadang / bahan baru ke sistem"}
            {mode === "edit" && "Update informasi data barang"}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 mt-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Kode Barang</Label>
              <Input
                id="code"
                value={formData.code}
                readOnly
                disabled
                className="bg-muted text-muted-foreground font-mono font-semibold cursor-not-allowed"
              />
              <p className="text-[11px] text-muted-foreground">Otomatis dibuat oleh sistem</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Nama Barang <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Contoh: Oli Mesin Federal Matic 10W-30"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">
                Kategori <span className="text-red-500">*</span>
              </Label>
              <select
                id="category"
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="Oli">Oli</option>
                <option value="Kelistrikan">Kelistrikan</option>
                <option value="Rem">Rem</option>
                <option value="Filter">Filter</option>
                <option value="Drivetrain">Drivetrain</option>
                <option value="Ban">Ban</option>
                <option value="Aksesoris">Aksesoris</option>
                <option value="Umum">Umum</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">
                Satuan <span className="text-red-500">*</span>
              </Label>
              <Input
                id="unit"
                placeholder="Botol, Pcs, Set, Dus"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock">Stok Awal</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Min. Stok</Label>
              <Input
                id="minStock"
                type="number"
                min="0"
                value={formData.minStock}
                onChange={(e) =>
                  setFormData({ ...formData, minStock: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buyPrice">Harga Beli (Rp)</Label>
              <Input
                id="buyPrice"
                type="number"
                min="0"
                value={formData.buyPrice}
                onChange={(e) =>
                  setFormData({ ...formData, buyPrice: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellPrice">Harga Jual (Rp)</Label>
              <Input
                id="sellPrice"
                type="number"
                min="0"
                value={formData.sellPrice}
                onChange={(e) =>
                  setFormData({ ...formData, sellPrice: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t mt-4">
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
              className="flex-1 gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "create" ? "Simpan Produk" : "Update Produk"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
