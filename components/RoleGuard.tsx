"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    const role = session.user?.role;
    if (!role || !allowedRoles.includes(role)) {
      // Redirect based on role to their appropriate page
      if (role === "EMPLOYEE") {
        router.push("/employee");
      } else if (role === "ADMIN") {
        router.push("/admin/orders");
      } else if (role === "OWNER") {
        router.push("/admin");
      } else {
        router.push("/login");
      }
    }
  }, [session, status, allowedRoles, router]);

  if (status === "loading" || !session || !session.user?.role || !allowedRoles.includes(session.user.role)) {
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
