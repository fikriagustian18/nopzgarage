"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/*
  Content Structure Example:
  sectionKey: "hero"
  content: {
    title: "Reliable Motorcycle Service",
    subtitle: "Easy and fast service booking",
    ctaText: "Book Now",
    ctaLink: "/login"
  }
*/

export interface ContentSectionData {
  id: string;
  sectionKey: string | null;
  title: string | null;
  subtitle: string | null;
  content: unknown;
  isVisible: boolean;
  updatedAt: string;
}

/**
 * Fetches website content by 'sectionKey'.
 * Example keys: 'hero', 'about', 'services'.
 * 
 * @param sectionKey - Unique section key.
 * @returns Content section data if found.
 */
export async function getContent(sectionKey: string) {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: sectionKey },
    });
    if (!config) {
      return { success: true, data: null };
    }

    const serialized: ContentSectionData = {
      id: config.id,
      sectionKey: config.key,
      title: config.title,
      subtitle: config.subtitle,
      content: config.content,
      isVisible: config.isVisible,
      updatedAt: config.updatedAt.toISOString(),
    };
    return { success: true, data: serialized };
  } catch (error) {
    console.error("Error getting content:", error);
    return { success: false, error: "Failed to get content" };
  }
}

/**
 * Updates or creates new content (Upsert).
 * 
 * @param sectionKey - Unique section key.
 * @param data - New content payload (title, subtitle, content object).
 * @returns Success message or error.
 */
export async function updateContent(sectionKey: string, data: any) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "OWNER") {
      return {
        success: false,
        error: "Access denied: Only Owner can update website content.",
      };
    }
    await prisma.systemConfig.upsert({
      where: { key: sectionKey },
      update: {
        content: data.content,
        title: data.title,
        subtitle: data.subtitle,
        isVisible: data.isVisible ?? true,
      },
      create: {
        category: "CONTENT",
        key: sectionKey,
        content: data.content,
        title: data.title,
        subtitle: data.subtitle,
        isVisible: data.isVisible ?? true,
      },
    });

    revalidatePath("/"); // Revalidate landing page
    revalidatePath("/admin/settings");

    return { success: true, message: "Content updated successfully" };
  } catch (error) {
    console.error("Content update error:", error);
    return { success: false, error: "Failed to update content" };
  }
}

/**
 * Fetches ALL content sections from database.
 * 
 * @returns List of all content items.
 */
export async function getAllContent() {
  try {
    const contents = await prisma.systemConfig.findMany({
      where: { category: "CONTENT" },
    });
    const serialized = contents.map((c) => ({
      id: c.id,
      sectionKey: c.key,
      title: c.title,
      subtitle: c.subtitle,
      content: c.content,
      isVisible: c.isVisible,
      updatedAt: c.updatedAt.toISOString(),
    }));
    return { success: true, data: serialized };
  } catch (err) {
    console.error("Failed to load content:", err);
    return { success: false, error: "Failed to load content" };
  }
}

