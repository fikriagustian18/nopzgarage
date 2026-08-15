// lib/export/reports/financialExport.ts
import { PDFGenerator, formatCurrency, formatDate } from "../pdfGenerator";
import { ExcelGenerator, formatExcelCurrency, formatExcelDate } from "../excelGenerator";
import type { ExportFormat, PageOrientation, CashFlowData, CombinedFinancialExportData } from "../types";


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
 * Exports Combined Financial Report (Pendapatan & Pengeluaran) to PDF or Excel format.
 */
export async function exportCombinedFinancialReport(
  data: CombinedFinancialExportData,
  format: ExportFormat,
  orientation: PageOrientation = "landscape"
): Promise<Blob> {
  if (format === "pdf") {
    return exportCombinedFinancialReportToPDF(data, orientation);
  }
  return exportCombinedFinancialReportToExcel(data);
}

function exportCombinedFinancialReportToPDF(
  data: CombinedFinancialExportData,
  orientation: PageOrientation
): Blob {
  const pdf = new PDFGenerator(orientation);

  pdf.addLetterhead();
  pdf.addTitle("LAPORAN KEUANGAN (PENDAPATAN & PENGELUARAN)", `Periode: ${data.period}`);

  // Summary Metrics Table
  pdf.addText("IKHTISAR KEUANGAN", { bold: true });
  pdf.addSpacing(2);

  const summaryHeaders = ["Total Pendapatan", "Total Pengeluaran", "Laba / Rugi Bersih", "Total Transaksi"];
  const summaryRows = [
    [
      formatCurrency(data.totalRevenue),
      formatCurrency(data.totalExpense),
      `${formatCurrency(data.netIncome)} (${data.netIncome >= 0 ? "PROFIT" : "LOSS"})`,
      `${data.totalOrders} Transaksi`,
    ],
  ];

  pdf.addTable(summaryHeaders, summaryRows, {
    columnStyles: {
      0: { halign: "center", fontStyle: "bold" },
      1: { halign: "center", fontStyle: "bold" },
      2: { halign: "center", fontStyle: "bold" },
      3: { halign: "center" },
    },
  });

  pdf.addSpacing(6);

  // Section 1: Revenue Transactions Table
  pdf.addText("1. RINCIAN PENDAPATAN & PEMASUKAN", { bold: true });
  pdf.addSpacing(2);

  const revenueHeaders = [
    "No",
    "Tanggal",
    "ID Order",
    "Pelanggan",
    "Kendaraan",
    "Metode Bayar",
    "Status",
    "Total",
  ];

  const revenueRows = data.orders.map((o, idx) => [
    idx + 1,
    formatDate(o.date),
    o.id.slice(-8).toUpperCase(),
    o.customerName,
    `${o.vehicle} ${o.plateNumber ? `(${o.plateNumber})` : ""}`,
    o.paymentMethod,
    o.paymentStatus === "PAID" ? "Lunas" : "Sebagian/Belum",
    formatCurrency(o.totalAmount),
  ]);

  if (revenueRows.length > 0) {
    pdf.addTable(revenueHeaders, revenueRows, {
      footerRows: [["", "", "", "", "", "", "TOTAL PENDAPATAN", formatCurrency(data.totalRevenue)]],
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        1: { cellWidth: 26, halign: "center" },
        2: { cellWidth: 22, halign: "center" },
        3: { cellWidth: "auto" },
        4: { cellWidth: 45 },
        5: { cellWidth: 28, halign: "center" },
        6: { cellWidth: 28, halign: "center" },
        7: { cellWidth: 32, halign: "right" },
      },
    });
  } else {
    pdf.addText("Tidak ada transaksi pemasukan pada periode ini.");
  }

  pdf.addSpacing(6);

  // Section 2: Expense Transactions Table
  pdf.addText("2. RINCIAN PENGELUARAN OPERASIONAL & BIAYA", { bold: true });
  pdf.addSpacing(2);

  const expenseHeaders = ["No", "Tanggal", "Deskripsi / Pengeluaran", "Kategori", "Sumber Dana", "Jumlah"];
  const expenseRows = data.expenses.map((e, idx) => [
    idx + 1,
    formatDate(e.date),
    e.description,
    e.category,
    e.source,
    formatCurrency(e.amount),
  ]);

  if (expenseRows.length > 0) {
    pdf.addTable(expenseHeaders, expenseRows, {
      footerRows: [["", "", "", "", "TOTAL PENGELUARAN", formatCurrency(data.totalExpense)]],
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        1: { cellWidth: 28, halign: "center" },
        2: { cellWidth: "auto" },
        3: { cellWidth: 38 },
        4: { cellWidth: 32 },
        5: { cellWidth: 35, halign: "right" },
      },
    });
  } else {
    pdf.addText("Tidak ada transaksi pengeluaran pada periode ini.");
  }

  pdf.addSpacing(6);

  // Net Summary Footer
  pdf.addHorizontalLine();
  pdf.addSpacing(3);
  pdf.addText(
    `TOTAL LABA RUGI BERSIH: ${formatCurrency(data.netIncome)} (${data.netIncome >= 0 ? "LABA / PROFIT" : "RUGI / LOSS"})`,
    { bold: true, align: "right" }
  );

  return pdf.getBlob();
}

async function exportCombinedFinancialReportToExcel(
  data: CombinedFinancialExportData
): Promise<Blob> {
  const excel = new ExcelGenerator();

  // Sheet 1: Ringkasan Laba Rugi
  excel.createSheet("Ringkasan Keuangan");
  excel.addLetterhead();
  excel.addTitle("IKHTISAR KEUANGAN BENGKEL", `Periode: ${data.period}`);

  excel.addRow(["RINGKASAN EKSEKUTIF"]);
  const summaryHeaders = ["Komponen Keuangan", "Nilai (Rp)"];
  const summaryRows = [
    ["Total Pendapatan (Revenues)", formatExcelCurrency(data.totalRevenue)],
    ["Total Pengeluaran (Expenses)", formatExcelCurrency(data.totalExpense)],
    ["Laba / (Rugi) Bersih (Net Income)", formatExcelCurrency(data.netIncome)],
    ["Status Keuangan", data.netIncome >= 0 ? "SURPLUS / PROFIT" : "DEFISIT / LOSS"],
    ["Jumlah Transaksi Order", `${data.totalOrders} Transaksi`],
    ["Jumlah Transaksi Pengeluaran", `${data.expenses.length} Transaksi`],
  ];
  excel.addTable(summaryHeaders, summaryRows);

  if (data.incomeStatementAccounts) {
    excel.addSpacing(2);
    excel.addRow(["AKUN PENDAPATAN"]);
    const revHeaders = ["Kode Akun", "Nama Akun", "Saldo (Rp)"];
    const revRows = data.incomeStatementAccounts.revenues.map((r) => [
      r.code,
      r.name,
      formatExcelCurrency(r.balance),
    ]);
    excel.addTable(revHeaders, revRows, {
      totals: ["", "TOTAL PENDAPATAN", formatExcelCurrency(data.totalRevenue)],
    });

    excel.addSpacing(2);
    excel.addRow(["AKUN BEBAN & BIAYA"]);
    const expHeaders = ["Kode Akun", "Nama Akun", "Saldo (Rp)"];
    const expRows = data.incomeStatementAccounts.expenses.map((e) => [
      e.code,
      e.name,
      formatExcelCurrency(e.balance),
    ]);
    excel.addTable(expHeaders, expRows, {
      totals: ["", "TOTAL BEBAN", formatExcelCurrency(data.totalExpense)],
    });
  }

  excel.setColumnWidths([30, 45, 25]);

  // Sheet 2: Pendapatan
  excel.createSheet("Data Pendapatan");
  excel.addLetterhead();
  excel.addTitle("DAFTAR TRANSAKSI PENDAPATAN & PEMASUKAN", `Periode: ${data.period}`);

  const orderHeaders = [
    "No",
    "ID Order",
    "Tanggal",
    "Nama Pelanggan",
    "Kendaraan",
    "Plat Nomor",
    "Tipe Layanan / Item",
    "Mekanik",
    "Metode Bayar",
    "Status Bayar",
    "Total Transaksi (Rp)",
  ];

  const orderRows = data.orders.map((o, idx) => [
    idx + 1,
    o.id,
    formatExcelDate(o.date),
    o.customerName,
    o.vehicle,
    o.plateNumber || "-",
    o.serviceType,
    o.mechanic,
    o.paymentMethod,
    o.paymentStatus,
    formatExcelCurrency(o.totalAmount),
  ]);

  excel.addTable(orderHeaders, orderRows, {
    totals: ["", "", "", "", "", "", "", "", "", "TOTAL PENDAPATAN", formatExcelCurrency(data.totalRevenue)],
  });
  excel.setColumnWidths([8, 25, 18, 25, 20, 15, 30, 20, 15, 15, 22]);

  // Sheet 3: Pengeluaran
  excel.createSheet("Data Pengeluaran");
  excel.addLetterhead();
  excel.addTitle("DAFTAR TRANSAKSI PENGELUARAN BENGKEL", `Periode: ${data.period}`);

  const expHeaders = [
    "No",
    "Tanggal",
    "Deskripsi Pengeluaran",
    "Kategori Pengeluaran",
    "Sumber Dana",
    "Jumlah Pengeluaran (Rp)",
  ];

  const expRows = data.expenses.map((e, idx) => [
    idx + 1,
    formatExcelDate(e.date),
    e.description,
    e.category,
    e.source,
    formatExcelCurrency(e.amount),
  ]);

  excel.addTable(expHeaders, expRows, {
    totals: ["", "", "", "", "TOTAL PENGELUARAN", formatExcelCurrency(data.totalExpense)],
  });
  excel.setColumnWidths([8, 18, 40, 25, 20, 25]);

  return await excel.getBlob();
}
