// app/employee/page.tsx - Employee Dashboard (Server Component)
import { getEmployeeDetail } from "@/lib/actions/employees";
import { requireRole } from "@/lib/authCheck";
import { EmployeeDashboardClient } from "./EmployeeDashboardClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await requireRole(["EMPLOYEE"]);

  // Ensure employee user has linked employeeId
  if (!session.user.employeeId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-background text-foreground">
        <h1 className="text-3xl font-black text-red-600 mb-2">Akses Ditolak</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Akun Anda (<strong>{session.user.email}</strong>) tidak terhubung dengan data karyawan.
        </p>
        
        <div className="bg-muted p-4 rounded-lg text-sm font-mono text-left mb-6 max-w-md w-full overflow-auto">
          <p><strong>Debug Info:</strong></p>
          <p>User ID: {session.user.id}</p>
          <p>Role: {session.user.role}</p>
          <p>Employee ID: {session.user.employeeId || "NULL"}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm">Silakan login menggunakan akun Karyawan/Mekanik yang valid.</p>
          <form
            action={async () => {
              "use server";
              await import("@/lib/auth").then((mod) => mod.signOut());
            }}
          >
            <button 
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
            >
              Logout & Ganti Akun
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Fetch Data on Server
  // This avoids the client-side "loading" spinner for the initial fetch
  const result = await getEmployeeDetail(session.user.employeeId);

  if (!result.success || !result.employee) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-500">Error Loading Data</h1>
        <p>{result.error || "Terjadi kesalahan saat memuat data karyawan."}</p>
      </div>
    );
  }

  return (
    <EmployeeDashboardClient 
      employee={result.employee} 
      user={session.user} 
    />
  );
}
