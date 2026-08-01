// lib/export/reports/financialExport.ts
import { PDFGenerator, formatCurrency } from "../pdfGenerator";
import { ExcelGenerator, formatExcelCurrency } from "../excelGenerator";
import type { ExportFormat, PageOrientation, IncomeStatementData } from "../types";

/**
 * Mengekspor Laporan Laba Rugi ke format PDF atau Excel.
 * 
 * @param data Data laporan laba rugi yang akan diekspor
 * @param format Format dokumen hasil ekspor ("pdf" atau "excel")
 * @param orientation Orientasi halaman PDF ("portrait" atau "landscape")
 * @returns {Promise<Blob>} Document Blob hasil ekspor
 */
export async function exportIncomeStatement(
  data: IncomeStatementData,
  format: ExportFormat,
  orientation: PageOrientation = "portrait"
): Promise<Blob> {
  if (format === "pdf") {
    return exportIncomeStatementToPDF(data, orientation);
  }
  return exportIncomeStatementToExcel(data);
}

function exportIncomeStatementToPDF(
  data: IncomeStatementData,
  orientation: PageOrientation
): Blob {
  const pdf = new PDFGenerator(orientation);

  pdf.addLetterhead();
  pdf.addTitle("LAPORAN LABA RUGI (INCOME STATEMENT)", `Periode: ${data.period}`);

  // REVENUE SECTION
  pdf.addText("PENDAPATAN (REVENUE)", { bold: true });
  pdf.addSpacing(2);

  const revenueHeaders = ["Kode", "Nama Akun", "Jumlah"];
  const revenueRows = data.revenues.map((rev) => [
    rev.code,
    rev.name,
    formatCurrency(rev.balance),
  ]);

  pdf.addTable(revenueHeaders, revenueRows, {
    footerRows: [["", "TOTAL PENDAPATAN", formatCurrency(data.totalRevenue)]],
    columnStyles: {
      0: { cellWidth: 20, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 40, halign: "right" },
    },
  });
  pdf.addSpacing(5);

  // EXPENSE SECTION
  pdf.addText("BEBAN & BIAYA (EXPENSES)", { bold: true });
  pdf.addSpacing(2);

  const expenseHeaders = ["Kode", "Nama Akun", "Jumlah"];
  const expenseRows = data.expenses.map((exp) => [
    exp.code,
    exp.name,
    formatCurrency(exp.balance),
  ]);

  pdf.addTable(expenseHeaders, expenseRows, {
    footerRows: [["", "TOTAL BEBAN", formatCurrency(data.totalExpense)]],
    columnStyles: {
      0: { cellWidth: 20, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 40, halign: "right" },
    },
  });

  // NET INCOME
  pdf.addSpacing(10);
  pdf.addHorizontalLine();
  pdf.addSpacing(2);

  const isProfit = data.netIncome >= 0;

  pdf.addText(
    `LABA RUGI (NET INCOME): ${formatCurrency(data.netIncome)}`,
    { bold: true, align: "right" }
  );
  if (isProfit) {
    pdf.addText("(PROFIT)", { bold: true, align: "right" });
  } else {
    pdf.addText("(LOSS)", { bold: true, align: "right" });
  }

  return pdf.getBlob();
}

async function exportIncomeStatementToExcel(
  data: IncomeStatementData
): Promise<Blob> {
  const excel = new ExcelGenerator();
  excel.createSheet("Laba Rugi");
  excel.addLetterhead();
  excel.addTitle("LAPORAN LABA RUGI (INCOME STATEMENT)", `Periode: ${data.period}`);

  // REVENUE
  excel.addRow(["PENDAPATAN (REVENUE)"]);
  const revenueHeaders = ["Kode", "Nama Akun", "Jumlah"];
  const revenueRows = data.revenues.map((rev) => [
    rev.code,
    rev.name,
    formatExcelCurrency(rev.balance),
  ]);
  excel.addTable(revenueHeaders, revenueRows, {
    totals: ["", "TOTAL PENDAPATAN", formatExcelCurrency(data.totalRevenue)],
  });
  excel.addSpacing(2);

  // EXPENSES
  excel.addRow(["BEBAN & BIAYA (EXPENSES)"]);
  const expenseHeaders = ["Kode", "Nama Akun", "Jumlah"];
  const expenseRows = data.expenses.map((exp) => [
    exp.code,
    exp.name,
    formatExcelCurrency(exp.balance),
  ]);
  excel.addTable(expenseHeaders, expenseRows, {
    totals: ["", "TOTAL BEBAN", formatExcelCurrency(data.totalExpense)],
  });
  excel.addSpacing(2);

  // NET INCOME
  excel.addRow(["", "LABA RUGI (NET INCOME)", formatExcelCurrency(data.netIncome)]);

  excel.setColumnWidths([15, 50, 20]);
  return await excel.getBlob();
}
