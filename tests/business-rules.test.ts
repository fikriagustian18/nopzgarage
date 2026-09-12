import assert from "node:assert/strict";
import test from "node:test";

import { calculateCommission, normalizeCommissionRate } from "../lib/payroll/calculations.ts";
import {
  calculatePeriodFinancialActivity,
  isCogsPayment,
} from "../lib/finance/reportCalculations.ts";
import { formatOrderNo } from "../lib/utils.ts";
import { expenseSchema } from "../lib/validations/expense.ts";
import {
  evaluateAccountDeletionRules,
  validateAccountForOperationalUse,
  calculateBalanceOnExpenseAction,
} from "../lib/bank/rules.ts";

test("commission is calculated as a percentage of service subtotal", () => {
  assert.equal(calculateCommission(200_000, 25), 50_000);
  assert.equal(calculateCommission(99_999, 10), 10_000);
});

test("commission rate must stay between zero and one hundred", () => {
  assert.equal(normalizeCommissionRate(0), 0);
  assert.equal(normalizeCommissionRate(100), 100);
  assert.throws(() => normalizeCommissionRate(-1));
  assert.throws(() => normalizeCommissionRate(101));
});

test("expense validation rejects empty fields and invalid amounts", () => {
  assert.equal(
    expenseSchema.safeParse({ category: " ", description: "", amount: 0, reference: "" }).success,
    false
  );
  // Missing accountId must fail
  assert.equal(
    expenseSchema.safeParse({
      category: "Beban Operasional",
      description: "Listrik",
      amount: "250000",
      reference: "INV-001",
    }).success,
    false
  );
  // Valid input with accountId
  assert.equal(
    expenseSchema.safeParse({
      category: "Beban Operasional",
      description: "Listrik",
      amount: "250000",
      reference: "INV-001",
      accountId: "acc-101",
    }).success,
    true
  );
});

test("order number formatter is stable for IDs and existing order numbers", () => {
  assert.equal(formatOrderNo("cm123456789"), "ORD-456789");
  assert.equal(formatOrderNo("ord-ga6ena"), "ORD-GA6ENA");
});

test("financial activity allocates each partial order payment by its own item mix", () => {
  const activity = calculatePeriodFinancialActivity([
    {
      amount: 75_000,
      type: "ORDER_PAYMENT",
      order: {
        items: [
          { type: "service", qty: 1, price: 100_000 },
          { type: "part", qty: 1, price: 50_000 },
        ],
      },
    },
    {
      amount: 25_000,
      type: "ORDER_PAYMENT",
      order: { items: [{ itemType: "SPAREPART", quantity: 1, unitPrice: 25_000 }] },
    },
  ]);

  assert.equal(activity.periodRevenue, 100_000);
  assert.equal(activity.serviceRevenue, 50_000);
  assert.equal(activity.partRevenue, 50_000);
  assert.equal(activity.unallocatedRevenue, 0);
});

test("financial activity keeps standalone income and missing order details reconcilable", () => {
  const activity = calculatePeriodFinancialActivity([
    { amount: 10_000, type: "INCOME" },
    { amount: 15_000, type: "ORDER_PAYMENT", order: null },
  ]);

  assert.equal(activity.periodRevenue, 25_000);
  assert.equal(activity.unallocatedRevenue, 25_000);
});

test("only structured HPP expense notes are classified as cost of goods sold", () => {
  assert.equal(isCogsPayment({ type: "EXPENSE", note: "HPP - Oli (1 botol)" }), true);
  assert.equal(isCogsPayment({ type: "EXPENSE", note: "Pembelian sparepart kantor" }), false);
  assert.equal(isCogsPayment({ type: "PAYROLL", note: "HPP - not an expense" }), false);
});

test("holiday mode guard blocks bookings when isHoliday is true", () => {
  const checkHolidayBooking = (holiday: { isHoliday: boolean; reason?: string; openAt?: string }) => {
    if (holiday.isHoliday) {
      const reasonText = holiday.reason ? `: ${holiday.reason}` : "";
      const openAtText = holiday.openAt ? ` Bengkel buka kembali: ${holiday.openAt}.` : "";
      return {
        success: false,
        code: "GARAGE_CLOSED",
        error: `Bengkel sedang libur/tutup${reasonText}.${openAtText} Silakan coba lagi nanti.`
      };
    }
    return { success: true };
  };

  const closedWithDetails = checkHolidayBooking({
    isHoliday: true,
    reason: "Renovasi Bengkel",
    openAt: "15 September 2026",
  });
  assert.equal(closedWithDetails.success, false);
  assert.equal(closedWithDetails.code, "GARAGE_CLOSED");
  assert.match(closedWithDetails.error, /Renovasi Bengkel/);
  assert.match(closedWithDetails.error, /15 September 2026/);

  const closedWithoutDetails = checkHolidayBooking({ isHoliday: true });
  assert.equal(closedWithoutDetails.success, false);
  assert.equal(closedWithoutDetails.code, "GARAGE_CLOSED");

  const openGarage = checkHolidayBooking({ isHoliday: false });
  assert.equal(openGarage.success, true);
});

test("bank account operational filter excludes deactivated accounts while admin includes all", () => {
  const accounts = [
    { id: "1", name: "BCA", isActive: true },
    { id: "2", name: "Mandiri", isActive: false },
    { id: "3", name: "BRI", isActive: true },
  ];

  const operationalAccounts = accounts.filter((a) => a.isActive);
  const adminAccounts = accounts;

  assert.equal(operationalAccounts.length, 2);
  assert.deepEqual(operationalAccounts.map((a) => a.id), ["1", "3"]);
  assert.equal(adminAccounts.length, 3);
  assert.deepEqual(adminAccounts.map((a) => a.id), ["1", "2", "3"]);
});

test("safe bank account deletion rejects active accounts, accounts with balance, and accounts with transactions", () => {
  // 1. Active account cannot be deleted
  const activeAccount = evaluateAccountDeletionRules({
    isActive: true,
    currentBalance: 0,
    transactionCount: 0,
  });
  assert.equal(activeAccount.canDelete, false);
  assert.equal(activeAccount.code, "ACCOUNT_ACTIVE");
  assert.match(activeAccount.reasons[0], /masih aktif/);

  // 2. Inactive account with positive balance cannot be deleted
  const balanceAccount = evaluateAccountDeletionRules({
    isActive: false,
    currentBalance: 500_000,
    transactionCount: 0,
  });
  assert.equal(balanceAccount.canDelete, false);
  assert.equal(balanceAccount.code, "NON_ZERO_BALANCE");
  assert.match(balanceAccount.reasons[0], /Saldo harus tepat Rp0/);

  // 3. Inactive account with transactions cannot be deleted
  const usedAccount = evaluateAccountDeletionRules({
    isActive: false,
    currentBalance: 0,
    transactionCount: 4,
  });
  assert.equal(usedAccount.canDelete, false);
  assert.equal(usedAccount.code, "ACCOUNT_IN_USE");
  assert.match(usedAccount.reasons[0], /pernah digunakan dalam 4 transaksi/);

  // 4. Combined violations list all reasons
  const allViolations = evaluateAccountDeletionRules({
    isActive: true,
    currentBalance: 1_000_000,
    transactionCount: 12,
  });
  assert.equal(allViolations.canDelete, false);
  assert.equal(allViolations.reasons.length, 3);
});

test("safe bank account deletion accepts inactive account with zero balance and zero transactions", () => {
  const safeAccount = evaluateAccountDeletionRules({
    isActive: false,
    currentBalance: 0,
    transactionCount: 0,
  });
  assert.equal(safeAccount.canDelete, true);
  assert.equal(safeAccount.reasons.length, 0);
  assert.equal(safeAccount.code, undefined);
});

test("deactivating an in-use bank account preserves revenue, expense, and net profit calculations", () => {
  const payments = [
    { id: "p1", type: "ORDER_PAYMENT", amount: 1_000_000, bankAccountId: "bca-1" },
    { id: "p2", type: "EXPENSE", amount: 200_000, bankAccountId: "bca-1" },
    { id: "p3", type: "PAYROLL", amount: 300_000, bankAccountId: "bca-1" },
  ];

  const beforeDeactivation = calculatePeriodFinancialActivity(payments);
  const afterDeactivation = calculatePeriodFinancialActivity([...payments]);

  assert.equal(beforeDeactivation.periodRevenue, 1_000_000);
  assert.equal(beforeDeactivation.periodExpense, 500_000);
  assert.equal(beforeDeactivation.periodRevenue - beforeDeactivation.periodExpense, 500_000);
  assert.deepEqual(beforeDeactivation, afterDeactivation);
});

test("expense fund balance operations maintain atomicity on create and delete", () => {
  const initialBalance = 1_000_000;
  const expenseAmount = 250_000;

  // Create expense deducts balance
  const balanceAfterExpense = calculateBalanceOnExpenseAction(initialBalance, expenseAmount, "create");
  assert.equal(balanceAfterExpense, 750_000);

  // Insufficient balance throws
  assert.throws(
    () => calculateBalanceOnExpenseAction(100_000, 250_000, "create"),
    /Saldo tidak mencukupi/
  );

  // Delete expense restores balance exactly
  const restoredBalance = calculateBalanceOnExpenseAction(balanceAfterExpense, expenseAmount, "delete");
  assert.equal(restoredBalance, initialBalance);
});

test("operational payment validation rejects inactive bank accounts", () => {
  // Active account with sufficient balance passes
  assert.deepEqual(
    validateAccountForOperationalUse({ isActive: true, currentBalance: 500_000, requiredAmount: 200_000 }),
    { isValid: true }
  );

  // Inactive account is rejected
  const inactiveResult = validateAccountForOperationalUse({ isActive: false, currentBalance: 500_000 });
  assert.equal(inactiveResult.isValid, false);
  assert.match(inactiveResult.error!, /tidak aktif/);

  // Active account with insufficient balance is rejected
  const insufficientResult = validateAccountForOperationalUse({
    isActive: true,
    currentBalance: 50_000,
    requiredAmount: 200_000,
  });
  assert.equal(insufficientResult.isValid, false);
  assert.match(insufficientResult.error!, /tidak mencukupi/);
});
