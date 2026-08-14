"use server";

import { revalidatePath } from "next/cache";
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

/**
 * Generates the next sequential code for a SparePart (e.g. BRG-0001, BRG-0002).
 */
export async function generateNextSparePartCode() {
  try {
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
 * - Automatically creates an Adjustment Journal: Debit Inventory, Credit Capital.
 * 
 * @param {CreateSparePartInput} data - Spare part data.
 * @returns {Promise<Object>} New spare part object or error message.
 */
export async function createSparePart(data: CreateSparePartInput) {
  try {
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

    const sparePart = await prisma.sparePart.create({
      data: {
        ...data,
        code,
        category: data.category || 'Oli',
        buyPrice: data.buyPrice,
        sellPrice: data.sellPrice,
        isActive: true
      },
    });

    // If initial stock exists, create inventory journal entry
    if (data.stock > 0) {
      const initialValue = data.stock * data.buyPrice;
      
      const inventoryAccount = await prisma.account.upsert({
        where: { code: '111' },
        create: { code: '111', name: 'Persediaan Sparepart', type: 'ASSET', category: 'CURRENT_ASSET' },
        update: {}
      });
      
      const capitalAccount = await prisma.account.upsert({
        where: { code: '301' },
        create: { code: '301', name: 'Modal Pemilik', type: 'EQUITY', category: 'CAPITAL' },
        update: {}
      });

      await prisma.payment.create({
        data: {
          type: 'EXPENSE',
          amount: initialValue,
          note: `Persediaan Awal - ${sparePart.name} (${data.stock} ${data.unit})`,
          journalItems: [
            { accountId: inventoryAccount.id, debit: initialValue, credit: 0 },
            { accountId: capitalAccount.id, debit: 0, credit: initialValue }
          ]
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
 * - Automatically creates journal: Debit Inventory, Credit Cash.
 * 
 * @param {string} id - Spare part ID.
 * @param {Partial<CreateSparePartInput>} data - Update data payload.
 * @returns {Promise<Object>} Updated spare part object or error message.
 */
export async function updateSparePart(id: string, data: Partial<CreateSparePartInput>) {
  try {
    const existingPart = await prisma.sparePart.findUnique({ where: { id } });
    if (!existingPart) {
      return { success: false, error: 'Produk tidak ditemukan' };
    }

    const stockChange = data.stock !== undefined ? data.stock - existingPart.stock : 0;
    const buyPrice = data.buyPrice !== undefined ? data.buyPrice : Number(existingPart.buyPrice);

    const sparePart = await prisma.sparePart.update({
      where: { id },
      data: {
        ...data,
      },
    });

    // If stock increased, create purchase journal entry
    if (stockChange > 0) {
      const purchaseValue = stockChange * buyPrice;
      
      const inventoryAccount = await prisma.account.upsert({
        where: { code: '111' },
        create: { code: '111', name: 'Persediaan Sparepart', type: 'ASSET', category: 'CURRENT_ASSET' },
        update: {}
      });
      
      const cashAccount = await prisma.account.upsert({
        where: { code: '101' },
        create: { code: '101', name: 'Kas Tunai', type: 'ASSET', category: 'CURRENT_ASSET' },
        update: {}
      });

      await prisma.payment.create({
        data: {
          type: 'EXPENSE',
          amount: purchaseValue,
          note: `Pembelian Persediaan - ${sparePart.name} (+${stockChange} ${sparePart.unit})`,
          journalItems: [
            { accountId: inventoryAccount.id, debit: purchaseValue, credit: 0 },
            { accountId: cashAccount.id, debit: 0, credit: purchaseValue }
          ]
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
    const sparePart = await prisma.sparePart.findUnique({ where: { id: sparePartId } });
    if (!sparePart) {
      return { success: false, error: 'Barang tidak ditemukan' };
    }

    const updated = await prisma.sparePart.update({
      where: { id: sparePartId },
      data: {
        stock: { increment: quantity },
        buyPrice: buyPrice
      }
    });

    const purchaseValue = quantity * buyPrice;
    const inventoryAccount = await prisma.account.upsert({
      where: { code: '111' },
      create: { code: '111', name: 'Persediaan Sparepart', type: 'ASSET', category: 'CURRENT_ASSET' },
      update: {}
    });
    
    const cashAccount = await prisma.account.upsert({
      where: { code: '101' },
      create: { code: '101', name: 'Kas Tunai', type: 'ASSET', category: 'CURRENT_ASSET' },
      update: {}
    });

    await prisma.payment.create({
      data: {
        type: 'EXPENSE',
        amount: purchaseValue,
        note: `Stok Masuk - ${sparePart.name} (+${quantity} ${sparePart.unit}) dari ${supplier}`,
        journalItems: [
          { accountId: inventoryAccount.id, debit: purchaseValue, credit: 0 },
          { accountId: cashAccount.id, debit: 0, credit: purchaseValue }
        ]
      }
    });

    revalidatePath('/admin/products');

    await createLog({
      action: "STOCK_IN",
      title: "Stok Masuk",
      details: `Stok masuk: +${quantity} ${sparePart.unit} untuk ${sparePart.name} dari ${supplier}. Harga beli: Rp ${buyPrice.toLocaleString('id-ID')}.`,
      metadata: { sparePartId, quantity, supplier, buyPrice, date: new Date(date).toISOString() },
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
    const sparePart = await prisma.sparePart.findUnique({ where: { id: sparePartId } });
    if (!sparePart) {
      return { success: false, error: 'Barang tidak ditemukan' };
    }

    if (sparePart.stock < quantity) {
      return { success: false, error: `Stok tidak cukup. Sisa stok saat ini: ${sparePart.stock}` };
    }

    const updated = await prisma.sparePart.update({
      where: { id: sparePartId },
      data: {
        stock: { decrement: quantity }
      }
    });

    revalidatePath('/admin/products');

    await createLog({
      action: "STOCK_OUT",
      title: "Stok Keluar",
      details: `Stok keluar: -${quantity} ${sparePart.unit} untuk ${sparePart.name}. Keperluan/Pelanggan: ${description}.`,
      metadata: { sparePartId, quantity, description, date: new Date(date).toISOString() },
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
