"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { MediaGalleryManager } from "@/components/admin/MediaGalleryManager";
import { SocialEmbedsManager } from "@/components/admin/SocialEmbedsManager";
import { ImagePlus, Share2, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Alert, AlertDescription } from "@/components/ui/Alert";

export default function MediaManagementPage() {
  return (
    <RoleGuard allowedRoles={["OWNER"]}>
      <div className="p-8 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-black text-foreground mb-2">
          Media Management
        </h2>
        <p className="text-muted-foreground">
          Kelola gambar, poster, dan konten sosial media untuk website NopzGarage
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Cara upload gambar:</strong> Upload gambar Anda ke layanan hosting seperti{" "}
          <a
            href="https://imgur.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Imgur
          </a>
          ,{" "}
          <a
            href="https://cloudinary.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Cloudinary
          </a>
          , atau{" "}
          <a
            href="https://postimages.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            PostImages
          </a>
          , lalu paste URL gambar tersebut di form.
        </AlertDescription>
      </Alert>

      {/* Tabs */}
      <Tabs defaultValue="gallery" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <ImagePlus className="h-4 w-4" />
            Gallery & Poster
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Social Media
          </TabsTrigger>
        </TabsList>

        {/* Media Gallery Tab */}
        <TabsContent value="gallery" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <MediaGalleryManager />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Embeds Tab */}
        <TabsContent value="social" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <SocialEmbedsManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </RoleGuard>
  );
}
