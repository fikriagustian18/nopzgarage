"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SocialPlatform = "INSTAGRAM" | "TIKTOK" | "YOUTUBE";

export interface SocialEmbedItem {
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
}

/**
 * Fetches all active social media embed content.
 * Ordered by Display Order then Date.
 * 
 * @param platform - Filter platform (Instagram, TikTok, YouTube).
 * @returns List of embed items.
 */
export async function getSocialEmbeds(platform?: string): Promise<SocialEmbedItem[]> {
  try {
    const items = await prisma.systemConfig.findMany({
      where: {
        category: "EMBED",
        ...(platform && { platform }),
        isVisible: true,
      },
      orderBy: [
        { displayOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    return items.map((item) => ({
      id: item.id,
      platform: (item.platform as any) || "INSTAGRAM",
      embedUrl: item.embedUrl || "",
      embedCode: item.subtitle || null,
      title: item.title || null,
      description: item.content ? (item.content as any).description || null : null,
      thumbnail: item.imageUrl || null,
      isActive: item.isVisible,
      displayOrder: item.displayOrder,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  } catch (error) {
    console.error("Error fetching social embeds:", error);
    return [];
  }
}

/**
 * Fetches a single social media embed by ID.
 * 
 * @param id - Embed ID.
 * @returns Embed item if found.
 */
export async function getSocialEmbed(id: string): Promise<SocialEmbedItem | null> {
  try {
    const item = await prisma.systemConfig.findUnique({
      where: { id },
    });

    if (!item) {
      return null;
    }

    return {
      id: item.id,
      platform: (item.platform as any) || "INSTAGRAM",
      embedUrl: item.embedUrl || "",
      embedCode: item.subtitle || null,
      title: item.title || null,
      description: item.content ? (item.content as any).description || null : null,
      thumbnail: item.imageUrl || null,
      isActive: item.isVisible,
      displayOrder: item.displayOrder,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
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
    /instagram\.com\/.*\/p\/([A-Za-z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

// Helper function to extract TikTok video ID from URL
function extractTikTokVideoId(url: string): string | null {
  const patterns = [
    /tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
    /vm\.tiktok\.com\/([A-Za-z0-9]+)/,
    /vt\.tiktok\.com\/([A-Za-z0-9]+)/,
    /tiktok\.com\/.*\/video\/(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
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
    if (match) {
      return match[1];
    }
  }

  return null;
}

// Generate embed code based on platform
function generateEmbedCode(platform: SocialPlatform, url: string): string | null {
  if (platform === "INSTAGRAM") {
    const postId = extractInstagramPostId(url);
    if (!postId) {
      return null;
    }

    return `<blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/p/${postId}/" data-instgrm-version="14"></blockquote>`;
  }

  if (platform === "TIKTOK") {
    const videoId = extractTikTokVideoId(url);
    if (!videoId) {
      return null;
    }

    return `<blockquote class="tiktok-embed" cite="${url}" data-video-id="${videoId}"></blockquote>`;
  }

  if (platform === "YOUTUBE") {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      return null;
    }

    return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
  }

  return null;
}

/**
 * Adds a new social media embed.
 * Automatically detects platform and generates embed code (iframe/blockquote).
 * 
 * @param data - Embed data payload.
 * @returns Created embed object.
 */
export async function createSocialEmbed(data: {
  platform: SocialPlatform;
  embedUrl: string;
  title?: string;
  description?: string;
  displayOrder?: number;
}) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    console.error("[CREATE_EMBED] Unauthorized access attempt:", session?.user?.role);
    return { success: false, error: "Unauthorized: Access denied" };
  }

  try {
    console.log("[CREATE_EMBED] Processing URL:", data.embedUrl, "Platform:", data.platform);

    const embedCode = generateEmbedCode(data.platform, data.embedUrl);
    console.log("[CREATE_EMBED] Generated Code:", embedCode ? "Success" : "Failed (Null)");

    const item = await prisma.systemConfig.create({
      data: {
        category: "EMBED",
        platform: data.platform,
        embedUrl: data.embedUrl,
        subtitle: embedCode,
        title: data.title,
        content: data.description ? { description: data.description } : undefined,
        displayOrder: data.displayOrder || 0,
        isVisible: true,
      },
    });

    console.log("[CREATE_EMBED] Success creating item:", item.id);

    revalidatePath("/");
    revalidatePath("/admin/content");
    
    return { success: true, data: item };
  } catch (error) {
    console.error("[CREATE_EMBED] Error creating social embed:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create embed";
    return { success: false, error: errorMessage };
  }
}

/**
 * Updates an existing social media embed.
 * 
 * @param id - Embed ID.
 * @param data - Updated embed fields.
 * @returns Updated embed item.
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
  if (!session || session.user.role !== "OWNER") {
    console.error("[UPDATE_EMBED] Unauthorized access attempt:", session?.user?.role);
    return { success: false, error: "Unauthorized: Access denied" };
  }

  try {
    let embedCode = undefined;
    if (data.embedUrl && data.platform) {
      console.log("[UPDATE_EMBED] Regenerating code for URL:", data.embedUrl);
      embedCode = generateEmbedCode(data.platform, data.embedUrl);
    }

    const item = await prisma.systemConfig.update({
      where: { id },
      data: {
        ...(data.platform && { platform: data.platform }),
        ...(data.embedUrl && { embedUrl: data.embedUrl }),
        ...(embedCode && { subtitle: embedCode }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { content: { description: data.description } }),
        ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
        ...(data.isActive !== undefined && { isVisible: data.isActive }),
      },
    });

    revalidatePath("/");
    revalidatePath("/admin/content");
    
    return { success: true, data: item };
  } catch (error) {
    console.error("[UPDATE_EMBED] Error updating social embed:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update embed";
    return { success: false, error: errorMessage };
  }
}

/**
 * Deletes a social media embed by ID.
 * 
 * @param id - Embed ID.
 * @returns Success response.
 */
export async function deleteSocialEmbed(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    throw new Error("Unauthorized");
  }

  try {
    await prisma.systemConfig.delete({
      where: { id },
    });

    revalidatePath("/");
    revalidatePath("/admin/content");
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting social embed:", error);
    return { success: false, error: "Failed to delete embed" };
  }
}

/**
 * Reorders social media embeds display order.
 * 
 * @param items - List of items with their new displayOrder.
 * @returns Success response.
 */
export async function reorderSocialEmbeds(items: { id: string; displayOrder: number }[]) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    throw new Error("Unauthorized");
  }

  try {
    await Promise.all(
      items.map((item) =>
        prisma.systemConfig.update({
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
    return { success: false, error: "Failed to reorder embeds" };
  }
}
