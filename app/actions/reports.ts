// app/actions/reports.ts
'use server';

import { prisma } from '@/lib/prisma';

// ==================== Types ====================
export type DateRange = {
  startDate: Date;
  endDate: Date;
};

export type BalanceSheetData = {
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
};

export type IncomeStatementData = {
  revenue: {
    items: { name: string; amount: number }[];
    total: number;
  };
  expenses: {
    items: { name: string; amount: number }[];
    total: number;
  };
  netIncome: number;
};

// ==================== Balance Sheet (Neraca) ====================
// ==================== Balance Sheet (Neraca) ====================
/**
 * Membuat Laporan Neraca (Balance Sheet).
 * Menampilkan posisi keuangan per tanggal tertentu.
 * 
 * Komponen:
 * 1. ASSET (Aset Lancar & Tetap).
 * 2. LIABILITY (Kewajiban/Utang).
 * 3. EQUITY (Modal & Laba Ditahan).
 * 
 * @param {Date} asOfDate - Posisi per tanggal (opsional, default hari ini).
 * @returns {Object} Data Neraca.
 */
export async function getBalanceSheet(asOfDate?: Date) {
  try {
    const date = asOfDate || new Date();

    // Ambil semua akun dan hitung saldonya
    const accounts = await prisma.account.findMany({
      include: {
        journalItems: {
          where: {
            journalEntry: {
              date: {
                lte: date,
              },
            },
          },
        },
      },
    });

    // Hitung saldo per akun
    const accountBalances = accounts.map((account) => {
      let balance = 0;
      
      account.journalItems.forEach((item) => {
        const debit = Number(item.debit);
        const credit = Number(item.credit);
        
        // Normal balance rules
        if (account.type === 'ASSET' || account.type === 'EXPENSE') {
          balance += debit - credit;
        } else {
          balance += credit - debit;
        }
      });

      return {
        ...account,
        balance,
      };
    });

    // Kelompokkan berdasarkan tipe
    const assets = accountBalances.filter((a) => a.type === 'ASSET');
    const liabilities = accountBalances.filter((a) => a.type === 'LIABILITY');
    const equity = accountBalances.filter((a) => a.type === 'EQUITY');

    // Kategorisasi assets
    const currentAssets = assets
      .filter((a) => a.category?.includes('CURRENT'))
      .map((a) => ({ name: a.name, amount: a.balance }));

    const fixedAssets = assets
      .filter((a) => a.category?.includes('FIXED'))
      .map((a) => ({ name: a.name, amount: a.balance }));

    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);

    // Liabilities
    const currentLiabilities = liabilities.map((a) => ({
      name: a.name,
      amount: a.balance,
    }));

    const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);

    // Equity
    const capital = equity
      .filter((a) => a.category === 'CAPITAL')
      .reduce((sum, a) => sum + a.balance, 0);

    const retainedEarnings = equity
      .filter((a) => a.category === 'RETAINED_EARNINGS')
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

    return { success: true, data: balanceSheet };
  } catch (error) {
    console.error('Get balance sheet error:', error);
    return { success: false, error: 'Gagal generate neraca' };
  }
}

// ==================== Income Statement (Laba Rugi) ====================
// ==================== Income Statement (Laba Rugi) ====================
/**
 * Membuat Laporan Laba Rugi (Income Statement).
 * Menghitung profitabilitas dalam rentang waktu tertentu.
 * 
 * Rumus:
 * Net Income = Total Revenue (Pendapatan) - Total Expenses (Beban).
 * 
 * @param {DateRange} dateRange - Periode laporan.
 * @returns {Object} Data Laba Rugi.
 */
export async function getIncomeStatement(dateRange: DateRange) {
  try {
    const { startDate, endDate } = dateRange;

    // Ambil akun revenue dan expense
    const accounts = await prisma.account.findMany({
      where: {
        type: {
          in: ['REVENUE', 'EXPENSE'],
        },
      },
      include: {
        journalItems: {
          where: {
            journalEntry: {
              date: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
      },
    });

    // Hitung total per akun
    const accountTotals = accounts.map((account) => {
      let total = 0;

      account.journalItems.forEach((item) => {
        const debit = Number(item.debit);
        const credit = Number(item.credit);

        if (account.type === 'REVENUE') {
          total += credit - debit;
        } else {
          total += debit - credit;
        }
      });

      return {
        name: account.name,
        type: account.type,
        amount: total,
      };
    });

    // Pisahkan revenue dan expense
    const revenueItems = accountTotals
      .filter((a) => a.type === 'REVENUE')
      .map((a) => ({ name: a.name, amount: a.amount }));

    const expenseItems = accountTotals
      .filter((a) => a.type === 'EXPENSE')
      .map((a) => ({ name: a.name, amount: a.amount }));

    const totalRevenue = revenueItems.reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = expenseItems.reduce((sum, i) => sum + i.amount, 0);
    const netIncome = totalRevenue - totalExpense;

    const incomeStatement: IncomeStatementData = {
      revenue: {
        items: revenueItems,
        total: totalRevenue,
      },
      expenses: {
        items: expenseItems,
        total: totalExpense,
      },
      netIncome,
    };

    return { success: true, data: incomeStatement };
  } catch (error) {
    console.error('Get income statement error:', error);
    return { success: false, error: 'Gagal generate laporan laba rugi' };
  }
}

// ==================== Cash Flow Statement ====================
// ==================== Cash Flow Statement ====================
/**
 * Membuat Laporan Arus Kas (Cash Flow).
 * Melacak semua transaksi yang melibatkan akun KAS (101).
 * 
 * @param {DateRange} dateRange - Periode laporan.
 * @returns {Object} Data Arus Kas (Masuk/Keluar/Net).
 */
export async function getCashFlow(dateRange: DateRange) {
  try {
    const { startDate, endDate } = dateRange;

    // Ambil semua journal items yang menyentuh akun Kas
    const kasAccount = await prisma.account.findFirst({
      where: { code: '101' },
    });

    if (!kasAccount) {
      return { success: false, error: 'Akun Kas tidak ditemukan' };
    }

    const journalItems = await prisma.journalItem.findMany({
      where: {
        accountId: kasAccount.id,
        journalEntry: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      include: {
        journalEntry: {
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
        journalEntry: {
          date: 'asc',
        },
      },
    });

    // Hitung cash in dan cash out
    let cashIn = 0;
    let cashOut = 0;

    const transactions = journalItems.map((item) => {
      const isInflow = Number(item.debit) > 0;
      const amount = isInflow ? Number(item.debit) : Number(item.credit);

      if (isInflow) {
        cashIn += amount;
      } else {
        cashOut += amount;
      }

      return {
        date: item.journalEntry.date instanceof Date ? item.journalEntry.date.toISOString() : item.journalEntry.date,
        description: item.journalEntry.description,
        amount,
        type: isInflow ? 'IN' : 'OUT',
      };
    });

    const netCashFlow = cashIn - cashOut;

    return {
      success: true,
      data: {
        cashIn,
        cashOut,
        netCashFlow,
        transactions,
      },
    };
  } catch (error) {
    console.error('Get cash flow error:', error);
    return { success: false, error: 'Gagal generate laporan arus kas' };
  }
}

// ==================== Dashboard Summary ====================
// ==================== Dashboard Summary ====================
/**
 * Ringkasan cepat untuk Dashboard Admin.
 * Menggabungkan metrik utama: Profit, Omzet, Order Selesai, dan Kas.
 * 
 * @param {DateRange} dateRange - Periode statistik.
 * @returns {Object} Ringkasan metrik.
 */
export async function getDashboardSummary(dateRange: DateRange) {
  try {
    const { startDate, endDate } = dateRange;

    // Total Pendapatan
    const revenue = await prisma.journalItem.aggregate({
      where: {
        account: {
          type: 'REVENUE',
        },
        journalEntry: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      _sum: {
        credit: true,
      },
    });

    // Total Pengeluaran
    const expenses = await prisma.journalItem.aggregate({
      where: {
        account: {
          type: 'EXPENSE',
        },
        journalEntry: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      _sum: {
        debit: true,
      },
    });

    // Jumlah Order
    const totalOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const completedOrders = await prisma.order.count({
      where: {
        status: 'COMPLETED',
        updatedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Piutang
    const receivables = await prisma.order.aggregate({
      where: {
        paymentStatus: {
          in: ['UNPAID', 'PARTIAL'],
        },
      },
      _sum: {
        totalPrice: true,
        totalPaid: true,
      },
    });

    const totalReceivables =
      Number(receivables._sum.totalPrice || 0) -
      Number(receivables._sum.totalPaid || 0);

    // Saldo Kas
    const kasAccount = await prisma.account.findFirst({
      where: { code: '101' },
      include: {
        journalItems: true,
      },
    });

    let cashBalance = 0;
    if (kasAccount) {
      kasAccount.journalItems.forEach((item) => {
        cashBalance += Number(item.debit) - Number(item.credit);
      });
    }

    return {
      success: true,
      data: {
        revenue: Number(revenue._sum.credit || 0),
        expenses: Number(expenses._sum.debit || 0),
        netIncome: Number(revenue._sum.credit || 0) - Number(expenses._sum.debit || 0),
        totalOrders,
        completedOrders,
        totalReceivables,
        cashBalance,
      },
    };
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    return { success: false, error: 'Gagal load dashboard' };
  }
}