// app/actions/logs.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type CreateLogInput = {
  action: string;
  title: string;
  details: string;
  metadata?: any;
  userId?: string;
  userName?: string;
  role?: string;
};

/**
 * Membuat catatan log aktivitas sistem.
 * 
 * @param {CreateLogInput} data - Data log (aksi, judul, detail, user).
 * @returns {Object} Status sukses.
 */
export async function createLog(data: CreateLogInput) {
  try {
    await prisma.activityLog.create({
      data: {
        action: data.action,
        title: data.title,
        details: data.details,
        metadata: data.metadata || {},
        userId: data.userId,
        userName: data.userName,
        role: data.role,
      },
    });
    // Optional: revalidatePath('/admin/logs') if we had that page
    return { success: true };
  } catch (error) {
    console.error("Create log error:", error);
    return { success: false, error: "Failed to create log" };
  }
}

/**
 * Mengambil daftar log aktivitas terbaru.
 * 
 * @param {number} limit - Jumlah log yang diambil (default 20).
 * @returns {Object} Daftar log.
 */
export async function getRecentLogs(limit = 20) {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    
    // Serialize dates
    const serializedLogs = logs.map(log => ({
      ...log,
      createdAt: log.createdAt.toISOString()
    }));
    
    return { success: true, logs: serializedLogs };
  } catch (error) {
    console.error("Get logs error:", error);
    return { success: false, error: "Failed to fetch logs" };
  }
}
