// lib/config/company-info.ts
export const COMPANY_INFO = {
  name: "Nopz Garage",
  address: "Jl. [Alamat Lengkap]", // TODO: Update with actual address
  city: "[Kota]",
  postalCode: "[Kode Pos]",
  phone: "[Nomor Telepon]", // TODO: Update with actual phone
  email: "info@nopzgarage.com", // TODO: Update with actual email
  website: "www.nopzgarage.com",
  socialMedia: {
    instagram: "@nopzgarage", // TODO: Update with actual Instagram
    facebook: "nopzgarage", // TODO: Update with actual Facebook
    twitter: "@nopzgarage", // Optional
  },
  logo: "/logo.svg", // Path to logo in public directory
};

export const EXPORT_CONFIG = {
  maxFontSize: 10, // Maximum font size in pt
  defaultOrientation: "portrait" as "portrait" | "landscape",
  pageMargins: {
    top: 60,
    bottom: 20,
    left: 20,
    right: 20,
  },
  colors: {
    primary: "#1e40af", // Primary brand color
    secondary: "#64748b",
    success: "#16a34a",
    danger: "#dc2626",
    headerBg: "#f8fafc",
  },
};
