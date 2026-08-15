"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { isRoleAllowed, normalizeRole } from "@/lib/authCheck";

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const userRole = session?.user?.role;
  const hasAccess = useMemo(() => {
    return isRoleAllowed(userRole, allowedRoles);
  }, [userRole, allowedRoles]);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!session) {
      router.push("/login");
      return;
    }

    if (!hasAccess) {
      const normalized = normalizeRole(userRole);
      if (normalized === "EMPLOYEE") {
        router.push("/employee");
        return;
      }
      if (normalized === "ADMIN") {
        router.push("/admin/pelayanan");
        return;
      }
      if (normalized === "OWNER") {
        router.push("/admin");
        return;
      }
      router.push("/login");
    }
  }, [session, status, hasAccess, userRole, router]);

  if (status === "loading" || !session || !hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Memeriksa hak akses...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

