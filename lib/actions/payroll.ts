"use server";

import { endOfDay, startOfDay } from "date-fns";
import { revalidatePath } from "next/cache";
import type { PayrollStatus } from "@prisma/client";

import { auth } from "@/lib/auth";
import { isRoleAllowed } from "@/lib/authCheck";
import { prisma } from "@/lib/prisma";
import { serializeData } from "@/lib/utils";
import { calculateCommission, normalizeCommissionRate } from "@/lib/payroll/calculations";

export interface GeneratePayrollInput {
  employeeId: string;
  startDate: Date;
  endDate: Date;
  bonusAmount?: number;
  bonusNote?: string;
}

export interface PayrollDetail {
  workDays?: number;
  motorCount?: number;
  bonusNote?: string;
  salaryType?: string;
  monthlyRate?: number;
  commissionRate?: number;
  serviceRevenue?: number;
  feeItemIds?: string[];
  orderIds?: string[];
}

interface CommissionOrderSnapshot {
  id: string;
  items: unknown;
  mechanicId: string | null;
}

const PAYROLL_STATUSES = new Set<PayrollStatus>(["UNPAID", "PARTIAL", "PAID"]);

function serializePayroll<T>(payroll: T): unknown {
  return serializeData(payroll);
}

function calculateWorkDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    if (current.getDay() !== 0) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

function normalizePeriod(startDate: Date, endDate: Date) {
  const start = startOfDay(new Date(startDate));
  const end = endOfDay(new Date(endDate));

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Periode payroll tidak valid.");
  }
  if (start > end) {
    throw new Error("Tanggal mulai payroll tidak boleh melewati tanggal akhir.");
  }

  return { start, end };
}

function parsePayrollDetails(details?: string | null): PayrollDetail {
  if (!details) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(details);
    return parsed && typeof parsed === "object" ? (parsed as PayrollDetail) : {};
  } catch {
    return { bonusNote: details };
  }
}

function getPayrollStatus(totalEarned: number, totalPaid: number): PayrollStatus {
  if (totalPaid <= 0) {
    return "UNPAID";
  }
  if (totalPaid >= totalEarned) {
    return "PAID";
  }
  return "PARTIAL";
}

function toPayrollView(payroll: {
  id: string;
  employeeId: string;
  startDate: Date;
  endDate: Date;
  baseSalary: unknown;
  bonus: unknown;
  totalEarned: unknown;
  totalPaid: unknown;
  status: PayrollStatus;
  details: string | null;
  createdAt: Date;
  updatedAt: Date;
  employee: unknown;
  payments: unknown[];
}) {
  return {
    ...payroll,
    baseSalary: Number(payroll.baseSalary),
    bonus: Number(payroll.bonus),
    totalEarned: Number(payroll.totalEarned),
    totalPaid: Number(payroll.totalPaid),
    detailsParsed: parsePayrollDetails(payroll.details),
  };
}

async function createPayrollForEmployee(data: GeneratePayrollInput) {
  const { start, end } = normalizePeriod(data.startDate, data.endDate);
  const bonusAmount = Number(data.bonusAmount ?? 0);

  if (!Number.isFinite(bonusAmount) || bonusAmount < 0) {
    throw new Error("Bonus payroll harus berupa angka non-negatif.");
  }

  const existing = await prisma.payroll.findUnique({
    where: {
      employeeId_startDate_endDate: {
        employeeId: data.employeeId,
        startDate: start,
        endDate: end,
      },
    },
    include: { employee: true, payments: true },
  });

  if (existing) {
    return { payroll: existing, wasExisting: true };
  }

  const employee = await prisma.employee.findUnique({
    where: { id: data.employeeId },
  });

  if (!employee) {
    throw new Error("Karyawan tidak ditemukan.");
  }

  let baseSalary = 0;
  const details: PayrollDetail = { salaryType: employee.salaryType };

  if (employee.salaryType === "DAILY") {
    const workDays = calculateWorkDays(start, end);
    baseSalary = workDays * Number(employee.dailyRate);
    details.workDays = workDays;
  } else if (employee.salaryType === "MONTHLY") {
    baseSalary = Number(employee.monthlyRate);
    details.monthlyRate = baseSalary;
  } else {
    const completedOrders = await prisma.$queryRaw<CommissionOrderSnapshot[]>`
      SELECT orders."id", orders."items", orders."mechanicId"
      FROM "Order" AS orders
      WHERE orders."status" = 'COMPLETED'
        AND orders."paymentStatus" = 'PAID'
        AND orders."updatedAt" >= ${start}
        AND orders."updatedAt" <= ${end}
        AND (
          orders."mechanicId" = ${employee.id}
          OR orders."items" @> jsonb_build_array(
            jsonb_build_object('type', 'fee', 'employeeId', ${employee.id})
          )
        )
    `;

    let totalServiceRevenue = 0;
    let explicitFeeTotal = 0;
    let explicitFeeFound = false;
    const linkedOrderIds = new Set<string>();

    for (const order of completedOrders) {
      if (!Array.isArray(order.items)) {
        continue;
      }
      for (const item of order.items) {
        if (!item || typeof item !== "object") continue;

        // Only count unpaid fee items
        if (
          ('type' in item || 'itemType' in item) &&
          ["fee", "internal_fee"].includes(String(item.type || item.itemType).toLowerCase()) &&
          "employeeId" in item &&
          item.employeeId === employee.id &&
          !item.isPaid
        ) {
          const quantity = Number(item.qty ?? item.quantity ?? 1);
          const price = Number(item.price ?? item.unitPrice ?? 0);
          explicitFeeTotal += Number(item.totalPrice ?? quantity * price);
          explicitFeeFound = true;
          linkedOrderIds.add(order.id);
        }

        if (
          order.mechanicId === employee.id &&
          ('type' in item || 'itemType' in item) &&
          String(item.type || item.itemType).toLowerCase() === "service"
        ) {
          const quantity = Number(item.qty ?? item.quantity ?? 0);
          const price = Number(item.price ?? item.unitPrice ?? 0);
          totalServiceRevenue +=
            (Number.isFinite(quantity) ? quantity : 0) *
            (Number.isFinite(price) ? price : 0);
          linkedOrderIds.add(order.id);
        }
      }
    }

    if (explicitFeeFound) {
      baseSalary = explicitFeeTotal;
      details.motorCount = linkedOrderIds.size;
    } else {
      let ratePercent: number;
      try {
        ratePercent = normalizeCommissionRate(employee.commissionRate);
      } catch {
        throw new Error(`Rate komisi ${employee.name} harus berada pada rentang 0-100%.`);
      }

      baseSalary = calculateCommission(totalServiceRevenue, ratePercent);
      details.motorCount = linkedOrderIds.size;
      details.serviceRevenue = totalServiceRevenue;
    }

    details.orderIds = Array.from(linkedOrderIds);
    details.commissionRate = Number(employee.commissionRate);
  }

  if (!Number.isFinite(baseSalary) || baseSalary < 0) {
    throw new Error("Hasil kalkulasi gaji tidak valid.");
  }

  if (data.bonusNote?.trim()) {
    details.bonusNote = data.bonusNote.trim();
  }

  const totalEarned = baseSalary + bonusAmount;
  const payroll = await prisma.payroll.create({
    data: {
      employeeId: employee.id,
      startDate: start,
      endDate: end,
      salaryType: employee.salaryType,
      baseSalary,
      bonus: bonusAmount,
      totalEarned,
      totalPaid: 0,
      status: "UNPAID",
      details: JSON.stringify(details),
    },
    include: { employee: true, payments: true },
  });

  return { payroll, wasExisting: false };
}

export async function generatePayroll(data: GeneratePayrollInput) {
  try {
    const session = await auth();
    if (!session || !isRoleAllowed(session.user?.role, ["OWNER"])) {
      return { success: false, error: "Access denied: Only Owner can generate payroll." };
    }

    const result = await createPayrollForEmployee(data);
    revalidatePath("/admin/payroll");
    revalidatePath("/admin/employees/approval");

    return {
      success: true,
      payroll: serializePayroll(toPayrollView(result.payroll)),
      wasExisting: result.wasExisting,
    };
  } catch (error) {
    console.error("Generate payroll error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate payroll",
    };
  }
}

export async function getPayrolls(filters?: {
  employeeId?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  try {
    const session = await auth();
    if (!session || !isRoleAllowed(session.user?.role, ["OWNER", "ADMIN", "EMPLOYEE"])) {
      return { success: false, error: "Access denied." };
    }

    const isOwner = isRoleAllowed(session.user?.role, ["OWNER"]);
    const employeeId = isOwner ? filters?.employeeId : session.user?.employeeId ?? undefined;
    if (!isOwner && !employeeId) {
      return { success: true, payrolls: [] };
    }

    const status =
      filters?.status && PAYROLL_STATUSES.has(filters.status as PayrollStatus)
        ? (filters.status as PayrollStatus)
        : undefined;

    const payrolls = await prisma.payroll.findMany({
      where: {
        ...(employeeId && { employeeId }),
        ...(status && { status }),
        ...(filters?.dateFrom || filters?.dateTo
          ? {
              startDate: {
                ...(filters.dateFrom && { gte: startOfDay(filters.dateFrom) }),
                ...(filters.dateTo && { lte: endOfDay(filters.dateTo) }),
              },
            }
          : {}),
      },
      include: { employee: true, payments: { orderBy: { date: "asc" } } },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      payrolls: payrolls.map((payroll) => serializePayroll(toPayrollView(payroll))),
    };
  } catch (error) {
    console.error("Get payrolls error:", error);
    return { success: false, error: "Failed to load payroll list" };
  }
}

export async function getPayrollDetail(payrollId: string) {
  try {
    const session = await auth();
    if (!session || !isRoleAllowed(session.user?.role, ["OWNER", "ADMIN", "EMPLOYEE"])) {
      return { success: false, error: "Access denied." };
    }

    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
      include: { employee: true, payments: { orderBy: { date: "asc" } } },
    });

    if (!payroll) {
      return { success: false, error: "Payroll not found" };
    }

    const isOwner = isRoleAllowed(session.user?.role, ["OWNER"]);
    if (!isOwner && payroll.employeeId !== session.user?.employeeId) {
      return { success: false, error: "Access denied: You can only view your own payroll." };
    }

    return { success: true, payroll: serializePayroll(toPayrollView(payroll)) };
  } catch (error) {
    console.error("Get payroll detail error:", error);
    return { success: false, error: "Failed to load payroll details" };
  }
}

export async function updatePayroll(
  payrollId: string,
  updates: { bonusAmount?: number; bonusNote?: string }
) {
  try {
    const session = await auth();
    if (!session || !isRoleAllowed(session.user?.role, ["OWNER"])) {
      return { success: false, error: "Access denied: Only Owner can update payroll." };
    }

    const payroll = await prisma.payroll.findUnique({ where: { id: payrollId } });
    if (!payroll) {
      return { success: false, error: "Payroll not found" };
    }

    const bonus = Number(updates.bonusAmount ?? payroll.bonus);
    if (!Number.isFinite(bonus) || bonus < 0) {
      return { success: false, error: "Bonus harus berupa angka non-negatif." };
    }

    const totalEarned = Number(payroll.baseSalary) + bonus;
    const totalPaid = Number(payroll.totalPaid);
    if (totalEarned < totalPaid) {
      return { success: false, error: "Total gaji tidak boleh lebih kecil dari nominal yang sudah dibayar." };
    }

    const details = parsePayrollDetails(payroll.details);
    if (updates.bonusNote !== undefined) {
      const note = updates.bonusNote.trim();
      if (note) {
        details.bonusNote = note;
      } else {
        delete details.bonusNote;
      }
    }

    const updated = await prisma.payroll.update({
      where: { id: payrollId },
      data: {
        bonus,
        totalEarned,
        status: getPayrollStatus(totalEarned, totalPaid),
        details: JSON.stringify(details),
      },
      include: { employee: true, payments: { orderBy: { date: "asc" } } },
    });

    revalidatePath("/admin/payroll");
    revalidatePath("/admin/employees/approval");
    return { success: true, payroll: serializePayroll(toPayrollView(updated)) };
  } catch (error) {
    console.error("Update payroll error:", error);
    return { success: false, error: "Failed to update payroll" };
  }
}

export async function deletePayroll(payrollId: string) {
  try {
    const session = await auth();
    if (!session || !isRoleAllowed(session.user?.role, ["OWNER"])) {
      return { success: false, error: "Access denied: Only Owner can delete payroll." };
    }

    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
      select: { totalPaid: true, _count: { select: { payments: true } } },
    });
    if (!payroll) {
      return { success: false, error: "Payroll not found" };
    }
    if (Number(payroll.totalPaid) > 0 || payroll._count.payments > 0) {
      return { success: false, error: "Slip yang sudah memiliki pembayaran tidak dapat dihapus." };
    }

    await prisma.payroll.delete({ where: { id: payrollId } });
    revalidatePath("/admin/payroll");
    revalidatePath("/admin/employees/approval");
    return { success: true };
  } catch (error) {
    console.error("Delete payroll error:", error);
    return { success: false, error: "Failed to delete payroll" };
  }
}

export async function getEmployeeSummary(employeeId: string) {
  try {
    const session = await auth();
    if (!session || !isRoleAllowed(session.user?.role, ["OWNER"])) {
      return { success: false, error: "Access denied: Only Owner can access employee summary." };
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        orders: {
          where: { status: "COMPLETED" },
          select: { id: true, vehicle: true, totalPrice: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: 10,
        },
      },
    });
    if (!employee) {
      return { success: false, error: "Employee not found" };
    }

    const [totalCompleted, paidPayrolls] = await Promise.all([
      prisma.order.count({ where: { mechanicId: employeeId, status: "COMPLETED" } }),
      prisma.payroll.aggregate({
        where: { employeeId },
        _sum: { totalPaid: true },
      }),
    ]);

    return {
      success: true,
      employee: serializeData(employee),
      stats: {
        totalCompleted,
        totalEarned: Number(paidPayrolls._sum.totalPaid ?? 0),
      },
    };
  } catch (error) {
    console.error("Get employee summary error:", error);
    return { success: false, error: "Failed to load employee summary" };
  }
}

export async function bulkGeneratePayroll(startDate: Date, endDate: Date) {
  try {
    const session = await auth();
    if (!session || !isRoleAllowed(session.user?.role, ["OWNER"])) {
      return { success: false, error: "Access denied: Only Owner can generate payroll." };
    }

    normalizePeriod(startDate, endDate);
    const employees = await prisma.employee.findMany({
      where: {
        isActive: true,
        role: { notIn: ["Owner", "OWNER"] },
      },
      orderBy: { name: "asc" },
    });

    const results = [];
    for (const employee of employees) {
      const result = await createPayrollForEmployee({
        employeeId: employee.id,
        startDate,
        endDate,
      });
      results.push({
        employeeName: employee.name,
        payroll: serializePayroll(toPayrollView(result.payroll)),
        wasExisting: result.wasExisting,
      });
    }

    revalidatePath("/admin/payroll");
    revalidatePath("/admin/employees/approval");
    return { success: true, results };
  } catch (error) {
    console.error("Bulk generate payroll error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed bulk payroll generation",
    };
  }
}
