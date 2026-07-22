import { PDFGenerator, formatCurrency, formatDate } from "../pdfGenerator";
import { ExcelGenerator, formatExcelDate, formatExcelCurrency } from "../excelGenerator";
import type { ExportFormat, PageOrientation } from "../types";

export interface OrderListExport {
  id: string;
  date: Date | string;
  customerName: string;
  vehicle: string;
  plateNumber: string;
  serviceType: string;
  mechanic: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
}

export async function exportOrders(
  data: OrderListExport[],
  format: ExportFormat,
  orientation: PageOrientation = "landscape"
) {
  if (format === "pdf") {
    return exportOrdersToPDF(data, orientation);
  } else {
    return exportOrdersToExcel(data);
  }
}

function exportOrdersToPDF(data: OrderListExport[], orientation: PageOrientation): Blob {
  const pdf = new PDFGenerator(orientation);

  pdf.addLetterhead();
  pdf.addTitle("DAFTAR ORDER & SERVIS", `Per Tanggal: ${formatDate(new Date())}`);

  const headers = [
    "ID Order",
    "Tanggal",
    "Pelanggan",
    "Kendaraan",
    "Mekanik",
    "Status",
    "Pembayaran",
    "Total"
  ];

  const rows = data.map((order) => [
    order.id.slice(-8),
    formatDate(order.date),
    order.customerName,
    `${order.vehicle} (${order.plateNumber || '-'})`,
    order.mechanic,
    order.status,
    order.paymentStatus,
    formatCurrency(order.totalAmount),
  ]);

  pdf.addTable(headers, rows, {
    columnStyles: {
      0: { cellWidth: 22, halign: "center" },
      1: { cellWidth: 28, halign: "center" },
      2: { cellWidth: "auto" },
      3: { cellWidth: "auto" },
      4: { cellWidth: 35 },
      5: { cellWidth: 28, halign: "center" },
      6: { cellWidth: 30, halign: "center" },
      7: { cellWidth: 32, halign: "right" },
    },
  });

  return pdf.getBlob();
}

async function exportOrdersToExcel(data: OrderListExport[]): Promise<Blob> {
  const excel = new ExcelGenerator();
  excel.createSheet("Daftar Order");
  excel.addLetterhead();
  excel.addTitle("DAFTAR ORDER & SERVIS", `Per Tanggal: ${formatDate(new Date())}`);

  const headers = [
    "ID Order",
    "Tanggal",
    "Pelanggan",
    "Kendaraan",
    "Plat Nomor",
    "Tipe Servis",
    "Mekanik",
    "Status",
    "Status Bayar",
    "Total Tagihan"
  ];

  excel.addRow(headers);

  const rows = data.map((order) => [
    order.id,
    formatExcelDate(order.date),
    order.customerName,
    order.vehicle,
    order.plateNumber,
    order.serviceType,
    order.mechanic,
    order.status,
    order.paymentStatus,
    formatExcelCurrency(order.totalAmount),
  ]);

  excel.addRows(rows);
  
  // Auto width approximation
  excel.setColumnWidths([30, 15, 25, 20, 15, 15, 20, 15, 15, 20]);

  return await excel.getBlob();
}
