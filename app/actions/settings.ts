'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createLog } from './logs';

export type GeneralSettings = {
  garageName: string;
  phone: string;
  email: string;
  address: string;
  openTime: string;
  closeTime: string;
  days: string[]; // ['Senin', 'Selasa', ...]
};

export type HolidaySettings = {
  isHoliday: boolean;
  reason: string;
  openAt: string; // Tanggal/Jam buka kembali
};

export type LandingPageContent = {
  stats: {
    motors: string;
    satisfaction: string;
    experience: string;
    support: string;
  };
  features: any[]; // Flexible for new features structure
  hero: {
    title?: string;
    title1?: string;
    title2?: string;
    subtitle?: string;
    ctaText?: string;
    isVisible?: boolean;
    [key: string]: any;
  };
  promos: any[];
  services: any; // Can be array (legacy) or object (new CMS section)
  testimonials: any[];
  cta: {
    title: string;
    subtitle: string;
  };
  footer: {
    description: string;
    quickLinks: {
      label: string;
      href: string;
    }[];
    social: {
      instagram: string;
      facebook: string;
      whatsapp: string; // Link WA
    };
  };
  [key: string]: any; // Allow dynamic sections
};

// ==================== Get Single Setting ====================
/**
 * Mengambil value setting system berdasarkan key.
 * Jika tidak ditemukan, return default value.
 * 
 * @param {string} key - Key setting (misal: 'garage_name', 'tax_rate').
 * @param {any} defaultValue - Nilai default jika key tidak ada.
 * @returns {any} Nilai setting.
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

// ==================== Update Setting ====================
/**
 * Mengupdate atau membuat system setting baru.
 * Otomatis melakukan revalidate path halaman terkait.
 * 
 * @param {string} key - Key setting.
 * @param {any} value - Nilai yang akan disimpan (bisa object/array).
 * @returns {Object} Status sukses.
 */
export async function updateSetting(key: string, value: any) {
  try {
    const stringValue = JSON.stringify(value);
    console.log(`[SETTINGS] Updating ${key}:`, stringValue);
    
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value: stringValue },
      create: { key, value: stringValue }
    });

    revalidatePath('/', 'layout'); // Force refresh layout & page
    revalidatePath('/admin/settings');
    
    // Log
    await createLog({
        action: 'UPDATE_SETTINGS',
        title: `Pengaturan ${key} Diperbarui`,
        details: `Mengubah konfigurasi ${key}`,
        metadata: { key, value }
    });

    return { success: true };
  } catch (error) {
    console.error(`Error updating setting ${key}:`, error);
    return { success: false, error: 'Gagal memperbarui pengaturan' };
  }
}

// ==================== Get All Landing Page Settings ====================
/**
 * Mengambil SEMUA konfigurasi yang diperlukan untuk Landing Page.
 * Menggabungkan General Settings, Holiday, dan Content CMS.
 *
 * Logika:
 * 1. Load setting dasar (General & Holiday).
 * 2. Load konten default/fallback.
 * 3. Load konten dinamis dari CMS (ContentSections).
 * 4. Merge konten CMS ke dalam struktur konten utama.
 * 
 * @returns {Object} Gabungan semua setting (general, holiday, content).
 */
export async function getAllSettings() {
    const general = await getSetting<GeneralSettings>('general', {
        garageName: 'NopzGarage',
        phone: '0812-3456-7890',
        email: 'info@nopzgarage.com',
        address: 'Jl. Racing Street No. 88, Jakarta Selatan',
        openTime: '08:00',
        closeTime: '17:00',
        days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    });

    const holiday = await getSetting<HolidaySettings>('holiday', {
        isHoliday: false,
        reason: '',
        openAt: ''
    });

    // Base Content (Default Fallback)
    const defaultContent: LandingPageContent = {
        stats: {
            motors: "5000+",
            satisfaction: "98%",
            experience: "15+",
            support: "24/7"
        },
        features: [
            { title: "Garansi Resmi", desc: "Setiap pengerjaan dilindungi garansi resmi. Kami jamin kepuasan dan kualitas maksimal." },
            { title: "Teknisi Bersertifikat", desc: "Tim mekanik profesional dengan sertifikasi resmi dan pengalaman 15+ tahun." },
            { title: "Spare Parts Original", desc: "Hanya menggunakan spare parts original dan berkualitas tinggi dari distributor resmi." }
        ],
        hero: {
            title1: "Servis Motor",
            title2: "Cepat & Terpercaya",
            subtitle: "Teknisi berpengalaman, peralatan modern, dan layanan berkualitas MotoGP standard untuk motor kesayangan Anda"
        },
        promos: [],
        services: [
            { title: "Fast Lane Service", desc: "Servis kilat untuk perawatan rutin. Ganti oli, tune up, dan pemeriksaan standar dalam 30 menit." },
            { title: "Project Custom", desc: "Modifikasi body, cat, dan custom part sesuai keinginan. Dikerjakan oleh ahli dengan detail tinggi." },
            { title: "Performance Upgrade", desc: "Tingkatkan performa motor dengan upgrade mesin, exhaust, dan tuning profesional." }
        ],
        testimonials: [
            { name: "Budi Santoso", role: "Pemilik Yamaha R15", comment: "Servis cepat, harga transparan, hasil memuaskan! Motor jadi lebih responsif dan irit. Recommended!", rating: 5 },
            { name: "Dian Pratama", role: "Pemilik Honda CBR", comment: "Project custom body motor saya dikerjakan dengan sangat detail dan presisi. Hasilnya beyond expectation!", rating: 5 },
            { name: "Rizky Aditya", role: "Pemilik Kawasaki Ninja", comment: "Booking online memudahkan, bisa track progress real-time. Teknisinya ramah dan profesional. Top!", rating: 5 }
        ],
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

    // Load from old SystemSetting if exists (Legacy Fallback)
    const savedContent = await getSetting<LandingPageContent>('landing_content', defaultContent);
    
    // Fetch All Dynamic Content Sections (New CMS System)
    const allSections = await prisma.contentSection.findMany();

    // Map Dynamic Sections to Object
    const dynamicSections = allSections.reduce((acc: Record<string, any>, sec: any) => {
        acc[sec.sectionKey] = {
            ...sec,
            updatedAt: sec.updatedAt instanceof Date ? sec.updatedAt.toISOString() : sec.updatedAt,
            // Prisma JSON type is automatically parsed, but we ensure structure
            content: sec.content || {} 
        };
        return acc;
    }, {} as Record<string, any>);

    // Merge: Dynamic Sections override Default/Saved content
    // Note: old 'features' was array, new 'features' is object { title, content: { items: [] } }
    // We should handle this gracefully in page.tsx or normalize here.
    // For now, we simply merge, so content['features'] might become the new object type.
    const content = { ...savedContent, ...dynamicSections };

    // HELPER: Normalize 'features' for backward compatibility if needed
    // If 'features' comes from Dynamic Section, it has .content.items
    // But page.tsx expects array content.features inside map? 
    // Wait, page.tsx recently updated to check content['features']?.length > 0 directly for array
    // OR content['features']?.content?.items
    // Let's ensure page.tsx logic (which I checked) handles array directly.
    // Actually, in previous step I saw: content.features.map(...)
    // So if content.features is an OBJECT from CMS, map will fail.
    
    // FIX: If dynamic 'features' exists, assume we want its items as the array for 'features' prop
    if (dynamicSections['features']?.content?.items) {
        content.features = dynamicSections['features'].content.items;
    }

    // FIX: Normalize 'stats' to flatten fields (motors, etc) to top level so content.stats.motors works
    if (dynamicSections['stats']?.content) {
        content.stats = {
            ...dynamicSections['stats'],
            ...dynamicSections['stats'].content
        };
    }

    // FIX: Normalize 'hero' so ctaText is accessible at content.hero.ctaText
    if (dynamicSections['hero']?.content) {
        content.hero = {
            ...dynamicSections['hero'],
            ...dynamicSections['hero'].content
        };
    }

    return { general, holiday, content };
}
