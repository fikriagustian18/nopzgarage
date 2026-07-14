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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getSpareParts, deleteSparePart } from "@/app/actions/inventory"; 
import { SparepartDialog } from "@/components/SparepartDialog"; 
import { Toaster } from "@/components/ui/toaster";
import { ExportButton } from "@/components/export/ExportButton";
import { exportInventory } from "@/lib/export/reports/inventory-export";
import type { InventoryItemExport } from "@/lib/export/types";

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
                              variant="ghost" 
                              size="sm"
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
                              onClick={() => handleDelete(part.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
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
      <Toaster />
      </div>
    </RoleGuard>
  );
}
