"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createLog } from "./logs";

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID";

export interface CreatePaymentInput {
  amount: number;
  note?: string;
  orderId?: string;
  employeeId?: string;
  paymentMethod?: "CASH" | "TRANSFER" | "QRIS" | "CARD";
  bankAccountId?: string;
  payCommissionNow?: boolean;
}

function toNumber(val: unknown): number {
  if (!val) {
    return 0;
  }
  if (typeof val === "number") {
    return val;
  }
  if (
    typeof val === "object" &&
    val !== null &&
    "toNumber" in val &&
    typeof (val as any).toNumber === "function"
  ) {
    return (val as any).toNumber();
  }
  return Number(val);
}

function serializePayment(payment: any) {
  if (!payment) {
    return null;
  }
  return {
    ...payment,
    amount: toNumber(payment.amount),
    date: payment.date instanceof Date ? payment.date.toISOString() : payment.date,
    createdAt: payment.createdAt instanceof Date ? payment.createdAt.toISOString() : payment.createdAt,
    order: payment.order ? {
      ...payment.order,
      totalPrice: toNumber(payment.order.totalPrice),
      totalPaid: toNumber(payment.order.totalPaid),
    } : null,
    employee: payment.employee ? {
      ...payment.employee,
    } : null,
    bankAccount: payment.bankAccount ? {
      ...payment.bankAccount,
      currentBalance: toNumber(payment.bankAccount.currentBalance),
    } : null,
  };
}

/**
 * Creates an order payment record and updates order payment status.
 * 
 * @param data - Payment input details.
 * @returns Success response with payment data.
 */
export async function createPayment(data: CreatePaymentInput) {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: "Unauthenticated" };
    }
    const isOwner = session.user?.role === "OWNER";
    const isAdmin = session.user?.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return { success: false, error: "Access denied: You do not have permission to record payments." };
    }
    if (!data.orderId) {
      return {
        success: false,
        error: "Order ID is required",
      };
    }

    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      const payment = await tx.payment.create({
        data: {
          amount: data.amount,
          note: data.note,
          orderId: data.orderId!,
          type: "ORDER_PAYMENT",
          paymentMethod: data.paymentMethod || "CASH",
          bankAccountId: data.bankAccountId || null,
        },
      });

      return await handleOrderPayment(tx, data.orderId!, payment, data.payCommissionNow);
    }, {
      maxWait: 5000,
      timeout: 15000,
    });

    revalidatePath("/admin/orders");
    revalidatePath("/admin/payroll");
    revalidatePath("/admin/reports");
    revalidatePath("/admin/settings");

    await createLog({
      action: "CREATE_PAYMENT",
      title: "Payment Received",
      details: `Payment of Rp ${Number(data.amount).toLocaleString('id-ID')} received via ${data.paymentMethod || 'CASH'}.`,
      metadata: { 
        paymentId: result?.id, 
        orderId: data.orderId, 
        method: data.paymentMethod 
      },
      userName: "Admin",
      role: "ADMIN"
    });

    return { success: true, payment: serializePayment(result) };
  } catch (error: any) {
    console.error("Create payment error:", error);
    return { success: false, error: error.message || "Failed to process payment" };
  }
}

async function handleOrderPayment(tx: TransactionClient, orderId: string, payment: any, payCommissionNow?: boolean) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { orderItems: true }
  });

  if (!order) {
    throw new Error("Order not found");
  }

  const amount = Number(payment.amount);
  const newTotalPaid = Number(order.totalPaid) + amount;
  const totalPrice = Number(order.totalPrice);

  if (payment.paymentMethod && ["TRANSFER", "QRIS", "CARD"].includes(payment.paymentMethod) && payment.bankAccountId) {
    const bankAccount = await tx.account.findUnique({ where: { id: payment.bankAccountId } });
    if (bankAccount) {
      await tx.account.update({
        where: { id: payment.bankAccountId },
        data: { currentBalance: Number(bankAccount.currentBalance) + amount }
      });
    }
  }

  let paymentStatus: PaymentStatus = "UNPAID";
  if (newTotalPaid >= totalPrice) {
    paymentStatus = "PAID";
  } else if (newTotalPaid > 0) {
    paymentStatus = "PARTIAL";
  }

  await tx.order.update({
    where: { id: orderId },
    data: {
      totalPaid: newTotalPaid,
      paymentStatus,
    },
  });

  if (paymentStatus === "PAID" && payCommissionNow) {
    await tx.orderItem.updateMany({
      where: { orderId: orderId, itemType: "FEE", isPaid: false },
      data: { isPaid: true }
    });
  }

  return serializePayment(payment);
}

export interface CreatePayrollPaymentInput {
  amount: number;
  note?: string;
  employeeId?: string;
  paymentMethod?: "CASH" | "TRANSFER" | "QRIS" | "CARD";
  bankAccountId?: string;
}

/**
 * Creates a payroll payment and logs the disbursement.
 * 
 * @param data - Payroll payment input details.
 * @returns Success response with payment data.
 */
export async function createPayrollPayment(data: CreatePayrollPaymentInput) {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: "Unauthenticated" };
    }
    if (session.user?.role !== "OWNER") {
      return { success: false, error: "Access denied: Only Owner can approve payroll payments." };
    }

    const payment = await prisma.payment.create({
      data: {
        amount: data.amount,
        type: "PAYROLL",
        note: data.note,
        employeeId: data.employeeId || null,
        paymentMethod: data.paymentMethod || "CASH",
        bankAccountId: data.bankAccountId || null,
      },
    });

    revalidatePath("/admin/payroll");
    revalidatePath("/admin/reports");
    revalidatePath("/admin/employees");

    await createLog({
      action: "PAYROLL_PAYMENT",
      title: "Payroll Payment",
      details: `Payroll payment of Rp ${Number(data.amount).toLocaleString('id-ID')} processed via ${data.paymentMethod || 'CASH'}.`,
      metadata: { paymentId: payment.id, employeeId: data.employeeId },
      userName: "Owner",
      role: "OWNER",
    });

    return { success: true, payment: serializePayment(payment) };
  } catch (error: any) {
    console.error("Create payroll payment error:", error);
    return { success: false, error: error.message || "Failed to process payroll payment" };
  }
}

/**
 * Fetches payment history records with optional filters.
 * 
 * @param filters - Optional filters by orderId and date range.
 * @returns List of payments.
 */
export async function getPaymentHistory(filters?: {
  orderId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  try {
    const session = await auth();
    if (!session || !["OWNER", "ADMIN"].includes(session.user?.role || "")) {
      return { success: false, error: "Access denied: You do not have permission to view payment history." };
    }
    const payments = await prisma.payment.findMany({
      where: {
        ...(filters?.orderId && { orderId: filters.orderId }),
        ...(filters?.dateFrom && {
          date: { gte: filters.dateFrom },
        }),
        ...(filters?.dateTo && {
          date: { lte: filters.dateTo },
        }),
      },
      include: {
        order: {
          select: {
            id: true,
            custName: true,
            vehicle: true,
            totalPrice: true,
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        bankAccount: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return { success: true, payments: payments.map(serializePayment) };
  } catch (error) {
    console.error("Get payment history error:", error);
    return { success: false, error: "Failed to load payment history" };
  }
}

/**
 * Fetches journal entries constructed from payment transactions.
 * 
 * @param filters - Optional filters by date range and account code.
 * @returns List of accounting journal entries.
 */
export async function getJournalEntries(filters?: {
  dateFrom?: Date;
  dateTo?: Date;
  accountCode?: string;
}) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "OWNER") {
      return { success: false, error: "Access denied: Only Owner can view accounting journals." };
    }
    const payments = await prisma.payment.findMany({
      where: {
        ...(filters?.dateFrom && {
          date: { gte: filters.dateFrom },
        }),
        ...(filters?.dateTo && {
          date: { lte: filters.dateTo },
        }),
      },
      include: {
        bankAccount: true,
        order: true,
        employee: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    const entries = payments.map((p) => ({
      id: p.id,
      date: p.createdAt.toISOString(),
      description: p.note || `Transaksi ${p.type}`,
      reference: p.orderId || p.employeeId || p.id,
      items: (p.journalItems as any) || [
        {
          id: `${p.id}-1`,
          debit: p.type === "ORDER_PAYMENT" || p.type === "INCOME" ? Number(p.amount) : 0,
          credit: p.type === "EXPENSE" || p.type === "PAYROLL" ? Number(p.amount) : 0,
          account: {
            code: p.bankAccount?.code || "101",
            name: p.bankAccount?.name || "Kas Utama",
          },
        },
      ],
      createdAt: p.createdAt.toISOString(),
    }));

    return { success: true, entries };
  } catch (error) {
    console.error("Get journal entries error:", error);
    return { success: false, error: "Failed to load journal entries" };
  }
}

