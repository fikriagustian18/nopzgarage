// lib/authCheck.ts - Lightweight auth helpers for route protection
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export type AppRole = "OWNER" | "ADMIN" | "EMPLOYEE" | "UNKNOWN";

/**
 * Normalizes any role variation or mechanic alias to standard application roles.
 */
export function normalizeRole(role?: string | null): AppRole {
  if (!role) {
    return "UNKNOWN";
  }
  const upper = role.toUpperCase().trim();
  if (upper === "OWNER") {
    return "OWNER";
  }
  if (upper === "ADMIN" || upper === "ADMINISTRATOR") {
    return "ADMIN";
  }
  if (
    upper === "EMPLOYEE" ||
    upper === "MECHANIC" ||
    upper === "MEKANIK" ||
    upper.includes("MEKANIK") ||
    upper.includes("MECHANIC") ||
    upper.includes("TEKNISI")
  ) {
    return "EMPLOYEE";
  }
  return "UNKNOWN";
}

/**
 * Checks if a user's role is permitted according to allowed roles list.
 * Supports normalized comparison and case-insensitive fallback.
 */
export function isRoleAllowed(userRole?: string | null, allowedRoles: string[] = []): boolean {
  if (!userRole || !allowedRoles || allowedRoles.length === 0) {
    return false;
  }

  const normalizedUser = normalizeRole(userRole);
  if (normalizedUser !== "UNKNOWN") {
    if (allowedRoles.some((r) => normalizeRole(r) === normalizedUser)) {
      return true;
    }
  }

  const userUpper = userRole.toUpperCase().trim();
  return allowedRoles.some((r) => r?.toUpperCase().trim() === userUpper);
}

export async function requireAuth() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth();
  const rawRole = session.user?.role as string;
  
  if (!isRoleAllowed(rawRole, allowedRoles)) {
    const normalized = normalizeRole(rawRole);
    if (normalized === "EMPLOYEE") {
      redirect("/employee");
    }
    if (normalized === "OWNER" || normalized === "ADMIN") {
      redirect("/admin");
    }
    redirect("/login");
  }
  
  return session;
}

export async function getAuthSession() {
  return await auth();
}


