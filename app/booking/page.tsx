// app/booking/page.tsx
import { auth } from "@/lib/auth";
import { getAllSettings } from "@/lib/actions/settings";
import { BookingWizard } from "@/components/booking/BookingWizard";

export const dynamic = "force-dynamic";

export default async function BookingPage() {
  const session = await auth();
  const settings = await getAllSettings();
  const { general, content } = settings;

  // Extract services
  const servicesConfig = content['services']?.content || {};
  const serviceItems = Array.isArray(servicesConfig.items) ? servicesConfig.items : [];

  return (
    <BookingWizard 
      serviceOptions={serviceItems} 
      generalSettings={general} 
      session={session} 
    />
  );
}
