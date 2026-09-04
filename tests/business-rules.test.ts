import assert from "node:assert/strict";
import test from "node:test";

import { calculateCommission, normalizeCommissionRate } from "../lib/payroll/calculations.ts";
import {
  calculatePeriodFinancialActivity,
  isCogsPayment,
} from "../lib/finance/reportCalculations.ts";
import { formatOrderNo } from "../lib/utils.ts";
import { expenseSchema } from "../lib/validations/expense.ts";

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
  assert.equal(
    expenseSchema.safeParse({
      category: "Beban Operasional",
      description: "Listrik",
      amount: "250000",
      reference: "INV-001",
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
