// app/status/page.tsx
import { auth } from "@/lib/auth";
import { getAllSettings } from "@/lib/actions/settings";
import { StatusPageClient } from "@/components/shared/StatusPageClient";

export const dynamic = "force-dynamic";

export default async function StatusPage() {
  const session = await auth();
  const settings = await getAllSettings();
  const { general } = settings;

  return (
    <StatusPageClient 
      generalSettings={general} 
      session={session} 
    />
  );
}
