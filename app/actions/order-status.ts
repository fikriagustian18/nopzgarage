'use server';

import { prisma } from '@/lib/prisma';
import { startOfDay } from 'date-fns';

/**
 * Mencari status order berdasarkan plat nomor kendaraan (Fitur Tracking Public).
 * 
 * - Privacy: Nama customer disensor (hanya huruf depann).
 * - Menangani case-insensitive search.
 * 
 * @param {string} plateNumber - Nomor plat kendaraan.
 * @returns {Object} Hasil pencarian order terkait.
 */
export async function searchOrderByPlate(searchQuery: string) {
  try {
    if (!searchQuery || searchQuery.trim().length < 3) {
      return { success: false, error: 'Kata kunci pencarian terlalu pendek. Minimal 3 karakter.' };
    }

    // Normalisasi input: hapus spasi berlebih
    let cleanQuery = searchQuery.trim();
    // Jika formatnya ORD-XXXXXX, ambil XXXXXX
    if (cleanQuery.toUpperCase().startsWith("ORD-")) {
      cleanQuery = cleanQuery.substring(4);
    }

    // Cari order dengan ID, nomor HP, atau nomor plat yang sesuai (case insensitive)
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          {
            id: {
              contains: cleanQuery,
              mode: 'insensitive'
            }
          },
          {
            custPhone: {
              contains: cleanQuery,
              mode: 'insensitive'
            }
          },
          {
            plateNumber: {
              contains: cleanQuery,
              mode: 'insensitive'
            }
          }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5, // Limit 5 hasil terakhir
      select: {
        id: true,
        vehicle: true,
        custName: true,
        custPhone: true,
        plateNumber: true,
        status: true,
        paymentStatus: true,
        totalPrice: true,
        totalPaid: true,
        createdAt: true,
        updatedAt: true,
        complaint: true,
        serviceType: true,
        items: true // Ambil detail items untuk nota
      }
    });

    if (orders.length === 0) {
      return { 
        success: false, 
        error: `Tidak ditemukan data servis dengan kata kunci "${searchQuery}". Pastikan nomor order, WhatsApp, atau plat nomor sudah benar.` 
      };
    }

    // Sensor nama customer untuk privacy (hanya huruf pertama) dan hitung queuePosition
    const sanitizedOrders = await Promise.all(orders.map(async (order) => {
      let queuePosition = null;
      if (order.status === 'QUEUE') {
        const start = startOfDay(order.createdAt);
        queuePosition = await prisma.order.count({
          where: {
            status: 'QUEUE',
            createdAt: {
              gte: start,
              lte: order.createdAt
            }
          }
        });
      }

      return {
        ...order,
        custName: order.custName.charAt(0) + '***',
        totalPrice: Number(order.totalPrice), // Convert Decimal to number
        totalPaid: Number(order.totalPaid),   // Convert Decimal to number
        createdAt: order.createdAt.toISOString(), // Convert Date to string
        updatedAt: order.updatedAt.toISOString(),  // Convert Date to string
        queuePosition
      };
    }));

    return { success: true, orders: sanitizedOrders };

  } catch (error) {
    console.error('[ORDER_STATUS] Search error:', error);
    return { success: false, error: 'Terjadi kesalahan saat mencari data. Silakan coba lagi.' };
  }
}

