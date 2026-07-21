// app/actions/payments.ts
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createLog } from "./logs";

// ==================== Types ====================
// Infer TransactionClient type to avoid importing 'Prisma' namespace which causes issues
type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID";

export type CreatePaymentInput = {
  amount: number;
  note?: string;
  orderId?: string;
  payrollId?: string;
  paymentMethod?: "CASH" | "TRANSFER" | "QRIS" | "CARD";
  bankAccountId?: string;
  payCommissionNow?: boolean; // New Option: Pay employee commission immediately
};

export type JournalEntryInput = {
  description: string;
  items: {
    accountCode: string;
    debit?: number;
    credit?: number;
  }[];
  paymentId?: string;
  reference?: string;
};

// ==================== Helper: Serialize Decimal ====================
function toNumber(val: any) {
  if (typeof val === 'number') return val;
  if (val && typeof val.toNumber === 'function') return val.toNumber();
  return 0;
}

function serializeJournalItem(item: any) {
  if (!item) return null;
  return {
    ...item,
    debit: toNumber(item.debit),
    credit: toNumber(item.credit),
  };
}

function serializeJournalEntry(entry: any) {
  if (!entry) return null;
  return {
    ...entry,
    date: entry.date instanceof Date ? entry.date.toISOString() : entry.date,
    createdAt: entry.createdAt instanceof Date ? entry.createdAt.toISOString() : entry.createdAt,
    items: entry.items?.map(serializeJournalItem) ?? [],
  };
}

function serializePayment(payment: any) {
  if (!payment) return null;
  const p = {
    ...payment,
    amount: toNumber(payment.amount),
    date: payment.date instanceof Date ? payment.date.toISOString() : payment.date,
    createdAt: payment.createdAt instanceof Date ? payment.createdAt.toISOString() : payment.createdAt,
    updatedAt: payment.updatedAt instanceof Date ? payment.updatedAt.toISOString() : payment.updatedAt,
  };

  if (p.order) {
    p.order = {
      ...p.order,
      totalPrice: toNumber(p.order.totalPrice),
      totalPaid: toNumber(p.order.totalPaid),
      createdAt: p.order.createdAt instanceof Date ? p.order.createdAt.toISOString() : p.order.createdAt,
      updatedAt: p.order.updatedAt instanceof Date ? p.order.updatedAt.toISOString() : p.order.updatedAt,
      scheduledAt: p.order.scheduledAt instanceof Date ? p.order.scheduledAt.toISOString() : p.order.scheduledAt,
    };
  }

  if (p.payroll) {
    p.payroll = {
      ...p.payroll,
      totalEarned: toNumber(p.payroll.totalEarned),
      totalPaid: toNumber(p.payroll.totalPaid),
      baseSalary: toNumber(p.payroll.baseSalary),
      bonus: toNumber(p.payroll.bonus),
      startDate: p.payroll.startDate instanceof Date ? p.payroll.startDate.toISOString() : p.payroll.startDate,
      endDate: p.payroll.endDate instanceof Date ? p.payroll.endDate.toISOString() : p.payroll.endDate,
      createdAt: p.payroll.createdAt instanceof Date ? p.payroll.createdAt.toISOString() : p.payroll.createdAt,
      updatedAt: p.payroll.updatedAt instanceof Date ? p.payroll.updatedAt.toISOString() : p.payroll.updatedAt,
    };
  }

  if (p.journal) {
    p.journal = serializeJournalEntry(p.journal);
  }

  return p;
}

// ==================== Generic Payment Handler ====================
/**
 * Membuat Pembayaran Baru (Generic).
 * Bisa untuk Pembayaran Order (Income) atau Pembayaran Gaji/Komisi (Expense).
 * 
 * Fungsi ini otomatis menghandle:
 * - Update status pembayaran Order/Payroll (Partial/Paid).
 * - Update saldo Bank (jika via transfer).
 * - Pembuatan Jurnal Akuntansi otomatis (Otomatis seimbang Debit/Kredit).
 * - Pencairan komisi otomatis jika dipilih.
 * 
 * @param {CreatePaymentInput} data - Data pembayaran.
 * @returns {Object} Data pembayaran yang dibuat.
 */
export async function createPayment(data: CreatePaymentInput) {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: "Sesi tidak valid." };
    }
    const isOwner = session.user?.role === "OWNER";
    const isAdmin = session.user?.role === "ADMIN";

    if (data.payrollId && !isOwner) {
      return { success: false, error: "Akses ditolak: Hanya Owner yang dapat memproses pembayaran gaji." };
    }
    if (!isOwner && !isAdmin) {
      return { success: false, error: "Akses ditolak: Anda tidak memiliki wewenang untuk mencatat pembayaran." };
    }
    // Validasi: harus ada salah satu orderId atau payrollId
    if (!data.orderId && !data.payrollId) {
      return {
        success: false,
        error: "Order ID atau Payroll ID harus diisi",
      };
    }

    // Jangan izinkan keduanya terisi
    if (data.orderId && data.payrollId) {
      return {
        success: false,
        error: "Hanya bisa untuk Order ATAU Payroll, tidak keduanya",
      };
    }

    // Gunakan transaction untuk atomic operation dengan timeout lebih lama
    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      // 1. Buat record payment
      const payment = await tx.payment.create({
        data: {
          amount: data.amount,
          note: data.note,
          orderId: data.orderId,
          payrollId: data.payrollId,
          paymentMethod: data.paymentMethod || "CASH",
          bankAccountId: data.bankAccountId || null,
        },
      });

      // 2. Handle berdasarkan tipe
      if (data.orderId) {
        return await handleOrderPayment(tx, data.orderId, payment, data.payCommissionNow);
      } else if (data.payrollId) {
        return await handlePayrollPayment(tx, data.payrollId, payment);
      }
    }, {
      maxWait: 5000, // Maximum time to wait for a transaction slot (5s)
      timeout: 15000, // Maximum time for the transaction to complete (15s - Accelerate limit)
    });

    revalidatePath("/admin/orders");
    revalidatePath("/admin/payroll");
    revalidatePath("/admin/finance");
    revalidatePath("/admin/settings");

    await createLog({
        action: "CREATE_PAYMENT",
        title: "Payment Received",
        details: `Payment of Rp ${Number(data.amount).toLocaleString('id-ID')} received via ${data.paymentMethod || 'CASH'}.`,
        metadata: { 
            paymentId: result?.id, 
            orderId: data.orderId, 
            payrollId: data.payrollId,
            method: data.paymentMethod 
        },
        userName: "Admin",
        role: "ADMIN"
    });

    // Deep serialize to ensure no Decimal objects remain
    const serializedResult = result ? JSON.parse(JSON.stringify(serializePayment(result))) : result;
    
    return { success: true, payment: serializedResult };
  } catch (error: any) {
    console.error("Create payment error:", error);
    return { success: false, error: `Gagal: ${error.message}` };
  }
}

// ==================== Helper: Calculate Revenue Breakdown ====================
async function getRevenueBreakdown(tx: TransactionClient, orderId: string, orderHeader?: any) {
  // Ambil detail item order
  const orderItems = await tx.orderItem.findMany({
    where: { orderId },
  });

  let serviceRevenue = 0;
  let partRevenue = 0;

  if (orderItems.length > 0) {
    for (const item of orderItems) {
      const totalPrice = Number(item.totalPrice);
      if (item.itemType === 'service') {
        serviceRevenue += totalPrice;
      } else if (item.itemType === 'part') {
        partRevenue += totalPrice;
      }
    }
  } else {
    // Fallback ke JSON items
    const order = orderHeader || await tx.order.findUnique({
      where: { id: orderId },
      select: { items: true }
    });

    if (order && order.items) {
      const itemsList = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      if (Array.isArray(itemsList)) {
        for (const item of itemsList) {
          const qty = Number(item.qty || 0);
          const price = Number(item.price || 0);
          const itemTotalPrice = qty * price;
          if (item.type === 'service') {
            serviceRevenue += itemTotalPrice;
          } else if (item.type === 'part') {
            partRevenue += itemTotalPrice;
          }
        }
      }
    }
  }

  return { serviceRevenue, partRevenue };
}

// ==================== Handle Order Payment (Customer Bayar) ====================
async function ensureAccount(tx: TransactionClient, code: string, name: string, type: string, category: string) {
  const existing = await tx.account.findUnique({ where: { code } });
  if (!existing) {
    console.log(`Auto-creating account ${code} - ${name}`);
    await tx.account.create({
      data: { code, name, type, category }
    });
  }
}

async function handleOrderPayment(tx: TransactionClient, orderId: string, payment: any, payCommissionNow?: boolean) {
  // 1. Ambil order data
  const order = await tx.order.findUnique({
    where: { id: orderId },
  });

  if (!order) throw new Error("Order tidak ditemukan");

  // Ensure critical accounts exist
  await ensureAccount(tx, "101", "Kas Tunai", "ASSET", "CURRENT_ASSET");
  await ensureAccount(tx, "102", "Bank", "ASSET", "CURRENT_ASSET");
  await ensureAccount(tx, "103", "Piutang Usaha", "ASSET", "CURRENT_ASSET");
  await ensureAccount(tx, "401", "Pendapatan Jasa Servis", "REVENUE", "OPERATING_REVENUE");
  await ensureAccount(tx, "402", "Pendapatan Penjualan Sparepart", "REVENUE", "OPERATING_REVENUE");
  await ensureAccount(tx, "202", "Utang Gaji & Komisi", "LIABILITY", "CURRENT_LIABILITY");

  const amount = Number(payment.amount);
  const newTotalPaid = Number(order.totalPaid) + amount;
  const totalPrice = Number(order.totalPrice);

  // Update saldo bank jika pembayaran via transfer/qris/card
  if (["TRANSFER", "QRIS", "CARD"].includes(payment.paymentMethod) && payment.bankAccountId) {
    // Get bank account info using raw query
    const bankAccounts = await tx.$queryRaw<Array<{
      id: string;
      accountNumber: string;
      bankName: string;
      currentBalance: number;
    }>>`
      SELECT id, "accountNumber", "bankName", "currentBalance"::numeric::float as "currentBalance"
      FROM "BankAccount" 
      WHERE id = ${payment.bankAccountId}
    `;
    
    const bankAccount = bankAccounts[0];
    if (bankAccount) {
      // Update saldo bank (INCREMENT)
      const newBalance = Number(bankAccount.currentBalance) + amount;
      
      await tx.$executeRaw`
        UPDATE "BankAccount" 
        SET "currentBalance" = ${newBalance}, "updatedAt" = NOW()
        WHERE id = ${payment.bankAccountId}
      `;

      // Ensure bank-specific account exists for detailed tracking
      const bankAccCode = `102-${bankAccount.accountNumber.slice(-3)}`;
      const bankAccName = `Bank ${bankAccount.bankName} - ${bankAccount.accountNumber.slice(-4)}`;
      
      await ensureAccount(tx, bankAccCode, bankAccName, "ASSET", "CURRENT_ASSET");
    }
  }

  // 3. Tentukan payment status
  let paymentStatus: PaymentStatus = "UNPAID";
  if (newTotalPaid >= totalPrice) {
    paymentStatus = "PAID";
  } else if (newTotalPaid > 0) {
    paymentStatus = "PARTIAL";
  }

  // 4. Update order
  await tx.order.update({
    where: { id: orderId },
    data: {
      totalPaid: newTotalPaid,
      paymentStatus, // using local type
    },
  });

  // 5. Buat jurnal akuntansi
  const isFullPayment = paymentStatus === "PAID";
  const isFirstPayment = Number(order.totalPaid) === 0;
  
  // Tentukan akun kas/bank yang akan digunakan
  let cashAccountCode = "101"; // Default: Kas Tunai
  
  if (["TRANSFER", "QRIS", "CARD"].includes(payment.paymentMethod) && payment.bankAccountId) {
    // Gunakan akun bank spesifik jika ada
    const bankAccount = await tx.bankAccount.findUnique({
      where: { id: payment.bankAccountId }
    });
    
    if (bankAccount) {
      cashAccountCode = `102-${bankAccount.accountNumber.slice(-3)}`;
    } else {
      cashAccountCode = "102"; // Fallback ke akun Bank umum
    }
  } else if (["TRANSFER", "QRIS", "CARD"].includes(payment.paymentMethod)) {
    cashAccountCode = "102"; // Fallback ke akun Bank umum
  }

  if (isFirstPayment && !isFullPayment) {
    // DP
    await createJournalEntry(
      {
        description: `Penerimaan DP Order #${order.id.slice(-6)}`,
        items: [
          { accountCode: cashAccountCode, debit: amount }, 
          { accountCode: "103", credit: amount }, 
        ],
        paymentId: payment.id,
        reference: orderId,
      },
      tx
    );
  } else if (isFullPayment && isFirstPayment) {
    // Lunas Langsung - Pisahkan pendapatan jasa vs sparepart
    const breakdown = await getRevenueBreakdown(tx, orderId, order);
    let serviceRevenue = breakdown.serviceRevenue;
    let partRevenue = breakdown.partRevenue;
    const totalRev = serviceRevenue + partRevenue;

    if (totalRev !== amount) {
      // Ada selisih, masukkan ke pendapatan jasa (serviceRevenue) agar jurnal balance
      serviceRevenue += (amount - totalRev);
    }

    const journalItems: any[] = [
      { accountCode: cashAccountCode, debit: amount },
    ];
    
    if (serviceRevenue > 0) {
      journalItems.push({ accountCode: "401", credit: serviceRevenue });
    }
    if (partRevenue > 0) {
      journalItems.push({ accountCode: "402", credit: partRevenue });
    }

    await createJournalEntry(
      {
        description: `Penerimaan Pembayaran Order #${order.id.slice(-6)}`,
        items: journalItems,
        paymentId: payment.id,
        reference: orderId,
      },
      tx
    );
  } else {
    // Pelunasan
    await createJournalEntry(
      {
        description: `Pelunasan Order #${order.id.slice(-6)}`,
        items: [
          { accountCode: cashAccountCode, debit: amount }, 
          { accountCode: "103", credit: amount }, 
        ],
        paymentId: payment.id,
        reference: orderId,
      },
      tx
    );
    
    if (isFullPayment) {
      // Pisahkan pendapatan jasa vs sparepart
      const breakdown = await getRevenueBreakdown(tx, orderId, order);
      let serviceRevenue = breakdown.serviceRevenue;
      let partRevenue = breakdown.partRevenue;
      const totalRev = serviceRevenue + partRevenue;

      if (totalRev !== totalPrice) {
        // Ada selisih, masukkan ke pendapatan jasa (serviceRevenue) agar jurnal balance
        serviceRevenue += (totalPrice - totalRev);
      }

      const revenueItems: any[] = [
        { accountCode: "103", debit: totalPrice },
      ];
      
      if (serviceRevenue > 0) {
        revenueItems.push({ accountCode: "401", credit: serviceRevenue });
      }
      if (partRevenue > 0) {
        revenueItems.push({ accountCode: "402", credit: partRevenue });
      }

      await createJournalEntry(
        {
          description: `Pengakuan Pendapatan Order #${order.id.slice(-6)}`,
          items: revenueItems,
          reference: orderId,
        },
        tx
      );
    }
  }

  // --- LOGIC BARU: CAIRKAN KOMISI KARYAWAN ---
  if (isFullPayment && payCommissionNow) {
      const unpaidFees = await tx.orderFee.findMany({
          where: { orderId: orderId, isPaid: false }
      });

      if (unpaidFees.length > 0) {
          await tx.orderFee.updateMany({
              where: { orderId: orderId },
              data: { isPaid: true, paidAt: new Date() }
          });

          const totalCommission = unpaidFees.reduce((sum: number, f: any) => sum + Number(f.amount), 0);

          await createJournalEntry({
              description: `Pencairan Komisi Order #${order.id.slice(-6)} (Auto)`,
              items: [
                  { accountCode: "202", debit: totalCommission }, 
                  { accountCode: "101", credit: totalCommission } 
              ],
              reference: orderId,
              // paymentId removed to avoid unique constraint
          }, tx);
      }
  }

  return serializePayment(payment);
}

// ==================== Handle Payroll Payment (Bayar Gaji) ====================
async function handlePayrollPayment(tx: TransactionClient, payrollId: string, payment: any) {
  const payroll = await tx.payroll.findUnique({
    where: { id: payrollId },
    include: { employee: true },
  });

  if (!payroll) throw new Error("Payroll tidak ditemukan");

  const amount = Number(payment.amount);
  const newTotalPaid = Number(payroll.totalPaid) + amount;
  const totalEarned = Number(payroll.totalEarned);

  // Update saldo bank jika pembayaran via transfer (KURANG karena keluar)
  if (payment.paymentMethod === "TRANSFER" && payment.bankAccountId) {
    // Get bank account info using raw query
    const bankAccounts = await tx.$queryRaw<Array<{
      id: string;
      accountNumber: string;
      bankName: string;
      currentBalance: number;
    }>>`
      SELECT id, "accountNumber", "bankName", "currentBalance"::numeric::float as "currentBalance"
      FROM "BankAccount" 
      WHERE id = ${payment.bankAccountId}
    `;
    
    const bankAccount = bankAccounts[0];
    if (bankAccount) {
      // Update saldo bank (DECREMENT)
      const newBalance = Number(bankAccount.currentBalance) - amount;
      
      await tx.$executeRaw`
        UPDATE "BankAccount" 
        SET "currentBalance" = ${newBalance}, "updatedAt" = NOW()
        WHERE id = ${payment.bankAccountId}
      `;

      // Ensure bank-specific account exists
      const bankAccCode = `102-${bankAccount.accountNumber.slice(-3)}`;
      const bankAccName = `Bank ${bankAccount.bankName} - ${bankAccount.accountNumber.slice(-4)}`;
      
      await ensureAccount(tx, bankAccCode, bankAccName, "ASSET", "CURRENT_ASSET");
    }
  }

  // 3. Tentukan payment status
  let paymentStatus: PaymentStatus = "UNPAID";
  if (newTotalPaid >= totalEarned) {
    paymentStatus = "PAID";
  } else if (newTotalPaid > 0) {
    paymentStatus = "PARTIAL";
  }

  // 4. Update payroll
  await tx.payroll.update({
    where: { id: payrollId },
    data: {
      totalPaid: newTotalPaid,
      status: paymentStatus,
    },
  });

  // 5. Tentukan akun kas/bank untuk jurnal
  let cashAccountCode = "101"; // Default: Kas Tunai
  
  if (payment.paymentMethod === "TRANSFER" && payment.bankAccountId) {
    const bankAccount = await tx.bankAccount.findUnique({
      where: { id: payment.bankAccountId }
    });
    
    if (bankAccount) {
      cashAccountCode = `102-${bankAccount.accountNumber.slice(-3)}`;
    } else {
      cashAccountCode = "102";
    }
  }

  // 6. Buat jurnal akuntansi
  await createJournalEntry(
    {
      description: `Pembayaran Gaji ${payroll.employee.name} (${
        payment.note || "Pelunasan Gaji/Komisi"
      })`,
      items: [
        { accountCode: "202", debit: amount }, 
        { accountCode: cashAccountCode, credit: amount }, 
      ],
      paymentId: payment.id,
      reference: payrollId,
    },
    tx
  );

  return serializePayment(payment);
}

// ==================== Create Journal Entry (Auto Journaling) ====================
async function createJournalEntry(data: JournalEntryInput, tx?: TransactionClient) {
  const client = tx || prisma;

  try {
    // 1. Validasi balance
    let totalDebit = 0;
    let totalCredit = 0;

    for (const item of data.items) {
      totalDebit += item.debit || 0;
      totalCredit += item.credit || 0;
    }

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error("Jurnal tidak balance! Debit harus sama dengan Kredit");
    }

    // 2. Ambil account IDs
    const uniqueAccountCodes = Array.from(new Set(data.items.map((i) => i.accountCode)));
    const accounts = await client.account.findMany({
      where: { code: { in: uniqueAccountCodes } },
    });

    if (accounts.length !== uniqueAccountCodes.length) {
      const foundCodes = accounts.map((a: any) => a.code);
      const missingCodes = uniqueAccountCodes.filter((c) => !foundCodes.includes(c));
      throw new Error(`Ada kode akun yang tidak valid atau belum dibuat: ${missingCodes.join(", ")}`);
    }

    // 3. Buat journal entry
    const journalEntry = await client.journalEntry.create({
      data: {
        description: data.description,
        paymentId: data.paymentId,
        reference: data.reference,
        items: {
          create: data.items.map((item) => {
            const account = accounts.find(
              (a: any) => a.code === item.accountCode
            );
            return {
              accountId: account!.id,
              debit: item.debit || 0,
              credit: item.credit || 0,
            };
          }),
        },
      },
      include: {
        items: {
          include: {
            account: true,
          },
        },
      },
    });

    return serializeJournalEntry(journalEntry);
  } catch (error) {
    console.error("Create journal error:", error);
    throw error;
  }
}

// ==================== Get Payment History ====================
/**
 * Mengambil riwayat pembayaran berdasarkan filter.
 * 
 * @param {Object} filters - Filter orderId, payrollId, atau tanggal.
 * @returns {Object} List pembayaran.
 */
export async function getPaymentHistory(filters?: {
  orderId?: string;
  payrollId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  try {
    const session = await auth();
    if (!session || !["OWNER", "ADMIN"].includes(session.user?.role || "")) {
      return { success: false, error: "Akses ditolak: Anda tidak memiliki wewenang untuk melihat riwayat pembayaran." };
    }
    const payments = await prisma.payment.findMany({
      where: {
        ...(filters?.orderId && { orderId: filters.orderId }),
        ...(filters?.payrollId && { payrollId: filters.payrollId }),
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
        payroll: {
          select: {
            id: true,
            employee: {
              select: {
                name: true,
                role: true,
              },
            },
            totalEarned: true,
          },
        },
        journal: {
          include: {
            items: {
              include: {
                account: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return { success: true, payments: payments.map(serializePayment) };
  } catch (error) {
    console.error("Get payment history error:", error);
    return { success: false, error: "Gagal load riwayat pembayaran" };
  }
}

// ==================== Get Journal Entries ====================
/**
 * Mengambil data jurnal akuntansi.
 * Digunakan untuk laporan buku besar atau jurnal umum.
 * 
 * @param {Object} filters - Filter tanggal atau kode akun.
 * @returns {Object} List jurnal entries.
 */
export async function getJournalEntries(filters?: {
  dateFrom?: Date;
  dateTo?: Date;
  accountCode?: string;
}) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "OWNER") {
      return { success: false, error: "Akses ditolak: Hanya Owner yang dapat melihat jurnal umum." };
    }
    const entries = await prisma.journalEntry.findMany({
      where: {
        ...(filters?.dateFrom && {
          date: { gte: filters.dateFrom },
        }),
        ...(filters?.dateTo && {
          date: { lte: filters.dateTo },
        }),
        ...(filters?.accountCode && {
          items: {
            some: {
              account: {
                code: filters.accountCode,
              },
            },
          },
        }),
      },
      include: {
        items: {
          include: {
            account: true,
          },
        },
        payment: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return { success: true, entries: entries.map(serializeJournalEntry) };
  } catch (error) {
    console.error("Get journal entries error:", error);
    return { success: false, error: "Gagal load jurnal" };
  }
}
