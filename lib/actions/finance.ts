'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

function toNumber(val: unknown): number {
  if (!val) {
    return 0;
  }
  if (typeof val === 'number') {
    return val;
  }
  if (typeof val === 'object' && val !== null && 'toNumber' in val && typeof (val as { toNumber: () => number }).toNumber === 'function') {
    return (val as { toNumber: () => number }).toNumber();
  }
  return Number(val);
}

// ==================== Get Financial Reports ====================
/**
 * Menghasilkan Laporan Keuangan lengkap (Neraca Saldo, Laba Rugi, Neraca).
 * 
 * Flow perhitungan:
 * 1. Ambil semua akun COA dan item transaksinya.
 * 2. Hitung saldo per akun berdasarkan Debit - Kredit (atau sebaliknya tergantung tipe akun).
 * 3. Pisahkan akun berdasarkan tipe untuk Laba Rugi (Revenue, Expense) dan Neraca (Limitasi: Asset, Liability, Equity).
 * 4. Hitung Laba/Rugi Bersih (Net Income).
 * 5. Update Total Equity dengan Net Income.
 * 
 * @returns {Object} Data laporan keuangan lengkap.
 */
export async function getFinancialReports() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Akses ditolak: Hanya Owner yang dapat melihat laporan keuangan.' };
    }
    // Ambil semua akun beserta item transaksinya
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
 * Mengambil Jurnal Akuntansi (General Ledger) terbaru.
 * 
 * @returns {Object} 100 transaksi jurnal terakhir dengan detail debit/kredit.
 */
export async function getGeneralLedger() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Akses ditolak: Hanya Owner yang dapat mengakses jurnal akuntansi.' };
    }
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
    return { success: false, error: 'Gagal memuat jurnal akuntansi' };
  }
}

/**
 * Mengambil Laporan Operasional lengkap untuk Owner (Pesanan, Pengeluaran, Spareparts, Log Stok).
 * 
 * @returns {Object} Data pesanan, pengeluaran, spareparts, dan riwayat stok.
 */
export async function getOperationalReports() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Akses ditolak: Hanya Owner yang dapat mengakses laporan operasional.' };
    }

    const orders = await prisma.order.findMany({
      include: {
        orderItems: {
          include: {
            sparePart: true
          }
        },
        mechanic: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const journals = await prisma.journalEntry.findMany({
      orderBy: { date: 'desc' },
      include: {
        items: {
          include: { account: true }
        }
      }
    });

    const expenses = journals.map(j => {
      const debitItem = j.items.find(i => toNumber(i.debit) > 0);
      const creditItem = j.items.find(i => toNumber(i.credit) > 0);
      
      return {
        id: j.id,
        date: j.date,
        description: j.description,
        reference: j.reference,
        amount: toNumber(debitItem?.debit),
        category: debitItem?.account.name || 'Unknown',
        categoryCode: debitItem?.account.code || '',
        source: creditItem?.account.name || 'Unknown'
      };
    }).filter(e => e.source.toLowerCase().includes('kas'));

    const spareParts = await prisma.sparePart.findMany({
      orderBy: { name: 'asc' }
    });

    const stockLogs = await prisma.activityLog.findMany({
      where: {
        action: { in: ["STOCK_IN", "STOCK_OUT", "CREATE_SPAREPART"] }
      },
      orderBy: { createdAt: 'desc' }
    });

    const serializedOrders = orders.map((o: any) => ({
      ...o,
      totalPrice: toNumber(o.totalPrice),
      totalPaid: toNumber(o.totalPaid),
      createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
      updatedAt: o.updatedAt instanceof Date ? o.updatedAt.toISOString() : o.updatedAt,
      scheduledAt: o.scheduledAt instanceof Date ? o.scheduledAt.toISOString() : o.scheduledAt,
      orderItems: o.orderItems.map((item: any) => ({
        ...item,
        unitPrice: toNumber(item.unitPrice),
        totalPrice: toNumber(item.totalPrice),
        createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
        sparePart: item.sparePart ? {
          ...item.sparePart,
          buyPrice: toNumber(item.sparePart.buyPrice),
          sellPrice: toNumber(item.sparePart.sellPrice),
          createdAt: item.sparePart.createdAt instanceof Date ? item.sparePart.createdAt.toISOString() : item.sparePart.createdAt,
          updatedAt: item.sparePart.updatedAt instanceof Date ? item.sparePart.updatedAt.toISOString() : item.sparePart.updatedAt,
        } : null,
      }))
    }));

    const serializedExpenses = expenses.map((e: any) => ({
      ...e,
      amount: toNumber(e.amount),
      date: e.date instanceof Date ? e.date.toISOString() : e.date,
      createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : e.createdAt,
    }));

    const serializedSpareParts = spareParts.map((sp: any) => ({
      ...sp,
      buyPrice: toNumber(sp.buyPrice),
      sellPrice: toNumber(sp.sellPrice),
      createdAt: sp.createdAt instanceof Date ? sp.createdAt.toISOString() : sp.createdAt,
      updatedAt: sp.updatedAt instanceof Date ? sp.updatedAt.toISOString() : sp.updatedAt,
    }));

    const serializedStockLogs = stockLogs.map((log: any) => ({
      ...log,
      createdAt: log.createdAt instanceof Date ? log.createdAt.toISOString() : log.createdAt,
    }));

    return {
      success: true,
      data: {
        orders: serializedOrders,
        expenses: serializedExpenses,
        spareParts: serializedSpareParts,
        stockLogs: serializedStockLogs,
      }
    };
  } catch (error: any) {
    console.error('Get operational reports error:', error);
    return { success: false, error: error.message || 'Gagal memuat laporan operasional.' };
  }
}
