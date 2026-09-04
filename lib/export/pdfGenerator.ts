// lib/export/pdf-generator.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { COMPANY_INFO, EXPORT_CONFIG } from "../config/companyInfo";
import type { LetterheadConfig, PageOrientation } from "./types";

// Design System Colors
const COLORS = {
  primary: [110, 46, 114], // #6E2E72
  secondary: [254, 104, 4], // #FE6804
  accent: [250, 254, 4], // #FAFE04
  text: [10, 4, 18], // #0a0412
  muted: [248, 249, 250], // #f8f9fa
  border: [232, 233, 235], // #e8e9eb
};

function printableValue(value?: string): string {
  const trimmed = value?.trim() ?? "";
  return trimmed.includes("[") && trimmed.includes("]") ? "" : trimmed;
}

export class PDFGenerator {
  private doc: jsPDF;
  private currentY: number = 0;
  private pageHeight: number;
  private pageWidth: number;

  constructor(orientation: PageOrientation = "portrait") {
    this.doc = new jsPDF({
      orientation,
      unit: "mm",
      format: "a4",
    });

    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.currentY = EXPORT_CONFIG.pageMargins.top;
  }

  // Add letterhead to the document
  addLetterhead(config?: Partial<LetterheadConfig>) {
    const letterhead = {
      companyName: config?.companyName ?? COMPANY_INFO.name,
      address: config?.address ?? COMPANY_INFO.address,
      city: config?.city ?? COMPANY_INFO.city,
      phone: config?.phone ?? COMPANY_INFO.phone,
      email: config?.email ?? COMPANY_INFO.email,
      socialMedia: config?.socialMedia ?? COMPANY_INFO.socialMedia,
    };

    // Try to add logo if available
    try {
      // Logo would go here at position (15, 8) if we can load it
      // For now, we'll use text-based branding
    } catch (error) {
      // Fallback to text-based logo
    }

    // Company name with brand color
    this.doc.setFontSize(16);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    this.doc.text(letterhead.companyName, this.pageWidth / 2, 15, {
      align: "center",
    });

    // Reset to default text color
    this.doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);

    // Address and contact info
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "normal");
    const rawAddress = printableValue(letterhead.address);
    const rawCity = printableValue(letterhead.city);
    const addressCombined = [rawAddress, rawCity].filter(Boolean).join(", ");
    const contactLine1 = addressCombined;

    const rawPhone = printableValue(letterhead.phone);
    const rawEmail = printableValue(letterhead.email);
    const contactParts: string[] = [];
    if (rawPhone) contactParts.push(`Tel: ${rawPhone}`);
    if (rawEmail) contactParts.push(`Email: ${rawEmail}`);
    const contactLine2 = contactParts.join(" | ");

    const socialParts: string[] = [];
    const instagram = printableValue(letterhead.socialMedia?.instagram).replace(/^@/, "");
    const facebook = printableValue(letterhead.socialMedia?.facebook);
    if (instagram) socialParts.push(`Instagram: @${instagram}`);
    if (facebook) socialParts.push(`Facebook: ${facebook}`);
    const socialLine = socialParts.join(" | ");

    if (contactLine1) {
      this.doc.text(contactLine1, this.pageWidth / 2, 22, { align: "center" });
    }
    if (contactLine2) {
      this.doc.text(contactLine2, this.pageWidth / 2, contactLine1 ? 26 : 22, { align: "center" });
    }
    if (socialLine) {
      this.doc.text(socialLine, this.pageWidth / 2, 30, { align: "center" });
    }

    // Line separator with brand color
    this.doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    this.doc.setLineWidth(0.8);
    this.doc.line(15, 35, this.pageWidth - 15, 35);

    this.currentY = 45;
  }

  // Add horizontal line
  addHorizontalLine() {
    this.doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
    this.doc.setLineWidth(0.3);
    this.doc.line(15, this.currentY, this.pageWidth - 15, this.currentY);
    this.currentY += 2;
  }

  // Add document title
  addTitle(title: string, subtitle?: string) {
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    this.doc.text(title, this.pageWidth / 2, this.currentY, {
      align: "center",
    });

    if (subtitle) {
      this.currentY += 6;
      this.doc.setFontSize(9);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
      this.doc.text(subtitle, this.pageWidth / 2, this.currentY, {
        align: "center",
      });
    }

    // Reset text color
    this.doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    this.currentY += 10;
  }

  // Add a simple table
  addTable(
    headers: string[],
    rows: any[][],
    options?: {
      columnStyles?: Record<number, any>;
      footerRows?: any[][];
      styles?: any;
    }
  ) {
    const marginLeft = 10;
    const marginRight = 10;
    const tableWidth = this.pageWidth - marginLeft - marginRight;

    autoTable(this.doc, {
      head: [headers],
      body: rows,
      foot: options?.footerRows || [],
      startY: this.currentY,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
        cellWidth: "wrap",
        lineColor: COLORS.border as [number, number, number],
        lineWidth: 0,
        textColor: COLORS.text as [number, number, number],
        minCellHeight: 6, // Fixed height untuk consistency
        valign: "middle",
        ...options?.styles
      },
      headStyles: {
        fillColor: COLORS.primary as [number, number, number],
        textColor: [255, 255, 255] as [number, number, number],
        fontStyle: "bold",
        fontSize: 8,
        halign: "left",
        lineWidth: { bottom: 0.3 },
        lineColor: COLORS.primary as [number, number, number],
        minCellHeight: 7,
        cellPadding: 2,
      },
      bodyStyles: {
        lineWidth: { bottom: 0.1 },
        lineColor: COLORS.border as [number, number, number],
        minCellHeight: 6,
        cellPadding: 2,
      },
      footStyles: {
        fillColor: COLORS.muted as [number, number, number],
        textColor: COLORS.text as [number, number, number],
        fontStyle: "bold",
        fontSize: 8,
        lineWidth: { top: 0.5, bottom: 0.5 },
        lineColor: COLORS.primary as [number, number, number],
        minCellHeight: 7,
        cellPadding: 2,
      },
      columnStyles: options?.columnStyles || {},
      margin: { left: marginLeft, right: marginRight },
      theme: "plain",
      tableWidth: tableWidth, // Full width dikurangi margin
    });

    // Update currentY after table
    const finalY = (this.doc as any).lastAutoTable?.finalY || this.currentY;
    this.currentY = finalY + 10;
  }

  // Add text
  addText(text: string, options?: { bold?: boolean; align?: "left" | "center" | "right" }) {
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", options?.bold ? "bold" : "normal");
    
    const x = options?.align === "center" 
      ? this.pageWidth / 2 
      : options?.align === "right" 
        ? this.pageWidth - 15 
        : 15;

    this.doc.text(text, x, this.currentY, { align: options?.align || "left" });
    this.currentY += 6;
  }

  // Add spacing
  addSpacing(mm: number = 5) {
    this.currentY += mm;
  }

  // Check if new page is needed
  checkPageBreak(requiredSpace: number = 30) {
    if (this.currentY + requiredSpace > this.pageHeight - 20) {
      this.doc.addPage();
      this.currentY = 20;
      return true;
    }
    return false;
  }

  // Get the PDF blob
  getBlob(): Blob {
    return this.doc.output("blob");
  }

  // Download the PDF
  download(filename: string) {
    this.doc.save(filename);
  }

  // Get PDF as data URL
  getDataUrl(): string {
    return this.doc.output("dataurlstring");
  }
}

// Utility function to format currency
export function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

// Utility function to format date
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Utility function to format short date
export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
