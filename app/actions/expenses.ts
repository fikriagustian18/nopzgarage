'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { createLog } from './logs';

export type CreateExpenseInput = {
  description: string;
  amount: number;
  accountId: string; // Akun beban/aset yang dipilih user
  date?: Date;
  reference?: string; // No Resi/Nota
};

// ==================== Get Accounts for Expense Dropdown ====================
/**
 * Mengambil daftar akun Akuntansi yang valid untuk dipilih sebagai kategori pengeluaran.
 * Filter mencakup: Beban (Expense), Aset (Perlengkapan/Peralatan), Prive, dan Utang.
 * Mengecualikan akun Kas agar tidak double.
 * 
 * @returns {Object} Daftar akun kategori pengeluaran.
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
 * Mencatat Pengeluaran Baru.
 * 
 * Fungsi ini otomatis membuat Jurnal Umum:
 * - Debit: Akun biaya/aset yang dipilih user.
 * - Kredit: Akun KAS (Kode 101).
 * 
 * @param {CreateExpenseInput} data - Data pengeluaran.
 * @returns {Object} Status sukses.
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
    revalidatePath('/admin/accounting'); // Update jurnal page juga

    return { success: true };
  } catch (error) {
    console.error('Create expense error:', error);
    return { success: false, error: 'Gagal mencatat pengeluaran' };
  }
}

// ==================== Get Expenses List ====================
/**
 * Mengambil daftar riwayat pengeluaran.
 * Mengambil data dari Jurnal Umum yang mengkredit akun Kas.
 * Max 50 transaksi terakhir.
 * 
 * @returns {Object} Daftar transaksi pengeluaran.
 */
export async function getExpenses() {
    try {
      const session = await auth();
      if (!session || session.user?.role !== 'OWNER') {
        return { success: false, error: 'Akses ditolak: Hanya Owner yang dapat mengambil daftar pengeluaran.' };
      }
        // Ambil Jurnal yang meng-Kredit KAS (101) tapi BUKAN dari source Payment Gaji/Order otomatis
        // Cara paling aman: Ambil semua JournalEntry, include items.
        // Filter dimana ada kredit ke Kas, dan debit ke akun Expense/Asset.
        // Untuk simplifikasi: Kita ambil JournalEntry yang description-nya TIDAK mengandung "Order" atau "Gaji".
        // Atau: Ambil semua, biar user filter di UI.
        
        // Better approach: Get JournalEntries sorted by date desc
        const journals = await prisma.journalEntry.findMany({
            orderBy: { date: 'desc' },
            take: 50, // Limit 50 terakhir
            include: {
                items: {
                    include: { account: true }
                }
            }
        });

        // Transform ke format tabel Expense UI
        // Kita cari item yang DEBIT (itu adalah kategori pengeluaran)
        // Dan item yang CREDIT (sumber dana, biasanya kas)
        const expenses = journals.map(j => {
            const debitItem = j.items.find(i => i.debit.toNumber() > 0);
            const creditItem = j.items.find(i => i.credit.toNumber() > 0);
            
            return {
                id: j.id,
                date: j.date.toISOString(), // Convert Date to ISO string for serialization
                description: j.description,
                reference: j.reference,
                amount: debitItem?.debit.toNumber() || 0,
                category: debitItem?.account.name || 'Unknown',
                categoryCode: debitItem?.account.code || '',
                source: creditItem?.account.name || 'Unknown'
            };
        });
        
        // Filter: Hanya tampilkan jika Sumber = Kas (artinya pengeluaran uang)
        // Dan abaikan jika itu pelunasan Gaji (kecuali user mau lihat gaji di sini juga? User minta "page pengeluaran").
        // User bilang "belanja alat, sewa tempat...". Gaji juga pengeluaran. Jadi tampilkan semua cash-out.
        const cashOutTransactions = expenses.filter(e => e.source.toLowerCase().includes('kas'));

        return { success: true, expenses: cashOutTransactions };
    } catch (error) {
        console.error('Get expenses list error:', error);
        return { success: false, error: 'Gagal load data pengeluaran' };
    }
}

// ==================== Delete Expense (Reverse Journal) ====================
/**
 * Menghapus data pengeluaran.
 * Dalam sistem ini dilakukan dengan menghapus entry jurnal terkait.
 * 
 * @param {string} journalId - ID Jurnal yang akan dihapus.
 * @returns {Object} Pesan sukses.
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
