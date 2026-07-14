// lib/export/reports/payroll-export.ts
import { PDFGenerator, formatCurrency, formatShortDate } from "../pdf-generator";
import { ExcelGenerator, formatExcelCurrency, formatExcelDate } from "../excel-generator";
import type { PayrollSummary, ExportFormat, PageOrientation } from "../types";

export async function exportPayrollSummary(
  payroll: PayrollSummary,
  format: ExportFormat,
  orientation: PageOrientation = "landscape"
) {
  if (format === "pdf") {
    return exportPayrollToPDF(payroll, orientation);
  } else {
    return exportPayrollToExcel(payroll);
  }
}

function exportPayrollToPDF(payroll: PayrollSummary, orientation: PageOrientation): Blob {
  const pdf = new PDFGenerator(orientation);

  // Add letterhead
  pdf.addLetterhead();

  // Add title
  pdf.addTitle(
    "REKAP GAJI KARYAWAN",
    `Periode: ${formatShortDate(payroll.startDate)} - ${formatShortDate(payroll.endDate)}`
  );

  // Prepare table data
  const headers = [
    "ID",
    "Nama Karyawan",
    "Posisi",
    "Gaji Pokok",
    "Tunjangan",
    "Potongan",
    "Gaji Bersih",
  ];

  const rows = payroll.entries.map((entry) => [
    entry.employeeId,
    entry.employeeName,
    entry.position,
    formatCurrency(entry.basicSalary),
    formatCurrency(entry.allowances || 0),
    formatCurrency(entry.deductions || 0),
    formatCurrency(entry.netSalary),
  ]);

  // Add totals
  const totalBasic = payroll.entries.reduce((sum, e) => sum + e.basicSalary, 0);
  const totalAllowances = payroll.entries.reduce((sum, e) => sum + (e.allowances || 0), 0);
  const totalDeductions = payroll.entries.reduce((sum, e) => sum + (e.deductions || 0), 0);

  const footerRows = [
    [
      "",
      "",
      "TOTAL",
      formatCurrency(totalBasic),
      formatCurrency(totalAllowances),
      formatCurrency(totalDeductions),
      formatCurrency(payroll.totalSalary),
    ],
  ];

  pdf.addTable(headers, rows, {
    footerRows,
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: "auto" }, // Auto width for Name
      2: { cellWidth: 30 },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 25, halign: "right" },
      5: { cellWidth: 25, halign: "right" },
      6: { cellWidth: 30, halign: "right" },
    },
  });

  // Summary
  pdf.addSpacing(5);
  pdf.addText(`Jumlah Karyawan: ${payroll.entries.length}`, { bold: true });
  pdf.addText(`Total Penggajian: ${formatCurrency(payroll.totalSalary)}`, { bold: true });

  return pdf.getBlob();
}

async function exportPayrollToExcel(payroll: PayrollSummary): Promise<Blob> {
  const excel = new ExcelGenerator();

  // Create sheet
  excel.createSheet("Rekap Gaji");

  // Add letterhead
  excel.addLetterhead();

  // Add title
  excel.addTitle(
    "REKAP GAJI KARYAWAN",
    `Periode: ${formatExcelDate(payroll.startDate)} - ${formatExcelDate(payroll.endDate)}`
  );

  // Prepare table
  const headers = [
    "ID",
    "Nama Karyawan",
    "Posisi",
    "Gaji Pokok",
    "Tunjangan",
    "Potongan",
    "Gaji Bersih",
  ];

  const rows = payroll.entries.map((entry) => [
    entry.employeeId,
    entry.employeeName,
    entry.position,
    formatExcelCurrency(entry.basicSalary),
    formatExcelCurrency(entry.allowances || 0),
    formatExcelCurrency(entry.deductions || 0),
    formatExcelCurrency(entry.netSalary),
  ]);

  // Calculate totals
  const totalBasic = payroll.entries.reduce((sum, e) => sum + e.basicSalary, 0);
  const totalAllowances = payroll.entries.reduce((sum, e) => sum + (e.allowances || 0), 0);
  const totalDeductions = payroll.entries.reduce((sum, e) => sum + (e.deductions || 0), 0);

  excel.addTable(headers, rows, {
    totals: [
      "",
      "",
      "TOTAL",
      formatExcelCurrency(totalBasic),
      formatExcelCurrency(totalAllowances),
      formatExcelCurrency(totalDeductions),
      formatExcelCurrency(payroll.totalSalary),
    ],
  });

  // Summary
  excel.addSpacing();
  excel.addRow([`Jumlah Karyawan: ${payroll.entries.length}`]);
  excel.addRow([`Total Penggajian: ${formatExcelCurrency(payroll.totalSalary)}`]);

  // Set column widths
  excel.setColumnWidths([12, 30, 25, 15, 15, 15, 18]);

  return await excel.getBlob();
}
