"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
 * Fetches all active bank accounts from the database.
 * 
 * @returns List of active bank accounts.
 */
export async function getBankAccounts() {
  try {
    const session = await auth();
    if (!session || !["OWNER", "ADMIN"].includes(session.user?.role || "")) {
      return { success: false, error: "Access denied: Only Owner and Admin can access bank accounts." };
    }
    const banks = await prisma.account.findMany({
      where: { 
        isActive: true,
        type: "BANK",
      },
      orderBy: { createdAt: "asc" },
    });
    return { 
      success: true, 
      data: banks.map((b) => ({
        id: b.id,
        bankCode: b.bankCode || "OTHER",
        bankName: b.name.split(" - ")[0] || b.name,
        accountNumber: b.accountNumber || "",
        accountName: b.accountName || b.name,
        currentBalance: Number(b.currentBalance),
        isActive: b.isActive,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.createdAt.toISOString(),
      }))
    };
  } catch (error) {
    console.error("Failed to fetch bank accounts:", error);
    return { success: false, error: "Failed to fetch bank accounts" };
  }
}


export async function createBankAccount(data: BankAccountData) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Akses ditolak: Hanya Owner yang dapat menambah rekening bank.' };
    }

    let codeSuffix = data.accountNumber.replace(/\D/g, '').slice(-3);
    if (codeSuffix.length < 3) {
      codeSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    }
    let accountCode = `102-${codeSuffix}`;
    let existingAccount = await prisma.account.findUnique({ where: { code: accountCode } });
    if (existingAccount) {
      accountCode = `102-${Date.now().toString().slice(-4)}`;
    }

    const newBank = await prisma.account.create({
      data: {
        code: accountCode,
        name: `${data.bankName} - ${data.accountNumber}`,
        type: 'BANK',
        category: 'CURRENT_ASSET',
        bankCode: data.bankCode,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        currentBalance: data.currentBalance || 0,
        isActive: true,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/settings");

    return { 
      success: true, 
      message: "Rekening berhasil ditambahkan",
      data: { 
        id: newBank.id,
        bankCode: newBank.bankCode || 'OTHER',
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        currentBalance: Number(newBank.currentBalance),
        createdAt: newBank.createdAt.toISOString(),
        updatedAt: newBank.createdAt.toISOString(),
      }
    };

  } catch (error) {
    console.error("Failed to create bank account:", error);
    return { success: false, error: "Gagal menambahkan rekening" };
  }
}

export async function updateBankAccount(id: string, data: Partial<BankAccountData>) {
  try {
    const bank = await prisma.account.update({
      where: { id },
      data: {
        ...(data.bankCode && { bankCode: data.bankCode }),
        ...(data.bankName && { name: `${data.bankName} - ${data.accountNumber || ''}` }),
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
        id: bank.id,
        bankCode: bank.bankCode || 'OTHER',
        bankName: bank.name.split(' - ')[0] || bank.name,
        accountNumber: bank.accountNumber || '',
        accountName: bank.accountName || bank.name,
        currentBalance: Number(bank.currentBalance),
        createdAt: bank.createdAt.toISOString(),
        updatedAt: bank.createdAt.toISOString(),
      }
    };
  } catch (error) {
    console.error("Failed to update bank account:", error);
    return { success: false, error: "Gagal mengupdate rekening" };
  }
}

export async function updateBankBalance(id: string, amount: number, operation: 'add' | 'subtract') {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Akses ditolak: Hanya Owner yang dapat merubah saldo bank.' };
    }
    const current = await prisma.account.findUnique({ where: { id } });
    if (!current) {
      return { success: false, error: 'Akun bank tidak ditemukan' };
    }
    
    const currentBalance = Number(current.currentBalance);
    const newBalance = operation === 'add' 
      ? currentBalance + amount 
      : currentBalance - amount;
    
    const bank = await prisma.account.update({
      where: { id },
      data: { currentBalance: newBalance }
    });
    
    revalidatePath('/admin');
    
    return { 
      success: true, 
      data: { 
        id: bank.id,
        bankCode: bank.bankCode || 'OTHER',
        bankName: bank.name,
        accountNumber: bank.accountNumber || '',
        accountName: bank.accountName || bank.name,
        currentBalance: Number(bank.currentBalance),
        createdAt: bank.createdAt.toISOString(),
        updatedAt: bank.createdAt.toISOString(),
      }
    };
  } catch (error) {
    console.error('Update Bank Balance Error:', error);
    return { success: false, error: 'Gagal mengupdate saldo bank' };
  }
}

export async function deleteBankAccount(id: string) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Akses ditolak: Hanya Owner yang dapat menghapus rekening bank.' };
    }
    await prisma.account.update({
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

export async function toggleBankAccount(id: string, isActive: boolean) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Akses ditolak: Hanya Owner yang dapat merubah status aktif rekening bank.' };
    }
    await prisma.account.update({
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
