"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { isRoleAllowed } from "@/lib/authCheck";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";
import { createLog } from "./logs";
import { normalizeCommissionRate, calculateCommission } from "@/lib/payroll/calculations";
import type { SalaryType } from "@prisma/client";

// ==================== Types ====================
export interface CreateEmployeeInput {
  name: string;
  role: string;
  phone?: string;
  salaryType: SalaryType;
  dailyRate?: number;
  monthlyRate?: number;
  commissionRate?: number;
}

export interface UpdateEmployeeInput {
  id: string;
  name?: string;
  role?: string;
  phone?: string;
  salaryType?: SalaryType;
  dailyRate?: number;
  monthlyRate?: number;
  commissionRate?: number;
  isActive?: boolean;
}

interface CommissionOrderRecord {
  id: string;
  items: unknown;
  mechanicId: string | null;
  vehicle: string;
  plateNumber?: string | null;
  createdAt?: Date;
  status?: string;
}

interface EmbeddedOrderItem {
  [key: string]: unknown;
  id?: unknown;
  type?: unknown;
  itemType?: unknown;
  qty?: unknown;
  quantity?: unknown;
  price?: unknown;
  unitPrice?: unknown;
  totalPrice?: unknown;
  employeeId?: unknown;
  isPaid?: unknown;
}

function isEmbeddedOrderItem(value: unknown): value is EmbeddedOrderItem {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

// Infer TransactionClient strictly
type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

function validateSalaryRates(data: {
  dailyRate?: number;
  monthlyRate?: number;
  commissionRate?: number;
}): string | null {
  for (const [label, value] of [
    ["Rate harian", data.dailyRate],
    ["Rate bulanan", data.monthlyRate],
  ] as const) {
    if (value !== undefined && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
      return `${label} harus berupa angka non-negatif.`;
    }
  }

  if (
    data.commissionRate !== undefined &&
    (!Number.isFinite(Number(data.commissionRate)) ||
      Number(data.commissionRate) < 0 ||
      Number(data.commissionRate) > 100)
  ) {
    return "Rate komisi harus berada pada rentang 0-100%.";
  }

  return null;
}

function isPendingPayrollMigration(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return false;
  }
  return error.code === "P2021" || error.code === "P2022";
}

async function loadEmployeePayrolls(employee: {
  id: string;
  salaryType: SalaryType;
  dailyRate: unknown;
}) {
  try {
    const [rate, payrolls] = await Promise.all([
      prisma.employee.findUnique({
        where: { id: employee.id },
        select: { monthlyRate: true },
      }),
      prisma.payroll.findMany({
        where: { employeeId: employee.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          employeeId: true,
          startDate: true,
          endDate: true,
          salaryType: true,
          baseSalary: true,
          bonus: true,
          totalEarned: true,
          totalPaid: true,
          status: true,
          details: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      monthlyRate: Number(rate?.monthlyRate ?? 0),
      payrolls,
    };
  } catch (error) {
    if (!isPendingPayrollMigration(error)) {
      throw error;
    }

    // Transitional read path: keep the employee dashboard available while the
    // additive payroll migration is waiting for a controlled database deploy.
    const legacyPayments = await prisma.payment.findMany({
      where: { employeeId: employee.id, type: "PAYROLL" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        employeeId: true,
        date: true,
        amount: true,
        note: true,
        paymentMethod: true,
        createdAt: true,
      },
    });

    const monthlyRate = employee.salaryType === "MONTHLY" ? Number(employee.dailyRate) : 0;
    const payrolls = legacyPayments.map((payment) => {
      let details: Record<string, unknown> = {};
      if (payment.note) {
        try {
          const parsed: unknown = JSON.parse(payment.note);
          if (parsed && typeof parsed === "object") {
            details = parsed as Record<string, unknown>;
          }
        } catch {
          details = { bonusNote: payment.note };
        }
      }

      const paidAmount = Number(payment.amount);
      const parsedBonus = Number(details.bonus ?? 0);
      const bonus = Number.isFinite(parsedBonus) && parsedBonus >= 0 ? parsedBonus : 0;
      const parsedBase = Number(details.baseSalary);
      const reconstructedMonthlyBase =
        employee.salaryType === "MONTHLY" && paidAmount === 0 ? monthlyRate : paidAmount;
      const baseSalary = Number.isFinite(parsedBase) && parsedBase > 0
        ? parsedBase
        : reconstructedMonthlyBase;
      const parsedTotal = Number(details.totalEarned);
      const totalEarned = Number.isFinite(parsedTotal) && parsedTotal > 0
        ? parsedTotal
        : baseSalary + bonus;

      return {
        id: payment.id,
        employeeId: employee.id,
        startDate: details.startDate || payment.date,
        endDate: details.endDate || payment.date,
        salaryType: employee.salaryType,
        baseSalary,
        bonus,
        totalEarned,
        totalPaid: paidAmount,
        status: paidAmount <= 0 ? "UNPAID" : paidAmount >= totalEarned ? "PAID" : "PARTIAL",
        details: payment.note,
        createdAt: payment.createdAt,
        updatedAt: payment.createdAt,
      };
    });

    return { monthlyRate, payrolls };
  }
}

// Function to pay all pending commissions for an employee
/**
 * Pay ALL pending commissions for a single employee.
 * 
 * Process:
 * 1. Calculate total unpaid commissions.
 * 2. Mark all related fees as 'PAID'.
 * 3. Create Payment record (PAYROLL / Money Out).
 * 
 * @param {string} employeeId - Employee ID.
 * @param {'CASH' | 'TRANSFER'} paymentMethod - Payment method.
 * @param {string} note - Additional notes.
 * @returns {Object} Payment result (count, total amount).
 */
export async function payAllCommissions(employeeId: string, paymentMethod: "CASH" | "TRANSFER" = "CASH", note?: string) {
  try {
    const session = await auth();
    if (!session || !isRoleAllowed(session.user?.role, ["OWNER"])) {
      return { success: false, error: "Access denied: Only Owner can pay commissions." };
    }
    console.log(`[PAY_COMMISSION] Starting payment for employee ${employeeId}`);

    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      // 1. Get Employee
      const employee = await tx.employee.findUnique({
        where: { id: employeeId }
      });
      if (!employee) {
        throw new Error("Employee not found");
      }

      let rate = 0;
      try {
        rate = normalizeCommissionRate(employee.commissionRate);
      } catch {
        rate = 0;
      }

      // 2. Query completed & paid orders
      const completedOrders = await tx.$queryRaw<CommissionOrderRecord[]>`
        SELECT
          orders."id",
          orders."items",
          orders."mechanicId",
          orders."vehicle"
        FROM "Order" AS orders
        WHERE orders."status" = 'COMPLETED'
          AND orders."paymentStatus" = 'PAID'
          AND (
            orders."mechanicId" = ${employeeId}
            OR orders."items" @> jsonb_build_array(
              jsonb_build_object('type', 'fee', 'employeeId', ${employeeId})
            )
          )
      `;

      let totalAmount = 0;
      let paidOrdersCount = 0;

      for (const o of completedOrders) {
        const rawItems = Array.isArray(o.items) ? [...o.items] : [];
        let orderModified = false;
        let foundExplicitFee = false;

        const updatedItems = rawItems.map((it: any) => {
          if (
            it && typeof it === 'object' &&
            String(it.type || '').toLowerCase() === 'fee' &&
            it.employeeId === employeeId
          ) {
            foundExplicitFee = true;
            if (!it.isPaid) {
              const feePrice = Number(it.price || 0);
              if (feePrice > 0) {
                totalAmount += feePrice;
                orderModified = true;
                return { ...it, isPaid: true };
              }
            }
          }
          return it;
        });

        if (!foundExplicitFee && o.mechanicId === employeeId && rate > 0) {
          let serviceRevenue = 0;
          rawItems.forEach((it: any) => {
            if (it && typeof it === 'object' && String(it.type || '').toLowerCase() === 'service') {
              serviceRevenue += Number(it.qty || 1) * Number(it.price || 0);
            }
          });
          const feeAmount = calculateCommission(serviceRevenue, rate);
          if (feeAmount > 0) {
            totalAmount += feeAmount;
            orderModified = true;
            updatedItems.push({
              name: `Komisi ${rate}%: ${employee.name}`,
              qty: 1,
              price: feeAmount,
              type: 'fee',
              employeeId: employee.id,
              employeeName: employee.name,
              isPaid: true,
            });
          }
        }

        if (orderModified) {
          paidOrdersCount++;
          await tx.order.update({
            where: { id: o.id },
            data: { items: updatedItems as any },
          });
        }
      }

      if (totalAmount <= 0) {
        return { success: false, error: "Tidak ada komisi yang perlu dibayar." };
      }

      console.log(`[PAY_COMMISSION] Total commission to pay: ${totalAmount} across ${paidOrdersCount} orders`);

      // 3. Create Payment Record
      const payment = await tx.payment.create({
        data: {
          type: 'PAYROLL',
          amount: totalAmount,
          employeeId: employeeId,
          paymentMethod: paymentMethod,
          note: note || `Pencairan Komisi ${employee.name} (${paidOrdersCount} order)`,
        }
      });

      return { success: true, count: paidOrdersCount, amount: totalAmount };
    }, {
      maxWait: 5000,
      timeout: 15000,
    });

    revalidatePath('/admin/employees');
    revalidatePath('/admin/reports');
    
    return result;

  } catch (error: unknown) {
    console.error("[PAY_COMMISSION] Error:", error);
    const message = error instanceof Error ? error.message : "Gagal memproses komisi";
    return { success: false, error: message };
  }
}

// Function to pay specific commission (single item)
/**
 * Pay a specific single commission item.
 * 
 * @param {string} feeId - OrderFee ID to pay.
 * @param {'CASH' | 'TRANSFER'} paymentMethod - Payment method.
 * @param {string} note - Notes.
 * @returns {Object} Paid fee record.
 */
export async function payCommission(feeId: string, paymentMethod: "CASH" | "TRANSFER" = "CASH", note?: string) {
  try {
    const session = await auth();
    if (!session || !isRoleAllowed(session.user?.role, ['OWNER'])) {
      return { success: false, error: 'Access denied: Only Owner can process commission payments.' };
    }

    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      const compoundFeeMatch = feeId.match(/^(.*)-fee-(\d+)$/);
      const isSyntheticCommission = feeId.endsWith("-commission");
      let targetOrderId = compoundFeeMatch?.[1]
        ?? (isSyntheticCommission ? feeId.slice(0, -"-commission".length) : "");
      const targetItemIndex = compoundFeeMatch ? Number(compoundFeeMatch[2]) : null;

      // Migrated OrderItem IDs remain valid API inputs even though the relation
      // no longer exists: locate the JSON element by its embedded legacy ID.
      if (!targetOrderId) {
        const matchingOrders = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT orders."id"
          FROM "Order" AS orders
          WHERE orders."items" @> jsonb_build_array(
            jsonb_build_object('id', ${feeId})
          )
          LIMIT 2
        `;
        if (matchingOrders.length !== 1) {
          throw new Error("Komisi tidak ditemukan atau ID komisi tidak unik.");
        }
        targetOrderId = matchingOrders[0].id;
      }

      const order = await tx.order.findUnique({
        where: { id: targetOrderId },
        select: {
          id: true,
          items: true,
          status: true,
          paymentStatus: true,
          vehicle: true,
          mechanicId: true,
          mechanic: {
            select: { id: true, name: true, commissionRate: true },
          },
        }
      });
      if (!order) {
        throw new Error("Order tidak ditemukan");
      }
      if (order.status !== 'COMPLETED' || order.paymentStatus !== 'PAID') {
        throw new Error("Komisi hanya dapat dicairkan jika order selesai dan lunas.");
      }

      const rawItems = Array.isArray(order.items) ? [...order.items] : [];
      let paidFeeAmount = 0;
      let targetEmpId = "";

      const updatedItems = rawItems.map((candidate, idx: number) => {
        if (!isEmbeddedOrderItem(candidate)) {
          return candidate;
        }
        const item: EmbeddedOrderItem = candidate;
        const isTarget = targetItemIndex !== null
          ? idx === targetItemIndex
          : item.id === feeId;
        if (
          ['fee', 'internal_fee'].includes(String(item.type || item.itemType || '').toLowerCase()) &&
          isTarget
        ) {
          if (!item.isPaid) {
            const quantity = Number(item.qty ?? item.quantity ?? 1);
            const price = Number(item.price ?? item.unitPrice ?? 0);
            paidFeeAmount = Number(item.totalPrice ?? quantity * price);
            targetEmpId = String(item.employeeId || '');
            return { ...item, isPaid: true };
          }
        }
        return item;
      });

      if (isSyntheticCommission) {
        if (!order.mechanic) {
          throw new Error("Mekanik order tidak ditemukan.");
        }
        const alreadyHasFee = rawItems.some(
          (it) =>
            isEmbeddedOrderItem(it) &&
            ['fee', 'internal_fee'].includes(String(it.type || it.itemType || '').toLowerCase()) &&
            it.employeeId === order.mechanicId
        );
        if (alreadyHasFee) {
          throw new Error("Data komisi telah berubah. Muat ulang halaman sebelum membayar.");
        }

        const serviceRevenue = rawItems.reduce((sum: number, it) => {
          if (!isEmbeddedOrderItem(it) || String(it.type || it.itemType || '').toLowerCase() !== 'service') {
            return sum;
          }
          return sum + Number(it.qty ?? it.quantity ?? 1) * Number(it.price ?? it.unitPrice ?? 0);
        }, 0);
        const rate = normalizeCommissionRate(order.mechanic.commissionRate);
        paidFeeAmount = calculateCommission(serviceRevenue, rate);
        targetEmpId = order.mechanic.id;
        if (paidFeeAmount > 0) {
          updatedItems.push({
            id: crypto.randomUUID(),
            name: `Komisi ${rate}%: ${order.mechanic.name}`,
            qty: 1,
            price: paidFeeAmount,
            totalPrice: paidFeeAmount,
            type: 'fee',
            employeeId: targetEmpId,
            employeeName: order.mechanic.name,
            isPaid: true,
          });
        }
      }

      if (!Number.isFinite(paidFeeAmount) || paidFeeAmount <= 0 || !targetEmpId) {
        throw new Error("Komisi pada order ini sudah lunas atau tidak valid.");
      }

      await tx.order.update({
        where: { id: order.id },
        data: { items: updatedItems as any },
      });

      const payment = await tx.payment.create({
        data: {
          type: 'PAYROLL',
          amount: paidFeeAmount,
          employeeId: targetEmpId || undefined,
          orderId: order.id,
          paymentMethod: paymentMethod,
          note: note || `Pencairan Komisi Order #${order.vehicle || order.id.slice(-6)}`,
        }
      });

      return { success: true, amount: paidFeeAmount, paymentId: payment.id };
    }, {
      maxWait: 5000,
      timeout: 15000,
      isolationLevel: 'Serializable',
    });

    revalidatePath('/admin/employees');
    revalidatePath('/admin/reports');
    return result;
  } catch (error: unknown) {
    console.error("[PAY_ONE_COMMISSION] Error:", error);
    const message = error instanceof Error ? error.message : "Gagal memproses komisi";
    return { success: false, error: message };
  }
}

// ==================== Helper: Serialize Employee ====================
function serializeEmployee(employee: unknown): any {
  if (!employee) {
    return null;
  }
  return serializeData(employee);
}

// ==================== Get All Employees ====================
/**
 * Fetch all employees list.
 * Includes count of orders, unpaid commissions, etc.
 * 
 * @param {boolean} activeOnly - If true, only fetches active employees.
 * @returns {Object} List of employees.
 */
export async function getEmployees(activeOnly: boolean = false) {
  try {
    const session = await auth();
    if (!session || !isRoleAllowed(session.user?.role, ['OWNER', 'ADMIN'])) {
      return { success: false, error: 'Access denied: Only Owner and Admin have access.' };
    }
    const employees = await prisma.employee.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        role: true,
        phone: true,
        salaryType: true,
        dailyRate: true,
        commissionRate: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    let monthlyRateByEmployee = new Map<string, number>();
    try {
      const monthlyRates = await prisma.employee.findMany({
        where: { id: { in: employees.map((employee) => employee.id) } },
        select: { id: true, monthlyRate: true },
      });
      monthlyRateByEmployee = new Map(
        monthlyRates.map((employee) => [employee.id, Number(employee.monthlyRate)])
      );
    } catch (error) {
      if (!isPendingPayrollMigration(error)) {
        throw error;
      }
    }

    const [pendingPayrolls, completedOrders] = await Promise.all([
      prisma.payroll.findMany({
        where: {
          status: { in: ['UNPAID', 'PARTIAL'] },
          employeeId: { in: employees.map((e) => e.id) },
        },
        select: { employeeId: true, totalEarned: true, totalPaid: true, details: true }
      }),
      prisma.order.findMany({
        where: {
          status: 'COMPLETED',
          paymentStatus: 'PAID',
        },
        select: { id: true, mechanicId: true, items: true }
      }),
    ]);

    const unpaidByEmp = new Map<string, number>();
    const payrollOrderIdsByEmp = new Map<string, Set<string>>();
    pendingPayrolls.forEach((p) => {
      const cur = unpaidByEmp.get(p.employeeId) || 0;
      unpaidByEmp.set(p.employeeId, cur + (Number(p.totalEarned) - Number(p.totalPaid)));
      if (p.details) {
        try {
          const details = JSON.parse(p.details) as { orderIds?: unknown };
          if (Array.isArray(details.orderIds)) {
            const linkedOrders = payrollOrderIdsByEmp.get(p.employeeId) || new Set<string>();
            details.orderIds.forEach((orderId) => {
              if (typeof orderId === 'string') {
                linkedOrders.add(orderId);
              }
            });
            payrollOrderIdsByEmp.set(p.employeeId, linkedOrders);
          }
        } catch {
          // Legacy payroll details may be plain text.
        }
      }
    });

    completedOrders.forEach((o) => {
      const rawItems = Array.isArray(o.items) ? o.items : [];
      rawItems.forEach((it: any) => {
        if (
          it && typeof it === 'object' &&
          ['fee', 'internal_fee'].includes(String(it.type || it.itemType || '').toLowerCase()) &&
          it.employeeId &&
          !it.isPaid &&
          !payrollOrderIdsByEmp.get(it.employeeId)?.has(o.id)
        ) {
          const cur = unpaidByEmp.get(it.employeeId) || 0;
          unpaidByEmp.set(it.employeeId, cur + Number(it.price || 0));
        }
      });
    });

    const employeesWithUnpaid = employees.map((emp) => {
      return {
        ...emp,
        monthlyRate: monthlyRateByEmployee.get(emp.id) ??
          (emp.salaryType === "MONTHLY" ? Number(emp.dailyRate) : 0),
        unpaidAmount: unpaidByEmp.get(emp.id) || 0,
      };
    });

    const employeesWithNumber = employeesWithUnpaid.map(serializeEmployee);

    return { success: true, employees: employeesWithNumber };
  } catch (error) {
    console.error('Get employees error:', error);
    return { success: false, error: 'Gagal load data karyawan' };
  }
}

// ==================== Get Mechanics Only ====================
/**
 * Fetch employees working specifically as Mechanics.
 * Used for mechanic selection dropdown in Order creation.
 * 
 * @returns {Object} List of mechanics.
 */
export async function getMechanics() {
  try {
    const session = await auth();
    if (!session || !isRoleAllowed(session.user?.role, ['OWNER', 'ADMIN'])) {
      return { success: false, error: 'Access denied: Only Owner and Admin have access.' };
    }
    const mechanics = await prisma.employee.findMany({
      where: { 
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        role: true,
        commissionRate: true,
      },
      orderBy: { name: 'asc' },
    });

    const mechanicsWithNumber = mechanics.map((m) => serializeData(m));

    return { success: true, mechanics: mechanicsWithNumber };
  } catch (error) {
    console.error('Get mechanics error:', error);
    return { success: false, error: 'Gagal load data karyawan' };
  }
}

// ==================== Get Employee Dashboard Stats ====================
/**
 * Summary stats for Employee Dashboard.
 * Calculates total pending commissions, working vs standby mechanics.
 * 
 * @returns {Object} Employee statistics.
 */
export async function getEmployeeStats() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Access denied: Only Owner has access.' };
    }
    const [pendingPayrolls, activeOrders, totalMechanics] = await Promise.all([
      prisma.payroll.findMany({
        where: { status: { in: ['UNPAID', 'PARTIAL'] } },
        select: { totalEarned: true, totalPaid: true }
      }),
      prisma.order.findMany({
        where: { status: 'IN_PROGRESS' },
        select: { mechanicId: true },
        distinct: ['mechanicId']
      }),
      prisma.employee.count({
        where: { 
          isActive: true,
          role: { in: ['Mekanik', 'MEKANIK', 'Mechanic', 'Karyawan'] }
        }
      })
    ]);

    const totalUnpaid = pendingPayrolls.reduce((sum: number, p: any) => sum + (Number(p.totalEarned) - Number(p.totalPaid)), 0);
    const workingCount = activeOrders.filter((o: any) => o.mechanicId).length;
    const standbyCount = Math.max(0, totalMechanics - workingCount);
    
    return {
      success: true,
      stats: {
        totalUnpaid,
        unpaidCount: pendingPayrolls.length,
        workingMechanics: workingCount,
        standbyMechanics: standbyCount,
        totalMechanics
      }
    };
  } catch (error) {
    console.error('Get stats error:', error);
    return { success: false, error: 'Gagal load statistik' };
  }
}

export async function getEmployeeDetail(id: string) {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, error: 'Invalid session.' };
    }
    const hasAdminAccess = isRoleAllowed(session.user?.role, ['OWNER', 'ADMIN']);
    const isSelf = session.user?.employeeId === id;
    if (!hasAdminAccess && !isSelf) {
      return { success: false, error: 'Access denied: You do not have authorization to view this employee data.' };
    }
    const [employee, employeeOrders, employeePayments] = await Promise.all([
      prisma.employee.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          role: true,
          phone: true,
          salaryType: true,
          dailyRate: true,
          commissionRate: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.$queryRaw<CommissionOrderRecord[]>`
        SELECT
          orders."id",
          orders."status"::text AS "status",
          orders."createdAt",
          orders."items",
          orders."vehicle",
          orders."plateNumber",
          orders."mechanicId"
        FROM "Order" AS orders
        WHERE orders."status" = 'COMPLETED'
          AND (
            orders."mechanicId" = ${id}
            OR orders."items" @> jsonb_build_array(
              jsonb_build_object('type', 'fee', 'employeeId', ${id})
            )
          )
        ORDER BY orders."createdAt" DESC
      `,
      prisma.payment.findMany({
        where: { employeeId: id, type: 'PAYROLL' },
        select: { amount: true },
      })
    ]);

    if (!employee) {
      return { success: false, error: 'Employee not found' };
    }

    const payrollData = await loadEmployeePayrolls(employee);

    const [activeOrder, queueOrders] = await Promise.all([
      prisma.order.findFirst({
        where: {
          mechanicId: id,
          status: { in: ['IN_PROGRESS', 'READY'] } 
        },
        select: {
          id: true,
          custName: true,
          vehicle: true,
          plateNumber: true,
          items: true,
          createdAt: true,
          status: true
        }
      }),
      prisma.order.findMany({
        where: {
          mechanicId: id,
          status: { in: ['PENDING', 'QUEUE', 'CONFIRMED', 'ESTIMATED'] } // Catch all pre-work statuses
        },
        orderBy: { createdAt: 'asc' }, // FIFO queue
        select: {
          id: true,
          custName: true,
          vehicle: true,
          plateNumber: true,
          items: true,
          createdAt: true,
          status: true
        }
      })
    ]);

    console.log(`[DEBUG] Employee ${id}: Found active=${activeOrder?.id} (${activeOrder?.status}), queue=${queueOrders.length}`);

    let rate = 0;
    try {
      rate = normalizeCommissionRate(employee.commissionRate);
    } catch {
      rate = 0;
    }

    const orderFees: any[] = [];
    const completedOrdersForEmp: any[] = [];

    employeeOrders.forEach((o: any) => {
      if (o.status !== 'COMPLETED') return;
      const rawItems = Array.isArray(o.items) ? o.items : [];
      let empHasFee = false;

      // 1. Check explicit fee items in JSON
      rawItems.forEach((it: any, idx: number) => {
        if (
          it && typeof it === 'object' &&
          String(it.type || '').toLowerCase() === 'fee' &&
          it.employeeId === id
        ) {
          empHasFee = true;
          orderFees.push({
            id: `${o.id}-fee-${idx}`,
            createdAt: o.createdAt,
            order: {
              vehicle: o.vehicle,
              plateNumber: o.plateNumber,
            },
            description: it.name || `Komisi Order #${o.id.slice(-6)}`,
            amount: Number(it.price || 0),
            isPaid: Boolean(it.isPaid),
          });
        }
      });

      // 2. If no explicit fee item was recorded, but this employee was the lead mechanic
      if (!empHasFee && o.mechanicId === id && rate > 0) {
        let serviceRevenue = 0;
        rawItems.forEach((it: any) => {
          if (it && typeof it === 'object' && String(it.type || '').toLowerCase() === 'service') {
            serviceRevenue += Number(it.qty || 1) * Number(it.price || 0);
          }
        });
        const feeAmount = calculateCommission(serviceRevenue, rate);
        if (feeAmount > 0) {
          empHasFee = true;
          orderFees.push({
            id: `${o.id}-commission`,
            createdAt: o.createdAt,
            order: {
              vehicle: o.vehicle,
              plateNumber: o.plateNumber,
            },
            description: `Komisi (${rate}%): Jasa Servis`,
            amount: feeAmount,
            isPaid: false,
          });
        }
      }

      if (empHasFee || o.mechanicId === id) {
        completedOrdersForEmp.push(o);
      }
    });

    const totalEarned = orderFees.reduce((sum, f) => sum + f.amount, 0);
    const totalPaid = employeePayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const totalUnpaid = Math.max(0, totalEarned - totalPaid);

    // Attribute payments to older fees if isPaid flag was not explicitly saved
    let remainingPaid = totalPaid;
    orderFees.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    orderFees.forEach((fee) => {
      if (fee.isPaid) {
        remainingPaid = Math.max(0, remainingPaid - fee.amount);
      } else if (remainingPaid >= fee.amount) {
        fee.isPaid = true;
        remainingPaid -= fee.amount;
      }
    });
    // Display newest first, maximum 20 items
    orderFees.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const displayFees = orderFees.slice(0, 20);

    const serializedEmployee = serializeData({
      ...employee,
      monthlyRate: payrollData.monthlyRate,
      payrolls: payrollData.payrolls,
    });
    const serialized = {
      ...serializedEmployee,
      orderFees: displayFees,
      stats: {
        totalEarned,
        totalPaid,
        totalUnpaid,
        taskCount: completedOrdersForEmp.length
      },
      activeOrder: serializeData(activeOrder),
      queueOrders: serializeData(queueOrders),
    };

    return { success: true, employee: serialized };
  } catch (error) {
    console.error('Get employee detail error:', error);
    return { success: false, error: 'Gagal load detail karyawan' };
  }
}

// ==================== Create Employee ====================
/**
 * Create a new employee record.
 * 
 * @param {CreateEmployeeInput} data - New employee data.
 * @returns {Object} Created employee record.
 */
export async function createEmployee(data: CreateEmployeeInput) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Access denied: Only Owner can add employees.' };
    }
    const validationError = validateSalaryRates(data);
    if (validationError) {
      return { success: false, error: validationError };
    }
    const employee = await prisma.employee.create({
      data: {
        name: data.name,
        role: data.role,
        phone: data.phone,
        salaryType: data.salaryType,
        dailyRate: data.dailyRate || 0,
        monthlyRate: data.monthlyRate || 0,
        commissionRate: data.commissionRate || 0,
        isActive: true,
      },
    });

    revalidatePath('/admin/employees');
    
    await createLog({
        action: "CREATE_EMPLOYEE",
        title: "Employee Added",
        details: `Employee ${data.name} (${data.role}) added to system`,
        metadata: { employeeId: employee.id },
        userName: "Admin",
        role: "ADMIN"
      });
    
    return { success: true, employee: serializeEmployee(employee) };
  } catch (error) {
    console.error('Create employee error:', error);
    return { success: false, error: 'Gagal tambah karyawan' };
  }
}

// ==================== Update Employee ====================
/**
 * Update employee record details.
 * 
 * @param {UpdateEmployeeInput} data - Update data payload.
 * @returns {Object} Updated employee record.
 */
export async function updateEmployee(data: UpdateEmployeeInput) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Access denied: Only Owner can update employee data.' };
    }
    const validationError = validateSalaryRates(data);
    if (validationError) {
      return { success: false, error: validationError };
    }
    const { id, salaryType, dailyRate, monthlyRate, commissionRate, ...rest } = data;
    
    const updateData: Record<string, unknown> = { ...rest };
    if (salaryType) {
      updateData.salaryType = salaryType;
    }
    if (dailyRate !== undefined) {
      updateData.dailyRate = dailyRate;
    }
    if (monthlyRate !== undefined) {
      updateData.monthlyRate = monthlyRate;
    }
    if (commissionRate !== undefined) {
      updateData.commissionRate = commissionRate;
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/admin/employees');
    
    await createLog({
        action: "UPDATE_EMPLOYEE",
        title: "Employee Updated",
        details: `Employee details updated for ${employee.name}`,
        metadata: { employeeId: employee.id },
        userName: "Admin",
        role: "ADMIN"
      });
    
    return { success: true, employee: serializeEmployee(employee) };
  } catch (error) {
    console.error('Update employee error:', error);
    return { success: false, error: 'Gagal update karyawan' };
  }
}

// ==================== Delete/Deactivate Employee ====================
/**
 * Deactivate an employee (Soft Delete).
 * Employee will not appear in selection dropdowns, but history is retained.
 * 
 * @param {string} id - Employee ID.
 * @returns {Object} Success response.
 */
export async function deactivateEmployee(id: string) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Access denied: Only Owner can deactivate employees.' };
    }
    const employee = await prisma.employee.update({
      where: { id },
      data: { isActive: false },
    });

    revalidatePath('/admin/employees');
    
    await createLog({
        action: "DEACTIVATE_EMPLOYEE",
        title: "Employee Deactivated",
        details: `Employee ${employee.name} deactivated`,
        metadata: { employeeId: employee.id },
        userName: "Admin",
        role: "ADMIN"
      });
    
    return { success: true, employee: serializeEmployee(employee) };
  } catch (error) {
    console.error('Deactivate employee error:', error);
    return { success: false, error: 'Gagal nonaktifkan karyawan' };
  }
}

// ==================== Reactivate Employee ====================
/**
 * Reactivate a deactivated employee.
 * 
 * @param {string} id - Employee ID.
 * @returns {Object} Success response.
 */
export async function reactivateEmployee(id: string) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'OWNER') {
      return { success: false, error: 'Access denied: Only Owner can reactivate employees.' };
    }
    const employee = await prisma.employee.update({
      where: { id },
      data: { isActive: true },
    });

    revalidatePath('/admin/employees');
    
    await createLog({
        action: "REACTIVATE_EMPLOYEE",
        title: "Employee Reactivated",
        details: `Employee ${employee.name} reactivated`,
        metadata: { employeeId: employee.id },
        userName: "Admin",
        role: "ADMIN"
      });
    
    return { success: true, employee: serializeEmployee(employee) };
  } catch (error) {
    console.error('Reactivate employee error:', error);
    return { success: false, error: 'Gagal aktifkan karyawan' };
  }
}
