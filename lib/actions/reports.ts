"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface BalanceSheetData {
  assets: {
    currentAssets: { name: string; amount: number }[];
    fixedAssets: { name: string; amount: number }[];
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: { name: string; amount: number }[];
    totalLiabilities: number;
  };
  equity: {
    capital: number;
    retainedEarnings: number;
    totalEquity: number;
  };
}

export interface IncomeStatementData {
  revenue: {
    items: { name: string; amount: number }[];
    total: number;
  };
  expenses: {
    items: { name: string; amount: number }[];
    total: number;
  };
  netIncome: number;
}

/**
 * Generates the Balance Sheet report as of a specific date.
 * 
 * @param asOfDate - Optional cutoff date.
 * @returns Balance sheet data structure.
 */
export async function getBalanceSheet(asOfDate?: Date) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "OWNER") {
      return { success: false, error: "Access denied: Only Owner can access balance sheet." };
    }

    const accounts = await prisma.account.findMany({
      include: {
        payments: true,
      },
    });

    const accountBalances = accounts.map((account) => {
      const balance = Number(account.currentBalance || 0);

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
        balance,
      };
    });

    const assets = accountBalances.filter((a) => a.type === "ASSET" || a.type === "BANK");
    const liabilities = accountBalances.filter((a) => a.type === "LIABILITY");
    const equity = accountBalances.filter((a) => a.type === "EQUITY");

    const currentAssets = assets
      .filter((a) => a.category?.includes("CURRENT") || a.type === "BANK")
      .map((a) => ({ name: a.name, amount: a.balance }));

    const fixedAssets = assets
      .filter((a) => a.category?.includes("FIXED"))
      .map((a) => ({ name: a.name, amount: a.balance }));

    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);

    const currentLiabilities = liabilities.map((a) => ({
      name: a.name,
      amount: a.balance,
    }));

    const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);

    const capital = equity
      .filter((a) => a.category === "CAPITAL")
      .reduce((sum, a) => sum + a.balance, 0);

    const retainedEarnings = equity
      .filter((a) => a.category === "RETAINED_EARNINGS")
      .reduce((sum, a) => sum + a.balance, 0);

    const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0);

    const balanceSheet: BalanceSheetData = {
      assets: {
        currentAssets,
        fixedAssets,
        totalAssets,
      },
      liabilities: {
        currentLiabilities,
        totalLiabilities,
      },
      equity: {
        capital,
        retainedEarnings,
        totalEquity,
      },
    };

    return { success: true, data: serializeData(balanceSheet) };
  } catch (error) {
    console.error("Get balance sheet error:", error);
    return { success: false, error: "Failed to generate balance sheet" };
  }
}

/**
 * Generates the Income Statement (Profit & Loss) report for a date range.
 * 
 * @param dateRange - Period date range (start & end).
 * @returns Income statement report data.
 */
export async function getIncomeStatement(dateRange: DateRange) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "OWNER") {
      return { success: false, error: "Access denied: Only Owner can access income statement." };
    }
    const { startDate, endDate } = dateRange;

    const payments = await prisma.payment.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    let totalRevenue = 0;
    let totalExpense = 0;

    payments.forEach((p) => {
      const amt = Number(p.amount);
      if (p.type === "ORDER_PAYMENT" || p.type === "INCOME") {
        totalRevenue += amt;
      } else if (p.type === "EXPENSE" || p.type === "PAYROLL") {
        totalExpense += amt;
      }
    });

    const incomeStatement: IncomeStatementData = {
      revenue: {
        items: [{ name: "Operating Revenue", amount: totalRevenue }],
        total: totalRevenue,
      },
      expenses: {
        items: [{ name: "Operating & Salary Expenses", amount: totalExpense }],
        total: totalExpense,
      },
      netIncome: totalRevenue - totalExpense,
    };

    return { success: true, data: serializeData(incomeStatement) };
  } catch (error) {
    console.error("Get income statement error:", error);
    return { success: false, error: "Failed to generate income statement" };
  }
}

/**
 * Generates the Cash Flow report for a date range.
 * 
 * @param dateRange - Period date range (start & end).
 * @returns Cash flow analysis and list of cash transactions.
 */
export async function getCashFlow(dateRange: DateRange) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "OWNER") {
      return { success: false, error: "Access denied: Only Owner can access cash flow report." };
    }
    const { startDate, endDate } = dateRange;

    const payments = await prisma.payment.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    let cashIn = 0;
    let cashOut = 0;

    const transactions = payments.map((p) => {
      const amt = Number(p.amount);
      const isInflow = p.type === "ORDER_PAYMENT" || p.type === "INCOME";
      if (isInflow) {
        cashIn += amt;
      } else {
        cashOut += amt;
      }

      return {
        date: p.createdAt.toISOString(),
        description: p.note || `Transaction ${p.type}`,
        amount: amt,
        type: isInflow ? "IN" : "OUT",
      };
    });

    return {
      success: true,
      data: serializeData({
        cashIn,
        cashOut,
        netCashFlow: cashIn - cashOut,
        transactions,
      }),
    };
  } catch (error) {
    console.error("Get cash flow error:", error);
    return { success: false, error: "Failed to generate cash flow report" };
  }
}

/**
 * Retrieves summary metrics for financial and operational dashboard widgets.
 * 
 * @param dateRange - Period date range (start & end).
 * @returns Combined financial & operational summary.
 */
export async function getDashboardSummary(dateRange: DateRange) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "OWNER") {
      return { success: false, error: "Access denied: Only Owner can access dashboard report summary." };
    }
    const { startDate, endDate } = dateRange;

    const [payments, totalOrders, completedOrders, receivables, kasAccounts] = await Promise.all([
      prisma.payment.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.order.count({
        where: {
          status: "COMPLETED",
          updatedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.order.aggregate({
        where: {
          paymentStatus: {
            in: ["UNPAID", "PARTIAL"],
          },
        },
        _sum: {
          totalPrice: true,
          totalPaid: true,
        },
      }),
      prisma.account.findMany({
        where: {
          OR: [
            { code: "101" },
            { type: "BANK" },
          ],
        },
      }),
    ]);

    let revenue = 0;
    let expenses = 0;
    payments.forEach((p) => {
      const amt = Number(p.amount);
      if (p.type === "ORDER_PAYMENT" || p.type === "INCOME") {
        revenue += amt;
      } else {
        expenses += amt;
      }
    });

    const totalReceivables =
      Number(receivables._sum.totalPrice || 0) -
      Number(receivables._sum.totalPaid || 0);

    const cashBalance = kasAccounts.reduce((sum, acc) => sum + Number(acc.currentBalance || 0), 0);

    return {
      success: true,
      data: serializeData({
        revenue,
        expenses,
        netIncome: revenue - expenses,
        totalOrders,
        completedOrders,
        totalReceivables,
        cashBalance,
      }),
    };
  } catch (error) {
    console.error("Get dashboard summary error:", error);
    return { success: false, error: "Failed to load dashboard summary" };
  }
}