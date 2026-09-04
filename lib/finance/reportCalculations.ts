export interface FinancialReportOrderItem {
  type?: unknown;
  itemType?: unknown;
  qty?: unknown;
  quantity?: unknown;
  price?: unknown;
  unitPrice?: unknown;
  totalPrice?: unknown;
}

export interface FinancialReportPayment {
  amount: unknown;
  type: string;
  note?: string | null;
  order?: { items?: unknown } | null;
}

export interface PeriodFinancialActivity {
  periodRevenue: number;
  periodExpense: number;
  serviceRevenue: number;
  partRevenue: number;
  unallocatedRevenue: number;
  salaryExpense: number;
  cogsExpense: number;
  operationalExpense: number;
}

function finiteNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function itemType(item: FinancialReportOrderItem): string {
  const rawType = String(item.type ?? item.itemType ?? "").toLowerCase();
  return rawType === "sparepart" ? "part" : rawType;
}

function itemTotal(item: FinancialReportOrderItem): number {
  if (item.totalPrice !== undefined && item.totalPrice !== null) {
    const explicitTotal = finiteNumber(item.totalPrice, Number.NaN);
    if (Number.isFinite(explicitTotal)) {
      return Math.max(0, explicitTotal);
    }
  }

  const quantity = Math.max(0, finiteNumber(item.qty ?? item.quantity, 1));
  const unitPrice = Math.max(0, finiteNumber(item.price ?? item.unitPrice));
  return quantity * unitPrice;
}

function revenueWeights(items: unknown): { service: number; part: number } {
  if (!Array.isArray(items)) {
    return { service: 0, part: 0 };
  }

  return items.reduce(
    (totals, candidate) => {
      if (!candidate || typeof candidate !== "object") {
        return totals;
      }

      const item = candidate as FinancialReportOrderItem;
      const total = itemTotal(item);
      if (itemType(item) === "service") {
        totals.service += total;
      } else if (itemType(item) === "part") {
        totals.part += total;
      }
      return totals;
    },
    { service: 0, part: 0 }
  );
}

export function isCogsPayment(payment: Pick<FinancialReportPayment, "type" | "note">): boolean {
  return payment.type === "EXPENSE" && /^\s*HPP(?:\s|-|:)/i.test(payment.note ?? "");
}

/**
 * Calculates cash-basis report activity from the payments that occurred in a
 * period. Each order payment is allocated using that order's own item mix, so
 * instalments and payments for orders created in earlier periods stay correct.
 */
export function calculatePeriodFinancialActivity(
  payments: FinancialReportPayment[]
): PeriodFinancialActivity {
  const activity: PeriodFinancialActivity = {
    periodRevenue: 0,
    periodExpense: 0,
    serviceRevenue: 0,
    partRevenue: 0,
    unallocatedRevenue: 0,
    salaryExpense: 0,
    cogsExpense: 0,
    operationalExpense: 0,
  };

  for (const payment of payments) {
    const amount = finiteNumber(payment.amount);
    if (amount <= 0) {
      continue;
    }

    if (payment.type === "ORDER_PAYMENT") {
      activity.periodRevenue += amount;
      const weights = revenueWeights(payment.order?.items);
      const knownRevenue = weights.service + weights.part;

      if (knownRevenue <= 0) {
        activity.unallocatedRevenue += amount;
        continue;
      }

      const serviceShare = amount * (weights.service / knownRevenue);
      activity.serviceRevenue += serviceShare;
      activity.partRevenue += amount - serviceShare;
    } else if (payment.type === "INCOME") {
      activity.periodRevenue += amount;
      activity.unallocatedRevenue += amount;
    } else if (payment.type === "PAYROLL") {
      activity.periodExpense += amount;
      activity.salaryExpense += amount;
    } else if (payment.type === "EXPENSE") {
      activity.periodExpense += amount;
      if (isCogsPayment(payment)) {
        activity.cogsExpense += amount;
      } else {
        activity.operationalExpense += amount;
      }
    }
  }

  return activity;
}
