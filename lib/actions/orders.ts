"use server";

import { revalidatePath } from "next/cache";
import { format, startOfDay, endOfDay } from "date-fns";

import { auth } from "@/lib/auth";
import { isRoleAllowed } from "@/lib/authCheck";
import { prisma } from "@/lib/prisma";
import { serializeData, formatOrderNo } from "@/lib/utils";
import { calculateCommission, normalizeCommissionRate } from "@/lib/payroll/calculations";
import { createLog } from "./logs";
import type { OrderStatus, ServiceType } from "@prisma/client";

// ==================== Interfaces ====================
export interface OrderItem {
  name: string;
  qty: number;
  price: number;
  type: 'service' | 'part' | 'internal_fee';
  employeeId?: string; // Optional for internal_fee
}

export interface CreateOrderInput {
  custName: string;
  custPhone: string;
  vehicle: string;
  plateNumber?: string;
  complaint: string;
  serviceType: ServiceType;
  scheduledAt?: string | Date;
}

export interface UpdateEstimateInput {
  orderId: string;
  items: OrderItem[];
  scheduledAt?: Date;
}

export interface ProcessOrderInput {
  orderId: string;
  items: OrderItem[];
  mechanicId: string;
  fees?: {
    employeeId: string;
    name: string;
    amount?: number;
    note?: string; // Additional note (e.g. "High Difficulty")
  }[];
}

// ==================== Helper: Serialize Decimal ====================
function serializeOrder(order: unknown): any {
  if (!order) {
    return null;
  }
  return serializeData(order);
}

// ==================== Process Order (Estimation & Assignment) ====================
/**
 * Processes an order (Estimation & Assignment Step).
 * 
 * This function performs:
 * 1. Updates agreed service/part items.
 * 2. Decrements spare part stock in real-time (if parts are included).
 * 3. Records Cost of Goods Sold (COGS) expense payments.
 * 4. Records mechanic commission/fee (Accrual Basis - Fee Payable).
 * 5. Updates order status to 'IN_PROGRESS'.
 * 
 * @param {ProcessOrderInput} data - Process order data.
 * @returns {Object} Result of the processed order.
 */
export async function processOrder(data: ProcessOrderInput): Promise<
  | { success: true; order: unknown }
  | { success: false; error: string }
> {
  try {
    const session = await auth();
    if (!session || !isRoleAllowed(session.user?.role, ['OWNER', 'ADMIN'])) {
      return { success: false, error: 'Access denied: Only Owner and Admin can process orders.' };
    }
    const { orderId, items, mechanicId, fees } = data;

    if (!orderId || !mechanicId || items.length === 0) {
      return { success: false, error: 'Order, mekanik, dan minimal satu item wajib diisi.' };
    }

    const invalidItem = items.find(
      (item) =>
        !item.name?.trim() ||
        !Number.isInteger(Number(item.qty)) ||
        Number(item.qty) <= 0 ||
        !Number.isFinite(Number(item.price)) ||
        Number(item.price) < 0 ||
        !['service', 'part'].includes(item.type)
    );
    if (invalidItem) {
      return { success: false, error: 'Item jasa/sparepart berisi nama, jumlah, atau harga yang tidak valid.' };
    }

    // 1. Calculate total price (Only service & part for customer)
    const totalPrice = items
      .filter((i) => i.type === 'service' || i.type === 'part')
      .reduce((sum, item) => sum + item.qty * item.price, 0);

    const customerItems = items.filter(i => i.type !== 'internal_fee');

    // USING TRANSACTION
    const processedOrder = await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id: orderId },
        select: { status: true },
      });
      if (!existingOrder) {
        throw new Error('Order tidak ditemukan.');
      }
      if (!['PENDING', 'CONFIRMED', 'QUEUE', 'ESTIMATED'].includes(existingOrder.status)) {
        throw new Error('Order yang sudah diproses tidak dapat diproses ulang.');
      }

      const leadMechanic = await tx.employee.findFirst({
        where: { id: mechanicId, isActive: true },
        select: { id: true },
      });
      if (!leadMechanic) {
        throw new Error('Mekanik penanggung jawab tidak valid atau tidak aktif.');
      }

      // 2. Update Order Header
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          items: customerItems as unknown as Parameters<typeof tx.order.update>[0]['data']['items'],
          totalPrice,
          mechanicId,
          status: 'IN_PROGRESS',
          scheduledAt: new Date(),
          // Clear old relations if re-processing to avoid duplicates
          orderItems: { deleteMany: {} },
        },
        include: { mechanic: true }
      });

      // 3. Process Items & Update Stock
      for (const item of customerItems) {
        let sparePartId = null;
        
        // Check if this is a part
        if (item.type === 'part') {
          // Find spare part in DB by name
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

            // === COGS (Cost of Goods Sold) RECORD ===
            const hpp = Number(part.buyPrice) * item.qty;
            await tx.payment.create({
              data: {
                type: 'EXPENSE',
                amount: hpp,
                note: `HPP - ${item.name} (${item.qty} ${part.unit}) - Order #${order.id.slice(-6)}`,
                orderId: order.id,
              }
            });
          }
        }

        // Save to OrderItem details
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

      // 4. Process Order Fees as OrderItem with itemType='FEE'
      let totalFeeAmount = 0;
      if (fees && fees.length > 0) {
        const feeEmployeeIds = fees.map((fee) => fee.employeeId).filter(Boolean);
        if (new Set(feeEmployeeIds).size !== feeEmployeeIds.length) {
          throw new Error('Karyawan pada alokasi komisi tidak boleh duplikat.');
        }
        const feeEmployees = await tx.employee.findMany({
          where: { id: { in: feeEmployeeIds }, isActive: true },
          select: { id: true, name: true, salaryType: true, commissionRate: true },
        });
        const employeeById = new Map(feeEmployees.map((employee) => [employee.id, employee]));
        const serviceSubtotal = customerItems
          .filter((item) => item.type === 'service')
          .reduce((sum, item) => sum + Number(item.qty) * Number(item.price), 0);

        for (const fee of fees) {
          const employee = employeeById.get(fee.employeeId);
          if (!employee || employee.salaryType !== 'COMMISSION') {
            throw new Error('Alokasi komisi hanya dapat diberikan kepada karyawan aktif dengan skema COMMISSION.');
          }
          let rate: number;
          try {
            rate = normalizeCommissionRate(employee.commissionRate);
          } catch {
            throw new Error(`Rate komisi ${employee.name} harus berada pada rentang 0-100%.`);
          }
          const feeAmount = calculateCommission(serviceSubtotal, rate);
          if (feeAmount > 0) {
             await tx.orderItem.create({
               data: {
                 orderId: order.id,
                 itemType: 'FEE',
                  itemName: fee.note?.trim() || `Komisi ${rate}%: ${employee.name}`,
                  quantity: 1,
                  unitPrice: feeAmount,
                  totalPrice: feeAmount,
                  employeeId: fee.employeeId,
                 isPaid: false
               }
             });
             totalFeeAmount += feeAmount;
          }
        }
      }

      return { order, totalFeeAmount };
    }, {
      maxWait: 5000, // Maximum time to wait for a transaction slot (5s)
      timeout: 15000, // Maximum time for the transaction to complete (15s - Accelerate limit)
    });

    await createLog({
      action: "PROCESS_ORDER",
      title: "Order Processed",
      details: `Order processed. Total: Rp ${totalPrice.toLocaleString('id-ID')}. Stock updated. Fees: Rp ${processedOrder.totalFeeAmount.toLocaleString('id-ID')} (Recorded to Accounting).`,
      metadata: { orderId: processedOrder.order.id, fees: processedOrder.totalFeeAmount },
      userName: session.user?.employeeName || session.user?.email || "Admin",
      role: session.user?.role || "ADMIN",
    });

    return { success: true, order: serializeOrder(processedOrder.order) };

  } catch (error: unknown) {
    console.error('Process order error:', error);
    const message = error instanceof Error ? error.message : 'Gagal memproses order';
    return { success: false, error: message };
  }
}

// ==================== Finish Order (Work Completed) ====================
/**
 * Marks an order as completed (READY).
 * Vehicle is ready for customer pickup/payment.
 * 
 * @param {string} orderId - Order ID.
 * @returns {Object} Updated order.
 */
export async function finishOrder(orderId: string) {
  try {
    const session = await auth();
    if (!session || !isRoleAllowed(session.user?.role, ['OWNER', 'ADMIN'])) {
      return { success: false, error: 'Access denied: Only Owner and Admin can mark order finished.' };
    }
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'READY', // Ready for pickup/payment
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

// ==================== Close Order (Handover / Complete) ====================
/**
 * Closes an order finally (COMPLETED).
 * Usually done after full payment and vehicle handover.
 * 
 * @param {string} orderId - Order ID.
 * @returns {Object} Updated order.
 */
export async function closeOrder(orderId: string) {
  try {
    const session = await auth();
    if (!session || !isRoleAllowed(session.user?.role, ['OWNER', 'ADMIN'])) {
      return { success: false, error: 'Access denied: Only Owner and Admin can close order.' };
    }
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true, paymentStatus: true },
    });
    if (!currentOrder) {
      return { success: false, error: 'Order tidak ditemukan.' };
    }
    if (currentOrder.status !== 'READY') {
      return { success: false, error: 'Order hanya dapat ditutup setelah berstatus READY.' };
    }
    if (currentOrder.paymentStatus !== 'PAID') {
      return { success: false, error: 'Order hanya dapat ditutup setelah pembayaran lunas.' };
    }
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETED', // Transaction complete, unit handed over
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
 * Creates a new booking from the public landing page.
 * Initial status: PENDING.
 * 
 * @param {CreateOrderInput} data - Booking data.
 * @returns {Object} New order.
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
    const orderNumber = formatOrderNo(order.id);
    return { success: true, order: { ...serialized, queueNumber, orderNumber } };
  } catch (error) {
    console.error('Create booking error:', error);
    return { success: false, error: 'Gagal membuat booking' };
  }
}

// ==================== Confirm Order ====================
/**
 * Confirms an incoming booking into the active queue (CONFIRMED).
 * 
 * @param {string} orderId - Order ID.
 * @returns {Object} Updated order.
 */
export async function confirmOrder(orderId: string) {
  try {
    const session = await auth();
    if (!session || !isRoleAllowed(session.user?.role, ['OWNER', 'ADMIN'])) {
      return { success: false, error: 'Access denied: Only Owner and Admin can confirm order.' };
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
    console.error('Confirm order error:', error);
    return { success: false, error: 'Gagal konfirmasi order' };
  }
}

// ==================== Update Status (Kanban) ====================
/**
 * Updates order status (Kanban Drag & Drop).
 * Can also assign/reassign mechanic.
 * 
 * @param {string} orderId - Order ID.
 * @param {OrderStatus} newStatus - New status.
 * @param {string} mechanicId - Optional new mechanic ID.
 * @returns {Object} Updated order.
 */
export async function updateOrderStatus(
  orderId: string, 
  newStatus: OrderStatus,
  mechanicId?: string
) {
  try {
    const session = await auth();
    if (!session || !isRoleAllowed(session.user?.role, ['OWNER', 'ADMIN'])) {
      return { success: false, error: 'Access denied: You do not have authorization to update order status.' };
    }
    const validStatuses: OrderStatus[] = [
      'PENDING', 'ESTIMATED', 'CONFIRMED', 'QUEUE', 'IN_PROGRESS', 'READY', 'COMPLETED', 'CANCELLED'
    ];
    if (!validStatuses.includes(newStatus)) {
      return { success: false, error: 'Status order tidak valid.' };
    }
    if (newStatus === 'COMPLETED') {
      const currentOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: { status: true, paymentStatus: true },
      });
      if (!currentOrder || currentOrder.status !== 'READY' || currentOrder.paymentStatus !== 'PAID') {
        return { success: false, error: 'Order hanya dapat diselesaikan dari status READY setelah pembayaran lunas.' };
      }
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
 * Retrieves order list for admin page.
 * Supports filtering by status, service type, date range, and search.
 * 
 * @param {Object} filters - Search filters.
 * @returns {Object} Order list.
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
    if (!session || !isRoleAllowed(session.user?.role, ['OWNER', 'ADMIN'])) {
      return { success: false, error: 'Access denied: Only Owner and Admin can access order list.' };
    }
    const whereClause: Record<string, unknown> = {
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

    // Default limit 50 to prevent memory limits
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
 * Retrieves complete details of a single order.
 * Includes mechanic data, payment history, spare part items, and commission fees.
 * 
 * @param {string} orderId - Order ID.
 * @returns {Object} Order details.
 */
export async function getOrderDetail(orderId: string) {
  try {
    const session = await auth();
    if (!session || !isRoleAllowed(session.user?.role, ['OWNER', 'ADMIN'])) {
      return { success: false, error: 'Access denied: Only Owner and Admin can view order details.' };
    }
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        mechanic: true,
        payments: { orderBy: { date: 'desc' } },
        orderItems: { include: { employee: true, sparePart: true } }, // Includes FEE items for commissions
      },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    return { success: true, order: serializeData(order) };
  } catch (error) {
    console.error('Get order detail error:', error);
    return { success: false, error: 'Gagal load detail order' };
  }
}

// ==================== Get Public Kanban ====================
/**
 * Retrieves order data for public workshop Kanban Board.
 * Displays queue, in-progress, and ready items.
 * License plate numbers are partially masked for privacy.
 * 
 * @returns {Object} Public kanban order list.
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
 * Creates an order manually from admin dashboard.
 * 
 * @param {CreateOrderInput} data - Order data.
 * @returns {Object} New order.
 */
export async function createOrder(data: CreateOrderInput) {
  try {
    const session = await auth();
    if (!session || !isRoleAllowed(session.user?.role, ['OWNER', 'ADMIN'])) {
      return { success: false, error: 'Access denied: Only Owner and Admin can create orders.' };
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
 * Updates basic order information.
 * 
 * @param {string} orderId - Order ID.
 * @param {Partial<CreateOrderInput>} data - Updated data.
 * @returns {Object} Updated order.
 */
export async function updateOrder(orderId: string, data: Partial<CreateOrderInput>) {
  try {
    const session = await auth();
    if (!session || !isRoleAllowed(session.user?.role, ['OWNER', 'ADMIN'])) {
      return { success: false, error: 'Access denied: Only Owner and Admin can update orders.' };
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

// ==================== Cancel / Batalkan Booking ====================
/**
 * Cancels a booking/order (changes status to CANCELLED).
 * 
 * @param {string} orderId - Order ID.
 * @returns {Object} Success status.
 */
export async function cancelOrder(orderId: string) {
  try {
    const session = await auth();
    if (!session || !isRoleAllowed(session.user?.role, ['OWNER', 'ADMIN'])) {
      return { success: false, error: 'Access denied: Only Owner and Admin can cancel bookings.' };
    }
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
      include: {
        mechanic: true,
        payments: true,
      },
    });
    revalidatePath('/admin/orders');
    revalidatePath('/admin/pelayanan');
    revalidatePath('/admin/orders/kanban');
    
    await createLog({
        action: "CANCEL_ORDER",
        title: "Booking Cancelled",
        details: `Booking #${order.id.slice(-6)} has been cancelled.`,
        metadata: { orderId: order.id },
        userName: "Admin",
        role: "ADMIN"
      });

    return { success: true, order: serializeOrder(order) };
  } catch (error) {
    console.error('Cancel order error:', error);
    return { success: false, error: 'Gagal membatalkan booking' };
  }
}

// ==================== Get Order History (Activity Logs) ====================
/**
 * Retrieves the activity logs/history for a specific order.
 * 
 * @param {string} orderId - Order ID.
 * @returns {Object} List of activity logs.
 */
export async function getOrderHistory(orderId: string) {
  try {
    const session = await auth();
    if (!session || !isRoleAllowed(session.user?.role, ['OWNER', 'ADMIN'])) {
      return { success: false, error: 'Access denied' };
    }

    const logs = await prisma.systemConfig.findMany({
      where: {
        category: 'LOG',
        OR: [
          {
            content: {
              path: ['orderId'],
              equals: orderId
            }
          },
          {
            subtitle: {
              contains: orderId
            }
          }
        ]
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return {
      success: true,
      logs: serializeData(
        logs.map((l) => ({
          id: l.id,
          action: l.title?.split(":")[0] || "LOG",
          title: l.title || "",
          details: l.subtitle || "",
          metadata: l.content,
          userName: l.userName || (l.content as any)?.userName || null,
          role: (l.content as any)?.role || (l.content as any)?.userRole || l.platform || null,
          createdAt: l.createdAt,
        }))
      ),
    };
  } catch (error) {
    console.error('Get order history error:', error);
    // Fallback in case JSON querying throws an error on some DB environments
    try {
      const logs = await prisma.systemConfig.findMany({
        where: {
          category: 'LOG',
          subtitle: {
            contains: orderId
          }
        },
        orderBy: { createdAt: 'asc' }
      });
      return {
        success: true,
        logs: serializeData(
          logs.map((l) => ({
            id: l.id,
            action: l.title?.split(":")[0] || "LOG",
            title: l.title || "",
            details: l.subtitle || "",
            metadata: l.content,
            userName: l.userName || (l.content as any)?.userName || null,
            role: (l.content as any)?.role || (l.content as any)?.userRole || l.platform || null,
            createdAt: l.createdAt,
          }))
        ),
      };
    } catch (fallbackError) {
      console.error('Fallback get order history error:', fallbackError);
      return { success: false, error: 'Gagal memuat riwayat order' };
    }
  }
}

// Helper function to dynamically add queue numbers to a list of orders based on their creation index on each date
async function addQueueNumbersToOrders<T extends { id: string; createdAt: string | Date }>(orders: T[]) {
  if (orders.length === 0) {
    return [];
  }

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
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
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
