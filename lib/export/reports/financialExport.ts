// lib/export/reports/financialExport.ts
import { PDFGenerator, formatCurrency, formatDate } from "../pdfGenerator";
import { ExcelGenerator, formatExcelCurrency, formatExcelDate } from "../excelGenerator";
import type { ExportFormat, PageOrientation, IncomeStatementData, CashFlowData, ExpenseExportData } from "../types";

/**
 * Exports Income Statement report to PDF or Excel format.
 * 
 * @param data Income statement data to export
 * @param format Export document format ("pdf" or "excel")
 * @param orientation PDF page orientation ("portrait" or "landscape")
 * @returns {Promise<Blob>} Document Blob result
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

/**
 * Exports Cash Flow report to PDF or Excel format.
 */
export async function exportCashFlow(
  data: CashFlowData,
  format: ExportFormat,
  orientation: PageOrientation = "portrait"
): Promise<Blob> {
  if (format === "pdf") {
    return exportCashFlowToPDF(data, orientation);
  }
  return exportCashFlowToExcel(data);
}

function exportCashFlowToPDF(
  data: CashFlowData,
  orientation: PageOrientation
): Blob {
  const pdf = new PDFGenerator(orientation);

  pdf.addLetterhead();
  pdf.addTitle("LAPORAN ARUS KAS (CASH FLOW STATEMENT)", `Periode: ${data.period}`);

  // Summary Section
  pdf.addText("IKHTISAR ARUS KAS", { bold: true });
  pdf.addSpacing(2);

  const summaryHeaders = ["Keterangan", "Jumlah"];
  const summaryRows = [
    ["SALDO AWAL KAS & BANK", formatCurrency(data.beginningCash)],
    ["Penerimaan Kas dari Pelanggan", formatCurrency(data.inflowRevenue)],
    ["Penerimaan Kas Lainnya", formatCurrency(data.inflowOther)],
    ["Pengeluaran Kas Pembelian Spare Part", `(${formatCurrency(data.outflowParts)})`],
    ["Pengeluaran Kas Operasional & Beban", `(${formatCurrency(data.outflowOperating)})`],
    ["Pengeluaran Kas Lainnya", `(${formatCurrency(data.outflowOther)})`],
    ["KENAIKAN / (PENURUNAN) NETTO KAS", formatCurrency(data.netChange)],
    ["SALDO AKHIR KAS & BANK", formatCurrency(data.endingCash)],
  ];

  pdf.addTable(summaryHeaders, summaryRows, {
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 50, halign: "right" },
    },
  });

  pdf.addSpacing(5);

  // Detailed Transactions
  if (data.transactions && data.transactions.length > 0) {
    pdf.addText("RINCIAN MUTASI KAS", { bold: true });
    pdf.addSpacing(2);

    const detailHeaders = ["Tanggal", "Keterangan", "Referensi", "Kategori", "Masuk", "Keluar", "Saldo"];
    const detailRows = data.transactions.map((t) => [
      formatDate(t.date),
      t.description,
      t.reference || "-",
      t.classification === "REVENUE"
        ? "Pendapatan"
        : t.classification === "PARTS"
        ? "Spare Part"
        : t.classification === "OPERATING"
        ? "Operasional"
        : "Lain-lain",
      t.inflow > 0 ? formatCurrency(t.inflow) : "-",
      t.outflow > 0 ? formatCurrency(t.outflow) : "-",
      formatCurrency(t.balance),
    ]);

    pdf.addTable(detailHeaders, detailRows, {
      columnStyles: {
        0: { cellWidth: 25, halign: "center" },
        1: { cellWidth: "auto" },
        2: { cellWidth: 20 },
        3: { cellWidth: 22, halign: "center" },
        4: { cellWidth: 25, halign: "right" },
        5: { cellWidth: 25, halign: "right" },
        6: { cellWidth: 28, halign: "right" },
      },
    });
  }

  return pdf.getBlob();
}

async function exportCashFlowToExcel(data: CashFlowData): Promise<Blob> {
  const excel = new ExcelGenerator();
  excel.createSheet("Arus Kas");
  excel.addLetterhead();
  excel.addTitle("LAPORAN ARUS KAS (CASH FLOW STATEMENT)", `Periode: ${data.period}`);

  // Summary Table
  excel.addRow(["IKHTISAR ARUS KAS"]);
  const summaryHeaders = ["Keterangan", "Jumlah"];
  const summaryRows = [
    ["SALDO AWAL KAS & BANK", formatExcelCurrency(data.beginningCash)],
    ["Penerimaan Kas dari Pelanggan", formatExcelCurrency(data.inflowRevenue)],
    ["Penerimaan Kas Lainnya", formatExcelCurrency(data.inflowOther)],
    ["Pengeluaran Kas Pembelian Spare Part", -data.outflowParts], // Excel handles negative formatting natively
    ["Pengeluaran Kas Operasional & Beban", -data.outflowOperating],
    ["Pengeluaran Kas Lainnya", -data.outflowOther],
    ["KENAIKAN / (PENURUNAN) NETTO KAS", formatExcelCurrency(data.netChange)],
    ["SALDO AKHIR KAS & BANK", formatExcelCurrency(data.endingCash)],
  ];
  excel.addTable(summaryHeaders, summaryRows);

  excel.addSpacing(2);

  // Detailed Ledger
  if (data.transactions && data.transactions.length > 0) {
    excel.addRow(["RINCIAN MUTASI KAS"]);
    const detailHeaders = ["Tanggal", "Keterangan", "Referensi", "Kategori", "Masuk", "Keluar", "Saldo"];
    const detailRows = data.transactions.map((t) => [
      formatExcelDate(t.date),
      t.description,
      t.reference || "-",
      t.classification,
      t.inflow > 0 ? formatExcelCurrency(t.inflow) : 0,
      t.outflow > 0 ? formatExcelCurrency(t.outflow) : 0,
      formatExcelCurrency(t.balance),
    ]);
    excel.addTable(detailHeaders, detailRows);
  }

  excel.setColumnWidths([15, 45, 15, 15, 18, 18, 20]);
  return await excel.getBlob();
}

/**
 * Exports Detailed Expense report to PDF or Excel format.
 */
export async function exportExpenses(
  data: ExpenseExportData,
  format: ExportFormat,
  orientation: PageOrientation = "portrait"
): Promise<Blob> {
  if (format === "pdf") {
    return exportExpensesToPDF(data, orientation);
  }
  return exportExpensesToExcel(data);
}

function exportExpensesToPDF(
  data: ExpenseExportData,
  orientation: PageOrientation
): Blob {
  const pdf = new PDFGenerator(orientation);

  pdf.addLetterhead();
  pdf.addTitle("LAPORAN RENCANA PENGELUARAN (EXPENSE LIST)", `Periode: ${data.period}`);

  const headers = ["Tanggal", "Deskripsi", "Kategori", "Sumber Dana", "Jumlah"];
  const rows = data.expenses.map((e) => [
    formatDate(e.date),
    e.description,
    e.category,
    e.source,
    formatCurrency(e.amount),
  ]);

  pdf.addTable(headers, rows, {
    footerRows: [["", "", "", "TOTAL PENGELUARAN", formatCurrency(data.totalExpense)]],
    columnStyles: {
      0: { cellWidth: 28, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 40 },
      3: { cellWidth: 35 },
      4: { cellWidth: 35, halign: "right" },
    },
  });

  return pdf.getBlob();
}

async function exportExpensesToExcel(data: ExpenseExportData): Promise<Blob> {
  const excel = new ExcelGenerator();
  excel.createSheet("Pengeluaran");
  excel.addLetterhead();
  excel.addTitle("LAPORAN PENGELUARAN BENGKEL", `Periode: ${data.period}`);

  const headers = ["Tanggal", "Deskripsi", "Kategori", "Sumber Dana", "Jumlah"];
  const rows = data.expenses.map((e) => [
    formatExcelDate(e.date),
    e.description,
    e.category,
    e.source,
    formatExcelCurrency(e.amount),
  ]);

  excel.addTable(headers, rows, {
    totals: ["", "", "", "TOTAL PENGELUARAN", formatExcelCurrency(data.totalExpense)],
  });

  excel.setColumnWidths([15, 45, 20, 20, 20]);
  return await excel.getBlob();
}
