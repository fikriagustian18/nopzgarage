"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { isRoleAllowed } from "@/lib/authCheck";
import { prisma } from "@/lib/prisma";
import { createLog } from "./logs";

export interface CreateSparePartInput {
  code: string;
  name: string;
  category?: string;
  stock: number;
  minStock: number;
  unit: string;
  buyPrice: number;
  sellPrice: number;
  isActive?: boolean;
}

interface OrderHistoryItem {
  id: string;
  quantity: number;
  order?: {
    id: string;
    vehicle: string;
    custName: string;
    plateNumber?: string | null;
    mechanic?: { name: string } | null;
    createdAt: Date | string;
  } | null;
}

async function canManageInventory(): Promise<boolean> {
  const session = await auth();
  return Boolean(session && isRoleAllowed(session.user?.role, ['OWNER', 'ADMIN']));
}

function parseRequiredNumber(value: unknown): number | null {
  if (typeof value === 'string' && value.trim() === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function validateInventoryNumbers(values: {
  stock: unknown;
  minStock: unknown;
  buyPrice: unknown;
  sellPrice: unknown;
}) {
  const stock = parseRequiredNumber(values.stock);
  const minStock = parseRequiredNumber(values.minStock);
  const buyPrice = parseRequiredNumber(values.buyPrice);
  const sellPrice = parseRequiredNumber(values.sellPrice);

  if (
    stock === null ||
    minStock === null ||
    buyPrice === null ||
    sellPrice === null ||
    !Number.isInteger(stock) ||
    !Number.isInteger(minStock) ||
    stock < 0 ||
    minStock < 0 ||
    buyPrice < 0 ||
    sellPrice < 0
  ) {
    return null;
  }

  return { stock, minStock, buyPrice, sellPrice };
}

/**
 * Generates the next sequential code for a SparePart (e.g. BRG-0001, BRG-0002).
 */
export async function generateNextSparePartCode() {
  try {
    if (!(await canManageInventory())) {
      return { success: false, error: 'Access denied: Only Owner and Admin can access inventory.' };
    }
    const brgParts = await prisma.sparePart.findMany({
      where: { code: { startsWith: 'BRG-' } },
      select: { code: true }
    });

    let maxNum = 0;
    const brgRegex = /^BRG-(\d+)$/i;

    for (const part of brgParts) {
      const match = part.code.match(brgRegex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }

    let nextNum = maxNum + 1;
    let candidateCode = `BRG-${nextNum.toString().padStart(4, '0')}`;
    const existingCodes = new Set(brgParts.map((p) => p.code));
    while (existingCodes.has(candidateCode)) {
      nextNum++;
      candidateCode = `BRG-${nextNum.toString().padStart(4, '0')}`;
    }

    return { success: true, code: candidateCode };
  } catch (error) {
    console.error('Generate spare part code error:', error);
    return { success: false, error: 'Gagal membuat kode barang' };
  }
}

/**
 * Adds a new Sparepart to the system.
 * 
 * If the product is added with initial stock > 0:
 * - Automatically records an EXPENSE payment for initial inventory.
 * 
 * @param {CreateSparePartInput} data - Spare part data.
 * @returns {Promise<Object>} New spare part object or error message.
 */
export async function createSparePart(data: CreateSparePartInput) {
  try {
    if (!(await canManageInventory())) {
      return { success: false, error: 'Access denied: Only Owner and Admin can create inventory items.' };
    }
    if (!data.name?.trim() || !data.unit?.trim()) {
      return { success: false, error: 'Nama barang dan satuan wajib diisi.' };
    }
    let code = data.code;
    if (!code || code.trim() === '' || code === 'Memuat...') {
      const generated = await generateNextSparePartCode();
      if (generated.success && generated.code) {
        code = generated.code;
      }
    }

    // Safety check for duplicate code collision
    const existing = await prisma.sparePart.findUnique({
      where: { code },
      select: { id: true }
    });

    if (existing) {
      const generated = await generateNextSparePartCode();
      if (generated.success && generated.code) {
        code = generated.code;
      }
    }

    const numericValues = validateInventoryNumbers(data);
    if (!numericValues) {
      return { success: false, error: 'Stok wajib berupa bilangan bulat non-negatif dan harga wajib berupa angka non-negatif.' };
    }
    const { stock, minStock, buyPrice, sellPrice } = numericValues;

    const sparePart = await prisma.sparePart.create({
      data: {
        ...data,
        code,
        name: data.name.trim(),
        category: data.category?.trim() || 'Oli',
        unit: data.unit.trim(),
        stock,
        minStock,
        buyPrice,
        sellPrice,
        isActive: true
      },
    });

    // If initial stock exists, create inventory expense payment record
    if (stock > 0) {
      const initialValue = stock * buyPrice;

      await prisma.payment.create({
        data: {
          type: 'EXPENSE',
          amount: initialValue,
          note: `Persediaan Awal - ${sparePart.name} (${data.stock} ${data.unit})`,
        }
      });
    }

    revalidatePath('/admin/products');
    revalidatePath('/admin/inventory');
    
    await createLog({
      action: "CREATE_SPAREPART",
      title: "Product Added",
      details: `Product ${data.name} (${data.code}) added to inventory.`,
      metadata: { sparePartId: sparePart.id },
      userName: "Admin",
      role: "ADMIN"
    });

    const serialized = {
      ...sparePart,
      buyPrice: sparePart.buyPrice.toNumber(),
      sellPrice: sparePart.sellPrice.toNumber(),
      createdAt: sparePart.createdAt instanceof Date ? sparePart.createdAt.toISOString() : sparePart.createdAt,
      updatedAt: sparePart.updatedAt instanceof Date ? sparePart.updatedAt.toISOString() : sparePart.updatedAt,
    };

    return { success: true, sparePart: serialized };
  } catch (error) {
    console.error('Create spare part error:', error);
    return { success: false, error: 'Gagal membuat produk' };
  }
}

/**
 * Updates spare part details (name, price, manual stock adjustment).
 * 
 * If manual stock is added:
 * - Treated as PURCHASE.
 * - Automatically records an EXPENSE payment for inventory purchase.
 * 
 * @param {string} id - Spare part ID.
 * @param {Partial<CreateSparePartInput>} data - Update data payload.
 * @returns {Promise<Object>} Updated spare part object or error message.
 */
export async function updateSparePart(id: string, data: Partial<CreateSparePartInput>) {
  try {
    if (!(await canManageInventory())) {
      return { success: false, error: 'Access denied: Only Owner and Admin can update inventory.' };
    }
    const existingPart = await prisma.sparePart.findUnique({ where: { id } });
    if (!existingPart) {
      return { success: false, error: 'Produk tidak ditemukan' };
    }

    const numericValues = validateInventoryNumbers({
      stock: data.stock ?? existingPart.stock,
      minStock: data.minStock ?? existingPart.minStock,
      buyPrice: data.buyPrice ?? existingPart.buyPrice,
      sellPrice: data.sellPrice ?? existingPart.sellPrice,
    });
    if (!numericValues) {
      return { success: false, error: 'Stok wajib berupa bilangan bulat non-negatif dan harga wajib berupa angka non-negatif.' };
    }
    const { stock, minStock, buyPrice, sellPrice } = numericValues;
    if (data.name !== undefined && !data.name.trim()) {
      return { success: false, error: 'Nama barang wajib diisi.' };
    }
    if (data.unit !== undefined && !data.unit.trim()) {
      return { success: false, error: 'Satuan barang wajib diisi.' };
    }

    const stockChange = stock - existingPart.stock;

    const sparePart = await prisma.sparePart.update({
      where: { id },
      data: {
        ...data,
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.unit !== undefined && { unit: data.unit.trim() }),
        ...(data.category !== undefined && { category: data.category.trim() }),
        stock,
        minStock,
        buyPrice,
        sellPrice,
      },
    });

    // If stock increased, create purchase expense payment record
    if (stockChange > 0) {
      const purchaseValue = stockChange * buyPrice;

      await prisma.payment.create({
        data: {
          type: 'EXPENSE',
          amount: purchaseValue,
          note: `Pembelian Persediaan - ${sparePart.name} (+${stockChange} ${sparePart.unit})`,
        }
      });
    }

    revalidatePath('/admin/products');
    revalidatePath('/admin/inventory');
    
    await createLog({
      action: "UPDATE_SPAREPART",
      title: "Product Updated",
      details: `Product ${data.name || sparePart.name} updated.${stockChange > 0 ? ` Stock increased by ${stockChange}.` : ''}`,
      metadata: { sparePartId: sparePart.id, stockChange },
      userName: "Admin",
      role: "ADMIN"
    });

    const serialized = {
      ...sparePart,
      buyPrice: sparePart.buyPrice.toNumber(),
      sellPrice: sparePart.sellPrice.toNumber(),
      createdAt: sparePart.createdAt instanceof Date ? sparePart.createdAt.toISOString() : sparePart.createdAt,
      updatedAt: sparePart.updatedAt instanceof Date ? sparePart.updatedAt.toISOString() : sparePart.updatedAt,
    };

    return { success: true, sparePart: serialized };
  } catch (error) {
    console.error('Update spare part error:', error);
    return { success: false, error: 'Gagal update produk' };
  }
}

/**
 * Deactivates a product (Soft Delete).
 * 
 * @param {string} id - Product ID.
 * @returns {Promise<Object>} Success status or error.
 */
export async function deleteSparePart(id: string) {
  try {
    if (!(await canManageInventory())) {
      return { success: false, error: 'Access denied: Only Owner and Admin can update inventory.' };
    }
    await prisma.sparePart.update({
      where: { id },
      data: { isActive: false }
    });
    
    revalidatePath('/admin/products');
    revalidatePath('/admin/inventory');
    
    await createLog({
      action: "DEACTIVATE_SPAREPART",
      title: "Product Deactivated",
      details: `Product ${id} has been deactivated.`,
      metadata: { sparePartId: id },
      userName: "Admin",
      role: "ADMIN"
    });

    return { success: true };
  } catch (error) {
    console.error('Delete spare part error:', error);
    return { success: false, error: 'Gagal menghapus produk' };
  }
}

/**
 * Reactivates an inactive product.
 * 
 * @param {string} id - Product ID.
 * @returns {Promise<Object>} Success status or error.
 */
export async function reactivateSparePart(id: string) {
  try {
    if (!(await canManageInventory())) {
      return { success: false, error: 'Access denied: Only Owner and Admin can update inventory.' };
    }
    await prisma.sparePart.update({
      where: { id },
      data: { isActive: true }
    });
    
    revalidatePath('/admin/products');
    revalidatePath('/admin/inventory');
    
    await createLog({
      action: "REACTIVATE_SPAREPART",
      title: "Product Reactivated",
      details: `Product ${id} has been reactivated.`,
      metadata: { sparePartId: id },
      userName: "Admin",
      role: "ADMIN"
    });

    return { success: true };
  } catch (error) {
    console.error('Reactivate spare part error:', error);
    return { success: false, error: 'Gagal mengaktifkan produk' };
  }
}

/**
 * Retrieves the list of spare parts.
 * 
 * @param {boolean} includeInactive - If true, includes inactive products.
 * @returns {Promise<Object>} Spare parts array or error.
 */
export async function getSpareParts(includeInactive = false) {
  try {
    if (!(await canManageInventory())) {
      return { success: false, error: 'Access denied: Only Owner and Admin can access inventory.' };
    }
    const spareParts = await prisma.sparePart.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { name: 'asc' },
    });
    
    const serialized = spareParts.map((p) => ({
      ...p,
      buyPrice: p.buyPrice.toNumber(),
      sellPrice: p.sellPrice.toNumber(),
      createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
      updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
    }));
    return { success: true, spareParts: serialized };
  } catch (error) {
    console.error('Get spare parts error:', error);
    return { success: false, error: 'Gagal load produk' };
  }
}

/**
 * Retrieves spare part details along with sales history.
 * 
 * @param {string} id - Product ID.
 * @returns {Promise<Object>} Product details with sales statistics or error.
 */
export async function getSparePartDetail(id: string) {
  try {
    if (!(await canManageInventory())) {
      return { success: false, error: 'Access denied: Only Owner and Admin can access inventory.' };
    }
    const sparePart = await prisma.sparePart.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            order: {
              select: {
                id: true,
                vehicle: true,
                custName: true,
                plateNumber: true,
                mechanic: { select: { name: true } },
                createdAt: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    if (!sparePart) {
      return { success: false, error: 'Produk tidak ditemukan' };
    }

    const stats = await prisma.orderItem.aggregate({
      where: { sparePartId: id },
      _sum: { quantity: true, totalPrice: true },
      _count: { id: true }
    });

    const serialized = {
      ...sparePart,
      buyPrice: sparePart.buyPrice.toNumber(),
      sellPrice: sparePart.sellPrice.toNumber(),
      createdAt: sparePart.createdAt instanceof Date ? sparePart.createdAt.toISOString() : sparePart.createdAt,
      updatedAt: sparePart.updatedAt instanceof Date ? sparePart.updatedAt.toISOString() : sparePart.updatedAt,
      history: sparePart.orderItems.map((item: OrderHistoryItem) => ({
        id: item.id,
        vehicle: item.order?.vehicle,
        custName: item.order?.custName,
        plateNumber: item.order?.plateNumber,
        pic: item.order?.mechanic?.name || 'Unassigned',
        quantity: item.quantity,
        date: item.order?.createdAt instanceof Date ? item.order.createdAt.toISOString() : item.order?.createdAt,
      })),
      stats: {
        totalSold: stats._sum.quantity || 0,
        revenue: stats._sum.totalPrice?.toNumber() || 0,
        usageCount: stats._count.id
      }
    };
    return { success: true, sparePart: serialized };
  } catch (error) {
    console.error('Get spare part detail error:', error);
    return { success: false, error: 'Gagal load detail produk' };
  }
}

/**
 * Increases spare part stock (Stock In).
 * 
 * @param {string} sparePartId - Spare part ID.
 * @param {number} quantity - Quantity to add.
 * @param {string} supplier - Supplier name.
 * @param {number} buyPrice - Purchase price per unit.
 * @param {string|Date} date - Date of transaction.
 * @returns {Promise<Object>} Success status or error.
 */
export async function addStock(
  sparePartId: string,
  quantity: number,
  supplier: string,
  buyPrice: number,
  date: string | Date
) {
  try {
    if (!(await canManageInventory())) {
      return { success: false, error: 'Access denied: Only Owner and Admin can update inventory.' };
    }
    const parsedQuantity = parseRequiredNumber(quantity);
    const parsedBuyPrice = parseRequiredNumber(buyPrice);
    if (
      parsedQuantity === null ||
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity <= 0 ||
      parsedBuyPrice === null ||
      parsedBuyPrice < 0 ||
      !supplier?.trim()
    ) {
      return { success: false, error: 'Jumlah, harga beli, dan supplier wajib valid.' };
    }
    const sparePart = await prisma.sparePart.findUnique({ where: { id: sparePartId } });
    if (!sparePart) {
      return { success: false, error: 'Barang tidak ditemukan' };
    }

    const updated = await prisma.sparePart.update({
      where: { id: sparePartId },
      data: {
        stock: { increment: parsedQuantity },
        buyPrice: parsedBuyPrice
      }
    });

    const purchaseValue = parsedQuantity * parsedBuyPrice;

    await prisma.payment.create({
      data: {
        type: 'EXPENSE',
        amount: purchaseValue,
        note: `Stok Masuk - ${sparePart.name} (+${parsedQuantity} ${sparePart.unit}) dari ${supplier.trim()}`,
      }
    });

    revalidatePath('/admin/products');

    await createLog({
      action: "STOCK_IN",
      title: "Stok Masuk",
      details: `Stok masuk: +${parsedQuantity} ${sparePart.unit} untuk ${sparePart.name} dari ${supplier.trim()}. Harga beli: Rp ${parsedBuyPrice.toLocaleString('id-ID')}.`,
      metadata: { sparePartId, quantity: parsedQuantity, supplier: supplier.trim(), buyPrice: parsedBuyPrice, date: new Date(date).toISOString() },
      userName: "Admin",
      role: "ADMIN"
    });

    return { success: true, sparePart: updated };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal menambahkan stok';
    console.error('Add stock error:', error);
    return { success: false, error: message };
  }
}

/**
 * Decreases spare part stock (Stock Out).
 * 
 * @param {string} sparePartId - Spare part ID.
 * @param {number} quantity - Quantity to decrease.
 * @param {string} description - Purpose/customer note.
 * @param {string|Date} date - Date of transaction.
 * @returns {Promise<Object>} Success status or error.
 */
export async function reduceStock(
  sparePartId: string,
  quantity: number,
  description: string,
  date: string | Date
) {
  try {
    if (!(await canManageInventory())) {
      return { success: false, error: 'Access denied: Only Owner and Admin can update inventory.' };
    }
    const parsedQuantity = parseRequiredNumber(quantity);
    if (
      parsedQuantity === null ||
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity <= 0 ||
      !description?.trim()
    ) {
      return { success: false, error: 'Jumlah dan deskripsi stok keluar wajib valid.' };
    }
    const sparePart = await prisma.sparePart.findUnique({ where: { id: sparePartId } });
    if (!sparePart) {
      return { success: false, error: 'Barang tidak ditemukan' };
    }

    if (sparePart.stock < parsedQuantity) {
      return { success: false, error: `Stok tidak cukup. Sisa stok saat ini: ${sparePart.stock}` };
    }

    const updated = await prisma.sparePart.update({
      where: { id: sparePartId },
      data: {
        stock: { decrement: parsedQuantity }
      }
    });

    revalidatePath('/admin/products');

    await createLog({
      action: "STOCK_OUT",
      title: "Stok Keluar",
      details: `Stok keluar: -${parsedQuantity} ${sparePart.unit} untuk ${sparePart.name}. Keperluan/Pelanggan: ${description.trim()}.`,
      metadata: { sparePartId, quantity: parsedQuantity, description: description.trim(), date: new Date(date).toISOString() },
      userName: "Admin",
      role: "ADMIN"
    });

    return { success: true, sparePart: updated };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal mengurangi stok';
    console.error('Reduce stock error:', error);
    return { success: false, error: message };
  }
}
