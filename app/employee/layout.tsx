// app/employee/layout.tsx - Employee Layout
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/authCheck";
import { EmployeeHeader } from "@/components/EmployeeHeader";

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check role using helper
  await requireRole(["EMPLOYEE"]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <EmployeeHeader />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
