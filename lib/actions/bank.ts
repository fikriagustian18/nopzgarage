"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createLog } from "@/lib/actions/logs";
import {
  evaluateAccountDeletionRules,
  type BankAccountUsageByType,
} from "@/lib/bank/rules";

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
 * Used for operational flows (e.g. payment selection, payroll, transactions).
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

export interface AccountDeletionInfo {
  transactionCount: number;
  usageByType: BankAccountUsageByType;
  canDeletePermanently: boolean;
  reasons: string[];
}

export interface BankAccountAdminItem {
  id: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  currentBalance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  transactionCount: number;
  usageByType: BankAccountUsageByType;
  canDeletePermanently: boolean;
  reasons: string[];
}

export type DeleteBankAccountResult = {
  success: boolean;
  message?: string;
  error?: string;
  code?: "NOT_FOUND" | "ACCOUNT_ACTIVE" | "NON_ZERO_BALANCE" | "ACCOUNT_IN_USE" | "STATE_CHANGED" | "UNAUTHORIZED";
  usageByType?: BankAccountUsageByType;
  transactionCount?: number;
};

interface PaymentUsageAggregate {
  bankAccountId: string | null;
  type: string;
  _count: { _all: number };
}

function summarizePaymentUsage(rows: PaymentUsageAggregate[]): {
  transactionCount: number;
  usageByType: BankAccountUsageByType;
} {
  const usageByType: BankAccountUsageByType = {
    orderPayments: 0,
    payroll: 0,
    expenses: 0,
    income: 0,
  };
  let transactionCount = 0;

  for (const row of rows) {
    const count = row._count._all;
    transactionCount += count;
    if (row.type === "ORDER_PAYMENT") usageByType.orderPayments += count;
    else if (row.type === "PAYROLL") usageByType.payroll += count;
    else if (row.type === "EXPENSE") usageByType.expenses += count;
    else if (row.type === "INCOME") usageByType.income += count;
  }

  return { transactionCount, usageByType };
}

/**
 * Fetches ALL bank accounts (both active and inactive) from the database.
 * Used for administrative settings and bank accounts management.
 * Includes transaction counts, usage by type, and permanent deletion eligibility.
 *
 * @returns List of all bank accounts with admin metadata.
 */
export async function getAllBankAccounts(): Promise<{
  success: boolean;
  data?: BankAccountAdminItem[];
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session || !["OWNER", "ADMIN"].includes(session.user?.role || "")) {
      return { success: false, error: "Access denied: Only Owner and Admin can access bank accounts." };
    }
    const [banks, paymentUsage] = await Promise.all([
      prisma.account.findMany({
        where: { type: "BANK" },
        orderBy: { createdAt: "asc" },
      }),
      prisma.payment.groupBy({
        by: ["bankAccountId", "type"],
        where: { bankAccountId: { not: null } },
        _count: { _all: true },
      }),
    ]);

    const usageRowsByAccount = new Map<string, PaymentUsageAggregate[]>();
    for (const row of paymentUsage) {
      if (!row.bankAccountId) continue;
      const rows = usageRowsByAccount.get(row.bankAccountId) ?? [];
      rows.push(row);
      usageRowsByAccount.set(row.bankAccountId, rows);
    }

    const data: BankAccountAdminItem[] = banks.map((b) => {
      const { transactionCount, usageByType } = summarizePaymentUsage(
        usageRowsByAccount.get(b.id) ?? []
      );
      const balance = Number(b.currentBalance);
      const evalResult = evaluateAccountDeletionRules({
        isActive: b.isActive,
        currentBalance: balance,
        transactionCount,
      });

      return {
        id: b.id,
        bankCode: b.bankCode || "OTHER",
        bankName: b.name.split(" - ")[0] || b.name,
        accountNumber: b.accountNumber || "",
        accountName: b.accountName || b.name,
        currentBalance: balance,
        isActive: b.isActive,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.createdAt.toISOString(),
        transactionCount,
        usageByType,
        canDeletePermanently: evalResult.canDelete,
        reasons: evalResult.reasons,
      };
    });

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Failed to fetch all bank accounts:", error);
    return { success: false, error: "Failed to fetch bank accounts" };
  }
}

/**
 * Detailed deletion eligibility info for a specific bank account.
 */
export async function getAccountDeletionInfo(id: string): Promise<{
  success: boolean;
  data?: AccountDeletionInfo;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session || !["OWNER", "ADMIN"].includes(session.user?.role || "")) {
      return { success: false, error: "Access denied" };
    }

    const [bank, paymentUsage] = await Promise.all([
      prisma.account.findUnique({ where: { id } }),
      prisma.payment.groupBy({
        by: ["bankAccountId", "type"],
        where: { bankAccountId: id },
        _count: { _all: true },
      }),
    ]);

    if (!bank || bank.type !== "BANK") {
      return { success: false, error: "Rekening bank tidak ditemukan" };
    }

    const { transactionCount, usageByType } = summarizePaymentUsage(paymentUsage);
    const balance = Number(bank.currentBalance);
    const evalResult = evaluateAccountDeletionRules({
      isActive: bank.isActive,
      currentBalance: balance,
      transactionCount,
    });

    return {
      success: true,
      data: {
        transactionCount,
        usageByType,
        canDeletePermanently: evalResult.canDelete,
        reasons: evalResult.reasons,
      },
    };
  } catch (error) {
    console.error("Failed to get account deletion info:", error);
    return { success: false, error: "Gagal memuat informasi rekening" };
  }
}


export async function createBankAccount(data: BankAccountData) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Akses ditolak: Hanya Owner yang dapat menambah rekening bank.' };
    }

    const bankCode = data.bankCode?.trim();
    const bankName = data.bankName?.trim();
    const accountNumber = data.accountNumber?.trim();
    const accountName = data.accountName?.trim();
    const initialBalance = Number(data.currentBalance ?? 0);
    if (!bankCode || !bankName || !accountNumber || !accountName) {
      return { success: false, error: "Data rekening bank belum lengkap." };
    }
    if (!Number.isFinite(initialBalance) || initialBalance < 0) {
      return { success: false, error: "Saldo awal rekening tidak valid." };
    }

    let codeSuffix = accountNumber.replace(/\D/g, '').slice(-3);
    if (codeSuffix.length < 3) {
      codeSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    }
    let accountCode = `102-${codeSuffix}`;
    const existingAccount = await prisma.account.findUnique({ where: { code: accountCode } });
    if (existingAccount) {
      accountCode = `102-${Date.now().toString().slice(-4)}`;
    }

    const newBank = await prisma.account.create({
      data: {
        code: accountCode,
        name: `${bankName} - ${accountNumber}`,
        type: 'BANK',
        category: 'CURRENT_ASSET',
        bankCode,
        accountNumber,
        accountName,
        currentBalance: initialBalance,
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
        bankName,
        accountNumber,
        accountName,
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
    const session = await auth();
    if (!session || session.user?.role !== "OWNER") {
      return { success: false, error: "Akses ditolak: Hanya Owner yang dapat mengubah rekening bank." };
    }

    const existing = await prisma.account.findUnique({ where: { id } });
    if (!existing || existing.type !== "BANK") {
      return { success: false, error: "Rekening bank tidak ditemukan" };
    }

    if (
      data.currentBalance !== undefined &&
      (!Number.isFinite(data.currentBalance) || data.currentBalance < 0)
    ) {
      return { success: false, error: "Saldo rekening tidak valid." };
    }

    const nextBankName = data.bankName?.trim() || existing.name.split(" - ")[0] || existing.name;
    const nextAccountNumber = data.accountNumber?.trim() || existing.accountNumber || "";
    const bank = await prisma.account.update({
      where: { id },
      data: {
        ...(data.bankCode && { bankCode: data.bankCode }),
        ...((data.bankName || data.accountNumber) && { name: `${nextBankName} - ${nextAccountNumber}` }),
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

export async function deactivateBankAccount(id: string) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Akses ditolak: Hanya Owner yang dapat menonaktifkan rekening bank.' };
    }
    const existing = await prisma.account.findUnique({ where: { id } });
    if (!existing || existing.type !== 'BANK') {
      return { success: false, error: 'Rekening bank tidak ditemukan' };
    }
    await prisma.account.update({
      where: { id },
      data: { isActive: false }
    });
    revalidatePath("/admin");
    revalidatePath("/admin/settings");
    revalidatePath("/admin/reports");

    await createLog({
      action: "DEACTIVATE_BANK_ACCOUNT",
      title: `Bank Account Deactivated: ${existing.name}`,
      details: `Rekening ${existing.name} (${existing.accountNumber || ''}) dinonaktifkan oleh Owner`,
      metadata: { accountId: id, bankCode: existing.bankCode, accountNumber: existing.accountNumber },
      userId: session.user.id,
      userName: session.user.employeeName || session.user.email || undefined,
      role: session.user.role,
    });

    return { success: true, message: "Rekening berhasil dinonaktifkan" };
  } catch (error) {
    console.error("Failed to deactivate bank account:", error);
    return { success: false, error: "Gagal menonaktifkan rekening" };
  }
}

/**
 * Permanently deletes a bank account.
 * Enforces safe deletion rules: must be inactive, zero balance, and zero transactions.
 * Only OWNER can perform permanent deletion.
 */
export async function deleteBankAccount(id: string): Promise<DeleteBankAccountResult> {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "OWNER") {
      return {
        success: false,
        code: "UNAUTHORIZED",
        error: "Akses ditolak: Hanya Owner yang dapat menghapus rekening bank secara permanen.",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const [bank, paymentUsage] = await Promise.all([
        tx.account.findUnique({ where: { id } }),
        tx.payment.groupBy({
          by: ["bankAccountId", "type"],
          where: { bankAccountId: id },
          _count: { _all: true },
        }),
      ]);

      if (!bank || bank.type !== "BANK") {
        return { success: false, code: "NOT_FOUND" as const, error: "Rekening bank tidak ditemukan." };
      }

      const { transactionCount, usageByType } = summarizePaymentUsage(paymentUsage);
      const balance = Number(bank.currentBalance);
      const evalResult = evaluateAccountDeletionRules({
        isActive: bank.isActive,
        currentBalance: balance,
        transactionCount,
      });

      if (!evalResult.canDelete) {
        return {
          success: false,
          code: evalResult.code,
          error: evalResult.reasons.join(" "),
          transactionCount,
          usageByType,
        };
      }

      const deletion = await tx.account.deleteMany({
        where: {
          id,
          type: "BANK",
          isActive: false,
          currentBalance: 0,
        },
      });
      if (deletion.count !== 1) {
        return {
          success: false,
          code: "STATE_CHANGED" as const,
          error: "Status atau saldo rekening berubah saat diproses. Muat ulang data lalu coba lagi.",
          transactionCount,
          usageByType,
        };
      }

      return {
        success: true,
        message: "Rekening bank berhasil dihapus permanen.",
        bank,
      };
    });

    if (!result.success) {
      return result;
    }

    if (result.bank) {
      await createLog({
        action: "DELETE_BANK_ACCOUNT",
        title: `Bank Account Permanently Deleted: ${result.bank.name}`,
        details: `Rekening ${result.bank.name} (${result.bank.accountNumber || ""}) berhasil dihapus permanen oleh Owner. Saldo: Rp0, Transaksi: 0.`,
        metadata: {
          accountId: id,
          bankCode: result.bank.bankCode,
          accountNumber: result.bank.accountNumber,
          accountName: result.bank.accountName,
        },
        userId: session.user?.id,
        userName: session.user?.employeeName || session.user?.email || undefined,
        role: session.user?.role,
      });
    }

    revalidatePath("/admin");
    revalidatePath("/admin/settings");
    revalidatePath("/admin/reports");

    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    console.error("Failed to delete bank account:", error);
    return { success: false, error: "Gagal menghapus rekening bank." };
  }
}

export async function toggleBankAccount(id: string, isActive: boolean) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Akses ditolak: Hanya Owner yang dapat merubah status aktif rekening bank.' };
    }
    const existing = await prisma.account.findUnique({ where: { id } });
    if (!existing || existing.type !== 'BANK') {
      return { success: false, error: 'Rekening bank tidak ditemukan' };
    }
    await prisma.account.update({
      where: { id },
      data: { isActive }
    });
    revalidatePath("/admin");
    revalidatePath("/admin/settings");
    revalidatePath("/admin/reports");

    await createLog({
      action: isActive ? "ACTIVATE_BANK_ACCOUNT" : "DEACTIVATE_BANK_ACCOUNT",
      title: `Bank Account ${isActive ? 'Activated' : 'Deactivated'}: ${existing.name}`,
      details: `Status rekening ${existing.name} diubah menjadi ${isActive ? 'Aktif' : 'Nonaktif'}`,
      metadata: { accountId: id, isActive },
      userId: session.user.id,
      userName: session.user.employeeName || session.user.email || undefined,
      role: session.user.role,
    });

    return {
      success: true,
      message: `Rekening berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`
    };
  } catch (error) {
    console.error("Failed to toggle bank account status:", error);
    return { success: false, error: "Gagal update status" };
  }
}
