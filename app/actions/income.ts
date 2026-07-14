'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createLog } from './logs';

export type CreateIncomeInput = {
  description: string;
  amount: number;
  accountId: string; // Kategori Pemasukan
  date?: Date;
  reference?: string; 
};

// ==================== Get Categories for Income Dropdown ====================
/**
 * Mengambil daftar akun Akuntansi yang valid untuk kategori Pemasukan.
 * Termasuk: Pendapatan Lain, Tambahan Modal (Equity), Pinjaman (Liability).
 * 
 * @returns {Object} List akun kategori pemasukan.
 */
export async function getIncomeCategories() {
  try {
    // Ambil akun yang relevan untuk pemasukan Kas:
    // 1. REVENUE (4xx) - Pendapatan Lain-lain (selain servis/part utama jika dipisah)
    // 2. EQUITY (3xx) - Tambah Modal
    // 3. LIABILITY (2xx) - Terima Pinjaman
    // 4. ASSET (1xx) - Jual Aset Tetap/Bekas
    const accounts = await prisma.account.findMany({
      where: {
        OR: [
          { type: 'REVENUE' },
          { type: 'EQUITY' },
          { type: 'LIABILITY' },
          { name: { contains: 'Peralatan', mode: 'insensitive' } }, // Jual alat bekas
        ]
      },
      orderBy: { code: 'asc' }
    });
    
    // Filter out KAS (kita tidak mungkin kredit kas untuk pemasukan kas, kecuali koreksi)
    const validAccounts = accounts.filter(a => !a.name.toLowerCase().includes('kas'));

    return { success: true, accounts: validAccounts };
  } catch (error) {
    console.error('Get income categories error:', error);
    return { success: false, error: 'Gagal load kategori pemasukan' };
  }
}

// ==================== Create Income (Journal Entry) ====================
// ==================== Create Income (Journal Entry) ====================
/**
 * Mencatat Pemasukan Uang (Cash In).
 * 
 * Otomatis membuat Jurnal Umum:
 * - Debit: KAS (Code 101).
 * - Kredit: Akun Sumber Pemasukan (Revenue/Equity/Liability).
 * 
 * @param {CreateIncomeInput} data - Data transaksi pemasukan.
 * @returns {Object} Status sukses.
 */
export async function createIncome(data: CreateIncomeInput) {
  try {
    const { description, amount, accountId, date, reference } = data;

    // 1. Cari akun Kas (Debit)
    const cashAccount = await prisma.account.findFirst({
      where: { code: '101' } 
    });

    if (!cashAccount) {
      return { success: false, error: 'Akun Kas (101) tidak ditemukan.' };
    }

    // 2. Cari akun Target (Credit)
    const targetAccount = await prisma.account.findUnique({
      where: { id: accountId }
    });

    if (!targetAccount) {
        return { success: false, error: 'Kategori pemasukan tidak valid.' };
    }

    // 3. Create Journal
    const journalResult = await prisma.$transaction(async (tx) => {
        // Create Journal Entry
        // DEBIT: KAS (Terima Uang)
        // KREDIT: PENDAPATAN/MODAL
        const journal = await tx.journalEntry.create({
            data: {
                date: date || new Date(),
                description: description,
                reference: reference, 
                items: {
                    create: [
                        { accountId: cashAccount.id, debit: amount, credit: 0 },    // DEBIT KAS
                        { accountId: targetAccount.id, debit: 0, credit: amount }   // KREDIT SUMBER
                    ]
                }
            }
        });

        // Log Activity
        await createLog({
            action: "CREATE_INCOME",
            title: "Pemasukan Dicatat",
            details: `Pemasukan Rp ${amount.toLocaleString('id-ID')} dari ${targetAccount.name} (${description})`,
            metadata: { journalId: journal.id },
            userName: "Admin",
            role: "ADMIN"
        });
        
        return journal;
    }, {
      maxWait: 5000,
      timeout: 15000,
    });

    revalidatePath('/admin/income');
    revalidatePath('/admin/accounting');

    return { success: true };
  } catch (error) {
    console.error('Create income error:', error);
    return { success: false, error: 'Gagal mencatat pemasukan' };
  }
}

// ==================== Get Income List ====================
// ==================== Get Income List ====================
/**
 * Mengambil daftar riwayat pemasukan.
 * Default hanya menampilkan pemasukan non-order.
 * 
 * @returns {Object} List transaksi pemasukan.
 */
export async function getIncomeList() {
    try {
        // Ambil Jurnal yang men-DEBIT KAS (101)
        // Tapi exclude pembayaran order (biasanya deskripsi "Pembayaran Order #...")
        // User minta page khusus "Pemasukan Lain-lain". Jika mau semua, filter ini bisa dilonggarkan.
        // Asumsikan: Page ini untuk Non-Order Income.
        
        const journals = await prisma.journalEntry.findMany({
            orderBy: { date: 'desc' },
            take: 50,
            include: {
                items: {
                    include: { account: true }
                }
            }
        });

        const incomes = journals.map(j => {
            const debitItem = j.items.find(i => i.debit.toNumber() > 0);
            const creditItem = j.items.find(i => i.credit.toNumber() > 0); // Source (Pendapatan)
            
            return {
                id: j.id,
                date: j.date.toISOString(), // Convert Date to ISO string for serialization
                description: j.description,
                reference: j.reference,
                amount: creditItem?.credit.toNumber() || 0,
                category: creditItem?.account.name || 'Unknown',
                categoryCode: creditItem?.account.code || '',
                target: debitItem?.account.name || 'Unknown' // Harusnya Kas
            };
        });
        
        // Filter: Hanya tampilkan jika Target = Kas (Uang masuk)
        // Dan exclude Order/Servis jika diinginkan, tapi order biasanya otomatis
        const cashInTransactions = incomes.filter(e => 
            e.target.toLowerCase().includes('kas') && 
            !e.description.toLowerCase().includes('pembayaran order') // Optional, biar tidak campur aduk sama transaksi harian servis
        );

        return { success: true, expenses: cashInTransactions }; // key 'expenses' biar reusable di ui component kalau mau, tapi better 'incomes'
    } catch (error) {
        console.error('Get income list error:', error);
        return { success: false, error: 'Gagal load data pemasukan' };
    }
}

// ==================== Delete Income ====================
// ==================== Delete Income ====================
/**
 * Menghapus transaksi pemasukan (menghapus Jurnal ID).
 * 
 * @param {string} journalId - ID Jurnal.
 * @returns {Object} Status sukses.
 */
export async function deleteIncome(journalId: string) {
    try {
        await prisma.journalEntry.delete({
            where: { id: journalId }
        });
        
        revalidatePath('/admin/income');
        return { success: true };
    } catch (error) {
         return { success: false, error: 'Gagal hapus data' };
    }
}
