// lib/auth-check.ts - Lightweight auth helpers for route protection
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function requireAuth() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth();
  const role = session.user?.role as string;
  
  if (!allowedRoles.includes(role)) {
    // Redirect based on role
    if (role === "EMPLOYEE") {
      redirect("/employee");
    } else {
      redirect("/admin");
    }
  }
  
  return session;
}

export async function getAuthSession() {
  return await auth();
}
