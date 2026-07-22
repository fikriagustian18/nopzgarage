'use client';

import { useState, useEffect } from "react";
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
import { createSparePart, updateSparePart, CreateSparePartInput } from "@/app/actions/inventory";
import { toast } from "@/hooks/useToast";
import { Loader2 } from "lucide-react";
import { notifySparepartAdded, notifySparepartUpdated } from "@/hooks/useNotification";

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
};

type SparepartDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  sparepart?: SparePart;
  onSuccess?: () => void;
};

export function SparepartDialog({
  open,
  onOpenChange,
  mode,
  sparepart,
  onSuccess,
}: SparepartDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateSparePartInput>({
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
        code: "",
        name: "",
        category: "Oli",
        stock: 0,
        minStock: 5,
        unit: "Pcs",
        buyPrice: 0,
        sellPrice: 0,
      });
    }
  }, [sparepart, mode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      
      if (mode === "create") {
        result = await createSparePart(formData);
      } else {
        result = await updateSparePart(sparepart!.id, formData);
      }

      if (result.success) {
        toast({
          title: "✅ Berhasil!",
          description: mode === "create" 
            ? "Produk berhasil ditambahkan" 
            : "Produk berhasil diupdate",
        });
        
        // Add notification
        if (mode === "create" && result.sparePart) {
          notifySparepartAdded(formData.name, result.sparePart.id);
        } else if (mode === "edit" && sparepart) {
          notifySparepartUpdated(formData.name, sparepart.id);
        }

        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "❌ Gagal",
          description: result.error || "Terjadi kesalahan",
        });
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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Kode Barang <span className="text-red-500">*</span></Label>
              <Input
                id="code"
                placeholder="Contoh: BRG-0001"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nama Barang <span className="text-red-500">*</span></Label>
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
              <Label htmlFor="category">Kategori <span className="text-red-500">*</span></Label>
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
              <Label htmlFor="unit">Satuan <span className="text-red-500">*</span></Label>
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
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
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
                onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
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
                onChange={(e) => setFormData({ ...formData, buyPrice: parseFloat(e.target.value) || 0 })}
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
                onChange={(e) => setFormData({ ...formData, sellPrice: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t mt-4">
            <Button
              type="Button"
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
