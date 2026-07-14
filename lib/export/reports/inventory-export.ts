// lib/export/reports/inventory-export.ts
import { PDFGenerator, formatCurrency } from "../pdf-generator";
import { ExcelGenerator, formatExcelCurrency } from "../excel-generator";
import type { InventoryItemExport, ExportFormat, PageOrientation } from "../types";

export async function exportInventory(
  items: InventoryItemExport[],
  format: ExportFormat,
  orientation: PageOrientation = "landscape"
) {
  if (format === "pdf") {
    return exportInventoryToPDF(items, orientation);
  } else {
    return exportInventoryToExcel(items);
  }
}

function exportInventoryToPDF(items: InventoryItemExport[], orientation: PageOrientation): Blob {
  const pdf = new PDFGenerator(orientation);

  // Add letterhead
  pdf.addLetterhead();

  // Add title
  pdf.addTitle("LAPORAN INVENTORY PRODUK", `Total: ${items.length} produk`);

  // Prepare table data
  const headers = [
    "ID/SKU",
    "Nama Produk",
    "Kategori",
    "Qty",
    "Unit",
    "Harga Satuan",
    "Total Nilai",
    "Status",
  ];

  const rows = items.map((item) => {
    const isLowStock = item.lowStockThreshold && item.quantity <= item.lowStockThreshold;
    const status = isLowStock ? "⚠ Low Stock" : "✓ Normal";

    return [
      item.sku || item.id.slice(-8),
      item.name,
      item.category || "-",
      item.quantity.toString(),
      item.unit,
      formatCurrency(item.unitPrice),
      formatCurrency(item.totalValue),
      status,
    ];
  });

  const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0);

  const footerRows = [
    ["", "", "", "", "", "TOTAL NILAI INVENTORY", formatCurrency(totalValue), ""],
  ];

  pdf.addTable(headers, rows, {
    footerRows,
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: "auto" }, // Auto width for Name
      2: { cellWidth: 25 },
      3: { cellWidth: 15, halign: "center" },
      4: { cellWidth: 15 },
      5: { cellWidth: 25, halign: "right" },
      6: { cellWidth: 30, halign: "right" },
      7: { cellWidth: 25 },
    },
  });

  // Summary
  const lowStockCount = items.filter(
    (item) => item.lowStockThreshold && item.quantity <= item.lowStockThreshold
  ).length;

  pdf.addSpacing(5);
  pdf.addText(`Total Produk: ${items.length}`, { bold: true });
  pdf.addText(`Produk Low Stock: ${lowStockCount}`, { bold: lowStockCount > 0 });
  pdf.addText(`Total Nilai Inventory: ${formatCurrency(totalValue)}`, { bold: true });

  return pdf.getBlob();
}

async function exportInventoryToExcel(items: InventoryItemExport[]): Promise<Blob> {
  const excel = new ExcelGenerator();

  // Create sheet
  excel.createSheet("Inventory");

  // Add letterhead
  excel.addLetterhead();

  // Add title
  excel.addTitle("LAPORAN INVENTORY PRODUK", `Total: ${items.length} produk`);

  // Prepare table
  const headers = [
    "ID/SKU",
    "Nama Produk",
    "Kategori",
    "Qty",
    "Unit",
    "Harga Satuan",
    "Total Nilai",
    "Supplier",
    "Status",
  ];

  const rows = items.map((item) => {
    const isLowStock = item.lowStockThreshold && item.quantity <= item.lowStockThreshold;
    const status = isLowStock ? "Low Stock" : "Normal";

    return [
      item.sku || item.id.slice(-8),
      item.name,
      item.category || "-",
      item.quantity,
      item.unit,
      formatExcelCurrency(item.unitPrice),
      formatExcelCurrency(item.totalValue),
      item.supplier || "-",
      status,
    ];
  });

  const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0);

  excel.addTable(headers, rows, {
    totals: [
      "",
      "",
      "",
      "",
      "",
      "TOTAL",
      formatExcelCurrency(totalValue),
      "",
      "",
    ],
  });

  // Summary
  const lowStockCount = items.filter(
    (item) => item.lowStockThreshold && item.quantity <= item.lowStockThreshold
  ).length;

  excel.addSpacing();
  excel.addRow([`Total Produk: ${items.length}`]);
  excel.addRow([`Produk Low Stock: ${lowStockCount}`]);
  excel.addRow([`Total Nilai Inventory: ${formatExcelCurrency(totalValue)}`]);

  // Set column widths
  excel.setColumnWidths([15, 35, 15, 8, 10, 15, 18, 20, 12]);

  return await excel.getBlob();
}
