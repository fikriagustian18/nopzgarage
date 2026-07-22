// lib/export/excel-generator.ts
import ExcelJS from "exceljs";
import { COMPANY_INFO } from "../config/companyInfo";
import type { LetterheadConfig } from "./types";

export class ExcelGenerator {
  private workbook: ExcelJS.Workbook;
  private currentSheet: ExcelJS.Worksheet | null = null;
  private currentRow: number = 0;

  constructor() {
    this.workbook = new ExcelJS.Workbook();
    this.workbook.creator = COMPANY_INFO.name;
    this.workbook.created = new Date();
  }

  // Create a new sheet
  createSheet(sheetName: string) {
    this.currentSheet = this.workbook.addWorksheet(sheetName);
    this.currentRow = 0;
  }

  // Add letterhead rows
  addLetterhead(config?: Partial<LetterheadConfig>) {
    if (!this.currentSheet) return;

    const letterhead = {
      companyName: config?.companyName || COMPANY_INFO.name,
      address: config?.address || COMPANY_INFO.address,
      city: config?.city || COMPANY_INFO.city,
      phone: config?.phone || COMPANY_INFO.phone,
      email: config?.email || COMPANY_INFO.email,
      socialMedia: config?.socialMedia || COMPANY_INFO.socialMedia,
    };

    // Company name (bold and larger)
    this.currentRow++;
    const companyRow = this.currentSheet.getRow(this.currentRow);
    companyRow.getCell(1).value = letterhead.companyName;
    companyRow.getCell(1).font = { bold: true, size: 16 };

    // Address
    this.currentRow++;
    const addressRow = this.currentSheet.getRow(this.currentRow);
    addressRow.getCell(1).value = `${letterhead.address}, ${letterhead.city}`;

    // Contact
    this.currentRow++;
    const contactRow = this.currentSheet.getRow(this.currentRow);
    contactRow.getCell(1).value = `Tel: ${letterhead.phone} | Email: ${letterhead.email}`;

    // Social media
    if (letterhead.socialMedia) {
      this.currentRow++;
      const socialLine = `Instagram: ${letterhead.socialMedia.instagram || ""} | Facebook: ${letterhead.socialMedia.facebook || ""}`;
      const socialRow = this.currentSheet.getRow(this.currentRow);
      socialRow.getCell(1).value = socialLine;
    }

    // Empty row
    this.currentRow++;
  }

  // Add title
  addTitle(title: string, subtitle?: string) {
    if (!this.currentSheet) return;

    this.currentRow++;
    const titleRow = this.currentSheet.getRow(this.currentRow);
    titleRow.getCell(1).value = title;
    titleRow.getCell(1).font = { bold: true, size: 14 };

    if (subtitle) {
      this.currentRow++;
      const subtitleRow = this.currentSheet.getRow(this.currentRow);
      subtitleRow.getCell(1).value = subtitle;
      subtitleRow.getCell(1).font = { italic: true };
    }

    // Empty row
    this.currentRow++;
  }

  // Add table with headers
  addTable(headers: string[], rows: any[][], options?: { totals?: any[] }) {
    if (!this.currentSheet) return;

    // Add headers
    this.currentRow++;
    const headerRow = this.currentSheet.getRow(this.currentRow);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Add data rows
    if (rows.length > 0) {
      rows.forEach((rowData) => {
        this.currentRow++;
        const dataRow = this.currentSheet!.getRow(this.currentRow);
        rowData.forEach((cellValue, index) => {
          const cell = dataRow.getCell(index + 1);
          cell.value = cellValue;
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });
    }

    // Add totals row if provided
    if (options?.totals) {
      this.currentRow++;
      const totalRow = this.currentSheet.getRow(this.currentRow);
      options.totals.forEach((cellValue, index) => {
        const cell = totalRow.getCell(index + 1);
        cell.value = cellValue;
        cell.font = { bold: true };
        cell.border = {
          top: { style: "double" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    }

    // Empty row after table
    this.currentRow++;
  }

  // Add a single row
  addRow(data: any[]) {
    if (!this.currentSheet) return;

    this.currentRow++;
    const row = this.currentSheet.getRow(this.currentRow);
    data.forEach((cellValue, index) => {
      row.getCell(index + 1).value = cellValue;
    });
  }

  // Add multiple rows
  addRows(rows: any[][]) {
    if (!this.currentSheet) return;

    rows.forEach((rowData) => {
      this.addRow(rowData);
    });
  }

  // Add spacing
  addSpacing(rows: number = 1) {
    this.currentRow += rows;
  }

  // Auto-size columns
  autoSizeColumns(columnCount: number) {
    if (!this.currentSheet) return;

    for (let i = 1; i <= columnCount; i++) {
      this.currentSheet.getColumn(i).width = 15; // Default width
    }
  }

  // Apply column widths
  setColumnWidths(widths: number[]) {
    if (!this.currentSheet) return;

    widths.forEach((width, index) => {
      this.currentSheet!.getColumn(index + 1).width = width;
    });
  }

  // Get the workbook as a blob
  async getBlob(): Promise<Blob> {
    const buffer = await this.workbook.xlsx.writeBuffer();
    return new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }

  // Download the Excel file
  async download(filename: string) {
    const blob = await this.getBlob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // Get workbook for further manipulation
  getWorkbook(): ExcelJS.Workbook {
    return this.workbook;
  }
}

// Utility function to format currency for Excel
export function formatExcelCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

// Utility function to format date for Excel
export function formatExcelDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID");
}
