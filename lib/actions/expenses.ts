"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expenseSchema } from "@/lib/validations/expense";
import { createLog } from "./logs";

export interface CreateExpenseInput {
  description: string;
  amount: number;
  category: string;
  accountId: string;
  date?: Date;
  reference: string;
}

export interface ExpenseCategory {
  id: string;
  code: string;
  name: string;
}

export interface ExpenseFundSource {
  id: string;
  code: string;
  name: string;
  type: string;
  balance: number;
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
  sources?: ExpenseFundSource[];
  error?: string;
}

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
 * Fetches configured expense categories.
 * 
 * @returns Expense categories list.
 */
export async function getExpenseCategories(): Promise<ExpenseActionResult> {
  const session = await auth();
  if (!session || session.user?.role !== "OWNER") {
    return {
      success: false,
      error: "Access denied: Only Owner can access expense categories.",
    };
  }

  return { success: true, accounts: EXPENSE_CATEGORIES };
}

/**
 * Fetches active fund sources (Kas Utama + active bank accounts) for expense recording.
 */
export async function getExpenseFundSources(): Promise<{
  success: boolean;
  sources?: ExpenseFundSource[];
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "OWNER") {
      return {
        success: false,
        error: "Akses ditolak: Hanya Owner yang dapat melihat sumber dana pengeluaran.",
      };
    }

    const accounts = await prisma.account.findMany({
      where: {
        OR: [
          { code: "101" },
          { type: "BANK", isActive: true },
        ],
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        bankCode: true,
        accountNumber: true,
        currentBalance: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const sources: ExpenseFundSource[] = accounts.map((acc) => ({
      id: acc.id,
      code: acc.code,
      name: acc.code === "101"
        ? "Kas Utama (Tunai)"
        : `${acc.bankCode || "BANK"} - ${acc.accountNumber || ""} (${acc.name.split(" - ")[0] || acc.name})`,
      type: acc.type,
      balance: Number(acc.currentBalance),
    }));

    return { success: true, sources };
  } catch (error) {
    console.error("Get expense fund sources error:", error);
    return { success: false, error: "Gagal memuat sumber dana pengeluaran" };
  }
}

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

    const validation = expenseSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || "Data pengeluaran tidak valid.",
      };
    }

    const {
      description: cleanDesc,
      amount: numericAmount,
      category: categoryName,
      accountId,
      date,
      reference: cleanRef,
    } = validation.data;
    const noteText = `[${categoryName}] [Ref: ${cleanRef}] ${cleanDesc}`;

    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.account.findFirst({
        where: {
          id: accountId,
          isActive: true,
          OR: [{ code: "101" }, { type: "BANK" }],
        },
      });

      if (!account) {
        throw new Error("Sumber dana tidak ditemukan, tidak aktif, atau tidak dapat digunakan untuk pengeluaran.");
      }

      const balance = Number(account.currentBalance);
      const balanceUpdate = await tx.account.updateMany({
        where: {
          id: account.id,
          isActive: true,
          currentBalance: { gte: numericAmount },
          OR: [{ code: "101" }, { type: "BANK" }],
        },
        data: { currentBalance: { decrement: numericAmount } },
      });
      if (balanceUpdate.count !== 1) {
        throw new Error(`Saldo sumber dana tidak mencukupi atau rekening sudah tidak aktif (Saldo terakhir: Rp ${balance.toLocaleString("id-ID")}).`);
      }

      const payment = await tx.payment.create({
        data: {
          type: "EXPENSE",
          amount: numericAmount,
          note: noteText,
          date: date ?? new Date(),
          paymentMethod: account.type === "BANK" ? "TRANSFER" : "CASH",
          bankAccountId: account.id,
        },
      });

      return { payment, account };
    });

    await createLog({
      action: "CREATE_EXPENSE",
      title: "Pengeluaran Dicatat",
      details: `Pengeluaran Rp ${numericAmount.toLocaleString("id-ID")} - ${categoryName} [${cleanRef}] (${cleanDesc}) via ${result.account.name}`,
      metadata: { paymentId: result.payment.id, reference: cleanRef, accountId: result.account.id },
      userId: session.user?.id,
      userName: session.user?.employeeName || session.user?.email || "Admin",
      role: session.user?.role || "OWNER",
    });

    revalidatePath("/admin/expenses");
    revalidatePath("/admin/reports");
    revalidatePath("/admin");

    return { success: true };
  } catch (error: unknown) {
    console.error("Create expense error:", error);
    const message = error instanceof Error ? error.message : "Gagal mencatat pengeluaran";
    return { success: false, error: message };
  }
}

export async function getExpenses(): Promise<ExpenseActionResult> {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "OWNER") {
      return {
        success: false,
        error: "Akses ditolak: Hanya Owner yang dapat mengambil daftar pengeluaran.",
      };
    }

    const payments = await prisma.payment.findMany({
      where: {
        type: "EXPENSE",
      },
      select: {
        id: true,
        date: true,
        amount: true,
        note: true,
        orderId: true,
        paymentMethod: true,
        bankAccount: {
          select: {
            id: true,
            name: true,
            code: true,
            bankCode: true,
            accountNumber: true,
          },
        },
      },
      orderBy: { date: "desc" },
      take: 100,
    });

    const expenses: ExpenseItem[] = payments.map((p) => {
      let category = "Pengeluaran Umum";
      let description = p.note || "";
      let reference: string | null = p.orderId || null;

      if (p.note && p.note.startsWith("[")) {
        const parts = p.note.split("] ");
        category = parts[0].replace("[", "");
        const remaining = parts.slice(1).join("] ");
        if (remaining.startsWith("[Ref: ")) {
          const refParts = remaining.split("] ");
          reference = refParts[0].replace("[Ref: ", "");
          description = refParts.slice(1).join("] ");
        } else {
          description = remaining;
        }
      }

      let source = "Tidak diketahui/Kas lama";
      if (p.bankAccount) {
        source = p.bankAccount.code === "101"
          ? "Kas Utama"
          : `${p.bankAccount.bankCode || "BANK"} - ${p.bankAccount.accountNumber || p.bankAccount.name}`;
      } else if (p.paymentMethod === "CASH") {
        source = "Kas lama";
      }

      return {
        id: p.id,
        date: p.date.toISOString(),
        description,
        reference,
        amount: Number(p.amount),
        category,
        categoryCode: "EXP",
        source,
      };
    });

    return { success: true, expenses };
  } catch (error) {
    console.error("Get expenses list error:", error);
    return { success: false, error: "Gagal load data pengeluaran" };
  }
}

export async function deleteExpense(
  id: string
): Promise<ExpenseActionResult> {
  try {
    if (!id) {
      return { success: false, error: "ID transaksi tidak valid." };
    }

    const session = await auth();
    if (!session || session.user?.role !== "OWNER") {
      return {
        success: false,
        error: "Akses ditolak: Hanya Owner yang dapat menghapus pengeluaran.",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id },
      });

      if (!payment) {
        throw new Error("Data pengeluaran tidak ditemukan.");
      }

      if (payment.type !== "EXPENSE") {
        throw new Error("Transaksi bukan merupakan transaksi pengeluaran.");
      }

      const amount = Number(payment.amount);

      if (payment.bankAccountId) {
        await tx.account.update({
          where: { id: payment.bankAccountId },
          data: { currentBalance: { increment: amount } },
        });
      }

      await tx.payment.delete({
        where: { id },
      });

      return { payment, amount };
    });

    await createLog({
      action: "DELETE_EXPENSE",
      title: "Pengeluaran Dihapus",
      details: `Hapus pengeluaran Rp ${result.amount.toLocaleString("id-ID")} (${result.payment.note || ""})`,
      metadata: { paymentId: id, bankAccountId: result.payment.bankAccountId },
      userId: session.user?.id,
      userName: session.user?.employeeName || session.user?.email || "Admin",
      role: session.user?.role || "OWNER",
    });

    revalidatePath("/admin/expenses");
    revalidatePath("/admin/reports");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: unknown) {
    console.error("Delete expense error:", error);
    const message = error instanceof Error ? error.message : "Gagal hapus data";
    return { success: false, error: message };
  }
}
