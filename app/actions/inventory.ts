// app/actions/inventory.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createLog } from './logs';

export type CreateSparePartInput = {
  code: string;
  name: string;
  stock: number;
  minStock: number;
  unit: string;
  buyPrice: number;
  sellPrice: number;
  isActive?: boolean;
};

/**
 * Menambahkan Sparepart baru ke sistem.
 * 
 * Jika produk ditambahkan dengan stok awal > 0:
 * - Otomatis membuat Jurnal Penyesuaian: Debit Persediaan, Kredit Modal.
 * 
 * @param {CreateSparePartInput} data - Data sparepart.
 * @returns {Object} Data sparepart baru.
 */
export async function createSparePart(data: CreateSparePartInput) {
  try {
    const sparePart = await prisma.sparePart.create({
      data: {
        ...data,
        buyPrice: data.buyPrice,
        sellPrice: data.sellPrice,
        isActive: true
      },
    });

    // Jika ada stok awal, buat jurnal persediaan
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

      await prisma.journalEntry.create({
        data: {
          date: new Date(),
          description: `Persediaan Awal - ${sparePart.name} (${data.stock} ${data.unit}) @ Rp ${data.buyPrice.toLocaleString('id-ID')}`,
          reference: sparePart.id,
          items: {
            create: [
              { accountId: inventoryAccount.id, debit: initialValue, credit: 0 },  // Debit: Persediaan
              { accountId: capitalAccount.id, debit: 0, credit: initialValue }  // Kredit: Modal
            ]
          }
        }
      });
    }

    revalidatePath('/admin/products');
    
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
 * Mengupdate data sparepart (nama, harga, stok manual).
 * 
 * Jika ada penambahan stok manual:
 * - Dianggap sebagai PEMBELIAN (Kulakan).
 * - Otomatis membuat jurnal: Debit Persediaan, Kredit Kas (Pembelian Tunai).
 * 
 * @param {string} id - ID Sparepart.
 * @param {Partial<CreateSparePartInput>} data - Data update.
 * @returns {Object} Data updated.
 */
export async function updateSparePart(id: string, data: Partial<CreateSparePartInput>) {
  try {
    // Cek perubahan stok
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

    // Jika ada penambahan stok, buat jurnal pembelian
    if (stockChange > 0) {
      const purchaseValue = stockChange * buyPrice;
      
      // Debit: Persediaan Sparepart (111)
      // Kredit: Kas (101) - asumsi pembelian tunai
      
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

      await prisma.journalEntry.create({
        data: {
          date: new Date(),
          description: `Pembelian Persediaan - ${sparePart.name} (+${stockChange} ${sparePart.unit}) @ Rp ${buyPrice.toLocaleString('id-ID')}`,
          reference: sparePart.id,
          items: {
            create: [
              { accountId: inventoryAccount.id, debit: purchaseValue, credit: 0 },  // Debit: Persediaan
              { accountId: cashAccount.id, debit: 0, credit: purchaseValue }  // Kredit: Kas
            ]
          }
        }
      });
    }

    revalidatePath('/admin/products');
    
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
 * Nonaktifkan produk (Soft Delete).
 * 
 * @param {string} id - ID Produk.
 * @returns {Object} Status sukses.
 */
export async function deleteSparePart(id: string) {
  // Soft delete (Non-aktifkan) lebih aman daripada hard delete jika sudah ada relasi
  try {
    const sparePart = await prisma.sparePart.update({
        where: { id },
        data: { isActive: false }
    });
    
    revalidatePath('/admin/products');
    
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
 * Mengaktifkan kembali produk yang non-aktif.
 * 
 * @param {string} id - ID Produk.
 * @returns {Object} Status sukses.
 */
export async function reactivateSparePart(id: string) {
    try {
      const sparePart = await prisma.sparePart.update({
          where: { id },
          data: { isActive: true }
      });
      
      revalidatePath('/admin/products');
      
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
 * Mengambil daftar produk sparepart.
 * 
 * @param {boolean} includeInactive - Jika true, tampilkan juga yang non-aktif.
 * @returns {Object} Daftar produk.
 */
export async function getSpareParts(includeInactive = false) {
  try {
    const spareParts = await prisma.sparePart.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { name: 'asc' },
    });
    
    const serialized = spareParts.map(p => ({
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

// NEW: Get Product Detail with Sales History
/**
 * Mengambil detail produk beserta riwayat penjualannya.
 * 
 * @param {string} id - ID Produk.
 * @returns {Object} Detail produk + statistik penjualan.
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
                            mechanic: { select: { name: true } }, // Siapa yang mengelola (Lead Mechanic)
                            createdAt: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 20
            }
        }
      });
  
      if (!sparePart) return { success: false, error: 'Produk tidak ditemukan' };

      // Calculate Total Sold Statistics
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
        history: sparePart.orderItems.map((item: any) => ({
            id: item.id,
            vehicle: item.order?.vehicle,
            custName: item.order?.custName,
            plateNumber: item.order?.plateNumber,
            pic: item.order?.mechanic?.name || 'Unassigned',
            quantity: item.quantity,
            date: item.order?.createdAt instanceof Date ? item.order?.createdAt.toISOString() : item.order?.createdAt,
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
