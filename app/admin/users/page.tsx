// app/admin/users/page.tsx
import { RoleGuard } from "@/components/shared/RoleGuard";
import { UserManagementTab } from "@/components/admin/UserManagementTab";

export const dynamic = "force-dynamic";

export default async function Page() {
  return (
    <RoleGuard allowedRoles={["OWNER"]}>
      <div className="p-4 md:p-8 space-y-6">
        <UserManagementTab />
      </div>
    </RoleGuard>
  );
}
