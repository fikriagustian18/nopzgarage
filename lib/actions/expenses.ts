"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

    const { description, amount, category, date, reference } = data;

    if (!description || !amount || amount <= 0) {
      return {
        success: false,
        error: "Deskripsi dan nominal valid harus diisi.",
      };
    }

    const categoryName = category || "Pengeluaran Umum";

    const payment = await prisma.payment.create({
      data: {
        type: "EXPENSE",
        amount: amount,
        note: `[${categoryName}] ${description}`,
        createdAt: date ?? new Date(),
        paymentMethod: "CASH",
        journalItems: [
          { category: categoryName, reference: reference ?? null, amount }
        ]
      },
    });

    await createLog({
      action: "CREATE_EXPENSE",
      title: "Pengeluaran Dicatat",
      details: `Pengeluaran Rp ${amount.toLocaleString("id-ID")} - ${categoryName} (${description})`,
      metadata: { paymentId: payment.id },
      userName: "Admin",
      role: "ADMIN",
    });

    revalidatePath("/admin/expenses");
    revalidatePath("/admin/reports");

    return { success: true };
  } catch (error) {
    console.error("Create expense error:", error);
    return { success: false, error: "Gagal mencatat pengeluaran" };
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
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const expenses: ExpenseItem[] = payments.map((p) => {
      let category = "Pengeluaran Umum";
      let description = p.note || "";
      if (p.note && p.note.startsWith("[")) {
        const parts = p.note.split("] ");
        category = parts[0].replace("[", "");
        description = parts.slice(1).join("] ");
      }

      return {
        id: p.id,
        date: p.createdAt.toISOString(),
        description,
        reference: p.orderId || null,
        amount: Number(p.amount),
        category,
        categoryCode: "EXP",
        source: p.paymentMethod || "Kas",
      };
    });

    return { success: true, expenses };
  } catch (error) {
    console.error("Get expenses list error:", error);
    return { success: false, error: "Gagal load data pengeluaran" };
  }
}

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

    const payment = await prisma.payment.findUnique({
      where: { id: journalId },
    });

    if (!payment) {
      return { success: false, error: "Data pengeluaran tidak ditemukan." };
    }

    const amount = Number(payment.amount);

    await prisma.payment.delete({
      where: { id: journalId },
    });

    await createLog({
      action: "DELETE_EXPENSE",
      title: "Pengeluaran Dihapus",
      details: `Hapus pengeluaran Rp ${amount.toLocaleString("id-ID")} (${payment.note})`,
      metadata: { paymentId: journalId },
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
