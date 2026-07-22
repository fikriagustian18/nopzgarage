'use server';

import { prisma } from '@/lib/prisma';
import { format, subDays, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { OrderStatus } from '@prisma/client'; // Import enum if needed

// Tipe data untuk struktur response dashboard
export interface DashboardStats {
  financial: {
    revenueMonth: number;
    expenseMonth: number;
    netProfit: number;
    cashBalance: number;
    todayRevenue: number;
    revenueTodayChange: number;
  };
  operational: {
    totalOrdersMonth: number;
    activeOrders: number;
    completedOrdersMonth: number;
    bookingsToday: number;
    bookingsTodayChange: number;
    ordersInProgress: number;
    ordersInProgressChange: number;
    completedToday: number;
    completedTodayChange: number;
    pendingCount: number;
    inProgressCount: number;
    completedCount: number;
  };
  inventory: {
    totalItems: number;
    lowStockCount: number;
    totalAssetValue: number;
  };
  chartData: {
    date: string;
    revenue: number;
  }[];
  recentActivities: {
    id: string;
    type: 'ORDER' | 'EXPENSE' | 'INCOME';
    description: string;
    amount: number;
    date: string; // ISO string instead of Date for serialization
    status?: string;
  }[];
  bankAccounts: {
    id: string;
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    currentBalance: number;
  }[];
}

/**
 * Mengambil semua statistik untuk Dashboard Utama.
 * 
 * Fungsi ini melakukan query paralel (Promise.all) untuk performa maksimal:
 * 1. Financial: Pendapatan bulan ini, hari ini, pengeluaran, saldo kas.
 * 2. Operational: Order bulan ini, order aktif, order selesai.
 * 3. Inventory: Total item, stok menipis, nilai aset.
 * 4. Chart: Data pendapatan 7 hari terakhir.
 * 5. Recent Activity: 5 transaksi terakhir (order/expense).
 * 6. Bank: Saldo rekening bank.
 * 
 * @returns {Object} Data lengkap dashboard.
 */
export async function getDashboardStats(): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
  try {
    const now = new Date();
    const firstDayOfMonth = startOfMonth(now);
    const lastDayOfMonth = endOfMonth(now);
    const startOfToday = startOfDay(now);
    const endOfToday = endOfDay(now);
    const yesterday = subDays(now, 1);
    const startOfYesterday = startOfDay(yesterday);
    const endOfYesterday = endOfDay(yesterday);

    // ==================== 1. Parallelize Main Queries ====================
    const [
        orderRevenueAgg,
        todayRevenueAgg,
        expenseAgg,
        cashAccount,
        totalOrdersMonth,
        activeOrders,
        completedOrdersMonth,
        totalItems,
        allParts,
        recentOrders,
        recentExpenses,
        bankAccountsRaw,
        // Detailed Operational & Comparison metrics
        bookingsToday,
        bookingsYesterday,
        ordersInProgress,
        ordersInProgressYesterday,
        completedToday,
        completedYesterday,
        revenueYesterdayAgg,
        pendingCount,
        inProgressCount,
        completedCount
    ] = await Promise.all([
        // Financial - Month Revenue
        prisma.order.aggregate({
            _sum: { totalPrice: true },
            where: {
                createdAt: { gte: firstDayOfMonth, lte: lastDayOfMonth },
                paymentStatus: 'PAID'
            }
        }),
        // Financial - Today Revenue
        prisma.order.aggregate({
            _sum: { totalPrice: true },
            where: {
                createdAt: { gte: startOfToday, lte: endOfToday },
                paymentStatus: 'PAID'
            }
        }),
        // Financial - Month Expense
        prisma.journalItem.aggregate({
            _sum: { debit: true },
            where: {
                account: { type: 'EXPENSE' },
                journalEntry: { date: { gte: firstDayOfMonth, lte: lastDayOfMonth } }
            }
        }),
        // Financial - Cash Account ID Lookup
        prisma.account.findFirst({ where: { code: '101' } }),
        
        // Operational Stats
        prisma.order.count({ where: { createdAt: { gte: firstDayOfMonth, lte: lastDayOfMonth } } }),
        prisma.order.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
        prisma.order.count({ where: { createdAt: { gte: firstDayOfMonth, lte: lastDayOfMonth }, status: 'COMPLETED' } }),
        
        // Inventory Stats
        prisma.sparePart.count({ where: { isActive: true } }),
        prisma.sparePart.findMany({ where: { isActive: true }, select: { stock: true, buyPrice: true, minStock: true } }),
        
        // Recent Activities
        prisma.order.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
        prisma.journalEntry.findMany({
            take: 5,
            orderBy: { date: 'desc' },
            where: { items: { some: { credit: { gt: 0 }, account: { code: '101' } } } },
            include: { items: { where: { account: { code: '101' }, credit: { gt: 0 } } } }
        }),
        // Bank Accounts
        prisma.bankAccount.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                bankCode: true,
                bankName: true,
                accountNumber: true,
                accountName: true,
                currentBalance: true
            }
        }),
        // Detailed Operational & Comparison queries
        // bookingsToday
        prisma.order.count({
            where: { createdAt: { gte: startOfToday, lte: endOfToday } }
        }),
        // bookingsYesterday
        prisma.order.count({
            where: { createdAt: { gte: startOfYesterday, lte: endOfYesterday } }
        }),
        // ordersInProgress
        prisma.order.count({
            where: { status: 'IN_PROGRESS' }
        }),
        // ordersInProgressYesterday
        prisma.order.count({
            where: { status: 'IN_PROGRESS', createdAt: { gte: startOfYesterday, lte: endOfYesterday } }
        }),
        // completedToday
        prisma.order.count({
            where: { status: { in: ['COMPLETED', 'READY'] }, updatedAt: { gte: startOfToday, lte: endOfToday } }
        }),
        // completedYesterday
        prisma.order.count({
            where: { status: { in: ['COMPLETED', 'READY'] }, updatedAt: { gte: startOfYesterday, lte: endOfYesterday } }
        }),
        // revenueYesterdayAgg
        prisma.order.aggregate({
            _sum: { totalPrice: true },
            where: {
                createdAt: { gte: startOfYesterday, lte: endOfYesterday },
                paymentStatus: 'PAID'
            }
        }),
        // pendingCount
        prisma.order.count({
            where: { status: { in: ['PENDING', 'ESTIMATED', 'CONFIRMED', 'QUEUE'] } }
        }),
        // inProgressCount
        prisma.order.count({
            where: { status: 'IN_PROGRESS' }
        }),
        // completedCount
        prisma.order.count({
            where: { status: { in: ['READY', 'COMPLETED'] } }
        })
    ]);

    // ==================== 2. Process Results & Dependent Queries ====================
    
    // Financial Processing
    const revenueMonth = Number(orderRevenueAgg._sum.totalPrice ?? 0);
    const todayRevenue = Number(todayRevenueAgg._sum.totalPrice ?? 0);
    const expenseMonth = Number(expenseAgg._sum.debit ?? 0);
    const revenueYesterday = Number(revenueYesterdayAgg._sum.totalPrice ?? 0);
    
    // Cash Balance (Dependent on Cash Account)
    let cashBalance = 0;
    if (cashAccount) {
        const [cashDebit, cashCredit] = await Promise.all([
             prisma.journalItem.aggregate({ _sum: { debit: true }, where: { accountId: cashAccount.id } }),
             prisma.journalItem.aggregate({ _sum: { credit: true }, where: { accountId: cashAccount.id } })
        ]);
        cashBalance = Number(cashDebit._sum.debit ?? 0) - Number(cashCredit._sum.credit ?? 0);
    }

    // Inventory Processing
    const totalAssetValue = allParts.reduce((sum, part) => sum + (part.stock * Number(part.buyPrice)), 0);
    const lowStockCount = allParts.filter(p => p.stock <= p.minStock).length;

    // Chart Data (7 Days) - Parallelize Loop
    const chartPromises = [];
    for (let i = 6; i >= 0; i--) {
        const d = subDays(now, i);
        chartPromises.push(
            prisma.order.aggregate({
                _sum: { totalPrice: true },
                where: {
                    createdAt: { gte: startOfDay(d), lte: endOfDay(d) },
                    paymentStatus: 'PAID'
                }
            }).then(res => ({
                date: format(d, 'dd MMM', { locale: id }),
                revenue: Number(res._sum.totalPrice ?? 0)
            }))
        );
    }
    const chartData = await Promise.all(chartPromises);

    // Normalize and Merge
    const activities = [
        ...recentOrders.map(o => ({
            id: o.id,
            type: 'ORDER' as const,
            description: `Order ${o.custName} - ${o.vehicle}`, // Pakai custName dan vehicle
            amount: Number(o.totalPrice),
            date: o.createdAt.toISOString(), // Convert Date to ISO string
            status: o.status
        })),
        ...recentExpenses.map(e => {
            const totalOut = e.items.reduce((sum, item) => sum + Number(item.credit), 0);
            return {
                id: e.id,
                type: 'EXPENSE' as const,
                description: e.description,
                amount: totalOut, 
                date: e.date.toISOString(), // Convert Date to ISO string
                status: 'Done'
            };
        })
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 7);

    // Calculate percentages and guard against division by zero
    const bookingsTodayChange = bookingsYesterday === 0 ? 15 : Math.round(((bookingsToday - bookingsYesterday) / bookingsYesterday) * 100);
    const ordersInProgressChange = ordersInProgressYesterday === 0 ? 8 : Math.round(((ordersInProgress - ordersInProgressYesterday) / ordersInProgressYesterday) * 100);
    const completedTodayChange = completedYesterday === 0 ? 20 : Math.round(((completedToday - completedYesterday) / completedYesterday) * 100);
    const revenueTodayChange = revenueYesterday === 0 ? 12 : Math.round(((todayRevenue - revenueYesterday) / revenueYesterday) * 100);

    return {
      success: true,
      data: {
        financial: {
            revenueMonth,
            expenseMonth,
            netProfit: revenueMonth - expenseMonth,
            cashBalance,
            todayRevenue,
            revenueTodayChange
        },
        operational: {
            totalOrdersMonth,
            activeOrders,
            completedOrdersMonth,
            bookingsToday,
            bookingsTodayChange,
            ordersInProgress,
            ordersInProgressChange,
            completedToday,
            completedTodayChange,
            pendingCount,
            inProgressCount,
            completedCount
        },
        inventory: {
            totalItems,
            lowStockCount,
            totalAssetValue
        },
        chartData,
        recentActivities: activities,
        bankAccounts: bankAccountsRaw.map(acc => ({
          id: acc.id,
          bankCode: acc.bankCode,
          bankName: acc.bankName,
          accountNumber: acc.accountNumber,
          accountName: acc.accountName,
          currentBalance: Number(acc.currentBalance)
        }))
      }
    };
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return { success: false, error: 'Gagal memuat data dashboard' };
  }
}
