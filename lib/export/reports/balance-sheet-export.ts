// lib/export/reports/balance-sheet-export.ts
import { PDFGenerator, formatCurrency, formatDate } from "../pdf-generator";
import { ExcelGenerator, formatExcelCurrency, formatExcelDate } from "../excel-generator";
import type { BalanceSheetData, ExportFormat, PageOrientation } from "../types";

export async function exportBalanceSheet(
  data: BalanceSheetData,
  format: ExportFormat,
  orientation: PageOrientation = "portrait"
) {
  if (format === "pdf") {
    return exportBalanceSheetToPDF(data, orientation);
  } else {
    return exportBalanceSheetToExcel(data);
  }
}

function exportBalanceSheetToPDF(
  data: BalanceSheetData,
  orientation: PageOrientation
): Blob {
  const pdf = new PDFGenerator(orientation);

  // Add letterhead
  pdf.addLetterhead();

  // Add title
  pdf.addTitle("NERACA (BALANCE SHEET)", `Per Tanggal: ${formatDate(data.date)}`);

  // ASSETS Section
  pdf.addText("ASET (ASSETS)", { bold: true });
  pdf.addSpacing(2);

  data.assets.forEach((section) => {
    const headers = ["Kode", "Nama Akun", "Saldo"];
    const rows = section.accounts.map((acc) => [
      acc.code,
      acc.name,
      formatCurrency(acc.balance),
    ]);

    pdf.addText(section.title, { bold: true });
    pdf.addTable(headers, rows, {
      footerRows: [["", "Total " + section.title, formatCurrency(section.total)]],
      columnStyles: {
        0: { cellWidth: 20, halign: "center" },
        1: { cellWidth: "auto" }, // Auto width untuk nama akun
        2: { cellWidth: 35, halign: "right" },
      },
    });
    pdf.addSpacing(5);
  });

  const totalAssets = data.assets.reduce((sum, section) => sum + section.total, 0);
  pdf.addText(`TOTAL ASET: ${formatCurrency(totalAssets)}`, { bold: true, align: "right" });
  pdf.addSpacing(10);

  pdf.checkPageBreak();

  // LIABILITIES Section
  pdf.addText("KEWAJIBAN (LIABILITIES)", { bold: true });
  pdf.addSpacing(2);

  data.liabilities.forEach((section) => {
    const headers = ["Kode", "Nama Akun", "Saldo"];
    const rows = section.accounts.map((acc) => [
      acc.code,
      acc.name,
      formatCurrency(acc.balance),
    ]);

    pdf.addText(section.title, { bold: true });
    pdf.addTable(headers, rows, {
      footerRows: [["", "Total " + section.title, formatCurrency(section.total)]],
      columnStyles: {
        0: { cellWidth: 20, halign: "center" },
        1: { cellWidth: "auto" }, // Auto width untuk nama akun
        2: { cellWidth: 35, halign: "right" },
      },
    });
    pdf.addSpacing(5);
  });

  const totalLiabilities = data.liabilities.reduce((sum, section) => sum + section.total, 0);
  pdf.addText(`TOTAL KEWAJIBAN: ${formatCurrency(totalLiabilities)}`, {
    bold: true,
    align: "right",
  });
  pdf.addSpacing(10);

  pdf.checkPageBreak();

  // EQUITY Section
  pdf.addText("EKUITAS (EQUITY)", { bold: true });
  pdf.addSpacing(2);

  data.equity.forEach((section) => {
    const headers = ["Kode", "Nama Akun", "Saldo"];
    const rows = section.accounts.map((acc) => [
      acc.code,
      acc.name,
      formatCurrency(acc.balance),
    ]);

    pdf.addText(section.title, { bold: true });
    pdf.addTable(headers, rows, {
      footerRows: [["", "Total " + section.title, formatCurrency(section.total)]],
      columnStyles: {
        0: { cellWidth: 20, halign: "center" },
        1: { cellWidth: "auto" }, // Auto width untuk nama akun
        2: { cellWidth: 35, halign: "right" },
      },
    });
    pdf.addSpacing(5);
  });

  const totalEquity = data.equity.reduce((sum, section) => sum + section.total, 0);
  pdf.addText(`TOTAL EKUITAS: ${formatCurrency(totalEquity)}`, { bold: true, align: "right" });
  pdf.addSpacing(10);

  // Grand Total
  pdf.addHorizontalLine();
  pdf.addSpacing(2);
  pdf.addText(
    `TOTAL KEWAJIBAN + EKUITAS: ${formatCurrency(totalLiabilities + totalEquity)}`,
    { bold: true, align: "right" }
  );

  // Balance check
  const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;
  pdf.addSpacing(5);
  pdf.addText(`Status: ${isBalanced ? "✓ BALANCED" : "✗ UNBALANCED"}`, { bold: true });

  return pdf.getBlob();
}

async function exportBalanceSheetToExcel(data: BalanceSheetData): Promise<Blob> {
  const excel = new ExcelGenerator();

  // Create sheet
  excel.createSheet("Neraca");

  // Add letterhead
  excel.addLetterhead();

  // Add title
  excel.addTitle("NERACA (BALANCE SHEET)", `Per Tanggal: ${formatExcelDate(data.date)}`);

  // ASSETS
  excel.addRow(["ASET (ASSETS)"]);
  excel.addSpacing();

  data.assets.forEach((section) => {
    excel.addRow([section.title]);
    const headers = ["Kode", "Nama Akun", "Saldo"];
    const rows = section.accounts.map((acc) => [
      acc.code,
      acc.name,
      formatExcelCurrency(acc.balance),
    ]);

    excel.addTable(headers, rows, {
      totals: ["", "Total " + section.title, formatExcelCurrency(section.total)],
    });
  });

  const totalAssets = data.assets.reduce((sum, section) => sum + section.total, 0);
  excel.addRow(["", "TOTAL ASET", formatExcelCurrency(totalAssets)]);
  excel.addSpacing(2);

  // LIABILITIES
  excel.addRow(["KEWAJIBAN (LIABILITIES)"]);
  excel.addSpacing();

  data.liabilities.forEach((section) => {
    excel.addRow([section.title]);
    const headers = ["Kode", "Nama Akun", "Saldo"];
    const rows = section.accounts.map((acc) => [
      acc.code,
      acc.name,
      formatExcelCurrency(acc.balance),
    ]);

    excel.addTable(headers, rows, {
      totals: ["", "Total " + section.title, formatExcelCurrency(section.total)],
    });
  });

  const totalLiabilities = data.liabilities.reduce((sum, section) => sum + section.total, 0);
  excel.addRow(["", "TOTAL KEWAJIBAN", formatExcelCurrency(totalLiabilities)]);
  excel.addSpacing(2);

  // EQUITY
  excel.addRow(["EKUITAS (EQUITY)"]);
  excel.addSpacing();

  data.equity.forEach((section) => {
    excel.addRow([section.title]);
    const headers = ["Kode", "Nama Akun", "Saldo"];
    const rows = section.accounts.map((acc) => [
      acc.code,
      acc.name,
      formatExcelCurrency(acc.balance),
    ]);

    excel.addTable(headers, rows, {
      totals: ["", "Total " + section.title, formatExcelCurrency(section.total)],
    });
  });

  const totalEquity = data.equity.reduce((sum, section) => sum + section.total, 0);
  excel.addRow(["", "TOTAL EKUITAS", formatExcelCurrency(totalEquity)]);
  excel.addSpacing(2);

  // Grand Total
  excel.addRow([
    "",
    "TOTAL KEWAJIBAN + EKUITAS",
    formatExcelCurrency(totalLiabilities + totalEquity),
  ]);

  // Set column widths
  excel.setColumnWidths([15, 40, 20]);

  return await excel.getBlob();
}
