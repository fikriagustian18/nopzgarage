import { auth } from "@/lib/auth";
import { getAllSettings } from "@/lib/actions/settings";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { DefaultServiceOption } from "@/lib/constants/serviceDefaults";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await auth();
  const settings = await getAllSettings();
  const { general, content } = settings;

  // Extract services
  const servicesConfig = (content['services'] as { content?: { items?: DefaultServiceOption[] } })?.content || {};
  const serviceItems: DefaultServiceOption[] = Array.isArray(servicesConfig.items) ? servicesConfig.items : [];

  return (
    <BookingWizard 
      serviceOptions={serviceItems} 
      generalSettings={general} 
      session={session} 
    />
  );
}
