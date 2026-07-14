'use client';

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSparePart, updateSparePart, CreateSparePartInput } from "@/app/actions/inventory";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { notifySparepartAdded, notifySparepartUpdated } from "@/hooks/useNotification";

type SparePart = {
  id: string;
  code: string;
  name: string;
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
    stock: 0,
    minStock: 5,
    unit: "pcs",
    buyPrice: 0,
    sellPrice: 0,
  });

  useEffect(() => {
    if (sparepart && mode === "edit") {
      setFormData({
        code: sparepart.code,
        name: sparepart.name,
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
        stock: 0,
        minStock: 5,
        unit: "pcs",
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
            {mode === "create" && " Tambah Produk Baru"}
            {mode === "edit" && "✏️ Edit Produk"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" && "Masukkan data sparepart/produk baru ke sistem"}
            {mode === "edit" && "Update informasi produk"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Kode Produk <span className="text-red-500">*</span></Label>
              <Input
                id="code"
                placeholder="Contoh: OLI-HM-01"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nama Produk <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                placeholder="Contoh: Oli MPX2 0.8L"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="unit">Satuan</Label>
              <Input
                id="unit"
                placeholder="pcs, box, botol"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buyPrice">Harga Beli (Modal)</Label>
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
              <Label htmlFor="sellPrice">Harga Jual</Label>
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
