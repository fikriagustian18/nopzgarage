'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { createLog } from './logs';

export interface CreateExpenseInput {
  description: string;
  amount: number;
  accountId: string; // Akun beban/aset yang dipilih user
  date?: Date;
  reference?: string; // No Resi/Nota
}

// ==================== Get Accounts for Expense Dropdown ====================
/**
 * Fetch list of valid accounting accounts for expense category selection.
 * Filters include: Expense, Asset (Equipment/Supplies), Prive, and Liability.
 * Excludes Cash account to avoid duplicate entries.
 * 
 * @returns {Object} List of expense category accounts.
 */
export async function getExpenseCategories() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Akses ditolak: Hanya Owner yang dapat mengambil kategori pengeluaran.' };
    }
    // Ambil akun yang relevan untuk pengeluaran:
    // 1. BEBAN (EXPENSE) - Kode 5xx, 6xx
    // 2. ASET (ASSET) - Kode 1xx (Misal beli peralatan)
    // 3. EQUITY - Kode 3xx (Untuk Prive Owner)
    // 4. LIABILITY - Kode 2xx (Bayar Utang Usaha non-gaji)
    const accounts = await prisma.account.findMany({
      where: {
        OR: [
          { type: 'EXPENSE' },
          { name: { contains: 'Peralatan', mode: 'insensitive' } }, // Asset Equipment
          { name: { contains: 'Perlengkapan', mode: 'insensitive' } }, // Asset Supplies
          { name: { contains: 'Prive', mode: 'insensitive' } },     // Equity Prive
          { type: 'LIABILITY' } // Utang
        ]
      },
      orderBy: { code: 'asc' }
    });
    
    // Filter out akun yang tidak boleh didebit manual sembarangan (misal Kas, Akum Penyusutan)
    // Tapi simplified: Biarkan user pilih, as long as it makes sense.
    // Kita exclude KAS (101) dari target debit pengeluaran (karena Kas akan di-Kredit)
    const validAccounts = accounts.filter(a => !a.name.toLowerCase().includes('kas'));

    return { success: true, accounts: validAccounts };
  } catch (error) {
    console.error('Get expense categories error:', error);
    return { success: false, error: 'Gagal load kategori pengeluaran' };
  }
}

// ==================== Create Expense (Journal Entry) ====================
/**
 * Record a new expense.
 * 
 * Automatically creates an Accounting Journal Entry:
 * - Debit: Selected Expense/Asset account.
 * - Credit: CASH Account (Code 101).
 * 
 * @param {CreateExpenseInput} data - Expense entry data.
 * @returns {Object} Success status.
 */
export async function createExpense(data: CreateExpenseInput) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Akses ditolak: Hanya Owner yang dapat mencatat pengeluaran.' };
    }
    const { description, amount, accountId, date, reference } = data;

    // 1. Cari akun Kas (Credit)
    const cashAccount = await prisma.account.findFirst({
      where: { code: '101' } // Asumsi Kode 101 adalah KAS UTAMA
    });

    if (!cashAccount) {
      return { success: false, error: 'Akun Kas (101) tidak ditemukan di sistem.' };
    }

    // 2. Cari akun Target (Debit)
    const targetAccount = await prisma.account.findUnique({
      where: { id: accountId }
    });

    if (!targetAccount) {
        return { success: false, error: 'Kategori pengeluaran tidak valid.' };
    }

    // 3. Create Journal
    const journalResult = await prisma.$transaction(async (tx) => {
        // Create Journal Entry
        const journal = await tx.journalEntry.create({
            data: {
                date: date || new Date(),
                description: description,
                reference: reference, // Optional: No Nota
                items: {
                    create: [
                        { accountId: targetAccount.id, debit: amount, credit: 0 }, // DEBIT BEBAN/ASET
                        { accountId: cashAccount.id, debit: 0, credit: amount }    // KREDIT KAS
                    ]
                }
            }
        });

        // Log Activity
        await createLog({
            action: "CREATE_EXPENSE",
            title: "Pengeluaran Dicatat",
            details: `Pengeluaran Rp ${amount.toLocaleString('id-ID')} untuk ${targetAccount.name} (${description})`,
            metadata: { journalId: journal.id },
            userName: "Admin",
            role: "ADMIN"
        }); // Cannot use imported inside tx usually if log uses separate connection, but it's safe here as parallel/independent.
        
        return journal;
    }, {
      maxWait: 5000,
      timeout: 15000,
    });

    revalidatePath('/admin/expenses');
    revalidatePath('/admin/reports');

    return { success: true };
  } catch (error) {
    console.error('Create expense error:', error);
    return { success: false, error: 'Gagal mencatat pengeluaran' };
  }
}

// ==================== Get Expenses List ====================
/**
 * Fetch expense history list.
 * Retrieves journal entry transactions that credit the Cash account.
 * Limited to last 50 transactions.
 * 
 * @returns {Object} Expense transaction list.
 */
export async function getExpenses() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Akses ditolak: Hanya Owner yang dapat mengambil daftar pengeluaran.' };
    }
    const journals = await prisma.journalEntry.findMany({
      orderBy: { date: 'desc' },
      take: 50,
      include: {
        items: {
          include: { account: true }
        }
      }
    });

    const expenses = journals.map(j => {
      const debitItem = j.items.find(i => i.debit.toNumber() > 0);
      const creditItem = j.items.find(i => i.credit.toNumber() > 0);
      
      return {
        id: j.id,
        date: j.date.toISOString(),
        description: j.description,
        reference: j.reference,
        amount: debitItem?.debit.toNumber() || 0,
        category: debitItem?.account.name || 'Unknown',
        categoryCode: debitItem?.account.code || '',
        source: creditItem?.account.name || 'Unknown'
      };
    });
    
    const cashOutTransactions = expenses.filter(e => e.source.toLowerCase().includes('kas'));

    return { success: true, expenses: cashOutTransactions };
  } catch (error) {
    console.error('Get expenses list error:', error);
    return { success: false, error: 'Gagal load data pengeluaran' };
  }
}

// ==================== Delete Expense (Reverse Journal) ====================
/**
 * Delete expense record by deleting associated journal entry.
 * 
 * @param {string} journalId - Journal Entry ID to delete.
 * @returns {Object} Success status.
 */
export async function deleteExpense(journalId: string) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Akses ditolak: Hanya Owner yang dapat menghapus pengeluaran.' };
    }
    await prisma.journalEntry.delete({
      where: { id: journalId }
    });
    
    revalidatePath('/admin/expenses');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Gagal hapus data' };
  }
}
