export interface BankAccountUsageByType {
  orderPayments: number;
  payroll: number;
  expenses: number;
  income: number;
}

export interface AccountDeletionRulesInput {
  isActive: boolean;
  currentBalance: number;
  transactionCount: number;
}

export interface AccountDeletionRulesResult {
  canDelete: boolean;
  code?: "ACCOUNT_ACTIVE" | "NON_ZERO_BALANCE" | "ACCOUNT_IN_USE";
  reasons: string[];
}

/**
 * Pure business rule evaluator for safe bank account permanent deletion.
 * Enforces:
 * 1. Account must be inactive (cannot delete active operational account)
 * 2. Balance must be exactly 0 (cannot delete account holding funds)
 * 3. Transaction count must be 0 (cannot delete account with audit trail)
 */
export function evaluateAccountDeletionRules(
  account: AccountDeletionRulesInput
): AccountDeletionRulesResult {
  const reasons: string[] = [];
  let code: "ACCOUNT_ACTIVE" | "NON_ZERO_BALANCE" | "ACCOUNT_IN_USE" | undefined;

  if (account.isActive) {
    code = "ACCOUNT_ACTIVE";
    reasons.push("Rekening masih aktif. Rekening harus dinonaktifkan terlebih dahulu.");
  }
  if (account.currentBalance !== 0) {
    if (!code) code = "NON_ZERO_BALANCE";
    reasons.push(`Saldo rekening saat ini Rp ${account.currentBalance.toLocaleString("id-ID")}. Saldo harus tepat Rp0.`);
  }
  if (account.transactionCount > 0) {
    if (!code) code = "ACCOUNT_IN_USE";
    reasons.push(`Rekening pernah digunakan dalam ${account.transactionCount} transaksi keuangan.`);
  }

  return {
    canDelete: reasons.length === 0,
    code,
    reasons,
  };
}

/**
 * Validates if an account is eligible to be used as a payment/expense source.
 */
export function validateAccountForOperationalUse(account: {
  isActive: boolean;
  currentBalance?: number;
  requiredAmount?: number;
}): { isValid: boolean; error?: string } {
  if (!account.isActive) {
    return {
      isValid: false,
      error: "Rekening tidak ditemukan atau tidak aktif.",
    };
  }

  if (
    account.requiredAmount !== undefined &&
    account.currentBalance !== undefined &&
    account.currentBalance < account.requiredAmount
  ) {
    return {
      isValid: false,
      error: "Saldo rekening tidak mencukupi.",
    };
  }

  return { isValid: true };
}

/**
 * Pure calculation for adjusting bank balance on expense create & delete.
 */
export function calculateBalanceOnExpenseAction(
  currentBalance: number,
  expenseAmount: number,
  action: "create" | "delete"
): number {
  if (action === "create") {
    if (currentBalance < expenseAmount) {
      throw new Error("Saldo tidak mencukupi untuk pengeluaran");
    }
    return currentBalance - expenseAmount;
  }
  return currentBalance + expenseAmount;
}
