'use server';

import { prisma } from '@/lib/prisma';

const toNumber = (val: any) => {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (val && typeof val.toNumber === 'function') return val.toNumber();
  return Number(val);
};

// ==================== Get Financial Reports ====================
/**
 * Menghasilkan Laporan Keuangan lengkap (Neraca Saldo, Laba Rugi, Neraca).
 * 
 * Flow perhitungan:
 * 1. Ambil semua akun COA dan item jurnalnya.
 * 2. Hitung saldo per akun berdasarkan Debit - Kredit (atau sebaliknya tergantung tipe akun).
 * 3. Pisahkan akun berdasarkan tipe untuk Laba Rugi (Revenue, Expense) dan Neraca (Limitasi: Asset, Liability, Equity).
 * 4. Hitung Laba/Rugi Bersih (Net Income).
 * 5. Update Total Equity dengan Net Income.
 * 
 * @returns {Object} Data laporan keuangan lengkap.
 */
export async function getFinancialReports() {
  try {
    // Ambil semua akun beserta transaksi jurnalnya
    const accounts = await prisma.account.findMany({
      include: {
        journalItems: {
          select: {
            debit: true,
            credit: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    // Hitung saldo per akun
    const accountBalances = accounts.map((account: any) => {
      const totalDebit = account.journalItems.reduce((sum: number, item: any) => sum + toNumber(item.debit), 0);
      const totalCredit = account.journalItems.reduce((sum: number, item: any) => sum + toNumber(item.credit), 0);
      
      // Saldo normal
      // Asset & Expense: Debit Balance
      // Liability, Equity, Revenue: Credit Balance
      let balance = 0;
      if (['ASSET', 'EXPENSE', 'COST_OF_GOODS_SOLD'].includes(account.type)) {
        balance = totalDebit - totalCredit;
      } else {
        balance = totalCredit - totalDebit;
      }

      // Destructure to separate journalItems from the rest of the account properties
      const { journalItems, ...accountWithoutJournalItems } = account;

      return {
        ...accountWithoutJournalItems,
        createdAt: account.createdAt instanceof Date ? account.createdAt.toISOString() : account.createdAt,
        updatedAt: account.updatedAt instanceof Date ? account.updatedAt.toISOString() : account.updatedAt,
        totalDebit,
        totalCredit,
        balance,
      };
    });

    // ==================== Laba Rugi (Income Statement) ====================
    const revenues = accountBalances.filter((a: any) => a.type === 'REVENUE');
    const expenses = accountBalances.filter((a: any) => ['EXPENSE', 'COST_OF_GOODS_SOLD'].includes(a.type));
    
    const totalRevenue = revenues.reduce((sum: number, a: any) => sum + a.balance, 0);
    const totalExpense = expenses.reduce((sum: number, a: any) => sum + a.balance, 0);
    const netIncome = totalRevenue - totalExpense;

    // ==================== Neraca (Balance Sheet) ====================
    const assets = accountBalances.filter((a: any) => a.type === 'ASSET');
    const liabilities = accountBalances.filter((a: any) => a.type === 'LIABILITY');
    const equity = accountBalances.filter((a: any) => a.type === 'EQUITY');

    const totalAsset = assets.reduce((sum: number, a: any) => sum + a.balance, 0);
    const totalLiability = liabilities.reduce((sum: number, a: any) => sum + a.balance, 0);
    let totalEquity = equity.reduce((sum: number, a: any) => sum + a.balance, 0);

    // Tambahkan Laba Berjalan (Net Income) ke Equity
    totalEquity += netIncome;

    return {
      success: true,
      data: {
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
          netIncome, // Untuk ditampilkan di bagian Equity sebagai Laba Tahun Berjalan
        },
      },
    };
  } catch (error) {
    console.error('Get financial reports error:', error);
    return { success: false, error: 'Gagal memuat laporan keuangan' };
  }
}

/**
 * Mengambil Jurnal Umum (General Ledger) terbaru.
 * 
 * @returns {Object} 100 transaksi jurnal terakhir dengan detail debit/kredit.
 */
export async function getGeneralLedger() {
  try {
    const journals = await prisma.journalEntry.findMany({
      include: {
        items: {
          include: {
            account: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 100, // Limit 100 terakhir
    });

    // Convert decimal and dates
    const sanitizedJournals = journals.map((j: any) => ({
      ...j,
      date: j.date instanceof Date ? j.date.toISOString() : j.date,
      createdAt: j.createdAt instanceof Date ? j.createdAt.toISOString() : j.createdAt,
      items: j.items.map((i: any) => ({
        ...i,
        debit: toNumber(i.debit),
        credit: toNumber(i.credit),
      }))
    }));

    return { success: true, journals: sanitizedJournals };
  } catch (error) {
    console.error('Get ledger error:', error);
    return { success: false, error: 'Gagal memuat jurnal umum' };
  }
}
