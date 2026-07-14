'use server';

import { prisma } from '@/lib/prisma';
import { format, startOfDay, endOfDay } from 'date-fns';

export type QueueStats = {
  totalFinished: number;
  totalProgress: number;
  totalQueue: number;
};

export type QueueOrder = {
  id: string;
  vehicle: string;
  custName: string; // Sensor: "Budi" -> "B***"
  plateNumber: string | null;
  serviceType: string;
  status: string;
  createdAt: string;
  updatedAt: string; // Waktu selesai/update terakhir
};

/**
 * Mengambil statistik antrian secara Live.
 * Digunakan untuk display TV di ruang tunggu.
 * 
 * Fitur:
 * - Menghitung total selesai, progress, dan antrian.
 * - Jika hari ini: Tampilkan yang belum selesai saja (agar list fokus ke yang sedang menunggu).
 * - Jika hari lain: Tampilkan history.
 * - Sensor nama customer demi privasi.
 * 
 * @param {string} dateStr - Tanggal filter (opsional, default hari ini).
 * @returns {Object} Statistik dan list antrian.
 */
export async function getLiveQueueStats(dateStr?: string) {
  try {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const start = startOfDay(targetDate);
    const end = endOfDay(targetDate);

    // 1. Ambil semua order hari ini untuk statistik
    const allOrders = await prisma.order.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { status: true, paymentStatus: true }
    });

    const totalFinished = allOrders.filter(o => o.status === 'COMPLETED' || o.paymentStatus === 'PAID').length;
    const totalProgress = allOrders.filter(o => o.status === 'IN_PROGRESS').length;
    const totalQueue = allOrders.filter(o => o.status === 'PENDING' || o.status === 'QUEUE').length;

    // 2. Ambil list antrian AKTIF untuk ditampilkan (kecuali user minta history)
    // User request: "untuk yang sudah selesai, tidak perlu di munculkan lagi"
    // Jadi hanya ambil yang NON-completed.
    
    // Namun user juga minta "filter tanggal".
    // Jika filter tanggal = hari ini -> Tampilkan active only.
    // Jika filter tanggal = masa lalu -> Tampilkan semua (arsip) atau completed only?
    // Asumsi: Di hari lampau, semua order pasti sudah finished (atau cancelled).
    // Jadi jika tanggal != hari ini, tampilkan list completed agar user bisa cek history kapan masuk/keluar.
    
    const isToday = !dateStr || 
                    format(new Date(), 'yyyy-MM-dd') === format(targetDate, 'yyyy-MM-dd');
    
    let whereClause: any = {
        createdAt: { gte: start, lte: end }
    };

    if (isToday) {
        // HARI INI: Hanya tampilkan yang belum selesai
        whereClause.status = { notIn: ['COMPLETED', 'CANCELLED'] };
        // Tambahan: exclude PAID payments jika status belum completed (jarang terjadi tapi mungkin)
        whereClause.paymentStatus = { not: 'PAID' };
    } else {
        // HARI LAIN: Tampilkan semua history
        // (Tidak ada filter status, user ingin lihat record masa lalu)
    }

    const activeOrders = await prisma.order.findMany({
        where: whereClause,
        orderBy: { createdAt: 'asc' }, // FIFO
        select: {
            id: true,
            vehicle: true,
            custName: true,
            plateNumber: true,
            serviceType: true,
            status: true,
            createdAt: true,
            updatedAt: true
        }
    });

    // Sensor nama customer (Privacy)
    const sanitizedOrders = activeOrders.map(o => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        custName: o.custName.length > 2 
            ? o.custName.substring(0, 1) + '*'.repeat(o.custName.length - 1) 
            : o.custName
    }));

    return {
      success: true,
      stats: { totalFinished, totalProgress, totalQueue },
      orders: sanitizedOrders
    };

  } catch (error) {
    console.error("Queue Stats Error:", error);
    return { success: false, error: "Gagal memuat antrian" };
  }
}
