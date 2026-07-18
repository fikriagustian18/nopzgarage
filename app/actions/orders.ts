'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { OrderStatus, ServiceType, PaymentStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { createLog } from './logs';
import { format, startOfDay, endOfDay } from 'date-fns';

// ==================== Types ====================
export type OrderItem = {
  name: string;
  qty: number;
  price: number;
  type: 'service' | 'part' | 'internal_fee';
  employeeId?: string; // Optional untuk internal_fee
};

export type CreateOrderInput = {
  custName: string;
  custPhone: string;
  vehicle: string;
  plateNumber?: string;
  complaint: string;
  serviceType: ServiceType;
  scheduledAt?: string | Date;
};

export type UpdateEstimateInput = {
  orderId: string;
  items: OrderItem[];
  scheduledAt?: Date;
};

export type ProcessOrderInput = {
  orderId: string;
  items: OrderItem[];
  mechanicId: string;
  fees?: {
    employeeId: string;
    name: string;
    amount: number;
    note?: string; // Tambahan untuk catatan (misal: "Kesulitan Tinggi")
  }[];
};

// ==================== Helper: Serialize Decimal ====================
function serializeOrder(order: any) {
  if (!order) return null;
  return {
    ...order,
    totalPrice: order.totalPrice?.toNumber ? order.totalPrice.toNumber() : 0,
    totalPaid: order.totalPaid?.toNumber ? order.totalPaid.toNumber() : 0,
    paymentStatus: order.paymentStatus || 'UNPAID',
    items: order.items || [],
    createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
    updatedAt: order.updatedAt instanceof Date ? order.updatedAt.toISOString() : order.updatedAt,
    scheduledAt: order.scheduledAt instanceof Date ? order.scheduledAt.toISOString() : order.scheduledAt,
    payments: order.payments?.map((p: any) => ({
      ...p,
      amount: p.amount?.toNumber ? p.amount.toNumber() : 0,
      date: p.date instanceof Date ? p.date.toISOString() : p.date,
      createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
      updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
    })),
    mechanic: order.mechanic ? {
      ...order.mechanic,
      dailyRate: order.mechanic.dailyRate?.toNumber ? order.mechanic.dailyRate.toNumber() : 0,
      commissionRate: order.mechanic.commissionRate?.toNumber ? order.mechanic.commissionRate.toNumber() : 0,
      createdAt: order.mechanic.createdAt instanceof Date ? order.mechanic.createdAt.toISOString() : order.mechanic.createdAt,
      updatedAt: order.mechanic.updatedAt instanceof Date ? order.mechanic.updatedAt.toISOString() : order.mechanic.updatedAt,
    } : null,
  };
}

// ==================== Process Order (Estimasi & Assign) ====================
/**
 * Memproses order (Step Estimasi & Penugasan).
 * 
 * Fungsi kompleks ini melakukan:
 * 1. Mengupdate items service/part yang disepakati.
 * 2. Mengurangi stok sparepart secara real-time (jika ada part).
 * 3. Membuat Jurnal HPP (Harga Pokok Penjualan) vs Persediaan.
 * 4. Mencatat komisi/gaji mekanik (Accrual Basis - Hutang Gaji).
 * 5. Update status order menjadi 'IN_PROGRESS'.
 * 
 * @param {ProcessOrderInput} data - Data proses order.
 * @returns {Object} Hasil order yang diproses.
 */
export async function processOrder(data: ProcessOrderInput): Promise<
  | { success: true; order: any }
  | { success: false; error: string }
> {
  try {
    const session = await auth();
    if (!session || !['OWNER', 'ADMIN'].includes(session.user?.role || '')) {
      return { success: false, error: 'Akses ditolak: Hanya Owner dan Admin yang dapat memproses order.' };
    }
    const { orderId, items, mechanicId, fees } = data;

    // 1. Hitung total harga (Hanya service & part untuk customer)
    const totalPrice = items
      .filter((i: any) => i.type === 'service' || i.type === 'part')
      .reduce((sum, item) => sum + item.qty * item.price, 0);

    const customerItems = items.filter(i => i.type !== 'internal_fee');

    // MENGGUNAKAN TRANSACTION
    return await prisma.$transaction(async (tx) => {
      // 2. Update Order Header
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          items: customerItems, // Legacy JSON, tetap diisi untuk kemudahan
          totalPrice,
          mechanicId,
          status: 'IN_PROGRESS',
          scheduledAt: new Date(),
          // Clear old relations if re-processing to avoid duplicates
          orderItems: { deleteMany: {} }, 
          orderFees: { deleteMany: {} }
        },
        include: { mechanic: true }
      });

      // 3. Process Items & Update Stock
      for (const item of customerItems) {
        let sparePartId = null;
        
        // Cek apakah ini barang (part)
        if (item.type === 'part') {
          // Cari sparepart di DB berdasarkan nama
          const part = await tx.sparePart.findFirst({ where: { name: item.name } });
          if (part) {
            sparePartId = part.id;
            
            // CHECK STOCK
            if (part.stock < item.qty) {
              throw new Error(`Stok ${item.name} tidak cukup. Sisa: ${part.stock}`);
            }

            // DECREMENT STOCK
            await tx.sparePart.update({
              where: { id: part.id },
              data: { stock: { decrement: item.qty } }
            });

            // === JURNAL HPP (Harga Pokok Penjualan) ===
            const hpp = Number(part.buyPrice) * item.qty;
            
            // Ensure accounts exist: 511 (HPP) dan 111 (Persediaan Sparepart)
            const hppAccount = await tx.account.upsert({
              where: { code: '511' },
              create: { code: '511', name: 'Harga Pokok Penjualan', type: 'EXPENSE', category: 'COST_OF_GOODS' },
              update: {}
            });
            
            const inventoryAccount = await tx.account.upsert({
              where: { code: '111' },
              create: { code: '111', name: 'Persediaan Sparepart', type: 'ASSET', category: 'CURRENT_ASSET' },
              update: {}
            });

            // Create Journal Entry for COGS (HPP)
            await tx.journalEntry.create({
              data: {
                date: new Date(),
                description: `HPP - ${item.name} (${item.qty} ${part.unit}) - Order #${order.id.slice(-6)}`,
                reference: order.id,
                items: {
                  create: [
                    { accountId: hppAccount.id, debit: hpp, credit: 0 },  // Debit: HPP
                    { accountId: inventoryAccount.id, debit: 0, credit: hpp }  // Kredit: Persediaan
                  ]
                }
              }
            });
          }
        }

        // Simpan ke detail OrderItem
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            itemType: item.type,
            itemName: item.name,
            quantity: item.qty,
            unitPrice: item.price,
            totalPrice: item.qty * item.price,
            sparePartId
          }
        });
      }

      // 4. Process Order Fees & Create Accounting Journal (Accrual)
      let totalFeeAmount = 0;
      if (fees && fees.length > 0) {
        
        // Ensure Accounts Exist (Idempotent)
        // 501: Beban Gaji & Komisi
        // 202: Utang Gaji & Komisi
        const expenseAcc = await tx.account.upsert({
            where: { code: '501' },
            create: { code: '501', name: 'Beban Gaji & Komisi', type: 'EXPENSE', category: 'OPERATING_EXPENSE' },
            update: {}
        });
        
        const liabilityAcc = await tx.account.upsert({
            where: { code: '202' },
            create: { code: '202', name: 'Utang Gaji & Komisi', type: 'LIABILITY', category: 'CURRENT_LIABILITY' },
            update: {}
        });

        for (const fee of fees) {
          if (fee.amount > 0 && fee.employeeId) {
             const createdFee = await tx.orderFee.create({
               data: {
                 orderId: order.id,
                 employeeId: fee.employeeId,
                 amount: fee.amount,
                 description: fee.note || `Komisi: ${fee.name}`, // Gunakan catatan admin atau default
                 isPaid: false
               }
             });
             totalFeeAmount += fee.amount;
          }
        }

        // CREATE JOURNAL ENTRY (ACCRUAL)
        // Debit: Beban (501)
        // Kredit: Utang (202)
        if (totalFeeAmount > 0) {
            await tx.journalEntry.create({
                data: {
                    date: new Date(),
                    description: `Accrual Fee Order #${order.id.slice(-6)}`,
                    reference: order.id,
                    items: {
                        create: [
                            { accountId: expenseAcc.id, debit: totalFeeAmount, credit: 0 },
                            { accountId: liabilityAcc.id, debit: 0, credit: totalFeeAmount }
                        ]
                    }
                }
            });
        }
      }

      // 5. Log activity
      await createLog({
        action: "PROCESS_ORDER",
        title: "Order Processed",
        details: `Order processed. Total: Rp ${totalPrice.toLocaleString('id-ID')}. Stock updated. Fees: Rp ${totalFeeAmount.toLocaleString('id-ID')} (Recorded to Accounting).`,
        metadata: { orderId: order.id, fees: totalFeeAmount },
        userName: "Admin",
        role: "ADMIN"
      });

      return { success: true, order: serializeOrder(order) };
    }, {
      maxWait: 5000, // Maximum time to wait for a transaction slot (5s)
      timeout: 15000, // Maximum time for the transaction to complete (15s - Accelerate limit)
    });

  } catch (error: any) {
    console.error('Process order error:', error);
    return { success: false, error: error.message || 'Gagal memproses order' };
  }
}

// ==================== Finish Order (Selesai Pengerjaan) ====================
/**
 * Menandai order sebagai selesai dikerjakan (READY).
 * Kendaraan siap diambil/dibayar oleh customer.
 * 
 * @param {string} orderId - ID Order.
 * @returns {Object} Order yang diupdate.
 */
export async function finishOrder(orderId: string) {
  try {
    const session = await auth();
    if (!session || !['OWNER', 'ADMIN'].includes(session.user?.role || '')) {
      return { success: false, error: 'Akses ditolak: Hanya Owner dan Admin yang dapat menandai order selesai.' };
    }
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'READY', // Siap diambil/bayar
      },
      include: {
        mechanic: true,
        payments: true,
      },
    });

    revalidatePath('/admin/orders');
    revalidatePath('/admin/orders/kanban');
    
    await createLog({
        action: "FINISH_ORDER",
        title: "Order Finished",
        details: `Order #${order.id.slice(-6)} marked as READY.`,
        metadata: { orderId: order.id },
        userName: "Admin",
        role: "ADMIN"
      });
    
    return { success: true, order: serializeOrder(order) };
  } catch (error) {
    console.error('Finish order error:', error);
    return { success: false, error: 'Gagal menyelesaikan order' };
  }
}

// ==================== Close Order (Serah Terima / Selesai) ====================
/**
 * Menutup order secara final (COMPLETED).
 * Biasanya dilakukan setelah pembayaran lunas dan kendaraan diserahterimakan.
 * 
 * @param {string} orderId - ID Order.
 * @returns {Object} Order yang diupdate.
 */
export async function closeOrder(orderId: string) {
  try {
    const session = await auth();
    if (!session || !['OWNER', 'ADMIN'].includes(session.user?.role || '')) {
      return { success: false, error: 'Akses ditolak: Hanya Owner dan Admin yang dapat menutup order.' };
    }
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETED', // Transaksi selesai, unit diambil
      },
      include: {
        mechanic: true,
        payments: true,
      },
    });

    revalidatePath('/admin/orders');
    revalidatePath('/admin/orders/kanban');
    
    await createLog({
        action: "CLOSE_ORDER",
        title: "Order Completed",
        details: `Order #${order.id.slice(-6)} closed (Handover complete).`,
        metadata: { orderId: order.id },
        userName: "Admin",
        role: "ADMIN"
      });
    
    return { success: true, order: serializeOrder(order) };
  } catch (error) {
    console.error('Close order error:', error);
    return { success: false, error: 'Gagal menutup order' };
  }
}

// ==================== Public Booking (Landing Page) ====================
/**
 * Membuat booking baru dari halaman publik (Landing Page).
 * Status awal: PENDING.
 * 
 * @param {CreateOrderInput} data - Data booking.
 * @returns {Object} Order baru.
 */
export async function createBooking(data: CreateOrderInput) {
  try {
    const order = await prisma.order.create({
      data: {
        custName: data.custName,
        custPhone: data.custPhone,
        vehicle: data.vehicle,
        plateNumber: data.plateNumber,
        complaint: data.complaint,
        serviceType: data.serviceType,
        status: 'PENDING',
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      },
      include: {
        mechanic: true,
        payments: true,
      },
    });

    // Calculate queue number based on today's count
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(23, 59, 59, 999));
    const todayBookingsCount = await prisma.order.count({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      }
    });
    const queueNumber = `Q-${String(todayBookingsCount).padStart(2, '0')}`;

    revalidatePath('/');
    revalidatePath('/kanban');
    
    await createLog({
        action: "CREATE_BOOKING",
        title: "New Booking",
        details: `Booking received from ${data.custName} (${data.vehicle}) with Queue: ${queueNumber}`,
        metadata: { orderId: order.id, queueNumber },
        userName: "Customer",
        role: "GUEST"
      });
    
    const serialized = serializeOrder(order);
    return { success: true, order: { ...serialized, queueNumber } };
  } catch (error) {
    console.error('Create booking error:', error);
    return { success: false, error: 'Gagal membuat booking' };
  }
}

// ==================== Konfirmasi Order ====================
/**
 * Mengkonfirmasi booking yang masuk menjadi antrian aktif (CONFIRMED).
 * 
 * @param {string} orderId - ID Order.
 * @returns {Object} Order yang diupdate.
 */
export async function confirmOrder(orderId: string) {
  try {
    const session = await auth();
    if (!session || !['OWNER', 'ADMIN'].includes(session.user?.role || '')) {
      return { success: false, error: 'Akses ditolak: Hanya Owner dan Admin yang dapat mengonfirmasi order.' };
    }
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CONFIRMED' },
      include: { mechanic: true, payments: true }
    });

    revalidatePath('/admin/orders');
    
    await createLog({
        action: "CONFIRM_ORDER",
        title: "Order Confirmed",
        details: `Order confirmed.`,
        metadata: { orderId: order.id },
        userName: "Admin",
        role: "ADMIN"
      });
    
    return { success: true, order: serializeOrder(order) };
  } catch (error) {
    return { success: false, error: 'Gagal konfirmasi order' };
  }
}

// ==================== Update Status (Kanban) ====================
// ==================== Update Status (Kanban) ====================
/**
 * Mengupdate status order (Drag & Drop Kanban).
 * Bisa juga untuk assign/reassign mekanik.
 * 
 * @param {string} orderId - ID Order.
 * @param {OrderStatus} newStatus - Status baru.
 * @param {string} mechanicId - ID Mekanik baru (opsional).
 * @returns {Object} Order yang diupdate.
 */
export async function updateOrderStatus(
  orderId: string, 
  newStatus: OrderStatus,
  mechanicId?: string
) {
  try {
    const session = await auth();
    if (!session || !['OWNER', 'ADMIN', 'EMPLOYEE'].includes(session.user?.role || '')) {
      return { success: false, error: 'Akses ditolak: Anda tidak memiliki wewenang untuk memperbarui status order.' };
    }
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        ...(mechanicId && { mechanicId }),
      },
      include: {
        mechanic: true,
        payments: true,
      },
    });

    revalidatePath('/admin/orders'); 
    revalidatePath('/admin/orders/kanban');
    revalidatePath('/kanban');
    
    await createLog({
        action: "UPDATE_STATUS",
        title: "Status Updated",
        details: `Order status changed to ${newStatus}`,
        metadata: { orderId: order.id, status: newStatus },
        userName: "Admin",
        role: "ADMIN"
      });
    
    return { success: true, order: serializeOrder(order) };
  } catch (error) {
    console.error('Update status error:', error);
    return { success: false, error: 'Gagal update status' };
  }
}

// ==================== Get All Orders (Admin) ====================
/**
 * Mengambil daftar order untuk halaman admin.
 * Mendukung filter status, tipe servis, rentang tanggal, dan pencarian.
 * 
 * @param {Object} filters - Filter pencarian.
 * @returns {Object} List order.
 */
export async function getAdminOrders(filters?: {
  status?: OrderStatus;
  serviceType?: ServiceType;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  limit?: number;
  mechanicId?: string;
}) {
  try {
    const session = await auth();
    if (!session || !['OWNER', 'ADMIN'].includes(session.user?.role || '')) {
      return { success: false, error: 'Akses ditolak: Hanya Owner dan Admin yang dapat mengakses daftar order.' };
    }
    const whereClause: any = {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.serviceType && { serviceType: filters.serviceType }),
        ...(filters?.dateFrom && { createdAt: { gte: filters.dateFrom } }),
        ...(filters?.dateTo && { createdAt: { lte: filters.dateTo } }),
        ...(filters?.mechanicId && { mechanicId: filters.mechanicId }),
    };

    if (filters?.search) {
      whereClause.OR = [
        { custName: { contains: filters.search, mode: 'insensitive' } },
        { plateNumber: { contains: filters.search, mode: 'insensitive' } },
        { vehicle: { contains: filters.search, mode: 'insensitive' } },
        { id: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Default limit 50 untuk mencegah crash (Worker exceeded resource limits)
    const limit = filters?.limit || 50;

    const orders = await prisma.order.findMany({
      where: whereClause,
      take: limit,
      include: {
        mechanic: true,
        payments: { orderBy: { date: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const ordersWithNumbers = orders.map(serializeOrder);
    const ordersWithQueueNumbers = await addQueueNumbersToOrders(ordersWithNumbers);
    return { success: true, orders: ordersWithQueueNumbers };
  } catch (error) {
    console.error('Get admin orders error:', error);
    return { success: false, error: 'Gagal load orders' };
  }
}

// ==================== Get Single Order ====================
/**
 * Mengambil detail lengkap satu order.
 * Termasuk data mekanik, history pembayaran, item sparepart, dan fee komisi.
 * 
 * @param {string} orderId - ID Order.
 * @returns {Object} Detail order.
 */
export async function getOrderDetail(orderId: string) {
  try {
    const session = await auth();
    if (!session || !['OWNER', 'ADMIN'].includes(session.user?.role || '')) {
      return { success: false, error: 'Akses ditolak: Hanya Owner dan Admin yang dapat melihat detail order.' };
    }
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        mechanic: true,
        payments: { orderBy: { date: 'desc' } },
        orderFees: { include: { employee: true } }, // Include Order Fees
        orderItems: true // Include Order Items
      },
    });

    if (!order) {
      return { success: false, error: 'Order tidak ditemukan' };
    }

    const sOrder = serializeOrder(order);
    // Tambahkan serialize khusus untuk Decimal di orderFees dan orderItems jika perlu
    // Tapi serializeOrder standard hanya handle top level.
    // Kita extend sedikit hasilnya:
    const detailedOrder = {
      ...sOrder,
      orderFees: order.orderFees.map((f: any) => ({ 
        ...f, 
        amount: f.amount.toNumber(),
        createdAt: f.createdAt instanceof Date ? f.createdAt.toISOString() : f.createdAt,
        paidAt: f.paidAt instanceof Date ? f.paidAt.toISOString() : f.paidAt,
      })),
      orderItems: order.orderItems.map((i: any) => ({ 
        ...i, 
        unitPrice: i.unitPrice.toNumber(),
        totalPrice: i.totalPrice.toNumber(),
        createdAt: i.createdAt instanceof Date ? i.createdAt.toISOString() : i.createdAt,
      }))
    };

    return { success: true, order: detailedOrder };
  } catch (error) {
    console.error('Get order detail error:', error);
    return { success: false, error: 'Gagal load detail order' };
  }
}

// ==================== Get Public Kanban ====================
/**
 * Mengambil data order untuk Kanban Board Publik (di bengkel).
 * Menampilkan antrian, sedang dikerjakan, dan selesai.
 * Nomor plat disensor sebagian demi privasi.
 * 
 * @returns {Object} List order untuk kanban publik.
 */
export async function getPublicKanbanOrders() {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: ['QUEUE', 'IN_PROGRESS', 'READY'],
        },
      },
      select: {
        id: true,
        vehicle: true,
        serviceType: true,
        status: true,
        plateNumber: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const maskedOrders = orders.map((order) => ({
      ...order,
      plateNumber: order.plateNumber 
        ? order.plateNumber.slice(-3) 
        : order.id.slice(-3),
    }));

    const ordersWithQueueNumbers = await addQueueNumbersToOrders(maskedOrders);
    return { success: true, orders: ordersWithQueueNumbers };
  } catch (error) {
    console.error('Get public kanban error:', error);
    return { success: false, error: 'Gagal load kanban' };
  }
}

// ==================== Create Order (Admin) ====================
/**
 * Membuat order manual dari admin dashboard.
 * 
 * @param {CreateOrderInput} data - Data order.
 * @returns {Object} Order baru.
 */
export async function createOrder(data: CreateOrderInput) {
  try {
    const session = await auth();
    if (!session || !['OWNER', 'ADMIN'].includes(session.user?.role || '')) {
      return { success: false, error: 'Akses ditolak: Hanya Owner dan Admin yang dapat membuat order.' };
    }
    const order = await prisma.order.create({
      data: {
        custName: data.custName,
        custPhone: data.custPhone,
        vehicle: data.vehicle,
        plateNumber: data.plateNumber,
        complaint: data.complaint,
        serviceType: data.serviceType,
        status: 'PENDING',
      },
      include: {
        mechanic: true,
        payments: true,
      },
    });

    revalidatePath('/admin/orders');
    
    await createLog({
        action: "CREATE_ORDER",
        title: "Order Created",
        details: `New order created for ${data.custName} (${data.vehicle})`,
        metadata: { orderId: order.id },
        userName: "Admin",
        role: "ADMIN"
      });

    return { success: true, order: serializeOrder(order) };
  } catch (error) {
    return { success: false, error: 'Gagal membuat order' };
  }
}

// ==================== Update Order ====================
/**
 * Update informasi dasar order.
 * 
 * @param {string} orderId - ID Order.
 * @param {Partial<CreateOrderInput>} data - Data perubahan.
 * @returns {Object} Order updated.
 */
export async function updateOrder(orderId: string, data: Partial<CreateOrderInput>) {
  try {
    const session = await auth();
    if (!session || !['OWNER', 'ADMIN'].includes(session.user?.role || '')) {
      return { success: false, error: 'Akses ditolak: Hanya Owner dan Admin yang dapat mengupdate order.' };
    }
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        ...(data.custName && { custName: data.custName }),
        ...(data.custPhone && { custPhone: data.custPhone }),
        ...(data.vehicle && { vehicle: data.vehicle }),
        ...(data.plateNumber !== undefined && { plateNumber: data.plateNumber }),
        ...(data.complaint && { complaint: data.complaint }),
        ...(data.serviceType && { serviceType: data.serviceType }),
      },
      include: {
        mechanic: true,
        payments: true,
      },
    });

    revalidatePath('/admin/orders');
    
    await createLog({
        action: "UPDATE_ORDER",
        title: "Order Updated",
        details: `Order updated by admin.`,
        metadata: { orderId: order.id },
        userName: "Admin",
        role: "ADMIN"
      });

    return { success: true, order: serializeOrder(order) };
  } catch (error) {
    return { success: false, error: 'Gagal update order' };
  }
}

// ==================== Delete Order ====================
/**
 * Menghapus order secara permanen.
 * 
 * @param {string} orderId - ID Order.
 * @returns {Object} Status sukses.
 */
export async function deleteOrder(orderId: string) {
  try {
    const session = await auth();
    if (!session || !['OWNER', 'ADMIN'].includes(session.user?.role || '')) {
      return { success: false, error: 'Akses ditolak: Hanya Owner dan Admin yang dapat menghapus order.' };
    }
    await prisma.order.delete({
      where: { id: orderId },
    });
    revalidatePath('/admin/orders');
    
    await createLog({
        action: "DELETE_ORDER",
        title: "Order Deleted",
        details: `Order ${orderId} has been deleted.`,
        metadata: { orderId },
        userName: "Admin",
        role: "ADMIN"
      });

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Gagal menghapus order' };
  }
}

// Helper function to dynamically add queue numbers to a list of orders based on their creation index on each date
async function addQueueNumbersToOrders(orders: any[]) {
  if (orders.length === 0) return [];

  // 1. Get unique dates formatted as yyyy-MM-dd
  const dateStrings = Array.from(
    new Set(
      orders.map(o => {
        const d = o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt);
        return format(d, 'yyyy-MM-dd');
      })
    )
  );

  // 2. Query all orders on those dates
  const allOrdersForDates = await prisma.order.findMany({
    where: {
      OR: dateStrings.map(dateStr => {
        const date = new Date(dateStr);
        return {
          createdAt: {
            gte: startOfDay(date),
            lte: endOfDay(date)
          }
        };
      })
    },
    select: {
      id: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  // 3. Group by date and calculate index
  const queueMap = new Map<string, string>(); // orderId -> queueNumber
  
  // Group allOrdersForDates by formatted date
  const groups: { [dateStr: string]: typeof allOrdersForDates } = {};
  allOrdersForDates.forEach(o => {
    const d = o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt);
    const dateStr = format(d, 'yyyy-MM-dd');
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(o);
  });

  // Assign queue numbers within each group
  Object.keys(groups).forEach(dateStr => {
    groups[dateStr].forEach((o, index) => {
      const qNum = `Q-${String(index + 1).padStart(2, '0')}`;
      queueMap.set(o.id, qNum);
    });
  });

  // 4. Map queue numbers back to the input orders
  return orders.map(o => ({
    ...o,
    queueNumber: queueMap.get(o.id) || 'Q-00'
  }));
}