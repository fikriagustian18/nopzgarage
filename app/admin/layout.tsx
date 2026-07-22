import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminHeader } from "@/components/AdminHeader";
import { Toaster } from "sonner";
import { requireRole } from "@/lib/authCheck";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Require OWNER or ADMIN role
  await requireRole(["OWNER", "ADMIN"]);
  
  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      <main className="flex-1 md:ml-64 ml-0 min-h-screen bg-muted/10 flex flex-col transition-all duration-300 w-full overflow-x-hidden">
        <AdminHeader />
        <div className="flex-1">
          {children}
        </div>
      </main>
      <Toaster position="top-right" richColors />
    </div>
  );
}
