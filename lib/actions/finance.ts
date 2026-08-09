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
 * Generates complete Financial Reports (Trial Balance, Income Statement, Balance Sheet, Cash Flow).
 * 
 * Calculation flow:
 * 1. Fetch all COA accounts and their journal transaction items.
 * 2. Calculate balance per account based on Debit - Credit (or vice versa depending on account type).
 * 3. Categorize accounts by type for Income Statement (Revenue, Expense) and Balance Sheet (Asset, Liability, Equity).
 * 4. Calculate Net Income.
 * 5. Update Total Equity with Net Income.
 * 
 * @returns {Object} Complete financial reports data.
 */
export async function getFinancialReports(startDate?: string, endDate?: string) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Akses ditolak: Hanya Owner yang dapat melihat laporan keuangan.' };
    }

    const start = startDate ? new Date(`${startDate}T00:00:00Z`) : undefined;
    const end = endDate ? new Date(`${endDate}T23:59:59.999Z`) : undefined;

    // 1. Fetch Income Statement accounts with date range filter (period)
    const incomeStatementAccounts = await prisma.account.findMany({
      where: {
        type: { in: ['REVENUE', 'EXPENSE', 'COST_OF_GOODS_SOLD'] }
      },
      include: {
        journalItems: {
          where: start || end ? {
            journalEntry: {
              date: {
                gte: start,
                lte: end,
              }
            }
          } : undefined,
          select: {
            debit: true,
            credit: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    // 2. Fetch Balance Sheet accounts cumulatively up to end date (endDate)
    const balanceSheetAccounts = await prisma.account.findMany({
      where: {
        type: { in: ['ASSET', 'LIABILITY', 'EQUITY'] }
      },
      include: {
        journalItems: {
          where: end ? {
            journalEntry: {
              date: {
                lte: end,
              }
            }
          } : undefined,
          select: {
            debit: true,
            credit: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    // Combine all accounts and calculate their balances
    const allAccounts = [...balanceSheetAccounts, ...incomeStatementAccounts];
    const accountBalances = allAccounts.map((account: any) => {
      const totalDebit = account.journalItems.reduce((sum: number, item: any) => sum + toNumber(item.debit), 0);
      const totalCredit = account.journalItems.reduce((sum: number, item: any) => sum + toNumber(item.credit), 0);
      
      let balance = 0;
      if (['ASSET', 'EXPENSE', 'COST_OF_GOODS_SOLD'].includes(account.type)) {
        balance = totalDebit - totalCredit;
      } else {
        balance = totalCredit - totalDebit;
      }

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

    // Add Net Income to Equity
    totalEquity += netIncome;

    // ==================== Arus Kas (Cash Flow Statement) ====================
    let beginningCash = 0;
    let endingCash = 0;
    let totalCashInflow = 0;
    let totalCashOutflow = 0;
    
    let cashInflowRevenue = 0;
    let cashInflowOther = 0;
    
    let cashOutflowParts = 0;
    let cashOutflowOperating = 0;
    let cashOutflowOther = 0;

    const cashTransactions: any[] = [];

    // 1. Beginning Cash balance
    const startBalanceRes = await prisma.journalItem.aggregate({
      where: {
        account: {
          code: { in: ['101', '102'] }
        },
        journalEntry: {
          date: start ? {
            lt: start
          } : {
            lt: new Date('1970-01-01T00:00:00Z')
          }
        }
      },
      _sum: {
        debit: true,
        credit: true
      }
    });
    beginningCash = toNumber(startBalanceRes._sum.debit) - toNumber(startBalanceRes._sum.credit);

    // 2. Cash Transactions within Period
    const cashEntries = await prisma.journalEntry.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
        items: {
          some: {
            account: {
              code: { in: ['101', '102'] }
            }
          }
        }
      },
      include: {
        items: {
          include: {
            account: true
          }
        }
      },
      orderBy: { date: 'asc' }
    });

    let currentRunningBalance = beginningCash;

    for (const entry of cashEntries) {
      const cashItems = entry.items.filter((item: any) => ['101', '102'].includes(item.account.code));
      const entryDebit = cashItems.reduce((sum: number, item: any) => sum + toNumber(item.debit), 0);
      const entryCredit = cashItems.reduce((sum: number, item: any) => sum + toNumber(item.credit), 0);
      
      const netCash = entryDebit - entryCredit;
      if (netCash === 0) {
        continue;
      }

      const inflow = netCash > 0 ? netCash : 0;
      const outflow = netCash < 0 ? Math.abs(netCash) : 0;

      totalCashInflow += inflow;
      totalCashOutflow += outflow;
      currentRunningBalance += netCash;

      const counterItems = entry.items.filter((item: any) => !['101', '102'].includes(item.account.code));
      
      let classification: 'REVENUE' | 'PARTS' | 'OPERATING' | 'OTHER' = 'OTHER';

      if (counterItems.some((item: any) => item.account.type === 'REVENUE' || item.account.code.startsWith('4'))) {
        classification = 'REVENUE';
        if (inflow > 0) {
          cashInflowRevenue += inflow;
        }
      } else if (counterItems.some((item: any) => ['111', '511'].includes(item.account.code))) {
        classification = 'PARTS';
        if (outflow > 0) {
          cashOutflowParts += outflow;
        }
      } else if (counterItems.some((item: any) => item.account.code.startsWith('5') && item.account.code !== '511')) {
        classification = 'OPERATING';
        if (outflow > 0) {
          cashOutflowOperating += outflow;
        }
      } else {
        classification = 'OTHER';
        if (inflow > 0) {
          cashInflowOther += inflow;
        }
        if (outflow > 0) {
          cashOutflowOther += outflow;
        }
      }

      cashTransactions.push({
        id: entry.id,
        date: entry.date instanceof Date ? entry.date.toISOString() : entry.date,
        description: entry.description,
        reference: entry.reference,
        inflow,
        outflow,
        classification,
        balance: currentRunningBalance
      });
    }

    endingCash = currentRunningBalance;

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
          netIncome,
        },
        cashFlowStatement: {
          beginningCash,
          endingCash,
          inflowRevenue: cashInflowRevenue,
          inflowOther: cashInflowOther,
          totalInflow: totalCashInflow,
          outflowParts: cashOutflowParts,
          outflowOperating: cashOutflowOperating,
          outflowOther: cashOutflowOther,
          totalOutflow: totalCashOutflow,
          netChange: totalCashInflow - totalCashOutflow,
          transactions: cashTransactions,
        }
      },
    };
  } catch (error) {
    console.error('Get financial reports error:', error);
    return { success: false, error: 'Gagal memuat laporan keuangan' };
  }
}

/**
 * Fetches recent General Ledger entries.
 * 
 * @returns {Object} Last 100 journal entries with debit/credit details.
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
      take: 100, // Limit to last 100 entries
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
 * Fetches complete Operational Reports for Owner (Orders, Expenses, Spare parts, Stock logs).
 * 
 * @returns {Object} Data of orders, expenses, spare parts, and stock logs history.
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
        source: creditItem?.account.name || 'Unknown',
        sourceCode: creditItem?.account.code || '',
      };
    }).filter(e => {
      const src = e.source.toLowerCase();
      return src.includes('kas') || src.includes('bank') || ['101', '102'].includes(e.sourceCode);
    });

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
