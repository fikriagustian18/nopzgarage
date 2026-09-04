"use server";

import { prisma } from "@/lib/prisma";
import type { LetterheadConfig } from "@/lib/export/types";
import { COMPANY_INFO } from "./companyInfo";

interface GeneralCompanySetting {
  garageName?: unknown;
  address?: unknown;
  phone?: unknown;
  email?: unknown;
}

function configuredString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

/** Returns export-ready workshop information from SystemConfig.general. */
export async function getCompanyInfo(): Promise<LetterheadConfig> {
  try {
    const setting = await prisma.systemConfig.findUnique({
      where: { key: "general" },
      select: { content: true },
    });
    const general =
      setting?.content && typeof setting.content === "object" && !Array.isArray(setting.content)
        ? (setting.content as GeneralCompanySetting)
        : {};

    return {
      companyName: configuredString(general.garageName, COMPANY_INFO.name),
      address: configuredString(general.address, COMPANY_INFO.address),
      city: COMPANY_INFO.city,
      postalCode: COMPANY_INFO.postalCode,
      phone: configuredString(general.phone, COMPANY_INFO.phone),
      email: configuredString(general.email, COMPANY_INFO.email),
      website: COMPANY_INFO.website,
      socialMedia: COMPANY_INFO.socialMedia,
    };
  } catch (error) {
    console.error("Error loading company information for exports:", error);
    return {
      companyName: COMPANY_INFO.name,
      address: COMPANY_INFO.address,
      city: COMPANY_INFO.city,
      postalCode: COMPANY_INFO.postalCode,
      phone: COMPANY_INFO.phone,
      email: COMPANY_INFO.email,
      website: COMPANY_INFO.website,
      socialMedia: COMPANY_INFO.socialMedia,
    };
  }
}
