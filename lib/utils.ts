// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ==================== Tailwind Class Merger ====================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ==================== Currency Formatter ====================
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

// ==================== Number Formatter ====================
export function formatNumber(num: number | string): string {
  const value = typeof num === "string" ? parseFloat(num) : num;
  return new Intl.NumberFormat("id-ID").format(value);
}

// ==================== Date Formatter ====================
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };

  return new Intl.DateTimeFormat("id-ID", options || defaultOptions).format(d);
}

export function formatDateTime(date: Date | string): string {
  return formatDate(date, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

// ==================== Relative Time Formatter ====================
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return "Baru saja";
  }
  if (diffMins < 60) {
    return `${diffMins} menit yang lalu`;
  }
  if (diffHours < 24) {
    return `${diffHours} jam yang lalu`;
  }
  if (diffDays < 7) {
    return `${diffDays} hari yang lalu`;
  }
  
  return formatDate(d);
}

// ==================== Phone Number Formatter ====================
export function formatPhoneNumber(phone: string): string {
  // Format: 0812-3456-7890
  const cleaned = phone.replace(/\D/g, "");
  
  if (cleaned.length <= 4) {
    return cleaned;
  }
  if (cleaned.length <= 8) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }
  
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
}

// ==================== Status Badge Helper ====================
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-700",
    ESTIMATED: "bg-blue-100 text-blue-700",
    CONFIRMED: "bg-cyan-100 text-cyan-700",
    QUEUE: "bg-yellow-100 text-yellow-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    READY: "bg-green-100 text-green-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
    UNPAID: "bg-red-100 text-red-700",
    PARTIAL: "bg-yellow-100 text-yellow-700",
    PAID: "bg-green-100 text-green-700",
  };

  return colors[status] || "bg-gray-100 text-gray-700";
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Menunggu Estimasi",
    ESTIMATED: "Sudah Diestimasi",
    CONFIRMED: "Menunggu Servis",
    QUEUE: "Dalam Antrian",
    IN_PROGRESS: "Sedang Dikerjakan",
    READY: "Siap Diambil",
    COMPLETED: "Selesai",
    CANCELLED: "Dibatalkan",
    UNPAID: "Belum Bayar",
    PARTIAL: "DP",
    PAID: "Lunas",
    LIGHT_SERVICE: "Servis Ringan",
    MODIFICATION: "Modifikasi",
    DAILY: "Harian",
    COMMISSION: "Komisi",
  };

  return labels[status] || status;
}

// ==================== Percentage Calculator ====================
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.round((part / total) * 100);
}

// ==================== Truncate Text ====================
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}...`;
}

// ==================== Generate Short ID ====================
export function generateShortId(length: number = 6): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
}

// ==================== Validate WhatsApp Number ====================
export function formatWhatsAppNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, "");
  
  // Handle Indonesian format
  if (cleaned.startsWith("0")) {
    return `62${cleaned.slice(1)}`;
  }
  if (!cleaned.startsWith("62")) {
    return `62${cleaned}`;
  }
  
  return cleaned;
}

/**
 * Performs a deep clone on a generic object.
 * @template T
 * @param obj Object to clone.
 * @returns A fresh copy of the object.
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Safely parses a JSON string with a fallback value.
 * @template T
 * @param json JSON string to parse.
 * @param fallback Default value if parsing fails.
 * @returns Parsed result or fallback value.
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

// ==================== Detail Date Formatter ====================
/** Formats date for order detail view: "4 Aug 2026, 01:55" */
export function formatDetailDate(dateInput?: string | Date | null): string {
  if (!dateInput) {
    return "-";
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    return "-";
  }

  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

// ==================== Order Number Formatter ====================
/** Formats order ID into "ORD-XXXXXX" format */
export function formatOrderNo(id?: string): string {
  if (!id) {
    return "-";
  }
  if (id.toUpperCase().startsWith("ORD-")) {
    return id.toUpperCase();
  }
  return `ORD-${id.slice(-6).toUpperCase()}`;
}

// ==================== Data Serializer for Next.js Client Components ====================
/**
 * Recursively converts Prisma Decimal instances to plain numbers and Date instances to ISO strings,
 * ensuring objects can be safely passed from Server Components/Actions to Client Components.
 */
export function serializeData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "object") {
    // 1. Prisma Decimal check
    if ("toNumber" in obj && typeof (obj as any).toNumber === "function") {
      return (obj as any).toNumber();
    }
    if (obj.constructor && obj.constructor.name === "Decimal") {
      return Number(obj) as any;
    }

    // 2. Date check
    if (obj instanceof Date) {
      return obj.toISOString() as any;
    }

    // 3. Array check
    if (Array.isArray(obj)) {
      return obj.map((item) => serializeData(item)) as any;
    }

    // 4. Plain Object check (recursion over properties)
    const result: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      result[key] = serializeData((obj as any)[key]);
    }
    return result as T;
  }

  return obj;
}