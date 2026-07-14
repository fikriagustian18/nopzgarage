"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { SocialPlatform } from "@prisma/client";

export type SocialEmbedItem = {
  id: string;
  platform: SocialPlatform;
  embedUrl: string;
  embedCode: string | null;
  title: string | null;
  description: string | null;
  thumbnail: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

// Get all social embeds
/**
 * Mengambil semua konten social media embed yang aktif.
 * Diurutkan berdasarkan Display Order lalu Tanggal.
 * 
 * @param {SocialPlatform} platform - Filter platform (IG, TikTok, YT).
 * @returns {Array} List embed items.
 */
export async function getSocialEmbeds(platform?: SocialPlatform): Promise<SocialEmbedItem[]> {
  try {
    const items = await prisma.socialEmbed.findMany({
      where: {
        ...(platform && { platform }),
        isActive: true,
      },
      orderBy: [
        { displayOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    return items;
  } catch (error) {
    console.error("Error fetching social embeds:", error);
    return [];
  }
}

// Get single social embed
/**
 * Mengambil satu item embed berdasarkan ID.
 * 
 * @param {string} id - ID Embed.
 * @returns {Object} Detail embed item.
 */
export async function getSocialEmbed(id: string): Promise<SocialEmbedItem | null> {
  try {
    const item = await prisma.socialEmbed.findUnique({
      where: { id },
    });

    return item;
  } catch (error) {
    console.error("Error fetching social embed:", error);
    return null;
  }
}

// Helper function to extract Instagram post ID from URL
function extractInstagramPostId(url: string): string | null {
  const patterns = [
    /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
    /instagr\.am\/p\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/.*\/p\/([A-Za-z0-9_-]+)/, // Support nested paths
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

// Helper function to extract TikTok video ID from URL
function extractTikTokVideoId(url: string): string | null {
  const patterns = [
    /tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
    /vm\.tiktok\.com\/([A-Za-z0-9]+)/,
    /vt\.tiktok\.com\/([A-Za-z0-9]+)/,
    /tiktok\.com\/.*\/video\/(\d+)/, // Flexible path
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

// Helper function to extract YouTube video ID from URL
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}


// Generate embed code based on platform
function generateEmbedCode(platform: SocialPlatform, url: string): string | null {
  if (platform === "INSTAGRAM") {
    const postId = extractInstagramPostId(url);
    if (!postId) return null;

    return `<blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/p/${postId}/" data-instgrm-version="14"></blockquote>`;
  }

  if (platform === "TIKTOK") {
    const videoId = extractTikTokVideoId(url);
    if (!videoId) return null;

    return `<blockquote class="tiktok-embed" cite="${url}" data-video-id="${videoId}"></blockquote>`;
  }

  if (platform === "YOUTUBE") {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) return null;

    return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
  }

  return null;
}

// Create new social embed
/**
 * Menambahkan embed social media baru.
 * Otomatis mendeteksi platform dan men-generate kode embed (iframe/blockquote).
 * 
 * @param {Object} data - Data embed (URL, Platform).
 * @returns {Object} Item yang dibuat.
 */
export async function createSocialEmbed(data: {
  platform: SocialPlatform;
  embedUrl: string;
  title?: string;
  description?: string;
  displayOrder?: number;
}) {
  const session = await auth();
  if (!session || !["ADMIN", "OWNER"].includes(session.user.role)) {
    console.error("[CREATE_EMBED] Unauthorized access attempt:", session?.user?.role);
    return { success: false, error: "Unauthorized: Anda tidak memiliki akses" };
  }

  try {
    console.log("[CREATE_EMBED] Processing URL:", data.embedUrl, "Platform:", data.platform);

    // Generate embed code automatically
    const embedCode = generateEmbedCode(data.platform, data.embedUrl);
    console.log("[CREATE_EMBED] Generated Code:", embedCode ? "Success" : "Failed (Null)");

    const item = await prisma.socialEmbed.create({
      data: {
        platform: data.platform,
        embedUrl: data.embedUrl,
        embedCode,
        title: data.title,
        description: data.description,
        displayOrder: data.displayOrder || 0,
        isActive: true,
      },
    });

    console.log("[CREATE_EMBED] Success creating item:", item.id);

    revalidatePath("/");
    revalidatePath("/admin/content");
    
    return { success: true, data: item };
  } catch (error) {
    console.error("[CREATE_EMBED] Error creating social embed:", error);
    // Return the actual error message if possible to help debug
    const errorMessage = error instanceof Error ? error.message : "Gagal menambahkan embed";
    return { success: false, error: errorMessage };
  }
}

// Update social embed
/**
 * Mengupdate data social embed.
 * Jika URL berubah, kode embed akan digenerate ulang.
 * 
 * @param {string} id - ID Embed.
 * @param {Object} data - Data update.
 * @returns {Object} Data updated.
 */
export async function updateSocialEmbed(
  id: string,
  data: {
    platform?: SocialPlatform;
    embedUrl?: string;
    title?: string;
    description?: string;
    displayOrder?: number;
    isActive?: boolean;
  }
) {
  const session = await auth();
  if (!session || !["ADMIN", "OWNER"].includes(session.user.role)) {
    console.error("[UPDATE_EMBED] Unauthorized access attempt:", session?.user?.role);
    return { success: false, error: "Unauthorized: Anda tidak memiliki akses" };
  }

  try {
    // Regenerate embed code if URL or platform changed
    let embedCode = undefined;
    if (data.embedUrl && data.platform) {
      console.log("[UPDATE_EMBED] Regenerating code for URL:", data.embedUrl);
      embedCode = generateEmbedCode(data.platform, data.embedUrl);
    }

    const item = await prisma.socialEmbed.update({
      where: { id },
      data: {
        ...data,
        ...(embedCode && { embedCode }),
      },
    });

    revalidatePath("/");
    revalidatePath("/admin/content");
    
    return { success: true, data: item };
  } catch (error) {
    console.error("[UPDATE_EMBED] Error updating social embed:", error);
    const errorMessage = error instanceof Error ? error.message : "Gagal mengupdate embed";
    return { success: false, error: errorMessage };
  }
}

// Delete social embed
// Delete social embed
/**
 * Menghapus social embed (Hard Delete).
 * 
 * @param {string} id - ID Embed.
 * @returns {Object} Status sukses.
 */
export async function deleteSocialEmbed(id: string) {
  const session = await auth();
  if (!session || !["ADMIN", "OWNER"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  try {
    await prisma.socialEmbed.delete({
      where: { id },
    });

    revalidatePath("/");
    revalidatePath("/admin/content");
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting social embed:", error);
    return { success: false, error: "Gagal menghapus embed" };
  }
}

// Reorder social embeds
// Reorder social embeds
/**
 * Mengubah urutan tampilan (Drag & Drop sorting).
 * 
 * @param {Array} items - List {id, displayOrder}.
 * @returns {Object} Status sukses.
 */
export async function reorderSocialEmbeds(items: { id: string; displayOrder: number }[]) {
  const session = await auth();
  if (!session || !["ADMIN", "OWNER"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  try {
    await Promise.all(
      items.map((item) =>
        prisma.socialEmbed.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
        })
      )
    );

    revalidatePath("/");
    revalidatePath("/admin/content");
    
    return { success: true };
  } catch (error) {
    console.error("Error reordering social embeds:", error);
    return { success: false, error: "Gagal mengubah urutan" };
  }
}
