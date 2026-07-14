"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/*
  Content Structure Example:
  sectionKey: "hero"
  content: {
    title: "Servis Motor Terpercaya",
    subtitle: "Booking servis mudah dan cepat",
    ctaText: "Booking Sekarang",
    ctaLink: "/login"
  }
*/

/**
 * Mengambil konten website berdasarkan 'sectionKey'.
 * Contoh sectionKey: 'hero', 'about', 'services'.
 * 
 * @param {string} sectionKey - Kunci unik bagian konten.
 * @returns {Object} Data konten jika ditemukan.
 */
export async function getContent(sectionKey: string) {
  try {
    const content = await prisma.contentSection.findUnique({
      where: { sectionKey },
    });
    const serialized = content ? {
      ...content,
      updatedAt: content.updatedAt.toISOString(),
    } : null;
    return { success: true, data: serialized };
  } catch (error) {
    return { success: false, error: "Gagal mengambil konten" };
  }
}

/**
 * Memperbarui atau membuat konten baru (Upsert).
 * 
 * @param {string} sectionKey - Kunci unik bagian konten.
 * @param {any} data - Data konten baru (title, subtitle, content object).
 * @returns {Object} Pesan sukses.
 */
export async function updateContent(sectionKey: string, data: any) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Akses ditolak: Hanya Owner yang dapat mengupdate konten website.' };
    }
    await prisma.contentSection.upsert({
      where: { sectionKey },
      update: {
        content: data.content,
        title: data.title,
        subtitle: data.subtitle,
        isVisible: data.isVisible ?? true,
      },
      create: {
        sectionKey,
        content: data.content,
        title: data.title,
        subtitle: data.subtitle,
        isVisible: data.isVisible ?? true,
      },
    });
    
    revalidatePath("/"); // Revalidate Landing Page
    revalidatePath("/admin/settings");
    
    return { success: true, message: "Konten berhasil diperbarui" };
  } catch (error) {
    console.error("Content update error:", error);
    return { success: false, error: "Gagal update konten" };
  }
}

/**
 * Mengambil SEMUA konten yang ada di database.
 * 
 * @returns {Object} List semua konten.
 */
export async function getAllContent() {
    try {
        const contents = await prisma.contentSection.findMany();
        const serialized = contents.map(c => ({
          ...c,
          updatedAt: c.updatedAt.toISOString(),
        }));
        return { success: true, data: serialized };
    } catch(err) {
        return { success: false, error: "Failed to load content" };
    }
}
