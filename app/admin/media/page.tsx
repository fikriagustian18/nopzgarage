import { RoleGuard } from "@/components/shared/RoleGuard";
import { SocialEmbedsManager } from "@/components/admin/SocialEmbedsManager";

export default function Page() {
  return (
    <RoleGuard allowedRoles={["OWNER"]}>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-black text-foreground mb-2">
            Media Management
          </h2>
          <p className="text-muted-foreground">
            Kelola konten sosial media untuk website NopzGarage
          </p>
        </div>

        {/* Social Media Embeds Manager */}
        <SocialEmbedsManager />
      </div>
    </RoleGuard>
  );
}

