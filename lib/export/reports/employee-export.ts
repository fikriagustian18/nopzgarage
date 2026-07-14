// lib/export/reports/employee-export.ts
import { PDFGenerator, formatShortDate } from "../pdf-generator";
import { ExcelGenerator, formatExcelDate } from "../excel-generator";
import type { EmployeeExport, ExportFormat, PageOrientation } from "../types";

export async function exportEmployees(
  employees: EmployeeExport[],
  format: ExportFormat,
  orientation: PageOrientation = "landscape"
) {
  if (format === "pdf") {
    return exportEmployeesToPDF(employees, orientation);
  } else {
    return exportEmployeesToExcel(employees);
  }
}

function exportEmployeesToPDF(employees: EmployeeExport[], orientation: PageOrientation): Blob {
  const pdf = new PDFGenerator(orientation);

  // Add letterhead
  pdf.addLetterhead();

  // Add title
  pdf.addTitle("DAFTAR KARYAWAN", `Total: ${employees.length} karyawan`);

  // Prepare table data
  const headers = [
    "ID",
    "Nama",
    "Email",
    "Telepon",
    "Posisi",
    "Departemen",
    "Status",
    "Tanggal Bergabung",
  ];

  const rows = employees.map((emp) => [
    emp.id,
    emp.name,
    emp.email,
    emp.phone || "-",
    emp.position,
    emp.department || "-",
    emp.status,
    formatShortDate(emp.joinDate),
  ]);

  pdf.addTable(headers, rows, {
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: "auto" },
      2: { cellWidth: "auto" },
      3: { cellWidth: 30 },
      4: { cellWidth: 35 },
      5: { cellWidth: 30 },
      6: { cellWidth: 25 },
      7: { cellWidth: 25 },
    },
  });

  // Summary by status
  const statusCounts: Record<string, number> = {};
  employees.forEach((emp) => {
    statusCounts[emp.status] = (statusCounts[emp.status] || 0) + 1;
  });

  pdf.addSpacing(5);
  pdf.addText("Ringkasan Status:", { bold: true });
  Object.entries(statusCounts).forEach(([status, count]) => {
    pdf.addText(`${status}: ${count} karyawan`);
  });

  return pdf.getBlob();
}

async function exportEmployeesToExcel(employees: EmployeeExport[]): Promise<Blob> {
  const excel = new ExcelGenerator();

  // Create sheet
  excel.createSheet("Daftar Karyawan");

  // Add letterhead
  excel.addLetterhead();

  // Add title
  excel.addTitle("DAFTAR KARYAWAN", `Total: ${employees.length} karyawan`);

  // Prepare table
  const headers = [
    "ID",
    "Nama",
    "Email",
    "Telepon",
    "Posisi",
    "Departemen",
    "Status",
    "Tanggal Bergabung",
  ];

  const rows = employees.map((emp) => [
    emp.id,
    emp.name,
    emp.email,
    emp.phone || "-",
    emp.position,
    emp.department || "-",
    emp.status,
    formatExcelDate(emp.joinDate),
  ]);

  excel.addTable(headers, rows);

  // Summary
  const statusCounts: Record<string, number> = {};
  employees.forEach((emp) => {
    statusCounts[emp.status] = (statusCounts[emp.status] || 0) + 1;
  });

  excel.addSpacing();
  excel.addRow(["Ringkasan Status:"]);
  Object.entries(statusCounts).forEach(([status, count]) => {
    excel.addRow([`${status}: ${count} karyawan`]);
  });

  // Set column widths
  excel.setColumnWidths([12, 25, 30, 15, 20, 20, 12, 15]);

  return await excel.getBlob();
}
