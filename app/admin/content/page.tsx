"use client";

import { WebsiteContentTab } from "@/components/admin/WebsiteContentTab";
import { RoleGuard } from "@/components/shared/RoleGuard";

/**
 * Halaman Manajemen Konten Website (CMS).
 * Mengintegrasikan komponen editor konten untuk mengelola landing page website.
 *
 * @returns {JSX.Element} Elemen JSX yang merender halaman CMS.
 */
export default function ContentPage() {
  return (
    <RoleGuard allowedRoles={["OWNER"]}>
      <div className="p-8 space-y-6">
         <div className="mb-4">
            <h2 className="text-3xl font-black text-foreground mb-2">Konten Website</h2>
            <p className="text-muted-foreground">
              Kelola tampilan dan konten landing page website NopzGarage di satu tempat.
            </p>
          </div>

          {/* Reuse the existing component which creates a Card */}
          <WebsiteContentTab />
      </div>
    </RoleGuard>
  );
}

