"use client";

import { useState, useEffect } from "react";
import { SocialPlatform } from "@prisma/client";
import {
  Share2,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Loader2,
  ExternalLink,
  Instagram,
  Music,
  Youtube,
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
  getSocialEmbeds,
  createSocialEmbed,
  updateSocialEmbed,
  deleteSocialEmbed,
  SocialEmbedItem,
} from "@/lib/actions/socialEmbeds";

const PLATFORM_ICONS = {
  INSTAGRAM: Instagram,
  TIKTOK: Music,
  YOUTUBE: Youtube,
};

const PLATFORM_COLORS = {
  INSTAGRAM: "bg-pink-500",
  TIKTOK: "bg-black",
  YOUTUBE: "bg-red-600",
};

export function SocialEmbedsManager() {
  const [items, setItems] = useState<SocialEmbedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SocialEmbedItem | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<
    SocialPlatform | "ALL"
  >("ALL");

  // Form state
  const [formData, setFormData] = useState({
    platform: "INSTAGRAM" as SocialPlatform,
    embedUrl: "",
    title: "",
    description: "",
    displayOrder: 0,
  });

  async function loadItems() {
    setLoading(true);
    const data = await getSocialEmbeds(
      filterPlatform !== "ALL" ? filterPlatform : undefined
    );
    setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    loadItems();
  }, [filterPlatform]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.embedUrl) {
      toast.error("URL wajib diisi");
      return;
    }

    const payload = {
      ...formData,
      displayOrder: Number(formData.displayOrder) || 0,
    };

    const result = editingItem
      ? await updateSocialEmbed(editingItem.id, payload)
      : await createSocialEmbed(payload);

    if (result.success) {
      toast.success(
        editingItem
          ? "Embed berhasil diupdate"
          : "Embed berhasil ditambahkan"
      );
      setDialogOpen(false);
      resetForm();
      loadItems();
    } else {
      toast.error(result.error || "Gagal menyimpan embed");
    }
  }

  function handleEdit(item: SocialEmbedItem) {
    setEditingItem(item);
    setFormData({
      platform: item.platform,
      embedUrl: item.embedUrl,
      title: item.title || "",
      description: item.description || "",
      displayOrder: item.displayOrder,
    });
    setDialogOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus embed ini?")) {
      return;
    }

    const result = await deleteSocialEmbed(id);
    if (result.success) {
      toast.success("Embed berhasil dihapus");
      loadItems();
    } else {
      toast.error(result.error || "Gagal menghapus embed");
    }
  }

  async function handleToggleActive(item: SocialEmbedItem) {
    const result = await updateSocialEmbed(item.id, {
      isActive: !item.isActive,
    });

    if (result.success) {
      toast.success(
        item.isActive ? "Embed disembunyikan" : "Embed ditampilkan"
      );
      loadItems();
    } else {
      toast.error("Gagal mengubah status");
    }
  }

  function resetForm() {
    setEditingItem(null);
    setFormData({
      platform: "INSTAGRAM",
      embedUrl: "",
      title: "",
      description: "",
      displayOrder: 0,
    });
  }

  function handleDialogClose(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-foreground">
            Social Media Embeds
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Tampilkan konten dari Instagram, TikTok, dan YouTube
          </p>
        </div>

        <Dialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
        >
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Tambah Embed
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Embed" : "Tambah Embed Baru"}
              </DialogTitle>
              <DialogDescription>
                Paste URL dari post Instagram, TikTok, atau video YouTube
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={handleSubmit}
              className="space-y-4 mt-4"
            >
              <div className="space-y-2">
                <Label htmlFor="platform">Platform *</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      platform: value as SocialPlatform,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INSTAGRAM">
                      <div className="flex items-center gap-2">
                        <Instagram className="h-4 w-4" />
                        Instagram
                      </div>
                    </SelectItem>
                    <SelectItem value="TIKTOK">
                      <div className="flex items-center gap-2">
                        <Music className="h-4 w-4" />
                        TikTok
                      </div>
                    </SelectItem>
                    <SelectItem value="YOUTUBE">
                      <div className="flex items-center gap-2">
                        <Youtube className="h-4 w-4" />
                        YouTube
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="embedUrl">URL *</Label>
                <Input
                  id="embedUrl"
                  value={formData.embedUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, embedUrl: e.target.value })
                  }
                  placeholder={
                    formData.platform === "INSTAGRAM"
                      ? "https://www.instagram.com/p/..."
                      : formData.platform === "TIKTOK"
                      ? "https://www.tiktok.com/@username/video/..."
                      : "https://www.youtube.com/watch?v=..."
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.platform === "INSTAGRAM" &&
                    "Contoh: https://www.instagram.com/p/ABC123/"}
                  {formData.platform === "TIKTOK" &&
                    "Contoh: https://www.tiktok.com/@username/video/1234567890"}
                  {formData.platform === "YOUTUBE" &&
                    "Contoh: https://www.youtube.com/watch?v=dQw4w9WgXcQ"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Judul</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Judul untuk embed (opsional)"
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
                  placeholder="Deskripsi singkat"
                  rows={3}
                />
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
            <Label>Filter Platform:</Label>
            <Select
              value={filterPlatform}
              onValueChange={(value) =>
                setFilterPlatform(value as SocialPlatform | "ALL")
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua</SelectItem>
                <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                <SelectItem value="TIKTOK">TikTok</SelectItem>
                <SelectItem value="YOUTUBE">YouTube</SelectItem>
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
              <Share2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada embed. Tambahkan konten sosial media Anda!</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const Icon = PLATFORM_ICONS[item.platform];
            const colorClass = PLATFORM_COLORS[item.platform];

            return (
              <Card
                key={item.id}
                className={`group relative ${
                  !item.isActive ? "opacity-60" : ""
                }`}
              >
                <CardHeader>
                  {/* Platform Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 ${colorClass} text-white rounded-lg text-sm font-bold`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.platform}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
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
                        variant="ghost"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <CardTitle className="text-base">
                    {item.title || "Untitled"}
                  </CardTitle>
                  {item.description && (
                    <CardDescription className="line-clamp-2">
                      {item.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {/* URL */}
                    <div className="flex items-center gap-2 text-xs">
                      <a
                        href={item.embedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-primary hover:underline truncate flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{item.embedUrl}</span>
                      </a>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="px-2 py-0.5 bg-muted rounded">
                        Order: {item.displayOrder}
                      </span>
                      <span className="text-xs">
                        {new Date(item.createdAt).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
