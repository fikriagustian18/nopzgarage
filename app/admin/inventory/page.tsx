// app/admin/inventory/page.tsx - Inventory Management
"use client";

import { useState, useEffect } from "react";
import { RoleGuard } from "@/components/shared/RoleGuard";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  Database,
  CircleX,
  RotateCcw,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { getSpareParts, deleteSparePart } from "@/lib/actions/inventory";
import { SparepartDialog } from "@/components/dialogs/SparepartDialog";
import { SparepartDetailDialog } from "@/components/dialogs/SparepartDetailDialog";
import { ExportButton } from "@/components/export/ExportButton";
import { exportInventory } from "@/lib/export/reports/inventoryExport";
import type { InventoryItemExport } from "@/lib/export/types";
import { toast } from "@/hooks/useToast";

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
  createdAt: Date;
  updatedAt: Date;
};

export default function Page() {
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dialog States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedPart, setSelectedPart] = useState<SparePart | undefined>();

  // Detail Dialog State
  const [detailOpen, setDetailOpen] = useState(false);

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
      toast({
        variant: "destructive",
        title: "❌ Error",
        description: "Gagal mengambil data inventory",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Apakah anda yakin ingin menghapus data barang ini?")) {
      const res = await deleteSparePart(id);
      if (res.success) {
        toast({
          title: "✅ Berhasil!",
          description: "Data barang telah dinonaktifkan.",
        });
        fetchSpareParts();
      } else {
        toast({
          variant: "destructive",
          title: "❌ Gagal",
          description: res.error || "Gagal menghapus data barang",
        });
      }
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  // Filter Calculation
  const filteredParts = spareParts.filter((part) => {
    if (!part.isActive) return false;

    // Search query match (Name, Code, Category)
    const matchesSearch =
      part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (part.category && part.category.toLowerCase().includes(searchQuery.toLowerCase()));

    // Category match
    const matchesCategory =
      categoryFilter === "all" || (part.category || "Oli") === categoryFilter;

    // Status match
    let matchesStatus = true;
    if (statusFilter === "available") {
      matchesStatus = part.stock > part.minStock;
    } else if (statusFilter === "low") {
      matchesStatus = part.stock > 0 && part.stock <= part.minStock;
    } else if (statusFilter === "out") {
      matchesStatus = part.stock === 0;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Stats Calculations
  const activeParts = spareParts.filter((p) => p.isActive);
  const totalItems = activeParts.length;
  const availableItems = activeParts.filter((p) => p.stock > 0).length;
  const lowStockItems = activeParts.filter((p) => p.stock > 0 && p.stock <= p.minStock).length;
  const outOfStockItems = activeParts.filter((p) => p.stock === 0).length;

  // Pagination Logic
  const totalPages = Math.ceil(filteredParts.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedParts = filteredParts.slice(startIndex, startIndex + itemsPerPage);

  // Extract unique categories for dropdown filter
  const availableCategories = Array.from(
    new Set(spareParts.map((p) => p.category || "Oli"))
  );

  return (
    <RoleGuard allowedRoles={["OWNER", "ADMIN"]}>
      <div className="min-h-screen bg-background text-foreground">
        <div className="p-8 space-y-6">
          {/* Breadcrumb & Header */}
          <div>
            <div className="text-xs text-muted-foreground mb-1 font-medium">
              Beranda &gt; <span className="text-foreground">Inventory</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-foreground">
                  Inventory
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Kelola data stok suku cadang dan bahan yang tersedia di bengkel.
                </p>
              </div>
              <Button
                className="gap-2 bg-foreground text-background hover:bg-foreground/90 font-semibold"
                onClick={() => {
                  setDialogMode("create");
                  setSelectedPart(undefined);
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Tambah Barang
              </Button>
            </div>
          </div>

          {/* 4 Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Card 1: Total Barang */}
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Total Barang
                </CardTitle>
                <div className="p-2 bg-muted/60 rounded-md">
                  <Package className="h-5 w-5 text-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-foreground">
                  {totalItems}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Semua barang terdaftar
                </p>
              </CardContent>
            </Card>

            {/* Card 2: Stok Tersedia */}
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Stok Tersedia
                </CardTitle>
                <div className="p-2 bg-muted/60 rounded-md">
                  <Database className="h-5 w-5 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-foreground">
                  {availableItems}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Barang dengan stok &gt; 0
                </p>
              </CardContent>
            </Card>

            {/* Card 3: Stok Menipis */}
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Stok Menipis
                </CardTitle>
                <div className="p-2 bg-amber-500/10 rounded-md">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-foreground">
                  {lowStockItems}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Stok ≤ Minimum
                </p>
              </CardContent>
            </Card>

            {/* Card 4: Stok Habis */}
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Stok Habis
                </CardTitle>
                <div className="p-2 bg-red-500/10 rounded-md">
                  <CircleX className="h-5 w-5 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-foreground">
                  {outOfStockItems}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Stok = 0
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search, Filters & Export */}
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama barang, kode, atau kategori..."
                className="pl-9 bg-card"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Category Dropdown Filter */}
            <select
              className="h-10 px-3 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring w-full lg:w-48"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Semua Kategori</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Stock Status Dropdown Filter */}
            <select
              className="h-10 px-3 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring w-full lg:w-48"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Semua Status Stok</option>
              <option value="available">Tersedia</option>
              <option value="low">Stok Menipis</option>
              <option value="out">Stok Habis</option>
            </select>

            {/* Reset Button */}
            <Button
              variant="outline"
              className="gap-2 shrink-0 border-border bg-card"
              onClick={handleResetFilters}
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>

            {/* Export Button */}
            <ExportButton
              title="Laporan_Inventory"
              onExport={async (format, orientation) => {
                const exportData: InventoryItemExport[] = filteredParts.map((part) => ({
                  id: part.id,
                  sku: part.code,
                  name: part.name,
                  quantity: part.stock,
                  unit: part.unit,
                  unitPrice: Number(part.buyPrice),
                  totalValue: part.stock * Number(part.buyPrice),
                  lowStockThreshold: part.minStock,
                }));
                return await exportInventory(exportData, format, orientation);
              }}
            />
          </div>

          {/* Table Card */}
          <Card className="border-border bg-card shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground animate-pulse" />
                  <p className="text-muted-foreground text-sm">Memuat data inventory...</p>
                </div>
              ) : filteredParts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4 font-medium text-sm">
                    Tidak ada data barang yang sesuai
                  </p>
                  <Button
                    variant="outline"
                    className="gap-2 text-xs"
                    onClick={handleResetFilters}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset Filter
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/40 border-b border-border text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3.5 text-center w-12">No.</th>
                        <th className="px-4 py-3.5">Kode Barang</th>
                        <th className="px-4 py-3.5">Nama Barang</th>
                        <th className="px-4 py-3.5">Kategori</th>
                        <th className="px-4 py-3.5">Satuan</th>
                        <th className="px-4 py-3.5 text-center">Stok</th>
                        <th className="px-4 py-3.5 text-center">Stok Minimum</th>
                        <th className="px-4 py-3.5 text-center">Status</th>
                        <th className="px-4 py-3.5 text-right">Harga Beli</th>
                        <th className="px-4 py-3.5 text-center w-28">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {paginatedParts.map((part, idx) => {
                        const rowNumber = startIndex + idx + 1;

                        // Status Badge styling
                        let statusBadge;
                        if (part.stock === 0) {
                          statusBadge = (
                            <Badge className="bg-muted border border-border text-foreground font-normal hover:bg-muted text-[11px] px-2.5 py-0.5">
                              Stok Habis
                            </Badge>
                          );
                        } else if (part.stock <= part.minStock) {
                          statusBadge = (
                            <Badge className="bg-muted border border-border text-foreground font-normal hover:bg-muted text-[11px] px-2.5 py-0.5">
                              Stok Menipis
                            </Badge>
                          );
                        } else {
                          statusBadge = (
                            <Badge className="bg-muted border border-border text-foreground font-normal hover:bg-muted text-[11px] px-2.5 py-0.5">
                              Tersedia
                            </Badge>
                          );
                        }

                        return (
                          <tr
                            key={part.id}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-4 py-3 text-center text-muted-foreground font-medium">
                              {rowNumber}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap font-mono text-xs font-semibold">
                              {part.code}
                            </td>
                            <td className="px-4 py-3 font-semibold text-foreground">
                              {part.name}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                              {part.category || "Oli"}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                              {part.unit}
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-foreground">
                              {part.stock}
                            </td>
                            <td className="px-4 py-3 text-center text-muted-foreground font-medium">
                              {part.minStock}
                            </td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              {statusBadge}
                            </td>
                            <td className="px-4 py-3 text-right font-medium whitespace-nowrap text-foreground">
                              Rp {Number(part.buyPrice).toLocaleString("id-ID")}
                            </td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                {/* Detail Button */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                  title="Lihat Detail"
                                  onClick={() => {
                                    setSelectedPart(part);
                                    setDetailOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {/* Edit Button */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                  title="Edit Barang"
                                  onClick={() => {
                                    setSelectedPart(part);
                                    setDialogMode("edit");
                                    setDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {/* Delete Button */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                                  title="Hapus Barang"
                                  onClick={() => handleDelete(part.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination Footer */}
          {!isLoading && filteredParts.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="text-xs text-muted-foreground">
                Menampilkan{" "}
                <span className="font-semibold text-foreground">
                  {startIndex + 1}
                </span>{" "}
                -{" "}
                <span className="font-semibold text-foreground">
                  {Math.min(startIndex + itemsPerPage, filteredParts.length)}
                </span>{" "}
                dari{" "}
                <span className="font-semibold text-foreground">
                  {filteredParts.length}
                </span>{" "}
                data
              </div>

              <div className="flex items-center gap-1">
                {/* First Page */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 border-border"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>

                {/* Prev Page */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 border-border"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - currentPage) <= 1
                  )
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && p - prev > 1;

                    return (
                      <div key={p} className="flex items-center gap-1">
                        {showEllipsis && (
                          <span className="text-xs text-muted-foreground px-1">
                            ...
                          </span>
                        )}
                        <Button
                          variant={currentPage === p ? "default" : "outline"}
                          size="sm"
                          className={`h-8 w-8 p-0 border-border ${
                            currentPage === p
                              ? "bg-foreground text-background hover:bg-foreground/90 font-bold"
                              : ""
                          }`}
                          onClick={() => setCurrentPage(p)}
                        >
                          {p}
                        </Button>
                      </div>
                    );
                  })}

                {/* Next Page */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 border-border"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Last Page */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 border-border"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tambah / Edit Sparepart Dialog */}
      <SparepartDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        sparepart={selectedPart}
        onSuccess={fetchSpareParts}
      />

      {/* Detail & Stok Masuk/Keluar Dialog */}
      <SparepartDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        sparepart={selectedPart}
        onSuccess={fetchSpareParts}
      />
    </RoleGuard>
  );
}
