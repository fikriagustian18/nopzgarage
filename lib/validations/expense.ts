import { z } from "zod";

export const expenseSchema = z.object({
  category: z.string().trim().min(1, "Kategori pengeluaran wajib dipilih."),
  description: z.string().trim().min(1, "Deskripsi pengeluaran wajib diisi."),
  amount: z.coerce
    .number({ invalid_type_error: "Nominal pengeluaran wajib berupa angka." })
    .finite("Nominal pengeluaran wajib berupa angka yang valid.")
    .positive("Nominal pengeluaran harus lebih besar dari 0."),
  reference: z.string().trim().min(1, "Nomor referensi / bukti transaksi wajib diisi."),
  accountId: z.string().trim().optional(),
  date: z.date().optional(),
});

export type ExpenseInput = z.input<typeof expenseSchema>;
export type ValidExpenseInput = z.output<typeof expenseSchema>;
