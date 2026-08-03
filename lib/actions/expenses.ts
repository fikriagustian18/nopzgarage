"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createLog } from "./logs";

export interface CreateExpenseInput {
  description: string;
  amount: number;
  category: string;
  accountId?: string;
  date?: Date;
  reference?: string;
}

export interface ExpenseCategory {
  id: string;
  code: string;
  name: string;
}

export interface ExpenseItem {
  id: string;
  date: string;
  description: string;
  reference: string | null;
  amount: number;
  category: string;
  categoryCode: string;
  source: string;
}

export interface ExpenseActionResult {
  success: boolean;
  expenses?: ExpenseItem[];
  accounts?: ExpenseCategory[];
  error?: string;
}

// Static Expense Categories List
const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: "OPERATIONAL", code: "EXP", name: "Beban Operasional" },
  { id: "EQUIPMENT", code: "EXP", name: "Peralatan & Perlengkapan" },
  { id: "RENT", code: "EXP", name: "Sewa Tempat" },
  { id: "UTILITIES", code: "EXP", name: "Listrik, Air & Internet" },
  { id: "SALARY", code: "EXP", name: "Gaji & Bonus" },
  { id: "MAINTENANCE", code: "EXP", name: "Pemeliharaan & Perbaikan" },
  { id: "OTHER", code: "EXP", name: "Pengeluaran Lainnya" },
];

/**
 * Fetch expense categories for manual entry.
 *
 * @returns Object containing categories list or error message.
 */
export async function getExpenseCategories(): Promise<ExpenseActionResult> {
  const session = await auth();
  if (!session || session.user?.role !== "OWNER") {
    return {
      success: false,
      error: "Akses ditolak: Hanya Owner yang dapat mengambil kategori pengeluaran.",
    };
  }

  return { success: true, accounts: EXPENSE_CATEGORIES };
}

/**
 * Record a new manual expense transaction.
 *
 * @param data - The expense details to create.
 * @returns Success indicator or error message.
 */
export async function createExpense(
  data: CreateExpenseInput
): Promise<ExpenseActionResult> {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "OWNER") {
      return {
        success: false,
        error: "Akses ditolak: Hanya Owner yang dapat mencatat pengeluaran.",
      };
    }

    const { description, amount, category, accountId, date, reference } = data;

    if (!description || !amount || amount <= 0) {
      return {
        success: false,
        error: "Deskripsi dan nominal valid harus diisi.",
      };
    }

    const categoryName = category || "Pengeluaran Umum";

    // Provision main cash account (Credit)
    let cashAccount = await prisma.account.findFirst({
      where: { code: "101" },
    });

    if (!cashAccount) {
      cashAccount = await prisma.account.create({
        data: {
          code: "101",
          name: "Kas Utama",
          type: "ASSET",
          category: "Current Asset",
        },
      });
    }

    // Provision target expense account (Debit)
    let targetAccount = null;
    if (accountId) {
      targetAccount = await prisma.account.findUnique({
        where: { id: accountId },
      });
    }

    if (!targetAccount) {
      targetAccount = await prisma.account.findFirst({
        where: { name: { equals: categoryName, mode: "insensitive" } },
      });
    }

    if (!targetAccount) {
      const uniqueSuffix = Date.now().toString(36).slice(-4).toUpperCase();
      targetAccount = await prisma.account.create({
        data: {
          code: `EXP-${uniqueSuffix}`,
          name: categoryName,
          type: "EXPENSE",
          category: "Expense",
        },
      });
    }

    // Create journal entry transaction
    await prisma.$transaction(
      async (transaction) => {
        const journal = await transaction.journalEntry.create({
          data: {
            date: date ?? new Date(),
            description: description,
            reference: reference ?? null,
            items: {
              create: [
                { accountId: targetAccount!.id, debit: amount, credit: 0 },
                { accountId: cashAccount!.id, debit: 0, credit: amount },
              ],
            },
          },
        });

        await createLog({
          action: "CREATE_EXPENSE",
          title: "Pengeluaran Dicatat",
          details: `Pengeluaran Rp ${amount.toLocaleString("id-ID")} - ${categoryName} (${description})`,
          metadata: { journalId: journal.id },
          userName: "Admin",
          role: "ADMIN",
        });

        return journal;
      },
      {
        maxWait: 5000,
        timeout: 15000,
      }
    );

    revalidatePath("/admin/expenses");
    revalidatePath("/admin/reports");

    return { success: true };
  } catch (error) {
    console.error("Create expense error:", error);
    return { success: false, error: "Gagal mencatat pengeluaran" };
  }
}

/**
 * Fetch list of recent expense records.
 *
 * @returns Array of formatted expense items or error message.
 */
export async function getExpenses(): Promise<ExpenseActionResult> {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "OWNER") {
      return {
        success: false,
        error: "Akses ditolak: Hanya Owner yang dapat mengambil daftar pengeluaran.",
      };
    }

    const journals = await prisma.journalEntry.findMany({
      where: {
        items: {
          some: {
            debit: { gt: 0 },
            account: { type: "EXPENSE" },
          },
        },
      },
      orderBy: { date: "desc" },
      take: 100,
      include: {
        items: {
          include: { account: true },
        },
      },
    });

    const expenses: ExpenseItem[] = journals.map((journal) => {
      const debitItem = journal.items.find((item) => Number(item.debit) > 0);
      const creditItem = journal.items.find((item) => Number(item.credit) > 0);
      const amount = debitItem ? Number(debitItem.debit) : 0;

      return {
        id: journal.id,
        date: journal.date.toISOString(),
        description: journal.description,
        reference: journal.reference,
        amount,
        category: debitItem?.account.name ?? "Pengeluaran Umum",
        categoryCode: debitItem?.account.code ?? "EXP",
        source: creditItem?.account.name ?? "Kas",
      };
    });

    return { success: true, expenses };
  } catch (error) {
    console.error("Get expenses list error:", error);
    return { success: false, error: "Gagal load data pengeluaran" };
  }
}

/**
 * Delete an expense record by journal entry ID.
 *
 * @param journalId - Journal entry identifier to delete.
 * @returns Success indicator or error message.
 */
export async function deleteExpense(
  journalId: string
): Promise<ExpenseActionResult> {
  try {
    if (!journalId) {
      return { success: false, error: "ID transaksi tidak valid." };
    }

    const session = await auth();
    if (!session || session.user?.role !== "OWNER") {
      return {
        success: false,
        error: "Akses ditolak: Hanya Owner yang dapat menghapus pengeluaran.",
      };
    }

    const journal = await prisma.journalEntry.findUnique({
      where: { id: journalId },
      include: { items: { include: { account: true } } },
    });

    if (!journal) {
      return { success: false, error: "Data pengeluaran tidak ditemukan." };
    }

    const debitItem = journal.items.find((item) => Number(item.debit) > 0);
    const amount = debitItem ? Number(debitItem.debit) : 0;

    await prisma.journalEntry.delete({
      where: { id: journalId },
    });

    await createLog({
      action: "DELETE_EXPENSE",
      title: "Pengeluaran Dihapus",
      details: `Hapus pengeluaran Rp ${amount.toLocaleString("id-ID")} - ${debitItem?.account.name ?? "Unknown"} (${journal.description})`,
      metadata: { journalId },
      userName: "Admin",
      role: "ADMIN",
    });

    revalidatePath("/admin/expenses");
    revalidatePath("/admin/reports");
    return { success: true };
  } catch (error) {
    console.error("Delete expense error:", error);
    return { success: false, error: "Gagal hapus data" };
  }
}
