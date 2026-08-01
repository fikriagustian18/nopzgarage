"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// === BANK ACTIONS ===

export interface BankAccountData {
  id?: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  currentBalance?: number;
  isActive?: boolean;
}

/**
 * Mengambil semua data rekening bank yang aktif.
 * Mengubah tipe Decimal ke Number untuk kompatibilitas Client Component.
 * 
 * @returns {Object} Daftar rekening bank.
 */
export async function getBankAccounts() {
  try {
    const session = await auth();
    if (!session || !['OWNER', 'ADMIN'].includes(session.user?.role || '')) {
      return { success: false, error: 'Akses ditolak: Hanya Owner dan Admin yang dapat mengambil rekening bank.' };
    }
    const banks = await prisma.bankAccount.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });
    return { 
      success: true, 
      data: banks.map(b => ({
        ...b,
        currentBalance: Number(b.currentBalance),
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      }))
    };
  } catch (error) {
    console.error("Failed to fetch bank accounts:", error);
    return { success: false, error: "Gagal mengambil data bank" };
  }
}

/**
 * Menambahkan rekening bank baru.
 * 
 * Fungsi ini melakukan beberapa hal dalam satu transaksi database:
 * 1. Membuat data BankAccount (record sistem).
 * 2. Membuat akun COA (Chart of Accounts) terkait di Akuntansi (Kode 102-XXX).
 * 3. Jika ada saldo awal, otomatis membuat Jurnal Akuntansi (Opening Balance).
 * 
 * @param {BankAccountData} data - Data rekening bank baru.
 * @returns {Object} Data rekening yang berhasil dibuat.
 */
export async function createBankAccount(data: BankAccountData) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Akses ditolak: Hanya Owner yang dapat menambah rekening bank.' };
    }
    return await prisma.$transaction(async (tx) => {
      // 1. Create Bank Account (System Record)
      const bank = await tx.bankAccount.create({
        data: {
          bankCode: data.bankCode,
          bankName: data.bankName,
          accountNumber: data.accountNumber,
          accountName: data.accountName,
          currentBalance: data.currentBalance || 0,
          isActive: true,
        },
      });

      // 2. Create COA Account (Accounting Record)
      // Generate Code: 102 (Bank Prefix) + Last 3 digits of Account Number
      let codeSuffix = data.accountNumber.replace(/\D/g, '').slice(-3); // Get last 3 digits
      if (codeSuffix.length < 3) {
        codeSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      }
      
      let accountCode = `102-${codeSuffix}`;
      
      // Ensure uniqueness
      let existingAccount = await tx.account.findUnique({ where: { code: accountCode } });
      let attempts = 0;
      while (existingAccount && attempts < 5) {
        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        accountCode = `102-${randomSuffix}`;
        existingAccount = await tx.account.findUnique({ where: { code: accountCode } });
        attempts++;
      }

      // If still exists (very unlikely), just use timestamp suffix
      if (existingAccount) {
        accountCode = `102-${Date.now().toString().slice(-4)}`;
      }

      const newAccount = await tx.account.create({
        data: {
          code: accountCode,
          name: `${data.bankName} - ${data.accountNumber}`,
          type: 'ASSET',
          category: 'CURRENT_ASSET',
          isActive: true,
        },
      });

      // 3. Create Opening Balance Journal (if balance > 0)
      const initialBalance = Number(data.currentBalance || 0);
      if (initialBalance > 0) {
        // Find Equity Account (Modal) for the credit side
        // Try to find '301' (Modal Pemilik) first, then any Equity
        const equityAccount = await tx.account.findFirst({
          where: {
            OR: [
              { code: '301' },
              { type: 'EQUITY' }
            ]
          },
          orderBy: { code: 'asc' }
        });

        if (equityAccount) {
          await tx.journalEntry.create({
            data: {
              date: new Date(),
              description: `Saldo Awal Bank ${data.bankName} (${data.accountNumber})`,
              items: {
                create: [
                  {
                    accountId: newAccount.id,
                    debit: initialBalance,
                    credit: 0
                  },
                  {
                    accountId: equityAccount.id,
                    debit: 0,
                    credit: initialBalance
                  }
                ]
              }
            }
          });
        }
      }

      revalidatePath("/admin");
      revalidatePath("/admin/settings");
      revalidatePath("/admin/finance");
      revalidatePath("/admin/reports");

      return { 
        success: true, 
        message: "Rekening berhasil ditambahkan & disinkronkan ke Akuntansi",
        data: { 
          ...bank, 
          currentBalance: Number(bank.currentBalance),
          createdAt: bank.createdAt.toISOString(),
          updatedAt: bank.updatedAt.toISOString(),
        }
      };
    });

  } catch (error) {
    console.error("Failed to create bank account:", error);
    return { success: false, error: "Gagal menambahkan rekening" };
  }
}

/**
 * Memperbarui informasi rekening bank.
 * 
 * @param {string} id - ID rekening yang akan diupdate.
 * @param {Partial<BankAccountData>} data - Data perubahan.
 * @returns {Object} Data rekening setelah update.
 */
export async function updateBankAccount(id: string, data: Partial<BankAccountData>) {
  try {
    const bank = await prisma.bankAccount.update({
      where: { id },
      data: {
        ...(data.bankCode && { bankCode: data.bankCode }),
        ...(data.bankName && { bankName: data.bankName }),
        ...(data.accountNumber && { accountNumber: data.accountNumber }),
        ...(data.accountName && { accountName: data.accountName }),
        ...(data.currentBalance !== undefined && { currentBalance: data.currentBalance }),
      },
    });
    revalidatePath("/admin");
    revalidatePath("/admin/settings");
    return { 
      success: true, 
      message: "Rekening berhasil diupdate",
      data: { 
        ...bank, 
        currentBalance: Number(bank.currentBalance),
        createdAt: bank.createdAt.toISOString(),
        updatedAt: bank.updatedAt.toISOString(),
      }
    };
  } catch (error) {
    console.error("Failed to update bank account:", error);
    return { success: false, error: "Gagal mengupdate rekening" };
  }
}

/**
 * Mengupdate saldo bank secara manual (tambah/kurang).
 * Biasanya dipanggil saat ada transaksi masuk/keluar yang melibatkan bank ini.
 * 
 * @param {string} id - ID rekening.
 * @param {number} amount - Jumlah nominal.
 * @param {'add' | 'subtract'} operation - Jenis operasi (tambah/kurang).
 * @returns {Object} Data rekening dengan saldo terbaru.
 */
export async function updateBankBalance(id: string, amount: number, operation: 'add' | 'subtract') {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Akses ditolak: Hanya Owner yang dapat merubah saldo bank.' };
    }
    const current = await prisma.bankAccount.findUnique({ where: { id } });
    if (!current) {
      return { success: false, error: 'Akun bank tidak ditemukan' };
    }
    
    const currentBalance = Number(current.currentBalance);
    const newBalance = operation === 'add' 
      ? currentBalance + amount 
      : currentBalance - amount;
    
    const bank = await prisma.bankAccount.update({
      where: { id },
      data: { currentBalance: newBalance }
    });
    
    revalidatePath('/admin');
    
    return { 
      success: true, 
      data: { 
        ...bank, 
        currentBalance: Number(bank.currentBalance),
        createdAt: bank.createdAt.toISOString(),
        updatedAt: bank.updatedAt.toISOString(),
      }
    };
  } catch (error) {
    console.error('Update Bank Balance Error:', error);
    return { success: false, error: 'Gagal mengupdate saldo bank' };
  }
}

/**
 * Menghapus rekening bank (Soft Delete).
 * Hanya mengubah status isActive menjadi false, tidak menghapus dari DB.
 * 
 * @param {string} id - ID rekening.
 * @returns {Object} Pesan sukses.
 */
export async function deleteBankAccount(id: string) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Akses ditolak: Hanya Owner yang dapat menghapus rekening bank.' };
    }
    // Soft delete
    await prisma.bankAccount.update({
      where: { id },
      data: { isActive: false }
    });
    revalidatePath("/admin");
    revalidatePath("/admin/settings");
    return { success: true, message: "Rekening berhasil dihapus" };
  } catch (error) {
    return { success: false, error: "Gagal menghapus rekening" };
  }
}

/**
 * Mengaktifkan atau menonaktifkan rekening bank.
 * 
 * @param {string} id - ID rekening.
 * @param {boolean} isActive - Status aktif baru.
 * @returns {Object} Status sukses.
 */
export async function toggleBankAccount(id: string, isActive: boolean) {
    try {
      const session = await auth();
      if (!session || session.user?.role !== 'OWNER') {
        return { success: false, error: 'Akses ditolak: Hanya Owner yang dapat merubah status aktif rekening bank.' };
      }
        await prisma.bankAccount.update({
            where: { id },
            data: { isActive }
        });
        revalidatePath("/admin");
        revalidatePath("/admin/settings");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Gagal update status" };
    }
}
