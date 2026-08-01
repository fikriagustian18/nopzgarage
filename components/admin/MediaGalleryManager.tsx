"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { 
  ImagePlus, 
  Trash2, 
  Edit, 
  Eye, 
  EyeOff,
  Upload,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  getMediaGallery,
  createMediaItem,
  updateMediaItem,
  deleteMediaItem,
  MediaGalleryItem,
} from "@/lib/actions/mediaGallery";

type MediaType = "GALLERY" | "POSTER" | "BANNER" | "CAROUSEL";

export function MediaGalleryManager() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [items, setItems] = useState<MediaGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaGalleryItem | null>(null);
  const [filterType, setFilterType] = useState<MediaType | "ALL">("ALL");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    type: "GALLERY" as MediaType,
    category: "",
    displayOrder: 0,
  });

  async function loadItems() {
    setLoading(true);
    const data = await getMediaGallery(
      filterType !== "ALL" ? filterType : undefined
    );
    setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    loadItems();
  }, [filterType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.title || !formData.imageUrl) {
      toast.error("Title dan Image URL wajib diisi");
      return;
    }

    const payload = {
      ...formData,
      displayOrder: Number(formData.displayOrder) || 0,
    };

    const result = editingItem
      ? await updateMediaItem(editingItem.id, payload)
      : await createMediaItem(payload);

    if (result.success) {
      toast.success(
        editingItem
          ? "Media berhasil diupdate"
          : "Media berhasil ditambahkan"
      );
      setDialogOpen(false);
      resetForm();
      loadItems();
    } else {
      toast.error(result.error || "Gagal menyimpan media");
    }
  }

  function handleEdit(item: MediaGalleryItem) {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      imageUrl: item.imageUrl,
      type: item.type,
      category: item.category || "",
      displayOrder: item.displayOrder,
    });
    setDialogOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus media ini?")) {
      return;
    }

    const result = await deleteMediaItem(id);
    if (result.success) {
      toast.success("Media berhasil dihapus");
      loadItems();
    } else {
      toast.error(result.error || "Gagal menghapus media");
    }
  }

  async function handleToggleActive(item: MediaGalleryItem) {
    const result = await updateMediaItem(item.id, {
      isActive: !item.isActive,
    });

    if (result.success) {
      toast.success(
        item.isActive ? "Media disembunyikan" : "Media ditampilkan"
      );
      loadItems();
    } else {
      toast.error("Gagal mengubah status");
    }
  }

  function resetForm() {
    setEditingItem(null);
    setFormData({
      title: "",
      description: "",
      imageUrl: "",
      type: "GALLERY",
      category: "",
      displayOrder: 0,
    });
  }

  function handleDialogClose(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  }

  function handleFileClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    setIsUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (!res.ok) {
        throw new Error("Upload gagal");
      }

      const data = await res.json();
      setFormData(prev => ({ ...prev, imageUrl: data.url }));
      toast.success("File berhasil diupload");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Gagal mengupload file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-foreground">Media Gallery</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Upload gambar, poster, dan banner untuk website
          </p>
        </div>

        <Dialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
        >
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <ImagePlus className="h-4 w-4" />
              Tambah Media
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Media" : "Tambah Media Baru"}
              </DialogTitle>
              <DialogDescription>
                Upload gambar ke hosting (seperti Imgur, Cloudinary, dll) dan paste URL-nya di sini
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={handleSubmit}
              className="space-y-4 mt-4"
            >
              <div className="space-y-2">
                <Label htmlFor="title">Judul *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Contoh: Project Motor Custom"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Deskripsi singkat tentang gambar"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL *</Label>
                <div className="flex gap-2">
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, imageUrl: e.target.value })
                    }
                    placeholder="https://example.com/image.jpg"
                    required
                  />
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={handleFileClick}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {formData.imageUrl && (
                  <div className="mt-2 relative w-full h-48 rounded-lg overflow-hidden border">
                    <Image
                      src={formData.imageUrl}
                      alt="Preview"
                      fill
                      sizes="(max-width: 768px) 100vw, 384px"
                      className="object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipe Media</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value as MediaType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GALLERY">Gallery</SelectItem>
                      <SelectItem value="POSTER">Poster</SelectItem>
                      <SelectItem value="BANNER">Banner</SelectItem>
                      <SelectItem value="CAROUSEL">Carousel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    placeholder="service, project, event"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayOrder">Urutan Tampilan</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      displayOrder: e.target.value as any,
                    })
                  }
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Angka lebih kecil akan tampil lebih dulu
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogClose(false)}
                >
                  Batal
                </Button>
                <Button type="submit">
                  {editingItem ? "Update" : "Tambah"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label>Filter Tipe:</Label>
            <Select
              value={filterType}
              onValueChange={(value) => setFilterType(value as MediaType | "ALL")}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua</SelectItem>
                <SelectItem value="GALLERY">Gallery</SelectItem>
                <SelectItem value="POSTER">Poster</SelectItem>
                <SelectItem value="BANNER">Banner</SelectItem>
                <SelectItem value="CAROUSEL">Carousel</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {items.length} item
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <ImagePlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada media. Tambahkan media pertama Anda!</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card
              key={item.id}
              className={`group relative overflow-hidden ${
                !item.isActive ? "opacity-60" : ""
              }`}
            >
              {/* Image */}
              <div className="relative w-full h-48 bg-muted">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                />
                
                {/* Type Badge */}
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-1 bg-primary text-primary-foreground text-xs font-bold rounded">
                    {item.type}
                  </span>
                </div>

                {/* Actions Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => handleToggleActive(item)}
                  >
                    {item.isActive ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <CardHeader>
                <CardTitle className="text-base">{item.title}</CardTitle>
                {item.description && (
                  <CardDescription className="line-clamp-2">
                    {item.description}
                  </CardDescription>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  {item.category && (
                    <span className="px-2 py-0.5 bg-muted rounded">
                      {item.category}
                    </span>
                  )}
                  <span>Order: {item.displayOrder}</span>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
