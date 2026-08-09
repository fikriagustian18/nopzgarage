"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Briefcase,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  RefreshCw,
  Info,
  ArrowLeft,
} from "lucide-react";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  getJabatans,
  createJabatan,
  updateJabatan,
  deleteJabatan,
} from "@/lib/actions/jabatan";

interface Jabatan {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  activeEmployeeCount: number;
}

export default function Page() {
  const router = useRouter();
  const [jabatans, setJabatans] = useState<Jabatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog States
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedJabatan, setSelectedJabatan] = useState<Jabatan | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await getJabatans();
      if (res.success && res.jabatans) {
        setJabatans(res.jabatans as unknown as Jabatan[]);
      } else {
        toast.error(res.error || "Gagal memuat data jabatan");
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  }

  // Open Edit Dialog
  function openEdit(j: Jabatan) {
    setSelectedJabatan(j);
    setFormData({
      name: j.name,
      description: j.description || "",
    });
    setEditOpen(true);
  }

  // Open Delete Confirmation
  function openDelete(j: Jabatan) {
    setSelectedJabatan(j);
    setDeleteOpen(true);
  }

  // Handle Add Position
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Nama jabatan wajib diisi");
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await createJabatan({
        name: formData.name,
        description: formData.description,
      });

      if (res.success) {
        toast.success(`Berhasil menambahkan jabatan ${formData.name}`);
        setCreateOpen(false);
        setFormData({ name: "", description: "" });
        fetchData();
      } else {
        toast.error(res.error || "Gagal menambahkan jabatan");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setSubmitLoading(false);
    }
  }

  // Handle Update Position
  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedJabatan) {
      return;
    }

    if (!formData.name) {
      toast.error("Nama jabatan wajib diisi");
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await updateJabatan({
        id: selectedJabatan.id,
        name: formData.name,
        description: formData.description,
      });

      if (res.success) {
        toast.success("Jabatan berhasil diperbarui");
        setEditOpen(false);
        fetchData();
      } else {
        toast.error(res.error || "Gagal memperbarui jabatan");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setSubmitLoading(false);
    }
  }

  // Handle Delete Position
  async function handleDelete() {
    if (!selectedJabatan) {
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await deleteJabatan(selectedJabatan.id);

      if (res.success) {
        toast.success("Jabatan berhasil dihapus");
        setDeleteOpen(false);
        fetchData();
      } else {
        toast.error(res.error || "Gagal menghapus jabatan");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setSubmitLoading(false);
    }
  }

  // Filter positions
  const filteredJabatans = jabatans.filter((j) => {
    return (
      j.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (j.description && j.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <RoleGuard allowedRoles={["OWNER"]}>
      <div className="min-h-screen bg-background text-foreground p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Manajemen Jabatan (Posisi Kerja)
            </h1>
            <p className="text-muted-foreground mt-1">
              Atur master data jabatan bengkel seperti Mekanik Utama, Kasir, Helper, dan Staff Administrasi.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              size="default"
              onClick={() => {
                router.push("/admin/employees");
              }}
              className="gap-2 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={fetchData}
              className="gap-2 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" /> Refresh Data
            </Button>
            <Button
              size="default"
              onClick={() => {
                setFormData({ name: "", description: "" });
                setCreateOpen(true);
              }}
              className="gap-2 bg-primary hover:bg-primary/95 text-white"
            >
              <Plus className="h-4 w-4" /> Tambah Jabatan
            </Button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan nama jabatan atau penjelasan tugas..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table representation */}
        <Card className="border-border bg-card overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-24">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                <p className="text-muted-foreground text-sm">Memuat data jabatan...</p>
              </div>
            ) : filteredJabatans.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Briefcase className="h-16 w-16 mx-auto mb-4 opacity-10" />
                <h3 className="font-bold text-lg text-foreground">Tidak Ada Jabatan</h3>
                <p className="text-sm max-w-xs mx-auto mt-1">
                  Master data jabatan masih kosong. Klik tombol "Tambah Jabatan" untuk memulai.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50 border-b">
                    <TableRow>
                      <TableHead className="font-bold">Nama Jabatan</TableHead>
                      <TableHead className="font-bold">Deskripsi Tugas</TableHead>
                      <TableHead className="font-bold text-center">Jumlah Staff Aktif</TableHead>
                      <TableHead className="font-bold text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y">
                    {filteredJabatans.map((j) => (
                      <TableRow key={j.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-semibold text-foreground py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                              <Briefcase className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-foreground">{j.name}</p>
                              <span className="text-[10px] text-muted-foreground font-mono mt-0.5 block">ID: {j.id.slice(-6).toUpperCase()}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {j.description || <span className="italic text-muted-foreground/50">Tidak ada deskripsi</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-bold">
                            {j.activeEmployeeCount} Orang
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                              title="Edit Jabatan"
                              onClick={() => openEdit(j)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                              title="Hapus Jabatan"
                              onClick={() => openDelete(j)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Position Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle className="font-bold">Tambah Jabatan Baru</DialogTitle>
                <DialogDescription>
                  Masukkan nama posisi baru dan deskripsi singkat tugas kerjanya.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-xs font-semibold">Nama Jabatan</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Mekanik Utama, Kasir, Helper"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="description" className="text-xs font-semibold">Deskripsi Tugas</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Contoh: Bertugas menangani servis ringan dan kelistrikan motor."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateOpen(false);
                  }}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-primary text-white"
                  disabled={submitLoading}
                >
                  {submitLoading ? "Menyimpan..." : "Tambah Jabatan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Position Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleUpdate}>
              <DialogHeader>
                <DialogTitle className="font-bold">Edit Detail Jabatan</DialogTitle>
                <DialogDescription>
                  Perbarui nama jabatan atau deskripsi tugas yang bersangkutan.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-1">
                  <Label htmlFor="edit-name" className="text-xs font-semibold">Nama Jabatan</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-description" className="text-xs font-semibold">Deskripsi Tugas</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditOpen(false);
                  }}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-primary text-white"
                  disabled={submitLoading}
                >
                  {submitLoading ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Position Dialog */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="font-bold text-red-600">Hapus Data Jabatan</DialogTitle>
              <DialogDescription className="pt-2">
                Apakah Anda yakin ingin menghapus jabatan <strong>{selectedJabatan?.name}</strong> dari master data?
                <br />
                <span className="text-xs text-muted-foreground block mt-2 bg-yellow-50 p-2.5 rounded border border-yellow-200">
                  <Info className="h-3.5 w-3.5 inline mr-1 text-yellow-600 align-text-bottom" />
                  Penghapusan akan ditolak jika masih ada karyawan aktif dengan jabatan ini.
                </span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDeleteOpen(false);
                }}
              >
                Batal
              </Button>
              <Button
                type="button"
                className="bg-red-600 text-white hover:bg-red-700 font-bold"
                disabled={submitLoading}
                onClick={handleDelete}
              >
                {submitLoading ? "Memproses..." : "Ya, Hapus Jabatan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}
