import assert from "node:assert/strict";
import test from "node:test";

import { calculateCommission, normalizeCommissionRate } from "../lib/payroll/calculations.ts";
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
