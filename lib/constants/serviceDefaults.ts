/**
 * Default Service Data — Single Source of Truth
 * 
 * All fallback/default service data across the application
 * should use constants from this file.
 * 
 * Field `desc` is used as the primary description key.
 * Some consumers require `description` — use the appropriate helper.
 */

export interface DefaultService {
  id: string;
  title: string;
  desc: string;
  features: string[];
  tag: string;
  icon: string;
  serviceType: "LIGHT_SERVICE" | "MODIFICATION";
}

export interface DefaultServiceItem extends DefaultService {
  description: string;
}

export interface DefaultServiceOption {
  id: string;
  title: string;
  description: string;
  serviceType: "LIGHT_SERVICE" | "MODIFICATION";
  icon: string;
}

/**
 * 4 default services for NopzGarage (full version).
 * Used by: settings.ts (getAllSettings fallback)
 */
export const DEFAULT_SERVICES: DefaultService[] = [
  {
    id: "1",
    title: "Fast Lane Service",
    desc: "Servis kilat & perawatan rutin harian untuk menjaga performa optimal kendaraan tanpa antri lama.",
    features: [
      "Ganti oli mesin & transmisi / CVT",
      "Tune-up & pembersihan sistem injeksi / karburator",
      "Pemeriksaan kelistrikan, aki & busi",
      "Pengecekan & penyetelan rem serta rantai",
      "Pemeriksaan tekanan ban & sistem pendingin"
    ],
    tag: "SAME DAY SERVICE",
    icon: "Zap",
    serviceType: "LIGHT_SERVICE"
  },
  {
    id: "2",
    title: "Project Lane & Overhaul",
    desc: "Penanganan perbaikan mesin skala besar, overhaul (turun mesin total), dan pengerjaan komponen presisi.",
    features: [
      "Turun mesin total / overhaul presisi",
      "Skir klep & penggantian seher / piston set",
      "Perbaikan & overhaul transmisi CVT / manual",
      "Penggantian kruk as, stang seher & bearing mesin",
      "Pembersihan ruang bakar & pemulihan kompresi"
    ],
    tag: "HEAVY REPAIR",
    icon: "Settings",
    serviceType: "MODIFICATION"
  },
  {
    id: "3",
    title: "Performance & Remap ECU",
    desc: "Optimasi performa mesin injection melalui remap ECU, dyno tuning, dan upgrade komponen pacu.",
    features: [
      "Remap ECU (Buka limiter, kalibrasi rasio bahan bakar)",
      "Eliminasi gejala brebet & akselerasi lambat",
      "Upgrade sistem intake, air filter & exhaust",
      "Setting noken as (camshaft) & rasio kompresi",
      "Dyno check & penyesuaian kurva tenaga"
    ],
    tag: "PERFORMANCE",
    icon: "Wrench",
    serviceType: "MODIFICATION"
  },
  {
    id: "4",
    title: "Custom Project & Restorasi",
    desc: "Restorasi motor klasik/modern, modifikasi body, pengecatan custom, dan perakitan aksesoris.",
    features: [
      "Pengecatan ulang (Repaint) & Body Custom",
      "Restorasi total motor matic, bebek & sport",
      "Pemasangan aksesoris, kelistrikan & lampu LED custom",
      "Coating & detailing perlindungan cat",
      "Pengerjaan kustomisasi sesuai kebutuhan pemilik"
    ],
    tag: "CUSTOM PROJECT",
    icon: "Star",
    serviceType: "MODIFICATION"
  }
];

/**
 * Version with `description` field (alias of `desc`).
 * Used by: page.tsx fallback, WebsiteContentTab.tsx default.
 */
export const DEFAULT_SERVICE_ITEMS: DefaultServiceItem[] = DEFAULT_SERVICES.map((service) => ({
  ...service,
  description: service.desc
}));

/**
 * Concise version for Booking components (without features/tag).
 * Used by: BookingForm.tsx, BookingWizard.tsx fallback.
 */
export const DEFAULT_SERVICE_OPTIONS: DefaultServiceOption[] = DEFAULT_SERVICES.map((service) => ({
  id: service.id,
  title: service.title,
  description: service.desc,
  serviceType: service.serviceType,
  icon: service.icon
}));
