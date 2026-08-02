// lib/export/reports/invoiceExport.ts
import { PDFGenerator, formatCurrency, formatDate } from "../pdfGenerator";
import { ExcelGenerator, formatExcelCurrency, formatExcelDate } from "../excelGenerator";
import type { InvoiceExport, ExportFormat, PageOrientation } from "../types";

export async function exportInvoice(
  invoice: InvoiceExport,
  format: ExportFormat,
  orientation: PageOrientation = "portrait"
) {
  if (format === "pdf") {
    return exportInvoiceToPDF(invoice, orientation);
  }
  return exportInvoiceToExcel(invoice);
}

function exportInvoiceToPDF(invoice: InvoiceExport, orientation: PageOrientation): Blob {
  const pdf = new PDFGenerator(orientation);

  // Add letterhead
  pdf.addLetterhead();

  // Add title
  pdf.addTitle("INVOICE", `No: ${invoice.invoiceNumber}`);

  // Invoice details
  pdf.addText(`Tanggal Invoice: ${formatDate(invoice.invoiceDate)}`);
  if (invoice.dueDate) {
    pdf.addText(`Jatuh Tempo: ${formatDate(invoice.dueDate)}`);
  }
  pdf.addSpacing(3);

  // Customer info
  pdf.addText("KEPADA:", { bold: true });
  pdf.addText(invoice.customerName);
  if (invoice.customerAddress) {
    pdf.addText(invoice.customerAddress);
  }
  pdf.addSpacing(5);

  // Items table
  const headers = ["#", "Deskripsi", "Qty", "Harga Satuan", "Total"];
  const rows = invoice.items.map((item, idx) => [
    (idx + 1).toString(),
    item.description,
    item.quantity.toString(),
    formatCurrency(item.unitPrice),
    formatCurrency(item.total),
  ]);

  pdf.addTable(headers, rows, {
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: "auto" }, // Auto width for description
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 35, halign: "right" },
      4: { cellWidth: 35, halign: "right" },
    },
  });

  // Totals
  pdf.addSpacing(5);
  pdf.addText(`Subtotal: ${formatCurrency(invoice.subtotal)}`, { align: "right" });

  if (invoice.tax) {
    pdf.addText(`Pajak: ${formatCurrency(invoice.tax)}`, { align: "right" });
  }

  pdf.addSpacing(2);
  // Use native line instead of special character
  pdf.addHorizontalLine(); 
  pdf.addSpacing(2);
  pdf.addText(`TOTAL: ${formatCurrency(invoice.total)}`, { bold: true, align: "right" });

  // Payment status
  if (invoice.paymentStatus) {
    pdf.addSpacing(5);
    pdf.addText(`Status Pembayaran: ${invoice.paymentStatus}`, { bold: true });
  }

  // Notes
  if (invoice.notes) {
    pdf.addSpacing(5);
    pdf.addText("Catatan:", { bold: true });
    pdf.addText(invoice.notes);
  }

  // Footer
  pdf.addSpacing(10);
  pdf.addText("Terima kasih atas kepercayaan Anda!", { align: "center" });

  return pdf.getBlob();
}

async function exportInvoiceToExcel(invoice: InvoiceExport): Promise<Blob> {
  const excel = new ExcelGenerator();

  // Create sheet
  excel.createSheet("Invoice");

  // Add letterhead
  excel.addLetterhead();

  // Add title
  excel.addTitle("INVOICE", `No: ${invoice.invoiceNumber}`);

  // Invoice details
  excel.addRow([`Tanggal Invoice: ${formatExcelDate(invoice.invoiceDate)}`]);
  if (invoice.dueDate) {
    excel.addRow([`Jatuh Tempo: ${formatExcelDate(invoice.dueDate)}`]);
  }
  excel.addSpacing();

  // Customer info
  excel.addRow(["KEPADA:"]);
  excel.addRow([invoice.customerName]);
  if (invoice.customerAddress) {
    excel.addRow([invoice.customerAddress]);
  }
  excel.addSpacing(2);

  // Items table
  const headers = ["#", "Deskripsi", "Qty", "Harga Satuan", "Total"];
  const rows = invoice.items.map((item, idx) => [
    idx + 1,
    item.description,
    item.quantity,
    formatExcelCurrency(item.unitPrice),
    formatExcelCurrency(item.total),
  ]);

  excel.addTable(headers, rows);

  // Totals
  excel.addSpacing();
  excel.addRow(["", "", "", "Subtotal:", formatExcelCurrency(invoice.subtotal)]);

  if (invoice.tax) {
    excel.addRow(["", "", "", "Pajak:", formatExcelCurrency(invoice.tax)]);
  }

  excel.addRow(["", "", "", "TOTAL:", formatExcelCurrency(invoice.total)]);

  // Payment status
  if (invoice.paymentStatus) {
    excel.addSpacing();
    excel.addRow([`Status Pembayaran: ${invoice.paymentStatus}`]);
  }

  // Notes
  if (invoice.notes) {
    excel.addSpacing();
    excel.addRow(["Catatan:"]);
    excel.addRow([invoice.notes]);
  }

  // Set column widths
  excel.setColumnWidths([8, 50, 10, 18, 18]);

  return await excel.getBlob();
}
