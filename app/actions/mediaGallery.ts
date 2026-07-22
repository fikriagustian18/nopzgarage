"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { MediaType } from "@prisma/client";

export type MediaGalleryItem = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  type: MediaType;
  category: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

// Get all media gallery items
/**
 * Mengambil semua item galeri media.
 * 
 * @param {MediaType} type - Filter tipe media (opsional).
 * @param {string} category - Filter kategori (opsional).
 * @returns {Array} List item galeri.
 */
export async function getMediaGallery(
  type?: MediaType,
  category?: string
): Promise<MediaGalleryItem[]> {
  try {
    const items = await prisma.mediaGallery.findMany({
      where: {
        ...(type && { type }),
        ...(category && { category }),
        isActive: true,
      },
      orderBy: [
        { displayOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    return items;
  } catch (error) {
    console.error("Error fetching media gallery:", error);
    return [];
  }
}

// Get single media item
/**
 * Mengambil satu item media berdasarkan ID.
 * 
 * @param {string} id - ID media.
 * @returns {Object} Data media atau null.
 */
export async function getMediaItem(id: string): Promise<MediaGalleryItem | null> {
  try {
    const item = await prisma.mediaGallery.findUnique({
      where: { id },
    });

    return item;
  } catch (error) {
    console.error("Error fetching media item:", error);
    return null;
  }
}

// Create new media item
/**
 * Menambahkan item media baru (Admin/Owner only).
 * 
 * @param {Object} data - Data media baru.
 * @returns {Object} Status sukses dan data item.
 */
export async function createMediaItem(data: {
  title: string;
  description?: string;
  imageUrl: string;
  type: MediaType;
  category?: string;
  displayOrder?: number;
}) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    throw new Error("Unauthorized");
  }

  try {
    const item = await prisma.mediaGallery.create({
      data: {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        type: data.type,
        category: data.category,
        displayOrder: data.displayOrder || 0,
        isActive: true,
      },
    });

    revalidatePath("/");
    revalidatePath("/admin/content");
    
    return { success: true, data: item };
  } catch (error) {
    console.error("Error creating media item:", error);
    return { success: false, error: "Gagal menambahkan media" };
  }
}

// Update media item
/**
 * Update media item (Admin/Owner only).
 * 
 * @param {string} id - ID media.
 * @param {Object} data - Data update.
 * @returns {Object} Status sukses dan data item.
 */
export async function updateMediaItem(
  id: string,
  data: {
    title?: string;
    description?: string;
    imageUrl?: string;
    type?: MediaType;
    category?: string;
    displayOrder?: number;
    isActive?: boolean;
  }
) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    throw new Error("Unauthorized");
  }

  try {
    const item = await prisma.mediaGallery.update({
      where: { id },
      data,
    });

    revalidatePath("/");
    revalidatePath("/admin/content");
    
    return { success: true, data: item };
  } catch (error) {
    console.error("Error updating media item:", error);
    return { success: false, error: "Gagal mengupdate media" };
  }
}

// Delete media item
/**
 * Menghapus item media (Admin/Owner only).
 * 
 * @param {string} id - ID media.
 * @returns {Object} Status sukses.
 */
export async function deleteMediaItem(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    throw new Error("Unauthorized");
  }

  try {
    await prisma.mediaGallery.delete({
      where: { id },
    });

    revalidatePath("/");
    revalidatePath("/admin/content");
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting media item:", error);
    return { success: false, error: "Gagal menghapus media" };
  }
}

// Reorder media items
/**
 * Mengupdate urutan tampilan media (Admin/Owner only).
 * 
 * @param {Array} items - Array objek {id, displayOrder}.
 * @returns {Object} Status sukses.
 */
export async function reorderMediaItems(items: { id: string; displayOrder: number }[]) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    throw new Error("Unauthorized");
  }

  try {
    await Promise.all(
      items.map((item) =>
        prisma.mediaGallery.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
        })
      )
    );

    revalidatePath("/");
    revalidatePath("/admin/content");
    
    return { success: true };
  } catch (error) {
    console.error("Error reordering media items:", error);
    return { success: false, error: "Gagal mengubah urutan" };
  }
}
