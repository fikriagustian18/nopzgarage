"use server";

import { prisma } from "@/lib/prisma";

export interface CreateLogInput {
  action: string;
  title: string;
  details: string;
  metadata?: Record<string, unknown>;
  userId?: string;
  userName?: string;
  role?: string;
}

/**
 * Creates a system activity log entry.
 * 
 * @param data - Log entry payload (action, title, details, user context).
 * @returns Status object indicating success or failure.
 */
export async function createLog(data: CreateLogInput) {
  try {
    await prisma.systemConfig.create({
      data: {
        category: "LOG",
        key: undefined,
        title: `${data.action}: ${data.title}`,
        subtitle: data.details,
        content: {
          ...(data.metadata || {}),
          ...(data.userName && { userName: data.userName }),
          ...(data.role && { userRole: data.role }),
        },
        userId: data.userId,
        userName: data.userName,
        platform: data.role,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Create log error:", error);
    return { success: false, error: "Failed to create log" };
  }
}

/**
 * Fetches recent system activity logs.
 * 
 * @param limit - Maximum number of logs to retrieve (default: 20).
 * @returns List of formatted logs.
 */
export async function getRecentLogs(limit = 20) {
  try {
    const logs = await prisma.systemConfig.findMany({
      where: { category: "LOG" },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    
    const serializedLogs = logs.map((log) => ({
      id: log.id,
      action: log.title ? log.title.split(":")[0] : "LOG",
      title: log.title || "",
      details: log.subtitle || "",
      metadata: log.content || {},
      userId: log.userId,
      userName: log.userName,
      createdAt: log.createdAt.toISOString(),
    }));
    
    return { success: true, logs: serializedLogs };
  } catch (error) {
    console.error("Get logs error:", error);
    return { success: false, error: "Failed to fetch logs" };
  }
}

