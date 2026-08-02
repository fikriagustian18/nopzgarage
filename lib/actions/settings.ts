'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createLog } from "@/lib/actions/logs";
import { DEFAULT_SERVICES } from "@/lib/constants/serviceDefaults";

export interface GeneralSettings {
  garageName: string;
  phone: string;
  email: string;
  address: string;
  openTime: string;
  closeTime: string;
  days: string[];
}

export interface HolidaySettings {
  isHoliday: boolean;
  reason: string;
  openAt: string;
}

export interface QuickLink {
  label: string;
  href: string;
}

export interface SocialLinks {
  instagram: string;
  facebook: string;
  whatsapp: string;
}

export interface HeroSection {
  title?: string;
  title1?: string;
  title2?: string;
  subtitle?: string;
  ctaText?: string;
  isVisible?: boolean;
  [key: string]: unknown;
}

export interface StatsSection {
  motors: string;
  satisfaction: string;
  experience: string;
  support: string;
}

export interface CtaSection {
  title: string;
  subtitle: string;
}

export interface FooterSection {
  description: string;
  quickLinks: QuickLink[];
  social: SocialLinks;
}

export interface LandingPageContent {
  stats: StatsSection;
  features: unknown[];
  hero: HeroSection;
  promos: unknown[];
  services: unknown;
  cta: CtaSection;
  footer: FooterSection;
  [key: string]: unknown;
}

export interface UpdateSettingResult {
  success: boolean;
  error?: string;
}

export interface SettingsResult {
  general: GeneralSettings;
  holiday: HolidaySettings;
  content: LandingPageContent;
}

/**
 * Retrieves a single system setting value by key.
 * Returns default value if not found.
 * 
 * @param key Setting key (e.g. 'garage_name', 'tax_rate').
 * @param defaultValue Default fallback value.
 * @returns Setting value.
 */
export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key }
    });

    if (setting && setting.value) {
      return JSON.parse(setting.value) as T;
    }
    return defaultValue;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Updates or creates a new system setting.
 * Automatically revalidates affected layout paths.
 * 
 * @param key Setting key.
 * @param value Value to store.
 * @returns Status object indicating success or failure.
 */
export async function updateSetting(key: string, value: unknown): Promise<UpdateSettingResult> {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "OWNER") {
      return { 
        success: false, 
        error: "Access denied: Only Owner can update settings." 
      };
    }
    const stringValue = JSON.stringify(value);
    console.log(`[SETTINGS] Updating ${key}:`, stringValue);
    
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value: stringValue },
      create: { key, value: stringValue }
    });

    revalidatePath("/", "layout");
    revalidatePath("/admin/settings");
    
    await createLog({
      action: "UPDATE_SETTINGS",
      title: `Setting ${key} Updated`,
      details: `Changed configuration for ${key}`,
      metadata: { key, value }
    });

    return { success: true };
  } catch (error) {
    console.error(`Error updating setting ${key}:`, error);
    return { 
      success: false, 
      error: "Failed to update settings" 
    };
  }
}

/**
 * Retrieves ALL configurations required for the Landing Page.
 * Combines General Settings, Holiday Settings, and Dynamic CMS Content.
 * 
 * @returns Combined settings payload.
 */
export async function getAllSettings(): Promise<SettingsResult> {
  const general = await getSetting<GeneralSettings>("general", {
    garageName: "NopzGarage",
    phone: "0812-3456-7890",
    email: "info@nopzgarage.com",
    address: "Jl. Racing Street No. 88, Jakarta Selatan",
    openTime: "08:00",
    closeTime: "17:00",
    days: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
  });

  const holiday = await getSetting<HolidaySettings>("holiday", {
    isHoliday: false,
    reason: "",
    openAt: ""
  });

  const defaultContent: LandingPageContent = {
    stats: {
      motors: "5000+",
      satisfaction: "98%",
      experience: "15+",
      support: "24/7"
    },
    features: [
      { 
        title: "Garansi Resmi", 
        desc: "Setiap pengerjaan dilindungi garansi resmi. Kami jamin kepuasan dan kualitas maksimal." 
      },
      { 
        title: "Teknisi Bersertifikat", 
        desc: "Tim mekanik profesional dengan sertifikasi resmi dan pengalaman 15+ tahun." 
      },
      { 
        title: "Spare Parts Original", 
        desc: "Hanya menggunakan spare parts original dan berkualitas tinggi dari distributor resmi." 
      }
    ],
    hero: {
      title1: "Servis Motor",
      title2: "Cepat & Terpercaya",
      subtitle: "Teknisi berpengalaman, peralatan modern, dan layanan berkualitas MotoGP standard untuk motor kesayangan Anda"
    },
    promos: [],
    services: DEFAULT_SERVICES,

    cta: {
      title: "Siap Upgrade Motor Anda?",
      subtitle: "Booking sekarang dan dapatkan konsultasi gratis untuk servis pertama!"
    },
    footer: {
      description: "Bengkel motor premium dengan standar MotoGP. Kepercayaan Anda adalah prioritas kami.",
      quickLinks: [
        { label: "Booking Online", href: "#booking" },
        { label: "Cek Status Motor", href: "/status" },
        { label: "Price List", href: "#services" }
      ],
      social: {
        instagram: "#",
        facebook: "#",
        whatsapp: "#"
      }
    }
  };

  const savedContent = await getSetting<LandingPageContent>("landing_content", defaultContent);
  
  const allSections = await prisma.contentSection.findMany();

  const dynamicSections = allSections.reduce((acc: Record<string, unknown>, sec) => {
    acc[sec.sectionKey] = {
      ...sec,
      updatedAt: sec.updatedAt instanceof Date ? sec.updatedAt.toISOString() : sec.updatedAt,
      content: sec.content || {} 
    };
    return acc;
  }, {} as Record<string, unknown>);

  const content = { ...savedContent, ...dynamicSections } as LandingPageContent;

  if (dynamicSections["features"] && typeof dynamicSections["features"] === "object") {
    const featSection = dynamicSections["features"] as { content?: { items?: unknown[] } };
    if (featSection.content?.items && Array.isArray(featSection.content.items)) {
      content.features = featSection.content.items;
    }
  }

  if (dynamicSections["stats"] && typeof dynamicSections["stats"] === "object") {
    const statsSection = dynamicSections["stats"] as { content?: Record<string, unknown> };
    if (statsSection.content) {
      content.stats = {
        ...content.stats,
        ...statsSection.content
      } as StatsSection;
    }
  }

  if (dynamicSections["hero"] && typeof dynamicSections["hero"] === "object") {
    const heroSection = dynamicSections["hero"] as { content?: Record<string, unknown> };
    if (heroSection.content) {
      content.hero = {
        ...content.hero,
        ...heroSection.content
      };
    }
  }

  return { general, holiday, content };
}
