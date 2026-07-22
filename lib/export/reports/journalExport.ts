// lib/export/reports/journal-export.ts
import { PDFGenerator, formatCurrency, formatShortDate } from "../pdfGenerator";
import { ExcelGenerator, formatExcelCurrency, formatExcelDate } from "../excelGenerator";
import type { JournalEntryExport, ExportFormat, PageOrientation } from "../types";

export async function exportJournalEntries(
  entries: JournalEntryExport[],
  format: ExportFormat,
  orientation: PageOrientation = "landscape"
) {
  if (format === "pdf") {
    return exportJournalToPDF(entries, orientation);
  } else {
    return exportJournalEntriesToExcel(entries);
  }
}

function exportJournalToPDF(
  entries: JournalEntryExport[],
  orientation: PageOrientation
): Blob {
  const pdf = new PDFGenerator(orientation);

  // Add letterhead
  pdf.addLetterhead();

  // Add title
  pdf.addTitle("JURNAL UMUM (GENERAL JOURNAL)", `Periode: ${formatShortDate(new Date())}`);

  // Prepare table data
  const headers = ["Tanggal", "Deskripsi", "Ref", "Akun", "Debit", "Kredit"];
  const rows: any[][] = [];

  let totalDebit = 0;
  let totalCredit = 0;

  entries.forEach((entry) => {
    entry.items.forEach((item, idx) => {
      const row = [];

      // Date and description only on first row
      if (idx === 0) {
        row.push(formatShortDate(entry.date));
        row.push(entry.description);
        row.push(entry.reference ? entry.reference.slice(-8) : "-");
      } else {
        row.push(""); // Empty date
        row.push(""); // Empty description
        row.push(""); // Empty ref
      }

      // Account - dalam satu baris dengan kode di akhir
      row.push(`${item.account.name} (${item.account.code})`);

      // Debit
      row.push(item.debit > 0 ? formatCurrency(item.debit) : "-");
      totalDebit += item.debit;

      // Credit
      row.push(item.credit > 0 ? formatCurrency(item.credit) : "-");
      totalCredit += item.credit;

      rows.push(row);
    });

    // Add spacing row between entries
    rows.push(["", "", "", "", "", ""]);
  });

  // Add totals as footer
  const footerRows = [
    ["", "", "", "TOTAL", formatCurrency(totalDebit), formatCurrency(totalCredit)],
  ];

  pdf.addTable(headers, rows, {
    footerRows,
    columnStyles: {
      0: { cellWidth: 22, halign: "center" }, // Tanggal
      1: { cellWidth: "auto" }, // Deskripsi - auto width
      2: { cellWidth: 18, halign: "center" }, // Ref
      3: { cellWidth: "auto" }, // Akun - auto width
      4: { cellWidth: 32, halign: "right" }, // Debit
      5: { cellWidth: 32, halign: "right" }, // Kredit
    },
  });

  // Add summary
  pdf.addSpacing(5);
  pdf.addText(`Total Entries: ${entries.length}`, { bold: true });
  pdf.addText(`Balance Check: ${totalDebit === totalCredit ? "✓ Balanced" : "✗ Unbalanced"}`, {
    bold: true,
  });

  return pdf.getBlob();
}

async function exportJournalEntriesToExcel(entries: JournalEntryExport[]): Promise<Blob> {
  const excel = new ExcelGenerator();

  // Create sheet
  excel.createSheet("Jurnal Umum");

  // Add letterhead
  excel.addLetterhead();

  // Add title
  excel.addTitle("JURNAL UMUM (GENERAL JOURNAL)", `Periode: ${formatExcelDate(new Date())}`);

  // Prepare table
  const headers = ["Tanggal", "Deskripsi", "Ref", "Akun", "Kode Akun", "Debit", "Kredit"];
  const rows: any[][] = [];

  let totalDebit = 0;
  let totalCredit = 0;

  entries.forEach((entry) => {
    entry.items.forEach((item, idx) => {
      const row = [];

      // Date and description only on first row
      if (idx === 0) {
        row.push(formatExcelDate(entry.date));
        row.push(entry.description);
        row.push(entry.reference || "-");
      } else {
        row.push("");
        row.push("");
        row.push("");
      }

      // Account info
      row.push(item.account.name);
      row.push(item.account.code);

      // Amounts
      row.push(item.debit > 0 ? formatExcelCurrency(item.debit) : "-");
      row.push(item.credit > 0 ? formatExcelCurrency(item.credit) : "-");

      totalDebit += item.debit;
      totalCredit += item.credit;

      rows.push(row);
    });

    // Add empty row between entries
    rows.push(["", "", "", "", "", "", ""]);
  });

  // Add table with totals
  excel.addTable(headers, rows, {
    totals: ["", "", "", "TOTAL", "", formatExcelCurrency(totalDebit), formatExcelCurrency(totalCredit)],
  });

  // Add summary
  excel.addSpacing();
  excel.addRow([`Total Entries: ${entries.length}`]);
  excel.addRow([`Balance: ${totalDebit === totalCredit ? "Balanced" : "Unbalanced"}`]);

  // Set column widths
  excel.setColumnWidths([12, 30, 12, 25, 12, 15, 15]);

  return await excel.getBlob();
}
