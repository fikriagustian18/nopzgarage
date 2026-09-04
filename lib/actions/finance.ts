"use server";

import { auth } from "@/lib/auth";
import {
  calculatePeriodFinancialActivity,
  isCogsPayment,
} from "@/lib/finance/reportCalculations";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";

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
    typeof (val as { toNumber: () => number }).toNumber === "function"
  ) {
    return (val as { toNumber: () => number }).toNumber();
  }
  return Number(val);
}

/**
 * Generates comprehensive financial reports including trial balance, income statement, balance sheet, and cash flow.
 * 
 * @param startDate - Optional start date filter string.
 * @param endDate - Optional end date filter string.
 * @returns Financial reports payload.
 */
export async function getFinancialReports(startDate?: string, endDate?: string) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "OWNER") {
      return { success: false, error: "Access denied: Only Owner can view financial reports." };
    }


    const start = startDate ? new Date(`${startDate}T00:00:00Z`) : undefined;
    const end = endDate ? new Date(`${endDate}T23:59:59.999Z`) : undefined;

    const allAccounts = await prisma.account.findMany({
      orderBy: { code: 'asc' },
    });

    const dateFilter = start || end ? {
      date: {
        ...(start && { gte: start }),
        ...(end && { lte: end }),
      }
    } : {};

    const payments = await prisma.payment.findMany({
      where: dateFilter,
      include: {
        order: {
          select: { items: true },
        },
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });

    const activity = calculatePeriodFinancialActivity(payments);
    const {
      periodRevenue,
      periodExpense,
      serviceRevenue,
      partRevenue,
      unallocatedRevenue,
      salaryExpense,
      cogsExpense,
      operationalExpense,
    } = activity;

    const revenueAccounts = allAccounts.filter((account) => account.type === "REVENUE");
    const otherRevenueAccount = revenueAccounts.find(
      (account) => account.code !== "401" && account.code !== "402"
    );
    const fallbackRevenueCode =
      otherRevenueAccount?.code ??
      (revenueAccounts.some((account) => account.code === "401") ? "401" : revenueAccounts[0]?.code);

    const accountBalances = allAccounts.map((account) => {
      let balance = Number(account.currentBalance || 0);

      // Dynamically calculate nominal balances for the selected period
      if (account.code === '401') {
        balance = serviceRevenue;
      } else if (account.code === '402') {
        balance = partRevenue;
      } else if (account.code === '501') {
        balance = salaryExpense;
      } else if (account.code === '502') {
        balance = operationalExpense;
      } else if (account.code === '511') {
        balance = cogsExpense;
      } else if (account.type === 'REVENUE') {
        balance = 0;
      } else if (['EXPENSE', 'COST_OF_GOODS_SOLD'].includes(account.type)) {
        balance = 0;
      }

      if (account.code === fallbackRevenueCode) {
        balance += unallocatedRevenue;
      }

      return {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        category: account.category,
        bankCode: account.bankCode,
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        currentBalance: balance,
        isActive: account.isActive,
        createdAt: account.createdAt instanceof Date ? account.createdAt.toISOString() : account.createdAt,
        updatedAt: account.createdAt instanceof Date ? account.createdAt.toISOString() : account.createdAt,
        totalDebit: balance > 0 ? balance : 0,
        totalCredit: balance < 0 ? Math.abs(balance) : 0,
        debit: balance > 0 ? balance : 0,
        credit: balance < 0 ? Math.abs(balance) : 0,
        balance,
      };
    });

    const revenues = accountBalances.filter((account) => account.type === 'REVENUE');
    const expenses = accountBalances.filter((account) => ['EXPENSE', 'COST_OF_GOODS_SOLD'].includes(account.type));
    
    const totalRevenue = periodRevenue;
    const totalExpense = periodExpense;
    const netIncome = totalRevenue - totalExpense;

    const assets = accountBalances.filter((account) => account.type === 'ASSET' || account.type === 'BANK');
    const liabilities = accountBalances.filter((account) => account.type === 'LIABILITY');
    const equity = accountBalances.filter((account) => account.type === 'EQUITY');

    const totalAsset = assets.reduce((sum, account) => sum + account.balance, 0);
    const totalLiability = liabilities.reduce((sum, account) => sum + account.balance, 0);
    const totalEquity = equity.reduce((sum, account) => sum + account.balance, 0) + netIncome;

    const beginningCash = 0;
    const endingCash = totalAsset;

    const cashTransactions = payments.map((p) => {
      let classification: "REVENUE" | "PARTS" | "OPERATING" | "OTHER" = "OPERATING";
      if (p.type === 'ORDER_PAYMENT' || p.type === 'INCOME') {
        classification = "REVENUE";
      } else if (isCogsPayment(p)) {
        classification = "PARTS";
      } else if (p.type === 'PAYROLL') {
        classification = "OPERATING";
      }

      const txDate = p.date || p.createdAt;
      return {
        id: p.id,
        date: txDate instanceof Date ? txDate.toISOString() : txDate,
        description: p.note || `Transaksi ${p.type}`,
        reference: p.orderId || p.employeeId || p.id,
        inflow: p.type === 'ORDER_PAYMENT' || p.type === 'INCOME' ? Number(p.amount) : 0,
        outflow: p.type === 'EXPENSE' || p.type === 'PAYROLL' ? Number(p.amount) : 0,
        classification,
        balance: Number(p.amount)
      };
    });

    return {
      success: true,
      data: serializeData({
        trialBalance: accountBalances,
        incomeStatement: {
          revenues,
          expenses,
          totalRevenue,
          totalExpense,
          netIncome,
        },
        balanceSheet: {
          assets,
          liabilities,
          equity,
          totalAsset,
          totalLiability,
          totalEquity,
          netIncome,
        },
        cashFlowStatement: {
          beginningCash,
          endingCash,
          inflowRevenue: periodRevenue,
          inflowOther: 0,
          totalInflow: periodRevenue,
          outflowParts: cogsExpense,
          outflowOperating: Math.max(0, periodExpense - cogsExpense),
          outflowOther: 0,
          totalOutflow: periodExpense,
          netChange: periodRevenue - periodExpense,
          transactions: cashTransactions,
        }
      })
    };
  } catch (error) {
    console.error('Get financial reports error:', error);
    return { success: false, error: 'Gagal memuat laporan keuangan' };
  }
}

export async function getGeneralLedger() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Akses ditolak: Hanya Owner yang dapat mengakses jurnal akuntansi.' };
    }
    const payments = await prisma.payment.findMany({
      include: {
        bankAccount: true,
        employee: true,
        order: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const sanitizedJournals = payments.map((p: any) => ({
      id: p.id,
      date: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
      createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
      description: p.note || `Transaksi ${p.type}`,
      reference: p.orderId || p.employeeId || p.id,
      items: [
        {
          id: `${p.id}-1`,
          debit: p.type === 'ORDER_PAYMENT' || p.type === 'INCOME' ? toNumber(p.amount) : 0,
          credit: p.type === 'EXPENSE' || p.type === 'PAYROLL' ? toNumber(p.amount) : 0,
          account: {
            code: p.bankAccount?.code || '101',
            name: p.bankAccount?.name || 'Kas Utama',
          }
        }
      ]
    }));

    return { success: true, journals: serializeData(sanitizedJournals) };
  } catch (error) {
    console.error('Get ledger error:', error);
    return { success: false, error: 'Gagal memuat jurnal akuntansi' };
  }
}

export async function getOperationalReports() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Akses ditolak: Hanya Owner yang dapat mengakses laporan operasional.' };
    }

    const [orders, payments, spareParts, stockLogs] = await Promise.all([
      prisma.order.findMany({
        include: {
          mechanic: {
            select: {
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.payment.findMany({
        where: { type: 'EXPENSE' },
        orderBy: { date: 'desc' }
      }),
      prisma.sparePart.findMany({
        orderBy: { name: 'asc' }
      }),
      prisma.systemConfig.findMany({
        where: { category: 'LOG' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    const expenses = payments.map(p => ({
      id: p.id,
      date: p.date,
      description: p.note || 'Pengeluaran',
      reference: p.id,
      amount: toNumber(p.amount),
      category: 'Pengeluaran Umum',
      categoryCode: 'EXP',
      source: 'Kas Utama',
      sourceCode: '101',
    }));

    const serializedOrders = orders.map((o: any) => {
      const rawItems = Array.isArray(o.items) ? o.items : [];
      const customerItems = rawItems.filter((item: any) => {
        const type = String(item?.type || item?.itemType || "").toLowerCase();
        return type !== "fee" && type !== "internal_fee";
      });
      const orderItems = customerItems.map((item: any, idx: number) => {
        const qty = Number(item.qty || item.quantity || 1);
        const unitPrice = toNumber(item.price || item.unitPrice || 0);
        return {
          id: item.id || `${o.id}-${idx}`,
          itemName: item.name || item.itemName || "Item",
          quantity: qty,
          unitPrice,
          totalPrice: qty * unitPrice,
          itemType: item.type || item.itemType || "service",
          createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
          sparePart: null,
        };
      });

      return {
        ...o,
        totalPrice: toNumber(o.totalPrice),
        totalPaid: toNumber(o.totalPaid),
        createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
        updatedAt: o.updatedAt instanceof Date ? o.updatedAt.toISOString() : o.updatedAt,
        scheduledAt: o.scheduledAt instanceof Date ? o.scheduledAt.toISOString() : o.scheduledAt,
        orderItems,
      };
    });

    const serializedExpenses = expenses.map((e: any) => ({
      ...e,
      amount: toNumber(e.amount),
      date: e.date instanceof Date ? e.date.toISOString() : e.date,
      createdAt: e.date instanceof Date ? e.date.toISOString() : e.date,
    }));

    const serializedSpareParts = spareParts.map((sp: any) => ({
      ...sp,
      buyPrice: toNumber(sp.buyPrice),
      sellPrice: toNumber(sp.sellPrice),
      createdAt: sp.createdAt instanceof Date ? sp.createdAt.toISOString() : sp.createdAt,
      updatedAt: sp.updatedAt instanceof Date ? sp.updatedAt.toISOString() : sp.updatedAt,
    }));

    const serializedStockLogs = stockLogs.map((log: any) => ({
      id: log.id,
      action: log.title ? log.title.split(':')[0] : 'LOG',
      title: log.title || '',
      details: log.subtitle || '',
      createdAt: log.createdAt instanceof Date ? log.createdAt.toISOString() : log.createdAt,
    }));

    return {
      success: true,
      data: serializeData({
        orders: serializedOrders,
        expenses: serializedExpenses,
        spareParts: serializedSpareParts,
        stockLogs: serializedStockLogs,
      })
    };
  } catch (error: any) {
    console.error('Get operational reports error:', error);
    return { success: false, error: error.message || 'Gagal memuat laporan operasional.' };
  }
}
